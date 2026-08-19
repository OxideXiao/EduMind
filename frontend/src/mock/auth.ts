/**
 * Mock Auth — 与真实 API 共享 api/types.ts 类型
 *
 * 切换方式：改 import 路径即可
 *   import { login } from '../../api/auth'   ← 真实后端
 *   import { login } from '../../mock/auth'  ← 当前 Mock
 */

import type { AuthUser, LoginParams, RegisterParams, AuthResponse } from '../api/types';
import { DEMO_ACCOUNTS, mockToken, resolveToken } from './data';

function delay(ms?: number) {
  return new Promise<void>((r) => setTimeout(r, ms ?? 350 + Math.random() * 350));
}

export async function login(params: LoginParams): Promise<AuthResponse> {
  await delay();
  const account = DEMO_ACCOUNTS.find(
    (a) => a.email === params.email && a.password === params.password,
  );
  if (!account) throw new Error('邮箱或密码错误');
  return {
    token: mockToken(account.userId),
    user: { id: account.userId, name: account.name, email: account.email, role: account.role },
  };
}

export async function register(params: RegisterParams): Promise<AuthResponse> {
  await delay();
  if (DEMO_ACCOUNTS.some((a) => a.email === params.email)) throw new Error('该邮箱已被注册');
  const newId = 200 + Math.floor(Math.random() * 100);
  return {
    token: mockToken(newId),
    user: { id: newId, name: params.name, email: params.email, role: params.role },
  };
}

/** GET /api/auth/me — 验证 token 有效性，返回当前用户 */
export async function getMe(token: string): Promise<AuthUser> {
  await delay(100);
  const user = resolveToken(token);
  if (!user) throw new Error('Token 无效或已过期');
  return { id: user.userId, name: user.name, email: user.email, role: user.role };
}
