import { AlertCircle, Lock, LogIn, Mail, User, UserPlus, X } from 'lucide-react';
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Logo } from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingExamTitle?: string;
  notice?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  pendingExamTitle,
  notice,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#261118]/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[26px] bg-white/95 dark:bg-[#1b0d13]/95 backdrop-blur-2xl shadow-[0_32px_90px_-28px_rgba(38,17,24,0.45)] border border-[var(--line)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[#fff6f7]/75 dark:bg-[#241219]/65">
          <div className="flex items-center gap-2.5 min-w-0">
            <Logo className="w-6 h-6 shrink-0 text-[#2a161b] dark:text-[#fbbac3]" />
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-[#2a161b] dark:text-[#fff2f4]">
                {pendingExamTitle ? 'Vào phòng thi' : 'Đăng nhập Parabol'}
              </h3>
              {pendingExamTitle ? (
                <p className="text-xs text-[#876870] dark:text-[#c49ba3] truncate mt-0.5">
                  {pendingExamTitle}
                </p>
              ) : (
                <p className="text-xs text-[#876870] dark:text-[#c49ba3] mt-0.5">
                  Đồng bộ điểm số, XP &amp; bảng xếp hạng
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-[#876870] hover:text-crimson hover:bg-[#ffeff1] dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto custom-scrollbar">
          {notice && (
            <div className="rounded-2xl border border-[#dc263e]/30 bg-[#fff5f6] dark:bg-[#2a121a] px-4 py-3 flex items-start gap-2.5 text-xs font-medium text-[#b91c30] dark:text-[#fbbac3]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{notice}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn btn-pill w-full !py-2.5 !text-sm"
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
            <div className="flex-1 border-t border-[var(--line)]" />
            <span className="px-3 text-[11px] font-medium text-[#876870] dark:text-[#b88c95] uppercase">
              Hoặc Email
            </span>
            <div className="flex-1 border-t border-[var(--line)]" />
          </div>

          {/* Login / Register Pill Tabs */}
          <div className="grid grid-cols-2 rounded-full bg-[#fff5f6] dark:bg-[#241219] border border-[var(--line)] p-1">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`rounded-full py-1.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'login'
                  ? 'bg-crimson text-white shadow-xs'
                  : 'text-[#876870] dark:text-[#c49ba3] hover:text-crimson'
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
              className={`rounded-full py-1.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'register'
                  ? 'bg-crimson text-white shadow-xs'
                  : 'text-[#876870] dark:text-[#c49ba3] hover:text-crimson'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {tab === 'register' && (
              <div className="relative">
                <User className="w-4 h-4 text-[#876870] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Họ và tên hiển thị"
                  className="w-full rounded-full border border-[var(--line)] bg-white dark:bg-[#13090d] pl-10 pr-4 py-2 text-sm text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:ring-2 focus:ring-crimson/15 focus:outline-none"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="w-4 h-4 text-[#876870] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-full border border-[var(--line)] bg-white dark:bg-[#13090d] pl-10 pr-4 py-2 text-sm text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:ring-2 focus:ring-crimson/15 focus:outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-[#876870] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                className="w-full rounded-full border border-[var(--line)] bg-white dark:bg-[#13090d] pl-10 pr-4 py-2 text-sm text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:ring-2 focus:ring-crimson/15 focus:outline-none"
              />
            </div>

            {error && (
              <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 px-3.5 py-2 text-xs font-medium text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 px-3.5 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-crimson w-full !py-2.5"
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
