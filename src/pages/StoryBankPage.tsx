import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { buildDefaultStories } from '../lib/defaultData';
import type { Story, StoryTag } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';

const ALL_TAGS: StoryTag[] = [
  'strategy','roadmap','prioritization','execution','analytics','qa','ai',
  'technical-translation','ambiguity','stakeholder-alignment','failure','conflict',
  'launch','customer-discovery','gtm','operations','feedback-systems','data-quality',
  'user-trust','cross-functional',
];

const EMPTY_STORY: Omit<Story, 'id' | 'candidateId' | 'createdAt' | 'updatedAt'> = {
  title: '',
  context: '',
  ownership: '',
  actions: '',
  result: '',
  metrics: '',
  tags: [],
  strengthNotes: '',
  risks: '',
};

export function StoryBankPage() {
  const navigate = useNavigate();
  const { stories, addStory, updateStory, deleteStory, resetToDefaults } = useAppStore();
  const effectiveStories = stories.length > 0 ? stories : buildDefaultStories();

  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<Omit<Story, 'id' | 'candidateId' | 'createdAt' | 'updatedAt'>>(EMPTY_STORY);
  const [search, setSearch] = useState('');

  function startEdit(story: Story) {
    setEditingId(story.id);
    setForm({
      title: story.title,
      context: story.context,
      ownership: story.ownership,
      actions: story.actions,
      result: story.result,
      metrics: story.metrics,
      tags: story.tags,
      strengthNotes: story.strengthNotes,
      risks: story.risks,
    });
  }

  function startNew() {
    setEditingId('new');
    setForm(EMPTY_STORY);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_STORY);
  }

  function saveEdit() {
    if (!form.title.trim()) return;
    if (editingId === 'new') {
      addStory(form);
    } else if (editingId) {
      updateStory(editingId, form);
    }
    cancelEdit();
  }

  function toggleTag(tag: StoryTag) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }

  const filtered = effectiveStories.filter((s) =>
    !search || s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.tags.some((t) => t.includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-zinc-500 hover:text-zinc-300 text-sm cursor-pointer">
            ← Back
          </button>
          <span className="text-zinc-100 font-medium">Story Bank</span>
          <Badge variant="default">{effectiveStories.length} stories</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => { resetToDefaults(); }}>
            Reset to Defaults
          </Button>
          <Button variant="primary" size="sm" onClick={startNew}>
            + Add Story
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Search */}
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stories by title or tag…"
          className="mb-6"
        />

        {/* New/Edit form */}
        {editingId && (
          <div className="mb-6 p-5 bg-zinc-900 border border-indigo-800/50 rounded-xl space-y-4">
            <p className="text-sm font-medium text-zinc-200">
              {editingId === 'new' ? 'New Story' : 'Edit Story'}
            </p>
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. SmartPlayer — Turning Model Outputs into User-Facing Analysis"
            />
            <Textarea
              label="Context"
              value={form.context}
              onChange={(e) => setForm((f) => ({ ...f, context: e.target.value }))}
              placeholder="What was the situation or background?"
              rows={3}
            />
            <Textarea
              label="What You Owned"
              value={form.ownership}
              onChange={(e) => setForm((f) => ({ ...f, ownership: e.target.value }))}
              placeholder="Be specific about your ownership scope"
              rows={2}
            />
            <Textarea
              label="Actions"
              value={form.actions}
              onChange={(e) => setForm((f) => ({ ...f, actions: e.target.value }))}
              placeholder="What did you specifically do?"
              rows={4}
            />
            <Textarea
              label="Result"
              value={form.result}
              onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
              placeholder="What was the outcome?"
              rows={2}
            />
            <Input
              label="Metrics / Proof Points"
              value={form.metrics}
              onChange={(e) => setForm((f) => ({ ...f, metrics: e.target.value }))}
              placeholder="Any measurable impact or concrete evidence"
            />
            <div>
              <p className="text-sm font-medium text-zinc-300 mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`
                      text-xs px-2 py-1 rounded border transition-colors cursor-pointer
                      ${form.tags.includes(tag)
                        ? 'bg-indigo-700 border-indigo-600 text-white'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                      }
                    `}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <Input
              label="Strength Notes"
              value={form.strengthNotes}
              onChange={(e) => setForm((f) => ({ ...f, strengthNotes: e.target.value }))}
              placeholder="When is this story most useful?"
            />
            <Input
              label="Risks / Limitations"
              value={form.risks}
              onChange={(e) => setForm((f) => ({ ...f, risks: e.target.value }))}
              placeholder="What to watch out for when using this story"
            />
            <div className="flex gap-2 pt-2">
              <Button variant="primary" onClick={saveEdit} disabled={!form.title.trim()}>
                Save
              </Button>
              <Button variant="ghost" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Story list */}
        <div className="space-y-3">
          {filtered.map((story) => (
            <div key={story.id} className="border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-zinc-900/60 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{story.title}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {story.tags.slice(0, 5).map((t) => (
                      <Badge key={t} variant="default">{t}</Badge>
                    ))}
                    {story.tags.length > 5 && (
                      <Badge variant="default">+{story.tags.length - 5}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(story)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this story?')) deleteStory(story.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <div className="px-4 py-3 bg-zinc-900/20 space-y-1.5">
                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{story.context}</p>
                {story.result && (
                  <p className="text-xs text-zinc-400">
                    <span className="text-zinc-600">Result: </span>{story.result}
                  </p>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-zinc-500 text-sm text-center py-8">No stories match your search.</p>
          )}
        </div>
      </div>
    </div>
  );
}
