import type { CandidateProfile, Story, AppSettings } from '../types';

// ─── Raw imports of bundled data ──────────────────────────────────────────────
import candidateProfileRaw from '../data/candidate-profile.md?raw';
import masterBackgroundRaw from '../data/master-background-summary.md?raw';
import storyBankRaw from '../data/story-bank.json';

export const DEFAULT_BACKGROUND_SUMMARY = masterBackgroundRaw;
export const DEFAULT_PROFILE_RAW = candidateProfileRaw;

export function buildDefaultProfile(): CandidateProfile {
  const now = new Date().toISOString();
  return {
    id: 'default-profile',
    name: 'Candidate',
    targetRoleFamily: 'ai-pm',
    backgroundSummary: masterBackgroundRaw,
    communicationGoals: [
      'Be crisper and more structured in answers',
      'Lead with the decision or outcome, not the setup',
      'Use real examples with specifics rather than general PM language',
      'Maintain stronger business framing throughout',
      'Cite metrics and proof points where available',
      'Avoid rambling and over-explaining context',
    ],
    knownWeaknesses: [
      'Tendency to over-contextualize before getting to the point',
      'Sometimes uses weaker story examples when stronger ones exist',
      'Business outcome framing can be underdeveloped',
      'Metrics can be vague or absent even when they exist',
      'Occasional use of generic PM language',
    ],
    answerStylePreference: 'Direct, structured, specific. Sound like a PM who has done the work.',
    positioningStatement:
      'Product Manager with unusual depth in AI-adjacent product work, especially where product, data, model behavior, operational workflows, and user trust intersect.',
    createdAt: now,
    updatedAt: now,
  };
}

export function buildDefaultStories(): Story[] {
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (storyBankRaw as any[]).map((s: any) => ({
    ...s,
    candidateId: 'default-profile',
    createdAt: now,
    updatedAt: now,
  })) as Story[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  anthropicApiKey: '',
  defaultInteractionMode: 'typed',
  voiceRate: 1.0,
  selectedVoiceURI: '',
};
