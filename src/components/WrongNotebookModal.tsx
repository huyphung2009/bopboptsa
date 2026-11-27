import { BookOpen, CheckCircle2, X, XCircle } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { isValidAttempt } from '../lib/achievementService';
import { fetchUserAttempts } from '../lib/examService';
import type { AttemptRecord, Exam, Question, UserAnswerValue } from '../types/exam';
import { gradeQuestion } from '../utils/scoring';
import { MathText } from './MathText';

interface WrongNotebookModalProps {
  isOpen: boolean;
  userId?: string;
  exams: Exam[];
  refreshKey?: number;
  onClose: () => void;
  onRequireAuth?: () => void;
}

interface WrongItem {
  key: string;
  examTitle: string;
  attemptDate: string;
  question: Question;
  userAnswerLabel: string;
  correctAnswerLabel: string;
}

function formatUserAnswer(q: Question, ans: UserAnswerValue | undefined): string {
  if (ans === undefined || ans === null || ans === '') return 'Chưa trả lời';
  if (q.type === 'single_choice' && typeof ans === 'string') {
    const opt = q.options?.find((o) => o.id === ans);
    return opt ? `${opt.id}. ${opt.text}` : ans;
  }
  if (typeof ans === 'string') {
    return ans.trim() || 'Chưa trả lời';
  }
  if (typeof ans === 'object') {
    const entries = Object.entries(ans as Record<string, string | boolean | null>);
    if (entries.length === 0) return 'Chưa trả lời';
    return entries
      .map(([k, v]) => {
        if (v === true) return `${k}: Đúng`;
        if (v === false) return `${k}: Sai`;
        return `${k}: ${v ?? 'Trống'}`;
      })
      .join(' | ');
  }
  return String(ans);
}

function formatCorrectAnswer(q: Question): string {
  switch (q.type) {
    case 'single_choice': {
      const opt = q.options?.find((o) => o.id === q.correctOption);
      return opt ? `${opt.id}. ${opt.text}` : q.correctOption || '';
    }
    case 'short_answer':
      return (q.correctAnswers ?? []).join(' / ');
    case 'true_false':
      return (q.statements ?? [])
        .map((s) => `${s.id}: ${s.correct ? 'Đúng' : 'Sai'}`)
        .join(' | ');
    case 'drag_drop':
      return (q.blanks ?? [])
        .map((b) => `${b.id}: ${b.correctWord}`)
        .join(' | ');
    default:
      return '';
  }
}

export const WrongNotebookModal: React.FC<WrongNotebookModalProps> = ({
  isOpen,
  userId,
  exams,
  refreshKey = 0,
  onClose,
  onRequireAuth,
}) => {
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;
    let cancelled = false;
    setLoading(true);
    fetchUserAttempts(userId)
      .then((res) => {
        if (!cancelled) setAttempts(res.attempts);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, userId, refreshKey]);

  const wrongItems = useMemo<WrongItem[]>(() => {
    if (!userId) return [];
    const examMap = new Map<string, Exam>();
    for (const ex of exams) examMap.set(ex.id, ex);

    const items: WrongItem[] = [];
    const recentValid = attempts.filter(isValidAttempt).slice(0, 8);

    for (const attempt of recentValid) {
      const exam = examMap.get(attempt.exam_id);
      if (!exam || !attempt.user_answers) continue;
      const answers = attempt.user_answers;
      const dateStr = attempt.created_at
        ? new Date(attempt.created_at).toLocaleDateString('vi-VN')
        : '';

      for (const q of exam.questions) {
        const userAns = answers[q.id];
        const graded = gradeQuestion(q, userAns);
        if (!graded.isFullCorrect) {
          items.push({
            key: `${attempt.id ?? attempt.created_at}-${q.id}`,
            examTitle: exam.title,
            attemptDate: dateStr,
            question: q,
            userAnswerLabel: formatUserAnswer(q, userAns),
            correctAnswerLabel: formatCorrectAnswer(q),
          });
        }
        if (items.length >= 25) break;
      }
      if (items.length >= 25) break;
    }

    return items;
  }, [attempts, exams, userId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-[#261118]/45 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded-[26px] border border-[var(--line)] bg-white/95 dark:bg-[#1b0d13]/95 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[#fff6f7]/80 dark:bg-[#241219]/75">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-crimson" />
            <div>
              <h3 className="text-base font-semibold text-[#2a161b] dark:text-[#fff2f4]">
                Sổ tay câu sai
              </h3>
              <p className="text-xs text-[#876870] dark:text-[#c49ba3]">
                Tổng hợp các câu làm sai hoặc bỏ trống từ các lượt thi gần đây
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-[#876870] hover:text-crimson hover:bg-[#ffeff1] transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 max-h-[72vh] overflow-y-auto custom-scrollbar space-y-4">
          {!userId ? (
            <div className="rounded-2xl border border-[var(--line)] bg-[#fff9fa] p-6 text-center space-y-3">
              <p className="text-sm font-medium text-[#2a161b]">
                Bạn cần đăng nhập để xem Sổ tay câu sai cá nhân.
              </p>
              {onRequireAuth && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequireAuth();
                  }}
                  className="btn btn-crimson btn-sm"
                >
                  Đăng nhập ngay
                </button>
              )}
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-xs text-[#876870]">
              Đang tổng hợp các câu sai từ lịch sử thi...
            </div>
          ) : wrongItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[#fff9fa] p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold text-[#2a161b]">
                Tuyệt vời! Chưa ghi nhận câu sai nào gần đây.
              </p>
              <p className="text-xs text-[#876870]">
                Hãy hoàn thành thêm đề thi để hệ thống tự động lưu các câu cần ôn lại tại đây.
              </p>
            </div>
          ) : (
            wrongItems.map((item, idx) => (
              <div
                key={item.key}
                className="rounded-2xl border border-[var(--line)] bg-white p-4 space-y-2.5 shadow-2xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#876870]">
                  <span className="font-semibold text-crimson">
                    Câu {idx + 1} · {item.examTitle}
                  </span>
                  {item.attemptDate && <span className="font-mono">{item.attemptDate}</span>}
                </div>

                <div className="text-sm text-[#2a161b] leading-relaxed">
                  <MathText text={item.question.prompt} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-rose-800 flex items-start gap-1.5">
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <div>
                      <span className="font-semibold">Bạn chọn: </span>
                      {item.userAnswerLabel}
                    </div>
                  </div>
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-800 flex items-start gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <div>
                      <span className="font-semibold">Đáp án đúng: </span>
                      {item.correctAnswerLabel}
                    </div>
                  </div>
                </div>

                {item.question.explanation && (
                  <div className="rounded-xl bg-[#fff8f9] border border-[var(--line)] px-3.5 py-2.5 text-xs text-[#4a3037] leading-relaxed">
                    <span className="font-semibold text-crimson">Lời giải: </span>
                    <MathText text={item.question.explanation} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
