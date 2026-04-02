import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { buildDefaultProfile, buildDefaultStories } from '../lib/defaultData';
import {
  generateQuestion,
  generateEditorialMarkup,
  evaluateAnswer,
  rewriteAnswer,
  generateSessionSummary,
} from '../lib/claude';
import { QUESTION_TYPE_LABELS } from '../lib/prompts';
import type { InterviewQuestion, AnswerEvaluation, RewriteMode, EditorialMarkup } from '../types';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { ScoreBadge } from '../components/ui/ScoreBar';
import { EvaluationPanel } from '../components/session/EvaluationPanel';
import { MarkupPanel } from '../components/session/MarkupPanel';
import { MicButton, MicStateIndicator } from '../components/session/MicButton';
import { useVoice } from '../hooks/useVoice';

type SessionPhase =
  | 'loading-question'
  | 'answering'
  | 'generating-markup'
  | 'markup-review'
  | 'evaluating'
  | 'reviewed'
  | 'session-done';

const MAX_ATTEMPTS = 3;

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const {
    profile, stories, settings,
    sessions, questions: allQuestions, evaluations: allEvaluations,
    addQuestion, addEvaluation, addRewriteVariant, addMarkup, completeSession, setSummary,
    setActiveQuestionIndex,
  } = useAppStore();

  const effectiveProfile = profile ?? buildDefaultProfile();
  const effectiveStories = stories.length > 0 ? stories : buildDefaultStories();

  const session = sessions.find((s) => s.id === sessionId);
  const sessionQuestions = allQuestions[sessionId!] ?? [];
  const sessionEvaluations = allEvaluations[sessionId!] ?? [];

  const [phase, setPhase] = useState<SessionPhase>('loading-question');
  const [answer, setAnswer] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [currentEvaluation, setCurrentEvaluation] = useState<AnswerEvaluation | null>(null);
  const [previousEvaluation, setPreviousEvaluation] = useState<AnswerEvaluation | null>(null);
  const [currentMarkup, setCurrentMarkup] = useState<EditorialMarkup | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [showStoryHints, setShowStoryHints] = useState(false);
  const [inputTruncated, setInputTruncated] = useState(false);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [error, setError] = useState('');
  const [interactionMode, setInteractionMode] = useState(session?.config.interactionMode ?? 'typed');

  const answerRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Voice hook — Change 8: manual stop, 3min max, truncation
  const voice = useVoice({
    onTranscript: (text, truncated) => {
      setAnswer(text);
      setInputTruncated(truncated ?? false);
      setPhase('answering');
    },
  });

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Generate first question on mount
  useEffect(() => {
    if (!session || !sessionId) return;
    if (sessionQuestions.length === 0) {
      loadNextQuestion();
    } else {
      const lastQ = sessionQuestions[sessionQuestions.length - 1];
      setCurrentQuestion(lastQ);
      // Find latest evaluation for last question
      const evals = sessionEvaluations.filter((e) => e.questionId === lastQ.id);
      const lastEval = evals.length > 0
        ? evals.reduce((a, b) => b.attemptNumber >= a.attemptNumber ? b : a)
        : null;
      if (lastEval) {
        setCurrentEvaluation(lastEval);
        setAttemptNumber(lastEval.attemptNumber);
        setPhase('reviewed');
      } else {
        setPhase('answering');
      }
      setActiveQuestionIndex(sessionQuestions.length - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadNextQuestion() {
    if (!session || !sessionId) return;
    setPhase('loading-question');
    setError('');
    setAnswer('');
    setCurrentEvaluation(null);
    setPreviousEvaluation(null);
    setCurrentMarkup(null);
    setAttemptNumber(1);
    setSelectedStoryId(null);
    setShowStoryHints(false);
    setInputTruncated(false);

    try {
      // For conversational mode, pass the last answer
      const lastEvalForConversational = session.config.conversationalMode && sessionEvaluations.length > 0
        ? sessionEvaluations[sessionEvaluations.length - 1]
        : null;

      const q = await generateQuestion({
        apiKey: settings.anthropicApiKey,
        config: session.config,
        profile: effectiveProfile,
        stories: effectiveStories,
        questionsAsked: sessionQuestions,
        sessionId,
        orderIndex: sessionQuestions.length,
        previousAnswer: lastEvalForConversational?.responseText,
      });

      addQuestion(sessionId, q);
      setCurrentQuestion(q);
      setActiveQuestionIndex(sessionQuestions.length);
      setPhase('answering');

      if (interactionMode === 'voice') {
        voice.speak(q.questionText, settings.voiceRate, settings.selectedVoiceURI);
      }

      scrollToBottom();
    } catch (e) {
      setError(`Failed to generate question: ${e instanceof Error ? e.message : String(e)}`);
      setPhase('answering');
    }
  }

  // Submit answer → generate markup first (Change 1)
  async function handleSubmitAnswer() {
    if (!currentQuestion || !sessionId || !answer.trim()) return;
    setPhase('generating-markup');
    setError('');

    try {
      const markup = await generateEditorialMarkup({
        apiKey: settings.anthropicApiKey,
        question: currentQuestion,
        transcript: answer.trim(),
        profile: effectiveProfile,
        stories: effectiveStories,
        sessionId,
        previousMarkup: currentMarkup, // null on attempt 1
      });

      addMarkup(markup);
      setCurrentMarkup(markup);
      setPhase('markup-review');
      scrollToBottom();
    } catch (e) {
      // If markup fails, skip directly to evaluation
      setError(`Markup generation failed — skipping to evaluation. ${e instanceof Error ? e.message : ''}`);
      await runEvaluation();
    }
  }

  // After markup review, evaluate
  async function runEvaluation() {
    if (!currentQuestion || !sessionId) return;
    setPhase('evaluating');
    setError('');

    try {
      const ev = await evaluateAnswer({
        apiKey: settings.anthropicApiKey,
        question: currentQuestion,
        answer: answer.trim(),
        inputMode: interactionMode,
        inputTruncated,
        profile: effectiveProfile,
        stories: effectiveStories,
        sessionId,
        difficulty: session?.config.difficulty,
        intendedStoryId: selectedStoryId ?? undefined,
        previousEvaluation,
        attemptNumber,
        previousAttemptId: previousEvaluation?.id,
      });

      addEvaluation(ev);
      setCurrentEvaluation(ev);
      setPhase('reviewed');
      scrollToBottom();
    } catch (e) {
      setError(`Evaluation failed: ${e instanceof Error ? e.message : String(e)}`);
      setPhase('markup-review');
    }
  }

  // Try Again — Change 4
  function handleTryAgain() {
    if (!currentQuestion) return;
    setPreviousEvaluation(currentEvaluation);
    setCurrentEvaluation(null);
    setCurrentMarkup(null);
    setAttemptNumber((n) => n + 1);
    setAnswer('');
    setSelectedStoryId(null);
    setShowStoryHints(false);
    setInputTruncated(false);
    setPhase('answering');
    scrollToBottom();
  }

  async function handleRewrite(mode: RewriteMode) {
    if (!currentQuestion || !currentEvaluation) return;
    setRewriteLoading(true);

    try {
      const variant = await rewriteAnswer({
        apiKey: settings.anthropicApiKey,
        question: currentQuestion,
        originalAnswer: answer,
        mode,
        evaluation: currentEvaluation,
        profile: effectiveProfile,
        stories: effectiveStories,
      });

      addRewriteVariant(currentEvaluation.id, variant);
      setCurrentEvaluation((ev) =>
        ev ? { ...ev, rewriteVariants: [...ev.rewriteVariants, variant] } : ev
      );
    } catch (e) {
      setError(`Rewrite failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRewriteLoading(false);
    }
  }

  async function handleNextQuestion() {
    if (!session || !sessionId) return;
    const updatedQuestions = allQuestions[sessionId] ?? [];
    if (updatedQuestions.length >= session.config.sessionLength) {
      await handleEndSession();
    } else {
      await loadNextQuestion();
    }
  }

  async function handleEndSession() {
    if (!sessionId || !session) return;
    setPhase('session-done');

    const updatedQuestions = allQuestions[sessionId] ?? [];
    const updatedEvals = allEvaluations[sessionId] ?? [];

    try {
      const summary = await generateSessionSummary({
        apiKey: settings.anthropicApiKey,
        config: session.config,
        questions: updatedQuestions,
        evaluations: updatedEvals,
        profile: effectiveProfile,
        sessionId,
      });
      setSummary(sessionId, summary);
      completeSession(sessionId);
      navigate(`/review/${sessionId}`);
    } catch {
      completeSession(sessionId);
      navigate(`/review/${sessionId}`);
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Session not found.</p>
          <Button onClick={() => navigate('/')}>Back to Setup</Button>
        </div>
      </div>
    );
  }

  const totalQuestions = session.config.sessionLength;
  const currentIndex = (allQuestions[sessionId!] ?? []).length;
  const progress = Math.round((currentIndex / totalQuestions) * 100);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Session Header */}
      <header className="border-b border-zinc-800 px-4 py-3 flex items-center gap-4 sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
        <div className="flex items-center gap-2 mr-2">
          <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">F</div>
          <span className="text-zinc-400 text-xs font-medium">
            {session.config.companyLabel || 'Interview'} — {session.config.roleLabel || 'PM'}
          </span>
        </div>

        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-1 bg-indigo-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500 shrink-0">
            {currentIndex}/{totalQuestions}
          </span>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setInteractionMode('typed')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              interactionMode === 'typed' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Type
          </button>
          <button
            onClick={() => setInteractionMode('voice')}
            disabled={!voice.supported}
            title={!voice.supported ? 'Voice not supported in this browser' : undefined}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 ${
              interactionMode === 'voice' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Voice
          </button>
        </div>

        <Button variant="ghost" size="sm" onClick={handleEndSession}>
          End Session
        </Button>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* Previous Q&A */}
          {sessionQuestions.slice(0, -1).map((q, idx) => {
            const evals = sessionEvaluations.filter((e) => e.questionId === q.id);
            const latestEval = evals.length > 0
              ? evals.reduce((a, b) => b.attemptNumber >= a.attemptNumber ? b : a)
              : undefined;
            return <PastTurn key={q.id} question={q} evaluation={latestEval} index={idx + 1} />;
          })}

          {/* Current question */}
          {currentQuestion && (
            <div>
              {/* Question bubble */}
              <div className="flex gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300 shrink-0 mt-0.5">
                  Q
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs text-zinc-500 font-medium">Question {currentIndex}</span>
                    <Badge variant="info">{QUESTION_TYPE_LABELS[currentQuestion.questionType]}</Badge>
                    {currentQuestion.complexityTag === 'layered' && (
                      <Badge variant="warning">Layered</Badge>
                    )}
                    {currentQuestion.followUpOf && (
                      <Badge variant="purple">Follow-up</Badge>
                    )}
                    {attemptNumber > 1 && (
                      <Badge variant="warning">Attempt {attemptNumber}/{MAX_ATTEMPTS}</Badge>
                    )}
                  </div>
                  <p className="text-zinc-100 text-base leading-relaxed">
                    {currentQuestion.questionText}
                  </p>

                  {/* Change 5: Collapsible story hints */}
                  {currentQuestion.storyHints && currentQuestion.storyHints.length > 0 && (
                    <div className="mt-3">
                      <button
                        onClick={() => setShowStoryHints((v) => !v)}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
                      >
                        <span>{showStoryHints ? '▼' : '▶'}</span>
                        Story hints ({currentQuestion.storyHints.length})
                      </button>
                      {showStoryHints && (
                        <div className="mt-2 space-y-1.5">
                          {currentQuestion.storyHints.map((hint) => {
                            const isSelected = selectedStoryId === hint.storyId;
                            return (
                              <button
                                key={hint.storyId}
                                onClick={() => setSelectedStoryId(isSelected ? null : hint.storyId)}
                                className={`w-full text-left text-xs p-2.5 rounded-lg border transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-900/30 border-indigo-700/50 text-indigo-200'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                                }`}
                              >
                                <span className="font-medium">{hint.storyTitle}</span>
                                <span className="text-zinc-500 block mt-0.5">{hint.matchReason}</span>
                              </button>
                            );
                          })}
                          <p className="text-[10px] text-zinc-600">Tap a story to mark it as your intended example</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Answer input */}
              {(phase === 'answering' || phase === 'generating-markup') && (
                <div className="ml-10 space-y-3">
                  {interactionMode === 'voice' ? (
                    <div className="space-y-3">
                      <MicStateIndicator
                        micState={voice.micState}
                        interimTranscript={voice.interimTranscript}
                        timeRemaining={voice.timeRemaining}
                        truncated={inputTruncated}
                      />
                      {answer && (
                        <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-lg">
                          <p className="text-xs text-zinc-500 mb-1">Transcribed answer</p>
                          <p className="text-sm text-zinc-200 leading-relaxed">{answer}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <MicButton
                          micState={voice.micState}
                          onStart={voice.startListening}
                          onStop={voice.stopListening}
                          disabled={phase === 'generating-markup'}
                          timeRemaining={voice.timeRemaining}
                        />
                        {answer && voice.micState === 'idle' && (
                          <Button
                            variant="primary"
                            size="md"
                            loading={phase === 'generating-markup'}
                            onClick={handleSubmitAnswer}
                          >
                            {phase === 'generating-markup' ? 'Analyzing…' : 'Submit Answer'}
                          </Button>
                        )}
                        {answer && voice.micState === 'idle' && phase === 'answering' && (
                          <Button variant="ghost" size="sm" onClick={() => { setAnswer(''); setInputTruncated(false); }}>
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        ref={answerRef}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer here…"
                        rows={6}
                        disabled={phase === 'generating-markup'}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            handleSubmitAnswer();
                          }
                        }}
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-zinc-600">Cmd/Ctrl+Enter to submit</p>
                        <Button
                          variant="primary"
                          size="md"
                          loading={phase === 'generating-markup'}
                          disabled={!answer.trim()}
                          onClick={handleSubmitAnswer}
                        >
                          {phase === 'generating-markup' ? 'Analyzing…' : 'Submit Answer'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Loading question */}
              {phase === 'loading-question' && (
                <div className="ml-10 flex items-center gap-2 text-zinc-500 text-sm">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generating next question…
                </div>
              )}

              {/* Change 1: Markup review phase */}
              {phase === 'markup-review' && currentMarkup && (
                <div className="ml-10">
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <MarkupPanel
                      markup={currentMarkup}
                      onProceed={runEvaluation}
                      proceedLabel="Score this answer →"
                    />
                  </div>
                </div>
              )}

              {/* Evaluating spinner */}
              {phase === 'evaluating' && (
                <div className="ml-10 flex items-center gap-2 text-zinc-500 text-sm">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Evaluating…
                </div>
              )}

              {/* Evaluated */}
              {phase === 'reviewed' && currentEvaluation && (
                <div className="ml-10 space-y-4">
                  {/* Answer display */}
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-semibold text-white shrink-0 mt-0.5">
                      A
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-zinc-500">Your answer</span>
                        <ScoreBadge score={currentEvaluation.overallScore} />
                        {currentEvaluation.inputMode === 'voice' && (
                          <Badge variant="purple">Voice</Badge>
                        )}
                        {currentEvaluation.inputTruncated && (
                          <Badge variant="warning">Truncated</Badge>
                        )}
                        {currentEvaluation.attemptNumber > 1 && (
                          <Badge variant="info">Attempt {currentEvaluation.attemptNumber}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {currentEvaluation.responseText}
                      </p>
                    </div>
                  </div>

                  {/* Evaluation panel */}
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <EvaluationPanel
                      evaluation={currentEvaluation}
                      onRequestRewrite={handleRewrite}
                      rewriteLoading={rewriteLoading}
                      previousEvaluation={previousEvaluation}
                    />
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-zinc-600">
                      {currentIndex < totalQuestions
                        ? `${totalQuestions - currentIndex} question${totalQuestions - currentIndex !== 1 ? 's' : ''} remaining`
                        : 'Session complete'}
                    </span>
                    <div className="flex gap-2">
                      {/* Change 4: Try Again */}
                      {attemptNumber < MAX_ATTEMPTS && (
                        <Button variant="ghost" size="sm" onClick={handleTryAgain}>
                          Try Again
                        </Button>
                      )}
                      {currentIndex < totalQuestions ? (
                        <Button variant="primary" onClick={handleNextQuestion}>
                          Next Question →
                        </Button>
                      ) : (
                        <Button variant="primary" onClick={handleEndSession}>
                          End Session & See Summary →
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-4 py-3 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-sm flex items-start justify-between gap-3">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={() => setError('')}>
                Dismiss
              </Button>
            </div>
          )}

          {phase === 'session-done' && (
            <div className="flex items-center justify-center py-10">
              <div className="text-center space-y-3">
                <svg className="animate-spin h-6 w-6 text-indigo-400 mx-auto" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <p className="text-zinc-400 text-sm">Generating session summary…</p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}

// ─── Past Q&A turn (collapsed) ────────────────────────────────────────────────

function PastTurn({
  question,
  evaluation,
  index,
}: {
  question: InterviewQuestion;
  evaluation?: AnswerEvaluation;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900/60 hover:bg-zinc-900 transition-colors text-left cursor-pointer"
      >
        <span className="text-xs text-zinc-500 shrink-0">Q{index}</span>
        <span className="flex-1 text-sm text-zinc-300 truncate">{question.questionText}</span>
        {evaluation && <ScoreBadge score={evaluation.overallScore} />}
        {evaluation && evaluation.attemptNumber > 1 && (
          <span className="text-xs text-zinc-500 shrink-0">×{evaluation.attemptNumber}</span>
        )}
        <span className="text-zinc-600 text-xs ml-2">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && evaluation && (
        <div className="px-4 pb-4 pt-2 bg-zinc-900/30 space-y-3">
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {evaluation.responseText}
          </p>
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
            <p className="text-xs text-zinc-500 leading-relaxed">{evaluation.writtenFeedback}</p>
          </div>
        </div>
      )}
    </div>
  );
}
