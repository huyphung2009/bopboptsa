export interface RankTier {
  level: number;
  name: string;
  minXp: number;
  maxXp: number | null; // null for max tier
  badgeClass: string;
  barClass: string;
  dotClass: string;
}

export const RANK_TIERS: RankTier[] = [
  {
    level: 1,
    name: 'Khởi điểm',
    minXp: 0,
    maxXp: 499,
    badgeClass:
      'border-slate-200/90 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300',
    barClass: 'bg-slate-500',
    dotClass: 'bg-slate-500',
  },
  {
    level: 2,
    name: 'Tiệm cận',
    minXp: 500,
    maxXp: 1499,
    badgeClass:
      'border-sky-200 dark:border-sky-900/70 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300',
    barClass: 'bg-sky-500',
    dotClass: 'bg-sky-500',
  },
  {
    level: 3,
    name: 'Hội tụ',
    minXp: 1500,
    maxXp: 2999,
    badgeClass:
      'border-emerald-200 dark:border-emerald-900/70 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    barClass: 'bg-emerald-500',
    dotClass: 'bg-emerald-500',
  },
  {
    level: 4,
    name: 'Cực trị',
    minXp: 3000,
    maxXp: 5999,
    badgeClass:
      'border-violet-200 dark:border-violet-900/70 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300',
    barClass: 'bg-violet-500',
    dotClass: 'bg-violet-500',
  },
  {
    level: 5,
    name: 'Đỉnh Parabol',
    minXp: 6000,
    maxXp: 9999,
    badgeClass:
      'border-amber-300/80 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300',
    barClass: 'bg-amber-500',
    dotClass: 'bg-amber-500',
  },
  {
    level: 6,
    name: 'Huyền thoại Parabol',
    minXp: 10000,
    maxXp: null,
    badgeClass:
      'border-amber-400/80 dark:border-amber-500/60 bg-[#B91C1C] text-white shadow-xs ring-1 ring-amber-300/60',
    barClass: 'bg-[#B91C1C]',
    dotClass: 'bg-amber-300',
  },
];

export function calculateEarnedXp(
  scoreRatio: number,
  correctCount: number
): number {
  const safeRatio = Math.max(0, Math.min(1, scoreRatio));
  return Math.max(10, Math.round(safeRatio * 1000) + correctCount * 5);
}

export function getRankByXp(xp: number): RankTier {
  const safeXp = Math.max(0, Math.floor(xp));
  for (let i = RANK_TIERS.length - 1; i >= 0; i -= 1) {
    if (safeXp >= RANK_TIERS[i].minXp) {
      return RANK_TIERS[i];
    }
  }
  return RANK_TIERS[0];
}

export function getXpProgress(xp: number): {
  currentRank: RankTier;
  nextRank: RankTier | null;
  progressPercent: number;
  xpToNext: number;
} {
  const safeXp = Math.max(0, Math.floor(xp));
  const currentRank = getRankByXp(safeXp);
  const nextRank =
    RANK_TIERS.find((r) => r.level === currentRank.level + 1) ?? null;

  if (!nextRank) {
    return {
      currentRank,
      nextRank: null,
      progressPercent: 100,
      xpToNext: 0,
    };
  }

  const span = nextRank.minXp - currentRank.minXp;
  const gainedInTier = safeXp - currentRank.minXp;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((gainedInTier / span) * 100))
  );

  return {
    currentRank,
    nextRank,
    progressPercent,
    xpToNext: Math.max(0, nextRank.minXp - safeXp),
  };
}
