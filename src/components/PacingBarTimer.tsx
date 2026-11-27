import { Clock, Gauge } from 'lucide-react';
import React, { useState } from 'react';
import { formatDuration } from '../utils/scoring';

export type TimerDisplayMode = 'classic' | 'pacing';

const TIMER_MODE_STORAGE_KEY = 'parabol_timer_display_mode';

function readInitialTimerMode(): TimerDisplayMode {
  try {
    const saved = localStorage.getItem(TIMER_MODE_STORAGE_KEY);
    return saved === 'pacing' ? 'pacing' : 'classic';
  } catch {
    return 'classic';
  }
}

interface PacingBarTimerProps {
  answeredCount: number;
  totalQuestions: number;
  remainingSeconds: number;
  totalSeconds: number;
  isTimeLow: boolean;
}

export const PacingBarTimer: React.FC<PacingBarTimerProps> = ({
  answeredCount,
  totalQuestions,
  remainingSeconds,
  totalSeconds,
  isTimeLow,
}) => {
  const [mode, setMode] = useState<TimerDisplayMode>(() => readInitialTimerMode());
  const [hovered, setHovered] = useState(false);

  const toggleMode = () => {
    setMode((prev) => {
      const next: TimerDisplayMode = prev === 'classic' ? 'pacing' : 'classic';
      try {
        localStorage.setItem(TIMER_MODE_STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  const progressPct =
    totalQuestions > 0
      ? Math.min(100, Math.max(0, (answeredCount / totalQuestions) * 100))
      : 0;
  const elapsedSeconds = Math.max(0, totalSeconds - remainingSeconds);
  const timePct =
    totalSeconds > 0
      ? Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100))
      : 0;
  const delta = timePct - progressPct;

  let paceStatus = {
    label: 'Đúng nhịp',
    barClass: 'bg-sky-500',
    borderClass: 'border-[var(--line)] bg-white/95 dark:bg-[#241219]',
    badgeClass:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    pulse: false,
  };

  if (delta > 15) {
    paceStatus = {
      label: 'Tăng tốc!',
      barClass: 'bg-rose-600',
      borderClass:
        'border-rose-400 dark:border-rose-700 bg-rose-50/80 dark:bg-rose-950/50',
      badgeClass:
        'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700',
      pulse: true,
    };
  } else if (delta > 0) {
    paceStatus = {
      label: 'Hơi chậm',
      barClass: 'bg-amber-500',
      borderClass:
        'border-amber-400 dark:border-amber-700 bg-amber-50/75 dark:bg-amber-950/40',
      badgeClass:
        'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700',
      pulse: false,
    };
  }

  const remainingMinutesRounded = Math.max(1, Math.ceil(remainingSeconds / 60));

  return (
    <div className="relative flex items-center gap-1.5">
      {/* Mode Switch Button */}
      <button
        type="button"
        onClick={toggleMode}
        title={
          mode === 'classic'
            ? 'Chuyển sang Thanh đo Nhịp độ (ẩn giây)'
            : 'Chuyển sang Đồng hồ cổ điển (mm:ss)'
        }
        aria-label="Chuyển chế độ hiển thị thời gian"
        className={`grid h-8 w-8 place-items-center rounded-full border transition-colors cursor-pointer shrink-0 ${
          mode === 'pacing'
            ? 'border-crimson/40 bg-[#ffeff1] text-crimson dark:bg-[#dc263e]/25 dark:text-[#fbbac3]'
            : 'border-[var(--line)] bg-white/90 dark:bg-[#241219] text-[#5e4249] dark:text-[#c49ba3] hover:text-crimson'
        }`}
      >
        {mode === 'classic' ? (
          <Gauge className="w-3.5 h-3.5" />
        ) : (
          <Clock className="w-3.5 h-3.5" />
        )}
      </button>

      {mode === 'classic' ? (
        <div
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs sm:text-sm font-mono font-semibold ${
            isTimeLow
              ? 'border-rose-400 dark:border-rose-700 bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 animate-pulse'
              : 'border-[var(--line)] bg-white/90 dark:bg-[#241219] text-[#2a161b] dark:text-[#fff2f4]'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-crimson" />
          {formatDuration(remainingSeconds)}
        </div>
      ) : (
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`relative flex items-center gap-2.5 rounded-2xl border px-3 py-1.5 transition-colors ${
            paceStatus.borderClass
          } ${paceStatus.pulse ? 'animate-pulse' : ''}`}
        >
          {/* 2 Stacked Compact Progress Bars */}
          <div className="w-28 sm:w-36 space-y-1">
            {/* Top Bar: % Questions Answered */}
            <div className="h-[7px] w-full rounded-full bg-neutral-200/80 dark:bg-white/10 overflow-hidden">
              <div
                style={{ width: `${progressPct}%` }}
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              />
            </div>
            {/* Bottom Bar: % Time Elapsed */}
            <div className="h-[7px] w-full rounded-full bg-neutral-200/80 dark:bg-white/10 overflow-hidden">
              <div
                style={{ width: `${timePct}%` }}
                className={`h-full rounded-full transition-all duration-500 ${paceStatus.barClass}`}
              />
            </div>
          </div>

          {/* Pace Status Badge */}
          <span
            className={`hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-bold whitespace-nowrap ${paceStatus.badgeClass}`}
          >
            {paceStatus.label}
          </span>

          {/* Under 5 minutes compact warning */}
          {isTimeLow && (
            <span className="inline-flex items-center rounded-full bg-rose-600 text-white px-2 py-0.5 text-[10.5px] font-mono font-bold whitespace-nowrap animate-pulse">
              còn {remainingMinutesRounded}p
            </span>
          )}

          {/* Hover Tooltip */}
          {hovered && (
            <div className="absolute right-0 top-full mt-2 z-50 w-max max-w-xs rounded-xl bg-[#261118] text-white px-3 py-2 text-[11px] font-medium shadow-xl pointer-events-none">
              Đã làm: {answeredCount}/{totalQuestions} câu (
              {Math.round(progressPct)}%) — Thời gian còn lại:{' '}
              {formatDuration(remainingSeconds)} (đã qua {Math.round(timePct)}%)
            </div>
          )}
        </div>
      )}
    </div>
  );
};
