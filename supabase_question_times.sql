-- Bổ sung cột question_times (jsonb) vào bảng attempts để lưu thời gian làm từng câu hỏi
ALTER TABLE public.attempts
  ADD COLUMN IF NOT EXISTS question_times jsonb;
