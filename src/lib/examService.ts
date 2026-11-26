import { SAMPLE_EXAM } from '../data/sampleExam';
import type { AttemptRecord, Exam, Passage, Question } from '../types/exam';
import { supabase } from './supabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeExamRow(row: any): Exam {
  const payload =
    row.data && typeof row.data === 'object'
      ? row.data
      : row.content && typeof row.content === 'object'
        ? row.content
        : row;

  const passages: Passage[] = Array.isArray(payload.passages)
    ? payload.passages
    : Array.isArray(row.passages)
      ? row.passages
      : [];

  const questions: Question[] = Array.isArray(payload.questions)
    ? payload.questions
    : Array.isArray(row.questions)
      ? row.questions
      : [];

  return {
    id: String(row.id ?? payload.id ?? crypto.randomUUID()),
    title: String(row.title ?? payload.title ?? 'Đề thi TSA chưa đặt tên'),
    description: String(
      row.description ?? payload.description ?? 'Đề luyện thi Đánh giá tư duy TSA HUST'
    ),
    section: row.section ?? payload.section ?? 'Tổng hợp',
    duration_minutes: Number(row.duration_minutes ?? payload.duration_minutes ?? 60),
    passages,
    questions,
    created_at: row.created_at,
  };
}

export async function fetchExams(): Promise<{
  exams: Exam[];
  fromFallback: boolean;
  errorMessage?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return {
        exams: [SAMPLE_EXAM],
        fromFallback: true,
        errorMessage: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        exams: [SAMPLE_EXAM],
        fromFallback: true,
      };
    }

    const normalized = data.map(normalizeExamRow).filter((e) => e.questions.length > 0);
    if (normalized.length === 0) {
      return {
        exams: [SAMPLE_EXAM],
        fromFallback: true,
      };
    }

    return {
      exams: normalized,
      fromFallback: false,
    };
  } catch (err) {
    return {
      exams: [SAMPLE_EXAM],
      fromFallback: true,
      errorMessage: err instanceof Error ? err.message : 'Lỗi kết nối Supabase',
    };
  }
}

export async function fetchLeaderboard(examId: string): Promise<{
  attempts: AttemptRecord[];
  errorMessage?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('attempts')
      .select('*')
      .eq('exam_id', examId)
      .order('score', { ascending: false })
      .order('time_spent_seconds', { ascending: true })
      .limit(50);

    if (error) {
      return { attempts: [], errorMessage: error.message };
    }

    return { attempts: (data ?? []) as AttemptRecord[] };
  } catch (err) {
    return {
      attempts: [],
      errorMessage: err instanceof Error ? err.message : 'Không thể tải bảng xếp hạng',
    };
  }
}

export async function saveAttempt(attempt: AttemptRecord): Promise<{
  ok: boolean;
  errorMessage?: string;
}> {
  try {
    const { error } = await supabase.from('attempts').insert([
      {
        exam_id: attempt.exam_id,
        student_name: attempt.student_name,
        score: attempt.score,
        correct_count: attempt.correct_count,
        total_questions: attempt.total_questions,
        time_spent_seconds: attempt.time_spent_seconds,
      },
    ]);

    if (error) {
      return { ok: false, errorMessage: error.message };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      errorMessage: err instanceof Error ? err.message : 'Lỗi lưu kết quả',
    };
  }
}

export async function createExam(exam: Omit<Exam, 'id' | 'created_at'> & { id?: string }): Promise<{
  ok: boolean;
  errorMessage?: string;
}> {
  try {
    const payload = {
      ...(exam.id ? { id: exam.id } : {}),
      title: exam.title,
      description: exam.description,
      section: exam.section ?? 'Tổng hợp',
      duration_minutes: exam.duration_minutes,
      passages: exam.passages,
      questions: exam.questions,
    };

    const { error } = await supabase.from('exams').insert([payload]);

    if (error) {
      return { ok: false, errorMessage: error.message };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      errorMessage: err instanceof Error ? err.message : 'Lỗi nạp đề thi',
    };
  }
}
