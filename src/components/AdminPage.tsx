import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FileCode2,
  FileText,
  FolderOpen,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { deleteExam, fetchExams, upsertExam } from '../lib/examService';
import type { Exam, Passage, Question } from '../types/exam';
import { MathText } from './MathText';
import { QuestionEditorCard } from './QuestionEditorCard';

interface AdminPageProps {
  userEmail?: string | null;
  onBackHome: () => void;
  onExamCreated: () => void;
}

const ADMIN_SESSION_KEY = 'bopbop-admin-unlocked';
const ADMIN_EMAILS = (
  (import.meta.env.VITE_ADMIN_EMAILS as string | undefined) || ''
)
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const EXAM_SECTIONS = [
  'Tổng hợp',
  'Tư duy Toán học',
  'Tư duy Đọc hiểu',
  'Tư duy Khoa học',
];

function createEmptyQuestion(index: number): Question {
  return {
    id: `q_${Date.now().toString(36)}_${index}`,
    type: 'single_choice',
    section: 'Tư duy Toán học',
    prompt: '',
    options: [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' },
    ],
    correctOption: 'A',
    explanation: '',
    points: 1,
  };
}

function getJsonErrorDetails(raw: string, err: unknown): string {
  const msg = err instanceof Error ? err.message : 'Lỗi cú pháp JSON';
  const posMatch = msg.match(/position\s+(\d+)/i);
  if (posMatch) {
    const pos = Number(posMatch[1]);
    const before = raw.slice(0, pos);
    const line = before.split('\n').length;
    const col = pos - before.lastIndexOf('\n');
    return `Lỗi cú pháp JSON tại dòng ${line}, cột ${col}: ${msg}`;
  }
  return `Lỗi cú pháp JSON: ${msg}`;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  userEmail,
  onBackHome,
  onExamCreated,
}) => {
  const isEmailAdmin =
    Boolean(userEmail) && ADMIN_EMAILS.includes(userEmail!.trim().toLowerCase());

  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (isEmailAdmin) return true;
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  });
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (isEmailAdmin) {
      setUnlocked(true);
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    }
  }, [isEmailAdmin]);

  // Tabs: 'repo' (Kho đề) | 'editor' (Trình soạn thảo)
  const [activeTab, setActiveTab] = useState<'repo' | 'editor'>('repo');

  // Repo state
  const [repoExams, setRepoExams] = useState<Exam[]>([]);
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [fromFallback, setFromFallback] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Visual Editor state
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [section, setSection] = useState('Tổng hợp');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [questions, setQuestions] = useState<Question[]>([createEmptyQuestion(1)]);

  const [saving, setSaving] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Secondary JSON Import Modal
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const loadRepo = useCallback(async () => {
    setLoadingRepo(true);
    const res = await fetchExams();
    setRepoExams(res.exams);
    setFromFallback(res.fromFallback);
    setLoadingRepo(false);
  }, []);

  useEffect(() => {
    if (unlocked) {
      loadRepo();
    }
  }, [unlocked, loadRepo]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === '2009') {
      setUnlocked(true);
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      setAuthError('');
    } else {
      setAuthError('Mật khẩu quản trị không chính xác.');
    }
  };

  const resetEditorToNew = () => {
    setEditingId(undefined);
    setTitle('');
    setDescription('');
    setSection('Tổng hợp');
    setDurationMinutes(60);
    setPassages([]);
    setQuestions([createEmptyQuestion(1)]);
    setStatusBanner(null);
    setActiveTab('editor');
  };

  const handleEditExam = (exam: Exam) => {
    setEditingId(exam.is_sample ? undefined : exam.id);
    setTitle(exam.title);
    setDescription(exam.description);
    setSection(exam.section || 'Tổng hợp');
    setDurationMinutes(exam.duration_minutes || 60);
    setPassages(exam.passages ?? []);
    setQuestions(
      exam.questions.length > 0 ? exam.questions : [createEmptyQuestion(1)]
    );
    setStatusBanner(null);
    setActiveTab('editor');
  };

  const handleExportJson = (exam: Exam) => {
    const clean = {
      title: exam.title,
      description: exam.description,
      section: exam.section ?? 'Tổng hợp',
      duration_minutes: exam.duration_minutes,
      passages: exam.passages,
      questions: exam.questions,
    };
    const blob = new Blob([JSON.stringify(clean, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exam.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '') || 'tsa-exam'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteExam(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (res.ok) {
      await loadRepo();
      onExamCreated();
    } else {
      setStatusBanner({
        type: 'error',
        text: `Không thể xóa đề: ${res.errorMessage}`,
      });
    }
  };

  const handleAddPassage = () => {
    let idx = passages.length + 1;
    while (passages.some((p) => p.id === `p${idx}`)) {
      idx += 1;
    }
    setPassages((prev) => [
      ...prev,
      {
        id: `p${idx}`,
        section: 'Tư duy Đọc hiểu',
        title: `Ngữ liệu ${idx}`,
        content: '',
      },
    ]);
  };

  const handleSaveExam = async () => {
    setStatusBanner(null);
    if (!title.trim()) {
      setStatusBanner({ type: 'error', text: 'Vui lòng nhập Tên đề thi.' });
      return;
    }
    if (questions.length === 0) {
      setStatusBanner({
        type: 'error',
        text: 'Đề thi cần có ít nhất 1 câu hỏi.',
      });
      return;
    }

    setSaving(true);
    const res = await upsertExam({
      id: editingId,
      title: title.trim(),
      description: description.trim() || 'Đề luyện thi Đánh giá tư duy TSA HUST',
      section,
      duration_minutes: Math.max(5, Number(durationMinutes) || 60),
      passages,
      questions,
    });
    setSaving(false);

    if (res.ok) {
      setEditingId(res.id);
      setStatusBanner({
        type: 'success',
        text: `Đã lưu thành công đề "${title.trim()}" (${questions.length} câu hỏi) lên Supabase!`,
      });
      await loadRepo();
      onExamCreated();
    } else {
      setStatusBanner({
        type: 'error',
        text: `Không thể lưu lên Supabase: ${res.errorMessage}`,
      });
    }
  };

  const handleImportJsonToEditor = () => {
    setJsonError(null);
    if (!jsonInput.trim()) {
      setJsonError('Vui lòng dán nội dung JSON trước khi nhập.');
      return;
    }
    let parsed: Partial<Exam>;
    try {
      parsed = JSON.parse(jsonInput);
    } catch (err) {
      setJsonError(getJsonErrorDetails(jsonInput, err));
      return;
    }

    if (!parsed.title || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      setJsonError('JSON thiếu trường "title" hoặc mảng "questions" (ít nhất 1 câu).');
      return;
    }

    setTitle(parsed.title);
    setDescription(parsed.description ?? '');
    setSection(parsed.section ?? 'Tổng hợp');
    setDurationMinutes(Number(parsed.duration_minutes ?? 60));
    setPassages(Array.isArray(parsed.passages) ? parsed.passages : []);
    setQuestions(parsed.questions);
    setJsonModalOpen(false);
    setJsonInput('');
    setStatusBanner({
      type: 'success',
      text: `Đã nạp ${parsed.questions.length} câu hỏi từ JSON vào trình soạn thảo. Hãy kiểm tra và bấm "Lưu đề lên hệ thống".`,
    });
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
                Quản trị viên
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Nhập mật khẩu quản trị (hoặc dùng email Admin)
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu..."
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
              Mở khóa trang Quản trị
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-slate-200/80 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Shield className="w-4 h-4 text-red-700 dark:text-red-500 shrink-0" />
            <h1 className="text-sm sm:text-base font-bold truncate">
              Quản trị Bốp Bốp TSA
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex rounded-lg bg-slate-100 dark:bg-zinc-800 p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('repo')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  activeTab === 'repo'
                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Kho đề ({repoExams.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  activeTab === 'editor'
                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                {editingId ? 'Sửa đề' : 'Tạo đề mới'}
              </button>
            </div>

            <button
              onClick={onBackHome}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Trang chủ
            </button>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="sm:hidden grid grid-cols-2 border-t border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <button
            type="button"
            onClick={() => setActiveTab('repo')}
            className={`py-2.5 text-xs font-semibold border-b-2 ${
              activeTab === 'repo'
                ? 'border-red-700 text-red-700 dark:text-red-400'
                : 'border-transparent text-slate-500'
            }`}
          >
            Kho đề ({repoExams.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`py-2.5 text-xs font-semibold border-b-2 ${
              activeTab === 'editor'
                ? 'border-red-700 text-red-700 dark:text-red-400'
                : 'border-transparent text-slate-500'
            }`}
          >
            {editingId ? 'Sửa đề' : 'Tạo đề mới'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        {/* TAB 1: REPO MANAGER */}
        {activeTab === 'repo' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  Danh sách đề thi trên Supabase
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Quản lý, chỉnh sửa trực quan hoặc xuất bản sao lưu JSON.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadRepo}
                  disabled={loadingRepo}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingRepo ? 'animate-spin' : ''}`} />
                  Làm mới
                </button>
                <button
                  type="button"
                  onClick={resetEditorToNew}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 hover:bg-red-800 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tạo đề mới
                </button>
              </div>
            </div>

            {fromFallback && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/30 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
                Bảng <code>exams</code> trên Supabase đang trống — đang hiển thị đề mẫu mặc định. Bạn có thể bấm <strong>Sửa đề</strong> để tùy chỉnh và lưu thành đề mới trên Supabase.
              </div>
            )}

            <div className="space-y-3">
              {repoExams.map((exam) => (
                <div
                  key={exam.id}
                  className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-slate-200/80 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-zinc-300">
                        {exam.section || 'Tổng hợp'}
                      </span>
                      {exam.is_sample && (
                        <span className="rounded-md bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                          Đề mẫu
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-zinc-100 truncate">
                      {exam.title}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-zinc-400">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {exam.questions.length} câu hỏi
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {exam.duration_minutes} phút
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditExam(exam)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Sửa đề
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportJson(exam)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Xuất JSON
                    </button>
                    {!exam.is_sample && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(exam)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200/80 dark:border-red-900/70 bg-red-50/60 dark:bg-red-950/30 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: VISUAL EXAM BUILDER */}
        {activeTab === 'editor' && (
          <div className="space-y-6">
            {/* Top Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  {editingId ? 'Chỉnh sửa đề thi' : 'Soạn đề thi mới (Trực quan)'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Điền form trực quan, xem trước KaTeX trực tiếp và lưu thẳng lên Supabase.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setJsonError(null);
                    setJsonModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  Import từ JSON
                </button>

                <button
                  type="button"
                  onClick={handleSaveExam}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 hover:bg-red-800 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Đang lưu...' : 'Lưu đề lên hệ thống'}
                </button>
              </div>
            </div>

            {statusBanner && (
              <div
                className={`rounded-xl border p-3.5 text-xs sm:text-sm font-medium flex items-center gap-2.5 ${
                  statusBanner.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300'
                }`}
              >
                {statusBanner.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{statusBanner.text}</span>
              </div>
            )}

            {/* General Info Card */}
            <section className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                1. Thông tin chung
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Tên đề thi *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Đề thi thử TSA HUST #02 — Tư duy Toán học & Khoa học"
                    className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-sm font-medium text-slate-900 dark:text-zinc-100 focus:border-red-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Phân môn
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-sm text-slate-900 dark:text-zinc-100 focus:border-red-700 focus:outline-none"
                  >
                    {EXAM_SECTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Thời gian làm bài (phút)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-zinc-100 focus:border-red-700 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Mô tả ngắn
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả nội dung hoặc đối tượng đề thi..."
                    className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-2 text-sm text-slate-900 dark:text-zinc-100 focus:border-red-700 focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Passages Manager */}
            <section className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    2. Ngữ liệu / Đoạn văn (tùy chọn cho Đọc hiểu & Khoa học)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddPassage}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm đoạn văn / ngữ liệu
                </button>
              </div>

              {passages.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-zinc-500">
                  Chưa có ngữ liệu nào. Bấm "+ Thêm đoạn văn / ngữ liệu" nếu đề có bài Đọc hiểu hoặc Tư duy Khoa học.
                </p>
              ) : (
                <div className="space-y-4">
                  {passages.map((p, idx) => (
                    <div
                      key={p.id}
                      className="rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-zinc-950 p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                          <span className="rounded bg-slate-200 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-700 dark:text-zinc-300">
                            {p.id}
                          </span>
                          <input
                            type="text"
                            value={p.title}
                            onChange={(e) => {
                              const next = [...passages];
                              next[idx] = { ...p, title: e.target.value };
                              setPassages(next);
                            }}
                            placeholder="Tiêu đề ngữ liệu..."
                            className="flex-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-zinc-100 focus:border-red-700 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={p.section ?? 'Tư duy Đọc hiểu'}
                            onChange={(e) => {
                              const next = [...passages];
                              next[idx] = { ...p, section: e.target.value };
                              setPassages(next);
                            }}
                            className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs text-slate-700 dark:text-zinc-200"
                          >
                            <option value="Tư duy Đọc hiểu">Tư duy Đọc hiểu</option>
                            <option value="Tư duy Khoa học">Tư duy Khoa học</option>
                          </select>
                          <button
                            type="button"
                            onClick={() =>
                              setPassages((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1.5 text-slate-400 hover:text-red-600"
                            title="Xóa ngữ liệu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={4}
                        value={p.content}
                        onChange={(e) => {
                          const next = [...passages];
                          next[idx] = { ...p, content: e.target.value };
                          setPassages(next);
                        }}
                        placeholder="Nội dung đoạn văn / ngữ liệu (hỗ trợ KaTeX $...$ và $$...$$)..."
                        className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 text-xs sm:text-sm text-slate-800 dark:text-zinc-200 focus:border-red-700 focus:outline-none"
                      />

                      {p.content.trim() && (
                        <div className="rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            Xem trước KaTeX
                          </div>
                          <MathText text={p.content} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Questions Builder */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  3. Danh sách câu hỏi ({questions.length} câu)
                </h3>
              </div>

              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <QuestionEditorCard
                    key={q.id}
                    question={q}
                    index={idx}
                    total={questions.length}
                    passages={passages}
                    onChange={(updated) => {
                      const next = [...questions];
                      next[idx] = updated;
                      setQuestions(next);
                    }}
                    onMoveUp={() => {
                      if (idx === 0) return;
                      const next = [...questions];
                      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                      setQuestions(next);
                    }}
                    onMoveDown={() => {
                      if (idx === questions.length - 1) return;
                      const next = [...questions];
                      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                      setQuestions(next);
                    }}
                    onDuplicate={() => {
                      const copy: Question = {
                        ...JSON.parse(JSON.stringify(q)),
                        id: `q_${Date.now().toString(36)}_${questions.length + 1}`,
                      };
                      const next = [...questions];
                      next.splice(idx + 1, 0, copy);
                      setQuestions(next);
                    }}
                    onDelete={() => {
                      if (questions.length <= 1) return;
                      setQuestions((prev) => prev.filter((_, i) => i !== idx));
                    }}
                  />
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setQuestions((prev) => [...prev, createEmptyQuestion(prev.length + 1)])
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:border-red-700 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Thêm câu hỏi
                </button>

                <button
                  type="button"
                  onClick={handleSaveExam}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-700 hover:bg-red-800 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Đang lưu...' : 'Lưu đề lên hệ thống'}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-xl border border-slate-200/80 dark:border-zinc-800">
            <div className="flex items-center gap-2.5 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-700 dark:text-red-500 shrink-0" />
              <h3 className="text-base font-bold">Xác nhận xóa đề thi?</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Bạn có chắc chắn muốn xóa đề{' '}
              <span className="font-semibold text-slate-900 dark:text-zinc-100">
                "{deleteTarget.title}"
              </span>{' '}
              khỏi Supabase? Hành động này không thể hoàn tác.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-200/80 dark:border-zinc-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-700 hover:bg-red-800 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secondary JSON Import Modal */}
      {jsonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-red-700 dark:text-red-500" />
                <h3 className="text-sm font-bold">Import nhanh từ mã JSON</h3>
              </div>
              <button
                onClick={() => setJsonModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Dán mã JSON đề thi vào đây để nạp tự động vào trình soạn thảo trực quan.
              </p>
              <textarea
                rows={12}
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  if (jsonError) setJsonError(null);
                }}
                placeholder='{"title": "...", "duration_minutes": 60, "questions": [...]}'
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-[#FAFAFA] dark:bg-zinc-950 p-3 font-mono text-xs text-slate-800 dark:text-zinc-200 focus:border-red-700 focus:outline-none"
              />
              {jsonError && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300">
                  {jsonError}
                </div>
              )}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setJsonModalOpen(false)}
                  className="rounded-lg border border-slate-200/80 dark:border-zinc-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleImportJsonToEditor}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 hover:bg-red-800 px-4 py-2 text-xs font-semibold text-white"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Nạp vào trình soạn thảo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
