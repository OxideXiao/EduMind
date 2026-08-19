"""记忆更新链"""
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from chains.base import get_structured_llm
from prompts.memory import MEMORY_UPDATE_SYSTEM_PROMPT, MEMORY_UPDATE_USER_TEMPLATE
from utils.logger import logger
import json


def build_memory_update_chain():
    """构建记忆更新链"""
    llm = get_structured_llm()

    prompt = ChatPromptTemplate.from_messages([
        ("system", MEMORY_UPDATE_SYSTEM_PROMPT),
        ("user", MEMORY_UPDATE_USER_TEMPLATE),
    ])

    return prompt | llm | StrOutputParser()


def parse_memory_output(raw_output: str) -> dict:
    """解析LLM输出的记忆JSON，做安全校验"""
    cleaned = raw_output.strip()

    # 尝试1: 直接解析
    try:
        memory = json.loads(cleaned)
        _validate_memory(memory)
        return memory
    except (json.JSONDecodeError, AssertionError):
        pass

    # 尝试2: 去掉markdown包裹
    try:
        if "```" in cleaned:
            lines = cleaned.split("\n")
            inner = "\n".join(lines[1:-1])
            if inner.startswith("json"):
                inner = inner[4:]
            memory = json.loads(inner)
            _validate_memory(memory)
            return memory
    except (json.JSONDecodeError, AssertionError):
        pass

    # 尝试3: 正则提取
    import re
    match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if match:
        try:
            memory = json.loads(match.group())
            _validate_memory(memory)
            return memory
        except (json.JSONDecodeError, AssertionError):
            pass

    raise ValueError(f"LLM输出的记忆JSON格式错误，无法解析\n原始输出: {raw_output[:300]}")


def _validate_memory(memory: dict):
    """校验记忆结构"""
    required = [
        "version", "last_updated", "summary",
        "knowledge_mastery_trend", "weak_points",
        "strengths", "suggested_focus",
    ]
    for field in required:
        if field not in memory:
            raise ValueError(f"记忆缺少必要字段: {field}")
