"""LLM链工厂 — 统一创建和管理所有LangChain链"""
from langchain_openai import ChatOpenAI
from config import LLM_API_KEY, LLM_BASE_URL, LLM_MODEL

# ─── 全局LLM实例缓存（避免重复创建连接） ───
_llm_instances = {}
_structured_llm_instance = None


def get_llm(temperature: float = 0.7) -> ChatOpenAI:
    """获取LLM实例"""
    if not is_llm_configured():
        raise RuntimeError("LLM_API_KEY 未配置，无法调用模型")

    key = round(float(temperature), 2)
    if key not in _llm_instances:
        _llm_instances[key] = ChatOpenAI(
            model=LLM_MODEL,
            api_key=LLM_API_KEY,
            base_url=LLM_BASE_URL,
            temperature=temperature,
            max_tokens=2048,
        )
    return _llm_instances[key]


def get_structured_llm() -> ChatOpenAI:
    """获取结构化输出的LLM（temperature=0.1，输出更稳定）"""
    global _structured_llm_instance
    if not is_llm_configured():
        raise RuntimeError("LLM_API_KEY 未配置，无法调用模型")

    if _structured_llm_instance is None:
        _structured_llm_instance = ChatOpenAI(
            model=LLM_MODEL,
            api_key=LLM_API_KEY,
            base_url=LLM_BASE_URL,
            temperature=0.1,
            max_tokens=2048,
        )
    return _structured_llm_instance


def is_llm_configured() -> bool:
    """LLM密钥是否已配置。"""
    return bool(LLM_API_KEY and LLM_API_KEY.strip())


def llm_config_snapshot() -> dict:
    """返回可公开展示的模型配置摘要，不暴露密钥。"""
    return {
        "configured": is_llm_configured(),
        "model": LLM_MODEL,
        "base_url": LLM_BASE_URL,
    }


def reset_llm_cache():
    """清除LLM实例缓存（配置变更后调用）"""
    global _structured_llm_instance
    _llm_instances.clear()
    _structured_llm_instance = None
