import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { AchievementToast } from './components/AchievementToast';
import { AdminPage } from './components/AdminPage';
import { AuthModal } from './components/AuthModal';
import { ExamRoom } from './components/ExamRoom';
import { HomePage } from './components/HomePage';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultView, type XpAwardSummary } from './components/ResultView';
import { evaluateAndUnlockAchievements } from './lib/achievementService';
import { fetchExams, getLeaderboard, submitAttempt } from './lib/examService';
import {
  awardExamXp,
  checkAdminRole,
  fetchOrCreateProfile,
  updateUserTargetGoal,
  type TargetGoalPayload,
  type UserProfile,
} from './lib/profileService';
import { supabase } from './lib/supabase';
import type { Exam, ExamAttemptResult, UserAnswers } from './types/exam';
import type { AchievementDefinition } from './utils/achievements';
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
  const [isPreloading, setIsPreloading] = useState(true);
  const [view, setView] = useState<ViewMode>('home');
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [fromFallback, setFromFallback] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [studentName, setStudentName] = useState('');
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | undefined>(undefined);
  const [examMode, setExamMode] = useState<'exam' | 'practice'>('exam');
  const [attemptResult, setAttemptResult] = useState<ExamAttemptResult | null>(null);
  const [xpAward, setXpAward] = useState<XpAwardSummary | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saving');
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);
  const [globalAuthOpen, setGlobalAuthOpen] = useState(false);
  const [globalAuthNotice, setGlobalAuthNotice] = useState<string | null>(null);
  const [unlockedToasts, setUnlockedToasts] = useState<AchievementDefinition[]>([]);

  // Enforce crisp light theme
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('bopbop-theme');
  }, []);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setStudentName('');
  };

  const handleSaveTargetGoal = async (goal: TargetGoalPayload) => {
    if (!user) return;
    await updateUserTargetGoal(user.id, goal);
    setProfile((prev) =>
      prev
        ? { ...prev, ...goal }
        : {
            id: user.id,
            xp: 0,
            exams_completed: 0,
            full_name: getDisplayNameFromUser(user) || null,
            avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
            ...goal,
          }
    );
  };

  const handleStartExam = (
    exam: Exam,
    targetSectionId?: string,
    mode: 'exam' | 'practice' = 'exam'
  ) => {
    if (!user) {
      setGlobalAuthNotice('Vui lòng đăng nhập tài khoản để làm bài và xem lời giải');
      setGlobalAuthOpen(true);
      return;
    }
    setActiveExam(exam);
    setActiveSectionId(targetSectionId);
    setExamMode(mode);
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
    const result: ExamAttemptResult = {
      ...graded,
      violationCount,
      isFlagged,
    };

    const earnedXp = calculateEarnedXp(result.score100, result.correctCount);
    setAttemptResult(result);
    setSaveStatus('saving');
    setSaveError(undefined);
    setView('result');

    const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;

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
      student_name: result.studentName,
      score: result.score100,
      correct_count: result.correctCount,
      total_questions: result.totalQuestions,
      time_spent_seconds: result.timeSpentSeconds,
      violation_count: violationCount,
      is_flagged: isFlagged,
      user_answers: answers,
      user_id: user?.id ?? null,
      avatar_url: avatarUrl,
    });

    if (res.ok) {
      setSaveStatus('saved');
      setLeaderboardRefreshKey((k) => k + 1);
      void getLeaderboard(result.examId);

      if (!isFlagged && user) {
        const sectionDuration = targetSectionId
          ? activeExam.sections?.find((s) => s.id === targetSectionId)?.duration_minutes
          : undefined;
        const allowedDurationSeconds =
          Number(sectionDuration ?? activeExam.duration_minutes ?? 60) * 60;

        void evaluateAndUnlockAchievements({
          userId: user.id,
          score100: result.score100,
          timeSpentSeconds: result.timeSpentSeconds,
          allowedDurationSeconds,
          submittedAt: new Date(),
          examsCompletedFallback: (profile?.exams_completed ?? 0) + 1,
        }).then((newlyUnlocked) => {
          if (newlyUnlocked.length > 0) {
            setUnlockedToasts((prev) => [...prev, ...newlyUnlocked]);
            setTimeout(() => {
              const ids = new Set(newlyUnlocked.map((a) => a.id));
              setUnlockedToasts((prev) => prev.filter((a) => !ids.has(a.id)));
            }, 7000);
          }
        });
      }
    } else {
      setSaveStatus('error');
      setSaveError(res.errorMessage);
    }
  };

  if (isPreloading) {
    return (
      <LoadingScreen
        delayMs={1700}
        fadeMs={400}
        onComplete={() => setIsPreloading(false)}
      />
    );
  }

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
        mode={examMode}
        onSubmit={handleSubmitExam}
        onExit={() => setView('home')}
      />
    );
  }

  if (view === 'result' && activeExam && attemptResult) {
    return (
      <>
        <ResultView
          exam={activeExam}
          result={attemptResult}
          isAuthenticated={Boolean(user)}
          saveStatus={saveStatus}
          saveError={saveError}
          xpAward={xpAward}
          leaderboardRefreshKey={leaderboardRefreshKey}
          onBackHome={() => setView('home')}
          onRetry={() => handleStartExam(activeExam, activeSectionId, examMode)}
          onRequireAuth={(notice) => {
            setGlobalAuthNotice(notice);
            setGlobalAuthOpen(true);
          }}
        />
        <AuthModal
          isOpen={globalAuthOpen}
          onClose={() => {
            setGlobalAuthOpen(false);
            setGlobalAuthNotice(null);
          }}
          notice={globalAuthNotice}
        />
        <AchievementToast
          achievements={unlockedToasts}
          onDismiss={(id) =>
            setUnlockedToasts((prev) => prev.filter((item) => item.id !== id))
          }
        />
      </>
    );
  }

  return (
    <>
      <HomePage
        exams={exams}
        loading={loadingExams}
        fromFallback={fromFallback}
        user={user}
        profile={profile}
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
        onStartExam={handleStartExam}
        onRefresh={loadExams}
        onOpenAdmin={() => setView('admin')}
        onSignOut={handleSignOut}
        onSaveTargetGoal={handleSaveTargetGoal}
        leaderboardRefreshKey={leaderboardRefreshKey}
      />
      <AchievementToast
        achievements={unlockedToasts}
        onDismiss={(id) =>
          setUnlockedToasts((prev) => prev.filter((item) => item.id !== id))
        }
      />
    </>
  );
}

export default App;
