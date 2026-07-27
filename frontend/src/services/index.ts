import axios from 'axios';
import { getAccessToken } from '@/lib/auth';

export const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    const isAuthEndpoint =
      config.url?.includes('/accounts/token/') ||
      config.url?.includes('/accounts/register/');
    if (token && config.headers && !isAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
