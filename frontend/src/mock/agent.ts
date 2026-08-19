import type { LearningPlan, TeachingAdvice } from '../api/types';

function delay(ms?: number) {
  return new Promise<void>((r) => setTimeout(r, ms ?? 600 + Math.random() * 400));
}

// 用 localStorage 模拟后端数据库存储（刷新不丢失）
function getSavedPlan(): LearningPlan | null {
  try { return JSON.parse(localStorage.getItem('mock_learning_plan') || 'null'); } catch { return null; }
}
function setSavedPlan(plan: LearningPlan) {
  localStorage.setItem('mock_learning_plan', JSON.stringify(plan));
}

/** GET /api/courses/{courseId}/learning-plans/latest */
export async function fetchLatestPlan(courseId: number): Promise<LearningPlan | null> {
  await delay(300);
  return getSavedPlan();
}

/** POST /api/courses/{courseId}/agent/learning-plan */
export async function generateLearningPlan(courseId: number): Promise<LearningPlan> {
  await delay(1500);
  const plan: LearningPlan = {
    id: 2001, week: '2026-W25',
    summary: '本周重点攻克动态规划，复习二叉树遍历与栈队列基础，保持数组和链表的熟练度。',
    dailyPlan: [
      { day: '周一', tasks: ['观看动态规划入门视频（30min）', '完成 2 道 DP 基础练习题'] },
      { day: '周二', tasks: ['复习二叉树遍历（前序/中序/后序）', '完成树与遍历回顾测验'] },
      { day: '周三', tasks: ['学习贪心算法基础概念', '对比贪心与 DP 的适用场景'] },
      { day: '周四', tasks: ['栈与队列综合练习', '整理二叉树章节的错题笔记'] },
      { day: '周五', tasks: ['数组与链表算法练习', '完成本周知识点总结与自测'] },
    ],
    motivation: '学习如逆水行舟，不进则退。今天的每一分努力，都会在期末化为扎实的功底。',
  };
  setSavedPlan(plan);
  return plan;
}

/** POST /api/courses/{courseId}/agent/teaching-suggestion */
export async function generateTeachingAdvice(courseId: number): Promise<TeachingAdvice> {
  await delay(1500);
  return {
    problem: '动态规划章节全班掌握度偏低（均值 35%），建议本周安排专题讲解。',
    suggestions: [
      { id: 1, content: '将动态规划与贪心算法对比讲解，帮助学生理解两种算法的本质区别与适用场景。', priority: 'HIGH' },
      { id: 2, content: '每讲完一个 DP 类型后立即安排 2-3 道对应练习，当堂批改反馈。', priority: 'MEDIUM' },
      { id: 3, content: '组织一次课后答疑，集中解答学生在 DP 题中遇到的共性问题。', priority: 'MEDIUM' },
      { id: 4, content: '推荐 LeetCode 动态规划入门题单，鼓励课外练习并记录心得。', priority: 'LOW' },
    ],
  };
}
