import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  Clock,
  FileText,
  Flame,
  Layers,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Shield,
  Trophy,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import cardImage2 from '../../image/ảnh 2.png';
import type { TargetGoalPayload, UserProfile } from '../lib/profileService';
import type { Exam } from '../types/exam';
import { resolveExamSections } from '../utils/examSections';
import { getExamTypeMeta, normalizeExamType } from '../utils/examTypes';
import { AuthModal } from './AuthModal';
import { CloudBackdrop } from './CloudBackdrop';
import { ExamModeModal } from './ExamModeModal';
import { LeaderboardModal } from './LeaderboardModal';
import { LegalModal, type LegalTab } from './LegalModal';
import { Logo } from './Logo';
import { MistTyper } from './MistTyper';
import { ParticleCanvas } from './ParticleCanvas';
import { RankBadge, XpProgressBar } from './RankBadge';
import { RanksModal } from './RanksModal';
import { TargetGoalModal } from './TargetGoalModal';
import { TargetGoalWidget } from './TargetGoalWidget';

interface HomePageProps {
  exams: Exam[];
  loading: boolean;
  fromFallback: boolean;
  user: SupabaseUser | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  onStartExam: (exam: Exam, targetSectionId?: string, mode?: 'exam' | 'practice') => void;
  onRefresh: () => void;
  onOpenAdmin: () => void;
  onOpenBounty: () => void;
  onSignOut: () => void;
  onSaveTargetGoal: (goal: TargetGoalPayload) => Promise<void>;
  leaderboardRefreshKey: number;
}

type SectionFilter = 'ALL' | 'Tổng hợp' | 'Tư duy Toán học' | 'Tư duy Đọc hiểu' | 'Tư duy Khoa học';

const TSA_SECTION_FILTERS: { value: SectionFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'Tổng hợp', label: 'Đề tổng hợp' },
  { value: 'Tư duy Toán học', label: 'Tư duy Toán học' },
  { value: 'Tư duy Đọc hiểu', label: 'Tư duy Đọc hiểu' },
  { value: 'Tư duy Khoa học', label: 'Tư duy Khoa học' },
];

export const HomePage: React.FC<HomePageProps> = ({
  exams,
  loading,
  fromFallback,
  user,
  profile,
  isAdmin,
  isSuperAdmin,
  onStartExam,
  onRefresh,
  onOpenAdmin,
  onOpenBounty,
  onSignOut,
  onSaveTargetGoal,
  leaderboardRefreshKey,
}) => {
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardInitialTab, setLeaderboardInitialTab] = useState<'xp' | 'exam'>('xp');
  const [leaderboardExam, setLeaderboardExam] = useState<Exam | null>(null);
  const [ranksModalOpen, setRanksModalOpen] = useState(false);
  const [targetGoalOpen, setTargetGoalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [pendingExam, setPendingExam] = useState<Exam | null>(null);
  const [modeSelectExam, setModeSelectExam] = useState<Exam | null>(null);
  const [legalTab, setLegalTab] = useState<LegalTab | null>(null);

  const [selectedSection, setSelectedSection] = useState<SectionFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyProctored, setOnlyProctored] = useState(false);
  const [onlyMultiSection, setOnlyMultiSection] = useState(false);

  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const filteredExams = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return exams.filter((exam) => {
      if (selectedSection !== 'ALL') {
        const secLower = (exam.section ?? '').toLowerCase();
        if (selectedSection === 'Tổng hợp') {
          if (!secLower.includes('tổng hợp') && resolveExamSections(exam).length <= 1) {
            return false;
          }
        } else {
          const keyword =
            selectedSection === 'Tư duy Toán học'
              ? 'toán'
              : selectedSection === 'Tư duy Đọc hiểu'
                ? 'đọc'
                : 'khoa học';
          const hasSectionMatch =
            secLower.includes(keyword) ||
            exam.questions.some((q) => q.section.toLowerCase().includes(keyword));
          if (!hasSectionMatch) return false;
        }
      }
      if (onlyProctored && exam.anti_cheat === false) {
        return false;
      }
      if (onlyMultiSection && resolveExamSections(exam).length <= 1) {
        return false;
      }
      if (query) {
        const haystack = `${exam.title} ${exam.description} ${exam.section ?? ''} TSA`.toLowerCase();
        return haystack.includes(query);
      }
      return true;
    });
  }, [exams, selectedSection, searchQuery, onlyProctored, onlyMultiSection]);

  const userAvatar = user?.user_metadata?.avatar_url as string | undefined;
  const userDisplayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split('@')[0] ||
    '';

  const proceedWithExam = (exam: Exam) => {
    setModeSelectExam(exam);
  };

  const handleEnterExam = (exam: Exam) => {
    if (user) {
      setAuthNotice(null);
      proceedWithExam(exam);
      return;
    }
    setPendingExam(exam);
    setAuthNotice('Vui lòng đăng nhập tài khoản để làm bài và xem lời giải');
    setAuthModalOpen(true);
  };

  const scrollToSection = (id: string) => {
    setDrawerOpen(false);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-white dark:bg-[#13090d] text-[#2a161b] dark:text-[#fff2f4]">
      {/* ============================================================
          FLOATING CAPSULE HEADER (LIKE IMAGE 2)
         ============================================================ */}
      <header
        className={`site-header fixed top-0 inset-x-0 z-40 px-3 sm:px-6 pt-3 sm:pt-4 pointer-events-none ${
          scrolled ? 'is-scrolled' : ''
        }`}
      >
        <div className="pointer-events-auto mx-auto flex h-[54px] sm:h-[58px] max-w-[1220px] items-center justify-between gap-3 rounded-full site-nav-pill pl-4 sm:pl-6 pr-2 sm:pr-2.5">
          {/* Left: Brand + Desktop Navigation */}
          <div className="flex items-center gap-5 lg:gap-7 min-w-0">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 rounded-full py-1 pr-1 shrink-0 group"
            >
              <Logo className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300 group-hover:scale-105 text-[#2a161b]" />
              <span className="text-[15.5px] font-semibold tracking-[-0.02em] text-crimson">
                parabol
              </span>
            </a>

            <nav className="hidden lg:flex items-center gap-0.5" aria-label="Điều hướng chính">
              <button
                type="button"
                onClick={() => scrollToSection('exam-library')}
                className="rounded-full px-3 py-1.5 text-[13.5px] text-[#5e4249] hover:bg-[#fff5f6] hover:text-crimson transition-all cursor-pointer"
              >
                Kho đề thi
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeaderboardExam(null);
                  setLeaderboardInitialTab('xp');
                  setLeaderboardOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13.5px] text-[#5e4249] hover:bg-[#fff5f6] hover:text-crimson transition-all cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                Bảng xếp hạng
              </button>
              <button
                type="button"
                onClick={() => setRanksModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13.5px] text-[#5e4249] hover:bg-[#fff5f6] hover:text-crimson transition-all cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-crimson" />
                Cấp bậc &amp; Danh hiệu
              </button>
              <button
                type="button"
                onClick={onOpenBounty}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13.5px] font-medium text-crimson bg-[#fff5f6] hover:bg-[#ffe8ec] transition-all cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-crimson" />
                Truy nã câu khó
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('manifesto')}
                className="rounded-full px-3 py-1.5 text-[13.5px] text-[#5e4249] hover:bg-[#fff5f6] hover:text-crimson transition-all cursor-pointer"
              >
                Giới thiệu
              </button>
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenAdmin}
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all cursor-pointer ${
                isAdmin || isSuperAdmin
                  ? 'bg-[#ffeff1] text-[#b91c30] hover:bg-[#ffe0e4]'
                  : 'text-[#5e4249] hover:bg-[#fff5f6] hover:text-crimson'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-crimson" />
              <span>{isSuperAdmin ? 'Super Admin' : 'Quản trị'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[#fff6f7]/90 pl-1.5 pr-2 py-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setRanksModalOpen(true)}
                  className="flex items-center gap-2 text-left hover:opacity-85 transition-opacity cursor-pointer"
                  title="Xem Hồ sơ Cấp bậc & XP"
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userDisplayName}
                      className="w-7 h-7 rounded-full object-cover border border-[var(--line)] shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-crimson text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      {(userDisplayName[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <div className="hidden md:flex flex-col min-w-[115px] max-w-[170px] gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#2a161b] truncate">
                        {userDisplayName}
                      </span>
                      <RankBadge xp={profile?.xp ?? 0} compact />
                    </div>
                    <XpProgressBar xp={profile?.xp ?? 0} showLabel={false} />
                  </div>
                </button>
                <button
                  onClick={onSignOut}
                  className="rounded-full p-1.5 text-[#876870] hover:text-crimson hover:bg-[#ffeff1] transition-colors cursor-pointer"
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
                className="btn btn-crimson !py-2.5 !px-4 !text-[13px]"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#ffffff"
                    d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
                  />
                </svg>
                <span className="hidden sm:inline">Đăng nhập Google</span>
                <span className="sm:hidden">Đăng nhập</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden grid h-9 w-9 place-items-center rounded-full bg-[#fff5f6] border border-[var(--line)] text-[#2a161b] hover:border-crimson/50 transition cursor-pointer"
              aria-label="Mở menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[#261118]/35 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[86%] max-w-[360px] bg-white/95 dark:bg-[#190c11]/95 backdrop-blur-2xl px-6 pb-10 pt-5 shadow-2xl border-l border-[var(--line)] flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Logo className="w-6 h-6 text-[#2a161b] dark:text-[#fbbac3]" />
                <span className="text-[15px] font-semibold text-crimson">parabol</span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#fff5f6] dark:hover:bg-white/10 text-[#5e4249] dark:text-[#ebc9cf]"
                aria-label="Đóng menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="mt-7 space-y-1.5 flex-1">
              <button
                type="button"
                onClick={() => scrollToSection('exam-library')}
                className="w-full text-left rounded-2xl px-3.5 py-3 text-[15px] text-[#5e4249] dark:text-[#ebc9cf] hover:bg-[#fff5f6] dark:hover:bg-white/5 hover:text-crimson transition"
              >
                Kho đề thi
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  setLeaderboardExam(null);
                  setLeaderboardInitialTab('xp');
                  setLeaderboardOpen(true);
                }}
                className="w-full text-left rounded-2xl px-3.5 py-3 text-[15px] text-[#5e4249] dark:text-[#ebc9cf] hover:bg-[#fff5f6] dark:hover:bg-white/5 hover:text-crimson transition"
              >
                Bảng xếp hạng
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  setRanksModalOpen(true);
                }}
                className="w-full text-left rounded-2xl px-3.5 py-3 text-[15px] text-[#5e4249] dark:text-[#ebc9cf] hover:bg-[#fff5f6] dark:hover:bg-white/5 hover:text-crimson transition"
              >
                Cấp bậc &amp; Danh hiệu
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  onOpenBounty();
                }}
                className="w-full text-left rounded-2xl px-3.5 py-3 text-[15px] font-medium text-crimson hover:bg-[#fff5f6] transition flex items-center gap-2"
              >
                <Flame className="w-4 h-4" />
                Truy nã câu khó
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  onOpenAdmin();
                }}
                className="w-full text-left rounded-2xl px-3.5 py-3 text-[15px] text-[#5e4249] hover:bg-[#fff5f6] hover:text-crimson transition"
              >
                {isSuperAdmin ? 'Super Admin' : 'Quản trị đề thi'}
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* ============================================================
          HERO — WHITE-ROSE CLOUD ATMOSPHERE + PARTICLES + PILLS
         ============================================================ */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
        <CloudBackdrop />
        <ParticleCanvas />

        <div className="relative mx-auto max-w-[1040px] px-4 sm:px-6">
          <div className="mx-auto max-w-[780px] text-center">
            {/* Typing Display Headline with Crimson-Mist Cursor */}
            <h1 className="mx-auto mt-2 max-w-[820px] text-[clamp(2rem,5vw,3.55rem)] font-normal leading-[1.12] tracking-[-0.032em] text-[#2a161b]">
              <MistTyper
                text="Chinh phục mọi kỳ thi đánh giá tư duy"
                baseDelay={42}
                jitter={20}
                startDelay={180}
              />
            </h1>

            <p className="mx-auto mt-4 max-w-[560px] text-[14.5px] sm:text-[15.5px] leading-relaxed text-[#876870] dark:text-[#c49ba3]">
              Không gian luyện thi trực tuyến thanh thoát, chia đôi ngữ liệu thông minh, tích lũy XP và bảng xếp hạng thời gian thực.
            </p>

            {/* THREE FROSTED ACTION PILLS */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => scrollToSection('exam-library')}
                className="btn btn-pill !py-2.5 !px-4.5 !text-[13px]"
              >
                <BookOpen className="w-4 h-4 text-crimson" />
                Kho đề thi ({exams.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeaderboardExam(null);
                  setLeaderboardInitialTab('xp');
                  setLeaderboardOpen(true);
                }}
                className="btn btn-pill !py-2.5 !px-4.5 !text-[13px]"
              >
                <Trophy className="w-4 h-4 text-amber-500" />
                Bảng xếp hạng
              </button>
              <button
                type="button"
                onClick={() => setRanksModalOpen(true)}
                className="btn btn-pill !py-2.5 !px-4.5 !text-[13px]"
              >
                <Award className="w-4 h-4 text-crimson" />
                Lộ trình Cấp bậc
              </button>
            </div>

            <p className="mt-6 text-[11.5px] tracking-wide text-[#876870]/90 dark:text-[#b88c95]/85">
              Tư duy Toán học &nbsp;·&nbsp; Tư duy Đọc hiểu &nbsp;·&nbsp; Tư duy Khoa học &nbsp;·&nbsp; TSA HUST
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          TARGET GOAL MILESTONE & EXAM LIBRARY
         ============================================================ */}
      <main className="flex-1">
        {/* Milestone / Target Goal Block (for logged-in users) */}
        {user && (
          <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 mb-10 sm:mb-14">
            <TargetGoalWidget
              userId={user.id}
              profile={profile}
              exams={exams}
              refreshKey={leaderboardRefreshKey}
              onOpenModal={() => setTargetGoalOpen(true)}
            />
          </div>
        )}

        <section id="exam-library" className="relative mx-auto max-w-[1200px] px-4 sm:px-6 pb-20 sm:pb-28 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className="h-px w-8"
                  style={{ background: 'linear-gradient(90deg, #dc263e, #f799a6)' }}
                />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-crimson">
                  Kho đề trực tuyến
                </span>
              </div>
              <h2 className="mt-3 text-[clamp(1.65rem,3.4vw,2.35rem)] font-normal leading-[1.15] tracking-[-0.03em] text-[#2a161b] dark:text-[#fff2f4]">
                Chọn đề thi để bắt đầu
              </h2>
              <p className="mt-2 text-[14.5px] text-[#876870] dark:text-[#c49ba3]">
                Hiển thị{' '}
                <span className="font-mono font-semibold text-crimson">
                  {filteredExams.length}
                </span>{' '}
                đề thi phù hợp trên hệ thống.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {fromFallback && (
                <span className="rounded-full border border-[var(--line)] bg-[#fff5f6] dark:bg-[#241219] px-3 py-1.5 text-xs text-[#5e4249] dark:text-[#fbbac3]">
                  Đề mẫu mặc định
                </span>
              )}
              <button
                onClick={onRefresh}
                disabled={loading}
                className="btn btn-pill btn-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-crimson ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
            </div>
          </div>

          {/* Frosted Segmented Section Tabs */}
          <div
            className="mt-7 inline-flex max-w-full flex-wrap gap-1.5 rounded-3xl sm:rounded-full border border-[var(--line)] bg-[#fff5f6]/85 dark:bg-[#1d0f15]/85 p-1.5 backdrop-blur-md"
            role="tablist"
            aria-label="Lọc theo phân môn TSA"
          >
            {TSA_SECTION_FILTERS.map((item) => {
              const active = selectedSection === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedSection(item.value)}
                  className={`tab-btn ${active ? 'is-active' : ''}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Compact Search & Quick Filters inside Exam Library */}
          <div className="prompt-box mt-4 rounded-2xl sm:rounded-full px-3.5 py-2 flex flex-col md:flex-row md:items-center gap-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-0 px-1">
              <Search className="w-4 h-4 text-[#876870] dark:text-[#b88c95] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm đề thi TSA (Toán học, Đọc hiểu, Khoa học...)"
                aria-label="Tìm kiếm đề thi"
                className="w-full bg-transparent text-[13.5px] text-[#2a161b] dark:text-[#fff2f4] placeholder:text-[#876870]/75 dark:placeholder:text-[#b88c95]/70 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="rounded-full p-1 text-[#876870] hover:text-crimson hover:bg-[#ffeff1] dark:hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setOnlyProctored((v) => !v)}
                className={`mode-pill !py-1.5 !px-3 !text-[12px] ${onlyProctored ? 'is-active' : ''}`}
                aria-pressed={onlyProctored}
              >
                <Shield className="w-3 h-3" />
                Giám sát nghiêm túc
              </button>
              <button
                type="button"
                onClick={() => setOnlyMultiSection((v) => !v)}
                className={`mode-pill !py-1.5 !px-3 !text-[12px] ${onlyMultiSection ? 'is-active' : ''}`}
                aria-pressed={onlyMultiSection}
              >
                <Layers className="w-3 h-3" />
                Nhiều phần thi
              </button>
            </div>
          </div>

          {/* Exam Cards Grid */}
          <div className="mt-7">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="glass-card h-52 rounded-[24px] p-6 animate-pulse flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="h-5 w-28 bg-[#f4d5da]/70 dark:bg-white/10 rounded-full" />
                      <div className="h-6 w-3/4 bg-[#f4d5da]/70 dark:bg-white/10 rounded-lg" />
                    </div>
                    <div className="h-10 w-full bg-[#f4d5da]/60 dark:bg-white/10 rounded-full" />
                  </div>
                ))}
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="glass-card rounded-[26px] p-12 text-center">
                <p className="text-sm font-medium text-[#2a161b] dark:text-[#fff2f4]">
                  Không tìm thấy đề thi phù hợp với bộ lọc hiện tại.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSection('ALL');
                    setSearchQuery('');
                    setOnlyProctored(false);
                    setOnlyMultiSection(false);
                  }}
                  className="btn btn-pill btn-sm mt-4"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredExams.map((exam) => {
                  const typeMeta = getExamTypeMeta(normalizeExamType(exam.exam_type));
                  const sectionsCount = resolveExamSections(exam).length;
                  return (
                    <article
                      key={exam.id}
                      className="aura-border lift-card glass-card group rounded-[24px] p-6 flex flex-col justify-between gap-5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shrink-0 ${typeMeta.badgeClass}`}
                            >
                              {typeMeta.shortLabel}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-white/85 dark:bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-[#5e4249] dark:text-[#ebc9cf] truncate">
                              {exam.section || 'Tổng hợp'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#876870] dark:text-[#c49ba3] shrink-0 font-mono">
                            <span className="inline-flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-crimson" />
                              {exam.questions.length} câu
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-crimson" />
                              {exam.duration_minutes}p
                            </span>
                          </div>
                        </div>

                        <h3 className="text-[17px] font-medium text-[#2a161b] dark:text-[#fff2f4] leading-snug line-clamp-2 group-hover:text-crimson transition-colors">
                          {exam.title}
                        </h3>

                        {exam.description && (
                          <p className="mt-1.5 text-[13px] text-[#876870] dark:text-[#c49ba3] line-clamp-2 leading-relaxed">
                            {exam.description}
                          </p>
                        )}

                        <div className="mt-3.5 flex flex-wrap items-center gap-2">
                          {exam.anti_cheat !== false && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dc263e]/20 bg-[#ffeff1]/85 dark:bg-[#dc263e]/15 px-2.5 py-0.5 text-[11px] font-medium text-[#b91c30] dark:text-[#fbbac3]">
                              <Shield className="w-3 h-3 text-crimson" />
                              Giám sát 5 lớp
                            </span>
                          )}
                          {sectionsCount > 1 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white/80 dark:bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-[#5e4249] dark:text-[#ebc9cf]">
                              <Layers className="w-3 h-3 text-roseAccent" />
                              {sectionsCount} phần thi nối tiếp
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 pt-4 border-t border-[var(--line)]">
                        <button
                          type="button"
                          onClick={() => {
                            setLeaderboardExam(exam);
                            setLeaderboardInitialTab('exam');
                            setLeaderboardOpen(true);
                          }}
                          className="btn btn-pill btn-sm"
                        >
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          Bảng xếp hạng
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEnterExam(exam)}
                          className="btn btn-crimson btn-sm flex-1"
                        >
                          Vào thi ngay
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ============================================================
            SHOWCASE SPLIT — OPEN EDITORIAL ELEMENTS + FULL-BLEED CARD 2
           ============================================================ */}
        <section className="relative mx-auto max-w-[1200px] px-4 sm:px-6 pb-20 sm:pb-28">
          <div className="grid gap-10 lg:gap-12 lg:grid-cols-2 items-center">
            {/* Left Side: Unboxed Open Elements (giống ảnh 2) */}
            <div className="flex flex-col items-start py-2 lg:pr-4">
              <span className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-crimson">
                Miễn phí cho mọi thí sinh
              </span>

              <h3 className="mt-3 text-[clamp(1.75rem,3.4vw,2.45rem)] font-semibold leading-[1.15] tracking-[-0.025em] text-[#2a161b]">
                Luyện tập &amp;{' '}
                <span className="text-crimson">Tích lũy XP</span>
              </h3>

              <p className="mt-4 max-w-[460px] text-[15px] leading-relaxed text-[#5e4249]">
                Chinh phục bảng vàng với hệ thống 6 cấp bậc hội tụ từ Khởi điểm đến Huyền thoại Parabol.
              </p>

              <ul className="mt-6 space-y-3.5 text-[14px] text-[#3b2229]">
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#dc263e]/20 bg-[#ffeff1] text-crimson">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  Hiển thị công thức Toán &amp; Khoa học bằng LaTeX sắc nét
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#dc263e]/20 bg-[#ffeff1] text-crimson">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  Đầy đủ 4 dạng câu hỏi: Trắc nghiệm, Đúng/Sai, Kéo thả, Điền số
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#dc263e]/20 bg-[#ffeff1] text-crimson">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  Chấm điểm thang 100 kèm lời giải chi tiết sau khi nộp bài
                </li>
              </ul>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => setRanksModalOpen(true)}
                  className="btn btn-crimson"
                >
                  Xem lộ trình Cấp bậc
                </button>
              </div>
            </div>

            {/* Card 2: Full-Bleed Ảnh 2 + Chữ trắng nổi trực tiếp trên ảnh + Hiệu ứng đổi bóng */}
            <div className="card-shadow-shift group relative flex flex-col justify-between overflow-hidden rounded-[26px] sm:rounded-[32px] border border-[var(--line)] bg-wine p-7 sm:p-10 min-h-[380px] sm:min-h-[410px] text-white">
              <img
                src={cardImage2}
                alt="Tòa nhà C1 Đại học Bách khoa Hà Nội"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[center_26%] transition-transform duration-700 group-hover:scale-[1.04]"
              />

              <div className="relative z-10 flex flex-1 flex-col justify-center">
                <h3 className="text-[clamp(1.45rem,2.8vw,2rem)] font-medium leading-[1.15] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
                  Mô phỏng áp lực thi thật
                </h3>
                <p className="mt-3 max-w-[420px] text-[14.5px] leading-relaxed text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
                  Môi trường làm bài tập trung tuyệt đối, chia đôi khung ngữ liệu kéo giãn linh hoạt và máy tính cầm tay tích hợp.
                </p>

                <ul className="mt-6 space-y-2.5 text-[13.5px] text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)]">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#ff8fa0] shrink-0 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]" />
                    Đồng hồ đếm ngược độc lập cho từng phần thi nối tiếp
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#ff8fa0] shrink-0 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]" />
                    Phòng chống gian lận 5 lớp &amp; khóa sao chép khi thi nghiêm túc
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#ff8fa0] shrink-0 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]" />
                    Hỗ trợ phím tắt chuyển câu nhanh &amp; đánh dấu xem lại
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            MANIFESTO SECTION WITH MISTTYPER + GRID MIST
           ============================================================ */}
        <section id="manifesto" className="relative overflow-hidden py-20 sm:py-28 scroll-mt-20">
          <div className="grid-mist pointer-events-none absolute inset-0" />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[580px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-45 blur-[110px]"
            style={{
              background: 'radial-gradient(circle, rgba(244, 140, 154, 0.45) 0%, rgba(255,255,255,0) 72%)',
            }}
          />

          <div className="relative mx-auto max-w-[980px] px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span
                className="h-px w-8"
                style={{ background: 'linear-gradient(90deg, #dc263e, #f799a6)' }}
              />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-crimson">
                Tầm nhìn Parabol
              </span>
            </div>

            <h2 className="mt-6 text-[clamp(1.5rem,3.6vw,2.65rem)] font-normal leading-[1.24] tracking-[-0.028em] text-[#2a161b] dark:text-[#fff2f4]">
              <MistTyper
                text="Parabol là không gian luyện thi thế hệ mới — giúp mọi sĩ tử rèn luyện tư duy sắc bén và tự tin bước vào phòng thi."
                baseDelay={24}
                jitter={14}
                startDelay={160}
                startOnVisible
              />
            </h2>

            <p className="mt-6 text-[12px] text-[#876870]">
              Phùng Huy · 2026
            </p>
          </div>
        </section>
      </main>

      {/* ============================================================
          FOOTER WITH OVERSIZED TRANSLUCENT WATERMARK
         ============================================================ */}
      <footer className="relative overflow-hidden border-t border-[var(--line)] bg-gradient-to-b from-white to-[#fff5f6] dark:from-[#13090d] dark:to-[#0d0508] px-4 pt-14 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-10 pb-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <Logo className="w-7 h-7 text-[#2a161b] dark:text-[#fbbac3]" />
                <span className="text-[16px] font-semibold tracking-[-0.02em] text-crimson">
                  parabol
                </span>
              </div>
              <p className="mt-3.5 max-w-[320px] text-[13px] leading-relaxed text-[#876870] dark:text-[#b88c95]">
                Nền tảng luyện thi Đánh giá tư duy TSA trực tuyến — Đại học Bách khoa Hà Nội.
              </p>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#876870] dark:text-[#b88c95]">
                Cấu trúc bài thi TSA
              </h4>
              <ul className="mt-3.5 space-y-2 text-[13px] text-[#5e4249] dark:text-[#ebc9cf]">
                {TSA_SECTION_FILTERS.filter((f) => f.value !== 'ALL').map((item) => (
                  <li key={item.value}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSection(item.value);
                        scrollToSection('exam-library');
                      }}
                      className="transition hover:text-crimson cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#876870] dark:text-[#b88c95]">
                Tính năng
              </h4>
              <ul className="mt-3.5 space-y-2 text-[13px] text-[#5e4249] dark:text-[#ebc9cf]">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setLeaderboardExam(null);
                      setLeaderboardInitialTab('xp');
                      setLeaderboardOpen(true);
                    }}
                    className="transition hover:text-crimson cursor-pointer"
                  >
                    Bảng xếp hạng XP
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setRanksModalOpen(true)}
                    className="transition hover:text-crimson cursor-pointer"
                  >
                    Lộ trình 6 Cấp bậc
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="transition hover:text-crimson cursor-pointer"
                  >
                    Quản trị kho đề
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="select-none pt-1" aria-hidden="true">
            <div className="footer-display text-center text-[clamp(3.6rem,18vw,14rem)] font-normal">
              Parabol
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-[var(--line)] py-6 sm:flex-row">
            <p className="text-[11.5px] text-[#876870] dark:text-[#b88c95]">
              © 2026 Parabol — Nền tảng luyện thi đánh giá năng lực &amp; tư duy trực tuyến.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11.5px] text-[#876870] dark:text-[#b88c95]">
              <button
                type="button"
                onClick={() => setLegalTab('terms')}
                className="transition hover:text-crimson hover:underline cursor-pointer"
              >
                Điều khoản sử dụng
              </button>
              <button
                type="button"
                onClick={() => setLegalTab('privacy')}
                className="transition hover:text-crimson hover:underline cursor-pointer"
              >
                Chính sách bảo mật
              </button>
              <button
                type="button"
                onClick={() => setLegalTab('disclaimer')}
                className="transition hover:text-crimson hover:underline cursor-pointer"
              >
                Miễn trừ trách nhiệm
              </button>
              <span className="font-mono text-[11px] opacity-80">
                Crimson Mist Edition
              </span>
            </div>
          </div>
        </div>
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
        exams={exams}
        refreshKey={leaderboardRefreshKey}
        onClose={() => setRanksModalOpen(false)}
        onOpenAuth={() => {
          setPendingExam(null);
          setAuthModalOpen(true);
        }}
        onOpenGoalModal={() => {
          setRanksModalOpen(false);
          setTargetGoalOpen(true);
        }}
      />

      <TargetGoalModal
        isOpen={targetGoalOpen}
        profile={profile}
        onClose={() => setTargetGoalOpen(false)}
        onSave={onSaveTargetGoal}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthNotice(null);
          setPendingExam(null);
        }}
        pendingExamTitle={pendingExam?.title}
        notice={authNotice}
      />

      <ExamModeModal
        exam={modeSelectExam}
        onClose={() => setModeSelectExam(null)}
        onStartFullExam={(ex, mode) => {
          setModeSelectExam(null);
          onStartExam(ex, undefined, mode);
        }}
        onStartSection={(ex, sectionId, mode) => {
          setModeSelectExam(null);
          onStartExam(ex, sectionId, mode);
        }}
      />

      <LegalModal
        isOpen={legalTab !== null}
        initialTab={legalTab ?? 'terms'}
        onClose={() => setLegalTab(null)}
      />
    </div>
  );
};
