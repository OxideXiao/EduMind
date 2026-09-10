"""Heartbeat服务 — 定时扫描学情，生成提醒，更新记忆"""
import json
from datetime import date
from chains.heartbeat import build_fallback_reminder, build_reminder_chain, parse_reminder_output
from chains.memory import build_memory_update_chain, parse_memory_output
from services.spring_client import spring_client
from utils.logger import logger


class HeartbeatService:
    def __init__(self):
        self.reminder_chain = None
        self.memory_chain = None

    async def run_heartbeat(self, course_id: int = None) -> dict:
        """执行完整Heartbeat流程"""
        today = date.today().isoformat()
        logger.info(f"=== Heartbeat 开始执行: {today} ===")

        # Step 1: 拉取当日学情数据
        analytics = await spring_client.get_daily_analytics(course_id, today)
        students = analytics.get("students", [])
        logger.info(f"获取到 {len(students)} 名学生的学情数据")

        results = []
        for student in students:
            try:
                cid = course_id or analytics.get("course_id")
                result = await self._process_student(student, today, cid)
                results.append(result)
            except Exception as e:
                logger.error(f"处理学生 {student.get('student_id')} 失败: {e}")
                continue

        success_count = sum(1 for r in results if r.get("success"))
        logger.info(f"=== Heartbeat 完成: {success_count}/{len(students)} 成功 ===")
        return {
            "date": today,
            "total": len(students),
            "success": success_count,
            "details": results,
        }

    async def _process_student(self, student: dict, today: str, course_id: int = None) -> dict:
        """处理单个学生的Heartbeat"""
        sid = student["student_id"]
        sname = student["student_name"]

        # Step 2a: 获取当前记忆
        current_memory = await spring_client.get_student_memory(sid, course_id)

        # Step 2b: LLM生成提醒
        weak_points = [
            k for k, v in student.get("knowledge_mastery", {}).items() if v < 0.5
        ]
        reminder_input = {
            "student_name": sname,
            "completion_rate": f"{student.get('completion_rate', 0):.0%}",
            "active_days": student.get("active_days_this_week", 0),
            "at_risk": "是" if student.get("at_risk") else "否",
            "weak_points": weak_points if weak_points else ["无"],
            "memory_json": current_memory,
        }
        try:
            reminder_result = await self._get_reminder_chain().ainvoke(reminder_input)
            reminder_data = parse_reminder_output(reminder_result)
        except Exception as exc:
            logger.warning(f"学生 {sid} LLM提醒生成失败，使用规则降级提醒: {exc}")
            reminder_data = build_fallback_reminder(
                student_name=sname,
                completion_rate=student.get("completion_rate", 0),
                active_days=student.get("active_days_this_week", 0),
                at_risk=student.get("at_risk", False),
                weak_points=weak_points,
                memory_json=current_memory,
            )

        # Step 2c: LLM更新记忆
        try:
            memory_result = await self._get_memory_chain().ainvoke({
                "current_memory_json": current_memory,
                "today_activities": self._build_activity_summary(student),
                "knowledge_changes": str(student.get("knowledge_mastery", {})),
            })
            new_memory = parse_memory_output(memory_result)
        except Exception as exc:
            logger.warning(f"学生 {sid} 记忆更新失败，使用规则降级记忆: {exc}")
            new_memory = self._build_fallback_memory(current_memory, student, today)

        # Step 2d: 写入通知
        await spring_client.create_notification(
            student_id=sid,
            title=reminder_data.get("title", "学习提醒"),
            content=reminder_data.get("content", ""),
            priority=reminder_data.get("priority", "NORMAL"),
            course_id=course_id,
        )

        # Step 2e: 更新记忆
        await spring_client.update_student_memory(sid, new_memory, course_id)

        return {"student_id": sid, "success": True, "reminder": reminder_data}

    def _build_activity_summary(self, student: dict) -> str:
        """把学情数据转成自然语言摘要供LLM使用"""
        return (
            f"完成率{student.get('completion_rate', 0):.0%}，"
            f"本周活跃{student.get('active_days_this_week', 0)}天，"
            f"测验均分{student.get('quiz_avg_score', 0)}，"
            f"风险状态={'是' if student.get('at_risk') else '否'}，"
            f"掌握度: {student.get('knowledge_mastery', {})}"
        )

    def _build_fallback_memory(self, current_memory: str, student: dict, today: str) -> dict:
        """LLM记忆更新失败时，保持结构完整并写入当天摘要。"""
        try:
            memory = json.loads(current_memory) if isinstance(current_memory, str) else current_memory
            if not isinstance(memory, dict):
                memory = {}
        except json.JSONDecodeError:
            memory = {}

        mastery = student.get("knowledge_mastery", {})
        weak_points = [k for k, v in mastery.items() if v < 0.5]
        strengths = [k for k, v in mastery.items() if v >= 0.75]
        behavior_notes = memory.get("behavior_notes", [])
        if not isinstance(behavior_notes, list):
            behavior_notes = []
        behavior_notes = ([self._build_activity_summary(student)] + behavior_notes)[:3]

        return {
            "version": int(memory.get("version", 0)) + 1,
            "last_updated": today,
            "summary": f"{student.get('student_name', '学生')}当前完成率{student.get('completion_rate', 0):.0%}",
            "knowledge_mastery_trend": {
                name: {"current": score, "trend": "stable"}
                for name, score in mastery.items()
            },
            "weak_points": weak_points,
            "strengths": strengths,
            "learning_style_note": memory.get("learning_style_note", ""),
            "behavior_notes": behavior_notes,
            "suggested_focus": "、".join(weak_points[:2]) if weak_points else "保持当前学习节奏",
        }

    def _get_reminder_chain(self):
        if self.reminder_chain is None:
            self.reminder_chain = build_reminder_chain()
        return self.reminder_chain

    def _get_memory_chain(self):
        if self.memory_chain is None:
            self.memory_chain = build_memory_update_chain()
        return self.memory_chain


# 全局单例
heartbeat_service = HeartbeatService()
