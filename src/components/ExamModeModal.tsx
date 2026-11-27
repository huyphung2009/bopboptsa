import { ArrowRight, Clock, FileText, Layers, Play, X } from 'lucide-react';
import React from 'react';
import type { Exam } from '../types/exam';
import { resolveExamSections } from '../utils/examSections';

interface ExamModeModalProps {
  exam: Exam | null;
  onClose: () => void;
  onStartFullExam: (exam: Exam) => void;
  onStartSection: (exam: Exam, sectionId: string) => void;
}

export const ExamModeModal: React.FC<ExamModeModalProps> = ({
  exam,
  onClose,
  onStartFullExam,
  onStartSection,
}) => {
  if (!exam) return null;

  const sections = resolveExamSections(exam);
  const totalMinutes = sections.reduce((sum, s) => sum + s.duration_minutes, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-zinc-800">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              Chọn chế độ làm bài
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
              {exam.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto custom-scrollbar">
          {/* Mode 1: Full Sequential Exam */}
          <div className="rounded-xl border border-red-200/80 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#B91C1C] dark:text-red-400 mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  Chế độ 1 · Mô phỏng phòng thi thật
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
                  Thi toàn bộ theo trình tự chuẩn
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  Làm lần lượt {sections.length} phần thi ({exam.questions.length} câu ·{' '}
                  {totalMinutes} phút). Mỗi phần có đồng hồ đếm ngược riêng; hết giờ hoặc
                  nộp phần sẽ khóa đáp án và nghỉ chuyển tiếp 5 giây.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-zinc-300">
              {sections.map((sec, idx) => (
                <React.Fragment key={sec.id}>
                  <span className="rounded-md border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-0.5 font-medium">
                    {sec.title} ({sec.duration_minutes}p)
                  </span>
                  {idx < sections.length - 1 && (
                    <span className="text-slate-400">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onStartFullExam(exam)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#B91C1C] hover:bg-red-800 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              Bắt đầu thi thật
            </button>
          </div>

          {/* Mode 2: Practice Single Section */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Chế độ 2 · Luyện tập từng phần riêng lẻ
            </div>

            <div className="space-y-2">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => onStartSection(exam, sec.id)}
                  className="w-full text-left rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50/70 dark:hover:bg-zinc-800/50 p-4 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100 group-hover:text-[#B91C1C] dark:group-hover:text-red-400 transition-colors truncate">
                      {sec.title}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {sec.questions.length} câu
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {sec.duration_minutes} phút
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#B91C1C] dark:group-hover:text-red-400 shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
