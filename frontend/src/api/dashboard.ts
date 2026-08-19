import client from './client';
import type { DashboardData } from './types';

export type { DashboardData } from './types';

/** POST /api/dev/heartbeat/run — 手动触发 Heartbeat */
export async function triggerHeartbeat(): Promise<{ total: number; reminded: number }> {
  const { data } = await client.post('/dev/heartbeat/run');
  // 解析 Agent 返回的嵌套结果
  try {
    const result = JSON.parse(data.result);
    return { total: result.data?.total ?? 0, reminded: result.data?.success ?? 0 };
  } catch {
    return { total: 0, reminded: 0 };
  }
}

/** GET /api/courses/:courseId/dashboard */
export async function fetchDashboard(courseId: number): Promise<DashboardData> {
  const raw: any = await client.get(`/courses/${courseId}/dashboard`).then(r => r.data);
  return {
    completionRate: raw.completionRate ?? 0,
    activeRate: raw.activeRate ?? 0,
    riskStudentCount: raw.riskStudentCount ?? 0,
    activeTrend: Array.isArray(raw.activeTrend)
      ? raw.activeTrend.map((t: any) => ({ date: t.date, count: t.activeCount ?? 0 }))
      : [],
    weakKnowledgePoints: Array.isArray(raw.weakKnowledgePoints)
      ? raw.weakKnowledgePoints.map((n: any) => ({ nodeId: n.nodeId, label: n.name ?? '', avgScore: n.avgScore ?? 0 }))
      : [],
    riskStudents: Array.isArray(raw.riskStudents)
      ? raw.riskStudents.map((s: any) => ({
          studentId: s.userId ?? s.studentId ?? 0,
          name: s.name ?? '',
          avgMastery: s.avgMastery ?? 0,
          activeDays: s.activeDays ?? 0,
          lastLogin: s.lastLogin ?? '',
        }))
      : [],
  };
}
