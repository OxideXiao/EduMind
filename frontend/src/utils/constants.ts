/** 用户角色 */
export enum Role {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

/** localstorage key */
export const TOKEN_KEY = 'top_token';

/** API base URL — Vite proxy 转发到 Spring 8080 */
export const API_BASE = '/api';
