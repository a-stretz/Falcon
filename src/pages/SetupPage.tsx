import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import type { SessionConfig, QuestionStyle, Difficulty, InteractionMode } from '../types';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { buildDefaultProfile, buildDefaultStories } from '../lib/defaultData';

const DEFAULT_CONFIG: SessionConfig = {
  jobDescription: '',
  companyBrief: '',
  roleLabel: '',
  companyLabel: '',
  focusArea: '',
  questionStyle: 'mixed',
  difficulty: 'standard',
  sessionLength: 6,
  interactionMode: 'typed',
  knownWeaknessToTest: '',
  desiredAnswerLength: 'standard',
  interviewStageNotes: '',
};

export function SetupPage() {
  const navigate = useNavigate();
  const { profile, stories, settings, resetToDefaults, createSession, setActiveSession, updateSettings } =
    useAppStore();

  const [config, setConfig] = useState<SessionConfig>(DEFAULT_CONFIG);
  const [apiKey, setApiKey] = useState(settings.anthropicApiKey);
  const [showBackground, setShowBackground] = useState(false);
  const [error, setError] = useState('');

  // Load defaults on first run
  useEffect(() => {
    if (!profile) {
      resetToDefaults();
    }
  }, [profile, resetToDefaults]);

  function handleStartSession() {
    if (!config.jobDescription.trim()) {
      setError('Job description is required to generate relevant questions.');
      return;
    }
    if (!apiKey.trim()) {
      setError('An Anthropic API key is required.');
      return;
    }
    setError('');
    updateSettings({ anthropicApiKey: apiKey });
    const sessionId = createSession(config);
    setActiveSession(sessionId);
    navigate(`/session/${sessionId}`);
  }

  const effectiveProfile = profile ?? buildDefaultProfile();
  const effectiveStories = stories.length > 0 ? stories : buildDefaultStories();

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            F
          </div>
          <span className="text-zinc-100 font-semibold text-lg">Falcon</span>
          <span className="text-zinc-500 text-sm">PM Interview Prep</span>
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
            History
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/storybank')}>
            Story Bank
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
            Profile
          </Button>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100">New Interview Session</h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Paste the job description and company context. Your background and story bank are pre-loaded.
          </p>
        </div>

        {/* API Key */}
        <div className="mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <Input
            label="Anthropic API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            hint="Stored in browser memory only. Never sent to any server other than Anthropic."
          />
        </div>

        {/* Job context — two column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                label="Company"
                value={config.companyLabel}
                onChange={(e) => setConfig((c) => ({ ...c, companyLabel: e.target.value }))}
                placeholder="e.g. Stripe, Databricks, Notion"
                className="flex-1"
              />
              <Input
                label="Role Title"
                value={config.roleLabel}
                onChange={(e) => setConfig((c) => ({ ...c, roleLabel: e.target.value }))}
                placeholder="e.g. AI PM, Platform PM"
                className="flex-1"
              />
            </div>
            <Textarea
              label="Job Description"
              value={config.jobDescription}
              onChange={(e) => setConfig((c) => ({ ...c, jobDescription: e.target.value }))}
              placeholder="Paste the full job description here. The more detail, the more targeted the questions."
              rows={14}
            />
          </div>

          <Textarea
            label="Company / Role Brief"
            value={config.companyBrief}
            onChange={(e) => setConfig((c) => ({ ...c, companyBrief: e.target.value }))}
            placeholder={`Add context about the company, team, stage, product area, or anything relevant to the role.\n\nExamples:\n- Series B, building developer tools for data teams\n- Platform PM overseeing internal tooling\n- Known to ask system design-adjacent questions\n- AI PM leading a new products team`}
            rows={19}
          />
        </div>

        {/* Session configuration */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Select
            label="Question Style"
            value={config.questionStyle}
            onChange={(e) => setConfig((c) => ({ ...c, questionStyle: e.target.value as QuestionStyle }))}
          >
            <option value="mixed">Mixed (Recommended)</option>
            <option value="behavioral">Behavioral</option>
            <option value="execution">Execution</option>
            <option value="prioritization">Prioritization</option>
            <option value="product-sense">Product Sense</option>
            <option value="strategy">Strategy</option>
            <option value="stakeholder">Stakeholder</option>
            <option value="analytical">Analytical</option>
            <option value="technical-collab">Technical Collaboration</option>
            <option value="ai-systems">AI / Systems</option>
          </Select>

          <Select
            label="Difficulty"
            value={config.difficulty}
            onChange={(e) => setConfig((c) => ({ ...c, difficulty: e.target.value as Difficulty }))}
          >
            <option value="standard">Standard</option>
            <option value="tough">Tough (Push on tradeoffs)</option>
            <option value="senior-panel">Senior Panel</option>
          </Select>

          <Select
            label="Session Length"
            value={config.sessionLength}
            onChange={(e) =>
              setConfig((c) => ({ ...c, sessionLength: parseInt(e.target.value, 10) }))
            }
          >
            <option value={3}>3 questions</option>
            <option value={5}>5 questions</option>
            <option value={6}>6 questions</option>
            <option value={8}>8 questions</option>
            <option value={10}>10 questions</option>
          </Select>

          <Select
            label="Interaction Mode"
            value={config.interactionMode}
            onChange={(e) =>
              setConfig((c) => ({ ...c, interactionMode: e.target.value as InteractionMode }))
            }
          >
            <option value="typed">Typed</option>
            <option value="voice">Voice</option>
          </Select>
        </div>

        {/* Optional inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Input
            label="Focus Area (optional)"
            value={config.focusArea}
            onChange={(e) => setConfig((c) => ({ ...c, focusArea: e.target.value }))}
            placeholder="e.g. AI product decisions, prioritization"
          />
          <Input
            label="Known Weakness to Pressure Test (optional)"
            value={config.knownWeaknessToTest}
            onChange={(e) => setConfig((c) => ({ ...c, knownWeaknessToTest: e.target.value }))}
            placeholder="e.g. rambling, weak outcome framing"
          />
          <Input
            label="Interview Stage Notes (optional)"
            value={config.interviewStageNotes}
            onChange={(e) => setConfig((c) => ({ ...c, interviewStageNotes: e.target.value }))}
            placeholder="e.g. Second round with VP of Product"
          />
        </div>

        {/* Candidate data summary (collapsible) */}
        <div className="mb-8 border border-zinc-800 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            onClick={() => setShowBackground((v) => !v)}
          >
            <span className="font-medium">
              Candidate Data — {effectiveStories.length} stories loaded
            </span>
            <span className="text-zinc-500 text-xs">
              {showBackground ? '▲ collapse' : '▼ expand'}
            </span>
          </button>
          {showBackground && (
            <div className="p-4 bg-zinc-900/50 space-y-4">
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">
                  Background Summary
                </p>
                <div className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto border border-zinc-800 rounded-lg p-3 bg-zinc-900">
                  {effectiveProfile.backgroundSummary.slice(0, 600)}...
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => navigate('/profile')}
                >
                  Edit Profile
                </Button>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">
                  Stories in Bank
                </p>
                <div className="flex flex-wrap gap-2">
                  {effectiveStories.map((s) => (
                    <span
                      key={s.id}
                      className="text-xs px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-300"
                    >
                      {s.title.split('—')[0].trim()}
                    </span>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => navigate('/storybank')}
                >
                  Edit Story Bank
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Start button */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-600">
            Questions will be generated using your background, story bank, and the job context above.
          </p>
          <Button variant="primary" size="lg" onClick={handleStartSession}>
            Start Session →
          </Button>
        </div>
      </div>
    </div>
  );
}
