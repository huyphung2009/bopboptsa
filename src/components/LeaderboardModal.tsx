import {
  Award,
  Clock,
  Crown,
  FileCheck2,
  Medal,
  RefreshCw,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getLeaderboard } from '../lib/examService';
import {
  fetchGlobalXpLeaderboard,
  fetchProfilesByIds,
  type UserProfile,
} from '../lib/profileService';
import type { AttemptRecord, Exam, ExamType } from '../types/exam';
import { EXAM_TYPES, normalizeExamType } from '../utils/examTypes';
import { formatDuration } from '../utils/scoring';
import { RankBadge } from './RankBadge';

interface LeaderboardModalProps {
  isOpen: boolean;
  exams: Exam[];
  initialExam?: Exam | null;
  initialTab?: 'xp' | 'exam';
  currentUserId?: string | null;
  refreshKey?: number;
  onClose: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface PodiumEntry {
  rank: 1 | 2 | 3;
  name: string;
  avatarUrl?: string | null;
  xp: number;
  primaryMetric: string;
  secondaryMetric: string;
  isCurrentUser: boolean;
}

const PodiumCard: React.FC<{ entry: PodiumEntry }> = ({ entry }) => {
  const isFirst = entry.rank === 1;
  const isSecond = entry.rank === 2;

  const containerClass = isFirst
    ? 'order-1 sm:order-2 border-amber-300 dark:border-amber-700/80 bg-amber-50/40 dark:bg-amber-950/20 sm:-translate-y-2 shadow-sm'
    : isSecond
      ? 'order-2 sm:order-1 border-slate-200/90 dark:border-zinc-700 bg-white dark:bg-zinc-900'
      : 'order-3 border-orange-200/80 dark:border-orange-900/60 bg-white dark:bg-zinc-900';

  return (
    <div
      className={`rounded-xl border p-4 text-center flex flex-col items-center gap-2 transition-all ${containerClass} ${
        entry.isCurrentUser ? 'ring-1 ring-[#B91C1C]' : ''
      }`}
    >
      <div className="flex items-center gap-1 text-xs font-bold">
        {isFirst ? (
          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Crown className="w-4 h-4 fill-amber-400/30" />
            Top 1
          </span>
        ) : isSecond ? (
          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-zinc-400">
            <Medal className="w-4 h-4" />
            Top 2
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400">
            <Medal className="w-4 h-4" />
            Top 3
          </span>
        )}
      </div>

      {entry.avatarUrl ? (
        <img
          src={entry.avatarUrl}
          alt={entry.name}
          className={`rounded-full object-cover border border-slate-200 dark:border-zinc-700 ${
            isFirst ? 'w-14 h-14' : 'w-11 h-11'
          }`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold flex items-center justify-center border border-slate-200/80 dark:border-zinc-700 ${
            isFirst ? 'w-14 h-14 text-base' : 'w-11 h-11 text-xs'
          }`}
        >
          {getInitials(entry.name)}
        </div>
      )}

      <div className="w-full min-w-0 space-y-1">
        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
          {entry.name}
        </div>
        <div className="flex justify-center">
          <RankBadge xp={entry.xp} compact />
        </div>
      </div>

      <div className="pt-1 border-t border-slate-200/60 dark:border-zinc-800 w-full">
        <div className="text-base font-bold font-mono text-[#B91C1C] dark:text-red-400">
          {entry.primaryMetric}
        </div>
        <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
          {entry.secondaryMetric}
        </div>
      </div>
    </div>
  );
};

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  exams,
  initialExam = null,
  initialTab = 'xp',
  currentUserId = null,
  refreshKey = 0,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'xp' | 'exam'>(initialTab);
  const [filterType, setFilterType] = useState<'ALL' | ExamType>('ALL');
  const [selectedExamId, setSelectedExamId] = useState<string>(
    initialExam?.id ?? exams[0]?.id ?? ''
  );

  // Sync props when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    if (initialExam) {
      setSelectedExamId(initialExam.id);
    } else if (!selectedExamId && exams[0]) {
      setSelectedExamId(exams[0].id);
    }
  }, [isOpen, initialExam, initialTab, exams, selectedExamId]);

  const filteredExamList = useMemo(() => {
    if (filterType === 'ALL') return exams;
    return exams.filter((e) => normalizeExamType(e.exam_type) === filterType);
  }, [exams, filterType]);

  // Ensure selectedExamId stays valid when filterType changes
  useEffect(() => {
    if (
      filteredExamList.length > 0 &&
      !filteredExamList.some((e) => e.id === selectedExamId)
    ) {
      setSelectedExamId(filteredExamList[0].id);
    }
  }, [filteredExamList, selectedExamId]);

  // Global XP state
  const [xpProfiles, setXpProfiles] = useState<UserProfile[]>([]);
  const [loadingXp, setLoadingXp] = useState(false);
  const [xpError, setXpError] = useState<string | null>(null);

  // Per-exam attempts state
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, UserProfile>>({});
  const [loadingExam, setLoadingExam] = useState(false);
  const [examError, setExamError] = useState<string | null>(null);

  const loadXpData = useCallback(async () => {
    setLoadingXp(true);
    setXpError(null);
    const res = await fetchGlobalXpLeaderboard();
    setXpProfiles(res.profiles);
    setXpError(res.errorMessage ?? null);
    setLoadingXp(false);
  }, []);

  const loadExamData = useCallback(async (examId: string) => {
    if (!examId) return;
    setLoadingExam(true);
    setExamError(null);
    const res = await getLeaderboard(examId);
    setAttempts(res.attempts);
    setExamError(res.errorMessage ?? null);

    const userIds = res.attempts
      .map((a) => a.user_id)
      .filter((id): id is string => Boolean(id));
    if (userIds.length > 0) {
      const profiles = await fetchProfilesByIds(userIds);
      setProfilesMap(profiles);
    } else {
      setProfilesMap({});
    }
    setLoadingExam(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === 'xp') {
      void loadXpData();
    } else if (selectedExamId) {
      void loadExamData(selectedExamId);
    }
  }, [isOpen, activeTab, selectedExamId, refreshKey, loadXpData, loadExamData]);

  if (!isOpen) return null;

  const isLoading = activeTab === 'xp' ? loadingXp : loadingExam;
  const errorMessage = activeTab === 'xp' ? xpError : examError;

  // Build Podium + List for current tab
  const xpTop3: PodiumEntry[] = xpProfiles.slice(0, 3).map((p, i) => ({
    rank: (i + 1) as 1 | 2 | 3,
    name: p.full_name || 'Thí sinh Parabol',
    avatarUrl: p.avatar_url,
    xp: p.xp,
    primaryMetric: `${p.xp.toLocaleString('vi-VN')} XP`,
    secondaryMetric: `${p.exams_completed} đề đã thi`,
    isCurrentUser: Boolean(currentUserId && p.id === currentUserId),
  }));

  const examTop3: PodiumEntry[] = attempts.slice(0, 3).map((a, i) => ({
    rank: (i + 1) as 1 | 2 | 3,
    name: a.student_name,
    avatarUrl: a.avatar_url,
    xp: a.user_id && profilesMap[a.user_id] ? profilesMap[a.user_id].xp : 0,
    primaryMetric: `${Number(a.score).toFixed(2)} đ`,
    secondaryMetric: `${a.correct_count ?? '-'}/${a.total_questions ?? '-'} · ${
      a.time_spent_seconds !== undefined
        ? formatDuration(a.time_spent_seconds)
        : '--:--'
    }`,
    isCurrentUser: Boolean(currentUserId && a.user_id === currentUserId),
  }));

  const podiumEntries = activeTab === 'xp' ? xpTop3 : examTop3;

  // Find current user's rank if outside Top 10
  const myXpIndex = currentUserId
    ? xpProfiles.findIndex((p) => p.id === currentUserId)
    : -1;
  const myExamIndex = currentUserId
    ? attempts.findIndex((a) => a.user_id === currentUserId)
    : -1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Trophy className="w-5 h-5 text-[#B91C1C] dark:text-red-500 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Bảng xếp hạng Parabol
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Vinh danh Cao thủ XP & Thủ khoa từng đề thi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() =>
                activeTab === 'xp'
                  ? loadXpData()
                  : selectedExamId && loadExamData(selectedExamId)
              }
              disabled={isLoading}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              title="Tải lại"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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

        {/* Filter Tabs Bar */}
        <div className="px-6 py-3 bg-[#FAFAFA] dark:bg-zinc-950 border-b border-slate-200/80 dark:border-zinc-800 space-y-3 shrink-0">
          <div className="grid grid-cols-2 rounded-lg bg-slate-200/60 dark:bg-zinc-800 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('xp')}
              className={`rounded-md py-1.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'xp'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B91C1C] dark:text-red-400" />
              Cao thủ XP (Toàn hệ thống)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('exam')}
              className={`rounded-md py-1.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'exam'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Xếp hạng theo Đề thi
            </button>
          </div>

          {activeTab === 'exam' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'ALL' | ExamType)}
                className="rounded-lg border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 focus:border-red-700 focus:outline-none"
              >
                <option value="ALL">Tất cả kỳ thi</option>
                {EXAM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="sm:col-span-2 rounded-lg border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-zinc-200 focus:border-red-700 focus:outline-none"
              >
                {filteredExamList.length === 0 ? (
                  <option value="">Không có đề thi thuộc kỳ thi này</option>
                ) : (
                  filteredExamList.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      [{normalizeExamType(ex.exam_type)}] {ex.title}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-6">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 dark:text-zinc-400">
              <div className="inline-block w-6 h-6 border-2 border-[#B91C1C] border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs">Đang tải dữ liệu bảng xếp hạng...</p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 p-4 text-xs text-red-700 dark:text-red-300">
              Không thể tải bảng xếp hạng: {errorMessage}
            </div>
          ) : podiumEntries.length === 0 ? (
            <div className="py-12 text-center">
              <Award className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-2.5" />
              <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                Chưa có dữ liệu xếp hạng.
              </p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                Hãy hoàn thành bài thi để ghi danh trên bảng vàng Parabol.
              </p>
            </div>
          ) : (
            <>
              {/* Podium Top 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 items-end">
                {podiumEntries.map((entry) => (
                  <PodiumCard key={entry.rank} entry={entry} />
                ))}
              </div>

              {/* Rank 4+ Clean Table */}
              {activeTab === 'xp' && xpProfiles.length > 3 && (
                <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/80 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-950 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                        <th className="py-2.5 px-3">Hạng</th>
                        <th className="py-2.5 px-3">Thí sinh & Cấp bậc</th>
                        <th className="py-2.5 px-3 text-right">Số đề</th>
                        <th className="py-2.5 px-3 text-right">Tổng XP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-sm">
                      {xpProfiles.slice(3, 50).map((prof, idx) => {
                        const rank = idx + 4;
                        const isMe = Boolean(currentUserId && prof.id === currentUserId);
                        return (
                          <tr
                            key={prof.id}
                            className={
                              isMe
                                ? 'bg-red-50/60 dark:bg-red-950/30 font-semibold'
                                : 'hover:bg-slate-50/70 dark:hover:bg-zinc-800/40'
                            }
                          >
                            <td className="py-2.5 px-3 text-xs font-mono text-slate-500">
                              #{rank}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5">
                                {prof.avatar_url ? (
                                  <img
                                    src={prof.avatar_url}
                                    alt={prof.full_name || 'Thí sinh'}
                                    className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                                    {getInitials(prof.full_name || 'U')}
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-2 min-w-0">
                                  <span className="text-slate-800 dark:text-zinc-200 truncate max-w-[160px]">
                                    {prof.full_name || 'Thí sinh Parabol'}
                                  </span>
                                  <RankBadge xp={prof.xp} compact />
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right text-xs font-mono text-slate-500 dark:text-zinc-400">
                              <span className="inline-flex items-center gap-1">
                                <FileCheck2 className="w-3 h-3" />
                                {prof.exams_completed}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900 dark:text-zinc-100">
                              {prof.xp.toLocaleString('vi-VN')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'exam' && attempts.length > 3 && (
                <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/80 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-950 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                        <th className="py-2.5 px-3">Hạng</th>
                        <th className="py-2.5 px-3">Thí sinh & Cấp bậc</th>
                        <th className="py-2.5 px-3 text-right">Điểm (/100)</th>
                        <th className="py-2.5 px-3 text-right">Đúng</th>
                        <th className="py-2.5 px-3 text-right">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-sm">
                      {attempts.slice(3).map((item, idx) => {
                        const rank = idx + 4;
                        const profile = item.user_id
                          ? profilesMap[item.user_id]
                          : undefined;
                        const isMe = Boolean(
                          currentUserId && item.user_id === currentUserId
                        );

                        return (
                          <tr
                            key={item.id ?? `${item.student_name}-${idx}`}
                            className={
                              isMe
                                ? 'bg-red-50/60 dark:bg-red-950/30 font-semibold'
                                : 'hover:bg-slate-50/70 dark:hover:bg-zinc-800/40'
                            }
                          >
                            <td className="py-2.5 px-3 text-xs font-mono text-slate-500">
                              #{rank}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5">
                                {item.avatar_url ? (
                                  <img
                                    src={item.avatar_url}
                                    alt={item.student_name}
                                    className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                                    {getInitials(item.student_name)}
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-2 min-w-0">
                                  <span className="text-slate-800 dark:text-zinc-200 truncate max-w-[150px]">
                                    {item.student_name}
                                  </span>
                                  {profile ? (
                                    <RankBadge xp={profile.xp} compact />
                                  ) : (
                                    <span className="text-[10px] text-slate-400">
                                      Khách
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900 dark:text-zinc-100">
                              {Number(item.score).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-xs font-mono text-slate-500">
                              {item.correct_count ?? '-'}/{item.total_questions ?? '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right text-xs font-mono text-slate-500 whitespace-nowrap">
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
            </>
          )}
        </div>

        {/* Pinned "Thứ hạng của bạn" footer bar if user is outside Top 10 */}
        {activeTab === 'xp' && myXpIndex >= 10 && (
          <div className="px-6 py-3 border-t border-red-200/80 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 flex items-center justify-between text-xs shrink-0">
            <span className="font-semibold text-slate-800 dark:text-zinc-200">
              Thứ hạng của bạn:{' '}
              <span className="font-mono font-bold text-[#B91C1C] dark:text-red-400">
                #{myXpIndex + 1}
              </span>
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
              {xpProfiles[myXpIndex].xp.toLocaleString('vi-VN')} XP
            </span>
          </div>
        )}

        {activeTab === 'exam' && myExamIndex >= 10 && (
          <div className="px-6 py-3 border-t border-red-200/80 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 flex items-center justify-between text-xs shrink-0">
            <span className="font-semibold text-slate-800 dark:text-zinc-200">
              Thứ hạng của bạn:{' '}
              <span className="font-mono font-bold text-[#B91C1C] dark:text-red-400">
                #{myExamIndex + 1}
              </span>
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
              {Number(attempts[myExamIndex].score).toFixed(2)} đ
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
