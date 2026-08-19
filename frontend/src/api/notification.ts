import client from './client';
import type { Notification } from './types';

export type { Notification } from './types';

/** 后端 notificationId → 前端 id */
function mapNotification(raw: any): Notification {
  return {
    id: raw.notificationId ?? raw.id ?? 0,
    userId: raw.userId ?? raw.receiverId ?? 0,
    courseId: raw.courseId ?? 0,
    type: raw.type ?? raw.notificationType ?? 'SYSTEM',
    title: raw.title ?? '',
    content: raw.content ?? '',
    priority: raw.priority,
    isRead: raw.isRead ?? (raw.read === 1),
    createdAt: raw.createdAt ?? '',
  };
}

/** GET /api/notifications — 后端返回 { unreadCount, items } */
export async function fetchNotifications(): Promise<{ unreadCount: number; items: Notification[] }> {
  const raw: any = await client.get('/notifications').then(r => r.data);
  return {
    unreadCount: raw.unreadCount ?? 0,
    items: Array.isArray(raw.items) ? raw.items.map(mapNotification) : [],
  };
}

/** PATCH /api/notifications/:id/read */
export async function markAsRead(notificationId: number): Promise<void> {
  await client.patch(`/notifications/${notificationId}/read`);
}

/** PATCH /api/notifications/read-all */
export async function markAllAsRead(): Promise<void> {
  await client.patch('/notifications/read-all');
}
