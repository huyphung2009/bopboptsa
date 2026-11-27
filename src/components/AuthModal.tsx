import { ArrowRight, Lock, LogIn, Mail, User, UserPlus, X } from 'lucide-react';
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Logo } from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingExamTitle?: string;
  guestName?: string;
  onChangeGuestName?: (name: string) => void;
  onContinueAsGuest?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  pendingExamTitle,
  guestName = '',
  onChangeGuestName,
  onContinueAsGuest,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [guestError, setGuestError] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError(signInError.message);
        } else {
          onClose();
        }
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim() || email.split('@')[0],
            },
          },
        });
        if (signUpError) {
          setError(signUpError.message);
        } else {
          setSuccessMsg(
            'Đăng ký thành công! Nếu Supabase yêu cầu xác nhận email, hãy kiểm tra hộp thư của bạn.'
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi xác thực.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestStart = () => {
    if (!guestName.trim()) {
      setGuestError('Vui lòng nhập Họ và tên để thi nhanh.');
      return;
    }
    setGuestError('');
    onContinueAsGuest?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <Logo className="w-6 h-6 shrink-0 text-slate-900 dark:text-zinc-100" />
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                {pendingExamTitle ? 'Vào phòng thi' : 'Đăng nhập Parabol'}
              </h3>
              {pendingExamTitle ? (
                <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                  {pendingExamTitle}
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Đồng bộ điểm số, XP & bảng xếp hạng
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto custom-scrollbar">
          {/* Guest Quick Exam Option (top priority if entering exam) */}
          {onContinueAsGuest && (
            <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 p-4 space-y-2.5">
              <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Thi nhanh với tư cách Khách
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => {
                    onChangeGuestName?.(e.target.value);
                    if (guestError) setGuestError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGuestStart();
                  }}
                  placeholder="Nhập Họ và tên thí sinh..."
                  className="flex-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:border-red-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleGuestStart}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 hover:bg-red-800 px-3.5 py-2 text-xs font-semibold text-white transition-colors shrink-0"
                >
                  Vào thi
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {guestError && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  {guestError}
                </p>
              )}
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-xs disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            Đăng nhập bằng Google
          </button>

          <div className="relative flex items-center">
            <div className="flex-1 border-t border-slate-200/80 dark:border-zinc-800" />
            <span className="px-3 text-[11px] font-medium text-slate-400 uppercase">
              Hoặc Email
            </span>
            <div className="flex-1 border-t border-slate-200/80 dark:border-zinc-800" />
          </div>

          {/* Login / Register Tabs */}
          <div className="grid grid-cols-2 rounded-lg bg-slate-100 dark:bg-zinc-800 p-1">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`rounded-md py-1.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'login'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`rounded-md py-1.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'register'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {tab === 'register' && (
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Họ và tên hiển thị"
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-zinc-100 focus:border-red-700 focus:outline-none"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-zinc-100 focus:border-red-700 focus:outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-zinc-100 focus:border-red-700 focus:outline-none"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 dark:bg-zinc-100 py-2 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            >
              {loading
                ? 'Đang xử lý...'
                : tab === 'login'
                  ? 'Đăng nhập bằng Email'
                  : 'Tạo tài khoản'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
