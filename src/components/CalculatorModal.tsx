import { Calculator, Delete, X } from 'lucide-react';
import React, { useState } from 'react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose }) => {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState('0');
  const [lastAns, setLastAns] = useState('0');

  if (!isOpen) return null;

  const appendToken = (token: string) => {
    setExpr((prev) => prev + token);
  };

  const handleClear = () => {
    setExpr('');
    setResult('0');
  };

  const handleBackspace = () => {
    setExpr((prev) => prev.slice(0, -1));
  };

  const evaluateExpression = () => {
    if (!expr.trim()) return;
    try {
      const sanitized = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/\be\b/g, 'Math.E')
        .replace(/ANS/g, `(${lastAns})`)
        .replace(/√\(/g, 'Math.sqrt(')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/\^/g, '**');

      if (!/^[0-9+\-*/().,\sMathPIEsincotalgrq*]+$/.test(sanitized)) {
        setResult('Lỗi cú pháp');
        return;
      }

      const fn = new Function(`"use strict"; return (${sanitized});`);
      const val = fn();
      if (typeof val === 'number' && Number.isFinite(val)) {
        const formatted = Number(val.toPrecision(10)).toString();
        setResult(formatted);
        setLastAns(formatted);
      } else {
        setResult('Không xác định');
      }
    } catch {
      setResult('Lỗi cú pháp');
    }
  };

  const buttons = [
    { label: 'sin(', val: 'sin(', cls: 'bg-[#fff5f6] dark:bg-[#2a141c] text-[#5e4249] dark:text-[#fbbac3]' },
    { label: 'cos(', val: 'cos(', cls: 'bg-[#fff5f6] dark:bg-[#2a141c] text-[#5e4249] dark:text-[#fbbac3]' },
    { label: 'tan(', val: 'tan(', cls: 'bg-[#fff5f6] dark:bg-[#2a141c] text-[#5e4249] dark:text-[#fbbac3]' },
    { label: '√(', val: '√(', cls: 'bg-[#fff5f6] dark:bg-[#2a141c] text-[#5e4249] dark:text-[#fbbac3]' },
    { label: 'log(', val: 'log(', cls: 'bg-[#fff5f6] dark:bg-[#2a141c] text-[#5e4249] dark:text-[#fbbac3]' },

    { label: 'ln(', val: 'ln(', cls: 'bg-[#fff5f6] dark:bg-[#2a141c] text-[#5e4249] dark:text-[#fbbac3]' },
    { label: '(', val: '(', cls: 'bg-[#fff5f6] dark:bg-[#2a141c] text-[#5e4249] dark:text-[#fbbac3]' },
    { label: ')', val: ')', cls: 'bg-[#fff5f6] dark:bg-[#2a141c] text-[#5e4249] dark:text-[#fbbac3]' },
    { label: '^', val: '^', cls: 'bg-[#fff5f6] dark:bg-[#2a141c] text-[#5e4249] dark:text-[#fbbac3]' },
    { label: 'π', val: 'π', cls: 'bg-[#fff5f6] dark:bg-[#2a141c] text-[#5e4249] dark:text-[#fbbac3]' },

    { label: '7', val: '7', cls: 'bg-white dark:bg-[#1b0d13] text-[#2a161b] dark:text-[#fff2f4] font-semibold' },
    { label: '8', val: '8', cls: 'bg-white dark:bg-[#1b0d13] text-[#2a161b] dark:text-[#fff2f4] font-semibold' },
    { label: '9', val: '9', cls: 'bg-white dark:bg-[#1b0d13] text-[#2a161b] dark:text-[#fff2f4] font-semibold' },
    { label: '÷', val: '÷', cls: 'bg-[#ffeff1] dark:bg-[#381823] text-crimson dark:text-[#ff8fa0] font-bold' },
    { label: 'C', action: handleClear, cls: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold' },

    { label: '4', val: '4', cls: 'bg-white dark:bg-[#1b0d13] text-[#2a161b] dark:text-[#fff2f4] font-semibold' },
    { label: '5', val: '5', cls: 'bg-white dark:bg-[#1b0d13] text-[#2a161b] dark:text-[#fff2f4] font-semibold' },
    { label: '6', val: '6', cls: 'bg-white dark:bg-[#1b0d13] text-[#2a161b] dark:text-[#fff2f4] font-semibold' },
    { label: '×', val: '×', cls: 'bg-[#ffeff1] dark:bg-[#381823] text-crimson dark:text-[#ff8fa0] font-bold' },
    { label: '⌫', action: handleBackspace, cls: 'bg-[#fff5f6] dark:bg-[#2a141c] text-[#5e4249] dark:text-[#fbbac3]' },

    { label: '1', val: '1', cls: 'bg-white dark:bg-[#1b0d13] text-[#2a161b] dark:text-[#fff2f4] font-semibold' },
    { label: '2', val: '2', cls: 'bg-white dark:bg-[#1b0d13] text-[#2a161b] dark:text-[#fff2f4] font-semibold' },
    { label: '3', val: '3', cls: 'bg-white dark:bg-[#1b0d13] text-[#2a161b] dark:text-[#fff2f4] font-semibold' },
    { label: '-', val: '-', cls: 'bg-[#ffeff1] dark:bg-[#381823] text-crimson dark:text-[#ff8fa0] font-bold' },
    { label: 'ANS', val: 'ANS', cls: 'bg-[#fff5f6] dark:bg-[#2a141c] text-[#5e4249] dark:text-[#fbbac3] text-[11px] font-bold' },

    { label: '0', val: '0', cls: 'bg-white dark:bg-[#1b0d13] text-[#2a161b] dark:text-[#fff2f4] font-semibold' },
    { label: '.', val: '.', cls: 'bg-white dark:bg-[#1b0d13] text-[#2a161b] dark:text-[#fff2f4] font-bold' },
    { label: 'e', val: 'e', cls: 'bg-[#fff5f6] dark:bg-[#2a141c] text-[#5e4249] dark:text-[#fbbac3] font-semibold' },
    { label: '+', val: '+', cls: 'bg-[#ffeff1] dark:bg-[#381823] text-crimson dark:text-[#ff8fa0] font-bold' },
    { label: '=', action: evaluateExpression, cls: 'bg-crimson text-white font-bold shadow-xs' },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-[22px] bg-white/95 dark:bg-[#1b0d13]/95 backdrop-blur-2xl shadow-[0_28px_70px_-20px_rgba(38,17,24,0.45)] border border-[var(--line)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--line)] bg-[#fff6f7]/80 dark:bg-[#241219]/70">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2a161b] dark:text-[#fff2f4]">
          <Calculator className="w-3.5 h-3.5 text-crimson" />
          Máy tính cầm tay
        </div>
        <button
          onClick={onClose}
          className="grid h-7 w-7 place-items-center rounded-full text-[#876870] hover:text-crimson hover:bg-[#ffeff1] dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Đóng máy tính"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="bg-wine px-4 py-3 text-right font-mono border-b border-white/10">
        <input
          type="text"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') evaluateExpression();
          }}
          placeholder="Nhập phép tính..."
          className="w-full bg-transparent text-right text-xs text-[#fbbac3] placeholder:text-[#876870] focus:outline-none"
        />
        <div className="mt-1 text-xl font-bold text-white truncate">{result}</div>
      </div>

      <div className="p-2.5 bg-[#fff8f9] dark:bg-[#13090d] grid grid-cols-5 gap-1.5">
        {buttons.map((btn, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => (btn.action ? btn.action() : appendToken(btn.val!))}
            className={`h-9 rounded-xl border border-[var(--line)] text-xs flex items-center justify-center hover:brightness-95 dark:hover:brightness-110 active:scale-95 transition-all font-mono cursor-pointer ${btn.cls}`}
          >
            {btn.label === '⌫' ? <Delete className="w-3.5 h-3.5" /> : btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};
