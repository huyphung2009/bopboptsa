import {
  CheckCircle2,
  Compass,
  Flame,
  Info,
  Search,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { isValidAttempt } from '../lib/achievementService';
import {
  fetchAdmissionBenchmarks,
  type AdmissionBenchmark,
} from '../lib/benchmarkService';
import { fetchUserAttempts } from '../lib/examService';
import type { AttemptRecord, Exam } from '../types/exam';
import { normalizeExamType } from '../utils/examTypes';

interface AdmissionCompareModalProps {
  isOpen: boolean;
  userId?: string;
  exams: Exam[];
  onClose: () => void;
}

type MethodKey = 'TSA' | 'HSA' | 'VACT' | 'THPTQG';

interface MethodConfig {
  key: MethodKey;
  label: string;
  maxScale: number;
  step: number;
  defaultSim: number;
}

const METHOD_CONFIGS: MethodConfig[] = [
  { key: 'TSA', label: 'Đánh giá tư duy (TSA)', maxScale: 100, step: 0.5, defaultSim: 75 },
  { key: 'HSA', label: 'Đánh giá năng lực HN (HSA)', maxScale: 150, step: 1, defaultSim: 105 },
  { key: 'VACT', label: 'Đánh giá năng lực HCM (V-ACT)', maxScale: 1200, step: 5, defaultSim: 900 },
  { key: 'THPTQG', label: 'Tốt nghiệp THPT (THPTQG)', maxScale: 30, step: 0.1, defaultSim: 26.5 },
];

export const AdmissionCompareModal: React.FC<AdmissionCompareModalProps> = ({
  isOpen,
  userId,
  exams,
  onClose,
}) => {
  const [benchmarks, setBenchmarks] = useState<AdmissionBenchmark[]>([]);
  const [fromFallback, setFromFallback] = useState(false);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);

  const [simScores, setSimScores] = useState<Record<MethodKey, number>>({
    TSA: 75,
    HSA: 105,
    VACT: 900,
    THPTQG: 26.5,
  });

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetchAdmissionBenchmarks(),
      userId ? fetchUserAttempts(userId) : Promise.resolve({ attempts: [] }),
    ])
      .then(([benchRes, attRes]) => {
        if (cancelled) return;
        setBenchmarks(benchRes.benchmarks);
        setFromFallback(benchRes.fromFallback);
        if (benchRes.benchmarks.length > 0) {
          setSelectedId((prev) =>
            prev && benchRes.benchmarks.some((b) => b.id === prev)
              ? prev
              : benchRes.benchmarks[0].id
          );
        }
        setAttempts(attRes.attempts);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, userId]);

  const examLookup = useMemo(() => {
    const map: Record<string, Exam> = {};
    for (const ex of exams) map[ex.id] = ex;
    return map;
  }, [exams]);

  // Average of 3 most recent valid attempts per exam type
  const autoAverages = useMemo(() => {
    const valid = attempts.filter(isValidAttempt);
    const avgs: Partial<Record<MethodKey, { avg: number; count: number }>> = {};

    for (const cfg of METHOD_CONFIGS) {
      const matched = valid
        .filter((a) => {
          const ex = examLookup[a.exam_id];
          const t = normalizeExamType(a.exam_type ?? ex?.exam_type);
          return t === cfg.key;
        })
        .slice(0, 3);

      if (matched.length > 0) {
        const sum = matched.reduce((acc, item) => acc + Number(item.score ?? 0), 0);
        avgs[cfg.key] = {
          avg: Number((sum / matched.length).toFixed(2)),
          count: matched.length,
        };
      }
    }
    return avgs;
  }, [attempts, examLookup]);

  // Sync simulated scores with user's auto averages when loaded
  useEffect(() => {
    setSimScores((prev) => ({
      TSA: autoAverages.TSA?.avg ?? prev.TSA,
      HSA: autoAverages.HSA?.avg ?? prev.HSA,
      VACT: autoAverages.VACT?.avg ?? prev.VACT,
      THPTQG: autoAverages.THPTQG?.avg ?? prev.THPTQG,
    }));
  }, [autoAverages]);

  const filteredBenchmarks = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return benchmarks;
    return benchmarks.filter((b) =>
      `${b.university_name} ${b.major_code} ${b.major_name}`
        .toLowerCase()
        .includes(q)
    );
  }, [benchmarks, searchTerm]);

  const selectedBenchmark = useMemo(
    () =>
      filteredBenchmarks.find((b) => b.id === selectedId) ??
      filteredBenchmarks[0] ??
      null,
    [filteredBenchmarks, selectedId]
  );

  useEffect(() => {
    if (filteredBenchmarks.length === 0) {
      if (selectedId !== '') setSelectedId('');
      return;
    }
    if (!filteredBenchmarks.some((b) => b.id === selectedId)) {
      setSelectedId(filteredBenchmarks[0].id);
    }
  }, [filteredBenchmarks, selectedId]);

  const comparisons = useMemo(() => {
    if (!selectedBenchmark) return [];

    const cutoffMap: Record<MethodKey, number | null> = {
      TSA: selectedBenchmark.cutoff_tsa,
      HSA: selectedBenchmark.cutoff_hsa,
      VACT: selectedBenchmark.cutoff_vact,
      THPTQG: selectedBenchmark.cutoff_thptqg,
    };

    return METHOD_CONFIGS.map((cfg) => {
      const cutoff = cutoffMap[cfg.key];
      if (cutoff === null || cutoff === undefined || cutoff <= 0) return null;

      const userScore = simScores[cfg.key];
      const diff = Number((userScore - cutoff).toFixed(2));
      const deficitPct = diff < 0 ? Math.abs(diff) / cutoff : 0;

      let status: 'safe' | 'close' | 'push' = 'safe';
      let statusLabel = 'An toàn';
      let badgeClass =
        'bg-emerald-50 text-emerald-700 border-emerald-200';
      let barClass = 'bg-emerald-500';

      if (diff < 0) {
        if (deficitPct < 0.05) {
          status = 'close';
          statusLabel = 'Mấp mé';
          badgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
          barClass = 'bg-amber-500';
        } else {
          status = 'push';
          statusLabel = 'Cần bứt phá';
          badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
          barClass = 'bg-crimson';
        }
      }

      const ratioPct = Math.min(100, Math.max(0, Math.round((userScore / cutoff) * 100)));
      const normalizedAdvantagePct = ((userScore - cutoff) / cutoff) * 100;

      return {
        cfg,
        cutoff,
        userScore,
        diff,
        status,
        statusLabel,
        badgeClass,
        barClass,
        ratioPct,
        normalizedAdvantagePct,
        autoInfo: autoAverages[cfg.key],
      };
    }).filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [selectedBenchmark, simScores, autoAverages]);

  const brightestPath = useMemo(() => {
    if (comparisons.length === 0) return null;
    return [...comparisons].sort(
      (a, b) => b.normalizedAdvantagePct - a.normalizedAdvantagePct
    )[0];
  }, [comparisons]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#261118]/45 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl rounded-[26px] border border-[var(--line)] bg-white/95 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[#fff6f7]/80">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-crimson" />
            <div>
              <h3 className="text-base font-bold text-[#2a161b]">
                So kè cửa đỗ theo Điểm chuẩn thực tế
              </h3>
              <p className="text-xs text-[#876870]">
                Đối chiếu điểm trung bình 3 bài gần nhất với điểm chuẩn từng phương thức
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-[#876870] hover:text-crimson hover:bg-[#ffeff1] transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 max-h-[82vh] overflow-y-auto custom-scrollbar space-y-6">
          {fromFallback && (
            <div className="rounded-2xl border border-[var(--line)] bg-[#fff9fa] px-4 py-2.5 text-xs text-[#5e4249] flex items-center gap-2">
              <Info className="w-4 h-4 text-crimson shrink-0" />
              <span>
                Đang hiển thị <strong>Dữ liệu mẫu</strong> — QTV có thể cập nhật điểm chuẩn thực tế trong trang Quản trị Parabol.
              </span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-xs text-[#876870]">
              Đang tải dữ liệu điểm chuẩn...
            </div>
          ) : (
            <>
              {/* Step 1: Select Target University & Major */}
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-crimson">
                    Bước 1 · Chọn Trường &amp; Ngành mục tiêu
                  </h4>
                  {selectedBenchmark && (
                    <span className="rounded-full bg-[#ffeff1] border border-crimson/20 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-crimson">
                      Năm áp dụng: {selectedBenchmark.year}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#876870] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm trường, mã ngành (IT-E10, UET...)"
                      className="w-full rounded-full border border-[var(--line)] bg-white pl-10 pr-4 py-2 text-xs sm:text-sm text-[#2a161b] focus:border-crimson focus:outline-none"
                    />
                  </div>

                  <select
                    value={selectedBenchmark?.id ?? ''}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="w-full rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs sm:text-sm font-medium text-[#2a161b] focus:border-crimson focus:outline-none"
                  >
                    {filteredBenchmarks.length === 0 ? (
                      <option value="">Không tìm thấy ngành phù hợp</option>
                    ) : (
                      filteredBenchmarks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.university_name} — {b.major_code} ({b.major_name}) [{b.year}]
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </section>

              {/* Step 2: Current / Simulated Scores */}
              {selectedBenchmark && (
                <section className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-crimson">
                    Bước 2 · Điểm hiện tại &amp; Giả lập của bạn
                  </h4>

                  {comparisons.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[#fff9fa] p-5 text-center text-xs text-[#876870]">
                      Ngành này chưa cấu hình điểm chuẩn cho các phương thức thi.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {comparisons.map(({ cfg, autoInfo }) => (
                        <div
                          key={cfg.key}
                          className="rounded-2xl border border-[var(--line)] bg-[#fff9fa] p-4 space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#2a161b]">
                              {cfg.label}
                            </span>
                            <span className="text-[11px] text-[#876870]">
                              {autoInfo
                                ? `TB ${autoInfo.count} bài: ${autoInfo.avg}`
                                : 'Chưa có bài thi (giả lập)'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={0}
                              max={cfg.maxScale}
                              step={cfg.step}
                              value={simScores[cfg.key]}
                              onChange={(e) =>
                                setSimScores((prev) => ({
                                  ...prev,
                                  [cfg.key]: Number(e.target.value),
                                }))
                              }
                              className="flex-1 h-1.5 rounded-full bg-crimson/15 accent-crimson cursor-pointer outline-none focus:outline-none focus:ring-0"
                            />
                            <input
                              type="number"
                              min={0}
                              max={cfg.maxScale}
                              step={cfg.step}
                              value={simScores[cfg.key]}
                              onChange={(e) =>
                                setSimScores((prev) => ({
                                  ...prev,
                                  [cfg.key]: Math.min(
                                    cfg.maxScale,
                                    Math.max(0, Number(e.target.value) || 0)
                                  ),
                                }))
                              }
                              className="w-20 rounded-xl border border-[var(--line)] bg-white px-2.5 py-1 text-xs font-mono font-bold text-center text-crimson focus:border-crimson focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Step 3: Comparison Table & Brightest Path Conclusion */}
              {comparisons.length > 0 && (
                <section className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-crimson">
                    Bước 3 · Đối chiếu trực tiếp với Điểm chuẩn {selectedBenchmark?.year}
                  </h4>

                  <div className="space-y-3">
                    {comparisons.map(
                      ({
                        cfg,
                        cutoff,
                        userScore,
                        diff,
                        statusLabel,
                        badgeClass,
                        barClass,
                        ratioPct,
                      }) => (
                        <div
                          key={cfg.key}
                          className="rounded-2xl border border-[var(--line)] bg-white p-4 space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#2a161b]">
                                {cfg.key}:{' '}
                                <span className="font-mono text-crimson">
                                  {userScore}
                                </span>{' '}
                                / {cutoff}
                              </span>
                              <span className="text-xs text-[#5e4249]">
                                {diff >= 0
                                  ? `→ Vượt +${diff} điểm`
                                  : `→ Thiếu ${Math.abs(diff)} điểm`}
                              </span>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badgeClass}`}
                            >
                              {diff >= 0 ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <Flame className="w-3 h-3" />
                              )}
                              {statusLabel}
                            </span>
                          </div>

                          <div className="h-2.5 w-full rounded-full bg-neutral-100 border border-[var(--line)] overflow-hidden">
                            <div
                              style={{ width: `${ratioPct}%` }}
                              className={`h-full rounded-full transition-all duration-300 ${barClass}`}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {/* Brightest Path Conclusion Card */}
                  {brightestPath && (
                    <div className="rounded-2xl border-2 border-crimson/25 bg-gradient-to-r from-[#fff5f6] via-white to-[#ffeff1] p-4 sm:p-5 flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-crimson text-white flex items-center justify-center shrink-0 shadow-sm">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-crimson">
                          <Sparkles className="w-3.5 h-3.5" />
                          Kết luận · Cửa sáng nhất
                        </div>
                        <p className="text-sm font-semibold text-[#2a161b] leading-relaxed">
                          Phương thức{' '}
                          <span className="text-crimson font-bold">
                            {brightestPath.cfg.key}
                          </span>{' '}
                          đang là cửa sáng nhất của bạn với ngành{' '}
                          <strong>{selectedBenchmark?.major_name}</strong> (
                          {brightestPath.diff >= 0
                            ? `đang vượt chuẩn +${brightestPath.diff} điểm`
                            : `chỉ còn thiếu ${Math.abs(brightestPath.diff)} điểm`}
                          ). Hãy ưu tiên dồn lực luyện đề phương thức này!
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
