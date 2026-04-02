import { useState } from 'react';
import type { EditorialMarkup, MarkupAction, MarkupSpan } from '../../types';

// Change 1: color mapping per action
const ACTION_STYLES: Record<MarkupAction, { bg: string; text: string; border: string; label: string }> = {
  KEEP:     { bg: 'bg-emerald-900/20',  text: 'text-emerald-200',  border: 'border-emerald-800/40',  label: 'Keep' },
  CUT:      { bg: 'bg-red-900/20',      text: 'text-red-300/60',   border: 'border-red-800/30',       label: 'Cut' },
  COMPRESS: { bg: 'bg-amber-900/20',    text: 'text-amber-200',    border: 'border-amber-800/40',     label: 'Compress' },
  REORDER:  { bg: 'bg-blue-900/20',     text: 'text-blue-200',     border: 'border-blue-800/40',      label: 'Reorder' },
  UPGRADE:  { bg: 'bg-violet-900/20',   text: 'text-violet-200',   border: 'border-violet-800/40',    label: 'Upgrade' },
  PIVOT:    { bg: 'bg-zinc-800/60',     text: 'text-zinc-300',     border: 'border-zinc-600/40',      label: 'Pivot' },
};

interface SpanTooltipProps {
  span: MarkupSpan;
}

function SpanTooltip({ span }: SpanTooltipProps) {
  const [show, setShow] = useState(false);
  const style = ACTION_STYLES[span.action];

  return (
    <span className="relative inline">
      <span
        className={`
          inline cursor-pointer rounded-sm px-0.5 transition-all
          ${style.bg} ${style.text}
          ${span.action === 'CUT' ? 'line-through opacity-60' : ''}
        `}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow((v) => !v)}
      >
        {span.text}
      </span>
      {show && (
        <span className={`
          absolute bottom-full left-0 z-10 mb-1.5 w-64 rounded-lg p-2.5
          bg-zinc-900 border ${style.border} shadow-xl text-xs
        `}>
          <span className={`block font-semibold mb-1 ${style.text}`}>{style.label}</span>
          <span className="block text-zinc-400 leading-relaxed">{span.note}</span>
          {span.replacement && (
            <span className="block mt-1.5 text-zinc-300 italic">→ {span.replacement}</span>
          )}
          {span.reorderNote && (
            <span className="block mt-1.5 text-blue-300">Move to: {span.reorderNote}</span>
          )}
          {span.pivotType && (
            <span className={`block mt-1 font-medium ${span.pivotType === 'productive' ? 'text-emerald-400' : 'text-red-400'}`}>
              {span.pivotType === 'productive' ? 'Productive pivot' : 'Derailing pivot'}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

// Legend row
function LegendItem({ action }: { action: MarkupAction }) {
  const style = ACTION_STYLES[action];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

interface Props {
  markup: EditorialMarkup;
  onProceed: () => void;
  proceedLabel?: string;
}

export function MarkupPanel({ markup, onProceed, proceedLabel = 'Score this answer' }: Props) {
  const [view, setView] = useState<'annotated' | 'clean'>('annotated');
  const cutCount = markup.spans.filter((s) => s.action === 'CUT').length;
  const compressCount = markup.spans.filter((s) => s.action === 'COMPRESS').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">Editorial Review</h3>
        <div className="flex gap-1 p-0.5 bg-zinc-800 rounded-lg">
          <button
            onClick={() => setView('annotated')}
            className={`text-xs px-3 py-1 rounded-md transition-colors ${view === 'annotated' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Annotated
          </button>
          <button
            onClick={() => setView('clean')}
            className={`text-xs px-3 py-1 rounded-md transition-colors ${view === 'clean' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Clean version
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(ACTION_STYLES) as MarkupAction[]).map((a) => (
          <LegendItem key={a} action={a} />
        ))}
        <span className="text-[10px] text-zinc-600 self-center ml-1">hover/tap spans for details</span>
      </div>

      {/* Stats */}
      {(cutCount > 0 || compressCount > 0) && (
        <div className="flex gap-3 text-xs text-zinc-500">
          {cutCount > 0 && <span>{cutCount} cut{cutCount > 1 ? 's' : ''} suggested</span>}
          {compressCount > 0 && <span>{compressCount} compress{compressCount > 1 ? 'es' : ''} suggested</span>}
        </div>
      )}

      {/* Transcript */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg leading-7 text-sm">
        {view === 'annotated' ? (
          <p>
            {markup.spans.map((span, i) => (
              <SpanTooltip key={i} span={span} />
            ))}
          </p>
        ) : (
          <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">{markup.cleanVersion}</p>
        )}
      </div>

      {/* Missing elements */}
      {markup.missingElements.length > 0 && (
        <div className="p-3 bg-zinc-900/50 border border-zinc-700 rounded-lg">
          <p className="text-xs font-semibold text-zinc-400 mb-2">Not addressed</p>
          <ul className="space-y-1">
            {markup.missingElements.map((m, i) => (
              <li key={i} className="text-xs text-zinc-500 flex items-start gap-2">
                <span className="text-zinc-600 shrink-0 mt-0.5">—</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Proceed button */}
      <button
        onClick={onProceed}
        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {proceedLabel}
      </button>
    </div>
  );
}
