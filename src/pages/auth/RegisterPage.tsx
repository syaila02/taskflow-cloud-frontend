import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { AxiosError } from 'axios';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { ApiErrorResponse } from '@/types/api';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Jika sudah terautentikasi, arahkan langsung ke workspace
  React.useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  const validateForm = (): boolean => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'Nama lengkap wajib diisi';
    } else if (trimmedName.length > 100) {
      errors.name = 'Nama maksimal 100 karakter';
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Format email tidak valid';
    } else if (trimmedEmail.length > 255) {
      errors.email = 'Email maksimal 255 karakter';
    }

    if (!password) {
      errors.password = 'Password wajib diisi';
    } else if (password.length < 8) {
      errors.password = 'Password minimal 8 karakter';
    } else if (password.length > 72) {
      errors.password = 'Password maksimal 72 karakter';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Konfirmasi password wajib diisi';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Konfirmasi password tidak cocok dengan password';
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
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      // Registrasi sukses (backend tidak mengembalikan token, jadi tampilkan success card)
      setIsSuccess(true);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;

      if (axiosError.response?.data) {
        const errorData = axiosError.response.data;

        // Tangani pesan conflict 409 (Email sudah terdaftar)
        if (axiosError.response.status === 409) {
          setGeneralError('Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.');
          setFieldErrors((prev) => ({ ...prev, email: 'Email sudah terdaftar' }));
        } else {
          setGeneralError(errorData.message || 'Registrasi gagal. Silakan periksa kembali data Anda.');
        }

        // Petakan error validasi spesifik field jika dikembalikan backend
        if (errorData.errors && errorData.errors.length > 0) {
          const newErrors: { name?: string; email?: string; password?: string } = {};
          errorData.errors.forEach((issue) => {
            if (issue.field?.includes('name')) {
              newErrors.name = issue.message;
            }
            if (issue.field?.includes('email')) {
              newErrors.email = issue.message;
            }
            if (issue.field?.includes('password')) {
              newErrors.password = issue.message;
            }
          });
          setFieldErrors((prev) => ({ ...prev, ...newErrors }));
        }
      } else {
        setGeneralError('Gagal terhubung ke server backend. Pastikan server aktif di port 3000.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Buat Akun TaskFlow"
      subtitle="Mulai kelola proyek dan kolaborasi tim Anda dalam satu workspace modern."
    >
      {isSuccess ? (
        <div className="space-y-5 text-center py-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-flow-dark">Registrasi Berhasil!</h3>
            <p className="text-xs text-flow-muted max-w-xs mx-auto leading-relaxed">
              Akun <strong className="text-flow-dark font-semibold">{email}</strong> telah berhasil dibuat. Silakan login untuk masuk ke workspace.
            </p>
          </div>

          <div className="pt-2">
            <Button
              className="w-full"
              size="md"
              onClick={() => navigate('/login')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Lanjut ke Halaman Login
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* General Error Alert */}
          {generalError && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{generalError}</div>
            </div>
          )}

          {/* Name Field */}
          <Input
            label="Nama Lengkap"
            placeholder="Contoh: Budi Pratama"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) {
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            error={fieldErrors.name}
            leftIcon={<UserIcon className="w-4 h-4" />}
            autoComplete="name"
            autoFocus
            disabled={isSubmitting}
          />

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
            disabled={isSubmitting}
          />

          {/* Password Field */}
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Minimal 8 karakter"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            error={fieldErrors.password}
            helperText="Gunakan 8-72 karakter demi keamanan akun Anda"
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
            autoComplete="new-password"
            disabled={isSubmitting}
          />

          {/* Confirm Password Field */}
          <Input
            label="Konfirmasi Password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Ketik ulang password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) {
                setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }
            }}
            error={fieldErrors.confirmPassword}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="p-1 text-slate-400 hover:text-flow-dark transition-colors focus:outline-none"
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            autoComplete="new-password"
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
              Daftar Akun Baru
            </Button>
          </div>

          {/* Switch to Login Link */}
          <div className="text-center pt-3 border-t border-flow-border/60 text-xs text-flow-muted">
            Sudah memiliki akun?{' '}
            <Link
              to="/login"
              className="font-semibold text-flow-primary hover:text-flow-primary-hover hover:underline transition-colors"
            >
              Masuk di sini
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
