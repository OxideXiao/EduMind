/**
 * Mock 数据 — 严格对齐 Demo Seed Spec + api-spec.md
 */

export const DEMO_ACCOUNTS = [
  { userId: 2,   name: '陈老师', email: 'teacher2@demo.com', password: 'demo123456', role: 'TEACHER'  as const },
  { userId: 101, name: '张三',   email: 'student1@demo.com', password: 'demo123456', role: 'STUDENT'  as const },
  { userId: 102, name: '李四',   email: 'student2@demo.com', password: 'demo123456', role: 'STUDENT'  as const },
  { userId: 103, name: '王五',   email: 'student3@demo.com', password: 'demo123456', role: 'STUDENT'  as const },
];

export type DemoAccount = (typeof DEMO_ACCOUNTS)[number];

/** 生成 mock JWT token（格式：mock-jwt-{userId}-{timestamp}） */
export function mockToken(userId: number): string {
  return `mock-jwt-${userId}-${Date.now()}`;
}

/** 从 mock token 中解析 userId 并查找账户 */
export function resolveToken(token: string): DemoAccount | null {
  // mock jwt 格式: "mock-jwt-{userId}-{timestamp}"
  const jwtMatch = token.match(/^mock-jwt-(\d+)/);
  if (jwtMatch) {
    const userId = parseInt(jwtMatch[1], 10);
    return DEMO_ACCOUNTS.find((a) => a.userId === userId) ?? null;
  }
  // dev 模式 token: "dev-mock-token-{timestamp}" → 从 localStorage 读用户
  if (token.startsWith('dev-mock-token-')) {
    try {
      const raw = localStorage.getItem('top_user');
      if (!raw) return null;
      const user = JSON.parse(raw);
      return DEMO_ACCOUNTS.find((a) => a.userId === user.id) ?? null;
    } catch { return null; }
  }
  return null;
}
