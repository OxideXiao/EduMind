import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { TOKEN_KEY, Role } from '../utils/constants';
import type { AuthUser } from '../api/types';
import { getMe } from '../api/auth';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  role: Role | null;
}

interface AuthContextValue extends AuthState {
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  isTeacher: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadAuth(): AuthState {
  const token = localStorage.getItem(TOKEN_KEY);
  const userStr = localStorage.getItem('top_user');
  if (token && userStr) {
    try {
      const user: AuthUser = JSON.parse(userStr);
      return { user, token, isAuthenticated: true, role: user.role };
    } catch {
      // corrupted data — clear
    }
  }
  return { user: null, token: null, isAuthenticated: false, role: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>(loadAuth);
  const [validated, setValidated] = useState(false);

  // 启动时调用 GET /api/auth/me 验证 token 有效性
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setValidated(true); return; }

    getMe()
      .then((user) => {
        localStorage.setItem('top_user', JSON.stringify(user));
        setAuthState({ user, token, isAuthenticated: true, role: user.role });
      })
      .catch(() => {
        // token 无效 → 清除
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('top_user');
        setAuthState({ user: null, token: null, isAuthenticated: false, role: null });
      })
      .finally(() => setValidated(true));
  }, []);

  const setAuth = useCallback((user: AuthUser, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('top_user', JSON.stringify(user));
    setAuthState({ user, token, isAuthenticated: true, role: user.role });
    // 通知通知组件刷新
    window.dispatchEvent(new StorageEvent('storage', { key: TOKEN_KEY, oldValue: '', newValue: token }));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('top_user');
    setAuthState({ user: null, token: null, isAuthenticated: false, role: null });
    // 通知其他组件（如 NotificationProvider）清空数据
    window.dispatchEvent(new StorageEvent('storage', { key: TOKEN_KEY, oldValue: '', newValue: null }));
  }, []);

  const value: AuthContextValue = {
    ...auth,
    setAuth,
    logout,
    isTeacher: auth.role === Role.TEACHER,
    isStudent: auth.role === Role.STUDENT,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useRole() {
  const { role } = useAuth();
  return {
    isTeacher: role === Role.TEACHER,
    isStudent: role === Role.STUDENT,
    role,
  };
}
