import Anthropic from '@anthropic-ai/sdk';
import type {
  CandidateProfile,
  Story,
  InterviewQuestion,
  AnswerEvaluation,
  SessionSummary,
  SessionConfig,
  RewriteMode,
  RewriteVariant,
  EditorialMarkup,
  Difficulty,
} from '../types';
import {
  buildQuestionGenerationPrompt,
  buildEditorialMarkupPrompt,
  buildEvaluationPrompt,
  buildRewritePrompt,
  buildSessionSummaryPrompt,
} from './prompts';
import { nanoid } from './nanoid';

// ─── Client factory ────────────────────────────────────────────────────────────

function getClient(apiKey: string): Anthropic {
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

const MODEL = 'claude-sonnet-4-6';

// ─── JSON parsing helper ──────────────────────────────────────────────────────

function parseJSON<T>(text: string): T {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

// ─── Generate next question ───────────────────────────────────────────────────

export async function generateQuestion(params: {
  apiKey: string;
  config: SessionConfig;
  profile: CandidateProfile;
  stories: Story[];
  questionsAsked: InterviewQuestion[];
  sessionId: string;
  orderIndex: number;
  previousAnswer?: string;
}): Promise<InterviewQuestion> {
  const client = getClient(params.apiKey);
  const prompt = buildQuestionGenerationPrompt(params);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (response.content[0] as { type: string; text: string }).text;
  const parsed = parseJSON<{
    questionText: string;
    questionType: string;
    rationale: string;
    complexityTag?: 'focused' | 'layered';
    followUpOf?: string;
    storyHints?: InterviewQuestion['storyHints'];
  }>(text);

  return {
    id: nanoid(),
    sessionId: params.sessionId,
    questionText: parsed.questionText,
    questionType: parsed.questionType as InterviewQuestion['questionType'],
    rationale: parsed.rationale,
    orderIndex: params.orderIndex,
    complexityTag: parsed.complexityTag,
    followUpOf: parsed.followUpOf,
    storyHints: parsed.storyHints,
  };
}

// ─── Generate editorial markup (Change 1) ────────────────────────────────────

export async function generateEditorialMarkup(params: {
  apiKey: string;
  question: InterviewQuestion;
  transcript: string;
  profile: CandidateProfile;
  stories: Story[];
  sessionId: string;
  previousMarkup?: EditorialMarkup | null;
}): Promise<EditorialMarkup> {
  const client = getClient(params.apiKey);
  const prompt = buildEditorialMarkupPrompt(params);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (response.content[0] as { type: string; text: string }).text;
  const parsed = parseJSON<{
    spans: EditorialMarkup['spans'];
    missingElements: string[];
    cleanVersion: string;
  }>(text);

  return {
    id: nanoid(),
    questionId: params.question.id,
    sessionId: params.sessionId,
    originalTranscript: params.transcript,
    spans: parsed.spans,
    missingElements: parsed.missingElements ?? [],
    cleanVersion: parsed.cleanVersion,
    createdAt: new Date().toISOString(),
  };
}

// ─── Evaluate answer ──────────────────────────────────────────────────────────

export async function evaluateAnswer(params: {
  apiKey: string;
  question: InterviewQuestion;
  answer: string;
  inputMode: AnswerEvaluation['inputMode'];
  inputTruncated?: boolean;
  profile: CandidateProfile;
  stories: Story[];
  sessionId: string;
  difficulty?: Difficulty;
  intendedStoryId?: string;
  previousEvaluation?: AnswerEvaluation | null;
  attemptNumber?: number;
  previousAttemptId?: string;
}): Promise<AnswerEvaluation> {
  const client = getClient(params.apiKey);
  const prompt = buildEvaluationPrompt({
    question: params.question,
    answer: params.answer,
    profile: params.profile,
    stories: params.stories,
    difficulty: params.difficulty,
    intendedStoryId: params.intendedStoryId,
    previousEvaluation: params.previousEvaluation,
    inputTruncated: params.inputTruncated,
  });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (response.content[0] as { type: string; text: string }).text;
  const parsed = parseJSON<{
    scoresByDimension: AnswerEvaluation['scoresByDimension'];
    overallScore: number;
    writtenFeedback: string;
    strongerStorySuggestion: string | null;
    recurringWeaknessTags: AnswerEvaluation['recurringWeaknessTags'];
  }>(text);

  return {
    id: nanoid(),
    sessionId: params.sessionId,
    questionId: params.question.id,
    responseText: params.answer,
    inputMode: params.inputMode,
    inputTruncated: params.inputTruncated,
    scoresByDimension: parsed.scoresByDimension,
    overallScore: parsed.overallScore,
    writtenFeedback: parsed.writtenFeedback,
    strongerStorySuggestion: parsed.strongerStorySuggestion,
    recurringWeaknessTags: parsed.recurringWeaknessTags ?? [],
    rewriteVariants: [],
    intendedStoryId: params.intendedStoryId,
    attemptNumber: params.attemptNumber ?? 1,
    previousAttemptId: params.previousAttemptId,
    createdAt: new Date().toISOString(),
  };
}

// ─── Rewrite answer ───────────────────────────────────────────────────────────

export async function rewriteAnswer(params: {
  apiKey: string;
  question: InterviewQuestion;
  originalAnswer: string;
  mode: RewriteMode;
  evaluation: AnswerEvaluation;
  profile: CandidateProfile;
  stories: Story[];
}): Promise<RewriteVariant> {
  const client = getClient(params.apiKey);
  const prompt = buildRewritePrompt(params);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (response.content[0] as { type: string; text: string }).text;
  const parsed = parseJSON<{ rewrittenAnswer: string; wordCount?: number; changesSummary: string[] | string }>(text);

  return {
    mode: params.mode,
    text: parsed.rewrittenAnswer,
    wordCount: parsed.wordCount,
    changesSummary: Array.isArray(parsed.changesSummary)
      ? parsed.changesSummary.join('\n')
      : parsed.changesSummary,
  };
}

// ─── Generate session summary ─────────────────────────────────────────────────

export async function generateSessionSummary(params: {
  apiKey: string;
  config: SessionConfig;
  questions: InterviewQuestion[];
  evaluations: AnswerEvaluation[];
  profile: CandidateProfile;
  sessionId: string;
}): Promise<SessionSummary> {
  const client = getClient(params.apiKey);
  const prompt = buildSessionSummaryPrompt(params);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (response.content[0] as { type: string; text: string }).text;
  const parsed = parseJSON<Omit<SessionSummary, 'sessionId'>>(text);

  return { ...parsed, sessionId: params.sessionId };
}
