import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  ArrowRight,
  Award,
  BarChart3,
  Clock,
  FileText,
  LogOut,
  Moon,
  RefreshCw,
  Shield,
  Sun,
  Trophy,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import type { UserProfile } from '../lib/profileService';
import type { Exam, ExamType } from '../types/exam';
import { EXAM_TYPES, getExamTypeMeta, normalizeExamType } from '../utils/examTypes';
import { AuthModal } from './AuthModal';
import { ExamModeModal } from './ExamModeModal';
import { LeaderboardModal } from './LeaderboardModal';
import { Logo } from './Logo';
import { MyScoreboardModal } from './MyScoreboardModal';
import { RankBadge, XpProgressBar } from './RankBadge';
import { RanksModal } from './RanksModal';
import { resolveExamSections } from '../utils/examSections';

interface HomePageProps {
  exams: Exam[];
  loading: boolean;
  fromFallback: boolean;
  user: SupabaseUser | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  studentName: string;
  isDark: boolean;
  onToggleDark: () => void;
  onChangeStudentName: (name: string) => void;
  onStartExam: (exam: Exam, targetSectionId?: string) => void;
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
  profile,
  isAdmin,
  isSuperAdmin,
  studentName,
  isDark,
  onToggleDark,
  onChangeStudentName,
  onStartExam,
  onRefresh,
  onOpenAdmin,
  onSignOut,
  leaderboardRefreshKey,
}) => {
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardInitialTab, setLeaderboardInitialTab] = useState<'xp' | 'exam'>('xp');
  const [leaderboardExam, setLeaderboardExam] = useState<Exam | null>(null);
  const [ranksModalOpen, setRanksModalOpen] = useState(false);
  const [scoreboardOpen, setScoreboardOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingExam, setPendingExam] = useState<Exam | null>(null);
  const [modeSelectExam, setModeSelectExam] = useState<Exam | null>(null);
  const [selectedExamType, setSelectedExamType] = useState<'ALL' | ExamType>('ALL');

  const filteredExams = useMemo(() => {
    if (selectedExamType === 'ALL') return exams;
    return exams.filter((e) => normalizeExamType(e.exam_type) === selectedExamType);
  }, [exams, selectedExamType]);

  const userAvatar = user?.user_metadata?.avatar_url as string | undefined;
  const userDisplayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split('@')[0] ||
    '';

  const proceedWithExam = (exam: Exam) => {
    const sections = resolveExamSections(exam);
    if (sections.length > 1) {
      setModeSelectExam(exam);
    } else {
      onStartExam(exam);
    }
  };

  const handleEnterExam = (exam: Exam) => {
    if (user) {
      proceedWithExam(exam);
      return;
    }
    setPendingExam(exam);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      {/* Frosted-Glass Minimalist Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-slate-200/80 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2.5 shrink-0">
              <Logo className="w-6 h-6 shrink-0 text-slate-900 dark:text-zinc-100" />
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                Parabol
              </span>
            </div>

            <nav className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setLeaderboardExam(null);
                  setLeaderboardInitialTab('xp');
                  setLeaderboardOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Bảng xếp hạng</span>
              </button>
              <button
                type="button"
                onClick={() => setRanksModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
              >
                <Award className="w-3.5 h-3.5 text-[#B91C1C] dark:text-red-400" />
                <span className="hidden sm:inline">Cấp bậc & Danh hiệu</span>
              </button>
              <button
                type="button"
                onClick={() => setScoreboardOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span className="hidden sm:inline">Bảng điểm</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onToggleDark}
              className="rounded-lg p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={isDark ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
              aria-label="Chuyển giao diện Sáng/Tối"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenAdmin}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors ${
                isAdmin || isSuperAdmin
                  ? 'border-red-200 dark:border-red-900/70 bg-red-50/70 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-100/70'
                  : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isSuperAdmin ? 'Super Admin' : 'Quản trị'}
              </span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-1.5 pr-2 py-1">
                <button
                  type="button"
                  onClick={() => setRanksModalOpen(true)}
                  className="flex items-center gap-2.5 text-left hover:opacity-85 transition-opacity"
                  title="Xem Hồ sơ Cấp bậc & XP"
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userDisplayName}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-red-700 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      {(userDisplayName[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <div className="hidden md:flex flex-col min-w-[120px] max-w-[180px] gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                        {userDisplayName}
                      </span>
                      <RankBadge xp={profile?.xp ?? 0} compact />
                    </div>
                    <XpProgressBar xp={profile?.xp ?? 0} showLabel={false} />
                  </div>
                </button>
                <button
                  onClick={onSignOut}
                  className="rounded-md p-1 text-slate-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Đăng xuất"
                  aria-label="Đăng xuất"
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
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" aria-hidden="true">
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
                <span className="hidden sm:inline">Đăng nhập bằng Google</span>
                <span className="sm:hidden">Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Minimalist Intro */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-slate-200/80 dark:border-zinc-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-red-700 dark:text-red-500 mb-2">
              Nền tảng luyện thi đánh giá năng lực & tư duy trực tuyến
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              Kho đề thi Parabol
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-zinc-400 max-w-xl leading-relaxed">
              Không gian luyện thi tối giản cho TSA, HSA, V-ACT, QDA, V-SAT và BCA với công
              thức KaTeX sắc nét và bảng xếp hạng trực tuyến.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {fromFallback && (
              <span className="rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-slate-500 dark:text-zinc-400">
                Đề mẫu mặc định
              </span>
            )}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Minimalist Exam Type Filter Pill Tabs */}
        <div className="mt-6 flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedExamType('ALL')}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedExamType === 'ALL'
                ? 'border-slate-900 dark:border-zinc-100 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
          >
            Tất cả
          </button>
          {EXAM_TYPES.map((t) => {
            const active = selectedExamType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setSelectedExamType(t.value)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? 'border-[#B91C1C] bg-[#B91C1C] text-white'
                    : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Clean Exam Cards Grid */}
        <section className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-44 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 animate-pulse flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="h-4 w-24 bg-slate-100 dark:bg-zinc-800 rounded" />
                    <div className="h-5 w-3/4 bg-slate-100 dark:bg-zinc-800 rounded" />
                  </div>
                  <div className="h-9 w-full bg-slate-100 dark:bg-zinc-800 rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                Chưa có đề thi nào cho kỳ thi {selectedExamType}.
              </p>
              <button
                type="button"
                onClick={() => setSelectedExamType('ALL')}
                className="mt-3 text-xs font-semibold text-[#B91C1C] dark:text-red-400 hover:underline"
              >
                Xem tất cả đề thi
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredExams.map((exam) => {
                const typeMeta = getExamTypeMeta(normalizeExamType(exam.exam_type));
                return (
                  <article
                    key={exam.id}
                    className="group rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between gap-5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold shrink-0 ${typeMeta.badgeClass}`}
                          >
                            {typeMeta.shortLabel}
                          </span>
                          <span className="inline-flex items-center rounded-md border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/70 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-zinc-300 truncate">
                            {exam.section || 'Tổng hợp'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 shrink-0">
                          <span className="inline-flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            {exam.questions.length} câu
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {exam.duration_minutes} phút
                          </span>
                        </div>
                      </div>

                      <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100 leading-snug line-clamp-2">
                        {exam.title}
                      </h2>
                      {exam.anti_cheat !== false && (
                        <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-slate-200/80 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-950 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:text-zinc-400">
                          <Shield className="w-3 h-3 text-[#B91C1C] dark:text-red-400" />
                          Giám sát nghiêm túc
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                      <button
                        onClick={() => {
                          setLeaderboardExam(exam);
                          setLeaderboardInitialTab('exam');
                          setLeaderboardOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Trophy className="w-3.5 h-3.5 text-slate-400" />
                        Bảng xếp hạng
                      </button>

                      <button
                        onClick={() => handleEnterExam(exam)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-700 hover:bg-red-800 px-4 py-2 text-xs font-semibold text-white transition-colors"
                      >
                        Vào thi
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-slate-200/80 dark:border-zinc-800 py-5 text-center text-xs text-slate-400 dark:text-zinc-500">
        Parabol — Nền tảng luyện thi đánh giá năng lực & tư duy trực tuyến
      </footer>

      <LeaderboardModal
        isOpen={leaderboardOpen}
        exams={exams}
        initialExam={leaderboardExam}
        initialTab={leaderboardInitialTab}
        currentUserId={user?.id}
        refreshKey={leaderboardRefreshKey}
        onClose={() => setLeaderboardOpen(false)}
      />

      <RanksModal
        isOpen={ranksModalOpen}
        user={user}
        profile={profile}
        onClose={() => setRanksModalOpen(false)}
        onOpenAuth={() => {
          setPendingExam(null);
          setAuthModalOpen(true);
        }}
      />

      <MyScoreboardModal
        isOpen={scoreboardOpen}
        user={user}
        exams={exams}
        onClose={() => setScoreboardOpen(false)}
        onOpenAuth={() => {
          setPendingExam(null);
          setAuthModalOpen(true);
        }}
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
                proceedWithExam(target);
              }
            : undefined
        }
      />

      <ExamModeModal
        exam={modeSelectExam}
        onClose={() => setModeSelectExam(null)}
        onStartFullExam={(ex) => {
          setModeSelectExam(null);
          onStartExam(ex);
        }}
        onStartSection={(ex, sectionId) => {
          setModeSelectExam(null);
          onStartExam(ex, sectionId);
        }}
      />
    </div>
  );
};
