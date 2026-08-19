import client from './client';
import type { LoginParams, RegisterParams, AuthResponse, AuthUser } from './types';

export type { AuthUser, AuthResponse } from './types';

/**
 * 后端返回平铺格式 → 转换为前端期望的嵌套格式
 * 后端: { userId, name?, role, token } 或 { userId, name, email, role }
 * 前端: AuthResponse = { token, user: { id, name, email, role } }
 */

/** POST /api/auth/login */
export async function login(params: LoginParams): Promise<AuthResponse> {
  const data: Record<string, unknown> = await client.post('/auth/login', params).then(r => r.data);
  return {
    token: data.token as string,
    user: {
      id: data.userId as number,
      name: data.name as string,
      email: params.email,
      role: data.role as 'TEACHER' | 'STUDENT',
    },
  };
}

/** POST /api/auth/register */
export async function register(params: RegisterParams): Promise<AuthResponse> {
  const data: Record<string, unknown> = await client.post('/auth/register', params).then(r => r.data);
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
  const data: Record<string, unknown> = await client.get('/auth/me').then(r => r.data);
  return {
    id: data.userId as number,
    name: data.name as string,
    email: data.email as string,
    role: data.role as 'TEACHER' | 'STUDENT',
  };
}
