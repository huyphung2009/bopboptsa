import Chart from 'chart.js/auto';
import { Activity, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import React, { useEffect, useMemo, useRef } from 'react';
import { isValidAttempt } from '../lib/achievementService';
import type { AttemptRecord, Exam } from '../types/exam';

interface ProgressChartCardProps {
  attempts: AttemptRecord[];
  exams: Exam[];
  loading?: boolean;
}

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}p ${String(secs).padStart(2, '0')}s`;
}

function formatShortDate(dateStr?: string): string {
  if (!dateStr) return '--/--';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '--/--';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function formatFullDateTime(dateStr?: string): string {
  if (!dateStr) return 'Không rõ thời gian';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'Không rõ thời gian';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortenTitle(title: string, maxLen = 14): string {
  if (title.length <= maxLen) return title;
  return `${title.slice(0, maxLen - 1)}…`;
}

export const ProgressChartCard: React.FC<ProgressChartCardProps> = ({
  attempts,
  exams,
  loading = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const examTitleMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const ex of exams) {
      map[ex.id] = ex.title;
    }
    return map;
  }, [exams]);

  const chartData = useMemo(() => {
    const validNewestFirst = attempts.filter(isValidAttempt).slice(0, 10);
    const chronological = [...validNewestFirst].reverse();

    const avg10 =
      chronological.length > 0
        ? chronological.reduce((sum, a) => sum + Number(a.score ?? 0), 0) /
          chronological.length
        : 0;

    let delta: number | null = null;
    if (chronological.length >= 2) {
      const latest = Number(chronological[chronological.length - 1].score ?? 0);
      const prev = Number(chronological[chronological.length - 2].score ?? 0);
      delta = Number((latest - prev).toFixed(1));
    }

    return {
      points: chronological.map((a) => {
        const examTitle = examTitleMap[a.exam_id] || 'Đề luyện thi Parabol';
        return {
          label: `${formatShortDate(a.created_at)} · ${shortenTitle(examTitle, 11)}`,
          examTitle,
          score: Number(Number(a.score ?? 0).toFixed(2)),
          timeSpentSeconds: Number(a.time_spent_seconds ?? 0),
          dateLabel: formatFullDateTime(a.created_at),
        };
      }),
      avg10: Number(avg10.toFixed(1)),
      delta,
    };
  }, [attempts, examTitleMap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (chartData.points.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(220, 38, 62, 0.24)');
    gradient.addColorStop(1, 'rgba(220, 38, 62, 0.01)');

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.points.map((p) => p.label),
        datasets: [
          {
            label: 'Điểm số',
            data: chartData.points.map((p) => p.score),
            borderColor: '#dc263e',
            backgroundColor: gradient,
            borderWidth: 2.5,
            fill: true,
            tension: 0.32,
            pointRadius: 4.5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#dc263e',
            pointBorderWidth: 2.5,
            pointHoverBackgroundColor: '#dc263e',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(38, 17, 24, 0.94)',
            titleColor: '#fff2f4',
            bodyColor: '#fde8eb',
            borderColor: 'rgba(220, 38, 62, 0.4)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 12,
            displayColors: false,
            callbacks: {
              title: (items) => {
                const idx = items[0]?.dataIndex ?? 0;
                return chartData.points[idx]?.examTitle || 'Bài thi';
              },
              label: (item) => {
                const idx = item.dataIndex;
                const pt = chartData.points[idx];
                if (!pt) return '';
                return [
                  `Điểm số: ${pt.score.toFixed(1)} / 100`,
                  `Thời gian làm bài: ${formatDuration(pt.timeSpentSeconds)}`,
                  `Ngày thi: ${pt.dateLabel}`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#876870',
              font: {
                size: 10.5,
              },
              maxRotation: 25,
              autoSkip: false,
            },
          },
          y: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              color: '#876870',
              font: {
                size: 11,
              },
            },
            grid: {
              color: 'rgba(135, 104, 112, 0.14)',
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [chartData]);

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-white/90 dark:bg-[#221017]/80 p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-crimson/10 text-crimson flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#2a161b] dark:text-white">
              Biểu đồ phong độ (10 đề hợp lệ gần nhất)
            </h4>
            <p className="text-[11px] text-[#876870] dark:text-[#c49ba3]">
              Di chuột vào từng điểm để xem chi tiết đề thi, thời gian &amp; ngày thi
            </p>
          </div>
        </div>

        {/* Trend & Average Badges */}
        {chartData.points.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fff5f6] dark:bg-[#2c151e] border border-[var(--line)] px-3 py-1 text-[11px] font-semibold text-[#2a161b] dark:text-[#fff2f4] font-mono">
              TB {chartData.points.length} đề: {chartData.avg10} đ
            </span>

            {chartData.delta !== null && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold font-mono ${
                  chartData.delta > 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : chartData.delta < 0
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                      : 'bg-neutral-100 text-neutral-600 border border-neutral-200 dark:bg-white/10 dark:text-neutral-300 dark:border-white/15'
                }`}
              >
                {chartData.delta > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3" />+{chartData.delta} đ
                  </>
                ) : chartData.delta < 0 ? (
                  <>
                    <TrendingDown className="w-3 h-3" />
                    {chartData.delta} đ
                  </>
                ) : (
                  <>
                    <Minus className="w-3 h-3" />
                    0.0 đ
                  </>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-[220px] flex items-center justify-center text-xs text-[#876870] dark:text-[#c49ba3]">
          Đang tải dữ liệu phong độ...
        </div>
      ) : chartData.points.length === 0 ? (
        <div className="h-[180px] rounded-xl border border-dashed border-[var(--line)] bg-[#fff9fa]/60 dark:bg-[#190c11]/50 flex flex-col items-center justify-center text-center px-4">
          <Activity className="w-6 h-6 text-[#876870]/60 mb-2" />
          <p className="text-xs font-medium text-[#5e4249] dark:text-[#ebc9cf]">
            Chưa có lượt thi hợp lệ nào để vẽ biểu đồ phong độ.
          </p>
          <p className="text-[11px] text-[#876870] dark:text-[#b88c95] mt-1">
            Hãy hoàn thành bài thi đầu tiên để theo dõi sự tiến bộ của bạn!
          </p>
        </div>
      ) : (
        <div className="relative h-[230px] w-full">
          <canvas ref={canvasRef} />
        </div>
      )}
    </section>
  );
};
