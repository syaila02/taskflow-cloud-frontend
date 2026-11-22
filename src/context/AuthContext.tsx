import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authService } from '@/services/auth.service';
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  User,
} from '@/types/auth';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<AuthResponse>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AUTH_TOKEN_KEY = 'taskflow_token';

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Inisialisasi sesi saat aplikasi pertama kali dibuka.
   * 1. Periksa token di localStorage.
   * 2. Jika ada, validasi dengan memanggil getMe().
   * 3. Jika valid, simpan user ke state.
   * 4. Jika invalid atau expired, bersihkan token dan reset session.
   */
  const initAuth = useCallback(async () => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.getMe();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
      }
    } catch {
      // Token tidak valid atau kedaluwarsa
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  /**
   * Login user:
   * 1. Panggil authService.login(input).
   * 2. Simpan token ke localStorage dengan key taskflow_token.
   * 3. Simpan data user ke state.
   */
  const login = useCallback(async (input: LoginInput): Promise<AuthResponse> => {
    const response = await authService.login(input);
    const { token, user: loggedInUser } = response.data;

    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setUser(loggedInUser);

    return response.data;
  }, []);

  /**
   * Register user baru:
   * 1. Panggil authService.register(input).
   * 2. Backend hanya mengembalikan user, bukan token.
   * 3. Return user untuk keperluan notifikasi UI.
   */
  const register = useCallback(async (input: RegisterInput): Promise<User> => {
    const response = await authService.register(input);
    return response.data.user;
  }, []);

  /**
   * Logout user:
   * 1. Panggil authService.logout() untuk memberi tahu server.
   * 2. Selalu bersihkan token di localStorage dan reset state user (stateless JWT).
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch {
      // Abaikan error network saat logout
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setUser(null);
    }
  }, []);

  /**
   * Refresh data user aktif dari backend.
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const response = await authService.getMe();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      }
    } catch {
      // Abaikan jika gagal refresh background
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook untuk mengakses AuthContext dengan error handling jika di luar provider.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
