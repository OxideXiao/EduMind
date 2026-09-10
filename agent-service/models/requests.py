"""请求模型 — Agent服务入参定义"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, List


class LearningPlanRequest(BaseModel):
    student_id: int
    student_name: str
    course_id: int
    course_name: str
    memory_json: str = "{}"           # 学生记忆JSON字符串
    knowledge_mastery: Dict[str, float] = Field(default_factory=dict)  # 知识点掌握度
    quiz_summary: str = ""            # 近期测验摘要
    behavior_summary: str = ""        # 学习行为摘要
    resource_candidates: List[Dict] = Field(default_factory=list)  # 可推荐资源候选
    resource_completion_note: str = "资源完成率暂未接入完整统计"


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
