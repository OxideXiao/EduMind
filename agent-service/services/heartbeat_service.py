"""Heartbeat服务 — 定时扫描学情，生成提醒，更新记忆"""
import json
from datetime import date
from chains.heartbeat import build_reminder_chain, parse_reminder_output
from chains.memory import build_memory_update_chain, parse_memory_output
from services.spring_client import spring_client
from utils.logger import logger


class HeartbeatService:
    def __init__(self):
        self.reminder_chain = build_reminder_chain()
        self.memory_chain = build_memory_update_chain()

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
        reminder_result = await self.reminder_chain.ainvoke(reminder_input)
        reminder_data = parse_reminder_output(reminder_result)

        # Step 2c: LLM更新记忆
        memory_result = await self.memory_chain.ainvoke({
            "current_memory_json": current_memory,
            "today_activities": self._build_activity_summary(student),
            "knowledge_changes": str(student.get("knowledge_mastery", {})),
        })
        new_memory = parse_memory_output(memory_result)

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


# 全局单例
heartbeat_service = HeartbeatService()
