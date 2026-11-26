import { useCallback, useEffect, useState } from 'react';
import { AdminPage } from './components/AdminPage';
import { ExamRoom } from './components/ExamRoom';
import { HomePage } from './components/HomePage';
import { ResultView } from './components/ResultView';
import { fetchExams, saveAttempt } from './lib/examService';
import type { Exam, ExamAttemptResult, UserAnswers } from './types/exam';
import { gradeExam } from './utils/scoring';

type ViewMode = 'home' | 'exam' | 'result' | 'admin';

export function App() {
  const [view, setView] = useState<ViewMode>('home');
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [fromFallback, setFromFallback] = useState(false);

  const [studentName, setStudentName] = useState('');
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [attemptResult, setAttemptResult] = useState<ExamAttemptResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saving');
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

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

  const handleStartExam = (exam: Exam) => {
    setActiveExam(exam);
    setAttemptResult(null);
    setView('exam');
  };

  const handleSubmitExam = async (answers: UserAnswers, timeSpentSeconds: number) => {
    if (!activeExam) return;
    const result = gradeExam(
      activeExam,
      studentName.trim() || 'Thí sinh ẩn danh',
      answers,
      timeSpentSeconds
    );
    setAttemptResult(result);
    setSaveStatus('saving');
    setSaveError(undefined);
    setView('result');

    const res = await saveAttempt({
      exam_id: result.examId,
      student_name: result.studentName,
      score: result.score100,
      correct_count: result.correctCount,
      total_questions: result.totalQuestions,
      time_spent_seconds: result.timeSpentSeconds,
    });

    if (res.ok) {
      setSaveStatus('saved');
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
    return (
      <ExamRoom
        exam={activeExam}
        studentName={studentName.trim()}
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
      studentName={studentName}
      onChangeStudentName={setStudentName}
      onStartExam={handleStartExam}
      onRefresh={loadExams}
      onOpenAdmin={() => setView('admin')}
    />
  );
}

export default App;
