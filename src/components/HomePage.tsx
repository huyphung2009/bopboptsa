import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  BookOpen,
  Clock,
  FileText,
  GraduationCap,
  LogIn,
  LogOut,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
} from 'lucide-react';
import React, { useState } from 'react';
import type { Exam } from '../types/exam';
import { AuthModal } from './AuthModal';
import { LeaderboardModal } from './LeaderboardModal';

interface HomePageProps {
  exams: Exam[];
  loading: boolean;
  fromFallback: boolean;
  user: SupabaseUser | null;
  studentName: string;
  onChangeStudentName: (name: string) => void;
  onStartExam: (exam: Exam) => void;
  onRefresh: () => void;
  onOpenAdmin: () => void;
  onSignOut: () => void;
  leaderboardRefreshKey: number;
}

export const HomePage: React.FC<HomePageProps> = ({
  exams,
  loading,
  fromFallback,
  user,
  studentName,
  onChangeStudentName,
  onStartExam,
  onRefresh,
  onOpenAdmin,
  onSignOut,
  leaderboardRefreshKey,
}) => {
  const [nameError, setNameError] = useState('');
  const [leaderboardExam, setLeaderboardExam] = useState<Exam | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingExam, setPendingExam] = useState<Exam | null>(null);

  const userAvatar = user?.user_metadata?.avatar_url as string | undefined;
  const userDisplayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split('@')[0] ||
    '';

  const handleStart = (exam: Exam) => {
    if (user || studentName.trim()) {
      setNameError('');
      onStartExam(exam);
      return;
    }
    setPendingExam(exam);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-700 to-rose-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 truncate">
                Bốp Bốp <span className="text-rose-700">TSA</span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Hệ thống luyện thi Đánh giá tư duy HUST
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 sm:px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              title="Làm mới danh sách đề"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Làm mới</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 pl-2 pr-2.5 py-1">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userDisplayName}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-rose-700 text-white text-xs font-bold flex items-center justify-center">
                    {(userDisplayName[0] || 'U').toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-800 max-w-[120px] truncate hidden sm:inline">
                  {userDisplayName}
                </span>
                <button
                  onClick={onSignOut}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-200 hover:text-rose-700 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setPendingExam(null);
                  setAuthModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Đăng nhập
              </button>
            )}

            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Quản trị</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero + Candidate Name / Auth Card */}
      <section className="bg-gradient-to-br from-red-800 via-rose-700 to-rose-600 text-white py-10 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-rose-100 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Chuẩn cấu trúc Đánh giá tư duy — Đại học Bách khoa Hà Nội
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Phòng thi mô phỏng TSA HUST
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-rose-100 leading-relaxed">
              Giao diện thông minh (Toán toàn màn hình, Đọc hiểu & Khoa học chia đôi ngữ
              liệu), công thức KaTeX sắc nét, đủ 4 dạng câu hỏi TSA, máy tính tích hợp và
              bảng xếp hạng trực tuyến.
            </p>
          </div>

          {/* Candidate Card */}
          <div className="mt-7 max-w-xl rounded-2xl bg-white p-4 sm:p-5 text-slate-900 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-2">
              <label
                htmlFor="student-name"
                className="block text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                {user
                  ? 'Thí sinh đã đăng nhập'
                  : 'Thi nhanh với tư cách Khách (hoặc đăng nhập Google)'}
              </label>
              {!user && (
                <button
                  type="button"
                  onClick={() => {
                    setPendingExam(null);
                    setAuthModalOpen(true);
                  }}
                  className="text-xs font-bold text-rose-700 hover:underline"
                >
                  Đăng nhập Google / Email →
                </button>
              )}
            </div>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="student-name"
                type="text"
                value={studentName}
                onChange={(e) => {
                  onChangeStudentName(e.target.value);
                  if (nameError) setNameError('');
                }}
                placeholder="Nhập Họ và tên của bạn (VD: Nguyễn Văn An)..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-rose-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-600/20"
              />
            </div>
            {nameError && (
              <p className="mt-2 text-xs font-medium text-rose-600">{nameError}</p>
            )}
          </div>
        </div>
      </section>

      {/* Exam List */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-rose-700" />
              Kho đề thi TSA
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Chọn một đề thi bên dưới để bắt đầu làm bài hoặc xem bảng xếp hạng.
            </p>
          </div>

          {fromFallback && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-800">
              Đang hiển thị đề mẫu mặc định (bảng exams trên Supabase đang trống)
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-56 rounded-2xl bg-white border border-slate-200 p-5 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                  <div className="h-6 w-3/4 bg-slate-200 rounded" />
                  <div className="h-4 w-full bg-slate-100 rounded" />
                </div>
                <div className="h-10 w-full bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {exams.map((exam) => (
              <article
                key={exam.id}
                className="group rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-rose-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                      {exam.section || 'Tổng hợp TSA'}
                    </span>
                    {exam.is_sample && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        Đề mẫu
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900 group-hover:text-rose-700 transition-colors line-clamp-2">
                    {exam.title}
                  </h4>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                    {exam.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <FileText className="w-4 h-4 text-slate-400" />
                      {exam.questions.length} câu hỏi
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {exam.duration_minutes} phút
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStart(exam)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 transition-colors"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Bắt đầu thi
                    </button>
                    <button
                      onClick={() => setLeaderboardExam(exam)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-colors"
                      title="Xem bảng xếp hạng"
                    >
                      <Trophy className="w-4 h-4" />
                      Top
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        Bốp Bốp TSA — Nền tảng luyện thi Đánh giá tư duy HUST
      </footer>

      <LeaderboardModal
        exam={leaderboardExam}
        refreshKey={leaderboardRefreshKey}
        onClose={() => setLeaderboardExam(null)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingExam(null);
        }}
        pendingExamTitle={pendingExam?.title}
        guestName={studentName}
        onChangeGuestName={onChangeStudentName}
        onContinueAsGuest={
          pendingExam
            ? () => {
                const target = pendingExam;
                setAuthModalOpen(false);
                setPendingExam(null);
                onStartExam(target);
              }
            : undefined
        }
      />
    </div>
  );
};
