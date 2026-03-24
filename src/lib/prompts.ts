import type {
  CandidateProfile,
  Story,
  InterviewQuestion,
  AnswerEvaluation,
  SessionConfig,
  QuestionType,
  EvalDimension,
  RewriteMode,
} from '../types';

// ─── Context assembly ─────────────────────────────────────────────────────────

export function assembleStoryContext(stories: Story[]): string {
  return JSON.stringify(
    stories.map((s) => ({
      id: s.id,
      title: s.title,
      tags: s.tags,
      ownership: s.ownership,
      actions: s.actions,
      result: s.result,
      metrics: s.metrics,
      strengthNotes: s.strengthNotes,
    })),
    null,
    2
  );
}

export function assembleCandidateContext(
  profile: CandidateProfile,
  stories: Story[]
): string {
  return `## Candidate Background
${profile.backgroundSummary}

## Communication Goals
${profile.communicationGoals.map((g) => `- ${g}`).join('\n')}

## Known Weaknesses
${profile.knownWeaknesses.map((w) => `- ${w}`).join('\n')}

## Story Bank
${assembleStoryContext(stories)}`;
}

// ─── Question generation ──────────────────────────────────────────────────────

export function buildQuestionGenerationPrompt(params: {
  config: SessionConfig;
  profile: CandidateProfile;
  stories: Story[];
  questionsAsked: InterviewQuestion[];
}): string {
  const { config, profile, stories, questionsAsked } = params;

  const askedText =
    questionsAsked.length > 0
      ? questionsAsked.map((q, i) => `${i + 1}. [${q.questionType}] ${q.questionText}`).join('\n')
      : 'None yet.';

  return `You are a senior PM interviewer conducting a structured interview.

## Target Role
${config.roleLabel || 'Product Manager'} at ${config.companyLabel || 'the company'}

## Job Description
${config.jobDescription || 'Not provided.'}

## Company / Role Brief
${config.companyBrief || 'Not provided.'}

${assembleCandidateContext(profile, stories)}

## Session Configuration
- Question style: ${config.questionStyle}
- Difficulty: ${config.difficulty}
- Focus area: ${config.focusArea || 'General — vary question types'}
- Session length: ${config.sessionLength} questions total
- Known weakness to pressure test: ${config.knownWeaknessToTest || 'None specified'}

## Questions Asked So Far
${askedText}

## Instructions
Generate the next interview question. Requirements:
1. Ground the question in BOTH the job context AND the candidate's actual background
2. Test whether the candidate can connect real experience to the target role
3. Probe for specificity, decisions, tradeoffs, and outcomes — not just activity descriptions
4. Vary the question type from what has already been asked
5. Match the difficulty level: ${config.difficulty === 'tough' ? 'push hard on tradeoffs, constraints, and failure modes' : config.difficulty === 'senior-panel' ? 'senior leadership level — expect strategic depth and crisp business framing' : 'standard PM interview rigor'}
6. If a focus area is set, weight toward it

Do NOT repeat questions already asked.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "questionText": "The full question",
  "questionType": "behavioral|execution|prioritization|product-sense|strategy|stakeholder|analytical|technical-collab|ai-systems",
  "rationale": "1-2 sentences on why this question for this candidate and role"
}`;
}

// ─── Answer evaluation ────────────────────────────────────────────────────────

const DIMENSION_DESCRIPTIONS: Record<EvalDimension, string> = {
  relevance: 'Relevance to the question asked',
  structure: 'Structure and clarity of the answer',
  specificity: 'Use of concrete, specific details vs. generic language',
  'product-judgment': 'Evidence of genuine PM thinking — decisions, tradeoffs, prioritization',
  'technical-fluency': 'Appropriate technical literacy for a PM (not engineering, but not avoidant)',
  'business-framing': 'Connection to business value, user impact, or strategic context',
  'metrics-outcomes': 'Presence of measurable results or concrete evidence of impact',
  conciseness: 'Answer is appropriately tight — no rambling or padding',
  credibility: 'Answer sounds like someone who has actually done this work',
};

export function buildEvaluationPrompt(params: {
  question: InterviewQuestion;
  answer: string;
  profile: CandidateProfile;
  stories: Story[];
}): string {
  const { question, answer, profile, stories } = params;

  const dimensionList = (Object.keys(DIMENSION_DESCRIPTIONS) as EvalDimension[])
    .map((d, i) => `${i + 1}. ${d}: ${DIMENSION_DESCRIPTIONS[d]}`)
    .join('\n');

  return `You are a senior PM interview coach evaluating a candidate's answer. Be direct, specific, and unsentimental. Do not sugarcoat.

## Question
"${question.questionText}"
Question type: ${question.questionType}

## Candidate's Answer
${answer}

${assembleCandidateContext(profile, stories)}

## Scoring Rubric (1–5 scale)
${dimensionList}

Scale:
1 = Poor / missing
2 = Weak
3 = Adequate but needs improvement
4 = Good
5 = Strong / exemplary

## Evaluation Instructions
- Do NOT use generic praise ("great job", "excellent", "love that")
- If the answer is weak, say so plainly and explain why
- If the candidate rambles, name it
- If a stronger story from the story bank should have been used, name it by title
- If business framing is missing, point it out
- Flag if the answer describes activity without explaining decisions or outcomes
- Be specific about what needs to change, not just that it's wrong

Recurring weakness tags to apply (list all that apply):
rambling, vague-outcome, missing-metrics, weak-structure, missing-decision-logic, poor-prioritization-logic, no-business-framing, overuse-of-same-story, too-technical, not-technical-enough, missing-ownership, generic-language, weak-opener, no-clear-result

Return ONLY valid JSON (no markdown, no explanation):
{
  "scoresByDimension": [
    { "dimension": "relevance", "score": 3, "comment": "specific comment" },
    { "dimension": "structure", "score": 3, "comment": "specific comment" },
    { "dimension": "specificity", "score": 3, "comment": "specific comment" },
    { "dimension": "product-judgment", "score": 3, "comment": "specific comment" },
    { "dimension": "technical-fluency", "score": 3, "comment": "specific comment" },
    { "dimension": "business-framing", "score": 3, "comment": "specific comment" },
    { "dimension": "metrics-outcomes", "score": 3, "comment": "specific comment" },
    { "dimension": "conciseness", "score": 3, "comment": "specific comment" },
    { "dimension": "credibility", "score": 3, "comment": "specific comment" }
  ],
  "overallScore": 3.0,
  "writtenFeedback": "Direct 2-4 paragraph coaching — what worked, what didn't, what to fix",
  "strongerStorySuggestion": "story title or null",
  "recurringWeaknessTags": []
}`;
}

// ─── Better answer / rewrite ──────────────────────────────────────────────────

const REWRITE_MODE_INSTRUCTIONS: Record<RewriteMode, string> = {
  tighter: 'Cut ruthlessly. Keep the signal, remove all padding and repetition. Target 40–50% shorter while retaining every important point.',
  'more-structured': 'Impose clear structure: open with the situation/challenge, explain your specific action and decision logic, close with a concrete result. Use clean transitions.',
  'more-executive': 'Lead with the business implication or outcome. Keep technical detail minimal. Sound like a PM presenting to leadership.',
  'more-metrics-driven': 'Surface every available metric or proof point from the candidate\'s background. Frame with before/after or directional language where precision isn\'t available.',
  'more-technical-accessible': 'Show genuine technical understanding appropriate for a senior PM. Discuss model behavior, data quality, or system tradeoffs at PM depth — without crossing into engineering.',
};

export function buildRewritePrompt(params: {
  question: InterviewQuestion;
  originalAnswer: string;
  mode: RewriteMode;
  evaluation: AnswerEvaluation;
  profile: CandidateProfile;
  stories: Story[];
}): string {
  const { question, originalAnswer, mode, evaluation, profile, stories } = params;

  return `You are a senior PM interview coach rewriting a candidate's answer to be stronger.

## Question
"${question.questionText}"

## Original Answer
${originalAnswer}

## Rewrite Mode: ${mode}
${REWRITE_MODE_INSTRUCTIONS[mode]}

## Previous Evaluation Feedback
${evaluation.writtenFeedback}

${assembleCandidateContext(profile, stories)}

## Critical Rules
- Ground every claim in the candidate's actual documented background — do NOT fabricate experience, metrics, or ownership
- Do not invent specific numbers that aren't in the proof points
- Do not turn the candidate into an engineer
- Clearly distinguish what was owned vs. supported
- Keep the voice natural — this should sound like the candidate speaking
- The rewrite should be a better version of what they said, not a replacement with fictional content

Return ONLY valid JSON (no markdown, no explanation):
{
  "rewrittenAnswer": "The full rewritten answer",
  "changesSummary": ["bullet 1 explaining a specific change and why", "bullet 2", "bullet 3"]
}`;
}

// ─── Session summary ──────────────────────────────────────────────────────────

export function buildSessionSummaryPrompt(params: {
  config: SessionConfig;
  questions: InterviewQuestion[];
  evaluations: AnswerEvaluation[];
  profile: CandidateProfile;
}): string {
  const { config, questions, evaluations, profile } = params;

  const transcript = questions.map((q) => {
    const ev = evaluations.find((e) => e.questionId === q.id);
    return {
      questionId: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      answer: ev?.responseText ?? '[no answer recorded]',
      overallScore: ev?.overallScore ?? null,
      weaknesses: ev?.recurringWeaknessTags ?? [],
    };
  });

  return `You are a senior PM interview coach producing a session debrief. Be diagnostic and direct. Do not pad with encouragement.

## Session Context
Role: ${config.roleLabel || 'Product Manager'} at ${config.companyLabel || 'the company'}
Questions: ${questions.length}
Difficulty: ${config.difficulty}

## Candidate's Known Weaknesses
${profile.knownWeaknesses.map((w) => `- ${w}`).join('\n')}

## Full Session Transcript
${JSON.stringify(transcript, null, 2)}

## Instructions
Produce an honest session debrief. Include what actually worked and what didn't.

Return ONLY valid JSON:
{
  "strongestAnswers": [{ "questionId": "...", "questionText": "...", "score": 4.2 }],
  "weakestAnswers": [{ "questionId": "...", "questionText": "...", "score": 2.1 }],
  "recurringProblems": ["tag1", "tag2"],
  "storyUsageReview": "Paragraph on story usage — what worked, what was missed, what was overused",
  "topStrengths": ["strength 1", "strength 2", "strength 3"],
  "topRisks": ["risk 1", "risk 2", "risk 3"],
  "nextActions": ["specific action 1", "specific action 2", "specific action 3"],
  "overallSessionScore": 3.2
}`;
}

// ─── Type helpers ─────────────────────────────────────────────────────────────

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  behavioral: 'Behavioral',
  execution: 'Execution',
  prioritization: 'Prioritization',
  'product-sense': 'Product Sense',
  strategy: 'Strategy',
  stakeholder: 'Stakeholder',
  analytical: 'Analytical',
  'technical-collab': 'Technical Collaboration',
  'ai-systems': 'AI / Systems',
};
