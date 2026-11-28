import { getExamFormat } from '../config/examFormats';
import type {
  Exam,
  ExamAttemptResult,
  Question,
  QuestionResult,
  SectionResultSummary,
  UserAnswers,
  UserAnswerValue,
} from '../types/exam';
import { resolveExamSections } from './examSections';
import { normalizeExamType } from './examTypes';

function normalizeShortAnswer(val: string): string {
  return val
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/,/g, '.');
}

export function isQuestionAnswered(
  question: Question,
  answer: UserAnswerValue | undefined
): boolean {
  if (answer === undefined || answer === null) return false;

  switch (question.type) {
    case 'single_choice':
      return typeof answer === 'string' && answer.trim().length > 0;
    case 'multiple_choice_multi':
      return Array.isArray(answer) && answer.length > 0;
    case 'short_answer':
      return typeof answer === 'string' && answer.trim().length > 0;
    case 'true_false': {
      if (typeof answer !== 'object') return false;
      const map = answer as Record<string, boolean | null>;
      return Object.values(map).some((v) => v === true || v === false);
    }
    case 'drag_drop': {
      if (typeof answer !== 'object') return false;
      const map = answer as Record<string, string>;
      return Object.values(map).some((v) => typeof v === 'string' && v.trim().length > 0);
    }
    default:
      return false;
  }
}

export function gradeQuestion(
  question: Question,
  answer: UserAnswerValue | undefined
): QuestionResult {
  const maxPoints = question.points ?? 1;
  const answered = isQuestionAnswered(question, answer);

  if (!answered) {
    return {
      questionId: question.id,
      earnedPoints: 0,
      maxPoints,
      isFullCorrect: false,
      isPartialCorrect: false,
      isAnswered: false,
    };
  }

  let ratio = 0;

  switch (question.type) {
    case 'single_choice': {
      if (typeof answer === 'string' && answer === question.correctOption) {
        ratio = 1;
      }
      break;
    }

    case 'multiple_choice_multi': {
      const expected = Array.from(
        new Set(
          (question.correctAnswers ?? [])
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean)
        )
      );
      const selected = Array.isArray(answer)
        ? Array.from(
            new Set(
              answer.map((s) => String(s).trim().toUpperCase()).filter(Boolean)
            )
          )
        : [];
      if (
        expected.length > 0 &&
        selected.length === expected.length &&
        expected.every((id) => selected.includes(id))
      ) {
        ratio = 1;
      }
      break;
    }

    case 'true_false': {
      const statements = question.statements ?? [];
      const userMap = (answer as Record<string, boolean | null>) || {};
      if (statements.length > 0) {
        let correctCount = 0;
        for (const stmt of statements) {
          if (userMap[stmt.id] === stmt.correct) {
            correctCount += 1;
          }
        }
        // Quy tắc chấm Đúng/Sai chuẩn TSA / Bộ GD: 4 ý -> 1 ý: 0.1, 2 ý: 0.25, 3 ý: 0.5, 4 ý: 1.0
        if (statements.length === 4) {
          const table: Record<number, number> = { 0: 0, 1: 0.1, 2: 0.25, 3: 0.5, 4: 1 };
          ratio = table[correctCount] ?? 0;
        } else {
          ratio = correctCount / statements.length;
        }
      }
      break;
    }

    case 'drag_drop': {
      const blanks = question.blanks ?? [];
      const userMap = (answer as Record<string, string>) || {};
      if (blanks.length > 0) {
        let matched = 0;
        for (const blank of blanks) {
          const chosen = (userMap[blank.id] ?? '').trim();
          if (chosen && chosen === blank.correctWord.trim()) {
            matched += 1;
          }
        }
        ratio = matched / blanks.length;
      }
      break;
    }

    case 'short_answer': {
      const userText = typeof answer === 'string' ? normalizeShortAnswer(answer) : '';
      const accepted = (question.correctAnswers ?? []).map(normalizeShortAnswer);
      if (userText && accepted.includes(userText)) {
        ratio = 1;
      }
      break;
    }
  }

  const earnedPoints = Math.round(maxPoints * ratio * 1000) / 1000;
  const isFullCorrect = ratio >= 0.999;
  const isPartialCorrect = ratio > 0 && !isFullCorrect;

  return {
    questionId: question.id,
    earnedPoints,
    maxPoints,
    isFullCorrect,
    isPartialCorrect,
    isAnswered: true,
  };
}

export function gradeExam(
  exam: Exam,
  studentName: string,
  answers: UserAnswers,
  timeSpentSeconds: number,
  targetSectionId?: string
): ExamAttemptResult {
  const resolvedSections = resolveExamSections(exam);
  const activeSections = targetSectionId
    ? resolvedSections.filter((s) => s.id === targetSectionId)
    : resolvedSections;

  const targetQuestions =
    activeSections.length > 0
      ? activeSections.flatMap((s) => s.questions)
      : exam.questions;

  const questionResults: Record<string, QuestionResult> = {};
  let rawScore = 0;
  let maxScore = 0;
  let correctCount = 0;

  for (const q of targetQuestions) {
    const res = gradeQuestion(q, answers[q.id]);
    questionResults[q.id] = res;
    rawScore += res.earnedPoints;
    maxScore += res.maxPoints;
    if (res.isFullCorrect) {
      correctCount += 1;
    }
  }

  const examType = normalizeExamType(exam.exam_type);
  const format = getExamFormat(examType);

  const sectionResults: SectionResultSummary[] = activeSections.map((sec, idx) => {
    let secCorrect = 0;
    let secRaw = 0;
    let secMax = 0;
    for (const q of sec.questions) {
      const r = questionResults[q.id];
      if (r) {
        secRaw += r.earnedPoints;
        secMax += r.maxPoints;
        if (r.isFullCorrect) secCorrect += 1;
      }
    }

    const matchedFmtSec =
      format.sections.find(
        (fs) =>
          fs.title.toLowerCase().includes(sec.title.toLowerCase()) ||
          sec.title.toLowerCase().includes(fs.title.toLowerCase())
      ) ?? format.sections[idx];

    const sectionMaxScore =
      sec.max_score ??
      matchedFmtSec?.max_score ??
      (maxScore > 0
        ? Math.round((secMax / maxScore) * format.totalMaxScore * 100) / 100
        : format.totalMaxScore);

    const scaledScore =
      secMax > 0
        ? Math.round((secRaw / secMax) * sectionMaxScore * 100) / 100
        : 0;

    const accuracyPct =
      sec.questions.length > 0
        ? Math.round((secCorrect / sec.questions.length) * 100)
        : 0;

    return {
      sectionId: sec.id,
      title: sec.title,
      correctCount: secCorrect,
      totalQuestions: sec.questions.length,
      rawScore: Math.round(secRaw * 100) / 100,
      maxScore: Math.round(secMax * 100) / 100,
      scaledScore,
      sectionMaxScore,
      accuracyPct,
    };
  });

  const displayMaxScore =
    sectionResults.length > 0
      ? Math.round(
          sectionResults.reduce((s, r) => s + r.sectionMaxScore, 0) * 100
        ) / 100
      : format.totalMaxScore;

  const displayScore =
    sectionResults.length > 0
      ? Math.round(
          sectionResults.reduce((s, r) => s + r.scaledScore, 0) * 100
        ) / 100
      : maxScore > 0
        ? Math.round((rawScore / maxScore) * format.totalMaxScore * 100) / 100
        : 0;

  const score100 =
    maxScore > 0 ? Math.round(((rawScore / maxScore) * 100) * 100) / 100 : 0;

  return {
    examId: exam.id,
    examTitle:
      targetSectionId && activeSections[0]
        ? `${exam.title} (${activeSections[0].title})`
        : exam.title,
    examType,
    studentName,
    score100,
    displayScore,
    displayMaxScore,
    rawScore: Math.round(rawScore * 100) / 100,
    maxScore: Math.round(maxScore * 100) / 100,
    correctCount,
    totalQuestions: targetQuestions.length,
    timeSpentSeconds,
    sectionResults,
    questionResults,
    answers,
    submittedAt: new Date().toISOString(),
  };
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
