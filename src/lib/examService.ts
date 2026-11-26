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
      console.error('[fetchExams] Supabase error:', error);
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
    console.error('[fetchExams] Unexpected error:', err);
    return {
      exams: [SAMPLE_EXAM],
      fromFallback: true,
      errorMessage: err instanceof Error ? err.message : 'Lỗi kết nối Supabase',
    };
  }
}

export async function getLeaderboard(examId: string): Promise<{
  attempts: AttemptRecord[];
  errorMessage?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('attempts')
      .select(
        'id, exam_id, student_name, score, correct_count, total_questions, time_spent_seconds, user_answers, user_id, avatar_url, created_at'
      )
      .eq('exam_id', examId)
      .order('score', { ascending: false })
      .order('time_spent_seconds', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('[getLeaderboard] Supabase error:', error);
      return { attempts: [], errorMessage: error.message };
    }

    return { attempts: (data ?? []) as AttemptRecord[] };
  } catch (err) {
    console.error('[getLeaderboard] Unexpected error:', err);
    return {
      attempts: [],
      errorMessage: err instanceof Error ? err.message : 'Không thể tải bảng xếp hạng',
    };
  }
}

export async function submitAttempt(attempt: AttemptRecord): Promise<{
  ok: boolean;
  data?: AttemptRecord;
  errorMessage?: string;
}> {
  const payload = {
    exam_id: attempt.exam_id,
    student_name: attempt.student_name,
    score: Number(attempt.score),
    correct_count: Number(attempt.correct_count ?? 0),
    total_questions: Number(attempt.total_questions ?? 0),
    time_spent_seconds: Number(attempt.time_spent_seconds ?? 0),
    user_answers: attempt.user_answers ?? {},
    user_id: attempt.user_id ?? null,
    avatar_url: attempt.avatar_url ?? null,
  };

  try {
    const { data, error } = await supabase
      .from('attempts')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('[submitAttempt] Supabase error:', error, 'Payload:', payload);
      return { ok: false, errorMessage: error.message };
    }

    return { ok: true, data: data as AttemptRecord };
  } catch (err) {
    console.error('[submitAttempt] Unexpected error:', err);
    return {
      ok: false,
      errorMessage: err instanceof Error ? err.message : 'Lỗi lưu kết quả',
    };
  }
}

export async function upsertExam(
  exam: Omit<Exam, 'id' | 'created_at'> & { id?: string }
): Promise<{
  ok: boolean;
  id?: string;
  errorMessage?: string;
}> {
  try {
    const examId = exam.id && exam.id.trim() ? exam.id.trim() : crypto.randomUUID();
    const payload = {
      id: examId,
      title: exam.title,
      description: exam.description,
      section: exam.section ?? 'Tổng hợp',
      duration_minutes: exam.duration_minutes,
      passages: exam.passages,
      questions: exam.questions,
    };

    const { error } = await supabase
      .from('exams')
      .upsert([payload], { onConflict: 'id' });

    if (error) {
      console.error('[upsertExam] Supabase error:', error);
      return { ok: false, errorMessage: error.message };
    }
    return { ok: true, id: examId };
  } catch (err) {
    console.error('[upsertExam] Unexpected error:', err);
    return {
      ok: false,
      errorMessage: err instanceof Error ? err.message : 'Lỗi lưu đề thi',
    };
  }
}

export async function deleteExam(examId: string): Promise<{
  ok: boolean;
  errorMessage?: string;
}> {
  try {
    const { error } = await supabase.from('exams').delete().eq('id', examId);
    if (error) {
      console.error('[deleteExam] Supabase error:', error);
      return { ok: false, errorMessage: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error('[deleteExam] Unexpected error:', err);
    return {
      ok: false,
      errorMessage: err instanceof Error ? err.message : 'Lỗi xóa đề thi',
    };
  }
}

export async function createExam(
  exam: Omit<Exam, 'id' | 'created_at'> & { id?: string }
): Promise<{
  ok: boolean;
  errorMessage?: string;
}> {
  const res = await upsertExam(exam);
  return { ok: res.ok, errorMessage: res.errorMessage };
}
