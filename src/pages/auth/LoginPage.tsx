import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { AxiosError } from 'axios';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { ApiErrorResponse } from '@/types/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // Jika sudah terautentikasi, arahkan langsung ke workspace
  React.useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Format email tidak valid';
    }

    if (!password) {
      errors.password = 'Password wajib diisi';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      // Login berhasil -> diarahkan ke dashboard
      navigate('/', { replace: true });
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data) {
        const errorData = axiosError.response.data;
        setGeneralError(errorData.message || 'Email atau password salah');

        // Petakan error validasi spesifik field jika dikembalikan backend
        if (errorData.errors && errorData.errors.length > 0) {
          const newErrors: { email?: string; password?: string } = {};
          errorData.errors.forEach((issue) => {
            if (issue.field?.includes('email')) {
              newErrors.email = issue.message;
            }
            if (issue.field?.includes('password')) {
              newErrors.password = issue.message;
            }
          });
          setFieldErrors(newErrors);
        }
      } else {
        setGeneralError('Gagal terhubung ke backend. Pastikan server aktif di port 3000.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Selamat Datang Kembali"
      subtitle="Masuk ke workspace TaskFlow Cloud untuk melanjutkan pekerjaan Anda."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General Error Alert */}
        {generalError && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{generalError}</div>
          </div>
        )}

        {/* Email Field */}
        <Input
          label="Email"
          type="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) {
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }
          }}
          error={fieldErrors.email}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
          autoFocus
          disabled={isSubmitting}
        />

        {/* Password Field with Show/Hide Toggle */}
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }
          }}
          error={fieldErrors.password}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-slate-400 hover:text-flow-dark transition-colors focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          autoComplete="current-password"
          disabled={isSubmitting}
        />

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            className="w-full"
            size="md"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Masuk ke Workspace
          </Button>
        </div>

        {/* Switch to Register Link */}
        <div className="text-center pt-3 border-t border-flow-border/60 text-xs text-flow-muted">
          Belum memiliki akun?{' '}
          <Link
            to="/register"
            className="font-semibold text-flow-primary hover:text-flow-primary-hover hover:underline transition-colors"
          >
            Daftar sekarang
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
