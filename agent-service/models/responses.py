"""响应模型 — Agent服务出参定义"""
from pydantic import BaseModel
from typing import Any, Optional


class AgentResponse(BaseModel):
    success: bool
    data: Any = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    mock_mode: bool = False
