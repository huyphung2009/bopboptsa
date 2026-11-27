import {
  ArrowLeft,
  CheckCircle2,
  CloudCheck,
  CloudOff,
  HelpCircle,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import type { Exam, ExamAttemptResult } from '../types/exam';
import { LeaderboardModal } from './LeaderboardModal';
import { MathText } from './MathText';
import { QuestionRenderer } from './QuestionRenderer';
import { RankBadge, XpProgressBar } from './RankBadge';
import { ScoreReportCard } from './ScoreReportModal';

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
  const detailsRef = useRef<HTMLElement | null>(null);

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
            {saveStatus === 'saved' && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <CloudCheck className="w-3.5 h-3.5" />
                Đã lưu
              </span>
            )}
            {saveStatus === 'error' && (
              <span
                className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400"
                title={saveError}
              >
                <CloudOff className="w-3.5 h-3.5" />
                Lỗi lưu
              </span>
            )}

            <button
              onClick={() => setShowLeaderboard(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Trophy className="w-3.5 h-3.5 text-slate-400" />
              Bảng xếp hạng
            </button>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#B91C1C] hover:bg-red-800 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Thi lại
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Flagged Violation Notice */}
        {(result.isFlagged || (result.violationCount ?? 0) > 3) && (
          <section className="rounded-xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-4 sm:p-5 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-red-800 dark:text-red-300">
                Bài thi bị đánh dấu Vi phạm quy chế ({result.violationCount ?? 4} lần vi phạm)
              </h2>
              <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                Hệ thống đã tự động khóa và nộp bài do vượt quá 3 lần cảnh báo giám sát.
                Bài thi này không được cộng điểm kinh nghiệm (XP) và không được xét vào
                Top vinh danh trên Bảng xếp hạng.
              </p>
            </div>
          </section>
        )}

        {/* Academic Score Report Card */}
        <ScoreReportCard
          report={{
            examTitle: result.examTitle,
            examType: result.examType,
            studentName: result.studentName,
            avatarUrl: result.avatarUrl,
            displayScore: result.displayScore,
            displayMaxScore: result.displayMaxScore,
            correctCount: result.correctCount,
            totalQuestions: result.totalQuestions,
            timeSpentSeconds: result.timeSpentSeconds,
            submittedAt: result.submittedAt,
            sectionResults: result.sectionResults,
            earnedXp: xpAward?.earnedXp ?? null,
            isFlagged: result.isFlagged,
            violationCount: result.violationCount,
          }}
          onViewDetails={() => {
            detailsRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* XP Progress Banner */}
        {xpAward && !xpAward.isGuest && (
          <section className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                <Sparkles className="w-3 h-3" />+{xpAward.earnedXp} XP
              </span>
              <RankBadge xp={xpAward.newXp} />
            </div>
            <div className="w-full sm:w-64">
              <XpProgressBar xp={xpAward.newXp} />
            </div>
          </section>
        )}

        {/* Detailed Review */}
        <section ref={detailsRef} className="space-y-4 pt-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Lời giải chi tiết từng câu
          </h2>

          {exam.questions
            .filter((q) => Boolean(result.questionResults[q.id]))
            .map((q, idx) => {
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
        isOpen={showLeaderboard}
        exams={[exam]}
        initialExam={exam}
        initialTab="exam"
        refreshKey={leaderboardRefreshKey}
        onClose={() => setShowLeaderboard(false)}
      />
    </div>
  );
};
