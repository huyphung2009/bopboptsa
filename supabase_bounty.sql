-- 1. Bảng thống kê tỷ lệ làm đúng/sai theo từng câu hỏi
CREATE TABLE IF NOT EXISTS public.question_stats (
  question_id text PRIMARY KEY,
  exam_id text NOT NULL,
  total_attempts integer NOT NULL DEFAULT 0,
  wrong_attempts integer NOT NULL DEFAULT 0,
  is_bounty_pinned boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.question_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view question_stats" ON public.question_stats;
CREATE POLICY "Anyone can view question_stats"
  ON public.question_stats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can upsert question_stats" ON public.question_stats;
CREATE POLICY "Authenticated users can upsert question_stats"
  ON public.question_stats FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Bảng lời giải cộng đồng cho các câu Truy nã
CREATE TABLE IF NOT EXISTS public.bounty_solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Thí sinh Parabol',
  author_xp integer NOT NULL DEFAULT 0,
  content text NOT NULL,
  upvotes_count integer NOT NULL DEFAULT 0,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bounty_solutions_question_id
  ON public.bounty_solutions (question_id, is_pinned DESC, upvotes_count DESC);

ALTER TABLE public.bounty_solutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view bounty_solutions" ON public.bounty_solutions;
CREATE POLICY "Anyone can view bounty_solutions"
  ON public.bounty_solutions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert bounty_solutions" ON public.bounty_solutions;
CREATE POLICY "Authenticated users can insert bounty_solutions"
  ON public.bounty_solutions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can update bounty_solutions" ON public.bounty_solutions;
CREATE POLICY "Authenticated users can update bounty_solutions"
  ON public.bounty_solutions FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- 3. Bảng bình chọn (Upvote) — mỗi người chỉ vote 1 lần cho mỗi lời giải
CREATE TABLE IF NOT EXISTS public.bounty_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id uuid NOT NULL REFERENCES public.bounty_solutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bounty_votes_unique UNIQUE (solution_id, user_id)
);

ALTER TABLE public.bounty_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view bounty_votes" ON public.bounty_votes;
CREATE POLICY "Anyone can view bounty_votes"
  ON public.bounty_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own bounty_votes" ON public.bounty_votes;
CREATE POLICY "Users can manage own bounty_votes"
  ON public.bounty_votes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
