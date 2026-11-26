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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between bg-gradient-to-r from-red-800 via-rose-700 to-amber-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold">Bảng xếp hạng TSA</h3>
              <p className="text-xs text-rose-100 truncate">{exam.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => loadData(exam.id)}
              disabled={loading}
              className="rounded-lg p-1.5 hover:bg-white/20 transition-colors disabled:opacity-50"
              title="Tải lại bảng xếp hạng"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 hover:bg-white/20 transition-colors"
              aria-label="Đóng bảng xếp hạng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <div className="inline-block w-7 h-7 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-sm">Đang tải dữ liệu xếp hạng từ Supabase...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              Không thể tải bảng xếp hạng: {error}
            </div>
          ) : attempts.length === 0 ? (
            <div className="py-12 text-center">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Chưa có lượt thi nào cho đề này.</p>
              <p className="text-sm text-slate-400 mt-1">
                Hãy là thí sinh đầu tiên ghi danh trên bảng vàng!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-3">Hạng</th>
                    <th className="py-3 px-3">Thí sinh</th>
                    <th className="py-3 px-3 text-right">Điểm (/100)</th>
                    <th className="py-3 px-3 text-right">Số câu đúng</th>
                    <th className="py-3 px-3 text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {attempts.map((item, idx) => {
                    const rank = idx + 1;
                    const rowBg =
                      rank === 1
                        ? 'bg-gradient-to-r from-amber-50 to-yellow-50/50'
                        : rank === 2
                          ? 'bg-slate-50/90'
                          : rank === 3
                            ? 'bg-orange-50/50'
                            : 'hover:bg-slate-50';

                    return (
                      <tr key={item.id ?? `${item.student_name}-${idx}`} className={rowBg}>
                        <td className="py-3 px-3 font-bold whitespace-nowrap">
                          {rank === 1 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-extrabold text-amber-700">
                              <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                              Top 1
                            </span>
                          ) : rank === 2 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 border border-slate-300 px-2.5 py-0.5 text-xs font-extrabold text-slate-700">
                              <Medal className="w-3.5 h-3.5 text-slate-600" />
                              Top 2
                            </span>
                          ) : rank === 3 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 border border-orange-300 px-2.5 py-0.5 text-xs font-extrabold text-orange-800">
                              <Medal className="w-3.5 h-3.5 text-orange-700" />
                              Top 3
                            </span>
                          ) : (
                            <span className="text-slate-400 pl-2">#{rank}</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {item.avatar_url ? (
                              <img
                                src={item.avatar_url}
                                alt={item.student_name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center shrink-0 border border-rose-200">
                                {getInitials(item.student_name)}
                              </div>
                            )}
                            <span className="font-semibold text-slate-800 truncate max-w-[180px] sm:max-w-[240px]">
                              {item.student_name}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-extrabold text-rose-700">
                          {Number(item.score).toFixed(2)}
                        </td>

                        <td className="py-3 px-3 text-right font-medium text-slate-600">
                          {item.correct_count ?? '-'} / {item.total_questions ?? '-'}
                        </td>

                        <td className="py-3 px-3 text-right text-slate-500 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
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
