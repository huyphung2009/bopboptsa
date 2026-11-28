import { BookOpen, EyeOff, Lightbulb, Sparkles, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface MascotCompanionProps {
  view: 'home' | 'exam' | 'result' | 'admin' | 'bounty';
  latestScore?: number | null;
  blackHoleCount?: number;
  isWrongBookOpen?: boolean;
  onOpenWrongBook: () => void;
  onOpenOmikuji: () => void;
}

const HOME_DIALOGUES = [
  'Tư duy thật chưa? Vào làm 1 đề TSA, HSA hay THPTQG khởi động đi! 🧠',
  'Mục tiêu NV1 thẳng tiến thôi bro, đừng lướt nữa, chọn đề cày ngay đi! 🔥',
  'Định đỗ đại học bằng niềm tin à? Chọn 1 đề TSA, V-ACT hoặc HSA làm ngay đi!',
  'Lại trốn làm đề đúng không? Tớ nhìn thấy hết đấy nhé 👀',
];

const NIGHT_OWL_DIALOGUE =
  'Cú đêm thế? Cày nốt đề này rồi đi ngủ, giữ sức khỏe mà thi chứ!';

const IDLE_DIALOGUES = [
  'Zzz... Ngủ gật rồi à? Dậy làm đề TSA đi!',
  'Màn hình sắp tắt rồi kìa, tư duy tiếp đi chứ!',
];

const ANNOYED_DIALOGUES = [
  'Chọc gì lắm thế! Lo mà cày đề TSA đi! 😤',
  'Bấm nữa là trừ điểm nhân phẩm đấy nhé, vào làm bài ngay!',
  'Tư duy thật chưa mà rảnh ngồi chọc tớ thế hả? 👀',
];

const EXAM_TIPS = [
  'Mẹo TSA: Câu nào đọc 30 giây chưa ra hướng thì gắn cờ vàng rồi làm tiếp câu dễ để ăn chắc điểm!',
  'Mẹo Đọc hiểu: Đọc lướt câu hỏi trước để khoanh vùng từ khóa, tránh đọc cả bài văn rồi quên ý.',
  'Mẹo Toán Tư duy: Thử kiểm tra điều kiện biên hoặc thay số đặc biệt để loại nhanh 2–3 đáp án nhiễu.',
  'Mẹo Khoa học: Đọc kỹ đơn vị trên trục biểu đồ và bảng số liệu — bẫy đổi đơn vị xuất hiện rất nhiều!',
  'Mẹo giữ tâm lý: Hít sâu 3 giây khi gặp câu lạ; giữ nhịp ~1.5 phút/câu để luôn dư giờ soát lại.',
];

function pickHomeDialogue(exclude?: string): string {
  const hour = new Date().getHours();
  const pool =
    hour >= 23 || hour < 5
      ? [...HOME_DIALOGUES, NIGHT_OWL_DIALOGUE]
      : HOME_DIALOGUES;
  const filtered = pool.filter((item) => item !== exclude);
  const source = filtered.length > 0 ? filtered : pool;
  return source[Math.floor(Math.random() * source.length)];
}

export const MascotCompanion: React.FC<MascotCompanionProps> = ({
  view,
  latestScore = null,
  blackHoleCount = 0,
  isWrongBookOpen = false,
  onOpenWrongBook,
  onOpenOmikuji,
}) => {
  const [minimized, setMinimized] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const [dialogue, setDialogue] = useState<string>(() => pickHomeDialogue());
  const [isIdle, setIsIdle] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const clickTimestampsRef = useRef<number[]>([]);
  const idleTimerRef = useRef<number | null>(null);
  const isIdleRef = useRef(false);

  useEffect(() => {
    isIdleRef.current = isIdle;
  }, [isIdle]);

  // Sync contextual dialogue when view / score / wrong-book state changes
  useEffect(() => {
    setMenuOpen(false);
    setIsIdle(false);

    if (isWrongBookOpen) {
      setBubbleVisible(true);
      setDialogue('Đấy, sai ở đâu vá ở đấy, thế mới là dân Bách khoa!');
      return;
    }

    if (view === 'bounty') {
      setBubbleVisible(true);
      setDialogue(
        'Toàn câu 70% dân tình gục ngã đấy! Giải được câu nào là lên thẳng Bảng Vàng luôn! 🔥'
      );
      return;
    }

    if (view === 'exam') {
      setBubbleVisible(false);
      setDialogue('Tập trung cao độ! Đừng để dính bẫy câu này nha...');
      return;
    }

    if (view === 'result' && latestScore !== null) {
      setBubbleVisible(true);
      if (blackHoleCount >= 2) {
        setDialogue(
          'Sa lầy vào mấy câu Hố đen mất bao nhiêu phút rồi kìa! Lần sau quá 2 phút chưa ra thì cắm cờ bỏ qua ngay nhé!'
        );
      } else if (latestScore >= 80) {
        setDialogue(
          'Tư duy đỉnh thật sự! Suất IT-E10 Bách khoa chắc chắn có tên cậu! 🎉'
        );
      } else if (latestScore >= 50) {
        setDialogue(
          'Cũng được đấy, nhưng xem lại Sổ tay câu sai ngay đi xem hổng chỗ nào!'
        );
      } else {
        setDialogue(
          'Tư duy thật chưa đấy? Tư duy rồi sao điểm thế này? Làm lại ngay! 😤'
        );
      }
      return;
    }

    setBubbleVisible(true);
    setDialogue(pickHomeDialogue());
  }, [view, latestScore, blackHoleCount, isWrongBookOpen]);

  // 60-second idle detection on Home / Dashboard
  useEffect(() => {
    if (view !== 'home' || minimized || isWrongBookOpen) {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return;
    }

    const scheduleIdle = () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = window.setTimeout(() => {
        setIsIdle(true);
        setBubbleVisible(true);
        setDialogue(
          IDLE_DIALOGUES[Math.floor(Math.random() * IDLE_DIALOGUES.length)]
        );
      }, 60000);
    };

    const handleActivity = () => {
      if (isIdleRef.current) {
        setIsIdle(false);
        setDialogue(pickHomeDialogue());
      }
      scheduleIdle();
    };

    scheduleIdle();
    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('mousedown', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });

    return () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [view, minimized, isWrongBookOpen]);

  const handleMascotClick = () => {
    const now = Date.now();
    const recent = clickTimestampsRef.current.filter((ts) => now - ts <= 3000);
    recent.push(now);
    clickTimestampsRef.current = recent;

    // Easter Egg: 5 consecutive clicks within 3 seconds
    if (recent.length >= 5) {
      clickTimestampsRef.current = [];
      setMenuOpen(false);
      setIsIdle(false);
      setIsShaking(true);
      setBubbleVisible(true);
      setDialogue(
        ANNOYED_DIALOGUES[Math.floor(Math.random() * ANNOYED_DIALOGUES.length)]
      );
      window.setTimeout(() => setIsShaking(false), 650);
      return;
    }

    if (view === 'exam' && !bubbleVisible) {
      setBubbleVisible(true);
      setDialogue('Tập trung cao độ! Đừng để dính bẫy câu này nha...');
    } else if (view === 'home' && !menuOpen) {
      setDialogue((prev) => pickHomeDialogue(prev));
      setBubbleVisible(true);
    }
    setMenuOpen((prev) => !prev);
  };

  const handleShowTip = () => {
    const tip = EXAM_TIPS[Math.floor(Math.random() * EXAM_TIPS.length)];
    setDialogue(tip);
    setBubbleVisible(true);
    setMenuOpen(false);
  };

  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => {
            setMinimized(false);
            if (view !== 'exam') setBubbleVisible(true);
          }}
          title="Mở trợ lý Parabol-chan"
          className="group relative w-13 h-13 rounded-full bg-white border-2 border-crimson/35 shadow-[0_10px_28px_-6px_rgba(220,38,62,0.35)] hover:scale-105 transition-transform flex items-center justify-center overflow-hidden cursor-pointer"
        >
          <img
            src="/mascot.png"
            alt="Parabol-chan"
            className="w-11 h-11 object-contain"
          />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-crimson ring-2 ring-white animate-pulse" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 select-none">
      <style>{`
        @keyframes mascotBreathe {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50% { transform: translateY(-4px) scaleY(1.02); }
        }
        @keyframes mascotShake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          20% { transform: translateX(-6px) rotate(-5deg); }
          40% { transform: translateX(6px) rotate(5deg); }
          60% { transform: translateX(-5px) rotate(-4deg); }
          80% { transform: translateX(5px) rotate(4deg); }
        }
      `}</style>

      {/* Quick Action Tooltip Menu */}
      {menuOpen && (
        <div className="w-56 rounded-2xl border border-crimson/25 bg-white/95 backdrop-blur-xl shadow-[0_18px_42px_-12px_rgba(38,17,24,0.28)] p-1.5 space-y-1 animate-[fadeInUp_0.2s_ease-out]">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onOpenOmikuji();
            }}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#2a161b] hover:bg-amber-50 hover:text-crimson transition-colors cursor-pointer"
          >
            <span className="text-sm leading-none shrink-0">🎋</span>
            <span>Xin vía đỗ NV1</span>
          </button>
          <button
            type="button"
            onClick={handleShowTip}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#2a161b] hover:bg-[#fff2f4] hover:text-crimson transition-colors cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>💡 Lời khuyên hôm nay</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onOpenWrongBook();
            }}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[#2a161b] hover:bg-[#fff2f4] hover:text-crimson transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-crimson shrink-0" />
            <span>📖 Ôn câu sai</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setMinimized(true);
            }}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-[#6d4f57] hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <EyeOff className="w-3.5 h-3.5 text-[#876870] shrink-0" />
            <span>🤫 Tạm ẩn tớ đi</span>
          </button>
        </div>
      )}

      {/* Speech Bubble */}
      {bubbleVisible && (
        <div className="relative max-w-[235px] sm:max-w-[255px] rounded-2xl bg-white/95 backdrop-blur-md border border-crimson/35 shadow-[0_12px_30px_-10px_rgba(220,38,62,0.25)] px-3.5 py-2.5 pr-7 text-[12px] leading-relaxed font-medium text-[#2a161b]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              setMinimized(true);
            }}
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[#876870] hover:text-crimson hover:bg-[#ffeff1] transition-colors cursor-pointer"
            title="Thu gọn Parabol-chan"
            aria-label="Thu gọn trợ lý"
          >
            <X className="w-3 h-3" />
          </button>
          <p>{dialogue}</p>
          <span
            className="absolute -bottom-1.5 right-10 w-3 h-3 rotate-45 bg-white border-r border-b border-crimson/35"
            aria-hidden="true"
          />
        </div>
      )}

      {/* Mascot Character Button */}
      <button
        type="button"
        onClick={handleMascotClick}
        className="group relative flex items-center justify-center w-[104px] h-[104px] sm:w-[110px] sm:h-[110px] cursor-pointer focus:outline-none"
        aria-label="Trợ lý Parabol-chan"
        style={
          isShaking
            ? { animation: 'mascotShake 0.45s ease-in-out' }
            : isIdle
              ? { animation: 'mascotBreathe 3.2s ease-in-out infinite' }
              : undefined
        }
      >
        <Sparkles
          className="absolute -top-1 left-1 w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 pointer-events-none"
          aria-hidden="true"
        />
        <Sparkles
          className="absolute top-2 -right-1 w-3.5 h-3.5 text-crimson/70 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 delay-75 pointer-events-none"
          aria-hidden="true"
        />

        <div className="w-full h-full rounded-3xl bg-white/95 border border-crimson/20 shadow-[0_14px_30px_-10px_rgba(220,38,62,0.3)] group-hover:-translate-y-1.5 group-hover:shadow-[0_20px_36px_-10px_rgba(220,38,62,0.4)] transition-all duration-300 p-1 overflow-hidden">
          <img
            src="/mascot.png"
            alt="Parabol-chan"
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        </div>
      </button>
    </div>
  );
};
