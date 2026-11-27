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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#261118]/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-[26px] bg-white/95 dark:bg-[#1b0d13]/95 backdrop-blur-2xl shadow-[0_32px_90px_-28px_rgba(38,17,24,0.45)] border border-[var(--line)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[#fff6f7]/75 dark:bg-[#241219]/65">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-crimson" />
            <div>
              <h3 className="text-base font-semibold text-[#2a161b] dark:text-[#fff2f4]">
                Cấp bậc &amp; Lộ trình Thăng hạng
              </h3>
              <p className="text-xs text-[#876870] dark:text-[#c49ba3]">
                Hệ thống danh hiệu hội tụ Parabol
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

        <div className="p-5 sm:p-6 space-y-6 max-h-[78vh] overflow-y-auto custom-scrollbar">
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
                    <div className="flex items-center gap-3 text-xs text-[#876870] dark:text-[#c49ba3]">
                      <span className="inline-flex items-center gap-1 font-mono">
                        <FileCheck2 className="w-3.5 h-3.5 text-crimson" />
                        {profile?.exams_completed ?? 0} đề đã hoàn thành
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
            </section>
          ) : (
            <section className="rounded-2xl border border-[var(--line)] bg-[#fff6f7]/80 dark:bg-[#241219]/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-[#2a161b] dark:text-[#fff2f4]">
                  Bạn đang thi với tư cách Khách
                </h4>
                <p className="text-xs text-[#876870] dark:text-[#c49ba3] mt-0.5">
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
                  className="btn btn-crimson btn-sm shrink-0"
                >
                  Đăng nhập ngay
                </button>
              )}
            </section>
          )}

          {/* 6-Tier Roadmap */}
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

          {/* XP Formula Explanation */}
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
        </div>
      </div>
    </div>
  );
};
