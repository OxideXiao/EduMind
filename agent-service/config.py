"""应用配置 — 从环境变量读取"""
import os
from dotenv import load_dotenv

load_dotenv()

# ─── LLM配置 ───
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.deepseek.com/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "deepseek-chat")

# ─── 服务地址 ───
SPRING_BASE_URL = os.getenv("SPRING_BASE_URL", "http://localhost:8080")
AGENT_PORT = int(os.getenv("AGENT_PORT", "8000"))

# ─── Mock模式（Spring后端未就绪时启用） ───
MOCK_SPRING = os.getenv("MOCK_SPRING", "false").lower() == "true"

# ─── Spring内部API认证 ───
INTERNAL_TOKEN = os.getenv("INTERNAL_TOKEN", "dev-internal-token")

# ─── Agent引擎选择 ───
AGENT_ENGINE = os.getenv("AGENT_ENGINE", "langchain")  # "langchain" | "coze" | "dify"
