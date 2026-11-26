import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { AdminPage } from './components/AdminPage';
import { ExamRoom } from './components/ExamRoom';
import { HomePage } from './components/HomePage';
import { ResultView } from './components/ResultView';
import { fetchExams, getLeaderboard, submitAttempt } from './lib/examService';
import { supabase } from './lib/supabase';
import type { Exam, ExamAttemptResult, UserAnswers } from './types/exam';
import { gradeExam } from './utils/scoring';

type ViewMode = 'home' | 'exam' | 'result' | 'admin';

function getDisplayNameFromUser(user: User | null): string {
  if (!user) return '';
  return (
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split('@')[0] ||
    ''
  );
}

export function App() {
  const [view, setView] = useState<ViewMode>('home');
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [fromFallback, setFromFallback] = useState(false);

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('bopbop-theme') === 'dark';
  });

  const [user, setUser] = useState<User | null>(null);
  const [studentName, setStudentName] = useState('');
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [attemptResult, setAttemptResult] = useState<ExamAttemptResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saving');
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);

  // Apply Light / Dark mode class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('bopbop-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Sync Supabase Auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const name = getDisplayNameFromUser(currentUser);
        if (name) setStudentName(name);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const name = getDisplayNameFromUser(currentUser);
        if (name) setStudentName(name);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const loadExams = useCallback(async () => {
    setLoadingExams(true);
    const res = await fetchExams();
    setExams(res.exams);
    setFromFallback(res.fromFallback);
    setLoadingExams(false);
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const handleToggleDark = () => setIsDark((d) => !d);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setStudentName('');
  };

  const handleStartExam = (exam: Exam) => {
    setActiveExam(exam);
    setAttemptResult(null);
    setView('exam');
  };

  const handleSubmitExam = async (answers: UserAnswers, timeSpentSeconds: number) => {
    if (!activeExam) return;
    const resolvedName =
      studentName.trim() || getDisplayNameFromUser(user) || 'Thí sinh ẩn danh';
    const result = gradeExam(activeExam, resolvedName, answers, timeSpentSeconds);

    setAttemptResult(result);
    setSaveStatus('saving');
    setSaveError(undefined);
    setView('result');

    const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;

    const res = await submitAttempt({
      exam_id: result.examId,
      student_name: result.studentName,
      score: result.score100,
      correct_count: result.correctCount,
      total_questions: result.totalQuestions,
      time_spent_seconds: result.timeSpentSeconds,
      user_answers: answers,
      user_id: user?.id ?? null,
      avatar_url: avatarUrl,
    });

    if (res.ok) {
      setSaveStatus('saved');
      setLeaderboardRefreshKey((k) => k + 1);
      void getLeaderboard(result.examId);
    } else {
      setSaveStatus('error');
      setSaveError(res.errorMessage);
    }
  };

  if (view === 'admin') {
    return (
      <AdminPage
        onBackHome={() => setView('home')}
        onExamCreated={() => {
          loadExams();
        }}
      />
    );
  }

  if (view === 'exam' && activeExam) {
    const resolvedName =
      studentName.trim() || getDisplayNameFromUser(user) || 'Thí sinh';
    return (
      <ExamRoom
        exam={activeExam}
        studentName={resolvedName}
        isDark={isDark}
        onToggleDark={handleToggleDark}
        onSubmit={handleSubmitExam}
        onExit={() => setView('home')}
      />
    );
  }

  if (view === 'result' && activeExam && attemptResult) {
    return (
      <ResultView
        exam={activeExam}
        result={attemptResult}
        saveStatus={saveStatus}
        saveError={saveError}
        leaderboardRefreshKey={leaderboardRefreshKey}
        onBackHome={() => setView('home')}
        onRetry={() => handleStartExam(activeExam)}
      />
    );
  }

  return (
    <HomePage
      exams={exams}
      loading={loadingExams}
      fromFallback={fromFallback}
      user={user}
      studentName={studentName}
      isDark={isDark}
      onToggleDark={handleToggleDark}
      onChangeStudentName={setStudentName}
      onStartExam={handleStartExam}
      onRefresh={loadExams}
      onOpenAdmin={() => setView('admin')}
      onSignOut={handleSignOut}
      leaderboardRefreshKey={leaderboardRefreshKey}
    />
  );
}

export default App;
