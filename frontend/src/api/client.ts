import axios from 'axios';
import { API_BASE, TOKEN_KEY } from '../utils/constants';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 180000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截：自动注入 JWT
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截：自动解包 Result<T> + 401 处理
client.interceptors.response.use(
  (res) => {
    // 后端统一响应格式 Result<T> = { code, data, message }
    // 自动解包：code === 200 时直接返回 data 字段
    const body = res.data;
    if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
      if (body.code !== 200) {
        const msg = body.message || '请求失败';
        return Promise.reject(new Error(msg));
      }
      res.data = body.data;
    }
    return res;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      // 避免在 /login 页面时重复跳转造成死循环
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default client;
