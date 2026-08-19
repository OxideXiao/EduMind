"""
演示数据种子脚本
用法: python seed/seed_data.py
功能: 向Spring后端（或Mock模式）写入预填充数据
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import json
from datetime import date
from services.spring_client import SpringClient, MOCK_MEMORIES
from config import MOCK_SPRING

# ─── 演示学生（3个不同层次，展示差异化AI能力） ───
STUDENTS = [
    {
        "student_id": 101, "student_name": "张三",
        "profile": "优等生 — 展示AI如何帮助好学生保持状态",
    },
    {
        "student_id": 102, "student_name": "李四",
        "profile": "中等生 — 展示AI识别薄弱点并给出针对性建议",
    },
    {
        "student_id": 103, "student_name": "王五",
        "profile": "预警学生 — 展示AI风险检测和干预能力",
    },
]


async def seed():
    """执行种子数据写入"""
    client = SpringClient()

    print("=" * 60)
    print("  CoStrict AI — 演示数据种子脚本")
    print(f"  Mock模式: {MOCK_SPRING}")
    print("=" * 60)
    print()

    if MOCK_SPRING:
        print("[Mock模式] 内存数据已预填充在 spring_client.py 中")
        print()
        for sid, memory in MOCK_MEMORIES.items():
            student = next((s for s in STUDENTS if s["student_id"] == sid), None)
            name = student["student_name"] if student else f"学生{sid}"
            print(f"  ✅ {name} (id={sid})")
            print(f"     掌握知识点: {len(memory.get('knowledge_mastery_trend', {}))}个")
            print(f"     薄弱点: {memory.get('weak_points', [])}")
            print(f"     优势: {memory.get('strengths', [])}")
            print()

    print("-" * 60)
    print("  接下来你可以:")
    print()
    print("  1. 启动 Agent 服务:")
    print("     cd agent-service && python main.py")
    print()
    print("  2. 手动触发 Heartbeat:")
    print("     curl -X POST http://localhost:8000/api/agent/heartbeat")
    print()
    print("  3. 生成学习计划:")
    print("     curl -X POST http://localhost:8000/api/agent/learning-plan \\")
    print('       -H "Content-Type: application/json" \\')
    print('       -d \'{"student_id":102,"student_name":"李四","course_id":1,')
    print('             "course_name":"数据结构与算法","knowledge_mastery":')
    print('             {"二叉树遍历":0.65,"动态规划":0.3,"贪心算法":0.55}}\'')
    print()
    print("  4. 查看 Mock 学生数据:")
    print("     curl http://localhost:8000/api/agent/mock-students")
    print()
    print("  5. 查看 Mock 记忆数据:")
    print("     curl http://localhost:8000/api/agent/mock-memory/101")
    print("-" * 60)

    await client.close()


if __name__ == "__main__":
    asyncio.run(seed())
