import { apiClient } from '@/services/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  UserResponse,
} from '@/types/auth';

/**
 * Service autentikasi untuk komunikasi dengan endpoint /api/v1/auth
 * Menggunakan instance apiClient existing tanpa duplikasi prefix.
 */

/**
 * Registrasi pengguna baru.
 * POST /api/v1/auth/register
 */
export async function register(
  input: RegisterInput,
): Promise<ApiSuccessResponse<UserResponse>> {
  const payload: RegisterInput = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
  };

  const response = await apiClient.post<ApiSuccessResponse<UserResponse>>(
    '/auth/register',
    payload,
  );
  return response.data;
}

/**
 * Login pengguna dan mendapatkan token JWT.
 * POST /api/v1/auth/login
 */
export async function login(
  input: LoginInput,
): Promise<ApiSuccessResponse<AuthResponse>> {
  const payload: LoginInput = {
    email: input.email.trim().toLowerCase(),
    password: input.password,
  };

  const response = await apiClient.post<ApiSuccessResponse<AuthResponse>>(
    '/auth/login',
    payload,
  );
  return response.data;
}

/**
 * Logout pengguna.
 * POST /api/v1/auth/logout
 * Token dibuang di sisi client setelah request sukses.
 */
export async function logout(): Promise<ApiSuccessResponse<null>> {
  const response = await apiClient.post<ApiSuccessResponse<null>>('/auth/logout');
  return response.data;
}

/**
 * Mengambil data user yang sedang login berdasarkan token Bearer aktif.
 * GET /api/v1/auth/me
 */
export async function getMe(): Promise<ApiSuccessResponse<UserResponse>> {
  const response = await apiClient.get<ApiSuccessResponse<UserResponse>>('/auth/me');
  return response.data;
}

export const authService = {
  register,
  login,
  logout,
  getMe,
};
