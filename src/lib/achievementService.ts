import type { AttemptRecord } from '../types/exam';
import {
  getAchievementDefinition,
  type AchievementDefinition,
  type AchievementId,
  type UnlockedAchievement,
} from '../utils/achievements';
import { fetchUserAttempts } from './examService';
import { supabase } from './supabase';

function readLocalAchievements(userId: string): UnlockedAchievement[] {
  try {
    const raw = localStorage.getItem(`parabol_achievements_${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UnlockedAchievement[]) : [];
  } catch {
    return [];
  }
}

function writeLocalAchievements(
  userId: string,
  items: UnlockedAchievement[]
): void {
  try {
    localStorage.setItem(`parabol_achievements_${userId}`, JSON.stringify(items));
  } catch {
    // ignore storage quota errors
  }
}

export async function fetchUserAchievements(
  userId: string
): Promise<UnlockedAchievement[]> {
  const local = readLocalAchievements(userId);
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: true });

    if (error) {
      console.warn('[fetchUserAchievements] Supabase fallback to local:', error.message);
      return local;
    }

    const remote = (data ?? []) as UnlockedAchievement[];
    const mergedMap = new Map<string, UnlockedAchievement>();
    for (const item of local) mergedMap.set(item.achievement_id, item);
    for (const item of remote) mergedMap.set(item.achievement_id, item);

    const merged = Array.from(mergedMap.values());
    writeLocalAchievements(userId, merged);
    return merged;
  } catch (err) {
    console.warn('[fetchUserAchievements] Unexpected error:', err);
    return local;
  }
}

async function unlockAchievementsForUser(
  userId: string,
  ids: AchievementId[]
): Promise<UnlockedAchievement[]> {
  if (ids.length === 0) return [];
  const nowIso = new Date().toISOString();
  const existing = readLocalAchievements(userId);
  const existingSet = new Set(existing.map((a) => a.achievement_id));

  const newItems: UnlockedAchievement[] = ids
    .filter((id) => !existingSet.has(id))
    .map((id) => ({ achievement_id: id, unlocked_at: nowIso }));

  if (newItems.length === 0) return [];

  writeLocalAchievements(userId, [...existing, ...newItems]);

  try {
    const rows = newItems.map((item) => ({
      user_id: userId,
      achievement_id: item.achievement_id,
      unlocked_at: item.unlocked_at,
    }));

    const { error } = await supabase
      .from('user_achievements')
      .upsert(rows, { onConflict: 'user_id,achievement_id' });

    if (error) {
      console.warn('[unlockAchievementsForUser] Supabase error:', error.message);
    }
  } catch (err) {
    console.warn('[unlockAchievementsForUser] Unexpected error:', err);
  }

  return newItems;
}

export function isValidAttempt(a: AttemptRecord): boolean {
  return (
    !a.is_flagged &&
    !a.is_cheating &&
    a.status !== 'violated' &&
    (a.violation_count ?? 0) <= 3
  );
}

export async function evaluateAndUnlockAchievements(params: {
  userId: string;
  score100: number;
  timeSpentSeconds: number;
  allowedDurationSeconds: number;
  submittedAt?: Date;
  examsCompletedFallback?: number;
}): Promise<AchievementDefinition[]> {
  const {
    userId,
    score100,
    timeSpentSeconds,
    allowedDurationSeconds,
    submittedAt = new Date(),
    examsCompletedFallback = 0,
  } = params;

  const [alreadyUnlocked, attemptsRes] = await Promise.all([
    fetchUserAchievements(userId),
    fetchUserAttempts(userId),
  ]);

  const unlockedSet = new Set(alreadyUnlocked.map((a) => a.achievement_id));
  const candidates: AchievementId[] = [];

  // 1. Cú đêm chính hiệu: 00:00 - 04:00 sáng (giờ địa phương)
  if (!unlockedSet.has('night_owl')) {
    const hour = submittedAt.getHours();
    const minute = submittedAt.getMinutes();
    const isNightOwl =
      (hour >= 0 && hour < 4) || (hour === 4 && minute === 0);
    if (isNightOwl) {
      candidates.push('night_owl');
    }
  }

  // 2. Tốc độ ánh sáng: >= 80 điểm & thời gian < 50% tổng thời gian quy định
  if (!unlockedSet.has('light_speed')) {
    if (
      score100 >= 80 &&
      allowedDurationSeconds > 0 &&
      timeSpentSeconds < allowedDurationSeconds * 0.5
    ) {
      candidates.push('light_speed');
    }
  }

  const validAttempts = attemptsRes.attempts.filter(isValidAttempt);

  // 3. Bất khả chiến bại: >= 85 điểm trong 3 đề thi hợp lệ liên tiếp
  if (!unlockedSet.has('unstoppable')) {
    // validAttempts is ordered newest-first (created_at DESC)
    // Check if there are 3 consecutive attempts with score >= 85
    let streak = 0;
    let achievedStreak = false;
    for (const attempt of validAttempts) {
      if (Number(attempt.score ?? 0) >= 85) {
        streak += 1;
        if (streak >= 3) {
          achievedStreak = true;
          break;
        }
      } else {
        streak = 0;
      }
    }
    if (achievedStreak) {
      candidates.push('unstoppable');
    }
  }

  // 4. Kẻ hủy diệt đề: Hoàn thành tổng cộng 10 đề thi hợp lệ
  if (!unlockedSet.has('exam_slayer')) {
    const totalValid = Math.max(validAttempts.length, examsCompletedFallback);
    if (totalValid >= 10) {
      candidates.push('exam_slayer');
    }
  }

  if (candidates.length === 0) return [];

  const newlyUnlocked = await unlockAchievementsForUser(userId, candidates);
  return newlyUnlocked
    .map((u) => getAchievementDefinition(u.achievement_id))
    .filter((d): d is AchievementDefinition => Boolean(d));
}
