"""LLM链工厂 — 统一创建和管理所有LangChain链"""
from langchain_openai import ChatOpenAI
from config import LLM_API_KEY, LLM_BASE_URL, LLM_MODEL

# ─── 全局LLM实例缓存（避免重复创建连接） ───
_llm_instance = None
_structured_llm_instance = None


def get_llm(temperature: float = 0.7) -> ChatOpenAI:
    """获取LLM实例"""
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = ChatOpenAI(
            model=LLM_MODEL,
            api_key=LLM_API_KEY,
            base_url=LLM_BASE_URL,
            temperature=temperature,
            max_tokens=2048,
        )
    else:
        _llm_instance.temperature = temperature
    return _llm_instance


def get_structured_llm() -> ChatOpenAI:
    """获取结构化输出的LLM（temperature=0.1，输出更稳定）"""
    global _structured_llm_instance
    if _structured_llm_instance is None:
        _structured_llm_instance = ChatOpenAI(
            model=LLM_MODEL,
            api_key=LLM_API_KEY,
            base_url=LLM_BASE_URL,
            temperature=0.1,
            max_tokens=2048,
        )
    return _structured_llm_instance


def reset_llm_cache():
    """清除LLM实例缓存（配置变更后调用）"""
    global _llm_instance, _structured_llm_instance
    _llm_instance = None
    _structured_llm_instance = None
