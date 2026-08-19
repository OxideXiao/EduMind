import type { Notification } from '../api/types';

function delay(ms?: number) {
  return new Promise<void>((r) => setTimeout(r, ms ?? 200 + Math.random() * 200));
}

/** 从 localStorage 取当前登录用户 ID */
function currentUserId(): number {
  try {
    const raw = localStorage.getItem('top_user');
    return raw ? JSON.parse(raw).id : 0;
  } catch { return 0; }
}

const NOW = new Date();
function ago(hours: number): string {
  return new Date(NOW.getTime() - hours * 3600_000).toISOString().slice(0, 19).replace('T', ' ');
}

/* ── 按用户隔离的通知数据（key: userId） ── */
function storageKey(userId: number) { return `mock_notifications_${userId}`; }
function readKey(userId: number)   { return `mock_notifications_read_${userId}`; }

function load(userId: number): Notification[] {
  try { return JSON.parse(localStorage.getItem(storageKey(userId)) || 'null') ?? []; } catch { return []; }
}
function save(userId: number, list: Notification[]) { localStorage.setItem(storageKey(userId), JSON.stringify(list)); }
function getRead(userId: number): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(readKey(userId)) || '[]')); } catch { return new Set(); }
}
function setRead(userId: number, ids: Set<number>) { localStorage.setItem(readKey(userId), JSON.stringify([...ids])); }

/** 首次初始化该用户的 mock 数据 */
function ensureData(userId: number) {
  if (localStorage.getItem(storageKey(userId))) return;
  // 教师（id=1）的演示通知
  if (userId === 1) {
    save(1, [
      { id: 1, userId: 1, courseId: 1, type: 'SYSTEM', title: '新测验已发布',
        content: '算法设计测验已发布至数据结构与算法课程，截止日期 2026-06-28。',
        isRead: false, createdAt: ago(2) },
      { id: 2, userId: 1, courseId: 1, type: 'ADVICE', title: '教学建议已生成',
        content: '针对动态规划薄弱点，已生成教学建议，请查看。',
        isRead: false, createdAt: ago(5) },
    ]);
  }
  // 张三（id=101）的演示通知
  if (userId === 101) {
    save(101, [
      { id: 101, userId: 101, courseId: 1, type: 'REMINDER', title: '学习提醒',
        content: '你的动态规划掌握度已降至 30%，建议今天完成 2 道 DP 练习题。',
        priority: 'HIGH', isRead: false, createdAt: ago(2) },
      { id: 102, userId: 101, courseId: 1, type: 'PLAN', title: '周计划已生成',
        content: '本周学习计划已生成，重点攻克动态规划与二叉树遍历。',
        isRead: false, createdAt: ago(5) },
      { id: 103, userId: 101, courseId: 1, type: 'SYSTEM', title: '测验提醒',
        content: '算法设计测验截止日期为 6 月 28 日，请尽快完成。',
        isRead: false, createdAt: ago(10) },
    ]);
  }
  // 王五（id=103）的演示通知
  if (userId === 103) {
    save(103, [
      { id: 201, userId: 103, courseId: 1, type: 'REMINDER', title: '紧急学习提醒',
        content: '你已连续 4 天未登录学习，多项掌握度偏低，请尽快恢复学习节奏。',
        priority: 'HIGH', isRead: false, createdAt: ago(2) },
      { id: 202, userId: 103, courseId: 1, type: 'REMINDER', title: '补考通知',
        content: '树与遍历测验成绩仅 35 分，建议重新复习后申请补测。',
        priority: 'HIGH', isRead: false, createdAt: ago(8) },
    ]);
  }
}

/** GET /api/notifications — 后端根据 JWT 中的 userId 过滤 */
export async function fetchNotifications(): Promise<{ unreadCount: number; items: Notification[] }> {
  await delay();
  const uid = currentUserId();
  ensureData(uid);
  const readIds = getRead(uid);
  const items = load(uid).map((n) => ({ ...n, isRead: n.isRead || readIds.has(n.id) }));
  return {
    unreadCount: items.filter((n) => !n.isRead).length,
    items: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

/** PATCH /api/notifications/{id}/read */
export async function markAsRead(id: number): Promise<void> {
  await delay(100);
  const uid = currentUserId();
  const ids = getRead(uid);
  ids.add(id);
  setRead(uid, ids);
}

/** PATCH /api/notifications/read-all */
export async function markAllAsRead(): Promise<void> {
  await delay(100);
  const uid = currentUserId();
  setRead(uid, new Set(load(uid).map((n) => n.id)));
}
