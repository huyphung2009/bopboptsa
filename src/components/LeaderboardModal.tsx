import { Award, Clock, Crown, Medal, RefreshCw, Trophy, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { getLeaderboard } from '../lib/examService';
import type { AttemptRecord, Exam } from '../types/exam';
import { formatDuration } from '../utils/scoring';

interface LeaderboardModalProps {
  exam: Exam | null;
  refreshKey?: number;
  onClose: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  exam,
  refreshKey = 0,
  onClose,
}) => {
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (examId: string) => {
    setLoading(true);
    setError(null);
    const res = await getLeaderboard(examId);
    setAttempts(res.attempts);
    setError(res.errorMessage ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!exam) return;
    loadData(exam.id);
  }, [exam, refreshKey, loadData]);

  if (!exam) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-3 min-w-0">
            <Trophy className="w-5 h-5 text-red-700 dark:text-red-500 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Bảng xếp hạng
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                {exam.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => loadData(exam.id)}
              disabled={loading}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              title="Tải lại bảng xếp hạng"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Đóng bảng xếp hạng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 max-h-[72vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-slate-500 dark:text-zinc-400">
              <div className="inline-block w-6 h-6 border-2 border-red-700 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs">Đang tải dữ liệu xếp hạng...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 p-4 text-xs text-red-700 dark:text-red-300">
              Không thể tải bảng xếp hạng: {error}
            </div>
          ) : attempts.length === 0 ? (
            <div className="py-12 text-center">
              <Award className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-2.5" />
              <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                Chưa có lượt thi nào cho đề này.
              </p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                Hãy hoàn thành bài thi để ghi danh đầu tiên.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    <th className="py-2.5 px-3">Hạng</th>
                    <th className="py-2.5 px-3">Thí sinh</th>
                    <th className="py-2.5 px-3 text-right">Điểm (/100)</th>
                    <th className="py-2.5 px-3 text-right">Đúng</th>
                    <th className="py-2.5 px-3 text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-sm">
                  {attempts.map((item, idx) => {
                    const rank = idx + 1;
                    return (
                      <tr
                        key={item.id ?? `${item.student_name}-${idx}`}
                        className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-3 px-3 whitespace-nowrap">
                          {rank === 1 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                              <Crown className="w-4 h-4 fill-amber-400/30" />
                              #1
                            </span>
                          ) : rank === 2 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-zinc-400">
                              <Medal className="w-4 h-4" />
                              #2
                            </span>
                          ) : rank === 3 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400">
                              <Medal className="w-4 h-4" />
                              #3
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-slate-400 dark:text-zinc-500 pl-1">
                              #{rank}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {item.avatar_url ? (
                              <img
                                src={item.avatar_url}
                                alt={item.student_name}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[11px] font-bold flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-zinc-700">
                                {getInitials(item.student_name)}
                              </div>
                            )}
                            <span className="font-medium text-slate-800 dark:text-zinc-200 truncate max-w-[170px] sm:max-w-[240px]">
                              {item.student_name}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-bold font-mono text-slate-900 dark:text-zinc-100">
                          {Number(item.score).toFixed(2)}
                        </td>

                        <td className="py-3 px-3 text-right text-xs text-slate-500 dark:text-zinc-400 font-mono">
                          {item.correct_count ?? '-'}/{item.total_questions ?? '-'}
                        </td>

                        <td className="py-3 px-3 text-right text-xs text-slate-500 dark:text-zinc-400 font-mono whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.time_spent_seconds !== undefined
                              ? formatDuration(item.time_spent_seconds)
                              : '--:--'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
