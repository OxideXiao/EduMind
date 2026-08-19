"""学习计划生成链"""
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from chains.base import get_llm
from prompts.learning_plan import (
    LEARNING_PLAN_SYSTEM_PROMPT,
    LEARNING_PLAN_USER_TEMPLATE,
)
from utils.logger import logger
import json


def build_learning_plan_chain():
    """构建学习计划生成链"""
    llm = get_llm(temperature=0.5)

    prompt = ChatPromptTemplate.from_messages([
        ("system", LEARNING_PLAN_SYSTEM_PROMPT),
        ("user", LEARNING_PLAN_USER_TEMPLATE),
    ])

    return prompt | llm | StrOutputParser()


def parse_plan_output(raw_output: str) -> dict:
    """解析 + 校验学习计划JSON（多层容错）"""
    cleaned = raw_output.strip()

    # 尝试1: 直接解析
    try:
        plan = json.loads(cleaned)
        _validate_plan(plan)
        return plan
    except (json.JSONDecodeError, AssertionError):
        pass

    # 尝试2: 去掉markdown包裹
    try:
        if "```" in cleaned:
            lines = cleaned.split("\n")
            inner = "\n".join(lines[1:-1])
            if inner.startswith("json"):
                inner = inner[4:]
            plan = json.loads(inner)
            _validate_plan(plan)
            return plan
    except (json.JSONDecodeError, AssertionError):
        pass

    # 尝试3: 正则提取JSON块
    import re
    match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if match:
        try:
            plan = json.loads(match.group())
            _validate_plan(plan)
            return plan
        except (json.JSONDecodeError, AssertionError):
            pass

    raise ValueError(f"学习计划输出格式异常，无法解析JSON\n原始输出前300字: {raw_output[:300]}")


def _validate_plan(plan: dict):
    """校验学习计划结构"""
    assert "summary" in plan, "缺少summary"
    assert "short_term" in plan, "缺少short_term"
    assert "daily_plan" in plan["short_term"], "缺少daily_plan"
    assert len(plan["short_term"]["daily_plan"]) > 0, "daily_plan为空"
