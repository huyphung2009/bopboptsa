import { LogIn, Mail, Lock, User, UserPlus, X, Play } from 'lucide-react';
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-rose-900 px-6 py-4 text-white">
          <div>
            <h3 className="text-base font-bold">Tài khoản Bốp Bốp TSA</h3>
            {pendingExamTitle ? (
              <p className="text-xs text-rose-100 line-clamp-1 mt-0.5">
                Chuẩn bị thi: {pendingExamTitle}
              </p>
            ) : (
              <p className="text-xs text-slate-300 mt-0.5">
                Lưu điểm, đồng bộ lịch sử & xếp hạng
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-white/15 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto custom-scrollbar">
          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 active:scale-[0.99] transition-all shadow-xs disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
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
            <div className="flex-1 border-t border-slate-200" />
            <span className="px-3 text-xs font-medium text-slate-400 uppercase">
              Hoặc dùng Email
            </span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Login / Register Tabs */}
          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
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
              className={`rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {tab === 'register' && (
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Họ và tên hiển thị"
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm focus:border-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-600/20"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm focus:border-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-600/20"
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm focus:border-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-600/20"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-700">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-rose-700 py-2.5 text-sm font-bold text-white hover:bg-rose-800 disabled:opacity-50 transition-colors"
            >
              {loading
                ? 'Đang xử lý...'
                : tab === 'login'
                  ? 'Đăng nhập bằng Email'
                  : 'Tạo tài khoản mới'}
            </button>
          </form>

          {/* Guest Quick Exam Option */}
          {onContinueAsGuest && (
            <div className="pt-4 border-t border-slate-200 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Hoặc thi nhanh với tư cách Khách
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => {
                    onChangeGuestName?.(e.target.value);
                    if (guestError) setGuestError('');
                  }}
                  placeholder="Nhập Họ và tên thí sinh..."
                  className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-600/20"
                />
                <button
                  type="button"
                  onClick={handleGuestStart}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Thi ngay
                </button>
              </div>
              {guestError && (
                <p className="text-xs font-medium text-rose-600">{guestError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
