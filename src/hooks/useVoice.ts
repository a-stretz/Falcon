import { useState, useRef, useCallback, useEffect } from 'react';

export type MicState = 'idle' | 'listening' | 'processing';

const MAX_DURATION_MS = 180_000; // 3 minutes

interface UseVoiceOptions {
  onTranscript?: (text: string, truncated?: boolean) => void;
  maxDurationMs?: number;
}

export interface UseVoiceReturn {
  supported: boolean;
  micState: MicState;
  interimTranscript: string;
  timeRemaining: number | null; // seconds remaining while recording, null when idle
  truncated: boolean;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, rate?: number, voiceURI?: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  availableVoices: SpeechSynthesisVoice[];
}

const SPEECH_RECOGNITION_SUPPORTED =
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

const SPEECH_SYNTHESIS_SUPPORTED =
  typeof window !== 'undefined' && 'speechSynthesis' in window;

export function useVoice({ onTranscript, maxDurationMs = MAX_DURATION_MS }: UseVoiceOptions = {}): UseVoiceReturn {
  const [micState, setMicState] = useState<MicState>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [truncated, setTruncated] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Load voices
  useEffect(() => {
    if (!SPEECH_SYNTHESIS_SUPPORTED) return;
    const load = () => setAvailableVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  function clearTimers() {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (maxDurationTimerRef.current) clearTimeout(maxDurationTimerRef.current);
    countdownIntervalRef.current = null;
    maxDurationTimerRef.current = null;
  }

  const stopListening = useCallback((wasTruncated = false) => {
    clearTimers();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const transcript = finalTranscriptRef.current.trim();
    if (transcript) {
      setMicState('processing');
      setTruncated(wasTruncated);
      onTranscript?.(transcript, wasTruncated);
    } else {
      setMicState('idle');
    }

    setInterimTranscript('');
    setTimeRemaining(null);
  }, [onTranscript]);

  const startListening = useCallback(() => {
    if (!SPEECH_RECOGNITION_SUPPORTED) return;
    if (SPEECH_SYNTHESIS_SUPPORTED) window.speechSynthesis.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognitionCtor() as any;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    finalTranscriptRef.current = '';
    setTruncated(false);

    recognition.onstart = () => {
      startTimeRef.current = Date.now();
      setMicState('listening');
      setTimeRemaining(Math.floor(maxDurationMs / 1000));

      // Countdown every second
      countdownIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, Math.floor((maxDurationMs - elapsed) / 1000));
        setTimeRemaining(remaining);
      }, 1000);

      // Hard stop at max duration
      maxDurationTimerRef.current = setTimeout(() => {
        stopListening(true);
      }, maxDurationMs);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = '';
      let final = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }

      finalTranscriptRef.current = final;
      setInterimTranscript(interim);
      // No auto-stop on silence — user must press Stop manually
    };

    recognition.onerror = () => {
      clearTimers();
      setMicState('idle');
      setInterimTranscript('');
      setTimeRemaining(null);
    };

    recognition.onend = () => {
      // Only triggered by external .stop() (our manual stopListening already ran)
      clearTimers();
      setTimeRemaining(null);
      setInterimTranscript('');
      // If stop came from the max-duration timer, onTranscript was already called
      // If stop came from recognition ending on its own (e.g., browser interrupt), clean up
      if (micState === 'listening') {
        setMicState('idle');
      }
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [maxDurationMs, stopListening, micState]);

  const speak = useCallback((text: string, rate = 1.0, voiceURI = '') => {
    if (!SPEECH_SYNTHESIS_SUPPORTED) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    if (voiceURI) {
      const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === voiceURI);
      if (voice) utterance.voice = voice;
    }
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (!SPEECH_SYNTHESIS_SUPPORTED) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      if (recognitionRef.current) recognitionRef.current.stop();
      if (SPEECH_SYNTHESIS_SUPPORTED) window.speechSynthesis.cancel();
    };
  }, []);

  return {
    supported: SPEECH_RECOGNITION_SUPPORTED && SPEECH_SYNTHESIS_SUPPORTED,
    micState,
    interimTranscript,
    timeRemaining,
    truncated,
    startListening,
    stopListening: () => stopListening(false),
    speak,
    stopSpeaking,
    isSpeaking,
    availableVoices,
  };
}
