import { Calendar, GraduationCap, Sparkles, Target, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { TargetGoalPayload, UserProfile } from '../lib/profileService';

interface TargetGoalModalProps {
  isOpen: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onSave: (goal: TargetGoalPayload) => Promise<void>;
}

const GOAL_PRESETS: { label: string; goal: TargetGoalPayload }[] = [
  {
    label: 'Bách khoa Hà Nội — TSA',
    goal: {
      target_university: 'ĐH Bách khoa Hà Nội',
      target_major: 'IT1 - Khoa học Máy tính',
      target_exam_type: 'TSA',
      target_score: 80,
      target_exam_date: '2027-06-15',
    },
  },
  {
    label: 'ĐHQGHN — HSA',
    goal: {
      target_university: 'ĐH Công nghệ - ĐHQGHN',
      target_major: 'Công nghệ Thông tin',
      target_exam_type: 'HSA',
      target_score: 115,
      target_exam_date: '2027-05-20',
    },
  },
  {
    label: 'THPTQG 2027',
    goal: {
      target_university: 'ĐH Kinh tế Quốc dân',
      target_major: 'Kinh tế Đầu tư',
      target_exam_type: 'THPTQG',
      target_score: 27,
      target_exam_date: '2027-06-26',
    },
  },
  {
    label: 'ĐHQG TP.HCM — V-ACT',
    goal: {
      target_university: 'ĐH Bách khoa TP.HCM',
      target_major: 'Khoa học Máy tính',
      target_exam_type: 'VACT',
      target_score: 950,
      target_exam_date: '2027-05-30',
    },
  },
];

const EXAM_TYPE_OPTIONS = [
  { value: 'TSA', label: 'TSA (Đánh giá tư duy Bách Khoa - Thang 100)', maxScore: 100, defaultScore: 80 },
  { value: 'HSA', label: 'HSA (Đánh giá năng lực ĐHQGHN - Thang 150)', maxScore: 150, defaultScore: 115 },
  { value: 'VACT', label: 'V-ACT (Đánh giá năng lực ĐHQGTPHCM - Thang 1200)', maxScore: 1200, defaultScore: 950 },
  { value: 'THPTQG', label: 'THPTQG (Tốt nghiệp THPT - Thang 30)', maxScore: 30, defaultScore: 27 },
];

export const TargetGoalModal: React.FC<TargetGoalModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSave,
}) => {
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [examType, setExamType] = useState('TSA');
  const [targetScore, setTargetScore] = useState('80');
  const [examDate, setExamDate] = useState('2027-06-15');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setUniversity(profile?.target_university || '');
    setMajor(profile?.target_major || '');
    setExamType(profile?.target_exam_type || 'TSA');
    setTargetScore(
      profile?.target_score !== undefined && profile?.target_score !== null
        ? String(profile.target_score)
        : '80'
    );
    setExamDate(profile?.target_exam_date || '2027-06-15');
    setError(null);
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const applyPreset = (preset: TargetGoalPayload) => {
    setUniversity(preset.target_university);
    setMajor(preset.target_major);
    setExamType(preset.target_exam_type);
    setTargetScore(String(preset.target_score));
    setExamDate(preset.target_exam_date);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numScore = Number(targetScore);
    if (!university.trim() || !major.trim()) {
      setError('Vui lòng nhập tên trường và ngành học mục tiêu.');
      return;
    }
    if (!Number.isFinite(numScore) || numScore <= 0) {
      setError('Vui lòng nhập điểm mục tiêu hợp lệ.');
      return;
    }

    setSaving(true);
    await onSave({
      target_university: university.trim(),
      target_major: major.trim(),
      target_exam_type: examType,
      target_score: numScore,
      target_exam_date: examDate,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#261118]/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-[26px] bg-white/95 dark:bg-[#1b0d13]/95 backdrop-blur-2xl shadow-[0_32px_90px_-28px_rgba(38,17,24,0.45)] border border-[var(--line)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[#fff6f7]/75 dark:bg-[#241219]/65">
          <div className="flex items-center gap-2.5">
            <Target className="w-5 h-5 text-crimson" />
            <div>
              <h3 className="text-base font-semibold text-[#2a161b] dark:text-[#fff2f4]">
                Cài đặt Mục tiêu Nguyện vọng
              </h3>
              <p className="text-xs text-[#876870] dark:text-[#c49ba3]">
                Theo dõi tiến độ điểm số &amp; đếm ngược ngày thi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-[#876870] hover:text-crimson hover:bg-[#ffeff1] dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Quick Presets */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#876870] dark:text-[#b88c95] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-crimson" />
              Gợi ý chọn nhanh
            </div>
            <div className="flex flex-wrap gap-1.5">
              {GOAL_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p.goal)}
                  className="rounded-full border border-[var(--line)] bg-[#fff5f6] dark:bg-[#241219] px-3 py-1 text-[11px] font-semibold text-[#5e4249] dark:text-[#f8d4da] hover:border-crimson hover:text-crimson transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf] mb-1.5">
                Trường đại học mơ ước
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-[#876870] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="VD: ĐH Bách khoa Hà Nội"
                  className="w-full rounded-full border border-[var(--line)] bg-white dark:bg-[#13090d] pl-10 pr-4 py-2 text-sm text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf] mb-1.5">
                Ngành học mục tiêu
              </label>
              <input
                type="text"
                required
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="VD: IT1 - Khoa học Máy tính"
                className="w-full rounded-full border border-[var(--line)] bg-white dark:bg-[#13090d] px-4 py-2 text-sm text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf] mb-1.5">
                Kỳ thi mục tiêu
              </label>
              <select
                value={examType}
                onChange={(e) => {
                  const nextType = e.target.value;
                  setExamType(nextType);
                  const matched = EXAM_TYPE_OPTIONS.find((o) => o.value === nextType);
                  if (matched) {
                    setTargetScore(String(matched.defaultScore));
                  }
                }}
                className="w-full rounded-full border border-[var(--line)] bg-white dark:bg-[#13090d] px-4 py-2 text-sm font-medium text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
              >
                {EXAM_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf] mb-1.5">
                Điểm mục tiêu (Thang{' '}
                {EXAM_TYPE_OPTIONS.find((o) => o.value === examType)?.maxScore ?? 100})
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max={EXAM_TYPE_OPTIONS.find((o) => o.value === examType)?.maxScore ?? 1200}
                required
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                className="w-full rounded-full border border-[var(--line)] bg-white dark:bg-[#13090d] px-4 py-2 text-sm font-mono font-semibold text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf] mb-1.5">
                Ngày thi dự kiến
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#876870] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full rounded-full border border-[var(--line)] bg-white dark:bg-[#13090d] pl-10 pr-4 py-2 text-sm font-mono text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 px-3.5 py-2 text-xs font-medium text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-pill btn-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-crimson btn-sm"
            >
              {saving ? 'Đang lưu...' : 'Lưu mục tiêu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
