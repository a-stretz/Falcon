import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { QUESTION_TYPE_LABELS } from '../lib/prompts';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ScoreBadge, ScoreBar } from '../components/ui/ScoreBar';
import { EvaluationPanel } from '../components/session/EvaluationPanel';
import { rewriteAnswer } from '../lib/claude';
import { buildDefaultProfile, buildDefaultStories } from '../lib/defaultData';
import type { RewriteMode, EvalDimension } from '../types';

const WEAKNESS_LABELS: Record<string, string> = {
  rambling: 'Rambling',
  'vague-outcome': 'Vague Outcome',
  'missing-metrics': 'Missing Metrics',
  'weak-structure': 'Weak Structure',
  'missing-decision-logic': 'No Decision Logic',
  'poor-prioritization-logic': 'Weak Prioritization',
  'no-business-framing': 'No Business Framing',
  'overuse-of-same-story': 'Overusing Same Story',
  'too-technical': 'Too Technical',
  'not-technical-enough': 'Not Technical Enough',
  'missing-ownership': 'Missing Ownership',
  'generic-language': 'Generic Language',
  'weak-opener': 'Weak Opener',
  'no-clear-result': 'No Clear Result',
};

const DIMENSION_LABELS: Record<EvalDimension, string> = {
  relevance: 'Relevance',
  structure: 'Structure',
  specificity: 'Specificity',
  'product-judgment': 'Product Judgment',
  'technical-fluency': 'Technical Fluency',
  'business-framing': 'Business Framing',
  'metrics-outcomes': 'Metrics / Outcomes',
  conciseness: 'Conciseness',
  credibility: 'Credibility',
};

export function ReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const {
    sessions, questions: allQuestions, evaluations: allEvaluations,
    summaries, settings, profile, stories, addRewriteVariant,
  } = useAppStore();

  const effectiveProfile = profile ?? buildDefaultProfile();
  const effectiveStories = stories.length > 0 ? stories : buildDefaultStories();

  const session = sessions.find((s) => s.id === sessionId);
  const sessionQuestions = allQuestions[sessionId!] ?? [];
  const sessionEvaluations = allEvaluations[sessionId!] ?? [];
  const summary = summaries[sessionId!];

  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [rewriteLoadingId, setRewriteLoadingId] = useState<string | null>(null);
  const [rewriteEvals, setRewriteEvals] = useState<Record<string, typeof sessionEvaluations[0]>>({});

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Session not found.</p>
      </div>
    );
  }

  async function handleRewrite(evalId: string, mode: RewriteMode) {
    const ev = sessionEvaluations.find((e) => e.id === evalId) ?? rewriteEvals[evalId];
    const q = sessionQuestions.find((q) => q.id === ev?.questionId);
    if (!ev || !q) return;

    setRewriteLoadingId(evalId);
    try {
      const variant = await rewriteAnswer({
        apiKey: settings.anthropicApiKey,
        question: q,
        originalAnswer: ev.responseText,
        mode,
        evaluation: ev,
        profile: effectiveProfile,
        stories: effectiveStories,
      });
      addRewriteVariant(evalId, variant);
      const updated = { ...ev, rewriteVariants: [...ev.rewriteVariants, variant] };
      setRewriteEvals((prev) => ({ ...prev, [evalId]: updated }));
    } finally {
      setRewriteLoadingId(null);
    }
  }

  // Compute average scores per dimension
  const dimensionAverages: Partial<Record<EvalDimension, number>> = {};
  if (sessionEvaluations.length > 0) {
    const dims = sessionEvaluations[0].scoresByDimension.map((d) => d.dimension as EvalDimension);
    for (const dim of dims) {
      const scores = sessionEvaluations.map((ev) => {
        const d = ev.scoresByDimension.find((d) => d.dimension === dim);
        return d?.score ?? 0;
      });
      dimensionAverages[dim] = scores.reduce((a, b) => a + b, 0) / scores.length;
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">F</div>
          <span className="text-zinc-300 font-medium">Session Review</span>
          <span className="text-zinc-500 text-sm">
            {session.config.companyLabel} — {session.config.roleLabel}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
            All Sessions
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/')}>
            New Session
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Summary banner */}
        {summary ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overall score */}
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col items-center justify-center">
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide">Session Score</p>
              <div className="text-4xl font-mono font-bold text-zinc-100">
                {summary.overallSessionScore.toFixed(1)}
              </div>
              <div className="text-xs text-zinc-500 mt-1">out of 5.0</div>
            </div>

            {/* Strengths */}
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
              <p className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wide">
                Top Strengths
              </p>
              <ul className="space-y-1.5">
                {summary.topStrengths.slice(0, 4).map((s, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5 shrink-0">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Risks */}
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
              <p className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wide">
                Top Risks
              </p>
              <ul className="space-y-1.5">
                {summary.topRisks.slice(0, 4).map((r, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 shrink-0">!</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
            <p className="text-zinc-400 text-sm">Session summary unavailable.</p>
          </div>
        )}

        {/* Dimension averages */}
        {Object.keys(dimensionAverages).length > 0 && (
          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
            <p className="text-sm font-medium text-zinc-300 mb-4">Scores by Dimension (Session Average)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.entries(dimensionAverages) as [EvalDimension, number][]).map(([dim, avg]) => (
                <div key={dim} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 w-36 shrink-0">
                    {DIMENSION_LABELS[dim]}
                  </span>
                  <ScoreBar score={avg} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recurring problems */}
        {summary?.recurringProblems && summary.recurringProblems.length > 0 && (
          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
            <p className="text-sm font-medium text-zinc-300 mb-3">Recurring Issues</p>
            <div className="flex flex-wrap gap-2">
              {summary.recurringProblems.map((p) => (
                <Badge key={p} variant="warning">{WEAKNESS_LABELS[p] ?? p}</Badge>
              ))}
            </div>
            {summary.storyUsageReview && (
              <p className="text-sm text-zinc-400 mt-3 leading-relaxed">{summary.storyUsageReview}</p>
            )}
          </div>
        )}

        {/* Next actions */}
        {summary?.nextActions && summary.nextActions.length > 0 && (
          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
            <p className="text-sm font-medium text-zinc-300 mb-3">Next 3–5 Things to Practice</p>
            <ol className="space-y-2">
              {summary.nextActions.map((a, i) => (
                <li key={i} className="text-sm text-zinc-300 flex items-start gap-3">
                  <span className="font-mono text-indigo-400 shrink-0">{i + 1}.</span>
                  {a}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Q&A transcript */}
        <div>
          <p className="text-sm font-medium text-zinc-300 mb-4">Full Transcript</p>
          <div className="space-y-3">
            {sessionQuestions.map((q, idx) => {
              const ev = rewriteEvals[sessionEvaluations.find((e) => e.questionId === q.id)?.id ?? '']
                ?? sessionEvaluations.find((e) => e.questionId === q.id);
              const isExpanded = activeQuestion === q.id;

              return (
                <div key={q.id} className="border border-zinc-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setActiveQuestion(isExpanded ? null : q.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900/60 hover:bg-zinc-900 transition-colors text-left cursor-pointer"
                  >
                    <span className="text-xs text-zinc-500 shrink-0 w-5">Q{idx + 1}</span>
                    <Badge variant="info">{QUESTION_TYPE_LABELS[q.questionType]}</Badge>
                    <span className="flex-1 text-sm text-zinc-300 truncate">{q.questionText}</span>
                    {ev && <ScoreBadge score={ev.overallScore} />}
                    <span className="text-zinc-600 text-xs ml-1">{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-3 bg-zinc-900/30 space-y-4">
                      <p className="text-sm text-zinc-100 leading-relaxed">{q.questionText}</p>

                      {ev ? (
                        <>
                          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                            <p className="text-xs text-zinc-500 mb-1.5">Your answer</p>
                            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                              {ev.responseText}
                            </p>
                          </div>
                          <EvaluationPanel
                            evaluation={ev}
                            onRequestRewrite={(mode) => handleRewrite(ev.id, mode)}
                            rewriteLoading={rewriteLoadingId === ev.id}
                          />
                        </>
                      ) : (
                        <p className="text-sm text-zinc-500">No answer recorded.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
