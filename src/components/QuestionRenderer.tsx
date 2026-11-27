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
        <div className="text-[#2a161b] dark:text-[#fff2f4] leading-relaxed font-medium">
          <MathText text={question.prompt} />
        </div>

        <div className="space-y-2.5">
          {(question.options ?? []).map((opt) => {
            const isSelected = selected === opt.id;
            const isCorrect = opt.id === question.correctOption;

            let cardStyle =
              'border-[var(--line)] bg-white/90 dark:bg-[#1d0f15]/80 hover:border-[#ef6c7e] dark:hover:border-[#ef6c7e]/60 hover:bg-[#fff5f6]/75 dark:hover:bg-[#2a141c]/80';
            if (readOnly) {
              if (isCorrect) {
                cardStyle =
                  'border-emerald-500/80 bg-emerald-50/75 dark:bg-emerald-950/35';
              } else if (isSelected && !isCorrect) {
                cardStyle = 'border-rose-500/80 bg-rose-50/75 dark:bg-rose-950/35';
              } else {
                cardStyle =
                  'border-[var(--line)] bg-[#fff9fa]/50 dark:bg-[#1b0d13]/40 opacity-75';
              }
            } else if (isSelected) {
              cardStyle =
                'border-crimson bg-[#ffeff1]/80 dark:bg-[#dc263e]/20 ring-1 ring-crimson/35 shadow-[0_10px_24px_-16px_rgba(220,38,62,0.4)]';
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={readOnly}
                onClick={() => onChange?.(opt.id)}
                className={`w-full text-left rounded-2xl border p-3.5 transition-all flex items-start gap-3 ${
                  readOnly ? '' : 'cursor-pointer'
                } ${cardStyle}`}
              >
                <span
                  className={`shrink-0 w-7 h-7 rounded-xl text-xs font-mono font-bold flex items-center justify-center border transition-colors ${
                    isSelected
                      ? 'bg-crimson text-white border-crimson'
                      : 'bg-[#fff5f6] dark:bg-[#2a141c] text-[#5e4249] dark:text-[#fbbac3] border-[var(--line)]'
                  }`}
                >
                  {opt.id}
                </span>
                <span className="flex-1 text-sm sm:text-[15px] text-[#2a161b] dark:text-[#fff2f4] pt-0.5 leading-relaxed">
                  <MathText text={opt.text} />
                </span>
                {readOnly && isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-1" />
                )}
                {readOnly && isSelected && !isCorrect && (
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-1" />
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
        <div className="text-[#2a161b] dark:text-[#fff2f4] leading-relaxed font-medium">
          <MathText text={question.prompt} />
        </div>

        <div className="rounded-2xl border border-[var(--line)] overflow-hidden bg-white/90 dark:bg-[#1d0f15]/80">
          <div className="grid grid-cols-[1fr_72px_72px] bg-[#fff5f6] dark:bg-[#241219] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#876870] dark:text-[#c49ba3] border-b border-[var(--line)]">
            <span>Mệnh đề</span>
            <span className="text-center">Đúng</span>
            <span className="text-center">Sai</span>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {(question.statements ?? []).map((stmt, idx) => {
              const chosen = userMap[stmt.id];
              const letter = String.fromCharCode(97 + idx);
              const isRowCorrect = readOnly && chosen === stmt.correct;

              return (
                <div
                  key={stmt.id}
                  className={`grid grid-cols-[1fr_72px_72px] items-center px-4 py-3 gap-2 ${
                    readOnly
                      ? isRowCorrect
                        ? 'bg-emerald-50/55 dark:bg-emerald-950/20'
                        : 'bg-rose-50/45 dark:bg-rose-950/20'
                      : 'hover:bg-[#fff5f6]/60 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="text-sm sm:text-[15px] text-[#2a161b] dark:text-[#fff2f4] pr-2 leading-relaxed">
                    <span className="font-mono font-semibold text-crimson dark:text-[#ef6c7e] mr-1.5">
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
                      className={`w-14 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        readOnly ? '' : 'cursor-pointer'
                      } ${
                        chosen === true
                          ? 'bg-crimson text-white border-crimson shadow-xs'
                          : 'bg-white dark:bg-[#190c11] text-[#5e4249] dark:text-[#ebc9cf] border-[var(--line)] hover:border-crimson/60'
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
                      className={`w-14 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        readOnly ? '' : 'cursor-pointer'
                      } ${
                        chosen === false
                          ? 'bg-wine dark:bg-[#dc263e]/40 text-white border-wine dark:border-[#ef6c7e] shadow-xs'
                          : 'bg-white dark:bg-[#190c11] text-[#5e4249] dark:text-[#ebc9cf] border-[var(--line)] hover:border-crimson/60'
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
        <div className="rounded-2xl bg-[#fff6f7]/85 dark:bg-[#1d0f15]/80 border border-[var(--line)] p-4 sm:p-5 text-[15px] leading-8 text-[#2a161b] dark:text-[#fff2f4]">
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
                className={`inline-flex items-center gap-1 mx-1 px-3 py-0.5 rounded-full border text-sm font-medium align-middle transition-all ${
                  readOnly
                    ? isCorrect
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                    : filledWord
                      ? 'border-crimson bg-[#ffeff1] dark:bg-[#dc263e]/25 text-[#b91c30] dark:text-[#fbbac3] cursor-pointer'
                      : selectedBankWord
                        ? 'border-dashed border-crimson bg-[#ffeff1]/60 dark:bg-[#dc263e]/15 text-crimson cursor-pointer'
                        : 'border-dashed border-[#ef6c7e] dark:border-[#ef6c7e]/45 bg-white dark:bg-[#190c11] text-[#876870] min-w-[96px] justify-center'
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
          <div className="rounded-2xl bg-white/90 dark:bg-[#1d0f15]/80 border border-[var(--line)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#876870] dark:text-[#c49ba3] mb-2.5">
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
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium border transition-all ${
                      isUsed
                        ? 'bg-[#fff5f6] dark:bg-[#190c11] text-[#876870]/60 border-[var(--line)] cursor-not-allowed line-through'
                        : isSelected
                          ? 'bg-crimson text-white border-crimson shadow-xs cursor-pointer'
                          : 'bg-[#fff6f7] dark:bg-[#2a141c] text-[#2a161b] dark:text-[#fff2f4] border-[var(--line)] hover:border-crimson/60 cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    <GripVertical className="w-3.5 h-3.5 opacity-45" />
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
      <div className="text-[#2a161b] dark:text-[#fff2f4] leading-relaxed font-medium">
        <MathText text={question.prompt} />
      </div>

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#876870] dark:text-[#c49ba3] mb-2">
          Đáp án của bạn
        </label>
        <input
          type="text"
          disabled={readOnly}
          value={textVal}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={question.placeholder || 'Nhập đáp án (số hoặc cụm từ ngắn)...'}
          className={`w-full max-w-md rounded-2xl border px-4 py-2.5 text-sm sm:text-base font-mono font-semibold focus:outline-none transition-all ${
            readOnly
              ? 'bg-[#fff6f7] dark:bg-[#241219] border-[var(--line)] text-[#5e4249] dark:text-[#ebc9cf]'
              : 'bg-white dark:bg-[#190c11] border-[var(--line)] text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:ring-2 focus:ring-crimson/15'
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
