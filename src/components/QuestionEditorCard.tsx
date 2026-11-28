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
import type { ExamSection, Passage, Question, QuestionType } from '../types/exam';
import { MathText } from './MathText';

interface QuestionEditorCardProps {
  question: Question;
  index: number;
  total: number;
  sections?: ExamSection[];
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
    type: 'multiple_choice_multi',
    label: 'Trắc nghiệm nhiều đáp án',
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
  sections = [],
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
    } else if (newType === 'multiple_choice_multi') {
      if (!base.options || base.options.length === 0) {
        base.options = [
          { id: 'A', text: '' },
          { id: 'B', text: '' },
          { id: 'C', text: '' },
          { id: 'D', text: '' },
        ];
      }
      base.correctAnswers =
        base.correctAnswers && base.correctAnswers.length > 0
          ? base.correctAnswers
          : base.correctOption
            ? [base.correctOption]
            : ['A'];
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

  const syncDragDropBlanks = (
    newPrompt: string,
    currentBlanks = question.blanks ?? [],
    distractorStr = distractorText
  ) => {
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
    <div className="glass-card rounded-[24px] overflow-hidden">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 bg-[#fff6f7]/80 dark:bg-[#241219]/70 border-b border-[var(--line)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-crimson px-3 py-1 text-xs font-mono font-semibold text-white">
            Câu {index + 1}
          </span>

          <select
            value={question.section}
            onChange={(e) => onChange({ ...question, section: e.target.value })}
            className="rounded-full border border-[var(--line)] bg-white dark:bg-[#190c11] px-3 py-1 text-xs font-medium text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
          >
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {sections.length > 0 && (
            <select
              value={question.sectionId ?? ''}
              onChange={(e) => {
                const secId = e.target.value || undefined;
                const matched = sections.find((s) => s.id === secId);
                onChange({
                  ...question,
                  sectionId: secId,
                  section: matched ? matched.title : question.section,
                });
              }}
              className="rounded-full border border-[#dc263e]/30 bg-[#ffeff1]/80 dark:bg-[#dc263e]/20 px-3 py-1 text-xs font-medium text-[#b91c30] dark:text-[#fbbac3] max-w-[190px] focus:border-crimson focus:outline-none"
              title="Thuộc phần thi"
            >
              <option value="">Chọn phần thi...</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          )}

          {passages.length > 0 && (
            <select
              value={question.passageId ?? ''}
              onChange={(e) =>
                onChange({
                  ...question,
                  passageId: e.target.value || undefined,
                })
              }
              className="rounded-full border border-[var(--line)] bg-white dark:bg-[#190c11] px-3 py-1 text-xs font-medium text-[#5e4249] dark:text-[#ebc9cf] max-w-[200px] focus:border-crimson focus:outline-none"
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
            className="rounded-full p-1.5 text-[#876870] hover:text-crimson hover:bg-[#ffeff1] dark:hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
            title="Di chuyển lên"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={onMoveDown}
            className="rounded-full p-1.5 text-[#876870] hover:text-crimson hover:bg-[#ffeff1] dark:hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
            title="Di chuyển xuống"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="rounded-full p-1.5 text-[#876870] hover:text-crimson hover:bg-[#ffeff1] dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Nhân bản câu hỏi"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full p-1.5 text-[#876870] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
                className={`flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'border-crimson bg-[#ffeff1] dark:bg-[#dc263e]/25 text-crimson dark:text-[#fbbac3] shadow-xs'
                    : 'border-[var(--line)] bg-white/85 dark:bg-[#1d0f15]/80 text-[#5e4249] dark:text-[#ebc9cf] hover:border-crimson/50'
                }`}
              >
                {opt.icon}
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Prompt Input + Live LaTeX Preview */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf]">
              Nội dung câu hỏi (hỗ trợ LaTeX: <code>$...$</code> hoặc <code>$$...$$</code>)
            </label>
            <div className="flex items-center gap-2">
              {question.type === 'drag_drop' && (
                <button
                  type="button"
                  onClick={handleInsertBlank}
                  className="btn btn-crimson !py-1 !px-3 !text-[11px]"
                >
                  <Plus className="w-3 h-3" />
                  Chèn ô trống [[b{extractBlankIds(question.prompt).length + 1}]]
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  showPreview
                    ? 'border-crimson/35 bg-[#ffeff1] dark:bg-[#dc263e]/20 text-crimson dark:text-[#fbbac3]'
                    : 'border-[var(--line)] text-[#876870]'
                }`}
              >
                <Eye className="w-3 h-3" />
                Xem trước LaTeX
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
            className="w-full rounded-2xl border border-[var(--line)] bg-[#fff8f9] dark:bg-[#190c11] p-3.5 text-sm text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:bg-white dark:focus:bg-[#1d0f15] focus:ring-2 focus:ring-crimson/15 focus:outline-none"
          />

          {showPreview && question.prompt.trim() && (
            <div className="rounded-2xl border border-[var(--line)] bg-[#fff6f7]/80 dark:bg-[#241219]/70 px-4 py-3 text-sm text-[#2a161b] dark:text-[#fff2f4]">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-crimson dark:text-[#ef6c7e] mb-1">
                Live Preview
              </div>
              <MathText text={question.prompt} />
            </div>
          )}
        </div>

        {/* 1. Single Choice Fields */}
        {question.type === 'single_choice' && (
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf]">
              Các lựa chọn (tích chọn đáp án đúng)
            </label>
            {(question.options ?? []).map((opt, idx) => {
              const isCorrect = question.correctOption === opt.id;
              return (
                <div key={opt.id} className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onChange({ ...question, correctOption: opt.id })}
                    className={`w-8 h-8 rounded-xl border text-xs font-mono font-bold shrink-0 transition-colors cursor-pointer ${
                      isCorrect
                        ? 'bg-crimson text-white border-crimson shadow-xs'
                        : 'bg-[#fff5f6] dark:bg-[#2a141c] text-[#5e4249] dark:text-[#fbbac3] border-[var(--line)] hover:border-crimson/50'
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
                    placeholder={`Nội dung đáp án ${opt.id} (hỗ trợ $LaTeX$)...`}
                    className="flex-1 rounded-xl border border-[var(--line)] bg-white dark:bg-[#190c11] px-3.5 py-2 text-sm text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:ring-2 focus:ring-crimson/15 focus:outline-none"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* 1b. Multiple Choice Multi (Checkbox) Fields */}
        {question.type === 'multiple_choice_multi' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf]">
                Các lựa chọn (bấm vào các ô A, B, C... để bật/tắt nhiều đáp án đúng)
              </label>
              <button
                type="button"
                onClick={() => {
                  const opts = question.options ?? [];
                  const nextChar = String.fromCharCode(65 + opts.length);
                  onChange({
                    ...question,
                    options: [...opts, { id: nextChar, text: '' }],
                  });
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-crimson dark:text-[#ef6c7e] hover:underline cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm phương án
              </button>
            </div>
            {(question.options ?? []).map((opt, idx) => {
              const correctList = question.correctAnswers ?? [];
              const isCorrect = correctList.includes(opt.id);
              return (
                <div key={opt.id} className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const nextCorrect = isCorrect
                        ? correctList.filter((id) => id !== opt.id)
                        : [...correctList, opt.id];
                      onChange({ ...question, correctAnswers: nextCorrect });
                    }}
                    className={`w-8 h-8 rounded-lg border text-xs font-mono font-bold shrink-0 transition-colors cursor-pointer flex items-center justify-center ${
                      isCorrect
                        ? 'bg-crimson text-white border-crimson shadow-xs'
                        : 'bg-[#fff5f6] dark:bg-[#2a141c] text-[#5e4249] dark:text-[#fbbac3] border-[var(--line)] hover:border-crimson/50'
                    }`}
                    title="Bật/tắt đáp án đúng"
                  >
                    {isCorrect ? `☑ ${opt.id}` : opt.id}
                  </button>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => {
                      const nextOpts = [...(question.options ?? [])];
                      nextOpts[idx] = { ...opt, text: e.target.value };
                      onChange({ ...question, options: nextOpts });
                    }}
                    placeholder={`Nội dung đáp án ${opt.id} (hỗ trợ $LaTeX$)...`}
                    className="flex-1 rounded-xl border border-[var(--line)] bg-white dark:bg-[#190c11] px-3.5 py-2 text-sm text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:ring-2 focus:ring-crimson/15 focus:outline-none"
                  />
                  {(question.options ?? []).length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const filtered = (question.options ?? []).filter(
                          (_, i) => i !== idx
                        );
                        onChange({
                          ...question,
                          options: filtered,
                          correctAnswers: correctList.filter((id) => id !== opt.id),
                        });
                      }}
                      className="p-2 text-[#876870] hover:text-rose-600 cursor-pointer"
                      title="Xóa phương án"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 2. True / False Fields */}
        {question.type === 'true_false' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf]">
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
                className="inline-flex items-center gap-1 text-xs font-semibold text-crimson dark:text-[#ef6c7e] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm mệnh đề
              </button>
            </div>

            <div className="space-y-2">
              {(question.statements ?? []).map((stmt, idx) => (
                <div key={stmt.id} className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-crimson w-5">
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
                    className="flex-1 rounded-xl border border-[var(--line)] bg-white dark:bg-[#190c11] px-3 py-1.5 text-sm text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...(question.statements ?? [])];
                      next[idx] = { ...stmt, correct: !stmt.correct };
                      onChange({ ...question, statements: next });
                    }}
                    className={`w-16 py-1.5 rounded-full text-xs font-semibold border transition-colors shrink-0 cursor-pointer ${
                      stmt.correct
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-rose-600 text-white border-rose-600'
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
                    className="p-1.5 text-[#876870] hover:text-rose-600 cursor-pointer"
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
          <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[#fff6f7]/80 dark:bg-[#241219]/65 p-4">
            <div className="text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-crimson" />
              Đáp án cho từng ô trống
            </div>

            {(question.blanks ?? []).length === 0 ? (
              <p className="text-xs text-[#876870] dark:text-[#c49ba3]">
                Chưa có ô trống nào. Hãy bấm nút <strong>+ Chèn ô trống</strong> ở trên để
                thêm chỗ trống vào đề bài.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(question.blanks ?? []).map((blank, idx) => (
                  <div key={blank.id} className="flex items-center gap-2">
                    <span className="rounded-full bg-[#ffeff1] dark:bg-[#dc263e]/25 px-2.5 py-1 text-[11px] font-mono font-semibold text-crimson dark:text-[#fbbac3]">
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
                      className="flex-1 rounded-xl border border-[var(--line)] bg-white dark:bg-[#190c11] px-3 py-1.5 text-xs sm:text-sm text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-[#876870] dark:text-[#c49ba3] mb-1">
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
                className="w-full rounded-xl border border-[var(--line)] bg-white dark:bg-[#190c11] px-3 py-1.5 text-xs sm:text-sm text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* 4. Short Answer Fields */}
        {question.type === 'short_answer' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf] mb-1">
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
                className="w-full rounded-xl border border-[var(--line)] bg-white dark:bg-[#190c11] px-3 py-2 text-sm font-mono text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf] mb-1">
                Gợi ý ô nhập (placeholder)
              </label>
              <input
                type="text"
                value={question.placeholder ?? ''}
                onChange={(e) => onChange({ ...question, placeholder: e.target.value })}
                placeholder="VD: Nhập một số nguyên..."
                className="w-full rounded-xl border border-[var(--line)] bg-white dark:bg-[#190c11] px-3 py-2 text-sm text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Explanation + Live LaTeX Preview */}
        <div className="space-y-2 pt-2 border-t border-[var(--line)]">
          <label className="block text-xs font-semibold text-[#876870] dark:text-[#c49ba3]">
            Lời giải chi tiết (tùy chọn, hỗ trợ LaTeX)
          </label>
          <textarea
            rows={2}
            value={question.explanation ?? ''}
            onChange={(e) => onChange({ ...question, explanation: e.target.value })}
            placeholder="Nhập hướng dẫn giải..."
            className="w-full rounded-2xl border border-[var(--line)] bg-[#fff8f9] dark:bg-[#190c11] p-3 text-xs sm:text-sm text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:bg-white dark:focus:bg-[#1d0f15] focus:outline-none"
          />
          {showPreview && question.explanation?.trim() && (
            <div className="rounded-2xl border border-[var(--line)] bg-[#fff6f7]/80 dark:bg-[#241219]/70 px-3.5 py-2.5 text-xs sm:text-sm text-[#5e4249] dark:text-[#ebc9cf]">
              <MathText text={question.explanation} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
