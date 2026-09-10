"""学习计划服务 — 生成个性化学习计划并保存"""
import json
from datetime import datetime
from typing import Optional

from chains.learning_plan import build_learning_plan_chain, parse_plan_output
from services.spring_client import spring_client
from utils.logger import logger


class LearningPlanService:
    def __init__(self):
        self.chain = None

    async def generate_plan(
        self,
        student_id: int,
        student_name: str,
        course_id: int,
        course_name: str,
        knowledge_mastery: dict,
        memory_json: Optional[str] = None,
        quiz_summary: str = "",
        behavior_summary: str = "",
        resource_candidates: Optional[list] = None,
        resource_completion_note: str = "资源完成率暂未接入完整统计",
    ) -> dict:
        """生成学习计划并保存到后端"""
        # Step 1: 获取学生记忆
        if not memory_json or memory_json == "{}":
            memory_json = await spring_client.get_student_memory(student_id, course_id)

        # Step 2: LLM生成计划
        try:
            raw_result = await self._get_chain().ainvoke({
                "student_name": student_name,
                "course_name": course_name,
                "knowledge_mastery": self._format_mastery(knowledge_mastery),
                "quiz_summary": quiz_summary or "暂无单独测验摘要，按当前掌握度和学习记忆生成计划",
                "behavior_summary": behavior_summary or "暂无单独行为摘要，按当前学情统计生成计划",
                "resource_candidates": self._format_resources(resource_candidates or []),
                "resource_completion_note": resource_completion_note,
                "memory_json": memory_json,
            })
            plan = parse_plan_output(raw_result)
        except Exception as exc:
            logger.warning(f"LLM学习计划生成失败，使用规则降级计划: {exc}")
            plan = self._build_fallback_plan(
                student_name=student_name,
                course_name=course_name,
                knowledge_mastery=knowledge_mastery,
                memory_json=memory_json,
                resource_candidates=resource_candidates or [],
                resource_completion_note=resource_completion_note,
            )
        logger.info(f"学习计划生成成功: {student_name} - {plan.get('summary', '')}")

        # Step 3: 保存到Spring后端
        generated_at = datetime.now().isoformat()
        plan_id = await spring_client.save_learning_plan(
            student_id=student_id,
            course_id=course_id,
            plan_content=json.dumps(plan, ensure_ascii=False),
        )

        return {**plan, "plan_id": plan_id, "generated_at": generated_at}

    def _get_chain(self):
        """延迟创建链，避免未配置模型密钥时影响服务启动。"""
        if self.chain is None:
            self.chain = build_learning_plan_chain()
        return self.chain

    def _format_mastery(self, mastery: dict) -> str:
        """格式化掌握度数据为可读文本"""
        lines = []
        if not mastery:
            return "暂无知识点掌握度数据"
        for kp, score in mastery.items():
            level = "🟢 熟练" if score >= 0.7 else ("🟡 一般" if score >= 0.4 else "🔴 薄弱")
            lines.append(f"  - {kp}: {score:.0%} ({level})")
        return "\n".join(lines)

    def _format_resources(self, resources: list) -> str:
        if not resources:
            return "暂无资源候选，优先建议复习课堂材料与错题"
        lines = []
        for item in resources[:8]:
            name = item.get("name") or item.get("resource_name") or "未命名资源"
            knowledge_point = item.get("knowledge_point") or item.get("node_name") or "未指定知识点"
            rtype = item.get("type") or item.get("resource_type") or "resource"
            lines.append(f"  - {knowledge_point}: {name} ({rtype})")
        return "\n".join(lines)

    def _build_fallback_plan(
        self,
        student_name: str,
        course_name: str,
        knowledge_mastery: dict,
        memory_json: str,
        resource_candidates: list,
        resource_completion_note: str,
    ) -> dict:
        sorted_mastery = sorted(knowledge_mastery.items(), key=lambda item: item[1])
        weak_points = [name for name, score in sorted_mastery if score < 0.6][:3]
        strengths = [name for name, score in sorted_mastery if score >= 0.75][:3]
        focus_points = weak_points or [name for name, _ in sorted_mastery[:2]] or ["课程核心知识点"]
        risk_level = "HIGH" if any(score < 0.35 for _, score in sorted_mastery[:2]) else (
            "MEDIUM" if weak_points else "LOW"
        )

        daily_plan = []
        task_templates = [
            "回看课堂材料，整理关键概念和例题",
            "完成基础练习并标记错题",
            "针对错题复盘解题步骤",
            "完成一次小测或自查题",
            "整理本周总结并补齐薄弱环节",
        ]
        for index in range(5):
            kp = focus_points[index % len(focus_points)]
            daily_plan.append({
                "day": index + 1,
                "task": f"{task_templates[index]}：{kp}",
                "duration_min": 45 if risk_level == "LOW" else 60,
                "knowledge_point": kp,
                "expected_result": f"能说明{kp}的核心思路并完成对应练习",
            })

        return {
            "summary": f"{student_name}本周重点巩固{course_name or '课程'}薄弱知识点。",
            "generation_basis": [
                "知识点掌握度",
                "学生长期记忆",
                "资源候选" if resource_candidates else "暂无资源候选",
                resource_completion_note,
            ],
            "weakness_diagnosis": {
                "weak_points": weak_points,
                "strengths": strengths,
                "risk_level": risk_level,
                "strategy": "先补最薄弱知识点，再用练习和复盘巩固。",
            },
            "short_term": {
                "focus": "、".join(focus_points),
                "daily_plan": daily_plan,
            },
            "mid_term": {
                "goal": "本月把薄弱知识点提升到可独立完成基础题的水平。",
                "milestones": [
                    "第1周完成薄弱点基础复习",
                    "第2周完成错题复盘和专题练习",
                    "第3周完成综合测验并回看掌握度变化",
                ],
                "suggested_resources": [
                    "课堂课件与例题",
                    "知识点关联资料",
                    "近期测验错题",
                ],
            },
            "resource_recommendations": [
                {
                    "knowledge_point": kp,
                    "resource": "优先查看知识点关联资料和课堂例题",
                    "reason": "当前掌握度偏低，需要先补基础概念。",
                }
                for kp in focus_points[:3]
            ],
            "progress_checks": [
                "每天至少完成1项计划任务",
                "本周完成一次薄弱点自测",
                "记录并复盘本周新增错题",
            ],
            "motivation": "把任务拆小，一天推进一点，薄弱点会慢慢变清楚。",
        }


# 全局单例
learning_plan_service = LearningPlanService()
