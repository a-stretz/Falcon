// ─── Candidate Profile ───────────────────────────────────────────────────────

export type TargetRoleFamily =
  | 'general-pm'
  | 'ai-pm'
  | 'platform-pm'
  | 'b2b-saas-pm'
  | 'technical-pm';

export interface CandidateProfile {
  id: string;
  name: string;
  targetRoleFamily: TargetRoleFamily;
  backgroundSummary: string;
  communicationGoals: string[];
  knownWeaknesses: string[];
  answerStylePreference: string;
  positioningStatement: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Story Bank ───────────────────────────────────────────────────────────────

export type StoryTag =
  | 'strategy'
  | 'roadmap'
  | 'prioritization'
  | 'execution'
  | 'analytics'
  | 'qa'
  | 'ai'
  | 'technical-translation'
  | 'ambiguity'
  | 'stakeholder-alignment'
  | 'failure'
  | 'conflict'
  | 'launch'
  | 'customer-discovery'
  | 'gtm'
  | 'operations'
  | 'feedback-systems'
  | 'data-quality'
  | 'user-trust'
  | 'cross-functional';

export interface Story {
  id: string;
  candidateId: string;
  title: string;
  context: string;
  ownership: string;
  actions: string;
  result: string;
  metrics: string;
  tags: StoryTag[];
  strengthNotes: string;
  risks: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export type QuestionStyle =
  | 'behavioral'
  | 'execution'
  | 'prioritization'
  | 'product-sense'
  | 'strategy'
  | 'stakeholder'
  | 'analytical'
  | 'technical-collab'
  | 'ai-systems'
  | 'mixed';

export type Difficulty = 'standard' | 'tough' | 'senior-panel';

export type InteractionMode = 'typed' | 'voice';

export interface SessionConfig {
  jobDescription: string;
  companyBrief: string;
  roleLabel: string;
  companyLabel: string;
  focusArea: string;
  questionStyle: QuestionStyle;
  difficulty: Difficulty;
  sessionLength: number; // number of questions
  interactionMode: InteractionMode;
  knownWeaknessToTest: string;
  desiredAnswerLength: 'concise' | 'standard' | 'detailed';
  interviewStageNotes: string;
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  config: SessionConfig;
  status: 'active' | 'completed' | 'abandoned';
  createdAt: string;
  completedAt?: string;
}

// ─── Questions & Evaluations ──────────────────────────────────────────────────

export type QuestionType =
  | 'behavioral'
  | 'execution'
  | 'prioritization'
  | 'product-sense'
  | 'strategy'
  | 'stakeholder'
  | 'analytical'
  | 'technical-collab'
  | 'ai-systems';

export interface InterviewQuestion {
  id: string;
  sessionId: string;
  questionText: string;
  questionType: QuestionType;
  rationale: string;
  orderIndex: number;
}

export interface DimensionScore {
  dimension: EvalDimension;
  score: number; // 1–5
  comment: string;
}

export type EvalDimension =
  | 'relevance'
  | 'structure'
  | 'specificity'
  | 'product-judgment'
  | 'technical-fluency'
  | 'business-framing'
  | 'metrics-outcomes'
  | 'conciseness'
  | 'credibility';

export type RecurringWeaknessTag =
  | 'rambling'
  | 'vague-outcome'
  | 'missing-metrics'
  | 'weak-structure'
  | 'missing-decision-logic'
  | 'poor-prioritization-logic'
  | 'no-business-framing'
  | 'overuse-of-same-story'
  | 'too-technical'
  | 'not-technical-enough'
  | 'missing-ownership'
  | 'generic-language'
  | 'weak-opener'
  | 'no-clear-result';

export type RewriteMode =
  | 'tighter'
  | 'more-structured'
  | 'more-executive'
  | 'more-metrics-driven'
  | 'more-technical-accessible';

export interface RewriteVariant {
  mode: RewriteMode;
  text: string;
  changesSummary: string;
}

export interface AnswerEvaluation {
  id: string;
  sessionId: string;
  questionId: string;
  responseText: string;
  inputMode: InteractionMode;
  scoresByDimension: DimensionScore[];
  overallScore: number; // 1–5, computed average
  writtenFeedback: string;
  strongerStorySuggestion: string | null;
  recurringWeaknessTags: RecurringWeaknessTag[];
  rewriteVariants: RewriteVariant[];
  createdAt: string;
}

// ─── Session Summary ──────────────────────────────────────────────────────────

export interface SessionSummary {
  sessionId: string;
  strongestAnswers: Array<{ questionId: string; questionText: string; score: number }>;
  weakestAnswers: Array<{ questionId: string; questionText: string; score: number }>;
  recurringProblems: RecurringWeaknessTag[];
  storyUsageReview: string;
  topStrengths: string[];
  topRisks: string[];
  nextActions: string[];
  overallSessionScore: number;
}

// ─── App State ────────────────────────────────────────────────────────────────

export interface AppSettings {
  anthropicApiKey: string;
  defaultInteractionMode: InteractionMode;
  voiceRate: number; // 0.8–1.5
  selectedVoiceURI: string;
}

// ─── Store shape (used by Zustand) ────────────────────────────────────────────

export interface PersistedData {
  profile: CandidateProfile | null;
  stories: Story[];
  sessions: InterviewSession[];
  questions: Record<string, InterviewQuestion[]>; // sessionId → questions
  evaluations: Record<string, AnswerEvaluation[]>; // sessionId → evaluations
  summaries: Record<string, SessionSummary>; // sessionId → summary
  settings: AppSettings;
}
