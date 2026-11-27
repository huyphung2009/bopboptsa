import { Sparkles, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

export interface OmikujiFortune {
  id: string;
  tier: 'ĐẠI CÁT' | 'TRUNG CÁT' | 'TIỂU CÁT';
  kanji: string;
  message: string;
  advice: string;
  tierBadgeClass: string;
  accentColor: string;
}

const FORTUNES: OmikujiFortune[] = [
  // ĐẠI CÁT (30%)
  {
    id: 'dai-cat-1',
    tier: 'ĐẠI CÁT',
    kanji: '大吉',
    message:
      'Hôm nay não chạy 100% công suất, không bị lừa dấu trừ, khoanh câu khó cũng trúng!',
    advice: 'Vía sáng rực rỡ — tự tin chinh phục mọi câu vận dụng cao!',
    tierBadgeClass: 'bg-gradient-to-r from-[#dc263e] to-[#b91c30] text-amber-200 border-amber-300',
    accentColor: '#dc263e',
  },
  {
    id: 'dai-cat-2',
    tier: 'ĐẠI CÁT',
    kanji: '大吉',
    message: 'Vía IT-E10 cực mạnh, cứ tự tin bấm bắt đầu đi!',
    advice: 'Phong độ đỉnh cao — giữ nhịp làm bài thật mượt nhé!',
    tierBadgeClass: 'bg-gradient-to-r from-[#dc263e] to-[#b91c30] text-amber-200 border-amber-300',
    accentColor: '#dc263e',
  },
  {
    id: 'dai-cat-3',
    tier: 'ĐẠI CÁT',
    kanji: '大吉',
    message: 'Thần may mắn và tư duy logic đang đứng về phía bạn, đề nào cũng cân tất!',
    advice: 'Đọc đề đến đâu sáng ý đến đó — thẳng tiến điểm 85+!',
    tierBadgeClass: 'bg-gradient-to-r from-[#dc263e] to-[#b91c30] text-amber-200 border-amber-300',
    accentColor: '#dc263e',
  },
  // TRUNG CÁT (50%)
  {
    id: 'trung-cat-1',
    tier: 'TRUNG CÁT',
    kanji: '中吉',
    message: 'Đọc kỹ mấy câu hỏi phủ định (KHÔNG phải là...) kẻo mất điểm oan nhé!',
    advice: 'Gạch chân từ khóa phủ định trước khi chọn đáp án.',
    tierBadgeClass: 'bg-amber-500 text-white border-amber-300',
    accentColor: '#d97706',
  },
  {
    id: 'trung-cat-2',
    tier: 'TRUNG CÁT',
    kanji: '中吉',
    message: 'Phân bổ thời gian đều tay, câu nào bí quá đánh dấu rồi qua ngay!',
    advice: 'Chiến thuật gắn cờ vàng sẽ giúp bạn tối ưu điểm số hôm nay.',
    tierBadgeClass: 'bg-amber-500 text-white border-amber-300',
    accentColor: '#d97706',
  },
  {
    id: 'trung-cat-3',
    tier: 'TRUNG CÁT',
    kanji: '中吉',
    message: 'Giữ cái đầu lạnh ở các câu Đọc hiểu, đáp án chuẩn luôn nằm ngay trong bài!',
    advice: 'Không suy diễn ngoài ngữ cảnh — bám sát dẫn chứng đoạn văn.',
    tierBadgeClass: 'bg-amber-500 text-white border-amber-300',
    accentColor: '#d97706',
  },
  // TIỂU CÁT (20%)
  {
    id: 'tieu-cat-1',
    tier: 'TIỂU CÁT',
    kanji: '小吉',
    message: 'Hôm nay cẩn thận sai ngu tính toán nhé, bấm máy tính Casio 2 lần cho chắc!',
    advice: 'Chậm lại 5 giây ở bước biến đổi cuối để không rơi điểm đáng tiếc.',
    tierBadgeClass: 'bg-amber-100 text-amber-900 border-amber-400',
    accentColor: '#b45309',
  },
  {
    id: 'tieu-cat-2',
    tier: 'TIỂU CÁT',
    kanji: '小吉',
    message: 'Đừng chủ quan ở 5 câu đầu tiên — kiểm tra kỹ đơn vị và điều kiện trước khi chọn!',
    advice: 'Cẩn tắc vô áy náy, ăn chắc từng câu dễ trước khi leo câu khó.',
    tierBadgeClass: 'bg-amber-100 text-amber-900 border-amber-400',
    accentColor: '#b45309',
  },
];

const MAX_DAILY_DRAWS = 3;

interface DailyOmikujiState {
  date: string;
  drawsUsed: number;
  lastFortuneId: string | null;
}

function getTodayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function readDailyState(): DailyOmikujiState {
  const today = getTodayKey();
  try {
    const raw = localStorage.getItem(`parabol_omikuji_${today}`);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyOmikujiState;
      if (parsed.date === today) return parsed;
    }
  } catch {
    // ignore
  }
  return { date: today, drawsUsed: 0, lastFortuneId: null };
}

function writeDailyState(state: DailyOmikujiState): void {
  try {
    localStorage.setItem(`parabol_omikuji_${state.date}`, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function drawWeightedFortune(): OmikujiFortune {
  const roll = Math.random();
  let tier: OmikujiFortune['tier'];
  if (roll < 0.3) {
    tier = 'ĐẠI CÁT';
  } else if (roll < 0.8) {
    tier = 'TRUNG CÁT';
  } else {
    tier = 'TIỂU CÁT';
  }
  const pool = FORTUNES.filter((f) => f.tier === tier);
  return pool[Math.floor(Math.random() * pool.length)];
}

interface OmikujiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToExam?: () => void;
  proceedLabel?: string;
}

export const OmikujiModal: React.FC<OmikujiModalProps> = ({
  isOpen,
  onClose,
  onProceedToExam,
  proceedLabel = 'Nhận vía & Vào thi ngay',
}) => {
  const [isShaking, setIsShaking] = useState(false);
  const [fortune, setFortune] = useState<OmikujiFortune | null>(null);
  const [drawsUsed, setDrawsUsed] = useState(0);

  const performDraw = useCallback(() => {
    const current = readDailyState();
    if (current.drawsUsed >= MAX_DAILY_DRAWS) {
      const existing =
        FORTUNES.find((f) => f.id === current.lastFortuneId) ?? FORTUNES[0];
      setDrawsUsed(current.drawsUsed);
      setFortune(existing);
      setIsShaking(false);
      return;
    }

    setIsShaking(true);
    setFortune(null);

    const timer = window.setTimeout(() => {
      const picked = drawWeightedFortune();
      const nextState: DailyOmikujiState = {
        date: getTodayKey(),
        drawsUsed: current.drawsUsed + 1,
        lastFortuneId: picked.id,
      };
      writeDailyState(nextState);
      setDrawsUsed(nextState.drawsUsed);
      setFortune(picked);
      setIsShaking(false);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const cleanup = performDraw();
    return cleanup;
  }, [isOpen, performDraw]);

  if (!isOpen) return null;

  const remainingDraws = Math.max(0, MAX_DAILY_DRAWS - drawsUsed);

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center bg-[#261118]/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isShaking) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <style>{`
        @keyframes omikujiCylinderShake {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          15% { transform: rotate(-12deg) translateY(-4px); }
          30% { transform: rotate(12deg) translateY(2px); }
          45% { transform: rotate(-10deg) translateY(-4px); }
          60% { transform: rotate(10deg) translateY(2px); }
          75% { transform: rotate(-6deg) translateY(-2px); }
          90% { transform: rotate(6deg) translateY(0); }
        }
        @keyframes omikujiCardReveal {
          from { opacity: 0; transform: translateY(14px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div className="relative w-full max-w-sm rounded-[28px] border border-amber-300/60 bg-gradient-to-b from-[#fffdf8] via-white to-[#fff5f6] shadow-[0_32px_90px_-24px_rgba(220,38,62,0.4)] overflow-hidden">
        {/* Top Crimson-Gold Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#b91c30] via-[#dc263e] to-[#b91c30] text-white">
          <div className="flex items-center gap-2">
            <span className="text-base">🎋</span>
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                Rút quẻ xin vía đỗ NV1
              </h3>
              <p className="text-[10.5px] text-amber-100/90">
                Omikuji may mắn · Còn {remainingDraws}/{MAX_DAILY_DRAWS} lượt hôm nay
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {isShaking ? (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
              {/* Japanese Omikuji Shaker Cylinder */}
              <div
                className="relative w-20 h-28 rounded-2xl bg-gradient-to-b from-[#dc263e] to-[#991b1b] border-2 border-amber-300 shadow-lg flex flex-col items-center justify-center"
                style={{ animation: 'omikujiCylinderShake 0.55s ease-in-out infinite' }}
              >
                <div className="w-10 h-2 rounded-full bg-amber-200/80 mb-2" />
                <span className="text-2xl font-bold text-amber-200 tracking-widest">
                  運
                </span>
                <span className="text-[10px] font-semibold text-white/90 mt-1">
                  PARABOL
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-crimson">
                  Đang lắc ống xăm xin vía...
                </p>
                <p className="text-xs text-[#876870]">
                  Tịnh tâm 1 giây để nhận quẻ ứng nghiệm nhất nhé!
                </p>
              </div>
            </div>
          ) : (
            fortune && (
              <div
                className="space-y-4"
                style={{ animation: 'omikujiCardReveal 0.35s ease-out' }}
              >
                {/* Vertical Omikuji Card */}
                <div className="relative rounded-2xl border-2 border-amber-300/80 bg-[#fffdf9] p-5 text-center shadow-inner space-y-3">
                  <div className="absolute inset-1.5 rounded-xl border border-crimson/15 pointer-events-none" />

                  <div className="relative flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#876870]">
                      QUẺ THI PARABOL
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1 text-xs font-extrabold tracking-widest shadow-xs ${fortune.tierBadgeClass}`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {fortune.tier} · {fortune.kanji}
                    </span>
                  </div>

                  <p className="relative text-[14px] font-semibold leading-relaxed text-[#2a161b] pt-1">
                    “{fortune.message}”
                  </p>

                  <div className="relative pt-2 border-t border-amber-200/70">
                    <p className="text-xs text-[#6d4f57] leading-relaxed">
                      <span className="font-semibold text-crimson">Lời khuyên: </span>
                      {fortune.advice}
                    </p>
                  </div>
                </div>

                {remainingDraws === 0 && (
                  <p className="text-[11px] text-center text-[#876870]">
                    Bạn đã dùng hết 3/3 lượt rút quẻ hôm nay — giữ vía tốt và vào thi thôi!
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onProceedToExam) {
                        onProceedToExam();
                      } else {
                        onClose();
                      }
                    }}
                    className="btn btn-crimson flex-1 !py-2.5 text-xs font-semibold"
                  >
                    🎋 {proceedLabel}
                  </button>

                  {remainingDraws > 0 && (
                    <button
                      type="button"
                      onClick={performDraw}
                      className="btn btn-pill !py-2.5 !px-4 text-xs font-semibold"
                    >
                      Rút lại ({remainingDraws})
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
