import {
  Award,
  Calendar,
  Clock,
  Download,
  FileCheck2,
  ShieldAlert,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import React from 'react';
import { getExamFormat } from '../config/examFormats';
import type { ExamType, SectionResultSummary } from '../types/exam';
import { getExamTypeMeta } from '../utils/examTypes';
import { formatDuration } from '../utils/scoring';
import { Logo } from './Logo';

export interface ScoreReportData {
  examTitle: string;
  examType: ExamType;
  studentName: string;
  avatarUrl?: string | null;
  displayScore: number;
  displayMaxScore: number;
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  submittedAt: string;
  sectionResults?: SectionResultSummary[];
  earnedXp?: number | null;
  leaderboardRank?: number | null;
  isFlagged?: boolean;
  violationCount?: number;
}

export function downloadScoreReportPng(report: ScoreReportData) {
  const fmt = getExamFormat(report.examType);
  const sections = report.sectionResults ?? [];
  const width = 960;
  const height = 430 + Math.max(1, sections.length) * 52;

  const canvas = document.createElement('canvas');
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(2, 2);

  // Background
  ctx.fillStyle = '#FAFAFA';
  ctx.fillRect(0, 0, width, height);

  // Outer card
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(24, 24, width - 48, height - 48, 16);
  ctx.fill();
  ctx.stroke();

  // Top accent bar
  ctx.fillStyle = '#B91C1C';
  ctx.beginPath();
  ctx.roundRect(24, 24, width - 48, 6, [16, 16, 0, 0]);
  ctx.fill();

  // Brand & Title
  ctx.fillStyle = '#B91C1C';
  ctx.font = '700 12px Inter, system-ui, sans-serif';
  ctx.fillText('PARABOL · HỆ THỐNG LUYỆN THI TRỰC TUYẾN', 52, 66);

  ctx.fillStyle = '#0F172A';
  ctx.font = '700 18px Inter, system-ui, sans-serif';
  ctx.fillText(fmt.reportTitle, 52, 94);

  // Candidate Info
  ctx.fillStyle = '#475569';
  ctx.font = '500 13px Inter, system-ui, sans-serif';
  ctx.fillText(`Thí sinh: ${report.studentName}`, 52, 128);
  ctx.fillText(`Đề thi: ${report.examTitle.slice(0, 72)}`, 52, 150);

  const dateStr = new Date(report.submittedAt).toLocaleString('vi-VN');
  ctx.fillText(
    `Ngày nộp: ${dateStr}   ·   Thời gian làm bài: ${formatDuration(report.timeSpentSeconds)}`,
    52,
    172
  );

  // Score Box (Right)
  ctx.fillStyle = '#FAFAFA';
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(width - 280, 56, 228, 122, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#64748B';
  ctx.font = '600 11px Inter, system-ui, sans-serif';
  ctx.fillText(`ĐIỂM QUY ĐỔI (THANG ${report.displayMaxScore})`, width - 258, 84);

  ctx.fillStyle = '#B91C1C';
  ctx.font = '800 36px JetBrains Mono, monospace';
  ctx.fillText(
    `${report.displayScore.toFixed(2)}`,
    width - 258,
    128
  );

  ctx.fillStyle = '#334155';
  ctx.font = '600 12px Inter, system-ui, sans-serif';
  ctx.fillText(
    `Đúng: ${report.correctCount}/${report.totalQuestions} câu${
      report.earnedXp && !report.isFlagged ? `  ·  +${report.earnedXp} XP` : ''
    }`,
    width - 258,
    158
  );

  // Breakdown Header
  const tableTop = 212;
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(52, tableTop, width - 104, 34);
  ctx.strokeStyle = '#E2E8F0';
  ctx.strokeRect(52, tableTop, width - 104, 34);

  ctx.fillStyle = '#64748B';
  ctx.font = '700 11px Inter, system-ui, sans-serif';
  ctx.fillText('PHẦN THI', 68, tableTop + 21);
  ctx.fillText('SỐ CÂU ĐÚNG', 440, tableTop + 21);
  ctx.fillText('TỶ LỆ (%)', 580, tableTop + 21);
  ctx.fillText('ĐIỂM QUY ĐỔI', 720, tableTop + 21);

  sections.forEach((sec, idx) => {
    const y = tableTop + 34 + idx * 46;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(52, y, width - 104, 46);
    ctx.strokeStyle = '#F1F5F9';
    ctx.strokeRect(52, y, width - 104, 46);

    ctx.fillStyle = '#0F172A';
    ctx.font = '600 13px Inter, system-ui, sans-serif';
    ctx.fillText(sec.title.slice(0, 44), 68, y + 27);

    ctx.fillStyle = '#334155';
    ctx.font = '600 13px JetBrains Mono, monospace';
    ctx.fillText(`${sec.correctCount}/${sec.totalQuestions}`, 455, y + 27);
    ctx.fillText(`${sec.accuracyPct}%`, 595, y + 27);

    ctx.fillStyle = '#B91C1C';
    ctx.font = '700 13px JetBrains Mono, monospace';
    ctx.fillText(`${sec.scaledScore.toFixed(2)}/${sec.sectionMaxScore}`, 725, y + 27);
  });

  // Footer
  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 11px Inter, system-ui, sans-serif';
  ctx.fillText(
    'Phiếu báo kết quả được xuất tự động từ nền tảng luyện thi Parabol.',
    52,
    height - 46
  );

  const link = document.createElement('a');
  link.download = `phieu-diem-${report.examType.toLowerCase()}-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

interface ScoreReportCardProps {
  report: ScoreReportData;
  onViewDetails?: () => void;
}

export const ScoreReportCard: React.FC<ScoreReportCardProps> = ({
  report,
  onViewDetails,
}) => {
  const fmt = getExamFormat(report.examType);
  const typeMeta = getExamTypeMeta(report.examType);
  const sections = report.sectionResults ?? [];

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
      {/* Top Academic Header Bar */}
      <div className="h-1.5 w-full bg-[#B91C1C]" />

      <div className="p-6 sm:p-7 space-y-6">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100 dark:border-zinc-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Logo className="w-5 h-5 text-slate-900 dark:text-zinc-100" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#B91C1C] dark:text-red-400">
                {fmt.reportTitle}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100">
              {report.examTitle}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 pt-1">
              <div className="flex items-center gap-2">
                {report.avatarUrl ? (
                  <img
                    src={report.avatarUrl}
                    alt={report.studentName}
                    className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-zinc-700"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[10px] font-bold flex items-center justify-center">
                    {(report.studentName[0] || 'T').toUpperCase()}
                  </div>
                )}
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  {report.studentName}
                </span>
              </div>

              <span
                className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${typeMeta.badgeClass}`}
              >
                {typeMeta.shortLabel}
              </span>

              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(report.submittedAt).toLocaleString('vi-VN')}
              </span>

              <span className="inline-flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(report.timeSpentSeconds)}
              </span>
            </div>
          </div>

          {/* Prominent Score Summary Box */}
          <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-950 px-5 py-4 flex items-center gap-5 shrink-0">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Thang {report.displayMaxScore}
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#B91C1C] dark:text-red-500 mt-0.5">
                {report.displayScore.toFixed(2)}
              </div>
            </div>
            <div className="h-12 w-px bg-slate-200 dark:bg-zinc-800" />
            <div className="space-y-1 text-xs font-mono text-slate-600 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-900 dark:text-zinc-100">
                  {report.correctCount}/{report.totalQuestions}
                </span>{' '}
                câu
              </div>
              {report.leaderboardRank && (
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  Hạng{' '}
                  <span className="font-bold text-slate-900 dark:text-zinc-100">
                    #{report.leaderboardRank}
                  </span>
                </div>
              )}
              {report.isFlagged ? (
                <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Vi phạm ({report.violationCount ?? 4})
                </div>
              ) : report.earnedXp ? (
                <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />+{report.earnedXp} XP
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Breakdown Table */}
        {sections.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#B91C1C] dark:text-red-500" />
              Phân tích điểm thành phần
            </h3>

            <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-950 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    <th className="py-2.5 px-4">Tên phần thi</th>
                    <th className="py-2.5 px-3 text-right">Đúng / Tổng</th>
                    <th className="py-2.5 px-3 text-right">Chính xác</th>
                    <th className="py-2.5 px-3 text-right">Điểm quy đổi</th>
                    <th className="py-2.5 px-4 w-36">Năng lực</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-xs sm:text-sm">
                  {sections.map((sec) => (
                    <tr key={sec.sectionId}>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-zinc-200">
                        {sec.title}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-zinc-300">
                        {sec.correctCount}/{sec.totalQuestions}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500 dark:text-zinc-400">
                        {sec.accuracyPct}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#B91C1C] dark:text-red-400">
                        {sec.scaledScore.toFixed(2)}/{sec.sectionMaxScore}
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-1.5 w-full rounded-full bg-slate-200/80 dark:bg-zinc-800 overflow-hidden">
                          <div
                            style={{ width: `${sec.accuracyPct}%` }}
                            className="h-full rounded-full bg-[#B91C1C]"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => downloadScoreReportPng(report)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Tải ảnh Phiếu điểm (PNG)
          </button>

          {onViewDetails && (
            <button
              type="button"
              onClick={onViewDetails}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#B91C1C] hover:bg-red-800 px-4 py-2 text-xs font-semibold text-white transition-colors"
            >
              Xem lời giải chi tiết từng câu
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface ScoreReportModalProps {
  report: ScoreReportData | null;
  onClose: () => void;
}

export const ScoreReportModal: React.FC<ScoreReportModalProps> = ({
  report,
  onClose,
}) => {
  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-3xl max-h-[88vh] overflow-y-auto custom-scrollbar rounded-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-lg p-1.5 bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-700 text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
          aria-label="Đóng phiếu điểm"
        >
          <X className="w-4 h-4" />
        </button>
        <ScoreReportCard report={report} />
      </div>
    </div>
  );
};
