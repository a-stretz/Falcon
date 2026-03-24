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
} from '../types';
import {
  buildQuestionGenerationPrompt,
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
}): Promise<InterviewQuestion> {
  const client = getClient(params.apiKey);
  const prompt = buildQuestionGenerationPrompt(params);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (response.content[0] as { type: string; text: string }).text;
  const parsed = parseJSON<{ questionText: string; questionType: string; rationale: string }>(text);

  return {
    id: nanoid(),
    sessionId: params.sessionId,
    questionText: parsed.questionText,
    questionType: parsed.questionType as InterviewQuestion['questionType'],
    rationale: parsed.rationale,
    orderIndex: params.orderIndex,
  };
}

// ─── Evaluate answer ──────────────────────────────────────────────────────────

export async function evaluateAnswer(params: {
  apiKey: string;
  question: InterviewQuestion;
  answer: string;
  inputMode: AnswerEvaluation['inputMode'];
  profile: CandidateProfile;
  stories: Story[];
  sessionId: string;
}): Promise<AnswerEvaluation> {
  const client = getClient(params.apiKey);
  const prompt = buildEvaluationPrompt(params);

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
    scoresByDimension: parsed.scoresByDimension,
    overallScore: parsed.overallScore,
    writtenFeedback: parsed.writtenFeedback,
    strongerStorySuggestion: parsed.strongerStorySuggestion,
    recurringWeaknessTags: parsed.recurringWeaknessTags ?? [],
    rewriteVariants: [],
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
  const parsed = parseJSON<{ rewrittenAnswer: string; changesSummary: string[] }>(text);

  return {
    mode: params.mode,
    text: parsed.rewrittenAnswer,
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

// ─── Streaming variant for question generation (optional) ─────────────────────

export async function* streamEvaluation(params: {
  apiKey: string;
  question: InterviewQuestion;
  answer: string;
  profile: CandidateProfile;
  stories: Story[];
}): AsyncGenerator<string> {
  const client = getClient(params.apiKey);
  const prompt = buildEvaluationPrompt(params);

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      yield chunk.delta.text;
    }
  }
}
