"""Spring后端HTTP客户端 — 含Mock模式支持"""
import httpx
from datetime import date, datetime
from typing import Optional, Dict, List
from config import SPRING_BASE_URL, MOCK_SPRING, INTERNAL_TOKEN
from utils.logger import logger
import json


# ─── Mock数据（Spring后端未就绪时使用） ───

MOCK_MEMORIES = {
    101: {
        "version": 0, "last_updated": date.today().isoformat(),
        "summary": "该生掌握度优秀，学习积极主动",
        "knowledge_mastery_trend": {
            "二叉树遍历": {"current": 0.9, "trend": "stable"},
            "动态规划": {"current": 0.75, "trend": "improving"},
            "贪心算法": {"current": 0.85, "trend": "stable"},
            "图论": {"current": 0.8, "trend": "stable"},
        },
        "weak_points": [],
        "strengths": ["二叉树遍历", "贪心算法", "图论"],
        "learning_style_note": "偏好刷题，每周主动做额外练习",
        "behavior_notes": ["连续7天活跃", "测验正确率稳定90%+"],
        "suggested_focus": "保持当前节奏，可挑战更难的动态规划题目",
    },
    102: {
        "version": 0, "last_updated": date.today().isoformat(),
        "summary": "该生整体中等，动态规划是明显短板",
        "knowledge_mastery_trend": {
            "二叉树遍历": {"current": 0.65, "trend": "improving"},
            "动态规划": {"current": 0.3, "trend": "declining"},
            "贪心算法": {"current": 0.55, "trend": "stable"},
        },
        "weak_points": ["动态规划"],
        "strengths": ["二叉树遍历"],
        "learning_style_note": "偏好视频学习，做题偏少",
        "behavior_notes": ["上次动态规划测验只得了45分", "3天未查看学习资料"],
        "suggested_focus": "集中攻克动态规划，建议每天至少2道DP题",
    },
    103: {
        "version": 0, "last_updated": date.today().isoformat(),
        "summary": "该生多项指标预警，需要重点关注",
        "knowledge_mastery_trend": {
            "二叉树遍历": {"current": 0.4, "trend": "declining"},
            "动态规划": {"current": 0.15, "trend": "declining"},
            "贪心算法": {"current": 0.35, "trend": "declining"},
        },
        "weak_points": ["二叉树遍历", "动态规划", "贪心算法"],
        "strengths": [],
        "learning_style_note": "极少参与线上学习活动",
        "behavior_notes": ["连续5天未登录", "完成率仅15%", "上次测验缺考"],
        "suggested_focus": "急需重新建立学习习惯，从最基础的二叉树开始补课",
    },
}

MOCK_ANALYTICS = {
    "course_id": 1,
    "date": date.today().isoformat(),
    "students": [
        {
            "student_id": 101, "student_name": "张三",
            "completion_rate": 0.92, "active_days_this_week": 7,
            "quiz_avg_score": 91.5, "at_risk": False,
            "knowledge_mastery": {
                "二叉树遍历": 0.9, "动态规划": 0.75,
                "贪心算法": 0.85, "图论": 0.8,
            },
        },
        {
            "student_id": 102, "student_name": "李四",
            "completion_rate": 0.55, "active_days_this_week": 3,
            "quiz_avg_score": 62.0, "at_risk": False,
            "knowledge_mastery": {
                "二叉树遍历": 0.65, "动态规划": 0.3, "贪心算法": 0.55,
            },
        },
        {
            "student_id": 103, "student_name": "王五",
            "completion_rate": 0.15, "active_days_this_week": 1,
            "quiz_avg_score": 28.0, "at_risk": True,
            "knowledge_mastery": {
                "二叉树遍历": 0.4, "动态规划": 0.15, "贪心算法": 0.35,
            },
        },
    ],
}

MOCK_NOTIFICATION_ID = 1000
MOCK_PLAN_ID = 2000


class SpringClient:
    """Spring后端HTTP客户端，支持Mock模式"""

    def __init__(self):
        self.base_url = SPRING_BASE_URL
        self.mock = MOCK_SPRING
        if self.mock:
            logger.info("[MOCK] Spring Mock 模式已启用 - 使用内存数据模拟后端")
        self.client: Optional[httpx.AsyncClient] = None

    async def _ensure_client(self):
        if self.client is None:
            self.client = httpx.AsyncClient(
                timeout=30.0,
                headers={"X-Internal-Token": INTERNAL_TOKEN},
            )

    async def close(self):
        if self.client:
            await self.client.aclose()
            self.client = None

    # ─── 学生记忆相关 ───

    async def get_student_memory(self, student_id: int, course_id: int = None) -> str:
        """获取学生记忆，返回JSON字符串"""
        if self.mock:
            memory = MOCK_MEMORIES.get(student_id, {"version": 0, "last_updated": date.today().isoformat()})
            return json.dumps(memory, ensure_ascii=False)

        await self._ensure_client()
        url = f"{self.base_url}/api/students/{student_id}/memory"
        params = {}
        if course_id:
            params["course_id"] = course_id
        resp = await self.client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json().get("data", {})
        return data.get("memory_json", "{}")

    async def update_student_memory(self, student_id: int, memory: dict, course_id: int = None):
        """更新学生记忆"""
        if self.mock:
            MOCK_MEMORIES[student_id] = memory
            logger.info(f"Mock: 学生 {student_id} 记忆已更新")
            return

        await self._ensure_client()
        url = f"{self.base_url}/api/students/{student_id}/memory"
        params = {}
        if course_id:
            params["course_id"] = course_id
        body = {"memory_json": json.dumps(memory, ensure_ascii=False)}
        resp = await self.client.put(url, json=body, params=params)
        resp.raise_for_status()
        logger.info(f"学生 {student_id} 记忆已更新")

    # ─── 学情数据相关 ───

    async def get_daily_analytics(self, course_id: int = None, date_str: str = None) -> dict:
        """获取每日学情数据"""
        if date_str is None:
            date_str = date.today().isoformat()

        if self.mock:
            return MOCK_ANALYTICS

        await self._ensure_client()
        url = f"{self.base_url}/api/analytics/daily"
        params = {"date": date_str}
        if course_id:
            params["course_id"] = course_id
        resp = await self.client.get(url, params=params)
        resp.raise_for_status()
        return resp.json().get("data", {})

    # ─── 通知相关 ───

    async def create_notification(self, student_id: int, title: str,
                                  content: str, priority: str,
                                  ntype: str = "REMINDER",
                                  course_id: int = None) -> int:
        """创建通知，返回通知ID"""
        if self.mock:
            global MOCK_NOTIFICATION_ID
            MOCK_NOTIFICATION_ID += 1
            logger.info(f"Mock: 学生 {student_id} 通知已创建: {title}")
            return MOCK_NOTIFICATION_ID

        await self._ensure_client()
        url = f"{self.base_url}/api/notifications"
        body = {
            "user_id": student_id,       # 后端字段名是 user_id
            "course_id": course_id,
            "type": ntype,
            "title": title,
            "content": content,
            "priority": priority,
        }
        resp = await self.client.post(url, json=body)
        resp.raise_for_status()
        notif_id = resp.json().get("data", {}).get("notification_id")
        logger.info(f"学生 {student_id} 通知已创建: {title}")
        return notif_id

    # ─── 学习计划相关 ───

    async def save_learning_plan(self, student_id: int, course_id: int,
                                 plan_content: str) -> int:
        """保存学习计划，返回计划ID"""
        if self.mock:
            global MOCK_PLAN_ID
            MOCK_PLAN_ID += 1
            logger.info(f"Mock: 学生 {student_id} 学习计划已保存 (plan_id={MOCK_PLAN_ID})")
            return MOCK_PLAN_ID

        await self._ensure_client()
        url = f"{self.base_url}/api/learning-plans"
        body = {
            "student_id": student_id,
            "course_id": course_id,
            "plan_content": plan_content,
            "generated_at": datetime.now().isoformat(),
        }
        resp = await self.client.post(url, json=body)
        resp.raise_for_status()
        plan_id = resp.json().get("data", {}).get("plan_id")
        return plan_id


# 全局单例
spring_client = SpringClient()
