"""Heartbeat智能提醒链"""
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
    return {"title": "今日学习提醒", "content": raw[:100], "priority": "NORMAL"}


def _validate_reminder(result: dict):
    """校验提醒结构"""
    assert "title" in result, "缺少title"
    assert "content" in result, "缺少content"
    assert "priority" in result, "缺少priority"
    assert result["priority"] in ("HIGH", "NORMAL"), f"priority值无效: {result['priority']}"
