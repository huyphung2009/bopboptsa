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
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-semibold tracking-tight ${
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
        <div className="flex items-center justify-between text-[11px] text-[#876870] dark:text-[#c49ba3]">
          <span className="font-mono font-semibold text-[#2a161b] dark:text-[#fff2f4]">
            {xp.toLocaleString('vi-VN')} XP
          </span>
          {nextRank ? (
            <span>
              Còn <strong className="font-mono text-[#2a161b] dark:text-[#fff2f4]">{xpToNext.toLocaleString('vi-VN')}</strong> XP lên{' '}
              <span className="font-medium text-crimson dark:text-[#fbbac3]">
                {nextRank.name}
              </span>
            </span>
          ) : (
            <span className="font-semibold text-crimson dark:text-[#ef6c7e]">
              Cấp tối đa
            </span>
          )}
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-[#ffeff1] dark:bg-[#2a141c] overflow-hidden">
        <div
          style={{ width: `${progressPercent}%` }}
          className={`h-full rounded-full transition-all duration-500 ${currentRank.barClass}`}
        />
      </div>
    </div>
  );
};
