-- Bổ sung cột exam_type cho bảng exams để hỗ trợ đa kỳ thi (TSA, HSA, V-ACT, THPTQG)
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS exam_type text NOT NULL DEFAULT 'TSA';

-- Đảm bảo các đề thi cũ chưa có exam_type đều mặc định là 'TSA'
UPDATE public.exams
SET exam_type = 'TSA'
WHERE exam_type IS NULL OR trim(exam_type) = '';
