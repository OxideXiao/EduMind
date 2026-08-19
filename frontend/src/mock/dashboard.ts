import type { DashboardData } from '../api/types';

function delay() {
  return new Promise<void>((r) => setTimeout(r, 350 + Math.random() * 300));
}

/** 模板数据，每门课稍有差异 */
function makeDashboard(courseId: number, studentCount: number): DashboardData {
  return {
    completionRate: 55 + courseId * 8,
    activeRate: 60 + courseId * 5,
    riskStudentCount: courseId === 1 ? 1 : courseId === 2 ? 0 : 1,
    weakKnowledgePoints: courseId === 1
      ? [
          { nodeId: 15, label: '动态规划', avgScore: 30 },
          { nodeId: 16, label: '贪心算法', avgScore: 45 },
          { nodeId: 14, label: '最短路径', avgScore: 52 },
          { nodeId: 10, label: '二叉树遍历', avgScore: 55 },
          { nodeId: 13, label: '哈夫曼树', avgScore: 58 },
        ]
      : courseId === 2
      ? [
          { nodeId: 20, label: '进程调度', avgScore: 38 },
          { nodeId: 22, label: '虚拟内存', avgScore: 44 },
          { nodeId: 24, label: '死锁检测', avgScore: 50 },
          { nodeId: 21, label: '线程同步', avgScore: 55 },
          { nodeId: 25, label: '文件系统', avgScore: 60 },
        ]
      : [
          { nodeId: 30, label: 'TCP拥塞控制', avgScore: 35 },
          { nodeId: 32, label: 'IP路由算法', avgScore: 42 },
          { nodeId: 34, label: 'DNS解析', avgScore: 53 },
          { nodeId: 31, label: 'HTTP协议', avgScore: 58 },
          { nodeId: 35, label: '网络安全', avgScore: 62 },
        ],
    riskStudents: courseId === 1
      ? [{ studentId: 103, name: '王五', avgMastery: 28, activeDays: 1, lastLogin: '2026-06-19' }]
      : courseId === 3
      ? [{ studentId: 115, name: '韩七', avgMastery: 32, activeDays: 2, lastLogin: '2026-06-21' }]
      : [],
    activeTrend: Array.from({ length: 7 }, (_, i) => {
      const d = new Date('2026-06-17');
      d.setDate(d.getDate() + i);
      return {
        date: d.toISOString().slice(0, 10),
        count: Math.round(studentCount * (0.5 + Math.random() * 0.4)),
      };
    }),
  };
}

/** 记录 Heartbeat 是否执行过（模拟后端数据库状态变更） */
export function getHeartbeatTime(): string | null {
  return localStorage.getItem('mock_heartbeat_time');
}

/** GET /api/courses/{courseId}/dashboard */
export async function fetchDashboard(courseId: number): Promise<DashboardData> {
  await delay();
  const sc = courseId === 1 ? 20 : courseId === 2 ? 18 : courseId === 3 ? 15 : 0;
  const data = makeDashboard(courseId, sc);
  // 如果 Heartbeat 已执行过，更新风险数据（张三被标记为风险）
  if (getHeartbeatTime() && courseId === 1) {
    data.riskStudentCount = 2;
    data.riskStudents = [
      ...data.riskStudents,
      { studentId: 101, name: '张三', avgMastery: 65, activeDays: 2, lastLogin: '2026-06-22' },
    ];
    data.completionRate = 60;
    data.activeRate = 55;
  }
  return data;
}
