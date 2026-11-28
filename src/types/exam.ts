export type ExamType = 'TSA' | 'HSA' | 'VACT' | 'THPTQG' | 'QDA' | 'VSAT' | 'BCA';

export type QuestionType =
  | 'single_choice'
  | 'true_false'
  | 'drag_drop'
  | 'short_answer';

export interface ExamSection {
  id: string;
  title: string;
  duration_minutes: number;
  max_score?: number;
}

export interface Passage {
  id: string;
  title: string;
  section?: string;
  content: string;
}

export interface ChoiceOption {
  id: string;
  text: string;
}

export interface TrueFalseStatement {
  id: string;
  text: string;
  correct: boolean;
}

export interface DragDropBlank {
  id: string;
  correctWord: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  section: string;
  sectionId?: string;
  passageId?: string;
  prompt: string;
  // single_choice
  options?: ChoiceOption[];
  correctOption?: string;
  // true_false
  statements?: TrueFalseStatement[];
  // drag_drop
  wordBank?: string[];
  blanks?: DragDropBlank[];
  // short_answer
  correctAnswers?: string[];
  placeholder?: string;
  // explanation
  explanation?: string;
  points?: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  exam_type?: ExamType;
  section?: string;
  duration_minutes: number;
  anti_cheat?: boolean;
  sections?: ExamSection[];
  passages: Passage[];
  questions: Question[];
  created_at?: string;
  is_sample?: boolean;
}

export type UserAnswerValue =
  | string // single_choice or short_answer
  | Record<string, boolean | null> // true_false: statementId -> true/false/null
  | Record<string, string>; // drag_drop: blankId -> word

export type UserAnswers = Record<string, UserAnswerValue>;

export interface QuestionResult {
  questionId: string;
  earnedPoints: number;
  maxPoints: number;
  isFullCorrect: boolean;
  isPartialCorrect: boolean;
  isAnswered: boolean;
}

export interface SectionResultSummary {
  sectionId: string;
  title: string;
  correctCount: number;
  totalQuestions: number;
  rawScore: number;
  maxScore: number;
  scaledScore: number;
  sectionMaxScore: number;
  accuracyPct: number;
}

export interface ExamAttemptResult {
  examId: string;
  examTitle: string;
  examType: ExamType;
  studentName: string;
  avatarUrl?: string | null;
  score100: number;
  displayScore: number;
  displayMaxScore: number;
  rawScore: number;
  maxScore: number;
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  violationCount?: number;
  isFlagged?: boolean;
  sectionResults?: SectionResultSummary[];
  questionResults: Record<string, QuestionResult>;
  questionTimes?: Record<string, number>;
  answers: UserAnswers;
  submittedAt: string;
}

export interface AttemptRecord {
  id?: string;
  exam_id: string;
  exam_type?: ExamType;
  student_name: string;
  score: number;
  max_score?: number;
  correct_count: number;
  total_questions: number;
  time_spent_seconds: number;
  violation_count?: number;
  is_flagged?: boolean;
  is_cheating?: boolean;
  status?: string;
  section_scores?: SectionResultSummary[] | null;
  user_answers?: UserAnswers | null;
  question_times?: Record<string, number> | null;
  user_id?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}
