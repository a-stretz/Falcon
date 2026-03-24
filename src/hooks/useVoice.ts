import { useState, useRef, useCallback, useEffect } from 'react';

export type MicState = 'idle' | 'listening' | 'processing';

interface UseVoiceOptions {
  onTranscript?: (text: string) => void;
  silenceThresholdMs?: number;
}

interface UseVoiceReturn {
  supported: boolean;
  micState: MicState;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, rate?: number, voiceURI?: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  availableVoices: SpeechSynthesisVoice[];
}

// Detect Web Speech API support
const SPEECH_RECOGNITION_SUPPORTED =
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

const SPEECH_SYNTHESIS_SUPPORTED =
  typeof window !== 'undefined' && 'speechSynthesis' in window;

export function useVoice({ onTranscript, silenceThresholdMs = 2000 }: UseVoiceOptions = {}): UseVoiceReturn {
  const [micState, setMicState] = useState<MicState>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscriptRef = useRef('');

  // Load voices
  useEffect(() => {
    if (!SPEECH_SYNTHESIS_SUPPORTED) return;
    const load = () => setAvailableVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setMicState('idle');
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(() => {
    if (!SPEECH_RECOGNITION_SUPPORTED) return;

    // Stop any ongoing speech
    if (SPEECH_SYNTHESIS_SUPPORTED) window.speechSynthesis.cancel();

    // Clean up previous
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognitionCtor() as any;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    finalTranscriptRef.current = '';

    recognition.onstart = () => {
      setMicState('listening');
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      // Reset silence timer on any result
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

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

      // Auto-stop after silence
      silenceTimerRef.current = setTimeout(() => {
        const transcript = (finalTranscriptRef.current + interim).trim();
        if (transcript) {
          setMicState('processing');
          onTranscript?.(transcript);
        }
        recognition.stop();
      }, silenceThresholdMs);
    };

    recognition.onerror = () => {
      setMicState('idle');
      setInterimTranscript('');
    };

    recognition.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setMicState('idle');
      setInterimTranscript('');
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onTranscript, silenceThresholdMs]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
      if (SPEECH_SYNTHESIS_SUPPORTED) window.speechSynthesis.cancel();
    };
  }, []);

  return {
    supported: SPEECH_RECOGNITION_SUPPORTED && SPEECH_SYNTHESIS_SUPPORTED,
    micState,
    interimTranscript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSpeaking,
    availableVoices,
  };
}
