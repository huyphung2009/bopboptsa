import { Eraser, PenLine, StickyNote, Trash2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface ScratchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScratchpadModal: React.FC<ScratchpadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [tab, setTab] = useState<'text' | 'draw'>('draw');
  const [noteText, setNoteText] = useState('');
  const [penColor, setPenColor] = useState<'#2a161b' | '#dc263e' | '#2563eb'>('#2a161b');
  const [isEraser, setIsEraser] = useState(false);

  // Draggable window position
  const [pos, setPos] = useState({ x: 24, y: 84 });
  const draggingWindowRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // Drawing canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const drag = draggingWindowRef.current;
      if (!drag) return;
      const nextX = Math.max(
        8,
        Math.min(window.innerWidth - 340, drag.origX + (e.clientX - drag.startX))
      );
      const nextY = Math.max(
        8,
        Math.min(window.innerHeight - 120, drag.origY + (e.clientY - drag.startY))
      );
      setPos({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      draggingWindowRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  if (!isOpen) return null;

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pt = getCanvasPoint(e);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 18;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = penColor;
      ctx.lineWidth = 2.4;
    }
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      className="fixed z-50 w-[336px] sm:w-[380px] rounded-[22px] bg-white/95 dark:bg-[#1b0d13]/95 backdrop-blur-2xl shadow-[0_28px_70px_-20px_rgba(38,17,24,0.45)] border border-[var(--line)] overflow-hidden"
    >
      {/* Draggable Header */}
      <div
        onPointerDown={(e) => {
          draggingWindowRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            origX: pos.x,
            origY: pos.y,
          };
        }}
        className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--line)] bg-[#fff6f7] dark:bg-[#241219] cursor-move select-none"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2a161b] dark:text-[#fff2f4]">
          <PenLine className="w-3.5 h-3.5 text-crimson" />
          Bảng nháp nhanh (Kéo để di chuyển)
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-6 w-6 place-items-center rounded-full text-[#876870] hover:text-crimson hover:bg-[#ffeff1] dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Đóng bảng nháp"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-3 pt-2.5 pb-2 border-b border-[var(--line)] bg-[#fffafb] dark:bg-[#190c11]">
        <div className="grid grid-cols-2 rounded-full bg-[#ffeff1] dark:bg-[#241219] p-1">
          <button
            type="button"
            onClick={() => setTab('draw')}
            className={`rounded-full py-1 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'draw'
                ? 'bg-white dark:bg-[#1b0d13] text-crimson dark:text-[#fff2f4] shadow-xs'
                : 'text-[#876870] dark:text-[#c49ba3]'
            }`}
          >
            <PenLine className="w-3 h-3" />
            Bảng vẽ tay
          </button>
          <button
            type="button"
            onClick={() => setTab('text')}
            className={`rounded-full py-1 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'text'
                ? 'bg-white dark:bg-[#1b0d13] text-crimson dark:text-[#fff2f4] shadow-xs'
                : 'text-[#876870] dark:text-[#c49ba3]'
            }`}
          >
            <StickyNote className="w-3 h-3" />
            Ghi chú chữ
          </button>
        </div>
      </div>

      {/* Body */}
      {tab === 'draw' ? (
        <div className="p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {(
                [
                  { color: '#2a161b', label: 'Đen' },
                  { color: '#dc263e', label: 'Đỏ' },
                  { color: '#2563eb', label: 'Xanh' },
                ] as const
              ).map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => {
                    setPenColor(c.color);
                    setIsEraser(false);
                  }}
                  title={`Bút màu ${c.label}`}
                  className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                    !isEraser && penColor === c.color
                      ? 'border-crimson scale-110'
                      : 'border-white dark:border-zinc-700'
                  }`}
                  style={{ backgroundColor: c.color }}
                />
              ))}

              <button
                type="button"
                onClick={() => setIsEraser((v) => !v)}
                className={`ml-1 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                  isEraser
                    ? 'border-crimson bg-[#ffeff1] text-crimson dark:bg-[#dc263e]/25 dark:text-[#fbbac3]'
                    : 'border-[var(--line)] text-[#5e4249] dark:text-[#ebc9cf]'
                }`}
              >
                <Eraser className="w-3 h-3" />
                Tẩy
              </button>
            </div>

            <button
              type="button"
              onClick={handleClearCanvas}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-2.5 py-1 text-[11px] font-medium text-[#876870] hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Xóa hết
            </button>
          </div>

          <canvas
            ref={canvasRef}
            width={680}
            height={440}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerUp}
            className="w-full h-56 rounded-2xl border border-[var(--line)] bg-white cursor-crosshair touch-none"
          />
        </div>
      ) : (
        <div className="p-3 space-y-2">
          <textarea
            rows={9}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Ghi chú nhanh công thức, dữ kiện, phép tính..."
            className="w-full rounded-2xl border border-[var(--line)] bg-white dark:bg-[#13090d] p-3 text-xs sm:text-sm text-[#2a161b] dark:text-[#fff2f4] placeholder:text-[#876870]/70 focus:border-crimson focus:outline-none resize-none"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setNoteText('')}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-2.5 py-1 text-[11px] font-medium text-[#876870] hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Xóa ghi chú
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
