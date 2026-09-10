"""教学建议生成链"""
import json
import re
from typing import Any

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from chains.base import get_llm
from prompts.teaching_suggestion import (
    TEACHING_SUGGESTION_SYSTEM_PROMPT,
    TEACHING_SUGGESTION_USER_TEMPLATE,
)


def build_teaching_suggestion_chain():
    """构建教学建议生成链。"""
    llm = get_llm(temperature=0.45)
    prompt = ChatPromptTemplate.from_messages([
        ("system", TEACHING_SUGGESTION_SYSTEM_PROMPT),
        ("user", TEACHING_SUGGESTION_USER_TEMPLATE),
    ])
    return prompt | llm | StrOutputParser()


def parse_teaching_suggestion_output(raw_output: str) -> dict:
    """解析并补齐教学建议 JSON。"""
    cleaned = raw_output.strip()
    candidates = [cleaned]

    if "```" in cleaned:
        lines = cleaned.split("\n")
        inner = "\n".join(lines[1:-1]).strip()
        if inner.lower().startswith("json"):
            inner = inner[4:].strip()
        candidates.append(inner)

    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        candidates.append(match.group())

    last_error: Exception | None = None
    for candidate in candidates:
        try:
            result = json.loads(candidate)
            _validate_suggestion(result)
            return result
        except (json.JSONDecodeError, AssertionError, TypeError) as exc:
            last_error = exc

    raise ValueError(f"教学建议输出格式异常: {last_error}")


def build_fallback_teaching_suggestion(
    course_name: str,
    class_avg_mastery: dict[str, float],
    weak_knowledge_points: list[Any],
    at_risk_student_count: int,
) -> dict:
    """模型不可用时，基于班级学情生成可展示的规则建议。"""
    weak_points = [str(item) for item in weak_knowledge_points if str(item).strip()]
    if not weak_points:
        weak_points = [
            name for name, score in sorted(class_avg_mastery.items(), key=lambda item: item[1])
            if score < 0.65
        ][:3]
    if not weak_points:
        weak_points = ["课程核心知识点"]

    low_scores = [score for score in class_avg_mastery.values() if score < 0.6]
    priority = "HIGH" if at_risk_student_count >= 3 or len(low_scores) >= 3 else (
        "MEDIUM" if at_risk_student_count > 0 or low_scores else "NORMAL"
    )
    first_point = weak_points[0]

    return {
        "summary": f"{course_name or '本课程'}当前需重点关注{first_point}等薄弱点。",
        "data_basis": [
            "班级知识点平均掌握度",
            "薄弱知识点列表",
            f"风险学生人数：{at_risk_student_count}",
        ],
        "weak_knowledge_points": weak_points[:3],
        "teaching_suggestions": [
            f"围绕{first_point}安排一次15分钟概念回顾，先讲典型误区再讲例题。",
            "课堂练习按基础题、提升题两层布置，低掌握度学生先完成基础题。",
            "课后要求学生提交错题复盘，下一次课用5分钟回看共性错误。",
        ],
        "grouping_strategy": "按掌握度分为补基础、巩固、提升三组，给不同难度任务。",
        "resource_strategy": "优先补充薄弱知识点的短视频、例题讲解和错题清单。",
        "assessment_strategy": "本周安排一次小测，重点观察薄弱知识点掌握度变化。",
        "risk_alert": (
            f"当前有{at_risk_student_count}名风险学生，建议课后单独提醒。"
            if at_risk_student_count > 0 else "暂未发现明显风险学生，继续观察活跃度和测验表现。"
        ),
        "next_actions": [
            "确认本周课堂重点",
            "发布薄弱知识点练习",
            "复查风险学生通知状态",
        ],
        "priority": priority,
    }


def _validate_suggestion(result: dict):
    assert "summary" in result, "缺少summary"
    result.setdefault("data_basis", ["班级平均掌握度", "风险学生数量"])
    result.setdefault("weak_knowledge_points", [])
    suggestions = result.get("teaching_suggestions")
    if not isinstance(suggestions, list) or not suggestions:
        raise AssertionError("teaching_suggestions为空")
    result.setdefault("grouping_strategy", "")
    result.setdefault("resource_strategy", "")
    result.setdefault("assessment_strategy", "")
    result.setdefault("risk_alert", "")
    result.setdefault("next_actions", [])
    result.setdefault("priority", "NORMAL")
