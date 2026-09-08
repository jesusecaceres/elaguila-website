"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { LeoConversationAnswer, LeoConversationLanguage } from "@/app/leo/_lib/leoTypes";
import {
  applyDictationTranscriptToComposer,
  createLeoSpeechRecognitionSession,
  getLeoSpeechRecognitionCapability,
  leoSpeechRecognitionAutoLabel,
  mapLeoSpeechRecognitionError,
  mergeTranscriptIntoComposer,
  resolveLeoSpeechRecognitionLang,
  type LeoVoiceDictationState,
} from "@/app/leo/_lib/leoSpeechRecognition";
import {
  createLeoSpeechSynthesisController,
  getLeoSpeechSynthesisCapability,
  resolveLeoSpeechSynthesisLang,
  resolveLeoSpokenResponseText,
  type LeoSpeechPlaybackState,
} from "@/app/leo/_lib/leoSpeechSynthesis";

import { adminBtnSecondary } from "@/app/admin/_components/adminTheme";

const MIC_BTN =
  "inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] text-[#1E1810] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1E2C] disabled:cursor-not-allowed disabled:opacity-60";

function MicIcon({ active }: { active?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${active ? "text-[#7A1E2C]" : "text-[#5C5346]"}`}
      fill="currentColor"
    >
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V20H9v2h6v-2h-2v-2.07A7 7 0 0 0 19 11h-2Z" />
    </svg>
  );
}

function dictationStatusLabel(state: LeoVoiceDictationState, interim: string): string | null {
  if (state === "LISTENING") return interim ? `Listening… ${interim}` : "Listening…";
  if (state === "TRANSCRIBING") return "Processing speech…";
  if (state === "UNAVAILABLE") return "Microphone unavailable";
  if (state === "ERROR") return null;
  return null;
}

export function LeoVoiceDictationControl({
  composerValue,
  onComposerChange,
  pending,
  speechLanguage = "auto",
  dictationMode = "merge",
}: {
  composerValue: string;
  onComposerChange: (value: string) => void;
  pending?: boolean;
  speechLanguage?: LeoConversationLanguage;
  dictationMode?: "merge" | "replace";
}) {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<LeoVoiceDictationState>("IDLE");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<ReturnType<typeof createLeoSpeechRecognitionSession> | null>(null);
  const composerRef = useRef(composerValue);
  composerRef.current = composerValue;

  const capability = useMemo(
    () => (mounted ? getLeoSpeechRecognitionCapability(window) : { supported: false, implementation: "NONE" as const }),
    [mounted],
  );

  const lang = useMemo(() => {
    if (!mounted) return "en-US";
    return resolveLeoSpeechRecognitionLang(speechLanguage, navigator.language);
  }, [mounted, speechLanguage]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!capability.supported) {
      setState("UNAVAILABLE");
      return;
    }
    setState((s) => (s === "UNAVAILABLE" ? "IDLE" : s));
  }, [mounted, capability.supported]);

  const disposeSession = useCallback(() => {
    sessionRef.current?.dispose();
    sessionRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      disposeSession();
    };
  }, [disposeSession]);

  const ensureSession = useCallback(() => {
    if (!capability.supported) return null;
    if (!sessionRef.current) {
      sessionRef.current = createLeoSpeechRecognitionSession(window, lang, {
        onInterim: (text) => setInterim(text),
        onFinal: (text) => {
          setInterim("");
          setState("IDLE");
          if (text) {
            onComposerChange(
              applyDictationTranscriptToComposer(composerRef.current, text, dictationMode),
            );
          }
        },
        onListeningChange: (listening) => {
          setState(listening ? "LISTENING" : "TRANSCRIBING");
          if (!listening) {
            window.setTimeout(() => {
              setState((s) => (s === "TRANSCRIBING" ? "IDLE" : s));
            }, 400);
          }
        },
        onError: (message) => {
          setInterim("");
          setError(message);
          setState("ERROR");
        },
      });
    }
    return sessionRef.current;
  }, [capability.supported, dictationMode, lang, onComposerChange]);

  const startListening = useCallback(() => {
    if (pending || !capability.supported) return;
    setError(null);
    setInterim("");
    const session = ensureSession();
    if (!session) {
      setState("UNAVAILABLE");
      setError("Voice dictation isn't available in this browser.");
      return;
    }
    session.start();
  }, [capability.supported, ensureSession, pending]);

  const stopListening = useCallback(() => {
    sessionRef.current?.stop();
    setInterim("");
    setState("IDLE");
  }, []);

  const status = dictationStatusLabel(state, interim);
  const listening = state === "LISTENING";
  const disabled = pending || state === "UNAVAILABLE";

  return (
    <div className="flex shrink-0 flex-col items-center gap-1" data-leo-voice-dictation>
      {listening ? (
        <button
          type="button"
          className={`${MIC_BTN} border-[#7A1E2C]/40 bg-[#FFF5F5]`}
          aria-label="Stop listening"
          onClick={stopListening}
        >
          <MicIcon active />
        </button>
      ) : (
        <button
          type="button"
          className={MIC_BTN}
          aria-label="Start voice dictation"
          disabled={disabled}
          onClick={startListening}
          title={
            speechLanguage === "auto"
              ? `Voice dictation (${leoSpeechRecognitionAutoLabel()})`
              : "Voice dictation"
          }
        >
          <MicIcon />
        </button>
      )}
      {status ? (
        <p className="max-w-[9rem] text-center text-[10px] leading-snug text-[#5C5346]" aria-live="polite">
          {status}
        </p>
      ) : null}
      {error ? (
        <p className="max-w-[9rem] text-center text-[10px] leading-snug text-rose-800" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function LeoSpeechResponseControls({
  answer,
  speechLanguage = "auto",
}: {
  answer: LeoConversationAnswer;
  speechLanguage?: LeoConversationLanguage;
}) {
  const [mounted, setMounted] = useState(false);
  const [playbackState, setPlaybackState] = useState<LeoSpeechPlaybackState>("IDLE");
  const controllerRef = useRef<ReturnType<typeof createLeoSpeechSynthesisController> | null>(null);

  const capability = useMemo(
    () => (mounted ? getLeoSpeechSynthesisCapability(window) : { supported: false, pauseSupported: false }),
    [mounted],
  );

  const spokenText = useMemo(() => resolveLeoSpokenResponseText(answer), [answer]);

  const lang = useMemo(() => {
    if (!mounted) return "en-US";
    return resolveLeoSpeechSynthesisLang(speechLanguage, navigator.language);
  }, [mounted, speechLanguage]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !capability.supported) return;
    controllerRef.current?.dispose();
    controllerRef.current = createLeoSpeechSynthesisController(window, lang, {
      onStateChange: setPlaybackState,
    });
    return () => {
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, [mounted, capability.supported, lang]);

  if (!mounted || !capability.supported || !spokenText) return null;

  const ctl = controllerRef.current;
  const speaking = playbackState === "SPEAKING";
  const paused = playbackState === "PAUSED";

  const speechBtn =
    "inline-flex min-h-[44px] items-center rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] px-3 text-xs font-semibold text-[#1E1810] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1E2C] disabled:opacity-60";

  return (
    <div className="flex min-w-0 flex-wrap gap-2" data-leo-speech-response aria-label="LEO spoken response controls">
      {!speaking && !paused ? (
        <button
          type="button"
          className={speechBtn}
          aria-label="Speak LEO response"
          onClick={() => ctl?.speak(spokenText)}
        >
          Speak
        </button>
      ) : null}
      {speaking && capability.pauseSupported ? (
        <button type="button" className={speechBtn} aria-label="Pause LEO speech" onClick={() => ctl?.pause()}>
          Pause
        </button>
      ) : null}
      {paused && capability.pauseSupported ? (
        <button type="button" className={speechBtn} aria-label="Resume LEO speech" onClick={() => ctl?.resume()}>
          Resume
        </button>
      ) : null}
      {speaking || paused ? (
        <button type="button" className={speechBtn} aria-label="Stop LEO speech" onClick={() => ctl?.stop()}>
          Stop
        </button>
      ) : null}
      <button
        type="button"
        className={`${adminBtnSecondary} min-h-[44px] px-3 text-xs`}
        aria-label="Repeat LEO response"
        onClick={() => ctl?.repeat(spokenText)}
      >
        Repeat
      </button>
    </div>
  );
}

/** Exported for verifier / tests — maps raw browser codes without exposing them in UI. */
export { mapLeoSpeechRecognitionError, mergeTranscriptIntoComposer };
