import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  Award,
  CheckCircle2,
  Crown,
  FileCheck2,
  Lock,
  Sparkles,
  X,
} from 'lucide-react';
import React from 'react';
import type { UserProfile } from '../lib/profileService';
import { getRankByXp, RANK_TIERS } from '../utils/ranks';
import { RankBadge, XpProgressBar } from './RankBadge';

interface RanksModalProps {
  isOpen: boolean;
  user: SupabaseUser | null;
  profile: UserProfile | null;
  onClose: () => void;
  onOpenAuth?: () => void;
}

function getTierIcon(level: number) {
  switch (level) {
    case 6:
      return <Crown className="w-4 h-4 text-amber-300" />;
    case 5:
      return <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    case 4:
      return <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />;
    case 3:
      return <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    case 2:
      return <Award className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
    default:
      return <Award className="w-4 h-4 text-slate-500 dark:text-zinc-400" />;
  }
}

export const RanksModal: React.FC<RanksModalProps> = ({
  isOpen,
  user,
  profile,
  onClose,
  onOpenAuth,
}) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-[#B91C1C] dark:text-red-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Cấp bậc & Lộ trình Thăng hạng
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Hệ thống danh hiệu hội tụ Parabol
              </p>
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

        <div className="p-5 sm:p-6 space-y-6 max-h-[78vh] overflow-y-auto custom-scrollbar">
          {/* Personal Profile Card */}
          {user ? (
            <section className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-950 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#B91C1C] text-white text-base font-bold flex items-center justify-center shrink-0">
                      {(displayName[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 truncate">
                        {displayName}
                      </h4>
                      <RankBadge xp={currentXp} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400">
                      <span className="inline-flex items-center gap-1 font-mono">
                        <FileCheck2 className="w-3.5 h-3.5" />
                        {profile?.exams_completed ?? 0} đề đã hoàn thành
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Tổng kinh nghiệm
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#B91C1C] dark:text-red-500">
                    {currentXp.toLocaleString('vi-VN')} XP
                  </div>
                </div>
              </div>

              <XpProgressBar xp={currentXp} />
            </section>
          ) : (
            <section className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Bạn đang thi với tư cách Khách
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Đăng nhập bằng Google để lưu XP, mở khóa huy hiệu và thăng cấp.
                </p>
              </div>
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="rounded-lg bg-[#B91C1C] hover:bg-red-800 px-3.5 py-2 text-xs font-semibold text-white shrink-0 transition-colors"
                >
                  Đăng nhập ngay
                </button>
              )}
            </section>
          )}

          {/* 6-Tier Roadmap */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
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
                    className={`rounded-xl border p-3.5 transition-all flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'border-[#B91C1C] dark:border-red-500 bg-red-50/40 dark:bg-red-950/20 shadow-xs'
                        : isUnlocked
                          ? 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                          : 'border-slate-200/60 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-950/50 opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${tier.badgeClass}`}
                      >
                        {getTierIcon(tier.level)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                          Cấp {tier.level} · {tier.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 mt-0.5">
                          {rangeLabel}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {!user ? (
                        <span className="text-[10px] font-medium text-slate-400">
                          Mốc {tier.level}
                        </span>
                      ) : isCurrent ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#B91C1C] px-2 py-0.5 text-[10px] font-semibold text-white">
                          Đang ở cấp này
                        </span>
                      ) : isUnlocked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã đạt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-zinc-500">
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

          {/* XP Formula Explanation */}
          <section className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 p-4 text-xs text-slate-600 dark:text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                Công thức tính XP mỗi bài thi:
              </span>{' '}
              Tối thiểu 10 XP cho mỗi lần hoàn thành bài thi.
            </div>
            <code className="rounded-md bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 px-2.5 py-1 font-mono text-[11px] font-semibold text-[#B91C1C] dark:text-red-400 shrink-0">
              XP = Điểm (/100) × 10 + Số câu đúng × 5
            </code>
          </section>
        </div>
      </div>
    </div>
  );
};
