import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  CloudCheck,
  CloudOff,
  HelpCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import React from 'react';
import type { Exam, ExamAttemptResult } from '../types/exam';
import { formatDuration } from '../utils/scoring';
import { MathText } from './MathText';
import { QuestionRenderer } from './QuestionRenderer';

interface ResultViewProps {
  exam: Exam;
  result: ExamAttemptResult;
  saveStatus: 'saving' | 'saved' | 'error';
  saveError?: string;
  onBackHome: () => void;
  onRetry: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  exam,
  result,
  saveStatus,
  saveError,
  onBackHome,
  onRetry,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-rose-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Về kho đề thi
          </button>

          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-rose-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Thi lại đề này
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Score Summary Card */}
        <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 text-white p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300 mb-3">
                <Award className="w-4 h-4" />
                Kết quả bài thi TSA
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold">{result.examTitle}</h1>
              <p className="mt-1 text-sm text-slate-300">
                Thí sinh: <span className="font-bold text-white">{result.studentName}</span>
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                {saveStatus === 'saving' && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-slate-200">
                    Đang lưu kết quả lên Supabase...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 px-3 py-1.5 text-emerald-300 font-medium">
                    <CloudCheck className="w-4 h-4" />
                    Đã lưu vào bảng xếp hạng
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-400/30 px-3 py-1.5 text-amber-200 font-medium">
                    <CloudOff className="w-4 h-4" />
                    Chưa lưu được lên Supabase{saveError ? `: ${saveError}` : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 bg-white/10 backdrop-blur-xs rounded-2xl p-5 border border-white/10">
              <div className="text-center">
                <div className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                  Điểm thang 100
                </div>
                <div className="text-4xl sm:text-5xl font-black text-amber-400 mt-1">
                  {result.score100.toFixed(2)}
                </div>
              </div>
              <div className="h-14 w-px bg-white/15" />
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Đạt trọn điểm:{' '}
                  <span className="font-bold text-white">
                    {result.correctCount}/{result.totalQuestions}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <Award className="w-4 h-4 text-amber-300" />
                  Điểm thô:{' '}
                  <span className="font-bold text-white">
                    {result.rawScore}/{result.maxScore}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <Clock className="w-4 h-4 text-sky-300" />
                  Thời gian:{' '}
                  <span className="font-bold text-white">
                    {formatDuration(result.timeSpentSeconds)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Question Review */}
        <section className="space-y-5">
          <h2 className="text-lg font-bold text-slate-900">
            Chi tiết bài làm & Lời giải
          </h2>

          {exam.questions.map((q, idx) => {
            const qRes = result.questionResults[q.id];
            const passage = q.passageId
              ? exam.passages.find((p) => p.id === q.passageId)
              : undefined;

            let badge = (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
                <XCircle className="w-3.5 h-3.5" /> Sai (0/{qRes.maxPoints} đ)
              </span>
            );

            if (qRes.isFullCorrect) {
              badge = (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đúng ({qRes.earnedPoints}/
                  {qRes.maxPoints} đ)
                </span>
              );
            } else if (qRes.isPartialCorrect) {
              badge = (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                  <HelpCircle className="w-3.5 h-3.5" /> Đúng một phần (
                  {qRes.earnedPoints}/{qRes.maxPoints} đ)
                </span>
              );
            }

            return (
              <article
                key={q.id}
                className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
                      Câu {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {q.section}
                    </span>
                  </div>
                  {badge}
                </div>

                {passage && (
                  <details className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm">
                    <summary className="cursor-pointer font-semibold text-slate-700 select-none">
                      Xem ngữ liệu: {passage.title}
                    </summary>
                    <div className="mt-3 pt-3 border-t border-slate-200 text-slate-600 leading-relaxed">
                      <MathText text={passage.content} />
                    </div>
                  </details>
                )}

                <QuestionRenderer
                  question={q}
                  answer={result.answers[q.id]}
                  readOnly
                />

                {q.explanation && (
                  <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 text-sm text-sky-950">
                    <div className="font-bold text-sky-800 mb-1">Lời giải chi tiết:</div>
                    <MathText text={q.explanation} />
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
};
