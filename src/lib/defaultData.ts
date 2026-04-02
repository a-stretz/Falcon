import type { CandidateProfile, Story, StoryTag, AppSettings } from '../types';

// ─── Raw imports of bundled data ──────────────────────────────────────────────
import candidateProfileRaw from '../data/candidate-profile.md?raw';
import masterBackgroundRaw from '../data/master-background-summary.md?raw';
import storyVaultRaw from '../data/STAR_VAULT_current.md?raw';

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

// ─── Story Vault parser ───────────────────────────────────────────────────────

function extractSection(block: string, name: string): string {
  // Match **Name:** followed by content up to the next **Word: or --- or end
  const regex = new RegExp(
    `\\*\\*${name}:\\*\\*\\s*([\\s\\S]+?)(?=\\n\\*\\*[A-Z][a-zA-Z ]+:\\*\\*|\\n---\\n|\\n---$|$)`
  );
  const m = block.match(regex);
  return m ? m[1].trim() : '';
}

function inferTags(title: string, situation: string, action: string): StoryTag[] {
  const text = (title + ' ' + situation + ' ' + action).toLowerCase();
  const tags: StoryTag[] = ['execution'];
  if (/\bai\b|llm|model|machine.learning|coaching.engine|coaching.system/.test(text)) tags.push('ai');
  if (/analytics|metric|measurement|biomechanical|performance.data/.test(text)) tags.push('analytics');
  if (/\bqa\b|qualit|validat|diagnostic|forensic|\btest/.test(text)) tags.push('qa');
  if (/stakeholder|cross.functional|align|multi.team/.test(text)) tags.push('cross-functional');
  if (/user.trust|trust|error.state|confidence|reliability|transparency/.test(text)) tags.push('user-trust');
  if (/strateg|vision|transform|platform.scal/.test(text)) tags.push('strategy');
  if (/data.pipeline|annotation|label|training.data/.test(text)) tags.push('data-quality');
  if (/feedback|coaching.cue|verbosity|tone.calibration/.test(text)) tags.push('feedback-systems');
  if (/operational|onsite|deploy|field.environment|hardware/.test(text)) tags.push('operations');
  if (/translat|interpret|convert.complex|technical.spec/.test(text)) tags.push('technical-translation');
  if (/conflict|dispute|disagree|recurring/.test(text)) tags.push('conflict');
  if (/\blaunch\b|mvp|0.to.1|from.scratch|new.product/.test(text)) tags.push('launch');
  if (/gtm|marketplace|bounty|ecommerce|e.commerce|distribution/.test(text)) tags.push('gtm');
  if (/compli|regulat|audit|privacy/.test(text)) tags.push('ambiguity');
  if (/prioritiz|tradeoff|roadmap/.test(text)) tags.push('prioritization');
  return [...new Set(tags)] as StoryTag[];
}

function parseStoryVault(raw: string): Story[] {
  const now = new Date().toISOString();

  // Split on story headings — keep the heading in each chunk
  const chunks = raw.split(/(?=^### Story \d+:)/m).filter((c) => c.trimStart().startsWith('### Story'));

  return chunks.map((block) => {
    const titleLine = block.match(/^### Story (\d+): (.+?)(?:\s*\([^)]*\))?\s*\n/);
    if (!titleLine) return null;

    const num = String(titleLine[1]).padStart(3, '0');
    const title = titleLine[2].trim();

    const situation = extractSection(block, 'Situation');
    const task = extractSection(block, 'Task');
    const action = extractSection(block, 'Action');
    const result = extractSection(block, 'Result');
    const debrief = extractSection(block, 'Debrief');

    return {
      id: `vault-${num}`,
      candidateId: 'default-profile',
      title,
      context: situation,
      ownership: task,
      actions: action,
      result,
      metrics: '',
      tags: inferTags(title, situation, action),
      strengthNotes: debrief,
      risks: '',
      createdAt: now,
      updatedAt: now,
    } satisfies Story;
  }).filter((s): s is Story => s !== null);
}

export function buildDefaultStories(): Story[] {
  return parseStoryVault(storyVaultRaw);
}

export const DEFAULT_SETTINGS: AppSettings = {
  anthropicApiKey: '',
  defaultInteractionMode: 'typed',
  voiceRate: 1.0,
  selectedVoiceURI: '',
};
