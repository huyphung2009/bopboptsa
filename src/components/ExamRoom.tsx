import {
  AlertTriangle,
  Bookmark,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  LogOut,
  Moon,
  Send,
  Sun,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Exam, UserAnswers, UserAnswerValue } from '../types/exam';
import { formatDuration, isQuestionAnswered } from '../utils/scoring';
import { CalculatorModal } from './CalculatorModal';
import { MathText } from './MathText';
import { QuestionRenderer } from './QuestionRenderer';

interface ExamRoomProps {
  exam: Exam;
  studentName: string;
  isDark: boolean;
  onToggleDark: () => void;
  onSubmit: (answers: UserAnswers, timeSpentSeconds: number) => void;
  onExit: () => void;
}

const QUESTION_TYPE_LABEL: Record<string, string> = {
  single_choice: 'Trắc nghiệm 1 đáp án',
  true_false: 'Đúng / Sai nhiều ý',
  drag_drop: 'Kéo thả / Điền từ',
  short_answer: 'Điền số / Trả lời ngắn',
};

export const ExamRoom: React.FC<ExamRoomProps> = ({
  exam,
  studentName,
  isDark,
  onToggleDark,
  onSubmit,
  onExit,
}) => {
  const totalSeconds = Math.max(60, exam.duration_minutes * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [showCalc, setShowCalc] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resizable split-screen state (percentage of left pane)
  const [leftWidthPct, setLeftWidthPct] = useState(48);
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement | null>(null);

  const currentQuestion = exam.questions[currentIndex];
  const currentPassage = useMemo(() => {
    if (!currentQuestion?.passageId) return null;
    return exam.passages.find((p) => p.id === currentQuestion.passageId) ?? null;
  }, [exam.passages, currentQuestion]);

  const isMathSection =
    currentQuestion?.section?.toLowerCase().includes('toán') ?? false;
  const showSplitScreen = Boolean(currentPassage) && !isMathSection;

  // Countdown timer
  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Auto submit when timer hits 0
  useEffect(() => {
    if (remainingSeconds === 0 && !isSubmitting) {
      setIsSubmitting(true);
      onSubmit(answers, totalSeconds);
    }
  }, [remainingSeconds, isSubmitting, answers, totalSeconds, onSubmit]);

  // Keyboard shortcuts: Left / Right Arrow to navigate questions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (confirmSubmitOpen) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((i) => Math.min(exam.questions.length - 1, i + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exam.questions.length, confirmSubmitOpen]);

  // Resizable divider pointer handlers
  useEffect(() => {
    if (!isDraggingDivider) return;

    const handlePointerMove = (e: PointerEvent) => {
      const container = splitContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const rawPct = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(68, Math.max(30, rawPct));
      setLeftWidthPct(clamped);
    };

    const handlePointerUp = () => {
      setIsDraggingDivider(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingDivider]);

  const handleAnswerChange = (qId: string, val: UserAnswerValue) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const toggleFlag = (qId: string) => {
    setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const answeredCount = useMemo(() => {
    return exam.questions.filter((q) => isQuestionAnswered(q, answers[q.id])).length;
  }, [exam.questions, answers]);

  const handleManualSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const spent = Math.max(1, totalSeconds - remainingSeconds);
    onSubmit(answers, spent);
  };

  const isTimeLow = remainingSeconds <= 300;

  return (
    <div
      className={`h-screen flex flex-col bg-[#FAFAFA] dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 overflow-hidden ${
        isDraggingDivider ? 'select-none cursor-col-resize' : ''
      }`}
    >
      {/* Thin Minimalist Topbar (h-14) */}
      <header className="shrink-0 h-14 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md px-4 flex items-center justify-between border-b border-slate-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onExit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            title="Thoát phòng thi"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thoát</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 truncate">
              {exam.title}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
              Thí sinh: <span className="font-medium text-slate-700 dark:text-zinc-300">{studentName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleDark}
            className="rounded-lg p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={isDark ? 'Chế độ Sáng' : 'Chế độ Tối'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowCalc((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              showCalc
                ? 'border-red-700 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400'
                : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Máy tính</span>
          </button>

          <div
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs sm:text-sm font-mono font-semibold ${
              isTimeLow
                ? 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(remainingSeconds)}
          </div>

          <button
            onClick={() => setConfirmSubmitOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 hover:bg-red-800 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Nộp bài
          </button>
        </div>
      </header>

      {/* Main Content + Question Navigator */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Smart Workspace: Resizable Split-Screen OR Full-Screen Math/Standalone */}
        <div
          ref={splitContainerRef}
          className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden"
        >
          {/* Left Pane: Passage (only when passage exists & not Math) */}
          {showSplitScreen && currentPassage && (
            <>
              <section
                style={{ '--left-w': `${leftWidthPct}%` } as React.CSSProperties}
                className="w-full md:w-[var(--left-w)] h-1/2 md:h-full shrink-0 bg-white dark:bg-zinc-900 border-b md:border-b-0 border-slate-200/80 dark:border-zinc-800 overflow-y-auto custom-scrollbar p-6 sm:p-8"
              >
                <div className="max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-zinc-300 mb-3">
                    <FileText className="w-3 h-3" />
                    {currentPassage.section || currentQuestion.section}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-4 pb-3 border-b border-slate-100 dark:border-zinc-800">
                    <MathText text={currentPassage.title} />
                  </h2>
                  <div className="text-[15px] leading-relaxed text-slate-700 dark:text-zinc-300">
                    <MathText text={currentPassage.content} />
                  </div>
                </div>
              </section>

              {/* Resizable Divider (desktop) */}
              <div
                role="separator"
                aria-orientation="vertical"
                onPointerDown={() => setIsDraggingDivider(true)}
                title="Kéo để thay đổi kích thước khung ngữ liệu"
                className="hidden md:flex w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-slate-200/70 dark:bg-zinc-800 hover:bg-red-700/40 dark:hover:bg-red-600/40 transition-colors group"
              >
                <div className="w-0.5 h-8 rounded-full bg-slate-400/60 dark:bg-zinc-600 group-hover:bg-red-700" />
              </div>
            </>
          )}

          {/* Question & Answer Pane */}
          <section
            className={`flex-1 min-w-0 bg-[#FAFAFA] dark:bg-zinc-950 overflow-y-auto custom-scrollbar flex flex-col justify-between ${
              showSplitScreen ? 'p-5 sm:p-7' : 'p-4 sm:p-8 lg:p-10'
            }`}
          >
            <div
              className={
                showSplitScreen
                  ? 'w-full max-w-2xl mx-auto'
                  : 'max-w-4xl mx-auto w-full rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs p-6 sm:p-9'
              }
            >
              {/* Question Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-3.5 border-b border-slate-200/80 dark:border-zinc-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-slate-900 dark:bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-white dark:text-zinc-900 font-mono">
                    Câu {currentIndex + 1}/{exam.questions.length}
                  </span>
                  <span className="rounded-md border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/70 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-zinc-300">
                    {currentQuestion.section}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-zinc-500">
                    • {QUESTION_TYPE_LABEL[currentQuestion.type] ?? currentQuestion.type}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleFlag(currentQuestion.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors ${
                    flagged[currentQuestion.id]
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                      : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${
                      flagged[currentQuestion.id]
                        ? 'fill-amber-500 text-amber-500'
                        : ''
                    }`}
                  />
                  {flagged[currentQuestion.id] ? 'Đã đánh dấu' : 'Xem lại'}
                </button>
              </div>

              {/* Question Body */}
              <div className={showSplitScreen ? 'text-[15px]' : 'text-base sm:text-[17px]'}>
                <QuestionRenderer
                  question={currentQuestion}
                  answer={answers[currentQuestion.id]}
                  onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                />
              </div>
            </div>

            {/* Bottom Prev / Next */}
            <div
              className={`mt-6 pt-4 border-t border-slate-200/80 dark:border-zinc-800 flex items-center justify-between ${
                showSplitScreen ? 'max-w-2xl mx-auto w-full' : 'max-w-4xl mx-auto w-full'
              }`}
            >
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Câu trước
              </button>

              <span className="hidden sm:inline text-[11px] text-slate-400 dark:text-zinc-500">
                Phím tắt: ← / → để chuyển câu
              </span>

              <button
                type="button"
                disabled={currentIndex === exam.questions.length - 1}
                onClick={() =>
                  setCurrentIndex((i) => Math.min(exam.questions.length - 1, i + 1))
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-zinc-100 px-4 py-2 text-xs sm:text-sm font-semibold text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
              >
                Câu tiếp
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        </div>

        {/* Minimalist Question Navigator Sidebar */}
        <aside className="shrink-0 lg:w-60 border-t lg:border-t-0 lg:border-l border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Danh sách câu
            </h3>
            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-zinc-300">
              {answeredCount}/{exam.questions.length}
            </span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-10 lg:grid-cols-4 gap-1.5">
            {exam.questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isDone = isQuestionAnswered(q, answers[q.id]);
              const isFlag = !!flagged[q.id];

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative h-9 rounded-lg border text-xs font-mono font-semibold transition-all ${
                    isCurrent
                      ? 'border-red-700 dark:border-red-500 bg-red-50/70 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                      : isDone
                        ? 'border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100'
                        : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {idx + 1}
                  {isFlag ? (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                  ) : isDone ? (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Đã làm
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Đánh dấu xem lại
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full border border-slate-300 dark:border-zinc-600" />
              Chưa làm
            </div>
          </div>
        </aside>
      </div>

      {/* Calculator */}
      <CalculatorModal isOpen={showCalc} onClose={() => setShowCalc(false)} />

      {/* Submit Confirmation Modal */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-xl border border-slate-200/80 dark:border-zinc-800">
            <div className="flex items-center gap-2.5 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-700 dark:text-red-500 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Xác nhận nộp bài
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Bạn đã hoàn thành{' '}
              <span className="font-semibold text-slate-900 dark:text-zinc-100 font-mono">
                {answeredCount}/{exam.questions.length}
              </span>{' '}
              câu hỏi. Thời gian còn lại:{' '}
              <span className="font-semibold text-red-700 dark:text-red-400 font-mono">
                {formatDuration(remainingSeconds)}
              </span>
              .
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(false)}
                className="rounded-lg border border-slate-200/80 dark:border-zinc-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="rounded-lg bg-red-700 hover:bg-red-800 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Đang chấm điểm...' : 'Nộp bài ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
