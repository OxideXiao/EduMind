import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { Notification } from '../api/types';
import { fetchNotifications, markAsRead, markAllAsRead } from '../api/notification';
import { TOKEN_KEY } from '../utils/constants';

interface NotificationCtx {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => void;
  readOne: (id: number) => Promise<void>;
  readAll: () => Promise<void>;
}

const Ctx = createContext<NotificationCtx | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const lastToken = useRef<string | null>(null);

  const refresh = useCallback(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    // 未登录时清空 + 跳过
    if (!token) {
      setItems([]);
      setLoading(false);
      lastToken.current = null;
      return;
    }
    // 切换账号时清空旧数据
    if (lastToken.current && lastToken.current !== token) {
      setItems([]);
    }
    lastToken.current = token;
    fetchNotifications()
      .then((res) => setItems(res.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    // 监听 localStorage 变化（跨标签页 + 退出登录立即生效）
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) {
        if (!e.newValue) { setItems([]); lastToken.current = null; }
        else refresh();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => { clearInterval(t); window.removeEventListener('storage', onStorage); };
  }, [refresh]);

  const readOne = useCallback(async (id: number) => {
    await markAsRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const readAll = useCallback(async () => {
    await markAllAsRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <Ctx.Provider value={{ items, unreadCount, loading, refresh, readOne, readAll }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
