import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode2,
  FileText,
  FileUp,
  FolderOpen,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { deleteExam, fetchExams, upsertExam } from '../lib/examService';
import { extractExamFromPdf } from '../lib/pdfExamImporter';
import {
  addAppAdmin,
  fetchAppAdmins,
  removeAppAdmin,
  SUPER_ADMIN_EMAIL,
  type AppAdminRecord,
} from '../lib/profileService';
import type { Exam, ExamSection, Passage, Question } from '../types/exam';
import { getExamTypeMeta, normalizeExamType } from '../utils/examTypes';
import { CloudBackdrop } from './CloudBackdrop';
import { Logo } from './Logo';
import { MathText } from './MathText';
import { QuestionEditorCard } from './QuestionEditorCard';

interface AdminPageProps {
  userEmail?: string | null;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  onBackHome: () => void;
  onExamCreated: () => void;
}

const ADMIN_SESSION_KEY = 'bopbop-admin-unlocked';
const GEMINI_KEY_STORAGE = 'parabol-gemini-api-key';
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
  isAdmin = false,
  isSuperAdmin = false,
  onBackHome,
  onExamCreated,
}) => {
  const isEmailAdmin =
    isAdmin ||
    isSuperAdmin ||
    (Boolean(userEmail) && ADMIN_EMAILS.includes(userEmail!.trim().toLowerCase()));

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

  // Tabs: 'repo' (Kho đề) | 'editor' (Trình soạn thảo) | 'admins' (Super Admin)
  const [activeTab, setActiveTab] = useState<'repo' | 'editor' | 'admins'>('repo');

  // Super Admin state
  const [adminList, setAdminList] = useState<AppAdminRecord[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminMsg, setAdminMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

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
  const examType = 'TSA' as const;
  const [section, setSection] = useState('Tổng hợp');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [antiCheat, setAntiCheat] = useState(true);
  const [sections, setSections] = useState<ExamSection[]>([]);
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

  // AI PDF Importer state
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(GEMINI_KEY_STORAGE) ?? '';
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [extractingPdf, setExtractingPdf] = useState(false);

  const loadRepo = useCallback(async () => {
    setLoadingRepo(true);
    const res = await fetchExams();
    setRepoExams(res.exams);
    setFromFallback(res.fromFallback);
    setLoadingRepo(false);
  }, []);

  const loadAdmins = useCallback(async () => {
    if (!isSuperAdmin) return;
    setLoadingAdmins(true);
    const res = await fetchAppAdmins();
    setAdminList(res.admins);
    if (res.errorMessage) {
      setAdminMsg({ type: 'error', text: res.errorMessage });
    }
    setLoadingAdmins(false);
  }, [isSuperAdmin]);

  useEffect(() => {
    if (unlocked) {
      loadRepo();
      if (isSuperAdmin) {
        loadAdmins();
      }
    }
  }, [unlocked, isSuperAdmin, loadRepo, loadAdmins]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMsg(null);
    const res = await addAppAdmin(newAdminEmail, userEmail);
    if (res.ok) {
      setAdminMsg({
        type: 'success',
        text: `Đã cấp quyền Quản trị viên cho ${newAdminEmail.trim().toLowerCase()}.`,
      });
      setNewAdminEmail('');
      await loadAdmins();
    } else {
      setAdminMsg({ type: 'error', text: res.errorMessage ?? 'Không thể thêm QTV.' });
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    setAdminMsg(null);
    const res = await removeAppAdmin(email);
    if (res.ok) {
      setAdminMsg({ type: 'success', text: `Đã gỡ quyền Quản trị viên của ${email}.` });
      await loadAdmins();
    } else {
      setAdminMsg({ type: 'error', text: res.errorMessage ?? 'Không thể gỡ quyền.' });
    }
  };

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
    setAntiCheat(true);
    setSections([]);
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
    setAntiCheat(exam.anti_cheat !== false);
    setSections(exam.sections ?? []);
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
      exam_type: normalizeExamType(exam.exam_type),
      section: exam.section ?? 'Tổng hợp',
      duration_minutes: exam.duration_minutes,
      anti_cheat: exam.anti_cheat !== false,
      ...(exam.sections && exam.sections.length > 0 ? { sections: exam.sections } : {}),
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
    const totalSectionMinutes = sections.reduce(
      (sum, s) => sum + (Number(s.duration_minutes) || 0),
      0
    );
    const res = await upsertExam({
      id: editingId,
      title: title.trim(),
      description: description.trim() || 'Đề luyện thi trực tuyến Parabol',
      exam_type: examType,
      section,
      duration_minutes:
        sections.length > 0 && totalSectionMinutes > 0
          ? totalSectionMinutes
          : Math.max(5, Number(durationMinutes) || 60),
      anti_cheat: antiCheat,
      sections: sections.length > 0 ? sections : undefined,
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

  const handleExtractPdf = async () => {
    setStatusBanner(null);
    if (!pdfFile) {
      setStatusBanner({ type: 'error', text: 'Vui lòng chọn file PDF đề thi trước.' });
      return;
    }
    if (!geminiApiKey.trim()) {
      setStatusBanner({
        type: 'error',
        text: 'Vui lòng nhập Gemini API Key để AI bóc tách file PDF.',
      });
      return;
    }

    setExtractingPdf(true);
    try {
      const extracted = await extractExamFromPdf({
        file: pdfFile,
        apiKey: geminiApiKey,
        targetExamType: examType,
      });

      setTitle(extracted.title ?? '');
      setDescription(extracted.description ?? '');
      setSection(extracted.section ?? 'Tổng hợp');
      setDurationMinutes(Number(extracted.duration_minutes ?? 60));
      setSections(extracted.sections ?? []);
      setPassages(extracted.passages ?? []);
      setQuestions(
        extracted.questions && extracted.questions.length > 0
          ? extracted.questions
          : [createEmptyQuestion(1)]
      );

      setStatusBanner({
        type: 'success',
        text: `AI đã bóc tách thành công ${extracted.questions?.length ?? 0} câu hỏi và ${extracted.passages?.length ?? 0} ngữ liệu từ PDF! Hãy kiểm tra lại bên dưới và bấm "Lưu đề lên hệ thống".`,
      });
    } catch (err) {
      setStatusBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi bóc tách đề từ PDF.',
      });
    } finally {
      setExtractingPdf(false);
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
    setSections(Array.isArray(parsed.sections) ? parsed.sections : []);
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
      <div className="relative min-h-screen bg-white dark:bg-[#13090d] flex items-center justify-center p-4 overflow-hidden">
        <CloudBackdrop withBottomFade={false} subtle />
        <div className="relative glass-card w-full max-w-sm rounded-[26px] p-6">
          <button
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#876870] dark:text-[#c49ba3] hover:text-crimson mb-5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay lại
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-[#ffeff1] dark:bg-[#dc263e]/20 border border-[#dc263e]/25 text-crimson dark:text-[#fbbac3] flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[#2a161b] dark:text-white">
                Quản trị viên
              </h1>
              <p className="text-xs text-[#876870] dark:text-[#c49ba3]">
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
                className="w-full rounded-full border border-[var(--line)] bg-white dark:bg-[#190c11] px-4 py-2.5 text-sm text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:ring-2 focus:ring-crimson/15 focus:outline-none"
              />
              {authError && (
                <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                  {authError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-crimson w-full !py-2.5"
            >
              Mở khóa trang Quản trị
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff7f8] dark:bg-[#13090d] text-[#2a161b] dark:text-[#fff2f4] pb-20">
      {/* Frosted Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 dark:bg-[#190c11]/85 border-b border-[var(--line)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Logo className="w-6 h-6 shrink-0 text-[#2a161b] dark:text-[#fbbac3]" />
            <h1 className="text-sm sm:text-base font-semibold tracking-tight text-crimson truncate">
              Quản trị Parabol
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex rounded-full bg-[#ffeff1]/80 dark:bg-[#241219] border border-[var(--line)] p-1">
              <button
                type="button"
                onClick={() => setActiveTab('repo')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'repo'
                    ? 'bg-crimson text-white shadow-xs'
                    : 'text-[#5e4249] dark:text-[#ebc9cf] hover:text-crimson'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Kho đề ({repoExams.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-crimson text-white shadow-xs'
                    : 'text-[#5e4249] dark:text-[#ebc9cf] hover:text-crimson'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                {editingId ? 'Sửa đề' : 'Tạo đề mới'}
              </button>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('admins')}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'admins'
                      ? 'bg-crimson text-white shadow-xs'
                      : 'text-[#5e4249] dark:text-[#ebc9cf] hover:text-crimson'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Quản lý QTV
                </button>
              )}
            </div>

            <button
              onClick={onBackHome}
              className="btn btn-pill btn-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-crimson" />
              Trang chủ
            </button>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div
          className={`sm:hidden grid border-t border-[var(--line)] bg-white/90 dark:bg-[#190c11] ${
            isSuperAdmin ? 'grid-cols-3' : 'grid-cols-2'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('repo')}
            className={`py-2.5 text-xs font-semibold border-b-2 ${
              activeTab === 'repo'
                ? 'border-crimson text-crimson dark:text-[#fbbac3]'
                : 'border-transparent text-[#876870]'
            }`}
          >
            Kho đề ({repoExams.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`py-2.5 text-xs font-semibold border-b-2 ${
              activeTab === 'editor'
                ? 'border-crimson text-crimson dark:text-[#fbbac3]'
                : 'border-transparent text-[#876870]'
            }`}
          >
            {editingId ? 'Sửa đề' : 'Tạo đề mới'}
          </button>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('admins')}
              className={`py-2.5 text-xs font-semibold border-b-2 ${
                activeTab === 'admins'
                  ? 'border-crimson text-crimson dark:text-[#fbbac3]'
                  : 'border-transparent text-[#876870]'
              }`}
            >
              Quản lý QTV
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        {/* TAB 1: REPO MANAGER */}
        {activeTab === 'repo' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-[#2a161b] dark:text-white">
                  Danh sách đề thi trên Supabase
                </h2>
                <p className="text-xs text-[#876870] dark:text-[#c49ba3] mt-0.5">
                  Quản lý, chỉnh sửa trực quan hoặc xuất bản sao lưu JSON.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadRepo}
                  disabled={loadingRepo}
                  className="btn btn-pill btn-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-crimson ${loadingRepo ? 'animate-spin' : ''}`} />
                  Làm mới
                </button>
                <button
                  type="button"
                  onClick={resetEditorToNew}
                  className="btn btn-crimson btn-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tạo đề mới
                </button>
              </div>
            </div>

            {fromFallback && (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
                Bảng <code>exams</code> trên Supabase đang trống — đang hiển thị đề mẫu mặc định. Bạn có thể bấm <strong>Sửa đề</strong> để tùy chỉnh và lưu thành đề mới trên Supabase.
              </div>
            )}

            <div className="space-y-3">
              {repoExams.map((exam) => {
                const typeMeta = getExamTypeMeta(normalizeExamType(exam.exam_type));
                return (
                  <div
                    key={exam.id}
                    className="lift-card glass-card rounded-[22px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${typeMeta.badgeClass}`}
                        >
                          {typeMeta.shortLabel}
                        </span>
                        <span className="rounded-full border border-[var(--line)] bg-white/80 dark:bg-[#241219] px-2.5 py-0.5 text-[11px] font-medium text-[#5e4249] dark:text-[#ebc9cf]">
                          {exam.section || 'Tổng hợp'}
                        </span>
                        {exam.is_sample && (
                          <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                            Đề mẫu
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-medium text-[#2a161b] dark:text-white truncate">
                        {exam.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-[#876870] dark:text-[#c49ba3] font-mono">
                        <span className="inline-flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-crimson" />
                          {exam.questions.length} câu hỏi
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-crimson" />
                          {exam.duration_minutes} phút
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditExam(exam)}
                        className="btn btn-pill btn-sm"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-crimson" />
                        Sửa đề
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportJson(exam)}
                        className="btn btn-pill btn-sm"
                      >
                        <Download className="w-3.5 h-3.5 text-[#876870]" />
                        Xuất JSON
                      </button>
                      {!exam.is_sample && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(exam)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 dark:border-rose-900/70 bg-rose-50/80 dark:bg-rose-950/30 px-3.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: VISUAL EXAM BUILDER */}
        {activeTab === 'editor' && (
          <div className="space-y-6">
            {/* Top Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-[#2a161b] dark:text-white">
                  {editingId ? 'Chỉnh sửa đề thi' : 'Soạn đề thi mới (Trực quan)'}
                </h2>
                <p className="text-xs text-[#876870] dark:text-[#c49ba3] mt-0.5">
                  Điền form trực quan, xem trước LaTeX trực tiếp và lưu thẳng lên Supabase.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setJsonError(null);
                    setJsonModalOpen(true);
                  }}
                  className="btn btn-pill btn-sm"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-crimson" />
                  Import từ JSON
                </button>

                <button
                  type="button"
                  onClick={handleSaveExam}
                  disabled={saving}
                  className="btn btn-crimson btn-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? 'Đang lưu...' : 'Lưu đề lên hệ thống'}
                </button>
              </div>
            </div>

            {statusBanner && (
              <div
                className={`rounded-2xl border p-3.5 text-xs sm:text-sm font-medium flex items-center gap-2.5 ${
                  statusBanner.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
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

            {/* AI PDF-to-Exam Importer Card */}
            <section className="glass-card rounded-[24px] p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-crimson" />
                  <h3 className="text-sm font-semibold text-[#2a161b] dark:text-white">
                    Nhập nhanh từ file PDF đề thi (Gemini AI)
                  </h3>
                </div>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-crimson hover:underline transition-colors"
                >
                  Lấy Gemini API Key miễn phí
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Gemini API Key Input */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf] mb-1.5">
                    Gemini API Key (lưu tại trình duyệt)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#876870] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={geminiApiKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGeminiApiKey(val);
                        localStorage.setItem(GEMINI_KEY_STORAGE, val);
                      }}
                      placeholder="AIzaSy..."
                      className="w-full rounded-full border border-[var(--line)] bg-white dark:bg-[#190c11] pl-10 pr-10 py-2 text-xs sm:text-sm font-mono text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#876870] hover:text-crimson cursor-pointer"
                      aria-label={showApiKey ? 'Ẩn API Key' : 'Hiện API Key'}
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Target Exam Type */}
                <div>
                  <label className="block text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf] mb-1.5">
                    Kỳ thi mục tiêu
                  </label>
                  <div className="w-full rounded-full border border-[#dc263e]/30 bg-[#ffeff1]/80 dark:bg-[#dc263e]/20 px-4 py-2 text-xs sm:text-sm font-semibold text-[#b91c30] dark:text-[#fbbac3]">
                    TSA (Đánh giá tư duy Bách Khoa)
                  </div>
                </div>
              </div>

              {/* PDF Drag & Drop Zone */}
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingPdf(true);
                }}
                onDragLeave={() => setIsDraggingPdf(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingPdf(false);
                  const dropped = e.dataTransfer.files?.[0];
                  if (dropped) setPdfFile(dropped);
                }}
                className={`flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-dashed p-4 cursor-pointer transition-colors ${
                  isDraggingPdf
                    ? 'border-crimson bg-[#ffeff1]/75 dark:bg-[#dc263e]/20'
                    : 'border-[#ef6c7e]/70 dark:border-[#ef6c7e]/35 bg-[#fff6f7]/80 dark:bg-[#190c11]/70 hover:border-crimson'
                }`}
              >
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const selected = e.target.files?.[0] ?? null;
                    setPdfFile(selected);
                  }}
                />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#241219] border border-[var(--line)] flex items-center justify-center shrink-0">
                    <FileUp className="w-4 h-4 text-crimson" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-[#2a161b] dark:text-[#fff2f4] truncate">
                      {pdfFile
                        ? `${pdfFile.name} (${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB)`
                        : 'Kéo thả hoặc bấm để chọn file đề thi (.pdf, tối đa 20MB)'}
                    </p>
                    <p className="text-[11px] text-[#876870] dark:text-[#b88c95]">
                      Hỗ trợ đề Toán, Lý, Hóa, Sinh, Đọc hiểu với công thức LaTeX và bảng đáp án
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    void handleExtractPdf();
                  }}
                  disabled={extractingPdf || !pdfFile}
                  className="btn btn-crimson btn-sm shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {extractingPdf ? 'Đang bóc tách...' : 'Bóc tách đề từ PDF'}
                </button>
              </label>

              {extractingPdf && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-[#5e4249] dark:text-[#ebc9cf]">
                    <span>AI đang đọc công thức &amp; bóc tách câu hỏi từ PDF...</span>
                    <span className="font-mono text-crimson dark:text-[#fbbac3]">
                      gemini-2.5-flash
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#ffeff1] dark:bg-[#241219] overflow-hidden">
                    <div className="h-full w-2/3 rounded-full bg-crimson animate-pulse" />
                  </div>
                </div>
              )}
            </section>

            {/* General Info Card */}
            <section className="glass-card rounded-[24px] p-5 sm:p-6 space-y-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-crimson">
                1. Thông tin chung
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf] mb-1.5">
                    Tên đề thi *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Đề thi thử TSA HUST #02 — Tư duy Toán học & Khoa học"
                    className="w-full rounded-2xl border border-[var(--line)] bg-white dark:bg-[#190c11] px-4 py-2 text-sm font-medium text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:ring-2 focus:ring-crimson/15 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf] mb-1.5">
                    Kỳ thi
                  </label>
                  <div className="w-full rounded-2xl border border-[#dc263e]/30 bg-[#ffeff1]/80 dark:bg-[#dc263e]/20 px-3.5 py-2 text-sm font-semibold text-[#b91c30] dark:text-[#fbbac3]">
                    TSA (Bách Khoa)
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf] mb-1.5">
                    Phân môn
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--line)] bg-white dark:bg-[#190c11] px-3.5 py-2 text-sm text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
                  >
                    {EXAM_SECTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf] mb-1.5">
                    Thời gian làm bài (phút)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full rounded-2xl border border-[var(--line)] bg-white dark:bg-[#190c11] px-3.5 py-2 text-sm font-mono text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf] mb-1.5">
                    Mô tả ngắn
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả nội dung hoặc đối tượng đề thi..."
                    className="w-full rounded-2xl border border-[var(--line)] bg-white dark:bg-[#190c11] px-4 py-2 text-sm text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
                  />
                </div>

                <div className="md:col-span-3 pt-1">
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[#fff6f7]/80 dark:bg-[#241219]/65 px-4 py-3 cursor-pointer">
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-[#2a161b] dark:text-[#fff2f4]">
                        Chế độ thi nghiêm túc (Chống chuyển tab, khóa copy &amp; bắt buộc toàn màn hình)
                      </div>
                      <div className="text-[11px] text-[#876870] dark:text-[#c49ba3] mt-0.5">
                        Kích hoạt giám sát 5 lớp và tự động nộp bài nếu vi phạm quá 3 lần.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={antiCheat}
                      onChange={(e) => setAntiCheat(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 rounded-full bg-[#ebc2c8] dark:bg-[#381823] peer-checked:bg-crimson relative transition-colors shrink-0 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
                  </label>
                </div>
              </div>
            </section>

            {/* Sections Manager */}
            <section className="glass-card rounded-[24px] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-crimson">
                    2. Cấu trúc Phần thi &amp; Thời gian riêng (tùy chọn cho đề tổng hợp)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    let idx = sections.length + 1;
                    while (sections.some((s) => s.id === `sec-${idx}`)) {
                      idx += 1;
                    }
                    setSections((prev) => [
                      ...prev,
                      {
                        id: `sec-${idx}`,
                        title: `Phần ${idx}`,
                        duration_minutes: 30,
                      },
                    ]);
                  }}
                  className="btn btn-pill btn-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-crimson" />
                  Thêm phần thi
                </button>
              </div>

              {sections.length === 0 ? (
                <p className="text-xs text-[#876870] dark:text-[#c49ba3]">
                  Chưa chia phần riêng. Nếu đề có nhiều phần với đồng hồ đếm ngược riêng (VD: Tư duy Toán học 60p, Đọc hiểu 30p, Khoa học 60p), hãy bấm &quot;+ Thêm phần thi&quot;.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--line)] bg-[#fff6f7]/80 dark:bg-[#241219]/65 p-3"
                    >
                      <span className="rounded-full bg-[#ffeff1] dark:bg-[#dc263e]/25 px-2.5 py-1 text-[11px] font-mono font-semibold text-crimson dark:text-[#fbbac3]">
                        {sec.id}
                      </span>
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => {
                          const next = [...sections];
                          next[idx] = { ...sec, title: e.target.value };
                          setSections(next);
                        }}
                        placeholder="Tên phần thi (VD: Phần 1: Tư duy Toán học)"
                        className="flex-1 min-w-[200px] rounded-xl border border-[var(--line)] bg-white dark:bg-[#190c11] px-3 py-1.5 text-xs sm:text-sm font-medium text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
                      />
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={240}
                          value={sec.duration_minutes}
                          onChange={(e) => {
                            const next = [...sections];
                            next[idx] = {
                              ...sec,
                              duration_minutes: Math.max(1, Number(e.target.value)),
                            };
                            setSections(next);
                          }}
                          className="w-20 rounded-xl border border-[var(--line)] bg-white dark:bg-[#190c11] px-2.5 py-1.5 text-xs sm:text-sm font-mono text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
                        />
                        <span className="text-xs text-[#876870]">phút</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSections((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-1.5 text-[#876870] hover:text-rose-600 cursor-pointer"
                        title="Xóa phần thi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Passages Manager */}
            <section className="glass-card rounded-[24px] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-crimson">
                    3. Ngữ liệu / Đoạn văn (tùy chọn cho Đọc hiểu &amp; Khoa học)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddPassage}
                  className="btn btn-pill btn-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-crimson" />
                  Thêm đoạn văn / ngữ liệu
                </button>
              </div>

              {passages.length === 0 ? (
                <p className="text-xs text-[#876870] dark:text-[#c49ba3]">
                  Chưa có ngữ liệu nào. Bấm &quot;+ Thêm đoạn văn / ngữ liệu&quot; nếu đề có bài Đọc hiểu hoặc Tư duy Khoa học.
                </p>
              ) : (
                <div className="space-y-4">
                  {passages.map((p, idx) => (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-[var(--line)] bg-[#fff6f7]/80 dark:bg-[#241219]/65 p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                          <span className="rounded-full bg-[#ffeff1] dark:bg-[#dc263e]/25 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-crimson dark:text-[#fbbac3]">
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
                            className="flex-1 rounded-xl border border-[var(--line)] bg-white dark:bg-[#190c11] px-3 py-1.5 text-xs sm:text-sm font-medium text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
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
                            className="rounded-xl border border-[var(--line)] bg-white dark:bg-[#190c11] px-2.5 py-1.5 text-xs text-[#2a161b] dark:text-[#fff2f4]"
                          >
                            <option value="Tư duy Đọc hiểu">Tư duy Đọc hiểu</option>
                            <option value="Tư duy Khoa học">Tư duy Khoa học</option>
                          </select>
                          <button
                            type="button"
                            onClick={() =>
                              setPassages((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1.5 text-[#876870] hover:text-rose-600 cursor-pointer"
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
                        placeholder="Nội dung đoạn văn / ngữ liệu (hỗ trợ LaTeX $...$ và $$...$$)..."
                        className="w-full rounded-2xl border border-[var(--line)] bg-white dark:bg-[#190c11] p-3 text-xs sm:text-sm text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
                      />

                      {p.content.trim() && (
                        <div className="rounded-2xl border border-[var(--line)] bg-white/90 dark:bg-[#190c11]/80 p-3.5 text-xs sm:text-sm text-[#5e4249] dark:text-[#ebc9cf] leading-relaxed">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-crimson mb-1 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            Xem trước LaTeX
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
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-crimson">
                  4. Danh sách câu hỏi ({questions.length} câu)
                </h3>
              </div>

              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <QuestionEditorCard
                    key={q.id}
                    question={q}
                    index={idx}
                    total={questions.length}
                    sections={sections}
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
                  className="btn btn-pill"
                >
                  <Plus className="w-4 h-4 text-crimson" />
                  Thêm câu hỏi
                </button>

                <button
                  type="button"
                  onClick={handleSaveExam}
                  disabled={saving}
                  className="btn btn-crimson"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Đang lưu...' : 'Lưu đề lên hệ thống'}
                </button>
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: SUPER ADMIN MANAGEMENT */}
        {activeTab === 'admins' && isSuperAdmin && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-medium text-[#2a161b] dark:text-white">
                Quản lý Quản trị viên (Super Admin)
              </h2>
              <p className="text-xs text-[#876870] dark:text-[#c49ba3] mt-0.5">
                Cấp hoặc gỡ quyền soạn/sửa đề thi cho Gmail cộng tác viên trên bảng{' '}
                <code>app_admins</code>.
              </p>
            </div>

            {/* Add Admin Form */}
            <form
              onSubmit={handleAddAdmin}
              className="glass-card rounded-[24px] p-5 space-y-3"
            >
              <label className="block text-xs font-semibold text-[#5e4249] dark:text-[#ebc9cf]">
                Thêm Quản trị viên mới bằng Gmail
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="nhapemail@gmail.com"
                  className="flex-1 rounded-full border border-[var(--line)] bg-white dark:bg-[#190c11] px-4 py-2 text-sm text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
                />
                <button
                  type="submit"
                  className="btn btn-crimson btn-sm shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  + Thêm QTV
                </button>
              </div>
              {adminMsg && (
                <div
                  className={`rounded-2xl border px-3.5 py-2 text-xs font-medium ${
                    adminMsg.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {adminMsg.text}
                </div>
              )}
            </form>

            {/* Current Admins Table */}
            <div className="glass-card rounded-[24px] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--line)] bg-[#fff6f7]/70 dark:bg-[#241219]/60">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#876870] dark:text-[#c49ba3]">
                  Danh sách QTV hiện tại
                </span>
                <button
                  type="button"
                  onClick={loadAdmins}
                  disabled={loadingAdmins}
                  className="inline-flex items-center gap-1 text-xs font-medium text-crimson hover:underline cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAdmins ? 'animate-spin' : ''}`} />
                  Làm mới
                </button>
              </div>

              <div className="divide-y divide-[var(--line)]">
                {/* Root Super Admin Row */}
                <div className="px-5 py-3.5 flex items-center justify-between gap-3 bg-[#ffeff1]/55 dark:bg-[#dc263e]/15">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#2a161b] dark:text-white truncate">
                        {SUPER_ADMIN_EMAIL}
                      </span>
                      <span className="rounded-full bg-crimson px-2.5 py-0.5 text-[10px] font-bold text-white">
                        Super Admin gốc
                      </span>
                    </div>
                    <p className="text-xs text-[#876870] dark:text-[#c49ba3] mt-0.5">
                      Toàn quyền hệ thống (không thể gỡ)
                    </p>
                  </div>
                </div>

                {adminList
                  .filter((a) => a.email.toLowerCase() !== SUPER_ADMIN_EMAIL)
                  .map((admin) => (
                    <div
                      key={admin.id ?? admin.email}
                      className="px-5 py-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#2a161b] dark:text-[#fff2f4] truncate">
                          {admin.email}
                        </div>
                        <div className="text-xs text-[#876870] dark:text-[#c49ba3] mt-0.5">
                          Cấp quyền:{' '}
                          {admin.created_at
                            ? new Date(admin.created_at).toLocaleDateString('vi-VN')
                            : 'Vừa thêm'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveAdmin(admin.email)}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 dark:border-rose-900/70 bg-rose-50/70 dark:bg-rose-950/30 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Gỡ quyền
                      </button>
                    </div>
                  ))}

                {adminList.filter((a) => a.email.toLowerCase() !== SUPER_ADMIN_EMAIL)
                  .length === 0 && (
                  <div className="px-5 py-6 text-center text-xs text-[#876870] dark:text-[#b88c95]">
                    Chưa có cộng tác viên nào được cấp quyền QTV.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#261118]/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[26px] bg-white/95 dark:bg-[#1b0d13]/95 backdrop-blur-2xl p-6 shadow-2xl border border-[var(--line)]">
            <div className="flex items-center gap-2.5 mb-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <h3 className="text-base font-semibold text-[#2a161b] dark:text-white">
                Xác nhận xóa đề thi?
              </h3>
            </div>
            <p className="text-sm text-[#5e4249] dark:text-[#ebc9cf] leading-relaxed">
              Bạn có chắc chắn muốn xóa đề{' '}
              <span className="font-semibold text-[#2a161b] dark:text-white">
                &quot;{deleteTarget.title}&quot;
              </span>{' '}
              khỏi Supabase? Hành động này không thể hoàn tác.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="btn btn-pill btn-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secondary JSON Import Modal */}
      {jsonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#261118]/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-[26px] bg-white/95 dark:bg-[#1b0d13]/95 backdrop-blur-2xl shadow-2xl border border-[var(--line)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)] bg-[#fff6f7]/70 dark:bg-[#241219]/60">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-crimson" />
                <h3 className="text-sm font-semibold text-[#2a161b] dark:text-white">
                  Import nhanh từ mã JSON
                </h3>
              </div>
              <button
                onClick={() => setJsonModalOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-full text-[#876870] hover:text-crimson hover:bg-[#ffeff1] dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-[#876870] dark:text-[#c49ba3]">
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
                className="w-full rounded-2xl border border-[var(--line)] bg-[#fff8f9] dark:bg-[#190c11] p-3.5 font-mono text-xs text-[#2a161b] dark:text-[#fff2f4] focus:border-crimson focus:outline-none"
              />
              {jsonError && (
                <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 px-3.5 py-2 text-xs font-medium text-rose-700 dark:text-rose-300">
                  {jsonError}
                </div>
              )}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setJsonModalOpen(false)}
                  className="btn btn-pill btn-sm"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleImportJsonToEditor}
                  className="btn btn-crimson btn-sm"
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
