import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { buildDefaultProfile } from '../lib/defaultData';
import type { TargetRoleFamily } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';

export function ProfilePage() {
  const navigate = useNavigate();
  const { profile, setProfile, resetToDefaults, settings, updateSettings } = useAppStore();
  const effective = profile ?? buildDefaultProfile();

  const [name, setName] = useState(effective.name);
  const [roleFamily, setRoleFamily] = useState<TargetRoleFamily>(effective.targetRoleFamily);
  const [backgroundSummary, setBackgroundSummary] = useState(effective.backgroundSummary);
  const [positioning, setPositioning] = useState(effective.positioningStatement);
  const [goals, setGoals] = useState(effective.communicationGoals.join('\n'));
  const [weaknesses, setWeaknesses] = useState(effective.knownWeaknesses.join('\n'));
  const [apiKey, setApiKey] = useState(settings.anthropicApiKey);
  const [voiceRate, setVoiceRate] = useState(settings.voiceRate);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setRoleFamily(profile.targetRoleFamily);
      setBackgroundSummary(profile.backgroundSummary);
      setPositioning(profile.positioningStatement);
      setGoals(profile.communicationGoals.join('\n'));
      setWeaknesses(profile.knownWeaknesses.join('\n'));
    }
  }, [profile]);

  function handleSave() {
    const now = new Date().toISOString();
    setProfile({
      ...(profile ?? buildDefaultProfile()),
      name,
      targetRoleFamily: roleFamily,
      backgroundSummary,
      positioningStatement: positioning,
      communicationGoals: goals.split('\n').map((s) => s.trim()).filter(Boolean),
      knownWeaknesses: weaknesses.split('\n').map((s) => s.trim()).filter(Boolean),
      updatedAt: now,
    });
    updateSettings({ anthropicApiKey: apiKey, voiceRate });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-zinc-500 hover:text-zinc-300 text-sm cursor-pointer">
            ← Back
          </button>
          <span className="text-zinc-100 font-medium">Profile & Settings</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => { resetToDefaults(); }}>
            Reset to Defaults
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            {saved ? 'Saved ✓' : 'Save Changes'}
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Identity */}
        <section>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">Identity</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
              <Select
                label="Primary Target Role Family"
                value={roleFamily}
                onChange={(e) => setRoleFamily(e.target.value as TargetRoleFamily)}
              >
                <option value="general-pm">General PM</option>
                <option value="ai-pm">AI PM</option>
                <option value="platform-pm">Platform PM</option>
                <option value="b2b-saas-pm">B2B SaaS PM</option>
                <option value="technical-pm">Technical PM (TPM)</option>
              </Select>
            </div>
            <Input
              label="Positioning Statement"
              value={positioning}
              onChange={(e) => setPositioning(e.target.value)}
              placeholder="1-2 sentence professional positioning"
            />
          </div>
        </section>

        {/* Background summary */}
        <section>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">Background Summary</p>
          <Textarea
            value={backgroundSummary}
            onChange={(e) => setBackgroundSummary(e.target.value)}
            rows={14}
            hint="This is sent to Claude as your background context for every session. Keep it accurate and detailed."
          />
        </section>

        {/* Communication goals */}
        <section>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">Communication Goals</p>
          <Textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            rows={6}
            hint="One goal per line. These inform coaching tone and focus."
          />
        </section>

        {/* Known weaknesses */}
        <section>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">Known Weaknesses</p>
          <Textarea
            value={weaknesses}
            onChange={(e) => setWeaknesses(e.target.value)}
            rows={5}
            hint="One weakness per line. Claude will track and flag these in evaluations."
          />
        </section>

        {/* API + voice settings */}
        <section>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">API & Voice Settings</p>
          <div className="space-y-4">
            <Input
              label="Anthropic API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              hint="Stored in browser localStorage only."
            />
            <div>
              <label className="text-sm font-medium text-zinc-300 block mb-1.5">
                Voice Speech Rate: {voiceRate.toFixed(1)}x
              </label>
              <input
                type="range"
                min={0.8}
                max={1.5}
                step={0.1}
                value={voiceRate}
                onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-zinc-600 mt-1">
                <span>0.8x (slow)</span>
                <span>1.5x (fast)</span>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <Button variant="primary" onClick={handleSave}>
            {saved ? 'Saved ✓' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
