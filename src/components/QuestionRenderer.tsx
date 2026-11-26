import { CheckCircle2, GripVertical, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import type { Question, UserAnswerValue } from '../types/exam';
import { MathText } from './MathText';

interface QuestionRendererProps {
  question: Question;
  answer: UserAnswerValue | undefined;
  onChange?: (value: UserAnswerValue) => void;
  readOnly?: boolean;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  answer,
  onChange,
  readOnly = false,
}) => {
  const [selectedBankWord, setSelectedBankWord] = useState<string | null>(null);

  // 1. Trắc nghiệm 1 đáp án
  if (question.type === 'single_choice') {
    const selected = typeof answer === 'string' ? answer : '';
    return (
      <div className="space-y-5">
        <div className="text-slate-900 dark:text-zinc-100 leading-relaxed font-medium">
          <MathText text={question.prompt} />
        </div>

        <div className="space-y-2.5">
          {(question.options ?? []).map((opt) => {
            const isSelected = selected === opt.id;
            const isCorrect = opt.id === question.correctOption;

            let cardStyle =
              'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50/70 dark:hover:bg-zinc-800/50';
            if (readOnly) {
              if (isCorrect) {
                cardStyle =
                  'border-emerald-500/80 bg-emerald-50/70 dark:bg-emerald-950/30';
              } else if (isSelected && !isCorrect) {
                cardStyle = 'border-red-500/80 bg-red-50/70 dark:bg-red-950/30';
              } else {
                cardStyle =
                  'border-slate-200/60 dark:border-zinc-800/60 bg-slate-50/40 dark:bg-zinc-900/40 opacity-75';
              }
            } else if (isSelected) {
              cardStyle =
                'border-red-700 dark:border-red-500 bg-red-50/50 dark:bg-red-950/30 ring-1 ring-red-700/30';
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={readOnly}
                onClick={() => onChange?.(opt.id)}
                className={`w-full text-left rounded-xl border p-3.5 transition-all flex items-start gap-3 ${cardStyle}`}
              >
                <span
                  className={`shrink-0 w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center border transition-colors ${
                    isSelected
                      ? 'bg-red-700 text-white border-red-700'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200/80 dark:border-zinc-700'
                  }`}
                >
                  {opt.id}
                </span>
                <span className="flex-1 text-sm sm:text-[15px] text-slate-800 dark:text-zinc-200 pt-0.5 leading-relaxed">
                  <MathText text={opt.text} />
                </span>
                {readOnly && isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-1" />
                )}
                {readOnly && isSelected && !isCorrect && (
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Đúng/Sai nhiều ý
  if (question.type === 'true_false') {
    const userMap =
      answer && typeof answer === 'object' ? (answer as Record<string, boolean | null>) : {};

    const toggleStatement = (stmtId: string, val: boolean) => {
      if (readOnly) return;
      onChange?.({
        ...userMap,
        [stmtId]: val,
      });
    };

    return (
      <div className="space-y-5">
        <div className="text-slate-900 dark:text-zinc-100 leading-relaxed font-medium">
          <MathText text={question.prompt} />
        </div>

        <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
          <div className="grid grid-cols-[1fr_68px_68px] bg-slate-50 dark:bg-zinc-800/70 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-200/80 dark:border-zinc-800">
            <span>Mệnh đề</span>
            <span className="text-center">Đúng</span>
            <span className="text-center">Sai</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {(question.statements ?? []).map((stmt, idx) => {
              const chosen = userMap[stmt.id];
              const letter = String.fromCharCode(97 + idx);
              const isRowCorrect = readOnly && chosen === stmt.correct;

              return (
                <div
                  key={stmt.id}
                  className={`grid grid-cols-[1fr_68px_68px] items-center px-4 py-3 gap-2 ${
                    readOnly
                      ? isRowCorrect
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'bg-red-50/40 dark:bg-red-950/20'
                      : 'hover:bg-slate-50/60 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="text-sm sm:text-[15px] text-slate-800 dark:text-zinc-200 pr-2 leading-relaxed">
                    <span className="font-mono font-semibold text-slate-400 dark:text-zinc-500 mr-1.5">
                      {letter})
                    </span>
                    <MathText text={stmt.text} />
                    {readOnly && (
                      <div className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        Đáp án: {stmt.correct ? 'Đúng' : 'Sai'}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => toggleStatement(stmt.id, true)}
                      className={`w-12 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        chosen === true
                          ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-slate-900 dark:border-zinc-100'
                          : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200/80 dark:border-zinc-700 hover:border-slate-400'
                      }`}
                    >
                      Đúng
                    </button>
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => toggleStatement(stmt.id, false)}
                      className={`w-12 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        chosen === false
                          ? 'bg-red-700 text-white border-red-700'
                          : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200/80 dark:border-zinc-700 hover:border-slate-400'
                      }`}
                    >
                      Sai
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 3. Kéo thả / Chọn từ điền chỗ trống
  if (question.type === 'drag_drop') {
    const userMap =
      answer && typeof answer === 'object' ? (answer as Record<string, string>) : {};
    const blanks = question.blanks ?? [];
    const wordBank = question.wordBank ?? [];

    const setBlankWord = (blankId: string, word: string) => {
      if (readOnly) return;
      const next = { ...userMap };
      for (const key of Object.keys(next)) {
        if (next[key] === word) {
          delete next[key];
        }
      }
      next[blankId] = word;
      onChange?.(next);
      setSelectedBankWord(null);
    };

    const clearBlank = (blankId: string) => {
      if (readOnly) return;
      const next = { ...userMap };
      delete next[blankId];
      onChange?.(next);
    };

    const parts = question.prompt.split(/(\[\[[a-zA-Z0-9_-]+\]\])/g);
    const usedWords = new Set(Object.values(userMap).filter(Boolean));

    return (
      <div className="space-y-5">
        <div className="rounded-xl bg-slate-50/70 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 p-4 sm:p-5 text-[15px] leading-8 text-slate-800 dark:text-zinc-200">
          {parts.map((part, idx) => {
            const match = part.match(/^\[\[([a-zA-Z0-9_-]+)\]\]$/);
            if (!match) {
              return <MathText key={idx} text={part} />;
            }
            const blankId = match[1];
            const blankDef = blanks.find((b) => b.id === blankId);
            const filledWord = userMap[blankId];
            const isCorrect =
              readOnly && blankDef && filledWord?.trim() === blankDef.correctWord.trim();

            return (
              <span
                key={idx}
                onDragOver={(e) => {
                  if (!readOnly) e.preventDefault();
                }}
                onDrop={(e) => {
                  if (readOnly) return;
                  e.preventDefault();
                  const word = e.dataTransfer.getData('text/plain');
                  if (word) setBlankWord(blankId, word);
                }}
                onClick={() => {
                  if (readOnly) return;
                  if (selectedBankWord) {
                    setBlankWord(blankId, selectedBankWord);
                  } else if (filledWord) {
                    clearBlank(blankId);
                  }
                }}
                title={
                  readOnly
                    ? undefined
                    : filledWord
                      ? 'Bấm để xóa từ đã chọn'
                      : 'Kéo từ vào đây hoặc chọn từ bên dưới rồi bấm vào ô này'
                }
                className={`inline-flex items-center gap-1 mx-1 px-3 py-0.5 rounded-lg border text-sm font-medium align-middle transition-all ${
                  readOnly
                    ? isCorrect
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : 'border-red-400 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                    : filledWord
                      ? 'border-red-700 dark:border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 cursor-pointer'
                      : selectedBankWord
                        ? 'border-dashed border-red-600 bg-red-50/50 dark:bg-red-950/20 text-red-700 cursor-pointer'
                        : 'border-dashed border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-400 min-w-[90px] justify-center'
                }`}
              >
                {filledWord || 'Chỗ trống'}
                {readOnly && !isCorrect && blankDef && (
                  <span className="ml-1 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                    ({blankDef.correctWord})
                  </span>
                )}
              </span>
            );
          })}
        </div>

        {!readOnly && (
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2.5">
              Ngân hàng từ (kéo thả hoặc bấm chọn)
            </p>
            <div className="flex flex-wrap gap-2">
              {wordBank.map((word) => {
                const isUsed = usedWords.has(word);
                const isSelected = selectedBankWord === word;
                return (
                  <button
                    key={word}
                    type="button"
                    draggable={!isUsed}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', word);
                    }}
                    onClick={() => {
                      if (isUsed) return;
                      setSelectedBankWord((prev) => (prev === word ? null : word));
                    }}
                    disabled={isUsed}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium border transition-all ${
                      isUsed
                        ? 'bg-slate-100 dark:bg-zinc-800/40 text-slate-400 dark:text-zinc-600 border-slate-200/60 dark:border-zinc-800 cursor-not-allowed line-through'
                        : isSelected
                          ? 'bg-red-700 text-white border-red-700'
                          : 'bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border-slate-200/80 dark:border-zinc-700 hover:border-slate-400 cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    <GripVertical className="w-3.5 h-3.5 opacity-40" />
                    {word}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. Điền số / Trả lời ngắn
  const textVal = typeof answer === 'string' ? answer : '';
  return (
    <div className="space-y-5">
      <div className="text-slate-900 dark:text-zinc-100 leading-relaxed font-medium">
        <MathText text={question.prompt} />
      </div>

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
          Đáp án của bạn
        </label>
        <input
          type="text"
          disabled={readOnly}
          value={textVal}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={question.placeholder || 'Nhập đáp án (số hoặc cụm từ ngắn)...'}
          className={`w-full max-w-md rounded-lg border px-4 py-2.5 text-sm sm:text-base font-mono font-semibold focus:outline-none transition-colors ${
            readOnly
              ? 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'
              : 'bg-white dark:bg-zinc-950 border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 focus:border-red-700 dark:focus:border-red-500'
          }`}
        />
        {readOnly && (
          <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Đáp án đúng: {(question.correctAnswers ?? []).join(' hoặc ')}
          </p>
        )}
      </div>
    </div>
  );
};
