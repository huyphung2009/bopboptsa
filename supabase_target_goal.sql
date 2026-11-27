-- Cập nhật bảng profiles để lưu Mục tiêu Nguyện vọng & Đếm ngược kỳ thi
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_university text,
  ADD COLUMN IF NOT EXISTS target_major text,
  ADD COLUMN IF NOT EXISTS target_exam_type text,
  ADD COLUMN IF NOT EXISTS target_score numeric,
  ADD COLUMN IF NOT EXISTS target_exam_date date;
