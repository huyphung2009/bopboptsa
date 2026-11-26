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
      <div className="space-y-4">
        <div className="text-slate-900 text-[15px] leading-relaxed font-medium">
          <MathText text={question.prompt} />
        </div>

        <div className="space-y-2.5">
          {(question.options ?? []).map((opt) => {
            const isSelected = selected === opt.id;
            const isCorrect = opt.id === question.correctOption;

            let cardStyle =
              'border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50/30';
            if (readOnly) {
              if (isCorrect) {
                cardStyle = 'border-emerald-500 bg-emerald-50';
              } else if (isSelected && !isCorrect) {
                cardStyle = 'border-rose-500 bg-rose-50';
              } else {
                cardStyle = 'border-slate-200 bg-slate-50/50 opacity-80';
              }
            } else if (isSelected) {
              cardStyle = 'border-rose-600 bg-rose-50 ring-2 ring-rose-600/20';
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
                  className={`shrink-0 w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center border ${
                    isSelected
                      ? 'bg-rose-700 text-white border-rose-700'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {opt.id}
                </span>
                <span className="flex-1 text-sm text-slate-800 pt-0.5">
                  <MathText text={opt.text} />
                </span>
                {readOnly && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                {readOnly && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
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
      <div className="space-y-4">
        <div className="text-slate-900 text-[15px] leading-relaxed font-medium">
          <MathText text={question.prompt} />
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          <div className="grid grid-cols-[1fr_72px_72px] bg-slate-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
            <span>Mệnh đề</span>
            <span className="text-center">Đúng</span>
            <span className="text-center">Sai</span>
          </div>
          <div className="divide-y divide-slate-100">
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
                        ? 'bg-emerald-50/60'
                        : 'bg-rose-50/50'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm text-slate-800 pr-2">
                    <span className="font-bold text-slate-500 mr-1.5">{letter})</span>
                    <MathText text={stmt.text} />
                    {readOnly && (
                      <div className="mt-1 text-xs font-semibold">
                        Đáp án:{' '}
                        <span className="text-emerald-700">
                          {stmt.correct ? 'Đúng' : 'Sai'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => toggleStatement(stmt.id, true)}
                      className={`w-12 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        chosen === true
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
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
                      className={`w-12 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        chosen === false
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-rose-400'
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
      // If word is already in another blank, move it
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

    // Parse prompt with [[blankId]] placeholders
    const parts = question.prompt.split(/(\[\[[a-zA-Z0-9_-]+\]\])/g);
    const usedWords = new Set(Object.values(userMap).filter(Boolean));

    return (
      <div className="space-y-5">
        <div className="rounded-xl bg-white border border-slate-200 p-4 text-[15px] leading-8 text-slate-800">
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
                className={`inline-flex items-center gap-1 mx-1 px-3 py-0.5 rounded-lg border-2 border-dashed text-sm font-semibold align-middle transition-all ${
                  readOnly
                    ? isCorrect
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 border-solid'
                      : 'border-rose-400 bg-rose-50 text-rose-800 border-solid'
                    : filledWord
                      ? 'border-rose-500 bg-rose-50 text-rose-800 border-solid cursor-pointer hover:bg-rose-100'
                      : selectedBankWord
                        ? 'border-amber-500 bg-amber-50 text-amber-800 cursor-pointer animate-pulse'
                        : 'border-slate-300 bg-slate-50 text-slate-400 min-w-[96px] justify-center'
                }`}
              >
                {filledWord || `[Chỗ trống]`}
                {readOnly && !isCorrect && blankDef && (
                  <span className="ml-1 text-xs text-emerald-700 font-bold">
                    (Đúng: {blankDef.correctWord})
                  </span>
                )}
              </span>
            );
          })}
        </div>

        {!readOnly && (
          <div className="rounded-xl bg-slate-100 border border-slate-200 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Ngân hàng từ (Kéo thả vào ô trống hoặc bấm chọn từ rồi bấm ô trống):
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
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium border transition-all ${
                      isUsed
                        ? 'bg-slate-200/70 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                        : isSelected
                          ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                          : 'bg-white text-slate-800 border-slate-300 hover:border-rose-400 cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    <GripVertical className="w-3.5 h-3.5 opacity-50" />
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
    <div className="space-y-4">
      <div className="text-slate-900 text-[15px] leading-relaxed font-medium">
        <MathText text={question.prompt} />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Câu trả lời của bạn:
        </label>
        <input
          type="text"
          disabled={readOnly}
          value={textVal}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={question.placeholder || 'Nhập đáp án (số hoặc cụm từ ngắn)...'}
          className={`w-full max-w-md rounded-xl border px-4 py-3 text-base font-semibold focus:outline-none focus:ring-2 ${
            readOnly
              ? 'bg-slate-100 border-slate-300 text-slate-700'
              : 'bg-white border-slate-300 text-slate-900 focus:border-rose-600 focus:ring-rose-600/20'
          }`}
        />
        {readOnly && (
          <p className="mt-2 text-sm font-semibold text-emerald-700">
            Đáp án đúng: {(question.correctAnswers ?? []).join(' hoặc ')}
          </p>
        )}
      </div>
    </div>
  );
};
