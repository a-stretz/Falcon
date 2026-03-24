import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ScoreBadge } from '../components/ui/ScoreBar';

const DIFFICULTY_LABELS = {
  standard: 'Standard',
  tough: 'Tough',
  'senior-panel': 'Senior Panel',
};

export function HistoryPage() {
  const navigate = useNavigate();
  const { sessions, evaluations: allEvaluations, questions: allQuestions, summaries } = useAppStore();

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-zinc-500 hover:text-zinc-300 text-sm cursor-pointer">
            ← Back
          </button>
          <span className="text-zinc-100 font-medium">Session History</span>
          <Badge variant="default">{sessions.length} sessions</Badge>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/')}>
          New Session
        </Button>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-500 mb-4">No sessions yet.</p>
            <Button variant="primary" onClick={() => navigate('/')}>Start Your First Session</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((session) => {
              const qs = allQuestions[session.id] ?? [];
              const evs = allEvaluations[session.id] ?? [];
              const summary = summaries[session.id];
              const avgScore = evs.length > 0
                ? evs.reduce((a, b) => a + b.overallScore, 0) / evs.length
                : null;

              const date = new Date(session.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              });

              // Collect all recurring weaknesses
              const allWeaknesses = evs.flatMap((e) => e.recurringWeaknessTags);
              const topWeakness = allWeaknesses.length > 0
                ? Object.entries(
                    allWeaknesses.reduce<Record<string, number>>((acc, w) => {
                      acc[w] = (acc[w] ?? 0) + 1;
                      return acc;
                    }, {})
                  ).sort(([, a], [, b]) => b - a)[0][0]
                : null;

              return (
                <div
                  key={session.id}
                  className="border border-zinc-800 rounded-xl overflow-hidden"
                >
                  <div className="px-4 py-4 bg-zinc-900/60 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium text-zinc-100">
                          {session.config.companyLabel || 'Unknown Company'}
                        </span>
                        <span className="text-zinc-500 text-sm">—</span>
                        <span className="text-sm text-zinc-300">
                          {session.config.roleLabel || 'Product Manager'}
                        </span>
                        <Badge
                          variant={session.status === 'completed' ? 'success' : session.status === 'active' ? 'info' : 'default'}
                        >
                          {session.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-zinc-500">{date}</span>
                        <span className="text-xs text-zinc-600">•</span>
                        <span className="text-xs text-zinc-500">
                          {qs.length}/{session.config.sessionLength} questions
                        </span>
                        <span className="text-xs text-zinc-600">•</span>
                        <Badge variant="default">
                          {DIFFICULTY_LABELS[session.config.difficulty]}
                        </Badge>
                        {topWeakness && (
                          <>
                            <span className="text-xs text-zinc-600">•</span>
                            <Badge variant="warning">{topWeakness}</Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {avgScore !== null && <ScoreBadge score={avgScore} />}
                      {summary ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/review/${session.id}`)}
                        >
                          Review
                        </Button>
                      ) : session.status === 'active' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/session/${session.id}`)}
                        >
                          Resume
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/review/${session.id}`)}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Next actions preview from summary */}
                  {summary?.nextActions && summary.nextActions.length > 0 && (
                    <div className="px-4 py-2 bg-zinc-900/20 border-t border-zinc-800/50">
                      <p className="text-xs text-zinc-600 mb-1">Top action item:</p>
                      <p className="text-xs text-zinc-400">{summary.nextActions[0]}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
