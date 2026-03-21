export type UserRole = 'admin' | 'test_taker';
export type TestStatus = 'draft' | 'published' | 'archived';
export type QuestionType = 'mcq' | 'subjective';
export type AttemptStatus = 'in_progress' | 'submitted';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface McqOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  test_id: string;
  question_text: string;
  question_type: QuestionType;
  topic_tags: string[];
  marks: number;
  order_index: number;
  // MCQ
  options?: McqOption[];
  correct_option_id?: string;
  // Subjective
  keywords?: string[];
  created_at: string;
}

export interface Test {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  status: TestStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  question_count?: number;
}

export interface TestAttempt {
  id: string;
  test_id: string;
  user_id: string;
  status: AttemptStatus;
  started_at: string;
  submitted_at: string | null;
  time_remaining_seconds: number | null;
  total_marks: number;
  obtained_marks: number;
  mcq_correct: number;
  mcq_incorrect: number;
  mcq_unattempted: number;
  subjective_attempted: number;
  subjective_unattempted: number;
  created_at: string;
}

export interface Answer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id?: string;
  is_correct?: boolean;
  answer_text?: string;
  keyword_matches?: string[];
  keyword_score?: number;
  marks_awarded: number;
  is_attempted: boolean;
  created_at: string;
  updated_at: string;
}

// API response shapes
export interface TestWithQuestions extends Test {
  questions: Question[];
}

export interface AttemptWithAnswers extends TestAttempt {
  answers: Answer[];
  test: Test;
}

// Form shapes
export interface CreateTestForm {
  title: string;
  description: string;
  duration_minutes: number;
}

export interface CreateQuestionForm {
  question_text: string;
  question_type: QuestionType;
  topic_tags: string[];
  marks: number;
  options?: McqOption[];
  correct_option_id?: string;
  keywords?: string[];
}
