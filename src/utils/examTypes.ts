import type { ExamType } from '../types/exam';

export interface ExamTypeMeta {
  value: ExamType;
  label: string;
  shortLabel: string;
  badgeClass: string;
}

export const EXAM_TYPES: ExamTypeMeta[] = [
  {
    value: 'TSA',
    label: 'TSA (ĐHBK Hà Nội)',
    shortLabel: 'TSA',
    badgeClass:
      'border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/40 text-[#B91C1C] dark:text-red-400',
  },
  {
    value: 'HSA',
    label: 'HSA (ĐHQG Hà Nội)',
    shortLabel: 'HSA',
    badgeClass:
      'border-emerald-200 dark:border-emerald-900/70 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
  },
  {
    value: 'VACT',
    label: 'V-ACT (ĐHQG TP.HCM)',
    shortLabel: 'V-ACT',
    badgeClass:
      'border-sky-200 dark:border-sky-900/70 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300',
  },
  {
    value: 'THPTQG',
    label: 'THPTQG (Tốt nghiệp THPT)',
    shortLabel: 'THPTQG',
    badgeClass:
      'border-purple-200 dark:border-purple-900/70 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
  },
  {
    value: 'QDA',
    label: 'QDA',
    shortLabel: 'QDA',
    badgeClass:
      'border-orange-200 dark:border-orange-900/70 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300',
  },
  {
    value: 'VSAT',
    label: 'V-SAT',
    shortLabel: 'V-SAT',
    badgeClass:
      'border-violet-200 dark:border-violet-900/70 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300',
  },
  {
    value: 'BCA',
    label: 'BCA (Bộ Công An)',
    shortLabel: 'BCA',
    badgeClass:
      'border-amber-300/80 dark:border-amber-800/70 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300',
  },
];

export type ExamTabFilter = 'ALL' | 'TSA' | 'HSA' | 'VACT' | 'THPTQG';

export const MAIN_EXAM_TABS: { value: ExamTabFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả kỳ thi' },
  { value: 'TSA', label: 'TSA (ĐHBK Hà Nội)' },
  { value: 'HSA', label: 'HSA (ĐHQG Hà Nội)' },
  { value: 'VACT', label: 'V-ACT (ĐHQG TP.HCM)' },
  { value: 'THPTQG', label: 'THPTQG (Tốt nghiệp THPT)' },
];

export interface SubFilterOption {
  value: string;
  label: string;
}

export function getSubFiltersForExamType(
  examTab: ExamTabFilter
): SubFilterOption[] {
  switch (examTab) {
    case 'HSA':
      return [
        { value: 'ALL', label: 'Tất cả' },
        { value: 'Tổng hợp', label: 'Đề tổng hợp' },
        { value: 'Tư duy định lượng', label: 'Tư duy định lượng' },
        { value: 'Tư duy định tính', label: 'Tư duy định tính' },
        { value: 'Khoa học / Tiếng Anh', label: 'Khoa học / Tiếng Anh' },
      ];
    case 'VACT':
      return [
        { value: 'ALL', label: 'Tất cả' },
        { value: 'Tổng hợp', label: 'Đề tổng hợp' },
        { value: 'Sử dụng ngôn ngữ', label: 'Sử dụng ngôn ngữ' },
        { value: 'Toán học', label: 'Toán học' },
        { value: 'Tư duy khoa học', label: 'Tư duy khoa học' },
      ];
    case 'THPTQG':
      return [
        { value: 'ALL', label: 'Tất cả' },
        { value: 'Toán', label: 'Toán' },
        { value: 'Vật lí', label: 'Vật lí' },
        { value: 'Hóa học', label: 'Hóa học' },
        { value: 'Tiếng Anh', label: 'Tiếng Anh' },
        { value: 'Ngữ văn', label: 'Ngữ văn' },
      ];
    case 'TSA':
    case 'ALL':
    default:
      return [
        { value: 'ALL', label: 'Tất cả' },
        { value: 'Tổng hợp', label: 'Đề tổng hợp' },
        { value: 'Tư duy Toán học', label: 'Tư duy Toán học' },
        { value: 'Tư duy Đọc hiểu', label: 'Tư duy Đọc hiểu' },
        { value: 'Tư duy Khoa học', label: 'Tư duy Khoa học' },
      ];
  }
}

export function getAdminSectionsForType(type: ExamType): string[] {
  switch (type) {
    case 'HSA':
      return [
        'Tổng hợp',
        'Tư duy định lượng',
        'Tư duy định tính',
        'Khoa học / Tiếng Anh',
      ];
    case 'VACT':
      return [
        'Tổng hợp',
        'Sử dụng ngôn ngữ',
        'Toán học',
        'Tư duy khoa học',
      ];
    case 'THPTQG':
      return ['Toán', 'Vật lí', 'Hóa học', 'Tiếng Anh', 'Ngữ văn', 'Tổng hợp'];
    default:
      return [
        'Tổng hợp',
        'Tư duy Toán học',
        'Tư duy Đọc hiểu',
        'Tư duy Khoa học',
      ];
  }
}

export function normalizeExamType(val: unknown): ExamType {
  const upper = String(val ?? 'TSA')
    .trim()
    .toUpperCase()
    .replace(/-/g, '');
  const found = EXAM_TYPES.find((t) => t.value === upper);
  return found ? found.value : 'TSA';
}

export function getExamTypeMeta(type?: ExamType): ExamTypeMeta {
  return EXAM_TYPES.find((t) => t.value === type) ?? EXAM_TYPES[0];
}
