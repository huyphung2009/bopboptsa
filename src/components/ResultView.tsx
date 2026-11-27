import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CloudCheck,
  CloudOff,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import type { Exam, ExamAttemptResult } from '../types/exam';
import { getRankByXp } from '../utils/ranks';
import { formatDuration } from '../utils/scoring';
import { LeaderboardModal } from './LeaderboardModal';
import { MathText } from './MathText';
import { QuestionRenderer } from './QuestionRenderer';
import { RankBadge, XpProgressBar } from './RankBadge';

export interface XpAwardSummary {
  earnedXp: number;
  previousXp: number;
  newXp: number;
  isGuest: boolean;
}

interface ResultViewProps {
  exam: Exam;
  result: ExamAttemptResult;
  saveStatus: 'saving' | 'saved' | 'error';
  saveError?: string;
  xpAward: XpAwardSummary | null;
  leaderboardRefreshKey: number;
  onBackHome: () => void;
  onRetry: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  exam,
  result,
  saveStatus,
  saveError,
  xpAward,
  leaderboardRefreshKey,
  onBackHome,
  onRetry,
}) => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const oldRank = xpAward ? getRankByXp(xpAward.previousXp) : null;
  const newRank = xpAward ? getRankByXp(xpAward.newXp) : null;
  const leveledUp =
    Boolean(oldRank && newRank && newRank.level > oldRank.level && !xpAward?.isGuest);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 pb-16">
      {/* Minimalist Topbar */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-slate-200/80 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          <button
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kho đề thi
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLeaderboard(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Trophy className="w-3.5 h-3.5 text-slate-400" />
              Bảng xếp hạng
            </button>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 hover:bg-red-800 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Thi lại
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Level Up / +XP Banner */}
        {xpAward && (
          <section
            className={`rounded-xl border p-4 sm:p-5 shadow-xs transition-all ${
              leveledUp
                ? 'border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30'
                : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    <Sparkles className="w-3 h-3" />+{xpAward.earnedXp} XP
                  </span>
                  {!xpAward.isGuest && <RankBadge xp={xpAward.newXp} />}
                  {leveledUp && newRank && (
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 animate-pulse">
                      Chúc mừng bạn đã thăng cấp lên {newRank.name}!
                    </span>
                  )}
                </div>
                {xpAward.isGuest && (
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Đăng nhập Google để tích lũy XP và thăng hạng Cấp bậc Parabol qua từng bài thi.
                  </p>
                )}
              </div>

              {!xpAward.isGuest && (
                <div className="w-full sm:w-64">
                  <XpProgressBar xp={xpAward.newXp} />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Clean Score Summary Card */}
        <section className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-red-700 dark:text-red-500">
                Kết quả bài thi
              </p>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100">
                {result.examTitle}
              </h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Thí sinh:{' '}
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  {result.studentName}
                </span>
              </p>

              <div className="pt-2">
                {saveStatus === 'saving' && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                    Đang lưu kết quả...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <CloudCheck className="w-4 h-4" />
                    Đã lưu lên bảng xếp hạng
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <CloudOff className="w-4 h-4" />
                    Chưa lưu được{saveError ? `: ${saveError}` : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-950 px-5 py-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Điểm (/100)
                </div>
                <div className="text-3xl sm:text-4xl font-bold font-mono text-red-700 dark:text-red-500 mt-0.5">
                  {result.score100.toFixed(2)}
                </div>
              </div>
              <div className="h-12 w-px bg-slate-200 dark:bg-zinc-800" />
              <div className="space-y-1 text-xs text-slate-600 dark:text-zinc-400 font-mono">
                <div>
                  Đúng trọn:{' '}
                  <span className="font-semibold text-slate-900 dark:text-zinc-100">
                    {result.correctCount}/{result.totalQuestions}
                  </span>
                </div>
                <div>
                  Điểm thô:{' '}
                  <span className="font-semibold text-slate-900 dark:text-zinc-100">
                    {result.rawScore}/{result.maxScore}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(result.timeSpentSeconds)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Review */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Chi tiết bài làm & Lời giải
          </h2>

          {exam.questions.map((q, idx) => {
            const qRes = result.questionResults[q.id];
            const passage = q.passageId
              ? exam.passages.find((p) => p.id === q.passageId)
              : undefined;

            return (
              <article
                key={q.id}
                className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-900 dark:bg-zinc-100 px-2 py-0.5 text-xs font-mono font-semibold text-white dark:text-zinc-900">
                      Câu {idx + 1}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">
                      {q.section}
                    </span>
                  </div>

                  {qRes.isFullCorrect ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đúng ({qRes.earnedPoints}/{qRes.maxPoints})
                    </span>
                  ) : qRes.isPartialCorrect ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Một phần ({qRes.earnedPoints}/{qRes.maxPoints})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400">
                      <XCircle className="w-3.5 h-3.5" />
                      Sai (0/{qRes.maxPoints})
                    </span>
                  )}
                </div>

                {passage && (
                  <details className="rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 px-4 py-2.5 text-sm">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-600 dark:text-zinc-300 select-none">
                      Ngữ liệu: {passage.title}
                    </summary>
                    <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 leading-relaxed">
                      <MathText text={passage.content} />
                    </div>
                  </details>
                )}

                <QuestionRenderer
                  question={q}
                  answer={result.answers[q.id]}
                  readOnly
                />

                {q.explanation && (
                  <div className="rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">
                      Lời giải
                    </div>
                    <MathText text={q.explanation} />
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </main>

      <LeaderboardModal
        exam={showLeaderboard ? exam : null}
        refreshKey={leaderboardRefreshKey}
        onClose={() => setShowLeaderboard(false)}
      />
    </div>
  );
};
