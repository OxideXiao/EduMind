"""Heartbeat智能提醒链"""
from typing import Any

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from chains.base import get_structured_llm
from prompts.reminder import REMINDER_SYSTEM_PROMPT, REMINDER_USER_TEMPLATE
from utils.logger import logger
import json


def build_reminder_chain():
    """构建提醒生成链"""
    llm = get_structured_llm()

    prompt = ChatPromptTemplate.from_messages([
        ("system", REMINDER_SYSTEM_PROMPT),
        ("user", REMINDER_USER_TEMPLATE),
    ])

    return prompt | llm | StrOutputParser()


def parse_reminder_output(raw: str) -> dict:
    """解析提醒JSON（多层容错）"""
    cleaned = raw.strip()

    # 尝试1: 直接解析
    try:
        result = json.loads(cleaned)
        _validate_reminder(result)
        return result
    except (json.JSONDecodeError, AssertionError):
        pass

    # 尝试2: 去掉markdown包裹
    try:
        if "```" in cleaned:
            lines = cleaned.split("\n")
            inner = "\n".join(lines[1:-1])
            if inner.startswith("json"):
                inner = inner[4:]
            result = json.loads(inner)
            _validate_reminder(result)
            return result
    except (json.JSONDecodeError, AssertionError):
        pass

    # 尝试3: 正则提取
    import re
    match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if match:
        try:
            result = json.loads(match.group())
            _validate_reminder(result)
            return result
        except (json.JSONDecodeError, AssertionError):
            pass

    # 失败: 返回默认格式
    logger.warning(f"提醒JSON解析失败，使用默认格式。原始输出: {raw[:100]}")
    return {
        "title": "今日学习提醒",
        "content": raw[:100],
        "priority": "NORMAL",
        "risk_reasons": ["模型输出格式异常"],
        "next_action": "查看本周学习计划并完成一个薄弱点任务",
    }


def build_fallback_reminder(
    student_name: str,
    completion_rate: float,
    active_days: int,
    at_risk: bool,
    weak_points: list[Any],
    memory_json: str = "{}",
) -> dict:
    """模型不可用时基于规则生成提醒。"""
    clean_points = [str(item) for item in weak_points if str(item).strip() and str(item) != "无"]
    risk_reasons = []
    if at_risk:
        risk_reasons.append("系统识别为风险状态")
    if completion_rate < 0.5:
        risk_reasons.append(f"本周完成率仅{completion_rate:.0%}")
    if active_days <= 1:
        risk_reasons.append(f"本周仅活跃{active_days}天")
    if clean_points:
        risk_reasons.append("存在薄弱知识点：" + "、".join(clean_points[:2]))
    if not risk_reasons:
        risk_reasons.append("需要保持当前学习节奏")

    priority = "HIGH" if at_risk or completion_rate < 0.4 or active_days == 0 else "NORMAL"
    focus = clean_points[0] if clean_points else "本周重点内容"
    action = f"今天先完成{focus}的复习和1组练习。"
    content = (
        f"{student_name}，{risk_reasons[0]}。"
        f"{action}"
    )
    if len(content) > 100:
        content = content[:97] + "..."

    return {
        "title": "学习提醒" if priority == "NORMAL" else "重点提醒",
        "content": content,
        "priority": priority,
        "risk_reasons": risk_reasons,
        "next_action": action,
    }


def _validate_reminder(result: dict):
    """校验提醒结构"""
    assert "title" in result, "缺少title"
    assert "content" in result, "缺少content"
    assert "priority" in result, "缺少priority"
    assert result["priority"] in ("HIGH", "NORMAL"), f"priority值无效: {result['priority']}"
    result.setdefault("risk_reasons", [])
    result.setdefault("next_action", "")
