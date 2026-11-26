import {
  AlertTriangle,
  Bookmark,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  LogOut,
  Send,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import type { Exam, UserAnswers, UserAnswerValue } from '../types/exam';
import { formatDuration, isQuestionAnswered } from '../utils/scoring';
import { CalculatorModal } from './CalculatorModal';
import { MathText } from './MathText';
import { QuestionRenderer } from './QuestionRenderer';

interface ExamRoomProps {
  exam: Exam;
  studentName: string;
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
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* Top Exam Bar */}
      <header className="shrink-0 h-14 bg-slate-900 text-white px-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onExit}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title="Thoát phòng thi"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thoát</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold truncate">{exam.title}</h1>
            <p className="text-[11px] text-slate-400 truncate">
              Thí sinh: <span className="text-amber-300 font-semibold">{studentName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setShowCalc((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              showCalc
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">Máy tính</span>
          </button>

          <div
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-mono font-bold ${
              isTimeLow
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-slate-800 text-emerald-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            {formatDuration(remainingSeconds)}
          </div>

          <button
            onClick={() => setConfirmSubmitOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Nộp bài
          </button>
        </div>
      </header>

      {/* Main Smart View + Right Question Palette */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Split Screen (when passage exists & not Math) OR Full-Screen Math/Standalone */}
        <div
          className={`flex-1 min-h-0 overflow-hidden ${
            showSplitScreen ? 'grid grid-cols-1 md:grid-cols-2' : 'flex flex-col'
          }`}
        >
          {/* Left Pane: Passage / Context (only in split-screen mode) */}
          {showSplitScreen && currentPassage && (
            <section className="border-b md:border-b-0 md:border-r border-slate-200 bg-white overflow-y-auto custom-scrollbar p-5 sm:p-6">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 mb-3">
                  <FileText className="w-3.5 h-3.5" />
                  {currentPassage.section || currentQuestion.section}
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                  <MathText text={currentPassage.title} />
                </h2>
                <div className="text-[15px] leading-7 text-slate-700">
                  <MathText text={currentPassage.content} />
                </div>
              </div>
            </section>
          )}

          {/* Question & Answer Pane */}
          <section
            className={`flex-1 bg-slate-50 overflow-y-auto custom-scrollbar flex flex-col justify-between ${
              showSplitScreen ? 'p-5 sm:p-6' : 'p-4 sm:p-8'
            }`}
          >
            <div
              className={
                showSplitScreen
                  ? 'w-full'
                  : 'max-w-5xl mx-auto w-full rounded-2xl bg-white border border-slate-200 shadow-xs p-6 sm:p-8'
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5 pb-3 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                    Câu {currentIndex + 1} / {exam.questions.length}
                  </span>
                  <span className="rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700">
                    {currentQuestion.section}
                  </span>
                  <span className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {QUESTION_TYPE_LABEL[currentQuestion.type] ?? currentQuestion.type}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleFlag(currentQuestion.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-colors ${
                    flagged[currentQuestion.id]
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${
                      flagged[currentQuestion.id] ? 'fill-amber-500 text-amber-600' : ''
                    }`}
                  />
                  {flagged[currentQuestion.id] ? 'Đang phân vân' : 'Đánh dấu phân vân'}
                </button>
              </div>

              <div className={showSplitScreen ? '' : 'text-base sm:text-[17px] leading-relaxed'}>
                <QuestionRenderer
                  question={currentQuestion}
                  answer={answers[currentQuestion.id]}
                  onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                />
              </div>
            </div>

            {/* Bottom Prev / Next */}
            <div
              className={`mt-6 pt-4 border-t border-slate-200 flex items-center justify-between ${
                showSplitScreen ? '' : 'max-w-5xl mx-auto w-full'
              }`}
            >
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                Câu trước
              </button>

              <button
                type="button"
                disabled={currentIndex === exam.questions.length - 1}
                onClick={() =>
                  setCurrentIndex((i) => Math.min(exam.questions.length - 1, i + 1))
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
              >
                Câu tiếp
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        </div>

        {/* Question Palette Sidebar */}
        <aside className="shrink-0 lg:w-64 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white p-4 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Danh sách câu hỏi
            </h3>
            <span className="text-xs font-bold text-rose-700">
              {answeredCount}/{exam.questions.length} đã làm
            </span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-10 lg:grid-cols-4 gap-2">
            {exam.questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isDone = isQuestionAnswered(q, answers[q.id]);
              const isFlag = !!flagged[q.id];

              let btnCls = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
              if (isFlag) {
                btnCls = 'bg-amber-100 text-amber-900 border-amber-400';
              } else if (isDone) {
                btnCls = 'bg-emerald-100 text-emerald-800 border-emerald-400';
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative h-9 rounded-lg border text-xs font-bold transition-all ${btnCls} ${
                    isCurrent ? 'ring-2 ring-rose-600 ring-offset-1' : ''
                  }`}
                >
                  {idx + 1}
                  {isFlag && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400" />
              Đã trả lời
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-100 border border-amber-400" />
              Đánh dấu phân vân
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
              Chưa trả lời
            </div>
          </div>
        </aside>
      </div>

      {/* Calculator */}
      <CalculatorModal isOpen={showCalc} onClose={() => setShowCalc(false)} />

      {/* Submit Confirmation Modal */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">Xác nhận nộp bài?</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Bạn đã trả lời{' '}
              <span className="font-bold text-slate-900">
                {answeredCount}/{exam.questions.length}
              </span>{' '}
              câu hỏi. Thời gian còn lại:{' '}
              <span className="font-bold text-rose-700">
                {formatDuration(remainingSeconds)}
              </span>
              . Sau khi nộp, hệ thống sẽ chấm điểm và lưu kết quả lên bảng xếp hạng.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="rounded-xl bg-rose-700 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
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
