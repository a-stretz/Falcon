import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  CandidateProfile,
  Story,
  InterviewSession,
  InterviewQuestion,
  AnswerEvaluation,
  EditorialMarkup,
  SessionSummary,
  AppSettings,
  SessionConfig,
} from '../types';
import { buildDefaultProfile, buildDefaultStories, DEFAULT_SETTINGS } from '../lib/defaultData';
import { nanoid } from '../lib/nanoid';

// ─── Store shape ──────────────────────────────────────────────────────────────

interface AppState {
  // Candidate data
  profile: CandidateProfile | null;
  stories: Story[];

  // Sessions
  sessions: InterviewSession[];
  questions: Record<string, InterviewQuestion[]>;
  evaluations: Record<string, AnswerEvaluation[]>;
  markups: Record<string, EditorialMarkup[]>;
  summaries: Record<string, SessionSummary>;

  // Settings
  settings: AppSettings;

  // Active session (transient, not persisted)
  activeSessionId: string | null;
  activeQuestionIndex: number;

  // Actions — Profile
  setProfile: (profile: CandidateProfile) => void;
  resetToDefaults: () => void;

  // Actions — Stories
  addStory: (story: Omit<Story, 'id' | 'candidateId' | 'createdAt' | 'updatedAt'>) => void;
  updateStory: (id: string, updates: Partial<Story>) => void;
  deleteStory: (id: string) => void;

  // Actions — Sessions
  createSession: (config: SessionConfig) => string;
  setSessionStatus: (sessionId: string, status: InterviewSession['status']) => void;
  completeSession: (sessionId: string) => void;
  setActiveSession: (sessionId: string | null) => void;

  // Actions — Questions
  setQuestions: (sessionId: string, questions: InterviewQuestion[]) => void;
  addQuestion: (sessionId: string, question: InterviewQuestion) => void;

  // Actions — Evaluations
  addEvaluation: (evaluation: AnswerEvaluation) => void;
  addRewriteVariant: (evalId: string, variant: AnswerEvaluation['rewriteVariants'][0]) => void;

  // Actions — Markups
  addMarkup: (markup: EditorialMarkup) => void;

  // Actions — Summary
  setSummary: (sessionId: string, summary: SessionSummary) => void;

  // Actions — Settings
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Actions — Navigation
  setActiveQuestionIndex: (index: number) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: null,
      stories: [],
      sessions: [],
      questions: {},
      evaluations: {},
      markups: {},
      summaries: {},
      settings: DEFAULT_SETTINGS,
      activeSessionId: null,
      activeQuestionIndex: 0,

      // ── Profile ──────────────────────────────────────────────────────────

      setProfile: (profile) => set({ profile }),

      resetToDefaults: () =>
        set({
          profile: buildDefaultProfile(),
          stories: buildDefaultStories(),
        }),

      // ── Stories ──────────────────────────────────────────────────────────

      addStory: (partial) => {
        const now = new Date().toISOString();
        const story: Story = {
          ...partial,
          id: nanoid(),
          candidateId: get().profile?.id ?? 'default-profile',
          createdAt: now,
          updatedAt: now,
        } as Story;
        set((s) => ({ stories: [...s.stories, story] }));
      },

      updateStory: (id, updates) =>
        set((s) => ({
          stories: s.stories.map((st) =>
            st.id === id ? { ...st, ...updates, updatedAt: new Date().toISOString() } : st
          ),
        })),

      deleteStory: (id) =>
        set((s) => ({ stories: s.stories.filter((st) => st.id !== id) })),

      // ── Sessions ─────────────────────────────────────────────────────────

      createSession: (config) => {
        const id = nanoid();
        const session: InterviewSession = {
          id,
          candidateId: get().profile?.id ?? 'default-profile',
          config,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ sessions: [session, ...s.sessions] }));
        return id;
      },

      setSessionStatus: (sessionId, status) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId ? { ...sess, status } : sess
          ),
        })),

      completeSession: (sessionId) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? { ...sess, status: 'completed', completedAt: new Date().toISOString() }
              : sess
          ),
        })),

      setActiveSession: (sessionId) =>
        set({ activeSessionId: sessionId, activeQuestionIndex: 0 }),

      // ── Questions ────────────────────────────────────────────────────────

      setQuestions: (sessionId, questions) =>
        set((s) => ({ questions: { ...s.questions, [sessionId]: questions } })),

      addQuestion: (sessionId, question) =>
        set((s) => ({
          questions: {
            ...s.questions,
            [sessionId]: [...(s.questions[sessionId] ?? []), question],
          },
        })),

      // ── Evaluations ──────────────────────────────────────────────────────

      addEvaluation: (evaluation) =>
        set((s) => ({
          evaluations: {
            ...s.evaluations,
            [evaluation.sessionId]: [
              ...(s.evaluations[evaluation.sessionId] ?? []),
              evaluation,
            ],
          },
        })),

      addRewriteVariant: (evalId, variant) =>
        set((s) => {
          const updated = { ...s.evaluations };
          for (const sessionId of Object.keys(updated)) {
            updated[sessionId] = updated[sessionId].map((ev) =>
              ev.id === evalId
                ? { ...ev, rewriteVariants: [...ev.rewriteVariants, variant] }
                : ev
            );
          }
          return { evaluations: updated };
        }),

      // ── Markups ──────────────────────────────────────────────────────────

      addMarkup: (markup) =>
        set((s) => ({
          markups: {
            ...s.markups,
            [markup.sessionId]: [...(s.markups[markup.sessionId] ?? []), markup],
          },
        })),

      // ── Summary ──────────────────────────────────────────────────────────

      setSummary: (sessionId, summary) =>
        set((s) => ({ summaries: { ...s.summaries, [sessionId]: summary } })),

      // ── Settings ─────────────────────────────────────────────────────────

      updateSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),

      // ── Navigation ───────────────────────────────────────────────────────

      setActiveQuestionIndex: (index) => set({ activeQuestionIndex: index }),
    }),
    {
      name: 'falcon-interview-prep',
      storage: createJSONStorage(() => localStorage),
      // Don't persist transient session state
      partialize: (s) => ({
        profile: s.profile,
        stories: s.stories,
        sessions: s.sessions,
        questions: s.questions,
        evaluations: s.evaluations,
        markups: s.markups,
        summaries: s.summaries,
        settings: s.settings,
      }),
    }
  )
);

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectActiveSession = (s: AppState) =>
  s.sessions.find((sess) => sess.id === s.activeSessionId) ?? null;

export const selectSessionQuestions = (sessionId: string) => (s: AppState) =>
  s.questions[sessionId] ?? [];

export const selectSessionEvaluations = (sessionId: string) => (s: AppState) =>
  s.evaluations[sessionId] ?? [];

export const selectCurrentQuestion = (s: AppState) => {
  if (!s.activeSessionId) return null;
  const qs = s.questions[s.activeSessionId] ?? [];
  return qs[s.activeQuestionIndex] ?? null;
};

// Returns the latest evaluation for a given question (highest attemptNumber)
export const selectLatestEvaluation = (sessionId: string, questionId: string) => (s: AppState) => {
  const evals = (s.evaluations[sessionId] ?? []).filter((e) => e.questionId === questionId);
  if (evals.length === 0) return null;
  return evals.reduce((best, curr) => (curr.attemptNumber >= best.attemptNumber ? curr : best));
};

// Returns the latest markup for a given question
export const selectQuestionMarkup = (sessionId: string, questionId: string) => (s: AppState) => {
  const all = (s.markups[sessionId] ?? []).filter((m) => m.questionId === questionId);
  return all[all.length - 1] ?? null;
};
