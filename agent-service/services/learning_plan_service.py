"""学习计划服务 — 生成个性化学习计划并保存"""
import json
from datetime import datetime
from chains.learning_plan import build_learning_plan_chain, parse_plan_output
from services.spring_client import spring_client
from utils.logger import logger


class LearningPlanService:
    def __init__(self):
        self.chain = build_learning_plan_chain()

    async def generate_plan(
        self,
        student_id: int,
        student_name: str,
        course_id: int,
        course_name: str,
        knowledge_mastery: dict,
    ) -> dict:
        """生成学习计划并保存到后端"""
        # Step 1: 获取学生记忆
        memory_json = await spring_client.get_student_memory(student_id, course_id)

        # Step 2: LLM生成计划
        raw_result = await self.chain.ainvoke({
            "student_name": student_name,
            "course_name": course_name,
            "knowledge_mastery": self._format_mastery(knowledge_mastery),
            "memory_json": memory_json,
        })
        plan = parse_plan_output(raw_result)
        logger.info(f"学习计划生成成功: {student_name} - {plan.get('summary', '')}")

        # Step 3: 保存到Spring后端
        generated_at = datetime.now().isoformat()
        plan_id = await spring_client.save_learning_plan(
            student_id=student_id,
            course_id=course_id,
            plan_content=json.dumps(plan, ensure_ascii=False),
        )

        return {**plan, "plan_id": plan_id, "generated_at": generated_at}

    def _format_mastery(self, mastery: dict) -> str:
        """格式化掌握度数据为可读文本"""
        lines = []
        for kp, score in mastery.items():
            level = "🟢 熟练" if score >= 0.7 else ("🟡 一般" if score >= 0.4 else "🔴 薄弱")
            lines.append(f"  - {kp}: {score:.0%} ({level})")
        return "\n".join(lines)


# 全局单例
learning_plan_service = LearningPlanService()
