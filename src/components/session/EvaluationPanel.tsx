import { useState } from 'react';
import type { AnswerEvaluation, EvalDimension, RewriteMode } from '../../types';
import { ScoreBar, ScoreBadge } from '../ui/ScoreBar';
import { Badge } from '../ui/Badge';

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

const REWRITE_MODES: { value: RewriteMode; label: string }[] = [
  { value: 'tighter', label: 'Tighter' },
  { value: 'more-structured', label: 'More Structured' },
  { value: 'more-executive', label: 'More Executive' },
  { value: 'more-metrics-driven', label: 'More Metrics-Driven' },
  { value: 'more-technical-accessible', label: 'More Technical' },
];

interface Props {
  evaluation: AnswerEvaluation;
  onRequestRewrite: (mode: RewriteMode) => void;
  rewriteLoading: boolean;
}

export function EvaluationPanel({ evaluation, onRequestRewrite, rewriteLoading }: Props) {
  const [expandedDim, setExpandedDim] = useState<EvalDimension | null>(null);
  const [activeRewrite, setActiveRewrite] = useState<RewriteMode | null>(null);

  const currentRewrite = activeRewrite
    ? evaluation.rewriteVariants.find((v) => v.mode === activeRewrite)
    : null;

  return (
    <div className="space-y-5">
      {/* Overall score */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-300">Overall Score</span>
        <ScoreBadge score={evaluation.overallScore} />
      </div>

      {/* Dimension scores */}
      <div className="space-y-2">
        {evaluation.scoresByDimension.map((dim) => (
          <div key={dim.dimension}>
            <button
              className="w-full flex items-center gap-3 group"
              onClick={() =>
                setExpandedDim((d) => (d === dim.dimension ? null : dim.dimension as EvalDimension))
              }
            >
              <span className="text-xs text-zinc-400 w-32 text-left shrink-0 group-hover:text-zinc-200 transition-colors">
                {DIMENSION_LABELS[dim.dimension as EvalDimension]}
              </span>
              <ScoreBar score={dim.score} size="sm" />
            </button>
            {expandedDim === dim.dimension && (
              <p className="text-xs text-zinc-400 mt-1.5 ml-36 leading-relaxed">
                {dim.comment}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Recurring weaknesses */}
      {evaluation.recurringWeaknessTags.length > 0 && (
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">
            Flags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {evaluation.recurringWeaknessTags.map((tag) => (
              <Badge key={tag} variant="warning">
                {WEAKNESS_LABELS[tag] ?? tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Stronger story suggestion */}
      {evaluation.strongerStorySuggestion && (
        <div className="p-3 bg-amber-900/15 border border-amber-800/40 rounded-lg">
          <p className="text-xs font-medium text-amber-400 mb-1">Stronger story available</p>
          <p className="text-xs text-amber-300/80">{evaluation.strongerStorySuggestion}</p>
        </div>
      )}

      {/* Written feedback */}
      <div>
        <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">
          Coaching
        </p>
        <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {evaluation.writtenFeedback}
        </div>
      </div>

      {/* Better answer / rewrite */}
      <div>
        <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">
          Better Answer
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {REWRITE_MODES.map(({ value, label }) => {
            const hasVariant = evaluation.rewriteVariants.some((v) => v.mode === value);
            const isActive = activeRewrite === value;
            return (
              <button
                key={value}
                onClick={() => {
                  setActiveRewrite(value);
                  if (!hasVariant) onRequestRewrite(value);
                }}
                disabled={rewriteLoading && !hasVariant}
                className={`
                  text-xs px-3 py-1.5 rounded-md border transition-colors
                  ${isActive
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                  }
                  disabled:opacity-40 cursor-pointer
                `}
              >
                {rewriteLoading && isActive && !hasVariant ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    {label}
                  </span>
                ) : (
                  label
                )}
              </button>
            );
          })}
        </div>

        {activeRewrite && currentRewrite && (
          <div className="space-y-3">
            <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-lg">
              <p className="text-sm text-zinc-200 leading-relaxed">{currentRewrite.text}</p>
            </div>
            {currentRewrite.changesSummary && (
              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <p className="text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">
                  What changed
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
                  {currentRewrite.changesSummary}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
