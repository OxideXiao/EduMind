"""Agent Service — FastAPI入口，注册所有路由"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from config import AGENT_PORT, MOCK_SPRING, AGENT_ENGINE
from models.requests import (
    LearningPlanRequest,
    ReminderRequest,
    MemoryUpdateRequest,
    TeachingSuggestionRequest,
    HeartbeatRequest,
)
from models.responses import AgentResponse
from services.heartbeat_service import heartbeat_service
from services.learning_plan_service import learning_plan_service
from services.spring_client import spring_client
from chains.learning_plan import build_learning_plan_chain, parse_plan_output
from chains.heartbeat import build_reminder_chain, parse_reminder_output
from chains.memory import build_memory_update_chain, parse_memory_output
from prompts.teaching_suggestion import (
    TEACHING_SUGGESTION_SYSTEM_PROMPT,
    TEACHING_SUGGESTION_USER_TEMPLATE,
)
from chains.base import get_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from utils.logger import logger


# ─── 应用生命周期 ───
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🚀 Agent Service 启动 — 引擎: {AGENT_ENGINE}, Mock: {MOCK_SPRING}")
    yield
    await spring_client.close()
    logger.info("Agent Service 已关闭")


app = FastAPI(
    title="CoStrict AI Agent Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── 健康检查 ───
@app.get("/health")
async def health():
    return {"status": "ok", "mock_mode": MOCK_SPRING, "engine": AGENT_ENGINE}


# ─── 模块6：学习计划生成 ───
@app.post("/api/agent/learning-plan")
async def generate_learning_plan(req: LearningPlanRequest):
    """生成个性化学习计划"""
    logger.info(f"生成学习计划: student_id={req.student_id}, student={req.student_name}")
    try:
        result = await learning_plan_service.generate_plan(
            student_id=req.student_id,
            student_name=req.student_name,
            course_id=req.course_id,
            course_name=req.course_name,
            knowledge_mastery=req.knowledge_mastery,
        )
        return AgentResponse(success=True, data=result)
    except Exception as e:
        logger.error(f"学习计划生成失败: {e}")
        return AgentResponse(success=False, error=str(e))


# ─── 模块7：智能提醒生成（单次） ───
@app.post("/api/agent/reminder")
async def generate_reminder(req: ReminderRequest):
    """生成智能提醒（单学生）"""
    logger.info(f"生成提醒: student_id={req.student_id}")
    try:
        chain = build_reminder_chain()
        raw = await chain.ainvoke({
            "student_name": req.student_name,
            "completion_rate": f"{req.completion_rate:.0%}",
            "active_days": req.active_days,
            "at_risk": "是" if req.at_risk else "否",
            "weak_points": req.weak_points if req.weak_points else ["无"],
            "memory_json": req.memory_json,
        })
        result = parse_reminder_output(raw)
        return AgentResponse(success=True, data=result)
    except Exception as e:
        logger.error(f"提醒生成失败: {e}")
        return AgentResponse(success=False, error=str(e))


# ─── 模块7：Heartbeat定时触发 ───
@app.post("/api/agent/heartbeat")
async def trigger_heartbeat(req: HeartbeatRequest = None,
                             course_id: int = Query(None)):
    """触发Heartbeat（由Spring定时任务或手动调用）"""
    try:
        cid = course_id or (req.course_id if req else None)
        result = await heartbeat_service.run_heartbeat(cid)
        return AgentResponse(success=True, data=result)
    except Exception as e:
        logger.error(f"Heartbeat执行失败: {e}")
        return AgentResponse(success=False, error=str(e))


# ─── 模块9：记忆更新 ───
@app.post("/api/agent/memory-update")
async def update_memory(req: MemoryUpdateRequest):
    """更新学生记忆"""
    logger.info(f"更新记忆: current_version=...")
    try:
        chain = build_memory_update_chain()
        raw = await chain.ainvoke({
            "current_memory_json": req.current_memory_json,
            "today_activities": req.today_activities,
            "knowledge_changes": req.knowledge_changes,
        })
        result = parse_memory_output(raw)
        return AgentResponse(success=True, data=result)
    except Exception as e:
        logger.error(f"记忆更新失败: {e}")
        return AgentResponse(success=False, error=str(e))


# ─── 教学建议生成 ───
@app.post("/api/agent/teaching-suggestion")
async def generate_teaching_suggestion(req: TeachingSuggestionRequest):
    """生成教学建议"""
    logger.info(f"生成教学建议: teacher_id={req.teacher_id}, course_id={req.course_id}")
    try:
        llm = get_llm(temperature=0.5)
        prompt = ChatPromptTemplate.from_messages([
            ("system", TEACHING_SUGGESTION_SYSTEM_PROMPT),
            ("user", TEACHING_SUGGESTION_USER_TEMPLATE),
        ])
        chain = prompt | llm | StrOutputParser()

        # 格式化掌握度
        mastery_lines = []
        for kp, score in req.class_avg_mastery.items():
            level = "🟢" if score >= 0.7 else ("🟡" if score >= 0.4 else "🔴")
            mastery_lines.append(f"  - {kp}: {score:.0%} {level}")
        mastery_str = "\n".join(mastery_lines)

        raw = await chain.ainvoke({
            "course_id": req.course_id,
            "class_avg_mastery": mastery_str,
            "weak_knowledge_points": req.weak_knowledge_points,
            "at_risk_student_count": req.at_risk_student_count,
        })

        # 解析JSON
        import json
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1])
        result = json.loads(cleaned)
        return AgentResponse(success=True, data=result)
    except Exception as e:
        logger.error(f"教学建议生成失败: {e}")
        return AgentResponse(success=False, error=str(e))


# ─── Mock数据查询（独立开发期间使用） ───
@app.get("/api/agent/mock-students")
async def get_mock_students():
    """获取Mock学生列表"""
    from services.spring_client import MOCK_ANALYTICS
    return AgentResponse(success=True, data=MOCK_ANALYTICS)


@app.get("/api/agent/mock-memory/{student_id}")
async def get_mock_memory(student_id: int):
    """获取Mock学生记忆"""
    from services.spring_client import MOCK_MEMORIES
    memory = MOCK_MEMORIES.get(student_id)
    if memory:
        return AgentResponse(success=True, data=memory)
    return AgentResponse(success=False, error=f"学生 {student_id} 不存在")


# ─── 入口 ───
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=AGENT_PORT, reload=True)
