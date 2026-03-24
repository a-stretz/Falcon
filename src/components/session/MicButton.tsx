import type { MicState } from '../../hooks/useVoice';

interface Props {
  micState: MicState;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function MicButton({ micState, onStart, onStop, disabled }: Props) {
  const isListening = micState === 'listening';
  const isProcessing = micState === 'processing';

  return (
    <button
      onClick={isListening ? onStop : onStart}
      disabled={disabled || isProcessing}
      title={isListening ? 'Stop recording' : 'Start speaking'}
      className={`
        relative w-12 h-12 rounded-full flex items-center justify-center
        transition-all duration-200 cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
        ${isListening
          ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/40'
          : isProcessing
          ? 'bg-zinc-700 cursor-not-allowed'
          : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-600'
        }
        disabled:opacity-50
      `}
    >
      {/* Pulse ring while listening */}
      {isListening && (
        <span className="absolute inset-0 rounded-full animate-ping bg-red-500 opacity-30" />
      )}

      {isProcessing ? (
        <svg className="animate-spin h-5 w-5 text-zinc-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className={`w-5 h-5 ${isListening ? 'text-white' : 'text-zinc-300'}`}
          fill="currentColor"
        >
          <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

interface MicStateIndicatorProps {
  micState: MicState;
  interimTranscript: string;
}

export function MicStateIndicator({ micState, interimTranscript }: MicStateIndicatorProps) {
  if (micState === 'idle') return null;

  return (
    <div className="flex items-start gap-2 p-3 bg-zinc-900 border border-zinc-700 rounded-lg">
      <span
        className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
          micState === 'listening' ? 'bg-red-500 animate-pulse' : 'bg-zinc-500 animate-spin'
        }`}
      />
      <div>
        <p className="text-xs font-medium text-zinc-500 mb-0.5">
          {micState === 'listening' ? 'Listening…' : 'Processing…'}
        </p>
        {interimTranscript && (
          <p className="text-sm text-zinc-300 leading-relaxed">{interimTranscript}</p>
        )}
      </div>
    </div>
  );
}
