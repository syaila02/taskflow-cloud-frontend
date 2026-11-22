/**
 * Interface data pengguna (User) sesuai dengan respons backend TaskFlow Cloud.
 * Berdasarkan publicUserSelect di backend (id, name, email, createdAt, updatedAt).
 */
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Payload request registrasi pengguna baru (POST /api/v1/auth/register).
 * Sesuai validasi registerSchema di backend:
 * - name: string (1-100 karakter, trim)
 * - email: string (1-255 karakter, format email valid)
 * - password: string (8-72 karakter)
 */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

/**
 * Payload request login pengguna (POST /api/v1/auth/login).
 * Sesuai validasi loginSchema di backend:
 * - email: string (format email valid)
 * - password: string (minimal 1 karakter)
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Format data pada response data sukses login (POST /api/v1/auth/login).
 * data: { token, user }
 */
export interface AuthResponse {
  token: string;
  user: User;
}

/**
 * Format data pada response data user (POST /auth/register, GET /auth/me).
 * data: { user }
 */
export interface UserResponse {
  user: User;
}
