import { Award, Clock, Medal, Trophy, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { fetchLeaderboard } from '../lib/examService';
import type { AttemptRecord, Exam } from '../types/exam';
import { formatDuration } from '../utils/scoring';

interface LeaderboardModalProps {
  exam: Exam | null;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ exam, onClose }) => {
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!exam) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchLeaderboard(exam.id).then((res) => {
      if (cancelled) return;
      setAttempts(res.attempts);
      setError(res.errorMessage ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [exam]);

  if (!exam) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between bg-gradient-to-r from-red-700 to-rose-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-300" />
            <div>
              <h3 className="text-lg font-bold">Bảng xếp hạng TSA</h3>
              <p className="text-xs text-rose-100 line-clamp-1">{exam.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-white/20 transition-colors"
            aria-label="Đóng bảng xếp hạng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
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
                    return (
                      <tr
                        key={item.id ?? `${item.student_name}-${idx}`}
                        className={rank <= 3 ? 'bg-amber-50/40' : 'hover:bg-slate-50'}
                      >
                        <td className="py-3 px-3 font-bold">
                          {rank === 1 ? (
                            <span className="inline-flex items-center gap-1 text-amber-600">
                              <Medal className="w-4 h-4" /> #1
                            </span>
                          ) : rank === 2 ? (
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              <Medal className="w-4 h-4" /> #2
                            </span>
                          ) : rank === 3 ? (
                            <span className="inline-flex items-center gap-1 text-amber-700">
                              <Medal className="w-4 h-4" /> #3
                            </span>
                          ) : (
                            <span className="text-slate-400">#{rank}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800">
                          {item.student_name}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-rose-700">
                          {Number(item.score).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600">
                          {item.correct_count ?? '-'} / {item.total_questions ?? '-'}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500">
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
