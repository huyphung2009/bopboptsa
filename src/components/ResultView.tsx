import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CloudCheck,
  CloudOff,
  HelpCircle,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  fetchTopCommunitySolutionsMap,
  type BountySolutionRecord,
} from '../lib/bountyService';
import type { Exam, ExamAttemptResult } from '../types/exam';
import { getRankByXp } from '../utils/ranks';
import { formatDuration } from '../utils/scoring';
import { CloudBackdrop } from './CloudBackdrop';
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
  isAuthenticated: boolean;
  saveStatus: 'saving' | 'saved' | 'error';
  saveError?: string;
  xpAward: XpAwardSummary | null;
  leaderboardRefreshKey: number;
  onBackHome: () => void;
  onRetry: () => void;
  onRequireAuth: (notice: string) => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  exam,
  result,
  isAuthenticated,
  saveStatus,
  saveError,
  xpAward,
  leaderboardRefreshKey,
  onBackHome,
  onRetry,
  onRequireAuth,
}) => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [topSolutions, setTopSolutions] = useState<
    Record<string, BountySolutionRecord>
  >({});

  useEffect(() => {
    const ids = exam.questions.map((q) => q.id);
    if (ids.length === 0) return;
    let cancelled = false;
    fetchTopCommunitySolutionsMap(ids).then((map) => {
      if (!cancelled) setTopSolutions(map);
    });
    return () => {
      cancelled = true;
    };
  }, [exam.questions]);

  const oldRank = xpAward ? getRankByXp(xpAward.previousXp) : null;
  const newRank = xpAward ? getRankByXp(xpAward.newXp) : null;
  const leveledUp =
    Boolean(oldRank && newRank && newRank.level > oldRank.level && !xpAward?.isGuest);

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#13090d] text-[#2a161b] dark:text-[#fff2f4] pb-16 overflow-x-hidden">
      <div className="relative">
        <CloudBackdrop subtle className="!h-[420px]" />

        {/* Frosted Topbar */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/85 dark:bg-[#190c11]/85 border-b border-[var(--line)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
            <button
              onClick={onBackHome}
              className="btn btn-ghost btn-sm !px-2.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Kho đề thi
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLeaderboard(true)}
                className="btn btn-pill btn-sm"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                Bảng xếp hạng
              </button>
              <button
                onClick={onRetry}
                className="btn btn-crimson btn-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Thi lại
              </button>
            </div>
          </div>
        </header>

        <main className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
          {/* Flagged Violation Notice */}
          {(result.isFlagged || (result.violationCount ?? 0) > 3) && (
            <section className="rounded-2xl border border-rose-300 dark:border-rose-900 bg-rose-50/90 dark:bg-rose-950/40 p-4 sm:p-5 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-rose-800 dark:text-rose-300">
                  Bài thi bị đánh dấu Vi phạm quy chế ({result.violationCount ?? 4} lần vi phạm)
                </h2>
                <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                  Hệ thống đã tự động khóa và nộp bài do vượt quá 3 lần cảnh báo giám sát.
                  Bài thi này không được cộng điểm kinh nghiệm (XP) và không được xét vào
                  Top vinh danh trên Bảng xếp hạng.
                </p>
              </div>
            </section>
          )}

          {/* Level Up / +XP Banner */}
          {xpAward && (
            <section
              className={`glass-card rounded-[24px] p-5 transition-all ${
                leveledUp
                  ? 'border-[#dc263e]/45 bg-gradient-to-r from-[#ffeff1]/90 via-white/85 to-[#fff5f6]/90 dark:from-[#361621]/90 dark:to-[#1d0f15]/90'
                  : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 px-2.5 py-0.5 text-xs font-mono font-bold text-teal-700 dark:text-teal-300">
                      <Sparkles className="w-3 h-3" />+{xpAward.earnedXp} XP
                    </span>
                    {!xpAward.isGuest && <RankBadge xp={xpAward.newXp} />}
                    {leveledUp && newRank && (
                      <span className="text-xs font-bold text-crimson dark:text-[#fbbac3] animate-pulse">
                        Chúc mừng bạn đã thăng cấp lên {newRank.name}!
                      </span>
                    )}
                  </div>
                  {xpAward.isGuest && (
                    <p className="text-xs text-[#876870] dark:text-[#c49ba3]">
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

          {/* Score Summary Card */}
          <section className="glass-card rounded-[26px] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-crimson">
                  Kết quả bài thi
                </p>
                <h1 className="text-lg sm:text-2xl font-medium text-[#2a161b] dark:text-white">
                  {result.examTitle}
                </h1>
                <p className="text-sm text-[#876870] dark:text-[#c49ba3]">
                  Thí sinh:{' '}
                  <span className="font-semibold text-[#2a161b] dark:text-[#fff2f4]">
                    {result.studentName}
                  </span>
                </p>

                <div className="pt-2">
                  {saveStatus === 'saving' && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#876870] dark:text-[#c49ba3]">
                      Đang lưu kết quả...
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 dark:text-teal-400">
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

              <div className="flex items-center gap-6 rounded-2xl border border-[var(--line)] bg-[#fff6f7]/90 dark:bg-[#241219]/85 px-6 py-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#876870] dark:text-[#c49ba3]">
                    Điểm (/100)
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold font-mono text-crimson dark:text-[#fbbac3] mt-0.5">
                    {result.score100.toFixed(2)}
                  </div>
                </div>
                <div className="h-12 w-px bg-[var(--line)]" />
                <div className="space-y-1 text-xs text-[#5e4249] dark:text-[#ebc9cf] font-mono">
                  <div>
                    Đúng trọn:{' '}
                    <span className="font-semibold text-[#2a161b] dark:text-white">
                      {result.correctCount}/{result.totalQuestions}
                    </span>
                  </div>
                  <div>
                    Điểm thô:{' '}
                    <span className="font-semibold text-[#2a161b] dark:text-white">
                      {result.rawScore}/{result.maxScore}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-crimson" />
                    {formatDuration(result.timeSpentSeconds)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Per-Section Breakdown */}
          {result.sectionResults && result.sectionResults.length > 0 && (
            <section className="glass-card rounded-[24px] p-5 sm:p-6 space-y-3.5">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#876870] dark:text-[#b88c95]">
                Thống kê theo từng phần thi
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {result.sectionResults.map((sec) => {
                  const pct =
                    sec.totalQuestions > 0
                      ? Math.round((sec.correctCount / sec.totalQuestions) * 100)
                      : 0;
                  return (
                    <div
                      key={sec.sectionId}
                      className="rounded-2xl border border-[var(--line)] bg-white/85 dark:bg-[#241219]/75 p-4 space-y-2"
                    >
                      <div className="text-xs font-semibold text-[#2a161b] dark:text-[#fff2f4] truncate">
                        {sec.title}
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-lg font-bold font-mono text-[#2a161b] dark:text-white">
                          {sec.correctCount}/{sec.totalQuestions}{' '}
                          <span className="text-xs font-normal text-[#876870]">câu</span>
                        </span>
                        <span className="text-xs font-mono font-semibold text-crimson dark:text-[#fbbac3]">
                          {sec.rawScore}/{sec.maxScore} đ
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#ffeff1] dark:bg-[#190c11] overflow-hidden">
                        <div
                          style={{
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, #dc263e, #ef6c7e)',
                          }}
                          className="h-full rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Detailed Review */}
          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#876870] dark:text-[#b88c95]">
              Chi tiết bài làm &amp; Lời giải
            </h2>

            {!isAuthenticated ? (
              <div className="glass-card rounded-[24px] p-6 text-center space-y-3">
                <p className="text-sm font-medium text-[#2a161b] dark:text-[#fff2f4]">
                  Vui lòng đăng nhập tài khoản để làm bài và xem lời giải
                </p>
                <button
                  type="button"
                  onClick={() =>
                    onRequireAuth('Vui lòng đăng nhập tài khoản để làm bài và xem lời giải')
                  }
                  className="btn btn-crimson btn-sm"
                >
                  Xem lời giải chi tiết
                </button>
              </div>
            ) : (
              exam.questions
                .filter((q) => Boolean(result.questionResults[q.id]))
                .map((q, idx) => {
                const qRes = result.questionResults[q.id];
                const passage = q.passageId
                  ? exam.passages.find((p) => p.id === q.passageId)
                  : undefined;

                return (
                  <article
                    key={q.id}
                    className="glass-card rounded-[24px] p-5 sm:p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--line)]">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-crimson px-2.5 py-0.5 text-xs font-mono font-semibold text-white">
                          Câu {idx + 1}
                        </span>
                        <span className="text-xs text-[#876870] dark:text-[#c49ba3]">
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
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
                          <XCircle className="w-3.5 h-3.5" />
                          Sai (0/{qRes.maxPoints})
                        </span>
                      )}
                    </div>

                    {passage && (
                      <details className="rounded-2xl border border-[var(--line)] bg-[#fff6f7]/80 dark:bg-[#241219]/65 px-4 py-2.5 text-sm">
                        <summary className="cursor-pointer text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf] select-none">
                          Ngữ liệu: {passage.title}
                        </summary>
                        <div className="mt-3 pt-3 border-t border-[var(--line)] text-[#5e4249] dark:text-[#ebc9cf] leading-relaxed">
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
                      <div className="rounded-2xl border border-[#dc263e]/20 bg-[#fff5f6]/85 dark:bg-[#241219]/80 p-4 text-sm text-[#2a161b] dark:text-[#fff2f4] leading-relaxed">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-crimson dark:text-[#ef6c7e] mb-1">
                          Lời giải
                        </div>
                        <MathText text={q.explanation} />
                      </div>
                    )}

                    {topSolutions[q.id] && (
                      <div className="rounded-2xl border border-amber-300/80 bg-amber-50/70 p-4 text-sm text-[#2a161b] leading-relaxed space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800">
                            <Trophy className="w-3.5 h-3.5 text-amber-600" />
                            🏆 Lời giải ngắn gọn nhất (Cộng đồng)
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#2a161b]">
                              {topSolutions[q.id].author_name}
                            </span>
                            <RankBadge xp={topSolutions[q.id].author_xp} />
                          </div>
                        </div>
                        <MathText text={topSolutions[q.id].content} />
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </section>
        </main>
      </div>

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
