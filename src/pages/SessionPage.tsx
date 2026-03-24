import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { buildDefaultProfile, buildDefaultStories } from '../lib/defaultData';
import { generateQuestion, evaluateAnswer, rewriteAnswer, generateSessionSummary } from '../lib/claude';
import { QUESTION_TYPE_LABELS } from '../lib/prompts';
import type { InterviewQuestion, AnswerEvaluation, RewriteMode } from '../types';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { ScoreBadge } from '../components/ui/ScoreBar';
import { EvaluationPanel } from '../components/session/EvaluationPanel';
import { MicButton, MicStateIndicator } from '../components/session/MicButton';
import { useVoice } from '../hooks/useVoice';

type SessionPhase = 'loading-question' | 'answering' | 'evaluating' | 'reviewed' | 'session-done';

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const {
    profile, stories, settings,
    sessions, questions: allQuestions, evaluations: allEvaluations,
    addQuestion, addEvaluation, addRewriteVariant, completeSession, setSummary,
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
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [error, setError] = useState('');
  const [interactionMode, setInteractionMode] = useState(session?.config.interactionMode ?? 'typed');

  const answerRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Voice hook
  const voice = useVoice({
    onTranscript: (text) => {
      setAnswer(text);
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
      // Resuming — go to end of questions
      const lastQ = sessionQuestions[sessionQuestions.length - 1];
      setCurrentQuestion(lastQ);
      const lastEval = sessionEvaluations.find((e) => e.questionId === lastQ.id);
      if (lastEval) {
        setCurrentEvaluation(lastEval);
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

    try {
      const q = await generateQuestion({
        apiKey: settings.anthropicApiKey,
        config: session.config,
        profile: effectiveProfile,
        stories: effectiveStories,
        questionsAsked: sessionQuestions,
        sessionId,
        orderIndex: sessionQuestions.length,
      });

      addQuestion(sessionId, q);
      setCurrentQuestion(q);
      setActiveQuestionIndex(sessionQuestions.length);
      setPhase('answering');

      // Read question aloud in voice mode
      if (interactionMode === 'voice') {
        voice.speak(q.questionText, settings.voiceRate, settings.selectedVoiceURI);
      }

      scrollToBottom();
    } catch (e) {
      setError(`Failed to generate question: ${e instanceof Error ? e.message : String(e)}`);
      setPhase('answering');
    }
  }

  async function handleSubmitAnswer() {
    if (!currentQuestion || !sessionId || !answer.trim()) return;
    setPhase('evaluating');
    setError('');

    try {
      const ev = await evaluateAnswer({
        apiKey: settings.anthropicApiKey,
        question: currentQuestion,
        answer: answer.trim(),
        inputMode: interactionMode,
        profile: effectiveProfile,
        stories: effectiveStories,
        sessionId,
      });

      addEvaluation(ev);
      setCurrentEvaluation(ev);
      setPhase('reviewed');
      scrollToBottom();
    } catch (e) {
      setError(`Evaluation failed: ${e instanceof Error ? e.message : String(e)}`);
      setPhase('answering');
    }
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
      // Force re-render by refreshing local eval ref
      const updated = { ...currentEvaluation, rewriteVariants: [...currentEvaluation.rewriteVariants, variant] };
      setCurrentEvaluation(updated);
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

        {/* Progress bar */}
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
              interactionMode === 'typed'
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Type
          </button>
          <button
            onClick={() => setInteractionMode('voice')}
            disabled={!voice.supported}
            title={!voice.supported ? 'Voice not supported in this browser' : undefined}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 ${
              interactionMode === 'voice'
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Voice
          </button>
        </div>

        <Button variant="ghost" size="sm" onClick={handleEndSession}>
          End Session
        </Button>
      </header>

      {/* Main chat area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* Previous Q&A */}
          {sessionQuestions.slice(0, -1).map((q, idx) => {
            const ev = sessionEvaluations.find((e) => e.questionId === q.id);
            return (
              <PastTurn key={q.id} question={q} evaluation={ev} index={idx + 1} />
            );
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
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-zinc-500 font-medium">
                      Question {currentIndex}
                    </span>
                    <Badge variant="info">
                      {QUESTION_TYPE_LABELS[currentQuestion.questionType]}
                    </Badge>
                  </div>
                  <p className="text-zinc-100 text-base leading-relaxed">
                    {currentQuestion.questionText}
                  </p>
                </div>
              </div>

              {/* Answer input */}
              {(phase === 'answering' || phase === 'evaluating') && (
                <div className="ml-10 space-y-3">
                  {interactionMode === 'voice' ? (
                    <div className="space-y-3">
                      <MicStateIndicator
                        micState={voice.micState}
                        interimTranscript={voice.interimTranscript}
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
                          disabled={phase === 'evaluating'}
                        />
                        {answer && voice.micState === 'idle' && (
                          <Button
                            variant="primary"
                            size="md"
                            loading={phase === 'evaluating'}
                            onClick={handleSubmitAnswer}
                          >
                            Submit Answer
                          </Button>
                        )}
                        {answer && (
                          <Button variant="ghost" size="sm" onClick={() => setAnswer('')}>
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
                        disabled={phase === 'evaluating'}
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
                          loading={phase === 'evaluating'}
                          disabled={!answer.trim()}
                          onClick={handleSubmitAnswer}
                        >
                          {phase === 'evaluating' ? 'Evaluating…' : 'Submit Answer'}
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

              {/* Evaluation */}
              {phase === 'reviewed' && currentEvaluation && (
                <div className="ml-10 space-y-4">
                  {/* Answer display */}
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-semibold text-white shrink-0 mt-0.5">
                      A
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-zinc-500">Your answer</span>
                        <ScoreBadge score={currentEvaluation.overallScore} />
                        {currentEvaluation.inputMode === 'voice' && (
                          <Badge variant="purple">Voice</Badge>
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
            <div className="px-4 py-3 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-sm">
              {error}
              <Button variant="ghost" size="sm" className="ml-3" onClick={() => setError('')}>
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
