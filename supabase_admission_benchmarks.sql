-- Tạo bảng admission_benchmarks lưu Điểm chuẩn thực tế các trường Đại học
CREATE TABLE IF NOT EXISTS public.admission_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_name text NOT NULL,
  major_code text NOT NULL,
  major_name text NOT NULL,
  year integer NOT NULL DEFAULT 2025,
  cutoff_tsa numeric,
  cutoff_hsa numeric,
  cutoff_vact numeric,
  cutoff_thptqg numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admission_benchmarks ENABLE ROW LEVEL SECURITY;

-- Mọi người đều có quyền đọc điểm chuẩn
DROP POLICY IF EXISTS "Anyone can view admission_benchmarks" ON public.admission_benchmarks;
CREATE POLICY "Anyone can view admission_benchmarks"
  ON public.admission_benchmarks
  FOR SELECT
  USING (true);

-- Chỉ Super Admin hoặc QTV trong app_admins được thêm/sửa/xóa
DROP POLICY IF EXISTS "Admins can manage admission_benchmarks" ON public.admission_benchmarks;
CREATE POLICY "Admins can manage admission_benchmarks"
  ON public.admission_benchmarks
  FOR ALL
  USING (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'kienphung15101981@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.app_admins a
      WHERE lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'kienphung15101981@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.app_admins a
      WHERE lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

-- Seed 8 ngành mẫu phổ biến (Dữ liệu mẫu - QTV có thể cập nhật trong trang Quản trị)
INSERT INTO public.admission_benchmarks
  (university_name, major_code, major_name, year, cutoff_tsa, cutoff_hsa, cutoff_vact, cutoff_thptqg)
VALUES
  ('ĐH Bách khoa Hà Nội (HUST)', 'IT-E10', 'Khoa học dữ liệu và Trí tuệ nhân tạo', 2025, 78.2, NULL, NULL, 28.4),
  ('ĐH Bách khoa Hà Nội (HUST)', 'IT1', 'Khoa học Máy tính', 2025, 81.5, NULL, NULL, 28.9),
  ('ĐH Bách khoa Hà Nội (HUST)', 'EE2', 'Kỹ thuật Điều khiển - Tự động hóa', 2025, 72.4, NULL, NULL, 27.6),
  ('ĐH Công nghệ - ĐHQGHN (UET)', 'CN1', 'Công nghệ Thông tin', 2025, NULL, 112, NULL, 27.8),
  ('ĐH Công nghệ - ĐHQGHN (UET)', 'CN8', 'Trí tuệ nhân tạo', 2025, NULL, 116, NULL, 28.1),
  ('ĐH Kinh tế Quốc dân (NEU)', 'EP01', 'Kinh tế Đầu tư', 2025, 68.5, 105, NULL, 27.4),
  ('ĐH Ngoại thương (FTU)', 'NTH01', 'Kinh tế đối ngoại', 2025, NULL, 108, NULL, 28.2),
  ('ĐH Bách khoa TP.HCM (HCMUT)', '106', 'Khoa học Máy tính', 2025, NULL, NULL, 960, 27.5);
