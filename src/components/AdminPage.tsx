import {
  ArrowLeft,
  Check,
  Copy,
  Database,
  FileCode2,
  Lock,
  ShieldCheck,
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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-7 shadow-xl">
          <button
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay lại trang chủ
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Trang Quản trị TSA</h1>
              <p className="text-xs text-slate-500">
                Nhập mật khẩu quản trị để nạp đề thi mới
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                autoFocus
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-600/20"
              />
              {authError && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">{authError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Đăng nhập Quản trị
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-14">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-rose-700" />
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              Quản trị Kho đề Bốp Bốp TSA
            </h1>
          </div>

          <button
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Về trang chủ
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: JSON Input */}
        <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-rose-700" />
              Nạp đề thi mới từ JSON
            </h2>
            <button
              type="button"
              onClick={handleFillSample}
              className="text-xs font-semibold text-rose-700 hover:underline"
            >
              Điền JSON mẫu vào ô
            </button>
          </div>

          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={18}
            placeholder="Dán mã JSON đề thi tại đây..."
            className="w-full flex-1 rounded-xl border border-slate-300 bg-slate-50 p-3.5 font-mono text-xs text-slate-800 focus:border-rose-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-600/20"
          />

          {statusMsg && (
            <div
              className={`mt-4 rounded-xl p-3.5 text-xs font-medium border ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          <button
            type="button"
            onClick={handleUploadExam}
            disabled={submitting}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-700 px-5 py-3 text-sm font-bold text-white hover:bg-rose-800 disabled:opacity-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            {submitting ? 'Đang nạp lên Supabase...' : 'Nạp đề lên Supabase'}
          </button>
        </section>

        {/* Right: JSON Guide & Template */}
        <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-slate-700" />
              Hướng dẫn định dạng JSON chuẩn TSA
            </h2>
            <button
              type="button"
              onClick={handleCopySample}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Đã sao chép
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy JSON mẫu
                </>
              )}
            </button>
          </div>

          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
            <li>
              Hỗ trợ 4 loại <code>type</code>: <code>single_choice</code>,{' '}
              <code>true_false</code>, <code>drag_drop</code>, <code>short_answer</code>.
            </li>
            <li>
              Công thức toán KaTeX dùng <code>$...$</code> (inline) hoặc{' '}
              <code>$$...$$</code> (block). Lưu ý escape dấu <code>\</code> thành{' '}
              <code>\\</code> trong chuỗi JSON.
            </li>
            <li>
              Với câu <code>drag_drop</code>, đặt placeholder dạng <code>[[b1]]</code>{' '}
              trong <code>prompt</code> khớp với <code>id</code> trong mảng{' '}
              <code>blanks</code>.
            </li>
            <li>
              Nếu câu hỏi đi kèm đoạn văn/ngữ liệu bên trái, gán{' '}
              <code>passageId</code> trùng với <code>id</code> trong mảng{' '}
              <code>passages</code>.
            </li>
          </ul>

          <pre className="max-h-[420px] overflow-auto custom-scrollbar rounded-xl bg-slate-900 p-4 text-[11px] leading-relaxed text-slate-200 font-mono">
            {SAMPLE_JSON_TEMPLATE}
          </pre>
        </section>
      </main>
    </div>
  );
};
