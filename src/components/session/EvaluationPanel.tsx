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

// Change 7: Tier-first rewrite modes
const COMPRESSION_TIERS: { value: RewriteMode; label: string; hint: string }[] = [
  { value: 'core', label: 'Core', hint: '60–80 words' },
  { value: 'full', label: 'Full', hint: '~150 words' },
  { value: 'detailed', label: 'Detailed', hint: 'current length, tightened' },
];

const STYLE_VARIANTS: { value: RewriteMode; label: string }[] = [
  { value: 'more-executive', label: 'More Executive' },
  { value: 'more-metrics-driven', label: 'More Metrics-Driven' },
  { value: 'more-technical-accessible', label: 'More Technical' },
];

interface Props {
  evaluation: AnswerEvaluation;
  onRequestRewrite: (mode: RewriteMode) => void;
  rewriteLoading: boolean;
  previousEvaluation?: AnswerEvaluation | null;
}

export function EvaluationPanel({ evaluation, onRequestRewrite, rewriteLoading, previousEvaluation }: Props) {
  const [expandedDim, setExpandedDim] = useState<EvalDimension | null>(null);
  const [activeRewrite, setActiveRewrite] = useState<RewriteMode | null>(null);

  const currentRewrite = activeRewrite
    ? evaluation.rewriteVariants.find((v) => v.mode === activeRewrite)
    : null;

  const isRetry = evaluation.attemptNumber > 1 && previousEvaluation;

  function scoreDelta(dim: EvalDimension): number | null {
    if (!previousEvaluation) return null;
    const prev = previousEvaluation.scoresByDimension.find((d) => d.dimension === dim);
    const curr = evaluation.scoresByDimension.find((d) => d.dimension === dim);
    if (!prev || !curr) return null;
    return curr.score - prev.score;
  }

  function renderDelta(delta: number | null) {
    if (delta === null || delta === 0) return null;
    return (
      <span className={`text-xs font-mono ml-1 ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {delta > 0 ? `+${delta}` : delta}
      </span>
    );
  }

  function handleRewriteClick(mode: RewriteMode) {
    setActiveRewrite(mode);
    const hasVariant = evaluation.rewriteVariants.some((v) => v.mode === mode);
    if (!hasVariant) onRequestRewrite(mode);
  }

  return (
    <div className="space-y-5">
      {/* Overall score + attempt indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-300">Overall Score</span>
          {isRetry && (
            <span className="text-xs text-zinc-500">
              Attempt {evaluation.attemptNumber}
              {previousEvaluation && (
                <span className={`ml-1 font-mono ${evaluation.overallScore - previousEvaluation.overallScore > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ({evaluation.overallScore - previousEvaluation.overallScore > 0 ? '+' : ''}{(evaluation.overallScore - previousEvaluation.overallScore).toFixed(1)})
                </span>
              )}
            </span>
          )}
        </div>
        <ScoreBadge score={evaluation.overallScore} />
      </div>

      {/* Truncation warning */}
      {evaluation.inputTruncated && (
        <div className="p-2.5 bg-amber-900/20 border border-amber-800/40 rounded-lg">
          <p className="text-xs text-amber-400">Recording reached the 3-minute limit — evaluation based on what was captured.</p>
        </div>
      )}

      {/* Dimension scores */}
      <div className="space-y-2">
        {evaluation.scoresByDimension.map((dim) => {
          const delta = scoreDelta(dim.dimension as EvalDimension);
          return (
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
                {renderDelta(delta)}
              </button>
              {expandedDim === dim.dimension && (
                <div className="mt-1.5 ml-36 space-y-1.5">
                  <p className="text-xs text-zinc-400 leading-relaxed">{dim.comment}</p>
                  {dim.excerpt && (
                    <blockquote className="text-xs text-zinc-500 italic border-l-2 border-zinc-700 pl-2">
                      "{dim.excerpt}"
                    </blockquote>
                  )}
                </div>
              )}
            </div>
          );
        })}
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

      {/* Better answer — Change 7: tier-first rewrite UI */}
      <div>
        <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">
          Better Answer
        </p>

        {/* Compression tiers */}
        <div className="mb-2">
          <p className="text-xs text-zinc-600 mb-1.5">Compression</p>
          <div className="flex gap-2">
            {COMPRESSION_TIERS.map(({ value, label, hint }) => {
              const hasVariant = evaluation.rewriteVariants.some((v) => v.mode === value);
              const isActive = activeRewrite === value;
              return (
                <button
                  key={value}
                  onClick={() => handleRewriteClick(value)}
                  disabled={rewriteLoading && !hasVariant}
                  className={`
                    flex-1 text-xs px-3 py-2 rounded-md border transition-colors text-center
                    ${isActive
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                    }
                    disabled:opacity-40 cursor-pointer
                  `}
                >
                  {rewriteLoading && isActive && !hasVariant ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      {label}
                    </span>
                  ) : (
                    <>
                      <div>{label}</div>
                      <div className="text-zinc-500 text-[10px] mt-0.5">{hint}</div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Style variants */}
        <div>
          <p className="text-xs text-zinc-600 mb-1.5">Style</p>
          <div className="flex flex-wrap gap-2">
            {STYLE_VARIANTS.map(({ value, label }) => {
              const hasVariant = evaluation.rewriteVariants.some((v) => v.mode === value);
              const isActive = activeRewrite === value;
              return (
                <button
                  key={value}
                  onClick={() => handleRewriteClick(value)}
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
        </div>

        {/* Active rewrite display */}
        {activeRewrite && currentRewrite && (
          <div className="space-y-3 mt-3">
            <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-lg">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm text-zinc-200 leading-relaxed">{currentRewrite.text}</p>
              </div>
              {currentRewrite.wordCount != null && (
                <p className="text-xs text-zinc-600 mt-2">{currentRewrite.wordCount} words</p>
              )}
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
