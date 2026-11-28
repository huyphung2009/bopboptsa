import type { Exam, ExamAttemptResult } from '../types/exam';

export interface BlackHoleItem {
  questionId: string;
  questionNumber: number;
  secondsSpent: number;
}

export interface BlackHoleAnalysis {
  thresholdSeconds: number;
  items: BlackHoleItem[];
  blackHoleIds: Set<string>;
  totalWastedSeconds: number;
}

export function formatShortMinSec(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}p${String(secs).padStart(2, '0')}s`;
}

export function analyzeTimeBlackHoles(
  exam: Exam,
  result: ExamAttemptResult
): BlackHoleAnalysis {
  const questionTimes = result.questionTimes ?? {};
  const reviewedQuestions = exam.questions.filter((q) =>
    Boolean(result.questionResults[q.id])
  );
  const totalQuestions = Math.max(1, reviewedQuestions.length);

  // Use exam duration (or sum of section durations) in seconds
  const totalAllowedMinutes =
    exam.sections && exam.sections.length > 0
      ? exam.sections.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) ||
        exam.duration_minutes
      : exam.duration_minutes;

  const avgTimeSeconds = (Math.max(1, totalAllowedMinutes) * 60) / totalQuestions;
  const thresholdSeconds = Math.max(180, avgTimeSeconds * 2);

  const items: BlackHoleItem[] = [];
  const blackHoleIds = new Set<string>();
  let totalWastedSeconds = 0;

  reviewedQuestions.forEach((q, idx) => {
    const qRes = result.questionResults[q.id];
    const spent = Number(questionTimes[q.id] ?? 0);
    if (qRes && !qRes.isFullCorrect && spent >= thresholdSeconds) {
      items.push({
        questionId: q.id,
        questionNumber: idx + 1,
        secondsSpent: spent,
      });
      blackHoleIds.add(q.id);
      totalWastedSeconds += spent;
    }
  });

  return {
    thresholdSeconds,
    items,
    blackHoleIds,
    totalWastedSeconds,
  };
}
