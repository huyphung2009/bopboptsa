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
    label: 'TSA (Bách Khoa)',
    shortLabel: 'TSA',
    badgeClass:
      'border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/40 text-[#B91C1C] dark:text-red-400',
  },
  {
    value: 'HSA',
    label: 'HSA (ĐHQGHN)',
    shortLabel: 'HSA',
    badgeClass:
      'border-sky-200 dark:border-sky-900/70 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300',
  },
  {
    value: 'VACT',
    label: 'V-ACT (ĐHQGTPHCM)',
    shortLabel: 'V-ACT',
    badgeClass:
      'border-emerald-200 dark:border-emerald-900/70 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
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
