-- Tạo bảng user_achievements để lưu các Thành tựu ẩn đã mở khóa của người dùng
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_achievements_user_achievement_unique UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id
  ON public.user_achievements (user_id);

-- Bật Row Level Security (RLS)
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Người dùng chỉ được xem thành tựu của chính mình
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements"
  ON public.user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

-- Người dùng chỉ được tự ghi nhận thành tựu cho chính mình
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
CREATE POLICY "Users can insert own achievements"
  ON public.user_achievements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
