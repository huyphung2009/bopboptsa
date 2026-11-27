import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Flag,
  HelpCircle,
  LogOut,
  Maximize2,
  PenLine,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Exam, UserAnswers, UserAnswerValue } from '../types/exam';
import {
  isFullScreenMathOrStandalone,
  resolveExamSections,
} from '../utils/examSections';
import { formatDuration, gradeQuestion, isQuestionAnswered } from '../utils/scoring';
import { CalculatorModal } from './CalculatorModal';
import { CloudBackdrop } from './CloudBackdrop';
import { MathText } from './MathText';
import { PacingBarTimer } from './PacingBarTimer';
import { QuestionRenderer } from './QuestionRenderer';
import { ScratchpadModal } from './ScratchpadModal';

interface ExamRoomProps {
  exam: Exam;
  studentName: string;
  targetSectionId?: string;
  mode?: 'exam' | 'practice';
  onSubmit: (
    answers: UserAnswers,
    timeSpentSeconds: number,
    targetSectionId?: string,
    proctoring?: { violationCount: number; isFlagged: boolean }
  ) => void;
  onExit: () => void;
}

interface SavedExamSnapshot {
  answers: UserAnswers;
  flagged: Record<string, boolean>;
  remainingSeconds: number;
  elapsedSeconds: number;
  activeSectionIdx: number;
  accumulatedSeconds: number;
  currentIndex: number;
}

function readSavedSnapshot(key: string): SavedExamSnapshot | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedExamSnapshot>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      answers: parsed.answers ?? {},
      flagged: parsed.flagged ?? {},
      remainingSeconds: Number(parsed.remainingSeconds ?? 0),
      elapsedSeconds: Number(parsed.elapsedSeconds ?? 0),
      activeSectionIdx: Number(parsed.activeSectionIdx ?? 0),
      accumulatedSeconds: Number(parsed.accumulatedSeconds ?? 0),
      currentIndex: Number(parsed.currentIndex ?? 0),
    };
  } catch {
    return null;
  }
}

const QUESTION_TYPE_LABEL: Record<string, string> = {
  single_choice: 'Trắc nghiệm 1 đáp án',
  true_false: 'Đúng / Sai nhiều ý',
  drag_drop: 'Kéo thả / Điền từ',
  short_answer: 'Điền số / Trả lời ngắn',
};

export const ExamRoom: React.FC<ExamRoomProps> = ({
  exam,
  studentName,
  targetSectionId,
  mode = 'exam',
  onSubmit,
  onExit,
}) => {
  const isPractice = mode === 'practice';
  const autosaveKey = `parabol_autosave_${exam.id}_${targetSectionId || 'full'}_${mode}`;
  const [initialSnapshot] = useState<SavedExamSnapshot | null>(() =>
    readSavedSnapshot(autosaveKey)
  );
  const [restoredNotice, setRestoredNotice] = useState<boolean>(() =>
    Boolean(initialSnapshot)
  );

  useEffect(() => {
    if (!restoredNotice) return;
    const t = window.setTimeout(() => setRestoredNotice(false), 3500);
    return () => window.clearTimeout(t);
  }, [restoredNotice]);

  const activeSections = useMemo(() => {
    const all = resolveExamSections(exam);
    if (targetSectionId) {
      const filtered = all.filter((s) => s.id === targetSectionId);
      return filtered.length > 0 ? filtered : all;
    }
    return all;
  }, [exam, targetSectionId]);

  const [activeSectionIdx, setActiveSectionIdx] = useState(() => {
    const idx = initialSnapshot?.activeSectionIdx ?? 0;
    return idx >= 0 && idx < activeSections.length ? idx : 0;
  });
  const currentSection = activeSections[activeSectionIdx];
  const isLastSection = activeSectionIdx >= activeSections.length - 1;
  const sectionQuestions = useMemo(
    () => currentSection?.questions ?? [],
    [currentSection]
  );
  const sectionTotalSeconds = Math.max(
    60,
    (currentSection?.duration_minutes ?? exam.duration_minutes) * 60
  );

  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    initialSnapshot && initialSnapshot.remainingSeconds > 0
      ? initialSnapshot.remainingSeconds
      : sectionTotalSeconds
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(
    () => initialSnapshot?.elapsedSeconds ?? 0
  );
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(
    () => initialSnapshot?.accumulatedSeconds ?? 0
  );
  const [intermissionSeconds, setIntermissionSeconds] = useState<number | null>(null);

  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = initialSnapshot?.currentIndex ?? 0;
    return idx >= 0 && idx < sectionQuestions.length ? idx : 0;
  });
  const [answers, setAnswers] = useState<UserAnswers>(
    () => initialSnapshot?.answers ?? {}
  );
  const [flagged, setFlagged] = useState<Record<string, boolean>>(
    () => initialSnapshot?.flagged ?? {}
  );
  const [navFilter, setNavFilter] = useState<'all' | 'unanswered' | 'flagged'>('all');
  const [practiceChecked, setPracticeChecked] = useState<Record<string, boolean>>({});
  const [showCalc, setShowCalc] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Anti-Cheat Proctoring state (disabled in Practice Mode)
  const antiCheatEnabled = exam.anti_cheat !== false && !isPractice;
  const [violationCount, setViolationCount] = useState(0);
  const [violationModal, setViolationModal] = useState<{
    reason: string;
    count: number;
    needsFullscreen: boolean;
  } | null>(null);
  const violationCountRef = useRef(0);
  const lastViolationAtRef = useRef(0);
  const answersRef = useRef(answers);
  const remainingRef = useRef(remainingSeconds);
  const accumulatedRef = useRef(accumulatedSeconds);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    remainingRef.current = remainingSeconds;
  }, [remainingSeconds]);

  useEffect(() => {
    accumulatedRef.current = accumulatedSeconds;
  }, [accumulatedSeconds]);

  // Resizable split-screen state
  const [leftWidthPct, setLeftWidthPct] = useState(48);
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement | null>(null);

  const currentQuestion = sectionQuestions[currentIndex];
  const currentPassage = useMemo(() => {
    if (!currentQuestion?.passageId) return null;
    return exam.passages.find((p) => p.id === currentQuestion.passageId) ?? null;
  }, [exam.passages, currentQuestion]);

  const showSplitScreen = !isFullScreenMathOrStandalone(
    currentQuestion,
    Boolean(currentPassage)
  );

  const advanceToNextSection = useCallback(() => {
    const nextIdx = activeSectionIdx + 1;
    const nextSec = activeSections[nextIdx];
    if (!nextSec) return;
    setIntermissionSeconds(null);
    setActiveSectionIdx(nextIdx);
    setCurrentIndex(0);
    setRemainingSeconds(Math.max(60, nextSec.duration_minutes * 60));
  }, [activeSectionIdx, activeSections]);

  const completeCurrentSection = useCallback(
    (timedOut = false) => {
      if (isSubmitting) return;
      const spentInSection = isPractice
        ? Math.max(1, elapsedSeconds)
        : timedOut
          ? sectionTotalSeconds
          : Math.max(1, sectionTotalSeconds - remainingSeconds);
      const nextTotalSpent = accumulatedSeconds + spentInSection;
      setAccumulatedSeconds(nextTotalSpent);
      setConfirmSubmitOpen(false);

      if (isLastSection) {
        setIsSubmitting(true);
        try {
          localStorage.removeItem(autosaveKey);
        } catch {
          // ignore storage errors
        }
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
        onSubmit(answers, nextTotalSpent, targetSectionId, {
          violationCount: violationCountRef.current,
          isFlagged: violationCountRef.current > 3,
        });
      } else {
        setIntermissionSeconds(5);
      }
    },
    [
      isSubmitting,
      isPractice,
      elapsedSeconds,
      sectionTotalSeconds,
      remainingSeconds,
      accumulatedSeconds,
      isLastSection,
      autosaveKey,
      onSubmit,
      answers,
      targetSectionId,
    ]
  );

  // Auto-save to localStorage
  useEffect(() => {
    if (isSubmitting) return;
    try {
      const payload: SavedExamSnapshot = {
        answers,
        flagged,
        remainingSeconds,
        elapsedSeconds,
        activeSectionIdx,
        accumulatedSeconds,
        currentIndex,
      };
      localStorage.setItem(autosaveKey, JSON.stringify(payload));
    } catch {
      // ignore storage quota errors
    }
  }, [
    autosaveKey,
    answers,
    flagged,
    remainingSeconds,
    elapsedSeconds,
    activeSectionIdx,
    accumulatedSeconds,
    currentIndex,
    isSubmitting,
  ]);

  // Section timer: countdown in Exam Mode, count-up in Practice Mode
  useEffect(() => {
    if (intermissionSeconds !== null || isSubmitting) return;
    const timer = window.setInterval(() => {
      if (isPractice) {
        setElapsedSeconds((prev) => prev + 1);
      } else {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            window.clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [intermissionSeconds, isSubmitting, activeSectionIdx, isPractice]);

  // Auto-submit / advance when section timer hits 0 (Exam Mode only)
  useEffect(() => {
    if (
      !isPractice &&
      remainingSeconds === 0 &&
      intermissionSeconds === null &&
      !isSubmitting
    ) {
      const t = window.setTimeout(() => completeCurrentSection(true), 0);
      return () => window.clearTimeout(t);
    }
  }, [isPractice, remainingSeconds, intermissionSeconds, isSubmitting, completeCurrentSection]);

  // 5-second intermission countdown
  useEffect(() => {
    if (intermissionSeconds === null) return;
    if (intermissionSeconds <= 0) {
      const t = window.setTimeout(() => advanceToNextSection(), 0);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      setIntermissionSeconds((s) => (s !== null ? s - 1 : null));
    }, 1000);
    return () => window.clearTimeout(t);
  }, [intermissionSeconds, advanceToNextSection]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (confirmSubmitOpen || intermissionSeconds !== null) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((i) => Math.min(sectionQuestions.length - 1, i + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sectionQuestions.length, confirmSubmitOpen, intermissionSeconds]);

  // Resizable divider pointer handlers
  useEffect(() => {
    if (!isDraggingDivider) return;

    const handlePointerMove = (e: PointerEvent) => {
      const container = splitContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const rawPct = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(68, Math.max(30, rawPct));
      setLeftWidthPct(clamped);
    };

    const handlePointerUp = () => {
      setIsDraggingDivider(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingDivider]);

  // 5-Layer Anti-Cheat Proctoring
  const requestFullscreenSafe = useCallback(() => {
    if (!antiCheatEnabled) return;
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, [antiCheatEnabled]);

  const recordViolation = useCallback(
    (reason: string, needsFullscreen = false) => {
      if (!antiCheatEnabled || isSubmitting || intermissionSeconds !== null) return;
      const now = Date.now();
      if (now - lastViolationAtRef.current < 1500) return;
      lastViolationAtRef.current = now;

      const nextCount = violationCountRef.current + 1;
      violationCountRef.current = nextCount;
      setViolationCount(nextCount);

      if (nextCount > 3) {
        setViolationModal(null);
        setIsSubmitting(true);
        try {
          localStorage.removeItem(autosaveKey);
        } catch {
          // ignore
        }
        const spent = Math.max(1, sectionTotalSeconds - remainingRef.current);
        const totalSpent = accumulatedRef.current + spent;
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
        onSubmit(answersRef.current, totalSpent, targetSectionId, {
          violationCount: nextCount,
          isFlagged: true,
        });
      } else {
        setViolationModal({
          reason,
          count: nextCount,
          needsFullscreen: needsFullscreen || !document.fullscreenElement,
        });
      }
    },
    [
      antiCheatEnabled,
      isSubmitting,
      intermissionSeconds,
      sectionTotalSeconds,
      onSubmit,
      targetSectionId,
    ]
  );

  // Layer 1: Fullscreen
  useEffect(() => {
    if (!antiCheatEnabled) return;
    requestFullscreenSafe();
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, [antiCheatEnabled, requestFullscreenSafe]);

  // Layer 1 & 2: Fullscreen exit, visibilitychange, window blur
  useEffect(() => {
    if (!antiCheatEnabled) return;

    const handleVisibility = () => {
      if (document.hidden) {
        recordViolation('Phát hiện rời khỏi tab phòng thi');
      }
    };

    const handleBlur = () => {
      recordViolation('Cửa sổ phòng thi mất tiêu điểm (chuyển sang ứng dụng/cửa sổ khác)');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !isSubmitting && intermissionSeconds === null) {
        recordViolation('Thoát chế độ toàn màn hình', true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [antiCheatEnabled, isSubmitting, intermissionSeconds, recordViolation]);

  // Layer 3: Lock contextmenu, copy/cut/selectstart, and DevTools/Copy shortcuts
  useEffect(() => {
    if (!antiCheatEnabled) return;

    const isEditableTarget = (target: EventTarget | null): boolean => {
      const el = target as HTMLElement | null;
      return Boolean(
        el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      );
    };

    const preventContext = (e: MouseEvent) => {
      if (!isEditableTarget(e.target)) {
        e.preventDefault();
      }
    };

    const preventCopyCutSelect = (e: Event) => {
      if (!isEditableTarget(e.target)) {
        e.preventDefault();
      }
    };

    const blockShortcuts = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      if (
        e.key === 'F12' ||
        (ctrlOrMeta && e.shiftKey && (key === 'I' || key === 'J')) ||
        (ctrlOrMeta && key === 'U') ||
        (ctrlOrMeta && key === 'C' && !isEditableTarget(e.target))
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', preventContext);
    document.addEventListener('copy', preventCopyCutSelect);
    document.addEventListener('cut', preventCopyCutSelect);
    document.addEventListener('selectstart', preventCopyCutSelect);
    window.addEventListener('keydown', blockShortcuts);

    return () => {
      document.removeEventListener('contextmenu', preventContext);
      document.removeEventListener('copy', preventCopyCutSelect);
      document.removeEventListener('cut', preventCopyCutSelect);
      document.removeEventListener('selectstart', preventCopyCutSelect);
      window.removeEventListener('keydown', blockShortcuts);
    };
  }, [antiCheatEnabled]);

  const handleAnswerChange = (qId: string, val: UserAnswerValue) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
    if (isPractice && currentQuestion?.type === 'single_choice') {
      setPracticeChecked((prev) => ({ ...prev, [qId]: true }));
    }
  };

  const toggleFlag = (qId: string) => {
    setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const answeredInSection = useMemo(() => {
    return sectionQuestions.filter((q) => isQuestionAnswered(q, answers[q.id])).length;
  }, [sectionQuestions, answers]);

  const isTimeLow = remainingSeconds <= 300;

  // Intermission Screen
  if (intermissionSeconds !== null) {
    const nextSec = activeSections[activeSectionIdx + 1];
    return (
      <div className="relative min-h-screen bg-white dark:bg-[#13090d] text-[#2a161b] dark:text-[#fff2f4] flex items-center justify-center p-4 overflow-hidden">
        <CloudBackdrop withBottomFade={false} subtle />
        <div className="relative glass-card w-full max-w-md rounded-[28px] p-8 text-center space-y-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#ffeff1] dark:bg-[#dc263e]/25 border border-[#dc263e]/35 text-2xl font-mono font-bold text-crimson dark:text-[#fbbac3] shadow-[0_12px_28px_-12px_rgba(220,38,62,0.42)]">
            {intermissionSeconds}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600 dark:text-teal-400">
              Đã hoàn thành {currentSection?.title}
            </p>
            <h2 className="text-lg font-semibold text-[#2a161b] dark:text-white">
              Chuẩn bị chuyển sang Phần {activeSectionIdx + 2}/{activeSections.length}
            </h2>
            {nextSec && (
              <p className="text-sm text-[#876870] dark:text-[#c49ba3]">
                <strong className="text-[#2a161b] dark:text-[#fff2f4]">
                  {nextSec.title}
                </strong>{' '}
                · {nextSec.questions.length} câu · {nextSec.duration_minutes} phút
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={advanceToNextSection}
            className="btn btn-crimson w-full !py-2.5"
          >
            Bắt đầu ngay
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-screen flex flex-col bg-[#fff7f8] dark:bg-[#13090d] text-[#2a161b] dark:text-[#fff2f4] overflow-hidden ${
        isDraggingDivider ? 'select-none cursor-col-resize' : ''
      }`}
    >
      {/* Frosted Topbar */}
      <header className="shrink-0 h-14 bg-white/85 dark:bg-[#190c11]/90 backdrop-blur-xl px-4 flex items-center justify-between border-b border-[var(--line)]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onExit}
            className="btn btn-pill btn-sm"
            title="Thoát phòng thi"
          >
            <LogOut className="w-3.5 h-3.5 text-[#5e4249] dark:text-[#fbbac3]" />
            <span className="hidden sm:inline">Thoát</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-semibold text-[#2a161b] dark:text-[#fff2f4] truncate">
              {activeSections.length > 1
                ? `Phần ${activeSectionIdx + 1}/${activeSections.length}: ${currentSection?.title}`
                : currentSection?.title || exam.title}
            </h1>
            <p className="text-[11px] text-[#876870] dark:text-[#c49ba3] truncate">
              {exam.title} · Thí sinh:{' '}
              <span className="font-medium text-crimson dark:text-[#fbbac3]">
                {studentName}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {restoredNotice && (
            <span className="hidden lg:inline-flex items-center gap-1 rounded-full border border-teal-300/60 dark:border-teal-800/70 bg-teal-50/90 dark:bg-teal-950/40 px-2.5 py-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300">
              Đã khôi phục bài làm
            </span>
          )}

          {isPractice && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-teal-300/60 dark:border-teal-800/70 bg-teal-50/80 dark:bg-teal-950/35 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
              <BookOpenCheck className="w-3.5 h-3.5" />
              Luyện tập
            </span>
          )}

          {antiCheatEnabled && (
            <div
              className={`hidden md:inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                violationCount === 0
                  ? 'border-teal-300/60 dark:border-teal-800/70 bg-teal-50/80 dark:bg-teal-950/35 text-teal-700 dark:text-teal-300'
                  : violationCount < 3
                    ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                    : 'border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400'
              }`}
              title="Trạng thái giám sát chống gian lận"
            >
              {violationCount === 0 ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5" />
              )}
              Giám sát: {violationCount}/3 vi phạm
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowScratchpad((v) => !v)}
            className={`btn btn-sm ${
              showScratchpad
                ? 'bg-[#ffeff1] dark:bg-[#dc263e]/25 border border-crimson/40 text-crimson dark:text-[#fbbac3]'
                : 'btn-pill'
            }`}
            title="Mở bảng nháp nhanh"
          >
            <PenLine className="w-3.5 h-3.5 text-crimson" />
            <span className="hidden sm:inline">Nháp</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCalc((v) => !v)}
            className={`btn btn-sm ${
              showCalc
                ? 'bg-[#ffeff1] dark:bg-[#dc263e]/25 border border-crimson/40 text-crimson dark:text-[#fbbac3]'
                : 'btn-pill'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-crimson" />
            <span className="hidden sm:inline">Máy tính</span>
          </button>

          {isPractice ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-300/60 dark:border-teal-800/70 bg-teal-50/80 dark:bg-teal-950/35 px-3 py-1.5 text-xs sm:text-sm font-mono font-semibold text-teal-700 dark:text-teal-300">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(elapsedSeconds)}
            </div>
          ) : (
            <PacingBarTimer
              answeredCount={answeredInSection}
              totalQuestions={sectionQuestions.length}
              remainingSeconds={remainingSeconds}
              totalSeconds={sectionTotalSeconds}
              isTimeLow={isTimeLow}
            />
          )}

          <button
            onClick={() => setConfirmSubmitOpen(true)}
            className="btn btn-crimson btn-sm"
          >
            <Send className="w-3.5 h-3.5" />
            {isLastSection ? 'Nộp bài' : 'Nộp phần này'}
          </button>
        </div>
      </header>

      {/* Main Content + Question Navigator */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Smart Workspace */}
        <div
          ref={splitContainerRef}
          className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden"
        >
          {/* Left Pane: Passage */}
          {showSplitScreen && currentPassage && (
            <>
              <section
                style={{ '--left-w': `${leftWidthPct}%` } as React.CSSProperties}
                className="w-full md:w-[var(--left-w)] h-1/2 md:h-full shrink-0 bg-white/90 dark:bg-[#1b0d13]/90 border-b md:border-b-0 border-[var(--line)] overflow-y-auto custom-scrollbar p-6 sm:p-8"
              >
                <div className="max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#dc263e]/25 bg-[#ffeff1]/85 dark:bg-[#dc263e]/20 px-3 py-1 text-[11px] font-medium text-[#b91c30] dark:text-[#fbbac3] mb-3">
                    <FileText className="w-3 h-3" />
                    {currentPassage.section || currentQuestion.section}
                  </div>
                  <h2 className="text-lg font-semibold text-[#2a161b] dark:text-white mb-4 pb-3 border-b border-[var(--line)]">
                    <MathText text={currentPassage.title} />
                  </h2>
                  <div className="text-[15px] leading-relaxed text-[#5e4249] dark:text-[#ebc9cf]">
                    <MathText text={currentPassage.content} />
                  </div>
                </div>
              </section>

              <div
                role="separator"
                aria-orientation="vertical"
                onPointerDown={() => setIsDraggingDivider(true)}
                title="Kéo để thay đổi kích thước khung ngữ liệu"
                className="hidden md:flex w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-[#f4d5da]/70 dark:bg-[#381823] hover:bg-crimson/40 transition-colors group"
              >
                <div className="w-0.5 h-8 rounded-full bg-[#ef6c7e]/60 group-hover:bg-crimson" />
              </div>
            </>
          )}

          {/* Question & Answer Pane */}
          <section
            className={`relative flex-1 min-w-0 bg-[#fff7f8] dark:bg-[#13090d] overflow-y-auto custom-scrollbar flex flex-col justify-between ${
              showSplitScreen ? 'p-5 sm:p-7' : 'p-4 sm:p-8 lg:p-10'
            }`}
          >
            {!showSplitScreen && <div className="grid-mist pointer-events-none absolute inset-0 opacity-60" />}

            {currentQuestion && (
              <div
                className={
                  showSplitScreen
                    ? 'relative w-full max-w-2xl mx-auto'
                    : 'relative glass-card max-w-4xl mx-auto w-full rounded-[26px] p-6 sm:p-9'
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-3.5 border-b border-[var(--line)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-crimson px-3 py-1 text-xs font-semibold text-white font-mono">
                      Câu {currentIndex + 1}/{sectionQuestions.length}
                    </span>
                    <span className="rounded-full border border-[var(--line)] bg-white/85 dark:bg-[#241219] px-3 py-1 text-xs font-medium text-[#5e4249] dark:text-[#ebc9cf]">
                      {currentQuestion.section}
                    </span>
                    <span className="text-xs text-[#876870] dark:text-[#c49ba3]">
                      • {QUESTION_TYPE_LABEL[currentQuestion.type] ?? currentQuestion.type}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleFlag(currentQuestion.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                      flagged[currentQuestion.id]
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-300'
                        : 'bg-white/90 dark:bg-[#241219] border-[var(--line)] text-[#5e4249] dark:text-[#ebc9cf] hover:border-amber-400'
                    }`}
                  >
                    <Flag
                      className={`w-3.5 h-3.5 ${
                        flagged[currentQuestion.id]
                          ? 'fill-amber-500 text-amber-500'
                          : ''
                      }`}
                    />
                    {flagged[currentQuestion.id] ? 'Đã gắn cờ' : 'Gắn cờ'}
                  </button>
                </div>

                <div className={showSplitScreen ? 'text-[15px]' : 'text-base sm:text-[17px]'}>
                  <QuestionRenderer
                    question={currentQuestion}
                    answer={answers[currentQuestion.id]}
                    readOnly={isPractice && Boolean(practiceChecked[currentQuestion.id])}
                    onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                  />
                </div>

                {/* Practice Mode Instant Feedback & Explanation */}
                {isPractice && (
                  <div className="mt-5 pt-4 border-t border-[var(--line)] space-y-3">
                    {!practiceChecked[currentQuestion.id] ? (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setPracticeChecked((prev) => ({
                              ...prev,
                              [currentQuestion.id]: true,
                            }))
                          }
                          className="btn btn-crimson btn-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Kiểm tra đáp án &amp; Xem lời giải
                        </button>
                      </div>
                    ) : (
                      (() => {
                        const qRes = gradeQuestion(
                          currentQuestion,
                          answers[currentQuestion.id]
                        );
                        return (
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              {qRes.isFullCorrect ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Chính xác ({qRes.earnedPoints}/{qRes.maxPoints} điểm)
                                </span>
                              ) : qRes.isPartialCorrect ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
                                  <HelpCircle className="w-4 h-4" />
                                  Đúng một phần ({qRes.earnedPoints}/{qRes.maxPoints} điểm)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300">
                                  <XCircle className="w-4 h-4" />
                                  Chưa chính xác (0/{qRes.maxPoints} điểm)
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  setPracticeChecked((prev) => ({
                                    ...prev,
                                    [currentQuestion.id]: false,
                                  }))
                                }
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#876870] hover:text-crimson cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Làm lại câu này
                              </button>
                            </div>

                            {currentQuestion.explanation && (
                              <div className="rounded-2xl border border-[#dc263e]/20 bg-[#fff5f6]/85 dark:bg-[#241219]/80 p-4 text-sm text-[#2a161b] dark:text-[#fff2f4] leading-relaxed">
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-crimson dark:text-[#ef6c7e] mb-1">
                                  Lời giải chi tiết
                                </div>
                                <MathText text={currentQuestion.explanation} />
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Prev / Next */}
            <div
              className={`relative mt-6 pt-4 border-t border-[var(--line)] flex items-center justify-between ${
                showSplitScreen ? 'max-w-2xl mx-auto w-full' : 'max-w-4xl mx-auto w-full'
              }`}
            >
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                className="btn btn-pill btn-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Câu trước
              </button>

              <span className="hidden sm:inline text-[11px] text-[#876870] dark:text-[#b88c95]">
                Phím tắt: ← / → để chuyển câu
              </span>

              <button
                type="button"
                disabled={currentIndex === sectionQuestions.length - 1}
                onClick={() =>
                  setCurrentIndex((i) => Math.min(sectionQuestions.length - 1, i + 1))
                }
                className="btn btn-crimson btn-sm"
              >
                Câu tiếp
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        </div>

        {/* Question Navigator Sidebar */}
        <aside className="shrink-0 lg:w-64 border-t lg:border-t-0 lg:border-l border-[var(--line)] bg-white/90 dark:bg-[#190c11]/90 backdrop-blur-md p-4 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#876870] dark:text-[#b88c95]">
              Câu hỏi phần này
            </h3>
            <span className="text-xs font-mono font-semibold text-crimson dark:text-[#fbbac3]">
              {answeredInSection}/{sectionQuestions.length}
            </span>
          </div>

          {/* Quick Filter Tabs */}
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#fff5f6] dark:bg-[#241219] p-1 mb-3 border border-[var(--line)]">
            {(
              [
                { id: 'all', label: 'Tất cả' },
                { id: 'unanswered', label: 'Chưa làm' },
                { id: 'flagged', label: 'Gắn cờ' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setNavFilter(f.id)}
                className={`rounded-lg py-1 text-[10px] font-semibold transition-all cursor-pointer ${
                  navFilter === f.id
                    ? 'bg-white dark:bg-[#1b0d13] text-crimson dark:text-[#fff2f4] shadow-xs'
                    : 'text-[#876870] dark:text-[#c49ba3] hover:text-[#2a161b]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {(() => {
            const visibleItems = sectionQuestions
              .map((q, idx) => ({ q, idx }))
              .filter(({ q }) => {
                if (navFilter === 'unanswered') {
                  return !isQuestionAnswered(q, answers[q.id]);
                }
                if (navFilter === 'flagged') {
                  return Boolean(flagged[q.id]);
                }
                return true;
              });

            if (visibleItems.length === 0) {
              return (
                <div className="rounded-xl border border-dashed border-[var(--line)] py-6 px-3 text-center text-[11px] text-[#876870] dark:text-[#b88c95]">
                  {navFilter === 'flagged'
                    ? 'Chưa có câu nào được gắn cờ.'
                    : 'Bạn đã trả lời tất cả câu hỏi!'}
                </div>
              );
            }

            return (
              <div className="grid grid-cols-6 sm:grid-cols-10 lg:grid-cols-4 gap-1.5">
                {visibleItems.map(({ q, idx }) => {
                  const isCurrent = idx === currentIndex;
                  const isDone = isQuestionAnswered(q, answers[q.id]);
                  const isFlag = !!flagged[q.id];

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative h-9 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-crimson bg-[#ffeff1] dark:bg-[#dc263e]/30 text-crimson dark:text-white shadow-xs'
                          : isFlag
                            ? 'border-amber-400 dark:border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                            : isDone
                              ? 'border-[#fbbac3] dark:border-[#ef6c7e]/40 bg-[#fff5f6] dark:bg-[#241219] text-[#2a161b] dark:text-[#fff2f4]'
                              : 'border-[var(--line)] bg-white dark:bg-[#1b0d13] text-[#876870] dark:text-[#b88c95] hover:border-crimson/50'
                      }`}
                    >
                      {idx + 1}
                      {isFlag ? (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                      ) : isDone ? (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-teal-500" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })()}

          <div className="mt-4 pt-3 border-t border-[var(--line)] space-y-1.5 text-[11px] text-[#876870] dark:text-[#b88c95]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              Đã làm
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Đánh dấu xem lại
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full border border-[#ef6c7e]" />
              Chưa làm
            </div>
          </div>
        </aside>
      </div>

      {/* Calculator & Scratchpad */}
      <CalculatorModal isOpen={showCalc} onClose={() => setShowCalc(false)} />
      <ScratchpadModal
        isOpen={showScratchpad}
        onClose={() => setShowScratchpad(false)}
      />

      {/* Submit Section / Exam Confirmation Modal */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#261118]/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[26px] bg-white/95 dark:bg-[#1b0d13]/95 backdrop-blur-2xl p-6 shadow-[0_32px_90px_-28px_rgba(38,17,24,0.45)] border border-[var(--line)]">
            <div className="flex items-center gap-2.5 mb-3">
              <AlertTriangle className="w-5 h-5 text-crimson shrink-0" />
              <h3 className="text-base font-semibold text-[#2a161b] dark:text-[#fff2f4]">
                {isLastSection
                  ? 'Xác nhận nộp bài & Xem kết quả'
                  : `Xác nhận nộp ${currentSection?.title}?`}
              </h3>
            </div>
            <p className="text-sm text-[#5e4249] dark:text-[#ebc9cf] leading-relaxed">
              Bạn đã làm{' '}
              <span className="font-semibold text-[#2a161b] dark:text-white font-mono">
                {answeredInSection}/{sectionQuestions.length}
              </span>{' '}
              câu trong phần này. Thời gian còn lại:{' '}
              <span className="font-semibold text-crimson dark:text-[#fbbac3] font-mono">
                {formatDuration(remainingSeconds)}
              </span>
              .
              {!isLastSection &&
                ' Sau khi nộp, đáp án phần này sẽ được khóa và chuyển sang phần tiếp theo.'}
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(false)}
                className="btn btn-pill btn-sm"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                onClick={() => completeCurrentSection(false)}
                disabled={isSubmitting}
                className="btn btn-crimson btn-sm"
              >
                {isLastSection ? 'Nộp bài & Xem kết quả' : 'Nộp phần này'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anti-Cheat Violation Warning Modal */}
      {violationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#261118]/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[26px] bg-white/95 dark:bg-[#1b0d13]/95 backdrop-blur-2xl p-6 shadow-2xl border-2 border-rose-500">
            <div className="flex items-center gap-2.5 mb-3">
              <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
              <h3 className="text-base font-bold text-rose-700 dark:text-rose-400">
                Cảnh báo vi phạm quy chế ({violationModal.count}/3)
              </h3>
            </div>
            <p className="text-sm text-[#5e4249] dark:text-[#ebc9cf] leading-relaxed">
              Lý do:{' '}
              <span className="font-semibold text-[#2a161b] dark:text-white">
                {violationModal.reason}
              </span>
              .
            </p>
            <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
              Còn {Math.max(0, 3 - violationModal.count)} lần cảnh báo. Nếu vượt quá 3 lần
              vi phạm, hệ thống sẽ tự động khóa bài và nộp bài ngay lập tức!
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  requestFullscreenSafe();
                  setViolationModal(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                {violationModal.needsFullscreen
                  ? 'Quay lại Toàn màn hình & Tiếp tục'
                  : 'Đã hiểu & Tiếp tục làm bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
