"""请求模型 — Agent服务入参定义"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, List


class LearningPlanRequest(BaseModel):
    student_id: int
    student_name: str
    course_id: int
    course_name: str
    memory_json: str = "{}"           # 学生记忆JSON字符串
    knowledge_mastery: Dict[str, float] = {}  # 知识点掌握度


class ReminderRequest(BaseModel):
    student_id: int
    student_name: str
    completion_rate: float
    active_days: int
    at_risk: bool
    weak_points: List[str] = []
    memory_json: str = "{}"


class MemoryUpdateRequest(BaseModel):
    current_memory_json: str
    today_activities: str             # 当日活动摘要
    knowledge_changes: str            # 知识点变化描述


class TeachingSuggestionRequest(BaseModel):
    teacher_id: int
    course_id: int
    course_name: str = ""
    class_avg_mastery: Dict[str, float] = {}
    weak_knowledge_points: List = []      # 接受 int(nodeId) 或 str(name)
    at_risk_student_count: int = 0


class HeartbeatRequest(BaseModel):
    """Heartbeat触发请求"""
    course_id: Optional[int] = None
