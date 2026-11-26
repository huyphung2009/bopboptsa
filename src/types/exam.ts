export type QuestionType =
  | 'single_choice'
  | 'true_false'
  | 'drag_drop'
  | 'short_answer';

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
  section?: string;
  duration_minutes: number;
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
  questionResults: Record<string, QuestionResult>;
  answers: UserAnswers;
  submittedAt: string;
}

export interface AttemptRecord {
  id?: string;
  exam_id: string;
  student_name: string;
  score: number;
  correct_count?: number;
  total_questions?: number;
  time_spent_seconds?: number;
  created_at?: string;
}
