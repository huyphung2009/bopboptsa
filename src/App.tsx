import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { AdminPage } from './components/AdminPage';
import { ExamRoom } from './components/ExamRoom';
import { HomePage } from './components/HomePage';
import { ResultView, type XpAwardSummary } from './components/ResultView';
import { fetchExams, getLeaderboard, submitAttempt } from './lib/examService';
import {
  awardExamXp,
  checkAdminRole,
  fetchOrCreateProfile,
  type UserProfile,
} from './lib/profileService';
import { supabase } from './lib/supabase';
import type { Exam, ExamAttemptResult, UserAnswers } from './types/exam';
import { calculateEarnedXp } from './utils/ranks';
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [studentName, setStudentName] = useState('');
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | undefined>(undefined);
  const [attemptResult, setAttemptResult] = useState<ExamAttemptResult | null>(null);
  const [xpAward, setXpAward] = useState<XpAwardSummary | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saving');
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);

  // Apply Light / Dark mode class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('bopbop-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const syncUserProfileAndRole = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      return;
    }

    const displayName = getDisplayNameFromUser(currentUser);
    if (displayName) setStudentName(displayName);
    const avatarUrl = (currentUser.user_metadata?.avatar_url as string | undefined) ?? null;

    const [prof, role] = await Promise.all([
      fetchOrCreateProfile({
        userId: currentUser.id,
        fullName: displayName || null,
        avatarUrl,
      }),
      checkAdminRole(currentUser.email),
    ]);

    setProfile(prof);
    setIsAdmin(role.isAdmin);
    setIsSuperAdmin(role.isSuperAdmin);
  }, []);

  // Sync Supabase Auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      void syncUserProfileAndRole(currentUser);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      void syncUserProfileAndRole(currentUser);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [syncUserProfileAndRole]);

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
    setProfile(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setStudentName('');
  };

  const handleStartExam = (exam: Exam, targetSectionId?: string) => {
    setActiveExam(exam);
    setActiveSectionId(targetSectionId);
    setAttemptResult(null);
    setXpAward(null);
    setView('exam');
  };

  const handleSubmitExam = async (
    answers: UserAnswers,
    timeSpentSeconds: number,
    targetSectionId?: string,
    proctoring?: { violationCount: number; isFlagged: boolean }
  ) => {
    if (!activeExam) return;
    const resolvedName =
      studentName.trim() || getDisplayNameFromUser(user) || 'Thí sinh ẩn danh';
    const violationCount = proctoring?.violationCount ?? 0;
    const isFlagged = Boolean(proctoring?.isFlagged || violationCount > 3);

    const graded = gradeExam(
      activeExam,
      resolvedName,
      answers,
      timeSpentSeconds,
      targetSectionId
    );
    const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;
    const result: ExamAttemptResult = {
      ...graded,
      avatarUrl,
      violationCount,
      isFlagged,
    };

    const scoreRatio =
      result.displayMaxScore > 0
        ? result.displayScore / result.displayMaxScore
        : 0;
    const earnedXp = calculateEarnedXp(scoreRatio, result.correctCount);
    setAttemptResult(result);
    setSaveStatus('saving');
    setSaveError(undefined);
    setView('result');

    if (isFlagged) {
      // Flagged attempt: do NOT award XP
      setXpAward(null);
    } else if (user) {
      const xpRes = await awardExamXp({
        userId: user.id,
        earnedXp,
        fullName: resolvedName,
        avatarUrl,
      });
      setXpAward({
        earnedXp,
        previousXp: xpRes.previousXp,
        newXp: xpRes.newXp,
        isGuest: false,
      });
      setProfile((prev) => ({
        id: user.id,
        xp: xpRes.newXp,
        exams_completed: xpRes.examsCompleted,
        full_name: resolvedName,
        avatar_url: avatarUrl ?? prev?.avatar_url,
      }));
    } else {
      setXpAward({
        earnedXp,
        previousXp: 0,
        newXp: earnedXp,
        isGuest: true,
      });
    }

    const res = await submitAttempt({
      exam_id: result.examId,
      exam_type: result.examType,
      student_name: result.studentName,
      score: result.displayScore,
      max_score: result.displayMaxScore,
      correct_count: result.correctCount,
      total_questions: result.totalQuestions,
      time_spent_seconds: result.timeSpentSeconds,
      violation_count: violationCount,
      is_flagged: isFlagged,
      section_scores: result.sectionResults ?? null,
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
        userEmail={user?.email}
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
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
        targetSectionId={activeSectionId}
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
        xpAward={xpAward}
        leaderboardRefreshKey={leaderboardRefreshKey}
        onBackHome={() => setView('home')}
        onRetry={() => handleStartExam(activeExam, activeSectionId)}
      />
    );
  }

  return (
    <HomePage
      exams={exams}
      loading={loadingExams}
      fromFallback={fromFallback}
      user={user}
      profile={profile}
      isAdmin={isAdmin}
      isSuperAdmin={isSuperAdmin}
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
