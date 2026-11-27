import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  BarChart3,
  Clock,
  FileCheck2,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getExamFormat } from '../config/examFormats';
import { fetchUserAttempts } from '../lib/examService';
import type { AttemptRecord, Exam, ExamType } from '../types/exam';
import { EXAM_TYPES, getExamTypeMeta, normalizeExamType } from '../utils/examTypes';
import { formatDuration } from '../utils/scoring';
import { ScoreReportModal, type ScoreReportData } from './ScoreReportModal';

interface MyScoreboardModalProps {
  isOpen: boolean;
  user: SupabaseUser | null;
  exams: Exam[];
  onClose: () => void;
  onOpenAuth?: () => void;
}

export const MyScoreboardModal: React.FC<MyScoreboardModalProps> = ({
  isOpen,
  user,
  exams,
  onClose,
  onOpenAuth,
}) => {
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | ExamType>('ALL');
  const [selectedReport, setSelectedReport] = useState<ScoreReportData | null>(null);

  const examLookup = useMemo(() => {
    const map: Record<string, Exam> = {};
    for (const ex of exams) {
      map[ex.id] = ex;
    }
    return map;
  }, [exams]);

  const loadAttempts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const res = await fetchUserAttempts(user.id);
    setAttempts(res.attempts);
    setError(res.errorMessage ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      void loadAttempts();
    }
  }, [isOpen, user, loadAttempts]);

  const filteredAttempts = useMemo(() => {
    if (filterType === 'ALL') return attempts;
    return attempts.filter((a) => {
      const ex = examLookup[a.exam_id];
      const t = normalizeExamType(a.exam_type ?? ex?.exam_type);
      return t === filterType;
    });
  }, [attempts, filterType, examLookup]);

  // Summary Stats
  const stats = useMemo(() => {
    if (filteredAttempts.length === 0) {
      return { avg: 0, max: 0, count: 0, maxScale: 100 };
    }
    const fmtScale =
      filterType === 'ALL' ? 100 : getExamFormat(filterType).totalMaxScore;
    let sum = 0;
    let best = 0;
    for (const a of filteredAttempts) {
      const maxS = a.max_score || fmtScale || 100;
      const val =
        filterType === 'ALL'
          ? (Number(a.score) / maxS) * 100
          : Number(a.score);
      sum += val;
      if (val > best) best = val;
    }
    return {
      avg: Math.round((sum / filteredAttempts.length) * 100) / 100,
      max: Math.round(best * 100) / 100,
      count: filteredAttempts.length,
      maxScale: filterType === 'ALL' ? 100 : fmtScale,
    };
  }, [filteredAttempts, filterType]);

  // Section Competency Aggregation
  const sectionCompetency = useMemo(() => {
    const buckets: Record<
      string,
      { title: string; totalPct: number; count: number; avgScore: number; maxScore: number }
    > = {};

    for (const a of filteredAttempts) {
      if (!Array.isArray(a.section_scores)) continue;
      for (const s of a.section_scores) {
        const key = s.title;
        if (!buckets[key]) {
          buckets[key] = {
            title: s.title,
            totalPct: 0,
            count: 0,
            avgScore: 0,
            maxScore: s.sectionMaxScore,
          };
        }
        buckets[key].totalPct += s.accuracyPct;
        buckets[key].avgScore += s.scaledScore;
        buckets[key].count += 1;
      }
    }

    return Object.values(buckets).map((b) => ({
      title: b.title,
      avgPct: Math.round(b.totalPct / b.count),
      avgScore: Math.round((b.avgScore / b.count) * 100) / 100,
      maxScore: b.maxScore,
    }));
  }, [filteredAttempts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-4xl rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-[#B91C1C] dark:text-red-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Bảng điểm cá nhân
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Lịch sử thi & phân tích năng lực theo từng kỳ thi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {user && (
              <button
                onClick={loadAttempts}
                disabled={loading}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                title="Làm mới"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Exam Type Filter Pills */}
        <div className="px-6 py-3 bg-[#FAFAFA] dark:bg-zinc-950 border-b border-slate-200/80 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
              filterType === 'ALL'
                ? 'border-slate-900 dark:border-zinc-100 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
            }`}
          >
            Tất cả
          </button>
          {EXAM_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setFilterType(t.value)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                filterType === t.value
                  ? 'border-[#B91C1C] bg-[#B91C1C] text-white'
                  : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
              }`}
            >
              {t.shortLabel}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-6">
          {!user ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                Vui lòng đăng nhập Google để xem Bảng điểm cá nhân.
              </p>
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="rounded-lg bg-[#B91C1C] hover:bg-red-800 px-4 py-2 text-xs font-semibold text-white"
                >
                  Đăng nhập ngay
                </button>
              )}
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-slate-500 dark:text-zinc-400">
              <div className="inline-block w-6 h-6 border-2 border-[#B91C1C] border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs">Đang tải lịch sử bài thi...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 p-4 text-xs text-red-700 dark:text-red-300">
              Không thể tải lịch sử: {error}
            </div>
          ) : (
            <>
              {/* Stats Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-950 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#B91C1C]" />
                    Điểm trung bình {filterType === 'ALL' ? '(%)' : `(/${stats.maxScale})`}
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900 dark:text-zinc-100 mt-1">
                    {stats.avg.toFixed(2)}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-950 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    Điểm cao nhất
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#B91C1C] dark:text-red-400 mt-1">
                    {stats.max.toFixed(2)}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-950 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                    Tổng lượt thi
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900 dark:text-zinc-100 mt-1">
                    {stats.count}
                  </div>
                </div>
              </div>

              {/* Section Competency Chart */}
              {sectionCompetency.length > 0 && (
                <section className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Biểu đồ năng lực trung bình theo phần thi
                  </h4>
                  <div className="space-y-3">
                    {sectionCompetency.map((sc) => (
                      <div key={sc.title} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-800 dark:text-zinc-200 truncate pr-2">
                            {sc.title}
                          </span>
                          <span className="font-mono font-semibold text-slate-600 dark:text-zinc-400 shrink-0">
                            TB: {sc.avgScore}/{sc.maxScore} ({sc.avgPct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            style={{ width: `${sc.avgPct}%` }}
                            className="h-full rounded-full bg-[#B91C1C] transition-all duration-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Attempts History Table */}
              {filteredAttempts.length === 0 ? (
                <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 p-8 text-center text-xs text-slate-500 dark:text-zinc-400">
                  Chưa có lượt thi nào trong mục này.
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/80 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-950 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                        <th className="py-2.5 px-3">Kỳ thi</th>
                        <th className="py-2.5 px-3">Đề thi</th>
                        <th className="py-2.5 px-3 text-right">Điểm</th>
                        <th className="py-2.5 px-3 text-right">Đúng</th>
                        <th className="py-2.5 px-3 text-right">Thời gian</th>
                        <th className="py-2.5 px-3 text-right">Ngày nộp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-xs sm:text-sm">
                      {filteredAttempts.map((a, idx) => {
                        const ex = examLookup[a.exam_id];
                        const eType = normalizeExamType(a.exam_type ?? ex?.exam_type);
                        const typeMeta = getExamTypeMeta(eType);
                        const maxScale =
                          a.max_score ?? getExamFormat(eType).totalMaxScore;
                        const examTitle = ex?.title ?? `Đề thi (${eType})`;

                        return (
                          <tr
                            key={a.id ?? idx}
                            onClick={() =>
                              setSelectedReport({
                                examTitle,
                                examType: eType,
                                studentName: a.student_name,
                                avatarUrl: a.avatar_url,
                                displayScore: Number(a.score),
                                displayMaxScore: maxScale,
                                correctCount: a.correct_count,
                                totalQuestions: a.total_questions,
                                timeSpentSeconds: a.time_spent_seconds,
                                submittedAt:
                                  a.created_at ?? new Date().toISOString(),
                                sectionResults: a.section_scores ?? undefined,
                                isFlagged: a.is_flagged,
                                violationCount: a.violation_count,
                              })
                            }
                            className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                            title="Bấm để xem Phiếu báo điểm chi tiết"
                          >
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${typeMeta.badgeClass}`}
                              >
                                {typeMeta.shortLabel}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-zinc-200 max-w-[200px] truncate">
                              {examTitle}
                              {(a.is_flagged || (a.violation_count ?? 0) > 3) && (
                                <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600">
                                  <ShieldAlert className="w-3 h-3" />
                                  Vi phạm
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[#B91C1C] dark:text-red-400 whitespace-nowrap">
                              {Number(a.score).toFixed(2)}/{maxScale}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                              {a.correct_count}/{a.total_questions}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(a.time_spent_seconds)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-xs text-slate-400 whitespace-nowrap">
                              {a.created_at
                                ? new Date(a.created_at).toLocaleDateString('vi-VN')
                                : '--'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ScoreReportModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
};
