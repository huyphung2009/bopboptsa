import {
  ArrowLeft,
  Check,
  Copy,
  Database,
  FileCode2,
  Lock,
  Shield,
  Upload,
} from 'lucide-react';
import React, { useState } from 'react';
import { createExam } from '../lib/examService';
import type { Exam } from '../types/exam';

interface AdminPageProps {
  onBackHome: () => void;
  onExamCreated: () => void;
}

const SAMPLE_JSON_TEMPLATE = JSON.stringify(
  {
    title: 'Đề luyện tập TSA Toán học & Khoa học #02',
    description: 'Đề thi thử gồm 4 dạng câu hỏi TSA chuẩn HUST.',
    section: 'Tổng hợp',
    duration_minutes: 45,
    passages: [
      {
        id: 'p1',
        section: 'Tư duy Đọc hiểu',
        title: 'Ngữ liệu mẫu',
        content: 'Nội dung đoạn văn hỗ trợ công thức toán $E = mc^2$.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'single_choice',
        section: 'Tư duy Toán học',
        prompt: 'Nghiệm của phương trình $2x - 6 = 0$ là:',
        options: [
          { id: 'A', text: '$x = 2$' },
          { id: 'B', text: '$x = 3$' },
          { id: 'C', text: '$x = 4$' },
          { id: 'D', text: '$x = 6$' },
        ],
        correctOption: 'B',
        explanation: '$2x = 6 \\Rightarrow x = 3$.',
        points: 1,
      },
      {
        id: 'q2',
        type: 'true_false',
        section: 'Tư duy Toán học',
        prompt: 'Xét hàm số $f(x) = x^2$:',
        statements: [
          { id: 's1', text: '$f(2) = 4$', correct: true },
          { id: 's2', text: '$f(-1) = -1$', correct: false },
          { id: 's3', text: 'Đạo hàm $f\'(x) = 2x$', correct: true },
          { id: 's4', text: 'Hàm số nghịch biến trên $(0; +\\infty)$', correct: false },
        ],
        explanation: '$f(-1) = 1$ và hàm số đồng biến trên $(0; +\\infty)$.',
        points: 1,
      },
      {
        id: 'q3',
        type: 'drag_drop',
        section: 'Tư duy Đọc hiểu',
        passageId: 'p1',
        prompt: 'Theo thuyết tương đối, năng lượng [[b1]] tỉ lệ với [[b2]].',
        wordBank: ['E', 'khối lượng m', 'vận tốc âm thanh'],
        blanks: [
          { id: 'b1', correctWord: 'E' },
          { id: 'b2', correctWord: 'khối lượng m' },
        ],
        explanation: 'Công thức $E = mc^2$.',
        points: 1,
      },
      {
        id: 'q4',
        type: 'short_answer',
        section: 'Tư duy Khoa học',
        prompt: 'Tính giá trị của $\\sqrt{144}$.',
        correctAnswers: ['12'],
        placeholder: 'Nhập số nguyên...',
        explanation: '$12^2 = 144$.',
        points: 1,
      },
    ],
  },
  null,
  2
);

export const AdminPage: React.FC<AdminPageProps> = ({ onBackHome, onExamCreated }) => {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [jsonInput, setJsonInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === '2009') {
      setUnlocked(true);
      setAuthError('');
    } else {
      setAuthError('Mật khẩu quản trị không chính xác.');
    }
  };

  const handleCopySample = async () => {
    await navigator.clipboard.writeText(SAMPLE_JSON_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFillSample = () => {
    setJsonInput(SAMPLE_JSON_TEMPLATE);
    setStatusMsg(null);
  };

  const handleUploadExam = async () => {
    setStatusMsg(null);
    if (!jsonInput.trim()) {
      setStatusMsg({ type: 'error', text: 'Vui lòng dán mã JSON đề thi trước khi nạp.' });
      return;
    }

    let parsed: Partial<Exam>;
    try {
      parsed = JSON.parse(jsonInput);
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: `JSON không hợp lệ: ${err instanceof Error ? err.message : 'Lỗi cú pháp'}`,
      });
      return;
    }

    if (!parsed.title || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      setStatusMsg({
        type: 'error',
        text: 'JSON thiếu trường bắt buộc: "title" và mảng "questions" (ít nhất 1 câu hỏi).',
      });
      return;
    }

    setSubmitting(true);
    const res = await createExam({
      id: parsed.id,
      title: parsed.title,
      description: parsed.description ?? 'Đề luyện thi TSA HUST',
      section: parsed.section ?? 'Tổng hợp',
      duration_minutes: Number(parsed.duration_minutes ?? 60),
      passages: Array.isArray(parsed.passages) ? parsed.passages : [],
      questions: parsed.questions,
    });
    setSubmitting(false);

    if (res.ok) {
      setStatusMsg({
        type: 'success',
        text: `Đã nạp thành công đề "${parsed.title}" (${parsed.questions.length} câu hỏi) lên Supabase!`,
      });
      setJsonInput('');
      onExamCreated();
    } else {
      setStatusMsg({
        type: 'error',
        text: `Không thể lưu lên Supabase: ${res.errorMessage}`,
      });
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-6 shadow-xs">
          <button
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay lại
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Quản trị đề thi
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Nhập mật khẩu để tiếp tục
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu quản trị..."
                autoFocus
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-sm text-slate-900 dark:text-zinc-100 focus:border-red-700 focus:outline-none"
              />
              {authError && (
                <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                  {authError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-red-700 hover:bg-red-800 py-2 text-xs font-semibold text-white transition-colors"
            >
              Mở khóa
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 pb-14">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-slate-200/80 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-red-700 dark:text-red-500" />
            <h1 className="text-sm sm:text-base font-bold">Quản trị Kho đề TSA</h1>
          </div>

          <button
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Trang chủ
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Database className="w-4 h-4 text-red-700 dark:text-red-500" />
              Nạp đề thi từ JSON
            </h2>
            <button
              type="button"
              onClick={handleFillSample}
              className="text-xs font-medium text-red-700 dark:text-red-400 hover:underline"
            >
              Điền JSON mẫu
            </button>
          </div>

          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={18}
            placeholder="Dán mã JSON đề thi tại đây..."
            className="w-full flex-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-950 p-3.5 font-mono text-xs text-slate-800 dark:text-zinc-200 focus:border-red-700 focus:outline-none"
          />

          {statusMsg && (
            <div
              className={`mt-4 rounded-lg p-3 text-xs font-medium border ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          <button
            type="button"
            onClick={handleUploadExam}
            disabled={submitting}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 hover:bg-red-800 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            {submitting ? 'Đang nạp lên Supabase...' : 'Nạp đề lên Supabase'}
          </button>
        </section>

        <section className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-slate-500" />
              Định dạng JSON chuẩn TSA
            </h2>
            <button
              type="button"
              onClick={handleCopySample}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Đã sao chép
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy mẫu
                </>
              )}
            </button>
          </div>

          <ul className="text-xs text-slate-600 dark:text-zinc-400 space-y-1.5 list-disc pl-4 leading-relaxed">
            <li>
              4 loại <code>type</code>: <code>single_choice</code>,{' '}
              <code>true_false</code>, <code>drag_drop</code>, <code>short_answer</code>.
            </li>
            <li>
              KaTeX: dùng <code>$...$</code> hoặc <code>$$...$$</code> (escape{' '}
              <code>\</code> thành <code>\\</code> trong JSON).
            </li>
            <li>
              <code>drag_drop</code>: đặt placeholder <code>[[b1]]</code> trong{' '}
              <code>prompt</code> khớp với <code>blanks[].id</code>.
            </li>
            <li>
              Câu Đọc hiểu / Khoa học: gán <code>passageId</code> khớp với{' '}
              <code>passages[].id</code>.
            </li>
          </ul>

          <pre className="max-h-[420px] overflow-auto custom-scrollbar rounded-lg bg-zinc-950 border border-zinc-800 p-4 text-[11px] leading-relaxed text-zinc-300 font-mono">
            {SAMPLE_JSON_TEMPLATE}
          </pre>
        </section>
      </main>
    </div>
  );
};
