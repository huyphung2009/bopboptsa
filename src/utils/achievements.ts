export type AchievementId =
  | 'night_owl'
  | 'light_speed'
  | 'unstoppable'
  | 'exam_slayer';

export interface AchievementDefinition {
  id: AchievementId;
  title: string;
  description: string;
  secretHint: string;
  iconName: 'moon' | 'zap' | 'crown' | 'swords';
  gradientClass: string;
  badgeBorderClass: string;
  iconBgClass: string;
}

export interface UnlockedAchievement {
  achievement_id: AchievementId;
  unlocked_at: string;
}

export const SECRET_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'night_owl',
    title: 'Cú đêm chính hiệu',
    description: 'Nộp bài thi hợp lệ thành công trong khung giờ 00:00 – 04:00 sáng.',
    secretHint: 'Thành tựu ẩn · Hoạt động vào khung giờ đặc biệt',
    iconName: 'moon',
    gradientClass:
      'from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-950/50 dark:via-violet-950/40 dark:to-purple-950/40',
    badgeBorderClass: 'border-indigo-300 dark:border-indigo-700',
    iconBgClass: 'bg-indigo-600 text-white shadow-indigo-500/30',
  },
  {
    id: 'light_speed',
    title: 'Tốc độ ánh sáng',
    description:
      'Đạt từ 80 điểm trở lên với thời gian làm bài ít hơn 50% thời lượng quy định.',
    secretHint: 'Thành tựu ẩn · Tốc độ và độ chính xác vượt trội',
    iconName: 'zap',
    gradientClass:
      'from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/50 dark:via-yellow-950/40 dark:to-orange-950/40',
    badgeBorderClass: 'border-amber-300 dark:border-amber-700',
    iconBgClass: 'bg-amber-500 text-white shadow-amber-500/30',
  },
  {
    id: 'unstoppable',
    title: 'Bất khả chiến bại',
    description: 'Đạt từ 85 điểm trở lên trong 3 lượt thi hợp lệ liên tiếp.',
    secretHint: 'Thành tựu ẩn · Phong độ đỉnh cao ổn định',
    iconName: 'crown',
    gradientClass:
      'from-rose-50 via-[#fff0f2] to-pink-50 dark:from-rose-950/50 dark:via-[#2c121b] dark:to-pink-950/40',
    badgeBorderClass: 'border-crimson/45 dark:border-crimson/60',
    iconBgClass: 'bg-crimson text-white shadow-crimson/30',
  },
  {
    id: 'exam_slayer',
    title: 'Kẻ hủy diệt đề',
    description: 'Hoàn thành tổng cộng 10 lượt thi hợp lệ trên hệ thống Parabol.',
    secretHint: 'Thành tựu ẩn · Bền bỉ chinh phục kho đề',
    iconName: 'swords',
    gradientClass:
      'from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-cyan-950/40',
    badgeBorderClass: 'border-emerald-300 dark:border-emerald-700',
    iconBgClass: 'bg-emerald-600 text-white shadow-emerald-500/30',
  },
];

export function getAchievementDefinition(
  id: string
): AchievementDefinition | undefined {
  return SECRET_ACHIEVEMENTS.find((a) => a.id === id);
}
