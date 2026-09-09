import client from './client';
import { TOKEN_KEY } from '../utils/constants';
import type { LoginParams, RegisterParams, AuthResponse, AuthUser } from './types';

export type { AuthUser, AuthResponse } from './types';

/** POST /api/auth/login — 账号（用户名/邮箱/学号）+ 密码 */
export async function login(params: LoginParams): Promise<AuthResponse> {
  // 后端字段名仍为 email，语义是账号
  const data: Record<string, unknown> = await client
    .post('/auth/login', { email: params.account, password: params.password })
    .then((r) => r.data);

  const u = (data.user && typeof data.user === 'object')
    ? (data.user as Record<string, unknown>)
    : null;
  const token = data.token as string;

  // 先写入 token，供后续 getMe 带 Authorization
  localStorage.setItem(TOKEN_KEY, token);

  let id = Number(u?.id ?? data.userId ?? 0);
  let name = String(u?.realName ?? u?.name ?? data.name ?? '');
  let role = (u?.role ?? data.role) as 'TEACHER' | 'STUDENT';
  const username = u?.username != null ? String(u.username) : undefined;
  const mustChangePassword = Boolean(u?.mustChangePassword ?? data.mustChangePassword);
  let email = '';

  // 登录响应不含 email → 调 getMe 补全
  try {
    const me = await getMe();
    email = me.email;
    if (!name) name = me.name;
    if (!id) id = me.id;
    if (!role) role = me.role;
  } catch {
    // me 失败时仍返回登录主体信息
  }

  return {
    token,
    user: {
      id,
      name,
      username,
      email,
      role,
      mustChangePassword,
    },
  };
}

/** POST /api/auth/register */
export async function register(params: RegisterParams): Promise<AuthResponse> {
  const data: Record<string, unknown> = await client.post('/auth/register', params).then((r) => r.data);
  return {
    token: data.token as string,
    user: {
      id: data.userId as number,
      name: params.name,
      email: params.email,
      role: params.role,
    },
  };
}

/** GET /api/auth/me — 验证 token 并获取当前用户信息 */
export async function getMe(): Promise<AuthUser> {
  const data: Record<string, unknown> = await client.get('/auth/me').then((r) => r.data);
  return {
    id: data.userId as number,
    name: data.name as string,
    email: data.email as string,
    role: data.role as 'TEACHER' | 'STUDENT',
  };
}
