import React from 'react';
import { getRankByXp, getXpProgress } from '../utils/ranks';

interface RankBadgeProps {
  xp: number;
  compact?: boolean;
}

export const RankBadge: React.FC<RankBadgeProps> = ({ xp, compact = false }) => {
  const rank = getRankByXp(xp);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-semibold tracking-tight ${
        compact ? 'text-[10px]' : 'text-[11px]'
      } ${rank.badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${rank.dotClass}`} />
      {rank.name}
    </span>
  );
};

interface XpProgressBarProps {
  xp: number;
  showLabel?: boolean;
}

export const XpProgressBar: React.FC<XpProgressBarProps> = ({
  xp,
  showLabel = true,
}) => {
  const { currentRank, nextRank, progressPercent, xpToNext } = getXpProgress(xp);

  return (
    <div className="w-full space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
          <span className="font-mono font-semibold text-slate-700 dark:text-zinc-300">
            {xp.toLocaleString('vi-VN')} XP
          </span>
          {nextRank ? (
            <span>
              Còn <strong className="font-mono">{xpToNext.toLocaleString('vi-VN')}</strong> XP lên{' '}
              <span className="font-medium text-slate-700 dark:text-zinc-300">
                {nextRank.name}
              </span>
            </span>
          ) : (
            <span className="font-semibold text-[#B91C1C] dark:text-red-400">
              Cấp tối đa
            </span>
          )}
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-slate-200/80 dark:bg-zinc-800 overflow-hidden">
        <div
          style={{ width: `${progressPercent}%` }}
          className={`h-full rounded-full transition-all duration-500 ${currentRank.barClass}`}
        />
      </div>
    </div>
  );
};
