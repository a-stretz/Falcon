interface ScoreBarProps {
  score: number; // 1–5
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

function scoreColor(score: number): string {
  if (score >= 4.5) return 'bg-emerald-500';
  if (score >= 3.5) return 'bg-blue-500';
  if (score >= 2.5) return 'bg-amber-500';
  return 'bg-red-500';
}

export function ScoreBar({ score, max = 5, showLabel = true, size = 'md' }: ScoreBarProps) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  const h = size === 'sm' ? 'h-1' : 'h-1.5';

  return (
    <div className="flex items-center gap-2 w-full">
      <div className={`flex-1 bg-zinc-800 rounded-full overflow-hidden ${h}`}>
        <div
          className={`${h} rounded-full transition-all ${scoreColor(score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-zinc-400 w-6 text-right">
          {score.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 4.5
      ? 'text-emerald-400 bg-emerald-900/30 border-emerald-800'
      : score >= 3.5
      ? 'text-blue-400 bg-blue-900/30 border-blue-800'
      : score >= 2.5
      ? 'text-amber-400 bg-amber-900/30 border-amber-800'
      : 'text-red-400 bg-red-900/30 border-red-800';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-mono font-semibold border ${color}`}>
      {score.toFixed(1)}
    </span>
  );
}
