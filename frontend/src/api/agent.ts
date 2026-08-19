import client from './client';
import type { LearningPlan, TeachingAdvice } from './types';

export type { LearningPlan, TeachingAdvice } from './types';

/** 将后端 planContent 或 short_term/mid_term → 前端 LearningPlan */
function mapPlan(raw: any): LearningPlan {
  // generateLearningPlan 返回: { planId, summary, short_term, mid_term, motivation }
  // fetchLatestPlan 返回: { planId, planContent, generatedAt }
  const planContent = raw.planContent ?? raw;
  const dailyPlan: Array<{ day: string; tasks: string[] }> = [];

  // Agent 返回 short_term.daily_plan[{day, task, duration_min, knowledge_point}]
  const shortTerm = raw.short_term ?? planContent?.short_term;
  const midTerm = raw.mid_term ?? planContent?.mid_term;

  if (shortTerm && Array.isArray(shortTerm.daily_plan)) {
    shortTerm.daily_plan.forEach((d: any) => {
      const task = d.task ?? '';
      dailyPlan.push({
        day: `第${d.day}天`,
        tasks: task ? [task] : [],
      });
    });
  }
  if (midTerm && Array.isArray(midTerm.weekly_plan)) {
    midTerm.weekly_plan.forEach((w: any) => {
      dailyPlan.push({
        day: w.week ?? '',
        tasks: Array.isArray(w.tasks) ? w.tasks : (w.task ? [w.task] : []),
      });
    });
  }

  return {
    id: raw.planId ?? raw.id ?? 0,
    week: shortTerm?.focus ?? planContent?.week ?? '',
    summary: raw.summary ?? planContent?.summary ?? '',
    dailyPlan,
    motivation: raw.motivation ?? planContent?.motivation ?? '',
  };
}

/** POST /api/courses/:courseId/agent/learning-plan */
export async function generateLearningPlan(courseId: number): Promise<LearningPlan> {
  const raw: any = await client.post(`/courses/${courseId}/agent/learning-plan`).then(r => r.data);
  return mapPlan(raw);
}

/** GET /api/courses/:courseId/learning-plans/latest */
export async function fetchLatestPlan(courseId: number): Promise<LearningPlan | null> {
  const raw: any = await client.get(`/courses/${courseId}/learning-plans/latest`).then(r => r.data);
  // planId === 0 表示无计划
  if (!raw || raw.planId === 0) return null;
  return mapPlan(raw);
}

/** POST /api/courses/:courseId/agent/teaching-suggestion */
export async function generateTeachingAdvice(courseId: number): Promise<TeachingAdvice> {
  const raw: any = await client.post(`/courses/${courseId}/agent/teaching-suggestion`).then(r => r.data);
  // 后端 suggestions 是 string[]，前端期望 { id, content, priority }[]
  const suggestions = Array.isArray(raw.suggestions)
    ? raw.suggestions.map((s: any, i: number) => ({
        id: i + 1,
        content: typeof s === 'string' ? s : (s.content ?? ''),
        priority: (typeof s === 'object' ? s.priority : raw.priority) ?? 'MEDIUM',
      }))
    : [];
  return {
    problem: raw.problem ?? '',
    suggestions,
  };
}
