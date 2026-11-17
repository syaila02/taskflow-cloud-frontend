import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import type { ApiErrorResponse } from '@/types/api';

/**
 * Axios instance terpusat untuk komunikasi dengan backend TaskFlow Cloud.
 * baseURL diarahkan ke /api/v1 sesuai konfigurasi environment.
 */
export const apiClient = axios.create({
  baseURL: env.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Request Interceptor:
 * Menambahkan Authorization Bearer token jika token tersimpan di localStorage.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('taskflow_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response Interceptor:
 * Menangani error standar dari backend TaskFlow Cloud.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    // Jika 401 Unauthorized dan bukan di rute login/register, hapus token lokal
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('taskflow_token');
        // Tidak force reload jika window undefined
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          // Siap untuk diarahkan ke login saat implementasi routing
        }
      }
    }
    return Promise.reject(error);
  },
);
