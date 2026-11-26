import {
  ArrowDown,
  ArrowUp,
  CheckSquare,
  Copy,
  Eye,
  FileText,
  ListChecks,
  Plus,
  Sparkles,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import type { Passage, Question, QuestionType } from '../types/exam';
import { MathText } from './MathText';

interface QuestionEditorCardProps {
  question: Question;
  index: number;
  total: number;
  passages: Passage[];
  onChange: (updated: Question) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const TYPE_OPTIONS: { type: QuestionType; label: string; icon: React.ReactNode }[] = [
  {
    type: 'single_choice',
    label: 'Trắc nghiệm 1 đáp án',
    icon: <CheckSquare className="w-3.5 h-3.5" />,
  },
  {
    type: 'true_false',
    label: 'Đúng / Sai nhiều ý',
    icon: <ListChecks className="w-3.5 h-3.5" />,
  },
  {
    type: 'drag_drop',
    label: 'Kéo thả / Điền từ',
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
  {
    type: 'short_answer',
    label: 'Điền số / Trả lời ngắn',
    icon: <Type className="w-3.5 h-3.5" />,
  },
];

const SECTIONS = [
  'Tư duy Toán học',
  'Tư duy Đọc hiểu',
  'Tư duy Khoa học',
];

function extractBlankIds(prompt: string): string[] {
  const matches = prompt.match(/\[\[([a-zA-Z0-9_-]+)\]\]/g) ?? [];
  const unique: string[] = [];
  for (const m of matches) {
    const id = m.slice(2, -2);
    if (!unique.includes(id)) unique.push(id);
  }
  return unique;
}

export const QuestionEditorCard: React.FC<QuestionEditorCardProps> = ({
  question,
  index,
  total,
  passages,
  onChange,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}) => {
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [distractorText, setDistractorText] = useState(() => {
    const correctSet = new Set((question.blanks ?? []).map((b) => b.correctWord.trim()));
    return (question.wordBank ?? [])
      .filter((w) => !correctSet.has(w.trim()))
      .join(', ');
  });

  const handleTypeChange = (newType: QuestionType) => {
    if (newType === question.type) return;
    const base: Question = {
      ...question,
      type: newType,
    };

    if (newType === 'single_choice' && (!base.options || base.options.length === 0)) {
      base.options = [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' },
      ];
      base.correctOption = 'A';
    } else if (newType === 'true_false' && (!base.statements || base.statements.length === 0)) {
      base.statements = [
        { id: 's1', text: '', correct: true },
        { id: 's2', text: '', correct: false },
        { id: 's3', text: '', correct: true },
        { id: 's4', text: '', correct: false },
      ];
    } else if (newType === 'drag_drop') {
      base.blanks = base.blanks ?? [];
      base.wordBank = base.wordBank ?? [];
    } else if (newType === 'short_answer') {
      base.correctAnswers = base.correctAnswers ?? [''];
    }
    onChange(base);
  };

  const syncDragDropBlanks = (newPrompt: string, currentBlanks = question.blanks ?? [], distractorStr = distractorText) => {
    const ids = extractBlankIds(newPrompt);
    const nextBlanks = ids.map((id) => {
      const existing = currentBlanks.find((b) => b.id === id);
      return { id, correctWord: existing?.correctWord ?? '' };
    });
    const correctWords = nextBlanks.map((b) => b.correctWord.trim()).filter(Boolean);
    const distractors = distractorStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const wordBank = Array.from(new Set([...correctWords, ...distractors]));

    onChange({
      ...question,
      prompt: newPrompt,
      blanks: nextBlanks,
      wordBank,
    });
  };

  const handleInsertBlank = () => {
    const existingIds = extractBlankIds(question.prompt);
    let nextNum = existingIds.length + 1;
    while (existingIds.includes(`b${nextNum}`)) {
      nextNum += 1;
    }
    const token = `[[b${nextNum}]]`;

    const el = promptRef.current;
    if (el) {
      const start = el.selectionStart ?? question.prompt.length;
      const end = el.selectionEnd ?? question.prompt.length;
      const updated =
        question.prompt.slice(0, start) + token + question.prompt.slice(end);
      syncDragDropBlanks(updated);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      }, 0);
    } else {
      syncDragDropBlanks(`${question.prompt} ${token}`.trim());
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-slate-50/70 dark:bg-zinc-950/60 border-b border-slate-200/80 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-slate-900 dark:bg-zinc-100 px-2.5 py-1 text-xs font-mono font-semibold text-white dark:text-zinc-900">
            Câu {index + 1}
          </span>

          <select
            value={question.section}
            onChange={(e) => onChange({ ...question, section: e.target.value })}
            className="rounded-lg border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-zinc-200 focus:border-red-700 focus:outline-none"
          >
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {passages.length > 0 && (
            <select
              value={question.passageId ?? ''}
              onChange={(e) =>
                onChange({
                  ...question,
                  passageId: e.target.value || undefined,
                })
              }
              className="rounded-lg border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-zinc-300 max-w-[200px] focus:border-red-700 focus:outline-none"
              title="Gắn ngữ liệu đọc hiểu / khoa học"
            >
              <option value="">Không gắn ngữ liệu</option>
              {passages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id}: {p.title || '(Chưa đặt tên)'}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            className="rounded-md p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 disabled:opacity-30"
            title="Di chuyển lên"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={onMoveDown}
            className="rounded-md p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 disabled:opacity-30"
            title="Di chuyển xuống"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="rounded-md p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800"
            title="Nhân bản câu hỏi"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-1.5 text-slate-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
            title="Xóa câu hỏi"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Question Type Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TYPE_OPTIONS.map((opt) => {
            const active = question.type === opt.type;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => handleTypeChange(opt.type)}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-all ${
                  active
                    ? 'border-red-700 bg-red-50/70 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                    : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
              >
                {opt.icon}
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Prompt Input + Live KaTeX Preview */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Nội dung câu hỏi (hỗ trợ KaTeX: <code>$...$</code> hoặc <code>$$...$$</code>)
            </label>
            <div className="flex items-center gap-2">
              {question.type === 'drag_drop' && (
                <button
                  type="button"
                  onClick={handleInsertBlank}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-900 dark:bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Chèn ô trống [[b{extractBlankIds(question.prompt).length + 1}]]
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                  showPreview
                    ? 'border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200'
                    : 'border-slate-200/80 dark:border-zinc-800 text-slate-500'
                }`}
              >
                <Eye className="w-3 h-3" />
                Xem trước KaTeX
              </button>
            </div>
          </div>

          <textarea
            ref={promptRef}
            rows={3}
            value={question.prompt}
            onChange={(e) => {
              if (question.type === 'drag_drop') {
                syncDragDropBlanks(e.target.value);
              } else {
                onChange({ ...question, prompt: e.target.value });
              }
            }}
            placeholder="Nhập đề bài... VD: Cho hàm số $f(x) = x^2 - 4x + 3$. Tìm giá trị nhỏ nhất..."
            className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-[#FAFAFA] dark:bg-zinc-950 p-3 text-sm text-slate-900 dark:text-zinc-100 focus:border-red-700 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none"
          />

          {showPreview && question.prompt.trim() && (
            <div className="rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60 px-3.5 py-2.5 text-sm text-slate-800 dark:text-zinc-200">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">
                Live Preview
              </div>
              <MathText text={question.prompt} />
            </div>
          )}
        </div>

        {/* 1. Single Choice Fields */}
        {question.type === 'single_choice' && (
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Các lựa chọn (tích chọn đáp án đúng)
            </label>
            {(question.options ?? []).map((opt, idx) => {
              const isCorrect = question.correctOption === opt.id;
              return (
                <div key={opt.id} className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onChange({ ...question, correctOption: opt.id })}
                    className={`w-8 h-8 rounded-lg border text-xs font-mono font-bold shrink-0 transition-colors ${
                      isCorrect
                        ? 'bg-red-700 text-white border-red-700'
                        : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-slate-400'
                    }`}
                    title="Chọn làm đáp án đúng"
                  >
                    {opt.id}
                  </button>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => {
                      const nextOpts = [...(question.options ?? [])];
                      nextOpts[idx] = { ...opt, text: e.target.value };
                      onChange({ ...question, options: nextOpts });
                    }}
                    placeholder={`Nội dung đáp án ${opt.id} (hỗ trợ $KaTeX$)...`}
                    className="flex-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-slate-900 dark:text-zinc-100 focus:border-red-700 focus:outline-none"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* 2. True / False Fields */}
        {question.type === 'true_false' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Danh sách mệnh đề Đúng / Sai
              </label>
              <button
                type="button"
                onClick={() => {
                  const stmts = question.statements ?? [];
                  const nextId = `s${stmts.length + 1}_${Date.now().toString(36).slice(-3)}`;
                  onChange({
                    ...question,
                    statements: [...stmts, { id: nextId, text: '', correct: true }],
                  });
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm mệnh đề
              </button>
            </div>

            <div className="space-y-2">
              {(question.statements ?? []).map((stmt, idx) => (
                <div key={stmt.id} className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-400 w-5">
                    {String.fromCharCode(97 + idx)})
                  </span>
                  <input
                    type="text"
                    value={stmt.text}
                    onChange={(e) => {
                      const next = [...(question.statements ?? [])];
                      next[idx] = { ...stmt, text: e.target.value };
                      onChange({ ...question, statements: next });
                    }}
                    placeholder={`Nội dung mệnh đề ${String.fromCharCode(97 + idx)}...`}
                    className="flex-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-1.5 text-sm text-slate-900 dark:text-zinc-100 focus:border-red-700 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...(question.statements ?? [])];
                      next[idx] = { ...stmt, correct: !stmt.correct };
                      onChange({ ...question, statements: next });
                    }}
                    className={`w-16 py-1.5 rounded-lg text-xs font-semibold border transition-colors shrink-0 ${
                      stmt.correct
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-red-700 text-white border-red-700'
                    }`}
                  >
                    {stmt.correct ? 'Đúng' : 'Sai'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = (question.statements ?? []).filter((_, i) => i !== idx);
                      onChange({ ...question, statements: next });
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600"
                    title="Xóa mệnh đề"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Drag & Drop Fields */}
        {question.type === 'drag_drop' && (
          <div className="space-y-3 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60 p-4">
            <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-red-700" />
              Đáp án cho từng ô trống
            </div>

            {(question.blanks ?? []).length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Chưa có ô trống nào. Hãy bấm nút <strong>+ Chèn ô trống</strong> ở trên để
                thêm chỗ trống vào đề bài.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(question.blanks ?? []).map((blank, idx) => (
                  <div key={blank.id} className="flex items-center gap-2">
                    <span className="rounded bg-slate-200 dark:bg-zinc-800 px-2 py-1 text-[11px] font-mono font-semibold text-slate-700 dark:text-zinc-300">
                      [[{blank.id}]]
                    </span>
                    <input
                      type="text"
                      value={blank.correctWord}
                      onChange={(e) => {
                        const nextBlanks = [...(question.blanks ?? [])];
                        nextBlanks[idx] = { ...blank, correctWord: e.target.value };
                        syncDragDropBlanks(question.prompt, nextBlanks, distractorText);
                      }}
                      placeholder="Từ/cụm từ đúng..."
                      className="flex-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 focus:border-red-700 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1">
                Các từ gây nhiễu (tùy chọn, cách nhau bởi dấu phẩy)
              </label>
              <input
                type="text"
                value={distractorText}
                onChange={(e) => {
                  setDistractorText(e.target.value);
                  syncDragDropBlanks(question.prompt, question.blanks ?? [], e.target.value);
                }}
                placeholder="VD: than chì, ăn mòn điện hóa"
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 focus:border-red-700 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* 4. Short Answer Fields */}
        {question.type === 'short_answer' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Đáp án đúng (nhiều đáp án cách nhau bởi dấu phẩy)
              </label>
              <input
                type="text"
                value={(question.correctAnswers ?? []).join(', ')}
                onChange={(e) => {
                  const arr = e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter((s, i, a) => s.length > 0 || (i === 0 && a.length === 1));
                  onChange({ ...question, correctAnswers: arr });
                }}
                placeholder="VD: 31 hoặc 0.6, 0,6"
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm font-mono text-slate-900 dark:text-zinc-100 focus:border-red-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Gợi ý ô nhập (placeholder)
              </label>
              <input
                type="text"
                value={question.placeholder ?? ''}
                onChange={(e) => onChange({ ...question, placeholder: e.target.value })}
                placeholder="VD: Nhập một số nguyên..."
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-slate-900 dark:text-zinc-100 focus:border-red-700 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Explanation + Live KaTeX Preview */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400">
            Lời giải chi tiết (tùy chọn, hỗ trợ KaTeX)
          </label>
          <textarea
            rows={2}
            value={question.explanation ?? ''}
            onChange={(e) => onChange({ ...question, explanation: e.target.value })}
            placeholder="Nhập hướng dẫn giải..."
            className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-[#FAFAFA] dark:bg-zinc-950 p-2.5 text-xs sm:text-sm text-slate-800 dark:text-zinc-200 focus:border-red-700 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none"
          />
          {showPreview && question.explanation?.trim() && (
            <div className="rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60 px-3 py-2 text-xs sm:text-sm text-slate-700 dark:text-zinc-300">
              <MathText text={question.explanation} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
