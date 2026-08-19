import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TOKEN_KEY } from '../utils/constants';
import type { Role } from '../utils/constants';

/** 双重检查：React state + localStorage */
function hasToken(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

function getSavedRole(): Role | null {
  try {
    const raw = localStorage.getItem('top_user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user.role ?? null;
  } catch {
    return null;
  }
}

/** 需要登录才能访问 */
export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated && !hasToken()) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** 需要特定角色 */
export function RequireRole({ role }: { role: Role }) {
  const { role: userRole } = useAuth();
  const savedRole = userRole ?? getSavedRole();
  if (savedRole !== role) return <Navigate to="/courses" replace />;
  return <Outlet />;
}

/** 已登录用户访问登录页 → 重定向到首页 */
export function RedirectIfAuth() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated || hasToken()) return <Navigate to="/courses" replace />;
  return <Outlet />;
}
