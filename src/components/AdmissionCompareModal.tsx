import {
  CheckCircle2,
  Compass,
  Flame,
  Info,
  Search,
  Sparkles,
  Target,
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
import type { TargetGoalPayload, UserProfile } from '../lib/profileService';
import type { AttemptRecord, Exam } from '../types/exam';
import { normalizeExamType } from '../utils/examTypes';

interface AdmissionCompareModalProps {
  isOpen: boolean;
  userId?: string;
  profile?: UserProfile | null;
  exams: Exam[];
  onClose: () => void;
  onSetAsGoal?: (goal: TargetGoalPayload) => Promise<void>;
  onRequireAuth?: (notice: string) => void;
}

type MethodKey = 'TSA' | 'HSA' | 'VACT' | 'THPTQG';
type CompareTab = 'by_major' | 'reverse';
type ReverseGroupKey = 'safe' | 'fit' | 'reach';

interface MethodConfig {
  key: MethodKey;
  label: string;
  shortLabel: string;
  maxScale: number;
  step: number;
  defaultSim: number;
  safeMargin: number;
  reachMargin: number;
}

const METHOD_CONFIGS: MethodConfig[] = [
  {
    key: 'TSA',
    label: 'Đánh giá tư duy (TSA)',
    shortLabel: 'TSA (Thang 100)',
    maxScale: 100,
    step: 0.5,
    defaultSim: 75,
    safeMargin: 2.0,
    reachMargin: 3.0,
  },
  {
    key: 'HSA',
    label: 'Đánh giá năng lực HN (HSA)',
    shortLabel: 'HSA (Thang 150)',
    maxScale: 150,
    step: 1,
    defaultSim: 105,
    safeMargin: 3.0,
    reachMargin: 5.0,
  },
  {
    key: 'VACT',
    label: 'Đánh giá năng lực HCM (V-ACT)',
    shortLabel: 'V-ACT (Thang 1200)',
    maxScale: 1200,
    step: 5,
    defaultSim: 900,
    safeMargin: 30,
    reachMargin: 40,
  },
  {
    key: 'THPTQG',
    label: 'Tốt nghiệp THPT (THPTQG)',
    shortLabel: 'THPTQG (Thang 30)',
    maxScale: 30,
    step: 0.1,
    defaultSim: 26.5,
    safeMargin: 0.5,
    reachMargin: 1.0,
  },
];

function getCutoffByMethod(
  b: AdmissionBenchmark,
  method: MethodKey
): number | null {
  switch (method) {
    case 'TSA':
      return b.cutoff_tsa;
    case 'HSA':
      return b.cutoff_hsa;
    case 'VACT':
      return b.cutoff_vact;
    case 'THPTQG':
      return b.cutoff_thptqg;
  }
}

export const AdmissionCompareModal: React.FC<AdmissionCompareModalProps> = ({
  isOpen,
  userId,
  profile,
  exams,
  onClose,
  onSetAsGoal,
  onRequireAuth,
}) => {
  const [activeTab, setActiveTab] = useState<CompareTab>('by_major');
  const [benchmarks, setBenchmarks] = useState<AdmissionBenchmark[]>([]);
  const [fromFallback, setFromFallback] = useState(false);
  const [loading, setLoading] = useState(false);

  // Tab 1 state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);

  // Tab 2 (Reverse Lookup) state
  const [reverseMethod, setReverseMethod] = useState<MethodKey>('TSA');
  const [reverseUniversity, setReverseUniversity] = useState<string>('ALL');
  const [reverseMajorQuery, setReverseMajorQuery] = useState<string>('');
  const [reverseGroup, setReverseGroup] = useState<ReverseGroupKey>('safe');
  const [savedGoalId, setSavedGoalId] = useState<string | null>(null);
  const [savingGoalId, setSavingGoalId] = useState<string | null>(null);

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
    setSavedGoalId(null);

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

  useEffect(() => {
    setSimScores((prev) => ({
      TSA: autoAverages.TSA?.avg ?? prev.TSA,
      HSA: autoAverages.HSA?.avg ?? prev.HSA,
      VACT: autoAverages.VACT?.avg ?? prev.VACT,
      THPTQG: autoAverages.THPTQG?.avg ?? prev.THPTQG,
    }));
  }, [autoAverages]);

  // Tab 1 filtering & sync
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

    return METHOD_CONFIGS.map((cfg) => {
      const cutoff = getCutoffByMethod(selectedBenchmark, cfg.key);
      if (cutoff === null || cutoff === undefined || cutoff <= 0) return null;

      const userScore = simScores[cfg.key];
      const diff = Number((userScore - cutoff).toFixed(2));
      const deficitPct = diff < 0 ? Math.abs(diff) / cutoff : 0;

      let statusLabel = 'An toàn';
      let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      let barClass = 'bg-emerald-500';

      if (diff < 0) {
        if (deficitPct < 0.05) {
          statusLabel = 'Mấp mé';
          badgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
          barClass = 'bg-amber-500';
        } else {
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

  // Tab 2 (Reverse Lookup) data
  const universitiesList = useMemo(() => {
    const set = new Set<string>();
    for (const b of benchmarks) {
      if (b.university_name) set.add(b.university_name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [benchmarks]);

  const reverseConfig = useMemo(
    () => METHOD_CONFIGS.find((c) => c.key === reverseMethod) ?? METHOD_CONFIGS[0],
    [reverseMethod]
  );

  const reverseGroups = useMemo(() => {
    const userScore = simScores[reverseMethod];
    const query = reverseMajorQuery.trim().toLowerCase();

    const matched = benchmarks
      .map((b) => {
        const cutoff = getCutoffByMethod(b, reverseMethod);
        if (cutoff === null || cutoff === undefined || cutoff <= 0) return null;
        if (reverseUniversity !== 'ALL' && b.university_name !== reverseUniversity) {
          return null;
        }
        if (query) {
          const hay = `${b.major_code} ${b.major_name} ${b.university_name}`.toLowerCase();
          if (!hay.includes(query)) return null;
        }
        const gap = Number((userScore - cutoff).toFixed(2));
        return { benchmark: b, cutoff, gap };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .sort((a, b) => b.cutoff - a.cutoff);

    const safe: typeof matched = [];
    const fit: typeof matched = [];
    const reach: typeof matched = [];

    for (const item of matched) {
      if (item.gap >= reverseConfig.safeMargin) {
        safe.push(item);
      } else if (item.gap >= 0) {
        fit.push(item);
      } else if (item.gap >= -reverseConfig.reachMargin) {
        reach.push(item);
      }
    }

    return { safe, fit, reach };
  }, [
    benchmarks,
    reverseMethod,
    reverseUniversity,
    reverseMajorQuery,
    simScores,
    reverseConfig,
  ]);

  const activeReverseList = reverseGroups[reverseGroup];

  const handleSetGoal = async (b: AdmissionBenchmark, cutoff: number) => {
    if (!userId || !onSetAsGoal) {
      onRequireAuth?.('Vui lòng đăng nhập tài khoản để đặt mục tiêu NV1.');
      return;
    }
    setSavingGoalId(b.id);
    try {
      await onSetAsGoal({
        target_university: b.university_name,
        target_major: `${b.major_code} - ${b.major_name}`,
        target_exam_type: reverseMethod,
        target_score: cutoff,
        target_exam_date: profile?.target_exam_date || '2027-06-15',
      });
      setSavedGoalId(b.id);
    } finally {
      setSavingGoalId(null);
    }
  };

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
                Đối chiếu điểm cá nhân hoặc tra cứu ngược toàn bộ ngành xét tuyển phù hợp
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

        {/* Mode Switcher Tabs */}
        <div className="px-6 pt-4 bg-white">
          <div className="grid grid-cols-2 rounded-full bg-[#fff5f6] border border-[var(--line)] p-1">
            <button
              type="button"
              onClick={() => setActiveTab('by_major')}
              className={`rounded-full py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'by_major'
                  ? 'bg-crimson text-white shadow-xs'
                  : 'text-[#876870] hover:text-crimson'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              So kè theo ngành
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reverse')}
              className={`rounded-full py-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'reverse'
                  ? 'bg-crimson text-white shadow-xs'
                  : 'text-[#876870] hover:text-crimson'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Tra cứu &quot;Cửa đỗ ngược&quot;
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 max-h-[78vh] overflow-y-auto custom-scrollbar space-y-6">
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
          ) : activeTab === 'by_major' ? (
            <>
              {/* TAB 1: SO KÈ THEO NGÀNH */}
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
          ) : (
            /* TAB 2: TRA CỨU CỬA ĐỖ NGƯỢC */
            <div className="space-y-5">
              {/* Exam Type Selector & Score Input */}
              <section className="rounded-2xl border border-[var(--line)] bg-[#fff9fa] p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-crimson">
                    1 · Chọn kỳ thi &amp; Nhập điểm của bạn
                  </h4>
                  <span className="text-[11px] text-[#876870]">
                    {autoAverages[reverseMethod]
                      ? `Tự động điền TB ${autoAverages[reverseMethod]?.count} bài: ${autoAverages[reverseMethod]?.avg}`
                      : 'Chưa có bài thi — kéo thanh trượt để giả lập'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {METHOD_CONFIGS.map((cfg) => {
                    const active = reverseMethod === cfg.key;
                    return (
                      <button
                        key={cfg.key}
                        type="button"
                        onClick={() => setReverseMethod(cfg.key)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                          active
                            ? 'bg-crimson text-white border-crimson shadow-xs'
                            : 'bg-white text-[#5e4249] border-[var(--line)] hover:border-crimson/40 hover:text-crimson'
                        }`}
                      >
                        {cfg.shortLabel}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="range"
                    min={0}
                    max={reverseConfig.maxScale}
                    step={reverseConfig.step}
                    value={simScores[reverseMethod]}
                    onChange={(e) =>
                      setSimScores((prev) => ({
                        ...prev,
                        [reverseMethod]: Number(e.target.value),
                      }))
                    }
                    className="flex-1 h-1.5 rounded-full bg-crimson/15 accent-crimson cursor-pointer outline-none focus:outline-none focus:ring-0"
                  />
                  <input
                    type="number"
                    min={0}
                    max={reverseConfig.maxScale}
                    step={reverseConfig.step}
                    value={simScores[reverseMethod]}
                    onChange={(e) =>
                      setSimScores((prev) => ({
                        ...prev,
                        [reverseMethod]: Math.min(
                          reverseConfig.maxScale,
                          Math.max(0, Number(e.target.value) || 0)
                        ),
                      }))
                    }
                    className="w-24 rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-sm font-mono font-bold text-center text-crimson focus:border-crimson focus:outline-none"
                  />
                </div>

                {/* University & Major Quick Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <select
                    value={reverseUniversity}
                    onChange={(e) => setReverseUniversity(e.target.value)}
                    className="w-full rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-medium text-[#2a161b] focus:border-crimson focus:outline-none"
                  >
                    <option value="ALL">Tất cả các trường ({universitiesList.length})</option>
                    {universitiesList.map((uni) => (
                      <option key={uni} value={uni}>
                        {uni}
                      </option>
                    ))}
                  </select>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#876870] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={reverseMajorQuery}
                      onChange={(e) => setReverseMajorQuery(e.target.value)}
                      placeholder="Tìm ngành / mã ngành (CNTT, Marketing...)"
                      className="w-full rounded-full border border-[var(--line)] bg-white pl-9 pr-4 py-2 text-xs text-[#2a161b] focus:border-crimson focus:outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* 3 Group Sub-tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReverseGroup('safe')}
                  className={`rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                    reverseGroup === 'safe'
                      ? 'border-emerald-400 bg-emerald-50/80 shadow-xs'
                      : 'border-[var(--line)] bg-white hover:border-emerald-300'
                  }`}
                >
                  <div className="text-xs font-bold text-emerald-700">
                    An toàn ({reverseGroups.safe.length})
                  </div>
                  <div className="text-[10.5px] text-[#5e4249] mt-0.5">
                    Gợi ý NV3–NV4 (vượt &ge; {reverseConfig.safeMargin}đ)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReverseGroup('fit')}
                  className={`rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                    reverseGroup === 'fit'
                      ? 'border-sky-400 bg-sky-50/80 shadow-xs'
                      : 'border-[var(--line)] bg-white hover:border-sky-300'
                  }`}
                >
                  <div className="text-xs font-bold text-sky-700">
                    Vừa tầm ({reverseGroups.fit.length})
                  </div>
                  <div className="text-[10.5px] text-[#5e4249] mt-0.5">
                    Gợi ý NV2 (đạt chuẩn)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReverseGroup('reach')}
                  className={`rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                    reverseGroup === 'reach'
                      ? 'border-amber-400 bg-amber-50/80 shadow-xs'
                      : 'border-[var(--line)] bg-white hover:border-amber-300'
                  }`}
                >
                  <div className="text-xs font-bold text-amber-800">
                    Cố thêm chút ({reverseGroups.reach.length})
                  </div>
                  <div className="text-[10.5px] text-[#5e4249] mt-0.5">
                    Mục tiêu NV1 (thiếu &le; {reverseConfig.reachMargin}đ)
                  </div>
                </button>
              </div>

              {/* Results List */}
              {activeReverseList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[#fff9fa] p-8 text-center text-xs text-[#876870]">
                  Không có ngành nào trong nhóm này với mức điểm {simScores[reverseMethod]} ({reverseMethod}). Hãy thử đổi nhóm hoặc điều chỉnh thanh điểm!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeReverseList.map(({ benchmark: b, cutoff, gap }) => {
                    const isSaved = savedGoalId === b.id;
                    const isSaving = savingGoalId === b.id;
                    return (
                      <div
                        key={b.id}
                        className="rounded-2xl border border-[var(--line)] bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-crimson/35 transition-colors"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-[#876870]">
                              {b.university_name}
                            </span>
                            <span className="rounded-full bg-[#fff5f6] border border-[var(--line)] px-2 py-0.5 text-[10px] font-mono font-semibold text-crimson">
                              {b.major_code} · {b.year}
                            </span>
                            {reverseGroup === 'safe' ? (
                              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                An toàn
                              </span>
                            ) : reverseGroup === 'fit' ? (
                              <span className="rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                                Vừa tầm
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-50 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                Cần cố thêm
                              </span>
                            )}
                          </div>

                          <h5 className="text-sm font-semibold text-[#2a161b] truncate">
                            {b.major_name}
                          </h5>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-[#2a161b]">
                              Chuẩn: {cutoff}
                            </div>
                            <div
                              className={`text-[11px] font-mono font-bold ${
                                gap >= 0 ? 'text-emerald-600' : 'text-amber-700'
                              }`}
                            >
                              {gap >= 0 ? `+${gap}đ` : `${gap}đ`}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => void handleSetGoal(b, cutoff)}
                            className={`btn btn-sm shrink-0 ${
                              isSaved ? 'bg-emerald-600 text-white' : 'btn-pill'
                            }`}
                          >
                            <Target className="w-3.5 h-3.5" />
                            {isSaved
                              ? 'Đã đặt NV1'
                              : isSaving
                                ? 'Đang lưu...'
                                : 'Đặt làm NV1'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
