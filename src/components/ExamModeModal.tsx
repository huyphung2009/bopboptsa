import {
  ArrowRight,
  BookOpenCheck,
  Clock,
  FileText,
  Layers,
  Play,
  ShieldCheck,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import type { Exam } from '../types/exam';
import { resolveExamSections } from '../utils/examSections';

interface ExamModeModalProps {
  exam: Exam | null;
  onClose: () => void;
  onStartFullExam: (exam: Exam, mode: 'exam' | 'practice') => void;
  onStartSection: (exam: Exam, sectionId: string, mode: 'exam' | 'practice') => void;
}

export const ExamModeModal: React.FC<ExamModeModalProps> = ({
  exam,
  onClose,
  onStartFullExam,
  onStartSection,
}) => {
  const [selectedMode, setSelectedMode] = useState<'exam' | 'practice'>('exam');

  if (!exam) return null;

  const sections = resolveExamSections(exam);
  const totalMinutes = sections.reduce((sum, s) => sum + s.duration_minutes, 0);
  const isPractice = selectedMode === 'practice';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#261118]/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-[26px] bg-white/95 dark:bg-[#1b0d13]/95 backdrop-blur-2xl shadow-[0_32px_90px_-28px_rgba(38,17,24,0.45)] border border-[var(--line)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[#fff6f7]/75 dark:bg-[#241219]/65">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-[#2a161b] dark:text-[#fff2f4]">
              Chọn chế độ làm bài
            </h3>
            <p className="text-xs text-[#876870] dark:text-[#c49ba3] truncate mt-0.5">
              {exam.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-[#876870] hover:text-crimson hover:bg-[#ffeff1] dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Exam vs Practice Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedMode('exam')}
              className={`text-left rounded-2xl border p-3.5 transition-all cursor-pointer ${
                selectedMode === 'exam'
                  ? 'border-crimson bg-[#ffeff1]/90 dark:bg-[#dc263e]/20 shadow-xs'
                  : 'border-[var(--line)] bg-white/80 dark:bg-[#241219]/60 hover:border-crimson/40'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#2a161b] dark:text-white">
                <ShieldCheck className="w-4 h-4 text-crimson" />
                Thi thử (Tính giờ)
              </div>
              <p className="mt-1 text-[11px] text-[#876870] dark:text-[#c49ba3] leading-relaxed">
                Đếm ngược chuẩn phòng thi, bật chống gian lận &amp; ghi nhận bảng xếp hạng.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('practice')}
              className={`text-left rounded-2xl border p-3.5 transition-all cursor-pointer ${
                selectedMode === 'practice'
                  ? 'border-teal-600 dark:border-teal-500 bg-teal-50/80 dark:bg-teal-950/35 shadow-xs'
                  : 'border-[var(--line)] bg-white/80 dark:bg-[#241219]/60 hover:border-teal-500/40'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#2a161b] dark:text-white">
                <BookOpenCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Luyện tập (Tự do)
              </div>
              <p className="mt-1 text-[11px] text-[#876870] dark:text-[#c49ba3] leading-relaxed">
                Không giới hạn giờ, chọn đáp án xong hiện ngay đúng/sai &amp; lời giải KaTeX.
              </p>
            </button>
          </div>

          {/* Full Exam */}
          <div className="rounded-2xl border border-[#dc263e]/30 bg-gradient-to-br from-[#fff5f6] to-[#ffeff1]/80 dark:from-[#26131a] dark:to-[#2e151e] p-5 space-y-3.5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-crimson dark:text-[#fbbac3] mb-1">
                <Layers className="w-3.5 h-3.5" />
                Toàn bộ đề thi
              </div>
              <h4 className="text-sm sm:text-base font-semibold text-[#2a161b] dark:text-white">
                {isPractice
                  ? 'Luyện tập toàn bộ câu hỏi'
                  : sections.length > 1
                    ? 'Thi toàn bộ theo trình tự chuẩn'
                    : 'Bắt đầu làm toàn bộ đề thi'}
              </h4>
              <p className="text-xs text-[#5e4249] dark:text-[#ebc9cf] mt-1 leading-relaxed">
                {exam.questions.length} câu hỏi
                {!isPractice && ` · ${totalMinutes} phút`}
                {sections.length > 1 && !isPractice
                  ? ' · Làm lần lượt từng phần với đồng hồ riêng và nghỉ 5 giây giữa các phần.'
                  : ''}
              </p>
            </div>

            {sections.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#5e4249] dark:text-[#f8d4da]">
                {sections.map((sec, idx) => (
                  <React.Fragment key={sec.id}>
                    <span className="rounded-full border border-[var(--line)] bg-white/95 dark:bg-[#190c11]/85 px-2.5 py-0.5 font-medium">
                      {sec.title}
                      {!isPractice ? ` (${sec.duration_minutes}p)` : ''}
                    </span>
                    {idx < sections.length - 1 && (
                      <span className="text-crimson">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => onStartFullExam(exam, selectedMode)}
              className="btn btn-crimson w-full !py-2.5"
            >
              <Play className="w-4 h-4 fill-current" />
              {isPractice ? 'Bắt đầu Luyện tập' : 'Bắt đầu Thi thử'}
            </button>
          </div>

          {/* Single Section Practice / Exam */}
          {sections.length > 1 && (
            <div className="space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#876870] dark:text-[#b88c95]">
                Hoặc chọn từng phần riêng lẻ
              </div>

              <div className="space-y-2.5">
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => onStartSection(exam, sec.id, selectedMode)}
                    className="lift-card w-full text-left rounded-2xl border border-[var(--line)] bg-white/85 dark:bg-[#241219]/65 hover:bg-[#fff5f6] dark:hover:bg-[#2e151e] p-4 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#2a161b] dark:text-[#fff2f4] group-hover:text-crimson transition-colors truncate">
                        {sec.title}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#876870] dark:text-[#c49ba3] mt-1 font-mono">
                        <span className="inline-flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-crimson" />
                          {sec.questions.length} câu
                        </span>
                        {!isPractice && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-crimson" />
                            {sec.duration_minutes} phút
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#876870] group-hover:text-crimson group-hover:translate-x-0.5 shrink-0 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
