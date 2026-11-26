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

      // Only allow safe math characters and Math.* calls
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
    { label: 'sin(', val: 'sin(', cls: 'bg-slate-100 text-slate-700' },
    { label: 'cos(', val: 'cos(', cls: 'bg-slate-100 text-slate-700' },
    { label: 'tan(', val: 'tan(', cls: 'bg-slate-100 text-slate-700' },
    { label: '√(', val: '√(', cls: 'bg-slate-100 text-slate-700' },
    { label: 'log(', val: 'log(', cls: 'bg-slate-100 text-slate-700' },

    { label: 'ln(', val: 'ln(', cls: 'bg-slate-100 text-slate-700' },
    { label: '(', val: '(', cls: 'bg-slate-100 text-slate-700' },
    { label: ')', val: ')', cls: 'bg-slate-100 text-slate-700' },
    { label: '^', val: '^', cls: 'bg-slate-100 text-slate-700' },
    { label: 'π', val: 'π', cls: 'bg-slate-100 text-slate-700' },

    { label: '7', val: '7', cls: 'bg-white text-slate-900 font-semibold' },
    { label: '8', val: '8', cls: 'bg-white text-slate-900 font-semibold' },
    { label: '9', val: '9', cls: 'bg-white text-slate-900 font-semibold' },
    { label: '÷', val: '÷', cls: 'bg-rose-50 text-rose-700 font-bold' },
    { label: 'C', action: handleClear, cls: 'bg-amber-100 text-amber-800 font-bold' },

    { label: '4', val: '4', cls: 'bg-white text-slate-900 font-semibold' },
    { label: '5', val: '5', cls: 'bg-white text-slate-900 font-semibold' },
    { label: '6', val: '6', cls: 'bg-white text-slate-900 font-semibold' },
    { label: '×', val: '×', cls: 'bg-rose-50 text-rose-700 font-bold' },
    { label: '⌫', action: handleBackspace, cls: 'bg-slate-200 text-slate-700' },

    { label: '1', val: '1', cls: 'bg-white text-slate-900 font-semibold' },
    { label: '2', val: '2', cls: 'bg-white text-slate-900 font-semibold' },
    { label: '3', val: '3', cls: 'bg-white text-slate-900 font-semibold' },
    { label: '-', val: '-', cls: 'bg-rose-50 text-rose-700 font-bold' },
    { label: 'ANS', val: 'ANS', cls: 'bg-slate-100 text-slate-700 text-xs font-bold' },

    { label: '0', val: '0', cls: 'bg-white text-slate-900 font-semibold' },
    { label: '.', val: '.', cls: 'bg-white text-slate-900 font-bold' },
    { label: 'e', val: 'e', cls: 'bg-slate-100 text-slate-700 font-semibold' },
    { label: '+', val: '+', cls: 'bg-rose-50 text-rose-700 font-bold' },
    { label: '=', action: evaluateExpression, cls: 'bg-rose-700 text-white font-bold' },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-2.5 text-white">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <Calculator className="w-4 h-4 text-amber-400" />
          Máy tính khoa học
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-white/15 transition-colors"
          aria-label="Đóng máy tính"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-slate-950 px-4 py-3 text-right">
        <input
          type="text"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') evaluateExpression();
          }}
          placeholder="Nhập phép tính..."
          className="w-full bg-transparent text-right text-sm text-slate-300 focus:outline-none"
        />
        <div className="mt-1 text-2xl font-bold text-white truncate">{result}</div>
      </div>

      <div className="p-3 bg-slate-50 grid grid-cols-5 gap-1.5">
        {buttons.map((btn, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => (btn.action ? btn.action() : appendToken(btn.val!))}
            className={`h-10 rounded-lg border border-slate-200 text-sm flex items-center justify-center hover:brightness-95 active:scale-95 transition-all ${btn.cls}`}
          >
            {btn.label === '⌫' ? <Delete className="w-4 h-4" /> : btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};
