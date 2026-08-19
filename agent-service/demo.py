"""
CoStrict AI Agent 演示脚本
用法: python demo.py
前提: Agent 服务已在 8000 端口运行 (python main.py)
功能: 依次调用全部 7 个 API 端点，展示 AI 能力
"""
import httpx
import json
import sys
import time

BASE = "http://localhost:8000"
PASS = 0
FAIL = 0


def ok(msg):
    global PASS
    PASS += 1
    print(f"  [PASS] {msg}")


def err(msg):
    global FAIL
    FAIL += 1
    print(f"  [FAIL] {msg}")


def sep(title):
    print()
    print("=" * 64)
    print(f"  {title}")
    print("=" * 64)


def pretty(data, indent=2):
    """安全打印 JSON，不依赖 emoji"""
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except json.JSONDecodeError:
            print(data)
            return
    print(json.dumps(data, ensure_ascii=False, indent=indent))


async def demo():
    global PASS, FAIL

    print()
    print("*" * 64)
    print("*    CoStrict AI -- Agent 智能服务演示")
    print("*    模块 6/7/8/9 + 教学建议")
    print("*" * 64)

    # ─── 健康检查 ───
    sep("0. 健康检查")
    try:
        async with httpx.AsyncClient(timeout=5) as c:
            r = await c.get(f"{BASE}/health")
        if r.status_code == 200:
            data = r.json()
            print(f"  状态: {data.get('status')}")
            print(f"  引擎: {data.get('engine')}")
            print(f"  Mock: {data.get('mock_mode')}")
            ok("服务运行中")
        else:
            err(f"HTTP {r.status_code}")
    except Exception as e:
        err(f"无法连接服务: {e}")
        print()
        print("  请先启动服务: cd agent-service && ../venv/Scripts/python.exe main.py")
        return

    async with httpx.AsyncClient(timeout=120) as client:

        # ─── 1. Mock 学生数据 ───
        sep("1. Mock 学生列表 (GET /api/agent/mock-students)")
        r = await client.get(f"{BASE}/api/agent/mock-students")
        if r.status_code == 200:
            data = r.json()["data"]
            print(f"  班级: 数据结构与算法 (course_id={data['course_id']})")
            print(f"  日期: {data['date']}")
            print()
            for s in data["students"]:
                risk = "!! 预警 !!" if s["at_risk"] else "正常"
                print(f"  {s['student_name']} (id={s['student_id']})")
                print(f"    完成率: {s['completion_rate']:.0%} | 活跃: {s['active_days_this_week']}天/周")
                print(f"    测验均分: {s['quiz_avg_score']} | 风险: {risk}")
                print(f"    知识点: {json.dumps(s['knowledge_mastery'], ensure_ascii=False)}")
            ok("3名学生数据就绪")
        else:
            err(f"HTTP {r.status_code}")

        # ─── 2. 学习计划生成 ───
        sep("2. 学习计划生成 (模块6) -- AI 为李四制定个性化计划")
        payload = {
            "student_id": 102,
            "student_name": "李四",
            "course_id": 1,
            "course_name": "数据结构与算法",
            "knowledge_mastery": {
                "二叉树遍历": 0.65,
                "动态规划": 0.30,
                "贪心算法": 0.55,
            },
        }
        print(f"  请求: 为 {payload['student_name']} 生成学习计划")
        print(f"  知识点掌握: {json.dumps(payload['knowledge_mastery'], ensure_ascii=False)}")
        print()
        r = await client.post(f"{BASE}/api/agent/learning-plan", json=payload)
        if r.status_code == 200:
            result = r.json()
            if result["success"]:
                plan = result["data"]
                print(f"  计划ID: {plan.get('plan_id')}")
                print(f"  摘要: {plan.get('summary')}")
                short = plan.get("short_term", {})
                print(f"  本周重点: {short.get('focus')}")
                print(f"  每日计划:")
                for day_plan in short.get("daily_plan", []):
                    print(f"    第{day_plan['day']}天: {day_plan['task']} ({day_plan['duration_min']}分钟) [{day_plan['knowledge_point']}]")
                mid = plan.get("mid_term", {})
                print(f"  本月目标: {mid.get('goal')}")
                print(f"  里程碑: {mid.get('milestones')}")
                print(f"  推荐资源: {mid.get('suggested_resources')}")
                print(f"  鼓励语: {plan.get('motivation')}")
                ok("DeepSeek LLM 生成学习计划成功")
            else:
                err(f"业务失败: {result.get('error')}")
        else:
            err(f"HTTP {r.status_code}")

        # ─── 3. 智能提醒 ───
        sep("3. 智能提醒 (模块7) -- AI 为王五生成预警通知")
        payload = {
            "student_id": 103,
            "student_name": "王五",
            "completion_rate": 0.15,
            "active_days": 0,
            "at_risk": True,
            "weak_points": ["二叉树遍历", "动态规划", "贪心算法"],
            "memory_json": json.dumps(MOCK_MEMORY_103, ensure_ascii=False),
        }
        print(f"  请求: 为 {payload['student_name']} 生成提醒")
        print(f"  完成率: {payload['completion_rate']:.0%} | 活跃: {payload['active_days']}天 | 风险: 是")
        print(f"  薄弱点: {payload['weak_points']}")
        print()
        r = await client.post(f"{BASE}/api/agent/reminder", json=payload)
        if r.status_code == 200:
            result = r.json()
            if result["success"]:
                rem = result["data"]
                print(f"  标题: {rem.get('title')}")
                print(f"  优先级: {rem.get('priority')}")
                print(f"  内容: {rem.get('content')}")
                ok("DeepSeek LLM 生成预警提醒成功")
            else:
                err(f"业务失败: {result.get('error')}")
        else:
            err(f"HTTP {r.status_code}")

        # ─── 4. 记忆更新 ───
        sep("4. 记忆更新 (模块9) -- AI 增量更新学生记忆档案")
        current_mem = json.dumps(MOCK_MEMORY_102, ensure_ascii=False)
        r = await client.post(f"{BASE}/api/agent/memory-update", json={
            "student_id": 102,
            "current_memory_json": current_mem,
            "today_activities": "今天完成了3道动态规划练习题，正确率66%（2/3），用时45分钟",
            "knowledge_changes": "动态规划: 0.30 -> 0.38 (小幅提升)",
        })
        if r.status_code == 200:
            result = r.json()
            if result["success"]:
                mem = result["data"]
                print(f"  版本: v{mem.get('version')} (原 v0)")
                print(f"  更新时间: {mem.get('last_updated')}")
                print(f"  摘要: {mem.get('summary')}")
                print(f"  薄弱点: {mem.get('weak_points')}")
                print(f"  优势: {mem.get('strengths')}")
                print(f"  行为记录: {mem.get('behavior_notes')}")
                print(f"  学习建议: {mem.get('suggested_focus')}")
                ok("DeepSeek LLM 记忆增量更新成功 (version+1)")
            else:
                err(f"业务失败: {result.get('error')}")
        else:
            err(f"HTTP {r.status_code}")

        # ─── 5. Heartbeat 全流程 ───
        sep("5. Heartbeat 全流程 (模块7核心) -- 遍历全班 -> 生成提醒 -> 更新记忆")
        print(f"  触发 Heartbeat，遍历 course_id=1 的全部 3 名学生...")
        print()
        r = await client.post(f"{BASE}/api/agent/heartbeat", json={"course_id": 1})
        if r.status_code == 200:
            result = r.json()
            if result["success"]:
                hb = result["data"]
                print(f"  日期: {hb.get('date')}")
                print(f"  处理结果: {hb.get('total')} 名学生, {hb.get('success')} 成功, {hb.get('failed')} 失败")
                print()
                for detail in hb.get("details", []):
                    sid = detail["student_id"]
                    sname = detail.get("student_name", "")
                    print(f"  --- {sname} (id={sid}) ---")
                    if detail.get("status") == "success":
                        rem = detail.get("reminder", {})
                        print(f"    提醒: [{rem.get('priority')}] {rem.get('title')}")
                        print(f"    内容: {rem.get('content', '')[:60]}...")
                        mem_up = detail.get("memory_updated", False)
                        print(f"    记忆已更新: {mem_up}")
                    else:
                        print(f"    失败: {detail.get('error')}")
                ok("Heartbeat 全流程执行成功")
            else:
                err(f"业务失败: {result.get('error')}")
        else:
            err(f"HTTP {r.status_code}")

        # ─── 6. 教学建议 ───
        sep("6. 教学建议 -- AI 为教师生成班级教学策略")
        payload = {
            "teacher_id": 201,
            "course_id": 1,
            "class_avg_mastery": {
                "二叉树遍历": 0.65,
                "动态规划": 0.40,
                "贪心算法": 0.58,
            },
            "weak_knowledge_points": ["动态规划"],
            "at_risk_student_count": 1,
        }
        print(f"  班级平均掌握度: {json.dumps(payload['class_avg_mastery'], ensure_ascii=False)}")
        print(f"  最薄弱: 动态规划 (40%)")
        print(f"  预警学生: 1人")
        print()
        r = await client.post(f"{BASE}/api/agent/teaching-suggestion", json=payload)
        if r.status_code == 200:
            result = r.json()
            if result["success"]:
                sug = result["data"]
                print(f"  班级评估: {sug.get('summary')}")
                print(f"  薄弱知识点: {sug.get('weak_knowledge_points')}")
                print(f"  教学建议:")
                for i, s in enumerate(sug.get("teaching_suggestions", []), 1):
                    print(f"    {i}. {s}")
                print(f"  分组策略: {sug.get('grouping_strategy')}")
                print(f"  风险预警: {sug.get('risk_alert')}")
                ok("DeepSeek LLM 教学建议生成成功")
            else:
                err(f"业务失败: {result.get('error')}")
        else:
            err(f"HTTP {r.status_code}")

        # ─── 7. Mock 记忆查询 ───
        sep("7. Mock 记忆查询 (GET /api/agent/mock-memory/102)")
        r = await client.get(f"{BASE}/api/agent/mock-memory/102")
        if r.status_code == 200:
            data = r.json()["data"]
            print(f"  学生: 李四")
            print(f"  版本: v{data.get('version')}")
            print(f"  摘要: {data.get('summary')}")
            print(f"  趋势: {json.dumps(data.get('knowledge_mastery_trend'), ensure_ascii=False)}")
            print(f"  薄弱点: {data.get('weak_points')}")
            print(f"  优势: {data.get('strengths')}")
            print(f"  建议: {data.get('suggested_focus')}")
            ok("Mock 记忆查询成功")
        else:
            err(f"HTTP {r.status_code}")

    # ─── 总结 ───
    sep("演示完成")
    total = PASS + FAIL
    print(f"  通过: {PASS}/{total}")
    if FAIL > 0:
        print(f"  失败: {FAIL}/{total}")
    else:
        print(f"  全部通过! 5 个 LLM 端点均正常响应")
    print()
    print("  模块覆盖:")
    print("    模块6  -- 学习计划生成     POST /api/agent/learning-plan")
    print("    模块7  -- 智能提醒 + Heartbeat POST /api/agent/reminder")
    print("    模块7  -- Heartbeat 全流程   POST /api/agent/heartbeat")
    print("    模块9  -- 记忆增量更新        POST /api/agent/memory-update")
    print("    扩展   -- 教学建议生成        POST /api/agent/teaching-suggestion")
    print("    辅助   -- Mock 数据查询       GET  /api/agent/mock-*")
    print()


# ─── Mock 数据副本 (避免跨请求依赖) ───
MOCK_MEMORY_102 = {
    "version": 0,
    "last_updated": "2026-06-21",
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
}

MOCK_MEMORY_103 = {
    "version": 0,
    "last_updated": "2026-06-21",
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
}


if __name__ == "__main__":
    import asyncio
    asyncio.run(demo())
