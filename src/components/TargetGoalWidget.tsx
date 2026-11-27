import {
  Calendar,
  Flame,
  GraduationCap,
  Settings2,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { fetchUserAttempts } from '../lib/examService';
import type { UserProfile } from '../lib/profileService';
import type { AttemptRecord, Exam } from '../types/exam';
import { normalizeExamType } from '../utils/examTypes';

interface TargetGoalWidgetProps {
  userId: string;
  profile: UserProfile | null;
  exams: Exam[];
  refreshKey?: number;
  onOpenModal: () => void;
}

function computeDaysLeft(dateStr?: string | null): number {
  const target = dateStr ? new Date(dateStr) : new Date('2027-06-15');
  if (Number.isNaN(target.getTime())) {
    const fallback = new Date('2027-06-15');
    return Math.max(
      0,
      Math.ceil((fallback.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
  }
  const diff = target.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export const TargetGoalWidget: React.FC<TargetGoalWidgetProps> = ({
  userId,
  profile,
  exams,
  refreshKey = 0,
  onOpenModal,
}) => {
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchUserAttempts(userId).then((res) => {
      if (!cancelled) {
        setAttempts(res.attempts);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId, refreshKey]);

  const examLookup = useMemo(() => {
    const map: Record<string, Exam> = {};
    for (const ex of exams) map[ex.id] = ex;
    return map;
  }, [exams]);

  const hasGoal = Boolean(
    profile?.target_university &&
      profile?.target_score &&
      profile.target_score > 0
  );

  const targetType = (profile?.target_exam_type || 'TSA').toUpperCase();
  const targetScore = Number(profile?.target_score ?? 80);

  const recentAvg = useMemo(() => {
    const valid = attempts.filter(
      (a) =>
        !a.is_flagged &&
        !a.is_cheating &&
        a.status !== 'violated' &&
        (a.violation_count ?? 0) <= 3
    );

    const matched = valid.filter((a) => {
      const ex = examLookup[a.exam_id];
      const t = normalizeExamType(a.exam_type ?? ex?.exam_type);
      return targetType === 'THPTQG' ? true : t === targetType;
    });

    const recent5 = matched.slice(0, 5);
    if (recent5.length === 0) return { avg: 0, count: 0 };
    const sum = recent5.reduce((acc, item) => acc + Number(item.score ?? 0), 0);
    return {
      avg: Math.round((sum / recent5.length) * 100) / 100,
      count: recent5.length,
    };
  }, [attempts, examLookup, targetType]);

  // Empty state banner
  if (!hasGoal) {
    return (
      <section className="glass-card rounded-[24px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-[#dc263e]/25 bg-gradient-to-r from-[#fff5f6]/90 via-white/90 to-[#ffeff1]/80 dark:from-[#26131a]/90 dark:to-[#1d0f15]/90">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#ffeff1] dark:bg-[#2e151e] border border-[#dc263e]/25 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-crimson" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-crimson mb-1">
              <Target className="w-3.5 h-3.5" />
              Hành trình tới ước mơ NV1
            </div>
            <h2 className="text-sm font-semibold text-[#2a161b] dark:text-[#fff2f4]">
              Đặt mục tiêu đại học của bạn để theo dõi tiến độ mỗi ngày
            </h2>
            <p className="text-xs text-[#876870] dark:text-[#c49ba3] mt-0.5">
              Hệ thống sẽ tự động đếm ngược ngày thi và so sánh điểm trung bình 5 bài gần nhất.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenModal}
          className="btn btn-crimson btn-sm shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Cài đặt mục tiêu
        </button>
      </section>
    );
  }

  const daysLeft = computeDaysLeft(profile?.target_exam_date);
  const progressPct =
    targetScore > 0
      ? Math.min(100, Math.max(0, Math.round((recentAvg.avg / targetScore) * 100)))
      : 0;

  let motivation = 'Khởi động chắc chắn nào!';
  if (progressPct >= 100) {
    motivation = 'Chúc mừng! Bạn đã chạm ngưỡng điểm mục tiêu!';
  } else if (progressPct > 85) {
    motivation = 'Sắp chạm tay vào giảng đường mơ ước!';
  } else if (progressPct >= 50) {
    motivation = 'Đang bám sát mục tiêu rồi!';
  }

  return (
    <section
      className={`glass-card rounded-[26px] p-5 sm:p-6 transition-all ${
        progressPct >= 100
          ? 'border-emerald-400/60 dark:border-emerald-700/70 bg-gradient-to-br from-emerald-50/60 via-white/90 to-[#fff5f6]/80 dark:from-emerald-950/25 dark:to-[#1b0d13]/95'
          : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--line)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#ffeff1] dark:bg-[#2e151e] border border-[#dc263e]/25 text-crimson shrink-0">
            <Target className="w-4 h-4" />
          </span>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#2a161b] dark:text-white truncate">
            Hành trình tới ước mơ NV1
          </h2>
        </div>
        <span className="rounded-full border border-[var(--line)] bg-white/80 dark:bg-[#241219] px-3 py-0.5 text-[11px] font-mono font-bold text-crimson dark:text-[#fbbac3] shrink-0">
          {targetType}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: Target University & Major */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-start gap-2.5">
            <GraduationCap className="w-5 h-5 text-crimson shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-[#2a161b] dark:text-white truncate">
                {profile?.target_university}
              </h3>
              <p className="text-xs sm:text-sm text-[#5e4249] dark:text-[#ebc9cf] truncate">
                Ngành: <span className="font-semibold">{profile?.target_major}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Middle: Score Progress Bar */}
        <div className="flex-1 max-w-md space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-[#5e4249] dark:text-[#ebc9cf] font-medium">
              Điểm TB ({recentAvg.count}/5 bài gần nhất):{' '}
              <strong className="font-mono text-[#2a161b] dark:text-white">
                {recentAvg.avg.toFixed(2)}
              </strong>{' '}
              / Mục tiêu:{' '}
              <strong className="font-mono text-crimson dark:text-[#fbbac3]">
                {targetScore}
              </strong>
            </span>
            <span className="font-mono font-bold text-crimson dark:text-[#fbbac3]">
              {progressPct}%
            </span>
          </div>

          <div className="h-2.5 w-full rounded-full bg-[#ffeff1] dark:bg-[#241219] border border-[var(--line)] overflow-hidden">
            <div
              style={{
                width: `${progressPct}%`,
                background:
                  progressPct >= 100
                    ? 'linear-gradient(90deg, #10b981, #059669)'
                    : 'linear-gradient(90deg, #dc263e, #ef6c7e)',
              }}
              className="h-full rounded-full transition-all duration-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#b91c30] dark:text-[#fbbac3]">
            {progressPct >= 100 ? (
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Flame className="w-3.5 h-3.5 text-crimson" />
            )}
            <span>{motivation}</span>
          </div>
        </div>

        {/* Right: Countdown + Edit button */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className="rounded-2xl border border-[var(--line)] bg-[#fff6f7]/90 dark:bg-[#241219]/80 px-4 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#876870] dark:text-[#c49ba3]">
              <Calendar className="w-3 h-3 text-crimson" />
              Còn lại
            </div>
            <div className="text-xl font-bold font-mono text-crimson dark:text-[#fbbac3] leading-tight mt-0.5">
              {daysLeft}{' '}
              <span className="text-xs font-sans font-semibold text-[#5e4249] dark:text-[#ebc9cf]">
                ngày
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenModal}
            className="btn btn-pill btn-sm"
            title="Cài đặt mục tiêu"
          >
            <Settings2 className="w-3.5 h-3.5 text-crimson" />
            <span className="hidden sm:inline">Cài đặt</span>
          </button>
        </div>
      </div>
    </section>
  );
};
