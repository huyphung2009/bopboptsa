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
import type { AttemptRecord, Exam } from '../types/exam';
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
    ? 'order-1 sm:order-2 border-[#dc263e]/40 bg-gradient-to-b from-[#ffeff1]/95 to-white dark:from-[#361621] dark:to-[#1d0f15] sm:-translate-y-2 shadow-[0_18px_40px_-20px_rgba(220,38,62,0.32)]'
    : isSecond
      ? 'order-2 sm:order-1 border-[var(--line)] bg-white/90 dark:bg-[#241219]/75'
      : 'order-3 border-[var(--line)] bg-white/90 dark:bg-[#241219]/75';

  return (
    <div
      className={`rounded-2xl border p-4 text-center flex flex-col items-center gap-2 transition-all ${containerClass} ${
        entry.isCurrentUser ? 'ring-2 ring-crimson/70' : ''
      }`}
    >
      <div className="flex items-center gap-1 text-xs font-bold">
        {isFirst ? (
          <span className="inline-flex items-center gap-1 text-crimson dark:text-[#fbbac3]">
            <Crown className="w-4 h-4 fill-crimson/20 text-crimson dark:text-[#ef6c7e]" />
            Top 1
          </span>
        ) : isSecond ? (
          <span className="inline-flex items-center gap-1 text-[#5e4249] dark:text-[#ebc9cf]">
            <Medal className="w-4 h-4 text-[#ef6c7e]" />
            Top 2
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Medal className="w-4 h-4" />
            Top 3
          </span>
        )}
      </div>

      {entry.avatarUrl ? (
        <img
          src={entry.avatarUrl}
          alt={entry.name}
          className={`rounded-full object-cover border border-[var(--line)] ${
            isFirst ? 'w-14 h-14' : 'w-11 h-11'
          }`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`rounded-full bg-[#ffeff1] dark:bg-[#2e151e] text-crimson dark:text-[#fbbac3] font-bold flex items-center justify-center border border-[var(--line)] ${
            isFirst ? 'w-14 h-14 text-base' : 'w-11 h-11 text-xs'
          }`}
        >
          {getInitials(entry.name)}
        </div>
      )}

      <div className="w-full min-w-0 space-y-1">
        <div className="text-xs sm:text-sm font-semibold text-[#2a161b] dark:text-[#fff2f4] truncate">
          {entry.name}
        </div>
        <div className="flex justify-center">
          <RankBadge xp={entry.xp} compact />
        </div>
      </div>

      <div className="pt-1.5 border-t border-[var(--line)] w-full">
        <div className="text-base font-bold font-mono text-crimson dark:text-[#fbbac3]">
          {entry.primaryMetric}
        </div>
        <div className="text-[11px] font-mono text-[#876870] dark:text-[#c49ba3]">
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

  useEffect(() => {
    if (exams.length > 0 && !exams.some((e) => e.id === selectedExamId)) {
      setSelectedExamId(exams[0].id);
    }
  }, [exams, selectedExamId]);

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

  const rankedExamAttempts = useMemo(() => {
    const clean = attempts.filter(
      (a) =>
        !a.is_flagged &&
        !a.is_cheating &&
        a.status !== 'violated' &&
        (a.violation_count ?? 0) <= 3
    );

    const bestByParticipant = new Map<string, AttemptRecord>();
    for (const a of clean) {
      const key = a.user_id
        ? `user:${a.user_id}`
        : `guest:${(a.student_name || 'Thí sinh ẩn danh').trim().toLowerCase()}`;

      const existing = bestByParticipant.get(key);
      if (!existing) {
        bestByParticipant.set(key, a);
        continue;
      }

      const candidateScore = Number(a.score ?? 0);
      const existingScore = Number(existing.score ?? 0);
      const candidateTime = a.time_spent_seconds ?? Number.MAX_SAFE_INTEGER;
      const existingTime = existing.time_spent_seconds ?? Number.MAX_SAFE_INTEGER;

      if (
        candidateScore > existingScore ||
        (candidateScore === existingScore && candidateTime < existingTime)
      ) {
        bestByParticipant.set(key, a);
      }
    }

    return Array.from(bestByParticipant.values()).sort((a, b) => {
      const scoreDiff = Number(b.score ?? 0) - Number(a.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (
        (a.time_spent_seconds ?? Number.MAX_SAFE_INTEGER) -
        (b.time_spent_seconds ?? Number.MAX_SAFE_INTEGER)
      );
    });
  }, [attempts]);

  if (!isOpen) return null;

  const isLoading = activeTab === 'xp' ? loadingXp : loadingExam;
  const errorMessage = activeTab === 'xp' ? xpError : examError;

  const xpTop3: PodiumEntry[] = xpProfiles.slice(0, 3).map((p, i) => ({
    rank: (i + 1) as 1 | 2 | 3,
    name: p.full_name || 'Thí sinh Parabol',
    avatarUrl: p.avatar_url,
    xp: p.xp,
    primaryMetric: `${p.xp.toLocaleString('vi-VN')} XP`,
    secondaryMetric: `${p.exams_completed} đề đã thi`,
    isCurrentUser: Boolean(currentUserId && p.id === currentUserId),
  }));

  const examTop3: PodiumEntry[] = rankedExamAttempts.slice(0, 3).map((a, i) => ({
    rank: (i + 1) as 1 | 2 | 3,
    name: a.student_name || 'Thí sinh ẩn danh',
    avatarUrl: a.avatar_url,
    xp: a.user_id && profilesMap[a.user_id] ? profilesMap[a.user_id].xp ?? 0 : 0,
    primaryMetric: `${Number(a.score ?? 0).toFixed(2)} đ`,
    secondaryMetric: `${a.correct_count ?? '-'}/${a.total_questions ?? '-'} · ${
      a.time_spent_seconds !== undefined && a.time_spent_seconds !== null
        ? formatDuration(a.time_spent_seconds)
        : '--:--'
    }`,
    isCurrentUser: Boolean(currentUserId && a.user_id === currentUserId),
  }));

  const podiumEntries = activeTab === 'xp' ? xpTop3 : examTop3;

  const myXpIndex = currentUserId
    ? xpProfiles.findIndex((p) => p.id === currentUserId)
    : -1;
  const myExamIndex = currentUserId
    ? rankedExamAttempts.findIndex((a) => a.user_id === currentUserId)
    : -1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#261118]/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-[26px] bg-white/95 dark:bg-[#1b0d13]/95 backdrop-blur-2xl shadow-[0_32px_90px_-28px_rgba(38,17,24,0.45)] border border-[var(--line)] overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[#fff6f7]/75 dark:bg-[#241219]/65 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Trophy className="w-5 h-5 text-crimson shrink-0" />
            <div>
              <h3 className="text-base font-semibold text-[#2a161b] dark:text-[#fff2f4]">
                Bảng xếp hạng Parabol
              </h3>
              <p className="text-xs text-[#876870] dark:text-[#c49ba3]">
                Vinh danh Cao thủ XP &amp; Thủ khoa từng đề thi
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
              className="grid h-8 w-8 place-items-center rounded-full text-[#876870] hover:text-crimson hover:bg-[#ffeff1] dark:hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
              title="Tải lại"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-[#876870] hover:text-crimson hover:bg-[#ffeff1] dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Đóng bảng xếp hạng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs Bar */}
        <div className="px-6 py-3.5 bg-[#fff8f9] dark:bg-[#190c11]/80 border-b border-[var(--line)] space-y-3 shrink-0">
          <div className="grid grid-cols-2 rounded-full bg-[#ffeff1]/85 dark:bg-[#241219] border border-[var(--line)] p-1">
            <button
              type="button"
              onClick={() => setActiveTab('xp')}
              className={`rounded-full py-1.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'xp'
                  ? 'bg-crimson text-white shadow-xs'
                  : 'text-[#5e4249] dark:text-[#ebc9cf] hover:text-crimson'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Cao thủ XP (Toàn hệ thống)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('exam')}
              className={`rounded-full py-1.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'exam'
                  ? 'bg-crimson text-white shadow-xs'
                  : 'text-[#5e4249] dark:text-[#ebc9cf] hover:text-crimson'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Xếp hạng theo Đề thi
            </button>
          </div>

          {activeTab === 'exam' && (
            <div>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full rounded-full border border-[var(--line)] bg-white dark:bg-[#1d0f15] px-4 py-1.5 text-xs font-medium text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
              >
                {exams.length === 0 ? (
                  <option value="">Chưa có đề thi TSA nào</option>
                ) : (
                  exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      [TSA] {ex.title}
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
            <div className="py-12 text-center text-[#876870] dark:text-[#c49ba3]">
              <div className="inline-block w-6 h-6 border-2 border-crimson border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs">Đang tải dữ liệu bảng xếp hạng...</p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 p-4 text-xs text-rose-700 dark:text-rose-300">
              Không thể tải bảng xếp hạng: {errorMessage}
            </div>
          ) : podiumEntries.length === 0 ? (
            <div className="py-12 text-center">
              <Award className="w-10 h-10 text-[#fbbac3] dark:text-[#dc263e]/50 mx-auto mb-2.5" />
              <p className="text-sm font-medium text-[#2a161b] dark:text-[#fff2f4]">
                Chưa có dữ liệu xếp hạng.
              </p>
              <p className="text-xs text-[#876870] dark:text-[#b88c95] mt-1">
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
                <div className="rounded-2xl border border-[var(--line)] overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--line)] bg-[#fff6f7] dark:bg-[#241219] text-[11px] font-semibold uppercase tracking-wider text-[#876870] dark:text-[#c49ba3]">
                        <th className="py-2.5 px-3">Hạng</th>
                        <th className="py-2.5 px-3">Thí sinh &amp; Cấp bậc</th>
                        <th className="py-2.5 px-3 text-right">Số đề</th>
                        <th className="py-2.5 px-3 text-right">Tổng XP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)] text-sm">
                      {xpProfiles.slice(3, 50).map((prof, idx) => {
                        const rank = idx + 4;
                        const isMe = Boolean(currentUserId && prof.id === currentUserId);
                        return (
                          <tr
                            key={prof.id}
                            className={
                              isMe
                                ? 'bg-[#ffeff1]/80 dark:bg-[#dc263e]/20 font-semibold'
                                : 'hover:bg-[#fff5f6]/75 dark:hover:bg-white/5'
                            }
                          >
                            <td className="py-2.5 px-3 text-xs font-mono text-[#876870] dark:text-[#c49ba3]">
                              #{rank}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5">
                                {prof.avatar_url ? (
                                  <img
                                    src={prof.avatar_url}
                                    alt={prof.full_name || 'Thí sinh'}
                                    className="w-7 h-7 rounded-full object-cover border border-[var(--line)] shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-[#ffeff1] dark:bg-[#2e151e] text-crimson dark:text-[#fbbac3] text-[11px] font-bold flex items-center justify-center shrink-0">
                                    {getInitials(prof.full_name || 'U')}
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-2 min-w-0">
                                  <span className="text-[#2a161b] dark:text-[#fff2f4] truncate max-w-[160px]">
                                    {prof.full_name || 'Thí sinh Parabol'}
                                  </span>
                                  <RankBadge xp={prof.xp} compact />
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right text-xs font-mono text-[#876870] dark:text-[#c49ba3]">
                              <span className="inline-flex items-center gap-1">
                                <FileCheck2 className="w-3 h-3 text-crimson" />
                                {prof.exams_completed}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold font-mono text-crimson dark:text-[#fbbac3]">
                              {prof.xp.toLocaleString('vi-VN')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'exam' && rankedExamAttempts.length > 3 && (
                <div className="rounded-2xl border border-[var(--line)] overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--line)] bg-[#fff6f7] dark:bg-[#241219] text-[11px] font-semibold uppercase tracking-wider text-[#876870] dark:text-[#c49ba3]">
                        <th className="py-2.5 px-3">Hạng</th>
                        <th className="py-2.5 px-3">Thí sinh &amp; Cấp bậc</th>
                        <th className="py-2.5 px-3 text-right">Điểm (/100)</th>
                        <th className="py-2.5 px-3 text-right">Đúng</th>
                        <th className="py-2.5 px-3 text-right">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)] text-sm">
                      {rankedExamAttempts.slice(3).map((item, idx) => {
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
                                ? 'bg-[#ffeff1]/80 dark:bg-[#dc263e]/20 font-semibold'
                                : 'hover:bg-[#fff5f6]/75 dark:hover:bg-white/5'
                            }
                          >
                            <td className="py-2.5 px-3 text-xs font-mono text-[#876870] dark:text-[#c49ba3]">
                              #{rank}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5">
                                {item.avatar_url ? (
                                  <img
                                    src={item.avatar_url}
                                    alt={item.student_name}
                                    className="w-7 h-7 rounded-full object-cover border border-[var(--line)] shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-[#ffeff1] dark:bg-[#2e151e] text-crimson dark:text-[#fbbac3] text-[11px] font-bold flex items-center justify-center shrink-0">
                                    {getInitials(item.student_name)}
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-2 min-w-0">
                                  <span className="text-[#2a161b] dark:text-[#fff2f4] truncate max-w-[150px]">
                                    {item.student_name || 'Thí sinh ẩn danh'}
                                  </span>
                                  {profile ? (
                                    <RankBadge xp={profile.xp} compact />
                                  ) : (
                                    <span className="text-[10px] text-[#876870] dark:text-[#b88c95]">
                                      Khách
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold font-mono text-crimson dark:text-[#fbbac3]">
                              {Number(item.score).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-xs font-mono text-[#876870] dark:text-[#c49ba3]">
                              {item.correct_count ?? '-'}/{item.total_questions ?? '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right text-xs font-mono text-[#876870] dark:text-[#c49ba3] whitespace-nowrap">
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

        {/* Pinned "Thứ hạng của bạn" footer bar */}
        {activeTab === 'xp' && myXpIndex >= 10 && (
          <div className="px-6 py-3 border-t border-[#dc263e]/25 bg-[#ffeff1]/85 dark:bg-[#dc263e]/20 flex items-center justify-between text-xs shrink-0">
            <span className="font-semibold text-[#2a161b] dark:text-[#fff2f4]">
              Thứ hạng của bạn:{' '}
              <span className="font-mono font-bold text-crimson dark:text-[#fbbac3]">
                #{myXpIndex + 1}
              </span>
            </span>
            <span className="font-mono font-bold text-[#2a161b] dark:text-white">
              {xpProfiles[myXpIndex].xp.toLocaleString('vi-VN')} XP
            </span>
          </div>
        )}

        {activeTab === 'exam' && myExamIndex >= 10 && (
          <div className="px-6 py-3 border-t border-[#dc263e]/25 bg-[#ffeff1]/85 dark:bg-[#dc263e]/20 flex items-center justify-between text-xs shrink-0">
            <span className="font-semibold text-[#2a161b] dark:text-[#fff2f4]">
              Thứ hạng của bạn:{' '}
              <span className="font-mono font-bold text-crimson dark:text-[#fbbac3]">
                #{myExamIndex + 1}
              </span>
            </span>
            <span className="font-mono font-bold text-[#2a161b] dark:text-white">
              {Number(rankedExamAttempts[myExamIndex]?.score ?? 0).toFixed(2)} đ
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
