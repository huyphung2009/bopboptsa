import { Crown, Moon, Sparkles, Swords, X, Zap } from 'lucide-react';
import React from 'react';
import type { AchievementDefinition } from '../utils/achievements';

interface AchievementToastProps {
  achievements: AchievementDefinition[];
  onDismiss: (id: string) => void;
}

function renderAchievementIcon(iconName: AchievementDefinition['iconName']) {
  switch (iconName) {
    case 'moon':
      return <Moon className="w-5 h-5" />;
    case 'zap':
      return <Zap className="w-5 h-5" />;
    case 'crown':
      return <Crown className="w-5 h-5" />;
    case 'swords':
      return <Swords className="w-5 h-5" />;
  }
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievements,
  onDismiss,
}) => {
  if (achievements.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none">
      {achievements.map((item) => (
        <div
          key={item.id}
          role="status"
          className="pointer-events-auto rounded-2xl border border-amber-300/80 dark:border-amber-700/70 bg-white/95 dark:bg-[#1b0d13]/95 backdrop-blur-xl shadow-[0_20px_50px_-15px_rgba(220,38,62,0.35)] p-4 flex items-start gap-3 animate-[fadeInUp_0.35s_ease-out]"
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${item.iconBgClass}`}
          >
            {renderAchievementIcon(item.iconName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-crimson dark:text-[#fbbac3]">
              <Sparkles className="w-3 h-3" />
              Mở khóa thành tựu ẩn
            </div>
            <p className="text-sm font-bold text-[#2a161b] dark:text-white mt-0.5 leading-snug">
              Chúc mừng! Bạn vừa mở khóa: {item.title}
            </p>
            <p className="text-xs text-[#6d4f57] dark:text-[#c49ba3] mt-0.5 leading-relaxed">
              {item.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            className="p-1 rounded-full text-[#876870] hover:text-crimson hover:bg-[#ffeff1] transition-colors cursor-pointer shrink-0"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
