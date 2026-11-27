export type ExamType = 'TSA' | 'HSA' | 'VACT' | 'QDA' | 'VSAT' | 'BCA';

export type QuestionType =
  | 'single_choice'
  | 'true_false'
  | 'drag_drop'
  | 'short_answer';

export interface ExamSection {
  id: string;
  title: string;
  duration_minutes: number;
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
}

export interface ExamAttemptResult {
  examId: string;
  examTitle: string;
  studentName: string;
  score100: number;
  rawScore: number;
  maxScore: number;
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  violationCount?: number;
  isFlagged?: boolean;
  sectionResults?: SectionResultSummary[];
  questionResults: Record<string, QuestionResult>;
  answers: UserAnswers;
  submittedAt: string;
}

export interface AttemptRecord {
  id?: string;
  exam_id: string;
  student_name: string;
  score: number;
  correct_count: number;
  total_questions: number;
  time_spent_seconds: number;
  violation_count?: number;
  is_flagged?: boolean;
  user_answers?: UserAnswers | null;
  user_id?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}
