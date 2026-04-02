import type {
  CandidateProfile,
  Story,
  InterviewQuestion,
  AnswerEvaluation,
  SessionConfig,
  QuestionType,
  EvalDimension,
  RewriteMode,
  EditorialMarkup,
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

// ─── Question generation (Change 3 — focused questions, hints, conversational) ─

export function buildQuestionGenerationPrompt(params: {
  config: SessionConfig;
  profile: CandidateProfile;
  stories: Story[];
  questionsAsked: InterviewQuestion[];
  previousAnswer?: string; // for conversational mode follow-up
}): string {
  const { config, profile, stories, questionsAsked, previousAnswer } = params;

  const askedText =
    questionsAsked.length > 0
      ? questionsAsked.map((q, i) => `${i + 1}. [${q.questionType}] ${q.questionText}`).join('\n')
      : 'None yet.';

  const difficultyNote =
    config.difficulty === 'tough'
      ? 'DIFFICULTY: Tough. Probe hard on tradeoffs, constraints, and failure modes. The question itself should still be focused — the toughness comes from the evaluation bar, not from packing multiple asks into one question.'
      : config.difficulty === 'senior-panel'
      ? 'DIFFICULTY: Senior Panel. Expect strategic depth, crisp business framing, and executive-level communication. One sharp question.'
      : 'DIFFICULTY: Standard PM interview rigor.';

  const conversationalNote =
    config.conversationalMode && previousAnswer && questionsAsked.length > 0
      ? `\n## Previous Answer (Conversational Mode — ask a follow-up)\n${previousAnswer}\n\nGenerate a focused follow-up question that probes deeper into the previous answer. Tag this as followUpOf: "${questionsAsked[questionsAsked.length - 1].id}".`
      : '';

  const storyIdList = stories.map((s) => `- "${s.id}": ${s.title}`).join('\n');

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
- Focus area: ${config.focusArea || 'General — vary question types'}
- Session length: ${config.sessionLength} questions total
- Known weakness to pressure test: ${config.knownWeaknessToTest || 'None specified'}
- ${difficultyNote}${conversationalNote}

## Questions Asked So Far
${askedText}

## Question Generation Rules
1. Generate ONE focused question with a single core ask. Do NOT combine multiple questions into one.
2. At most one follow-up probe appended, clearly separated with "And specifically, X?"
3. The question should be answerable with ONE story. If it requires multiple unrelated experiences, it is too broad.
4. Vary the question type from what has already been asked.
5. Ground the question in BOTH the job context AND the candidate's actual background — make it feel tailored, not generic.
6. Do NOT repeat questions already asked.

## Story Hint Matching
From the story bank, identify 2-3 stories that are strong fits for this question.
Available stories:
${storyIdList}

Return ONLY valid JSON (no markdown):
{
  "questionText": "The full question",
  "questionType": "behavioral|execution|prioritization|product-sense|strategy|stakeholder|analytical|technical-collab|ai-systems",
  "rationale": "1-2 sentences on why this question for this candidate and role",
  "complexityTag": "focused|layered",
  "storyHints": [
    { "storyId": "story-001", "storyTitle": "...", "matchReason": "1 sentence" }
  ]
}`;
}

// ─── Editorial Markup (Change 1) ──────────────────────────────────────────────

export function buildEditorialMarkupPrompt(params: {
  question: InterviewQuestion;
  transcript: string;
  profile: CandidateProfile;
  stories: Story[];
  previousMarkup?: EditorialMarkup | null; // Change 4: for try-again delta
}): string {
  const { question, transcript, profile, previousMarkup } = params;

  const previousContext = previousMarkup
    ? `\n## Previous Attempt Context (this is attempt 2+)
The candidate has answered this question before. Previously flagged issues:
${previousMarkup.missingElements.map((m) => `- MISSING: ${m}`).join('\n')}
${previousMarkup.spans.filter(s => s.action === 'CUT').map(s => `- CUT: "${s.text.slice(0, 60)}…"`).join('\n')}
Note in your analysis whether prior issues were resolved or persist.`
    : '';

  return `You are a sharp editorial coach analyzing a spoken interview answer. Your job is to show the speaker the gap between what they said and what they meant to say.
${previousContext}
## Question Asked
"${question.questionText}"
Type: ${question.questionType}

## Transcript to Analyze
${transcript}

## Candidate Background (for context only)
${profile.backgroundSummary.slice(0, 800)}

## Task
Break the transcript into sequential spans that together reconstruct the full original text. Every word of the transcript must appear in exactly one span. Spans are in order.

For each span, assign one action:
- KEEP: This passage is strong, specific, memorable, or does real work for the listener. Be generous — if it's concrete or genuinely useful, mark it KEEP.
- CUT: Scaffolding — context the SPEAKER needed to get there but the listener doesn't need. "I've been thinking about this a lot" / setup that delays the actual answer / restating what was already said.
- COMPRESS: 2+ sentences that say the same thing. Provide a single-sentence replacement that preserves all the meaning.
- REORDER: Content in the wrong position (e.g., conclusion buried in the middle). Provide a reorderNote explaining where it should go.
- UPGRADE: Adequate phrasing where a tighter or more specific construction exists. Provide the replacement.
- PIVOT: Where the answer shifted direction. Assess: was it productive (moved toward answering the question) or derailing (moved away)?

Rules:
- Be precise with CUT. Not everything that feels contextual is scaffolding — only cut what the listener doesn't need.
- Never create CUT spans for specific evidence, metrics, outcomes, or named decisions. Those are KEEP.
- MISSING elements (what the question asked for but the answer didn't provide) go in the separate "missingElements" array, NOT as spans.

## Clean Version
After annotating, produce a "cleanVersion" — the answer with all CUT spans removed and all COMPRESS spans replaced with their shorter version. This should read as a cohesive paragraph, not a chopped-up list.

Return ONLY valid JSON:
{
  "spans": [
    { "action": "KEEP", "text": "exact verbatim text", "note": "why this works" },
    { "action": "CUT", "text": "exact verbatim text", "note": "why cut" },
    { "action": "COMPRESS", "text": "exact verbatim text", "note": "why compress", "replacement": "single-sentence version" },
    { "action": "REORDER", "text": "exact verbatim text", "note": "context", "reorderNote": "should open the answer" },
    { "action": "UPGRADE", "text": "exact verbatim text", "note": "why upgrade", "replacement": "stronger phrasing" },
    { "action": "PIVOT", "text": "exact verbatim text", "note": "what changed", "pivotType": "productive|derailing" }
  ],
  "missingElements": ["The question asked about metrics — none appeared", "..."],
  "cleanVersion": "The full cleaned text as a cohesive paragraph"
}`;
}

// ─── Answer evaluation (Change 6 — tone, excerpts, vault-awareness) ──────────

const DIMENSION_DESCRIPTIONS: Record<EvalDimension, string> = {
  relevance: 'Did the answer address what was actually asked?',
  structure: 'Was it easy to follow — did it have a clear shape?',
  specificity: 'Did it use concrete details, names, numbers, decisions? Or stay generic?',
  'product-judgment': 'Did it show real PM thinking — prioritization, tradeoffs, decisions, not just activity?',
  'technical-fluency': 'Did it demonstrate appropriate technical literacy for a senior PM — not engineering, but not avoidant?',
  'business-framing': 'Did it connect to user value, business outcomes, or strategic context?',
  'metrics-outcomes': 'Did it include measurable results, before/after framing, or concrete evidence of impact?',
  conciseness: 'Was it tight? Or did it spend too many words getting to the point?',
  credibility: 'Does it sound like someone who actually did this work?',
};

export function buildEvaluationPrompt(params: {
  question: InterviewQuestion;
  answer: string;
  profile: CandidateProfile;
  stories: Story[];
  difficulty?: SessionConfig['difficulty'];
  intendedStoryId?: string;  // Change 5: which story the candidate intended to use
  previousEvaluation?: AnswerEvaluation | null; // Change 4: for try-again delta
  inputTruncated?: boolean;  // Change 8: flag if recording was cut off
}): string {
  const { question, answer, profile, stories, difficulty = 'standard', intendedStoryId, previousEvaluation, inputTruncated } = params;

  const dimensionList = (Object.keys(DIMENSION_DESCRIPTIONS) as EvalDimension[])
    .map((d, i) => `${i + 1}. ${d}: ${DIMENSION_DESCRIPTIONS[d]}`)
    .join('\n');

  const difficultyNote =
    difficulty === 'tough'
      ? 'EVALUATION BAR: Tough. Hold to a higher standard on tradeoff articulation, constraint awareness, and outcome specificity.'
      : difficulty === 'senior-panel'
      ? 'EVALUATION BAR: Senior Panel. Expect strategic framing, crisp business logic, and executive-level communication. Score accordingly.'
      : 'EVALUATION BAR: Standard PM interview expectations.';

  const intendedStory = intendedStoryId
    ? stories.find((s) => s.id === intendedStoryId)
    : null;

  const storyContext = intendedStory
    ? `\n## Intended Story (candidate selected this as their intended example)
"${intendedStory.title}"
Ownership: ${intendedStory.ownership}
Coaching note: ${intendedStory.strengthNotes}`
    : '';

  const retryContext = previousEvaluation
    ? `\n## Previous Attempt (this is attempt ${previousEvaluation.attemptNumber + 1})
Previous overall score: ${previousEvaluation.overallScore.toFixed(1)}
Previous weaknesses: ${previousEvaluation.recurringWeaknessTags.join(', ')}
Previous feedback summary: ${previousEvaluation.writtenFeedback.slice(0, 300)}...

Your job now: evaluate whether the candidate applied the feedback. Lead with what changed — improved or regressed. Do not re-explain problems that were resolved.`
    : '';

  const truncationNote = inputTruncated
    ? '\n## IMPORTANT: The transcript was cut off by the recording time limit. Evaluate what was said but note in writtenFeedback that the answer may be incomplete.'
    : '';

  return `You are a sharp PM interview coach. Your voice: editor who respects the writer — specific, honest, useful. Not a rubric that docks points.
${difficultyNote}${storyContext}${retryContext}${truncationNote}

## Question
"${question.questionText}"
Type: ${question.questionType}

## Candidate's Answer
${answer}

${assembleCandidateContext(profile, stories)}

## Scoring Rubric (1–5)
${dimensionList}

Scale:
1 = Not yet present
2 = Early stage — recognizable intent, not landing
3 = Functional — gets the point across but leaves value on the table
4 = Strong — clear, specific, lands well
5 = Exemplary — would stand out in the room

## Evaluation Voice Rules
- Lead with what worked. Name specific moments or phrases that were effective before addressing gaps.
- Frame weaknesses as packaging problems when that's what they are. "Three strong ideas competing for airtime" not "Rambling, Weak Structure."
- Never use verdict language: "this answer did not land", "the core failure is", "disqualifying", "poor answer."
- If the question itself was compound (multiple asks), acknowledge that before scoring structure.
- For each dimension where it adds clarity, quote a short excerpt from the transcript that explains the score. Don't force excerpts on every metric.
- When a stronger story from the bank exists, name it by title and say specifically why.
- Be specific about what to fix, not just that something is wrong.

Recurring packaging issue tags (list all that apply):
rambling, vague-outcome, missing-metrics, weak-structure, missing-decision-logic, poor-prioritization-logic, no-business-framing, overuse-of-same-story, too-technical, not-technical-enough, missing-ownership, generic-language, weak-opener, no-clear-result

Return ONLY valid JSON:
{
  "scoresByDimension": [
    { "dimension": "relevance", "score": 3, "comment": "specific comment", "excerpt": "optional quoted passage or null" },
    { "dimension": "structure", "score": 3, "comment": "specific comment", "excerpt": null },
    { "dimension": "specificity", "score": 3, "comment": "specific comment", "excerpt": "optional" },
    { "dimension": "product-judgment", "score": 3, "comment": "specific comment", "excerpt": null },
    { "dimension": "technical-fluency", "score": 3, "comment": "specific comment", "excerpt": null },
    { "dimension": "business-framing", "score": 3, "comment": "specific comment", "excerpt": null },
    { "dimension": "metrics-outcomes", "score": 3, "comment": "specific comment", "excerpt": null },
    { "dimension": "conciseness", "score": 3, "comment": "specific comment", "excerpt": null },
    { "dimension": "credibility", "score": 3, "comment": "specific comment", "excerpt": null }
  ],
  "overallScore": 3.0,
  "writtenFeedback": "2-4 paragraphs: lead with what worked, then specific packaging issues, then the move to fix it",
  "strongerStorySuggestion": "story title or null",
  "recurringWeaknessTags": []
}`;
}

// ─── Rewrite (Change 7 — tiered compression) ─────────────────────────────────

const TIER_INSTRUCTIONS: Record<string, string> = {
  core: 'Rewrite in 60–80 words. Keep ONLY: the situation in one clause, the specific decision or action, the outcome. Cut everything else. Prove what\'s load-bearing.',
  full: 'Rewrite in ~150 words. Include: situation (1-2 sentences), your specific role and what you owned, the key decision with brief rationale, the outcome with at least one metric or concrete signal. No setup, no hedging.',
  detailed: 'Rewrite at current length but tighten and restructure. Remove padding, repetition, and scaffolding. Impose clear structure. No word limit but earn every sentence.',
  'more-executive': 'Lead with the business outcome or decision in the first sentence. Keep technical detail minimal — just enough to be credible. Sound like a PM presenting to a VP.',
  'more-metrics-driven': 'Surface every metric, proof point, or before/after signal available from the candidate\'s background. Frame with directional language where precision isn\'t available ("reduced by roughly half", "meaningfully faster"). Don\'t fabricate specifics.',
  'more-technical-accessible': 'Show genuine PM-level technical understanding. Name the system components, the tradeoffs, the failure modes — at the depth a smart non-engineer would. Don\'t pretend to be an engineer.',
  // Legacy
  tighter: 'Rewrite to be 40–50% shorter. Cut scaffolding, remove repetition, keep every signal.',
  'more-structured': 'Impose clear structure: situation → decision and rationale → result. Clean transitions.',
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

  const instruction = TIER_INSTRUCTIONS[mode] ?? TIER_INSTRUCTIONS['full'];

  return `You are a PM interview coach rewriting a candidate's answer.

## Question
"${question.questionText}"

## Original Answer
${originalAnswer}

## Rewrite Instruction
${instruction}

## Previous Evaluation
${evaluation.writtenFeedback}

${assembleCandidateContext(profile, stories)}

## Hard Rules
- Every claim must be traceable to the candidate's documented background. Do NOT fabricate experience, metrics, or ownership.
- Do not turn the candidate into a software engineer.
- Clearly distinguish what was owned vs. supported vs. adjacent.
- Keep the voice natural — this should sound like the candidate speaking, not a polished essay.
- NEVER reference "calibration" as something the candidate owned or performed. The candidate designed workflows around calibration challenges but did not perform calibration.
- If the rewrite includes a metric not present in the original answer or background, flag it clearly as "[added — verify]".

Return ONLY valid JSON:
{
  "rewrittenAnswer": "The full rewritten answer",
  "wordCount": 95,
  "changesSummary": ["bullet 1: specific change and why", "bullet 2", "bullet 3"]
}`;
}

// ─── Session summary (Change 6 — tone) ───────────────────────────────────────

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

  return `You are a senior PM interview coach producing a session debrief. Be honest and specific. Lead each section with what worked before addressing gaps. Frame improvement areas as articulation opportunities — the candidate knows the material; the issue is packaging.

## Session Context
Role: ${config.roleLabel || 'Product Manager'} at ${config.companyLabel || 'the company'}
Questions: ${questions.length}
Difficulty: ${config.difficulty}

## Candidate's Known Weaknesses
${profile.knownWeaknesses.map((w) => `- ${w}`).join('\n')}

## Full Session Transcript
${JSON.stringify(transcript, null, 2)}

## Instructions
Produce an honest, useful session debrief. Include what actually worked and where the packaging broke.
- For topStrengths: Name specific moments, not generic traits
- For topRisks: Frame as "tends to X" not "failed at Y"
- For nextActions: Specific, actionable practice items — not "practice being more concise"

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
