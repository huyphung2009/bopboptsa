import type { Exam, ExamSection, Question } from '../types/exam';

export interface ResolvedSection {
  id: string;
  title: string;
  duration_minutes: number;
  questions: Question[];
}

/**
 * Resolves an exam into ordered sections with their questions.
 * Backward compatible with legacy exams that don't have `exam.sections`.
 */
export function resolveExamSections(exam: Exam): ResolvedSection[] {
  const questions = exam.questions ?? [];
  if (questions.length === 0) return [];

  // Case 1: Exam explicitly defines `sections`
  if (Array.isArray(exam.sections) && exam.sections.length > 0) {
    const buckets: Record<string, Question[]> = {};
    for (const sec of exam.sections) {
      buckets[sec.id] = [];
    }

    const unmatched: Question[] = [];
    for (const q of questions) {
      if (q.sectionId && buckets[q.sectionId]) {
        buckets[q.sectionId].push(q);
      } else {
        const matchedSec = exam.sections.find(
          (s) =>
            s.title.toLowerCase().includes(q.section.toLowerCase()) ||
            q.section.toLowerCase().includes(s.title.toLowerCase())
        );
        if (matchedSec) {
          buckets[matchedSec.id].push(q);
        } else {
          unmatched.push(q);
        }
      }
    }

    if (unmatched.length > 0) {
      buckets[exam.sections[0].id].push(...unmatched);
    }

    return exam.sections
      .map((sec: ExamSection) => ({
        id: sec.id,
        title: sec.title,
        duration_minutes: Math.max(1, Number(sec.duration_minutes) || 30),
        questions: buckets[sec.id] ?? [],
      }))
      .filter((s) => s.questions.length > 0);
  }

  // Case 2: Legacy exam without `sections` -> group by `question.section`
  const orderedTitles: string[] = [];
  const byTitle: Record<string, Question[]> = {};
  for (const q of questions) {
    const label = (q.section || exam.section || 'Phần thi chính').trim();
    if (!byTitle[label]) {
      orderedTitles.push(label);
      byTitle[label] = [];
    }
    byTitle[label].push(q);
  }

  const totalDuration = Math.max(5, Number(exam.duration_minutes) || 60);
  if (orderedTitles.length <= 1) {
    const title = orderedTitles[0] || exam.title;
    return [
      {
        id: 'sec-1',
        title,
        duration_minutes: totalDuration,
        questions,
      },
    ];
  }

  return orderedTitles.map((title, idx) => {
    const secQuestions = byTitle[title];
    const proportionalMinutes = Math.max(
      5,
      Math.round((secQuestions.length / questions.length) * totalDuration)
    );
    return {
      id: `sec-${idx + 1}`,
      title,
      duration_minutes: proportionalMinutes,
      questions: secQuestions,
    };
  });
}

export function isFullScreenMathOrStandalone(
  question: Question | undefined,
  hasPassage: boolean
): boolean {
  if (!hasPassage) return true;
  const sec = (question?.section ?? '').toLowerCase();
  return sec.includes('toán') || sec.includes('định lượng');
}
