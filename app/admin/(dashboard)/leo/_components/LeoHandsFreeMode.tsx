"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { LeoConversationAnswer } from "@/app/leo/_lib/leoTypes";
import {
  composeLeoHandsFreeSpokenText,
  LEO_HANDS_FREE_FOREGROUND_NOTICE,
  LEO_HANDS_FREE_OFFLINE_MESSAGE,
  leoHandsFreeGenericYesCannotExecute,
  leoHandsFreeOwnerLabel,
  resolveLeoHandsFreePendingActionId,
  shouldAutoListenAfterWaiting,
  leoHandsFreeShouldSpeakConfirmation,
  transitionLeoHandsFree,
  type LeoHandsFreeEvent,
  type LeoHandsFreeState,
} from "@/app/leo/_lib/leoHandsFreeState";
import {
  createLeoSpeechRecognitionSession,
  getLeoSpeechRecognitionCapability,
  resolveLeoSpeechRecognitionLang,
} from "@/app/leo/_lib/leoSpeechRecognition";
import {
  createLeoSpeechSynthesisController,
  getLeoSpeechSynthesisCapability,
  resolveLeoSpeechSynthesisLang,
  resolveLeoSpokenResponseText,
} from "@/app/leo/_lib/leoSpeechSynthesis";

const HF_BTN =
  "inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1E2C] disabled:cursor-not-allowed disabled:opacity-60";

const HF_PRIMARY = `${HF_BTN} border-[#7A1E2C]/30 bg-[#7A1E2C] text-white hover:bg-[#641824]`;
const HF_SECONDARY = `${HF_BTN} border-[color:var(--lx-border)] bg-[color:var(--lx-section)] text-[#1E1810] hover:bg-white`;
const HF_DANGER = `${HF_BTN} border-rose-200 bg-rose-50 text-rose-950 hover:bg-rose-100`;

export function LeoHandsFreeMode({
  active,
  pending,
  online,
  latestAnswer,
  lastUserTranscript,
  submitError,
  persistWarning,
  showFullConversation,
  onToggleFullConversation,
  onSubmit,
  onEnded,
}: {
  active: boolean;
  pending: boolean;
  online: boolean;
  latestAnswer: LeoConversationAnswer | null;
  lastUserTranscript: string;
  submitError: string | null;
  persistWarning: string | null;
  showFullConversation: boolean;
  onToggleFullConversation: () => void;
  onSubmit: (text: string) => void;
  onEnded: () => void;
}) {
  const [state, setState] = useState<LeoHandsFreeState>("IDLE");
  const [interim, setInterim] = useState("");
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [spokenShown, setSpokenShown] = useState("");

  const stateRef = useRef<LeoHandsFreeState>("IDLE");
  const skipAutoListenRef = useRef(false);
  const requestLockRef = useRef(false);
  const speakLockRef = useRef(false);
  const expectAnswerRef = useRef(false);
  const spokenTurnRef = useRef<string | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  const recRef = useRef<ReturnType<typeof createLeoSpeechRecognitionSession> | null>(null);
  const ttsRef = useRef<ReturnType<typeof createLeoSpeechSynthesisController> | null>(null);
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const latestAnswerRef = useRef(latestAnswer);
  latestAnswerRef.current = latestAnswer;
  const endModeRef = useRef<() => void>(() => undefined);

  const apply = useCallback((event: LeoHandsFreeEvent) => {
    const next = transitionLeoHandsFree(stateRef.current, event);
    stateRef.current = next;
    setState(next);
    return next;
  }, []);

  const stopRecognition = useCallback(() => {
    recRef.current?.abort();
  }, []);

  const stopSpeech = useCallback(() => {
    speakLockRef.current = false;
    ttsRef.current?.stop();
  }, []);

  const endMode = useCallback(() => {
    skipAutoListenRef.current = true;
    expectAnswerRef.current = false;
    requestLockRef.current = false;
    stopRecognition();
    stopSpeech();
    apply("END");
    recRef.current?.dispose();
    recRef.current = null;
    ttsRef.current?.dispose();
    ttsRef.current = null;
    onEnded();
  }, [apply, onEnded, stopRecognition, stopSpeech]);
  endModeRef.current = endMode;

  const pauseMode = useCallback(
    (event: "PAUSE" | "VISIBILITY_HIDDEN" | "OFFLINE", note?: string) => {
      skipAutoListenRef.current = true;
      stopRecognition();
      stopSpeech();
      apply(event);
      if (note) setVoiceNote(note);
    },
    [apply, stopRecognition, stopSpeech],
  );

  const startListen = useCallback(() => {
    if (!activeRef.current) return;
    if (!online || (typeof document !== "undefined" && document.hidden)) return;
    const st = stateRef.current;
    if (st === "SPEAKING" || st === "THINKING" || st === "ENDED") return;
    if (requestLockRef.current || speakLockRef.current) return;
    if (recRef.current?.isActive()) return;

    const cap = getLeoSpeechRecognitionCapability(window);
    if (!cap.supported) {
      setVoiceNote("Voice dictation isn't available in this browser.");
      apply("ERROR");
      return;
    }

    if (!recRef.current) {
      const lang = resolveLeoSpeechRecognitionLang("auto", navigator.language);
      recRef.current = createLeoSpeechRecognitionSession(window, lang, {
        onInterim: (text) => setInterim(text),
        onFinal: (text) => {
          setInterim("");
          const trimmed = text.trim();
          if (!trimmed) {
            skipAutoListenRef.current = true;
            apply("NO_SPEECH");
            setVoiceNote("I didn't catch anything.");
            return;
          }
          if (requestLockRef.current || pendingRef.current || stateRef.current === "THINKING") return;
          if (stateRef.current === "SPEAKING") return;
          apply("FINAL_TRANSCRIPT");
          requestLockRef.current = true;
          expectAnswerRef.current = true;
          skipAutoListenRef.current = true;
          recRef.current?.abort();
          apply("SUBMIT");
          void leoHandsFreeGenericYesCannotExecute(
            resolveLeoHandsFreePendingActionId(latestAnswerRef.current),
          );
          onSubmitRef.current(trimmed);
        },
        onListeningChange: (listening) => {
          if (listening) apply("RECOGNITION_START");
        },
        onError: (message, code) => {
          setInterim("");
          if (code === "no-speech") {
            skipAutoListenRef.current = true;
            apply("NO_SPEECH");
            setVoiceNote("I didn't catch anything.");
            return;
          }
          if (code === "not-allowed" || code === "service-not-allowed") {
            setVoiceNote("Microphone permission is blocked.");
            endModeRef.current();
            return;
          }
          skipAutoListenRef.current = true;
          apply("ERROR");
          setVoiceNote(message);
        },
      });
    }

    apply("LISTEN");
    recRef.current?.start();
  }, [apply, online]);

  const speakAnswer = useCallback(
    (answer: LeoConversationAnswer) => {
      const cap = getLeoSpeechSynthesisCapability(window);
      if (!cap.supported) {
        skipAutoListenRef.current = false;
        apply("SPEECH_ERROR");
        return;
      }
      const summary = resolveLeoSpokenResponseText(answer);
      const spoken = composeLeoHandsFreeSpokenText(
        summary ?? "",
        leoHandsFreeShouldSpeakConfirmation(answer),
      );
      if (!spoken) {
        skipAutoListenRef.current = false;
        apply("SPEECH_ERROR");
        return;
      }
      setSpokenShown(spoken);
      speakLockRef.current = true;
      stopRecognition();
      apply("SPEECH_START");

      if (!ttsRef.current) {
        const lang = resolveLeoSpeechSynthesisLang("auto", navigator.language);
        ttsRef.current = createLeoSpeechSynthesisController(window, lang, {
          onEnd: () => {
            speakLockRef.current = false;
            skipAutoListenRef.current = false;
            apply("SPEECH_END");
          },
          onError: () => {
            speakLockRef.current = false;
            skipAutoListenRef.current = false;
            apply("SPEECH_ERROR");
          },
        });
      }
      ttsRef.current?.speak(spoken);
    },
    [apply, stopRecognition],
  );

  useEffect(() => {
    if (!active) return;
    apply("START");
    skipAutoListenRef.current = false;
    startListen();
    return () => {
      stopRecognition();
      stopSpeech();
    };
    // Explicit start only — parent must flip `active` from a user gesture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onVis = () => {
      if (document.hidden) {
        pauseMode("VISIBILITY_HIDDEN", "Hands-Free paused — this tab is in the background.");
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [active, pauseMode]);

  useEffect(() => {
    if (!active) return;
    if (!online) {
      pauseMode("OFFLINE", LEO_HANDS_FREE_OFFLINE_MESSAGE);
    }
  }, [active, online, pauseMode]);

  useEffect(() => {
    if (!active || !expectAnswerRef.current) return;
    if (pending) return;
    expectAnswerRef.current = false;
    requestLockRef.current = false;
    if (submitError) {
      skipAutoListenRef.current = true;
      apply("ERROR");
      setVoiceNote(submitError);
      return;
    }
    if (!latestAnswer) {
      skipAutoListenRef.current = false;
      apply("SPEECH_ERROR");
      return;
    }
    const turnKey = latestAnswer.turnId ?? latestAnswer.generatedAt ?? "latest";
    if (spokenTurnRef.current === turnKey) return;
    spokenTurnRef.current = turnKey;
    speakAnswer(latestAnswer);
  }, [active, apply, latestAnswer, pending, speakAnswer, submitError]);

  useEffect(() => {
    if (!active) return;
    if (
      shouldAutoListenAfterWaiting({
        state,
        modeActive: active,
        skipAutoListen: skipAutoListenRef.current,
        online,
        documentHidden: typeof document !== "undefined" && document.hidden,
      })
    ) {
      startListen();
    }
  }, [active, online, startListen, state]);

  if (!active) return null;

  const listening = state === "LISTENING";
  const speaking = state === "SPEAKING";
  const paused = state === "PAUSED";
  const label = leoHandsFreeOwnerLabel(state);

  return (
    <div
      className="min-w-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      data-leo-hands-free
      data-leo-hands-free-state={state}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">LEO</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-[#1E1810]" aria-live="polite">
        {label}
      </p>
      {interim && listening ? (
        <p className="mt-2 text-sm text-[#5C5346]" aria-live="polite">
          {interim}
        </p>
      ) : null}
      {voiceNote ? (
        <p className="mt-2 text-sm text-rose-900" role="alert" aria-live="assertive">
          {voiceNote}
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {lastUserTranscript ? (
          <div className="rounded-2xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-section)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">You said</p>
            <p className="mt-1 break-words text-base font-semibold text-[#1E1810]">{lastUserTranscript}</p>
          </div>
        ) : null}
        {spokenShown ? (
          <div className="rounded-2xl border border-[#7A1E2C]/15 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">LEO said</p>
            <p className="mt-1 break-words text-base leading-relaxed text-[#1E1810]">{spokenShown}</p>
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-[#5C5346]">{LEO_HANDS_FREE_FOREGROUND_NOTICE}</p>
      {persistWarning ? (
        <p className="mt-2 text-xs text-amber-900" role="status">
          {persistWarning}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-[#5C5346]">
        Drive with your voice. Core controls are large on purpose — don&apos;t tap around for details while moving.
      </p>

      <div className="mt-5 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
        {listening ? (
          <button type="button" className={HF_PRIMARY} aria-label="Stop listening" onClick={() => {
            skipAutoListenRef.current = true;
            stopRecognition();
            apply("STOP_LISTENING");
          }}>
            Stop listening
          </button>
        ) : (
          <button
            type="button"
            className={HF_PRIMARY}
            aria-label="Start listening"
            disabled={speaking || pending || paused || !online}
            onClick={() => {
              skipAutoListenRef.current = false;
              setVoiceNote(null);
              startListen();
            }}
          >
            Listen
          </button>
        )}
        <button
          type="button"
          className={HF_SECONDARY}
          aria-label="Stop LEO speech"
          disabled={!speaking}
          onClick={() => {
            skipAutoListenRef.current = true;
            stopSpeech();
            apply("STOP_SPEAKING");
          }}
        >
          Stop speaking
        </button>
        {paused ? (
          <button
            type="button"
            className={HF_SECONDARY}
            aria-label="Resume hands-free"
            disabled={!online}
            onClick={() => {
              skipAutoListenRef.current = false;
              setVoiceNote(null);
              apply("RESUME");
            }}
          >
            Resume hands-free
          </button>
        ) : (
          <button
            type="button"
            className={HF_SECONDARY}
            aria-label="Pause hands-free"
            onClick={() => pauseMode("PAUSE", "Hands-Free paused.")}
          >
            Pause hands-free
          </button>
        )}
        <button
          type="button"
          className={HF_SECONDARY}
          aria-label="Repeat LEO response"
          disabled={!spokenShown}
          onClick={() => {
            if (!spokenShown || stateRef.current === "LISTENING") return;
            stopRecognition();
            speakLockRef.current = true;
            apply("SPEECH_START");
            ttsRef.current?.repeat(spokenShown);
          }}
        >
          Repeat
        </button>
        <button type="button" className={`${HF_DANGER} sm:col-span-2`} aria-label="End hands-free" onClick={endMode}>
          End hands-free
        </button>
      </div>

      <button
        type="button"
        className="mt-4 min-h-[48px] text-sm font-semibold text-[#7A1E2C] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1E2C]"
        onClick={onToggleFullConversation}
      >
        {showFullConversation ? "Hide full conversation" : "View full conversation"}
      </button>
    </div>
  );
}
