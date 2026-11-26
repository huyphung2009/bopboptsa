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
    { label: 'sin(', val: 'sin(', cls: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300' },
    { label: 'cos(', val: 'cos(', cls: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300' },
    { label: 'tan(', val: 'tan(', cls: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300' },
    { label: '√(', val: '√(', cls: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300' },
    { label: 'log(', val: 'log(', cls: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300' },

    { label: 'ln(', val: 'ln(', cls: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300' },
    { label: '(', val: '(', cls: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300' },
    { label: ')', val: ')', cls: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300' },
    { label: '^', val: '^', cls: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300' },
    { label: 'π', val: 'π', cls: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300' },

    { label: '7', val: '7', cls: 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 font-semibold' },
    { label: '8', val: '8', cls: 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 font-semibold' },
    { label: '9', val: '9', cls: 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 font-semibold' },
    { label: '÷', val: '÷', cls: 'bg-slate-100 dark:bg-zinc-800 text-red-700 dark:text-red-400 font-bold' },
    { label: 'C', action: handleClear, cls: 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 font-bold' },

    { label: '4', val: '4', cls: 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 font-semibold' },
    { label: '5', val: '5', cls: 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 font-semibold' },
    { label: '6', val: '6', cls: 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 font-semibold' },
    { label: '×', val: '×', cls: 'bg-slate-100 dark:bg-zinc-800 text-red-700 dark:text-red-400 font-bold' },
    { label: '⌫', action: handleBackspace, cls: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300' },

    { label: '1', val: '1', cls: 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 font-semibold' },
    { label: '2', val: '2', cls: 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 font-semibold' },
    { label: '3', val: '3', cls: 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 font-semibold' },
    { label: '-', val: '-', cls: 'bg-slate-100 dark:bg-zinc-800 text-red-700 dark:text-red-400 font-bold' },
    { label: 'ANS', val: 'ANS', cls: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[11px] font-bold' },

    { label: '0', val: '0', cls: 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 font-semibold' },
    { label: '.', val: '.', cls: 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 font-bold' },
    { label: 'e', val: 'e', cls: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold' },
    { label: '+', val: '+', cls: 'bg-slate-100 dark:bg-zinc-800 text-red-700 dark:text-red-400 font-bold' },
    { label: '=', action: evaluateExpression, cls: 'bg-red-700 text-white font-bold' },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl bg-white dark:bg-zinc-900 shadow-2xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-300">
          <Calculator className="w-3.5 h-3.5 text-red-700 dark:text-red-500" />
          Máy tính cầm tay
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Đóng máy tính"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-slate-950 px-4 py-3 text-right font-mono">
        <input
          type="text"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') evaluateExpression();
          }}
          placeholder="Nhập phép tính..."
          className="w-full bg-transparent text-right text-xs text-zinc-400 focus:outline-none"
        />
        <div className="mt-1 text-xl font-bold text-white truncate">{result}</div>
      </div>

      <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 grid grid-cols-5 gap-1.5">
        {buttons.map((btn, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => (btn.action ? btn.action() : appendToken(btn.val!))}
            className={`h-9 rounded-lg border border-slate-200/80 dark:border-zinc-800 text-xs flex items-center justify-center hover:brightness-95 dark:hover:brightness-110 active:scale-95 transition-all font-mono ${btn.cls}`}
          >
            {btn.label === '⌫' ? <Delete className="w-3.5 h-3.5" /> : btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};
