import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  Activity,
  Award,
  CheckCircle2,
  Crown,
  FileCheck2,
  Lock,
  Moon,
  Sparkles,
  Swords,
  Target,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { fetchUserAchievements } from '../lib/achievementService';
import { fetchUserAttempts } from '../lib/examService';
import type { UserProfile } from '../lib/profileService';
import type { AttemptRecord, Exam } from '../types/exam';
import {
  SECRET_ACHIEVEMENTS,
  type AchievementDefinition,
  type UnlockedAchievement,
} from '../utils/achievements';
import { getRankByXp, RANK_TIERS } from '../utils/ranks';
import { ProgressChartCard } from './ProgressChartCard';
import { RankBadge, XpProgressBar } from './RankBadge';

interface RanksModalProps {
  isOpen: boolean;
  user: SupabaseUser | null;
  profile: UserProfile | null;
  exams?: Exam[];
  refreshKey?: number;
  onClose: () => void;
  onOpenAuth?: () => void;
  onOpenGoalModal?: () => void;
}

type ProfileTab = 'progress' | 'achievements' | 'roadmap';

function getTierIcon(level: number) {
  switch (level) {
    case 6:
      return <Crown className="w-4 h-4 text-[#ffeff1]" />;
    case 5:
      return <Award className="w-4 h-4 text-crimson dark:text-[#fbbac3]" />;
    case 4:
      return <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    case 3:
      return <Sparkles className="w-4 h-4 text-[#22b899] dark:text-teal-400" />;
    case 2:
      return <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    default:
      return <Award className="w-4 h-4 text-[#876870] dark:text-[#c49ba3]" />;
  }
}

function getAchievementIcon(iconName: AchievementDefinition['iconName']) {
  switch (iconName) {
    case 'moon':
      return <Moon className="w-5 h-5" />;
    case 'zap':
      return <Zap className="w-5 h-5" />;
    case 'crown':
      return <Crown className="w-5 h-5" />;
    case 'swords':
      return <Swords className="w-5 h-5" />;
  }
}

function formatUnlockDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const RanksModal: React.FC<RanksModalProps> = ({
  isOpen,
  user,
  profile,
  exams = [],
  refreshKey = 0,
  onClose,
  onOpenAuth,
  onOpenGoalModal,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('progress');
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [achievements, setAchievements] = useState<UnlockedAchievement[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    let cancelled = false;
    setLoadingData(true);

    Promise.all([
      fetchUserAttempts(user.id),
      fetchUserAchievements(user.id),
    ])
      .then(([attemptsRes, unlockedList]) => {
        if (cancelled) return;
        setAttempts(attemptsRes.attempts);
        setAchievements(unlockedList);
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, user, refreshKey]);

  const unlockedMap = useMemo(() => {
    const map = new Map<string, UnlockedAchievement>();
    for (const item of achievements) {
      map.set(item.achievement_id, item);
    }
    return map;
  }, [achievements]);

  if (!isOpen) return null;

  const currentXp = profile?.xp ?? 0;
  const currentRank = getRankByXp(currentXp);
  const displayName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'Thí sinh';
  const avatarUrl =
    profile?.avatar_url ||
    (user?.user_metadata?.avatar_url as string | undefined) ||
    null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#261118]/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-[26px] bg-white/95 dark:bg-[#1b0d13]/95 backdrop-blur-2xl shadow-[0_32px_90px_-28px_rgba(38,17,24,0.45)] border border-[var(--line)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[#fff6f7]/75 dark:bg-[#241219]/65">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-crimson" />
            <div>
              <h3 className="text-base font-semibold text-[#2a161b] dark:text-[#fff2f4]">
                Hồ sơ cá nhân &amp; Thành tích Parabol
              </h3>
              <p className="text-xs text-[#876870] dark:text-[#c49ba3]">
                Biểu đồ phong độ, thành tựu ẩn và lộ trình 6 cấp bậc
              </p>
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

        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Personal Profile Card */}
          {user ? (
            <section className="rounded-2xl border border-[#dc263e]/25 bg-gradient-to-br from-[#fff6f7] to-[#ffeff1]/75 dark:from-[#26131a] dark:to-[#2e151e] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-12 h-12 rounded-full object-cover border border-[var(--line)] shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-crimson text-white text-base font-bold flex items-center justify-center shrink-0">
                      {(displayName[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm sm:text-base font-semibold text-[#2a161b] dark:text-white truncate">
                        {displayName}
                      </h4>
                      <RankBadge xp={currentXp} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#876870] dark:text-[#c49ba3]">
                      <span className="inline-flex items-center gap-1 font-mono">
                        <FileCheck2 className="w-3.5 h-3.5 text-crimson" />
                        {profile?.exams_completed ?? 0} đề đã hoàn thành
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        {unlockedMap.size}/{SECRET_ACHIEVEMENTS.length} thành tựu ẩn
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#876870] dark:text-[#c49ba3]">
                    Tổng kinh nghiệm
                  </div>
                  <div className="text-2xl font-bold font-mono text-crimson dark:text-[#fbbac3]">
                    {currentXp.toLocaleString('vi-VN')} XP
                  </div>
                </div>
              </div>

              <XpProgressBar xp={currentXp} />

              {onOpenGoalModal && (
                <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between gap-2">
                  <div className="text-xs text-[#5e4249] dark:text-[#ebc9cf] truncate">
                    {profile?.target_university
                      ? `Mục tiêu: ${profile.target_university} (${profile.target_score} đ)`
                      : 'Chưa thiết lập mục tiêu đại học'}
                  </div>
                  <button
                    type="button"
                    onClick={onOpenGoalModal}
                    className="btn btn-pill btn-sm shrink-0"
                  >
                    <Target className="w-3.5 h-3.5 text-crimson" />
                    Cài đặt mục tiêu
                  </button>
                </div>
              )}
            </section>
          ) : (
            <section className="rounded-2xl border border-[var(--line)] bg-[#fff6f7]/80 dark:bg-[#241219]/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-[#2a161b] dark:text-[#fff2f4]">
                  Bạn chưa đăng nhập tài khoản
                </h4>
                <p className="text-xs text-[#876870] dark:text-[#c49ba3] mt-0.5">
                  Đăng nhập để xem biểu đồ phong độ, mở khóa thành tựu ẩn và lưu điểm XP.
                </p>
              </div>
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="btn btn-crimson btn-sm shrink-0"
                >
                  Đăng nhập ngay
                </button>
              )}
            </section>
          )}

          {/* Profile Navigation Tabs */}
          {user && (
            <div className="grid grid-cols-3 rounded-full bg-[#fff5f6] dark:bg-[#241219] border border-[var(--line)] p-1">
              <button
                type="button"
                onClick={() => setActiveTab('progress')}
                className={`rounded-full py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'progress'
                    ? 'bg-crimson text-white shadow-xs'
                    : 'text-[#876870] dark:text-[#c49ba3] hover:text-crimson'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Biểu đồ phong độ
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('achievements')}
                className={`rounded-full py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'achievements'
                    ? 'bg-crimson text-white shadow-xs'
                    : 'text-[#876870] dark:text-[#c49ba3] hover:text-crimson'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                Thành tựu ẩn ({unlockedMap.size}/{SECRET_ACHIEVEMENTS.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('roadmap')}
                className={`rounded-full py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'roadmap'
                    ? 'bg-crimson text-white shadow-xs'
                    : 'text-[#876870] dark:text-[#c49ba3] hover:text-crimson'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                Lộ trình Cấp bậc
              </button>
            </div>
          )}

          {/* Tab 1: Progress Chart */}
          {user && activeTab === 'progress' && (
            <ProgressChartCard
              attempts={attempts}
              exams={exams}
              loading={loadingData}
            />
          )}

          {/* Tab 2: Secret Achievements */}
          {user && activeTab === 'achievements' && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#876870] dark:text-[#b88c95]">
                  Bộ sưu tập Thành tựu ẩn
                </h4>
                <span className="text-[11px] font-mono text-[#876870] dark:text-[#c49ba3]">
                  Đã mở khóa {unlockedMap.size}/{SECRET_ACHIEVEMENTS.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SECRET_ACHIEVEMENTS.map((item) => {
                  const unlocked = unlockedMap.get(item.id);
                  const isUnlocked = Boolean(unlocked);

                  if (isUnlocked) {
                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-4 bg-gradient-to-br ${item.gradientClass} ${item.badgeBorderClass} shadow-xs flex items-start gap-3.5 transition-all`}
                      >
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md ${item.iconBgClass}`}
                        >
                          {getAchievementIcon(item.iconName)}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-sm font-bold text-[#2a161b] dark:text-white truncate">
                              {item.title}
                            </h5>
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 dark:bg-black/25 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
                              <CheckCircle2 className="w-3 h-3" />
                              Đã mở
                            </span>
                          </div>
                          <p className="text-xs text-[#5e4249] dark:text-[#e2c6cc] leading-relaxed">
                            {item.description}
                          </p>
                          <div className="text-[10.5px] font-mono text-[#876870] dark:text-[#c49ba3] pt-0.5">
                            Đạt ngày {formatUnlockDate(unlocked?.unlocked_at)}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-dashed border-[var(--line)] bg-[#fff9fa]/70 dark:bg-[#190c11]/60 p-4 flex items-start gap-3.5 opacity-75"
                    >
                      <div className="w-11 h-11 rounded-xl bg-neutral-200/80 dark:bg-white/10 text-neutral-500 dark:text-neutral-400 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-sm font-bold tracking-wider text-neutral-500 dark:text-neutral-400">
                            ???
                          </h5>
                          <span className="rounded-full bg-neutral-200/70 dark:bg-white/10 px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:text-neutral-400">
                            Bí ẩn
                          </span>
                        </div>
                        <p className="text-xs text-[#876870] dark:text-[#b88c95] leading-relaxed">
                          {item.secretHint}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Tab 3 (or Guest view): 6-Tier Roadmap */}
          {(!user || activeTab === 'roadmap') && (
            <>
              <section className="space-y-3">
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#876870] dark:text-[#b88c95]">
                  Lộ trình 6 Cấp bậc Parabol
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {RANK_TIERS.map((tier) => {
                    const isCurrent = Boolean(user) && currentRank.level === tier.level;
                    const isUnlocked = Boolean(user) && currentXp >= tier.minXp;
                    const rangeLabel =
                      tier.maxXp !== null
                        ? `${tier.minXp.toLocaleString('vi-VN')} – ${tier.maxXp.toLocaleString('vi-VN')} XP`
                        : `>= ${tier.minXp.toLocaleString('vi-VN')} XP`;

                    return (
                      <div
                        key={tier.level}
                        className={`rounded-2xl border p-3.5 transition-all flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'border-crimson bg-[#ffeff1]/80 dark:bg-[#dc263e]/20 shadow-xs'
                            : isUnlocked
                              ? 'border-[var(--line)] bg-white/90 dark:bg-[#241219]/65'
                              : 'border-[var(--line)] bg-[#fff9fa]/70 dark:bg-[#190c11]/55 opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${tier.badgeClass}`}
                          >
                            {getTierIcon(tier.level)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#2a161b] dark:text-[#fff2f4] truncate">
                              Cấp {tier.level} · {tier.name}
                            </div>
                            <div className="text-[11px] font-mono text-[#876870] dark:text-[#c49ba3] mt-0.5">
                              {rangeLabel}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {!user ? (
                            <span className="text-[10px] font-medium text-[#876870] dark:text-[#b88c95]">
                              Mốc {tier.level}
                            </span>
                          ) : isCurrent ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-crimson px-2.5 py-0.5 text-[10px] font-semibold text-white">
                              Hiện tại
                            </span>
                          ) : isUnlocked ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Đã đạt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#876870] dark:text-[#b88c95]">
                              <Lock className="w-3 h-3" />
                              Chưa mở
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--line)] bg-[#fff5f6]/80 dark:bg-[#241219]/70 p-4 text-xs text-[#5e4249] dark:text-[#ebc9cf] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-[#2a161b] dark:text-white">
                    Công thức tính XP mỗi bài thi:
                  </span>{' '}
                  Tối thiểu 10 XP cho mỗi lần hoàn thành bài thi.
                </div>
                <code className="rounded-full bg-white dark:bg-[#13090d] border border-[var(--line)] px-3 py-1 font-mono text-[11px] font-semibold text-crimson dark:text-[#fbbac3] shrink-0">
                  XP = Điểm (/100) × 10 + Số câu đúng × 5
                </code>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
