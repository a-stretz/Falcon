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

// ─── Story Vault V3 (extended — ready for STAR_VAULT_current.md integration) ──

export interface StoryVaultEntry extends Story {
  tier: 1 | 2;
  debrief?: {
    leadWith: string;        // what to open the answer with
    commonMistake: string;   // the drift pattern to avoid
    coreMessage: string;     // the 1-sentence point of the story
  };
  weights?: {
    td: number;  // technical depth 0–1
    pi: number;  // product/business intuition 0–1
    tr: number;  // trust/rapport 0–1
  };
  overlapGroup?: string;   // e.g. "voice-assist", "forensic-qa", "smartplayer"
  depthRating?: 'thick' | 'standard' | 'thin';
  questionVibes?: string[];
  competencyTags?: string[];
  domainTags?: string[];
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
  sessionLength: number;
  interactionMode: InteractionMode;
  knownWeaknessToTest: string;
  desiredAnswerLength: 'concise' | 'standard' | 'detailed';
  interviewStageNotes: string;
  conversationalMode: boolean; // Change 3: ask follow-ups based on previous answer
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

// Change 5: story hints per question
export interface StoryHint {
  storyId: string;
  storyTitle: string;
  matchReason: string;
}

export interface InterviewQuestion {
  id: string;
  sessionId: string;
  questionText: string;
  questionType: QuestionType;
  rationale: string;
  orderIndex: number;
  complexityTag?: 'focused' | 'layered';      // Change 3
  followUpOf?: string;                         // Change 3: questionId of parent Q
  storyHints?: StoryHint[];                    // Change 5
}

// Change 6: excerpt per dimension score
export interface DimensionScore {
  dimension: EvalDimension;
  score: number; // 1–5
  comment: string;
  excerpt?: string; // verbatim quote from transcript that explains the score
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

// Change 7: tiered rewrites
export type RewriteMode =
  // Compression tiers (Change 7)
  | 'core'      // 60-80 words — only what's load-bearing
  | 'full'      // ~150 words — the real tighter version
  | 'detailed'  // full structured — current default length
  // On-demand style variants (Change 7)
  | 'more-executive'
  | 'more-metrics-driven'
  | 'more-technical-accessible'
  // Legacy (kept for backward compat with stored sessions)
  | 'tighter'
  | 'more-structured';

export interface RewriteVariant {
  mode: RewriteMode;
  text: string;
  wordCount?: number;
  changesSummary: string;
}

// Change 1: Editorial markup
export type MarkupAction = 'KEEP' | 'CUT' | 'COMPRESS' | 'REORDER' | 'UPGRADE' | 'PIVOT';

export interface MarkupSpan {
  action: MarkupAction;
  text: string;             // the verbatim text from the transcript
  note: string;             // 1-sentence explanation
  replacement?: string;     // COMPRESS: shorter version; UPGRADE: better phrasing
  pivotType?: 'productive' | 'derailing'; // PIVOT only
  reorderNote?: string;     // REORDER: suggested position/destination
}

export interface EditorialMarkup {
  id: string;
  questionId: string;
  sessionId: string;
  originalTranscript: string;
  spans: MarkupSpan[];        // sequential, covers all transcript text
  missingElements: string[];  // gaps not present in transcript at all
  cleanVersion: string;       // CUT removed, COMPRESS applied
  createdAt: string;
}

export interface AnswerEvaluation {
  id: string;
  sessionId: string;
  questionId: string;
  responseText: string;
  inputMode: InteractionMode;
  inputTruncated?: boolean;           // Change 8: flagged if recording was cut off
  scoresByDimension: DimensionScore[];
  overallScore: number;
  writtenFeedback: string;
  strongerStorySuggestion: string | null;
  recurringWeaknessTags: RecurringWeaknessTag[];
  rewriteVariants: RewriteVariant[];
  editorialMarkupId?: string;         // Change 1: links to preceding markup
  intendedStoryId?: string;           // Change 5: which story the user picked from hints
  attemptNumber: number;              // Change 4: 1, 2, or 3
  previousAttemptId?: string;         // Change 4: links to prior attempt
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
  voiceRate: number;
  selectedVoiceURI: string;
}

// ─── Store shape ──────────────────────────────────────────────────────────────

export interface PersistedData {
  profile: CandidateProfile | null;
  stories: Story[];
  sessions: InterviewSession[];
  questions: Record<string, InterviewQuestion[]>;
  evaluations: Record<string, AnswerEvaluation[]>;
  markups: Record<string, EditorialMarkup[]>;     // Change 1
  summaries: Record<string, SessionSummary>;
  settings: AppSettings;
}
