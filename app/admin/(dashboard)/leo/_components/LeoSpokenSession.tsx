"use client";

/**
 * LEO-22B — Shared spoken session (single TTS stream).
 * Hands-Free starts only from an owner gesture. No always-on mic.
 *
 * LEO-VOICE.1 — neural-first, browser-fallback. Every consumer (Hands-Free
 * and per-turn "Read aloud") shares this one provider, so only one audio
 * lane is ever active: starting new speech always stops the other lane
 * first, guaranteeing no double-speak regardless of which lane is playing.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { LeoConversationEntityRef } from "@/app/leo/_lib/leoTypes";
import type { LeoAddressableSpokenItem, LeoSpokenSessionSnapshot } from "@/app/leo/_lib/leoSpokenContext";
import {
  createLeoSpeechSynthesisController,
  getLeoSpeechSynthesisCapability,
  resolveLeoSpeechSynthesisLang,
  type LeoSpeechPlaybackState,
} from "@/app/leo/_lib/leoSpeechSynthesis";
import { createLeoNeuralSpeechController } from "@/app/leo/_lib/leoNeuralSpeech";
import { useLeoWorkspaceController } from "./LeoWorkspaceController";

type LeoSpeechLane = "NEURAL" | "BROWSER" | "NONE";

type LeoSpokenSessionValue = {
  snapshot: LeoSpokenSessionSnapshot;
  speaking: boolean;
  paused: boolean;
  playbackState: LeoSpeechPlaybackState;
  pauseSupported: boolean;
  lastSpokenText: string | null;
  setVisibleItems: (items: LeoAddressableSpokenItem[]) => void;
  setSelected: (cardId: string | null, entityRef: LeoConversationEntityRef | null) => void;
  setCurrentAnswer: (spoken: string | null, display: string | null) => void;
  speak: (text: string, options?: { onEnded?: () => void }) => boolean;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  repeat: (options?: { onEnded?: () => void }) => boolean;
};

const LeoSpokenReactContext = createContext<LeoSpokenSessionValue | null>(null);

export function LeoSpokenSessionProvider({ children }: { children: ReactNode }) {
  const { activeWorkspace } = useLeoWorkspaceController();
  const [visibleItems, setVisibleItems] = useState<LeoAddressableSpokenItem[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedEntityRef, setSelectedEntityRef] = useState<LeoConversationEntityRef | null>(null);
  const [currentAnswerSpoken, setCurrentAnswerSpoken] = useState<string | null>(null);
  const [currentAnswerDisplay, setCurrentAnswerDisplay] = useState<string | null>(null);
  const [lastSpokenText, setLastSpokenText] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<LeoSpeechPlaybackState>("IDLE");
  const [synthAvailable, setSynthAvailable] = useState(false);
  const [browserPauseSupported, setBrowserPauseSupported] = useState(false);
  const [recognitionAvailable, setRecognitionAvailable] = useState(false);
  const [activeLane, setActiveLane] = useState<LeoSpeechLane>("NONE");

  const browserRef = useRef<ReturnType<typeof createLeoSpeechSynthesisController> | null>(null);
  const neuralRef = useRef<ReturnType<typeof createLeoNeuralSpeechController> | null>(null);
  const activeLaneRef = useRef<LeoSpeechLane>("NONE");
  const lastSpokenTextRef = useRef<string>("");
  const utteranceEndedRef = useRef<(() => void) | null>(null);

  const fireUtteranceEnded = useCallback(() => {
    const cb = utteranceEndedRef.current;
    utteranceEndedRef.current = null;
    cb?.();
  }, []);

  const setLane = useCallback((lane: LeoSpeechLane) => {
    activeLaneRef.current = lane;
    setActiveLane(lane);
  }, []);

  useEffect(() => {
    const cap = getLeoSpeechSynthesisCapability(window);
    setSynthAvailable(cap.supported);
    setBrowserPauseSupported(cap.pauseSupported);
    setRecognitionAvailable(
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window,
    );
    const lang = resolveLeoSpeechSynthesisLang("auto", navigator.language);

    browserRef.current = createLeoSpeechSynthesisController(window, lang, {
      onStateChange: (s) => {
        if (activeLaneRef.current !== "BROWSER") return;
        setPlaybackState(s);
      },
      onEnd: () => {
        if (activeLaneRef.current !== "BROWSER") return;
        setLane("NONE");
        setPlaybackState("IDLE");
        fireUtteranceEnded();
      },
      onError: () => {
        if (activeLaneRef.current !== "BROWSER") return;
        setLane("NONE");
        setPlaybackState("IDLE");
        fireUtteranceEnded();
      },
    });

    neuralRef.current = createLeoNeuralSpeechController(window, {
      onStateChange: (s) => {
        if (activeLaneRef.current !== "NEURAL") return;
        setPlaybackState(s);
      },
      onEnd: () => {
        if (activeLaneRef.current !== "NEURAL") return;
        setLane("NONE");
        setPlaybackState("IDLE");
        fireUtteranceEnded();
      },
      onError: () => {
        // Neural failed (unconfigured / provider error / timeout / playback
        // failure) — fall back to browser speech for this same utterance.
        if (activeLaneRef.current !== "NEURAL") return;
        const text = lastSpokenTextRef.current;
        if (browserRef.current && text) {
          setLane("BROWSER");
          browserRef.current.speak(text);
        } else {
          setLane("NONE");
          setPlaybackState("IDLE");
          fireUtteranceEnded();
        }
      },
    });

    return () => {
      utteranceEndedRef.current = null;
      activeLaneRef.current = "NONE";
      browserRef.current?.dispose();
      browserRef.current = null;
      neuralRef.current?.dispose();
      neuralRef.current = null;
    };
  }, [fireUtteranceEnded, setLane]);

  const stopAllLanes = useCallback(() => {
    setLane("NONE");
    neuralRef.current?.stop();
    browserRef.current?.stop();
  }, [setLane]);

  const speak = useCallback(
    (text: string, options?: { onEnded?: () => void }) => {
      const trimmed = text.trim();
      if (!trimmed) return false;

      stopAllLanes();
      utteranceEndedRef.current = options?.onEnded ?? null;
      lastSpokenTextRef.current = trimmed;
      setLastSpokenText(trimmed);

      if (neuralRef.current) {
        setLane("NEURAL");
        neuralRef.current.speak(trimmed);
        return true;
      }
      if (browserRef.current) {
        setLane("BROWSER");
        browserRef.current.speak(trimmed);
        return true;
      }
      setLane("NONE");
      return false;
    },
    [setLane, stopAllLanes],
  );

  const stop = useCallback(() => {
    utteranceEndedRef.current = null;
    stopAllLanes();
    setPlaybackState("IDLE");
  }, [stopAllLanes]);

  const pause = useCallback(() => {
    if (activeLaneRef.current === "NEURAL") neuralRef.current?.pause();
    else if (activeLaneRef.current === "BROWSER") browserRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    if (activeLaneRef.current === "NEURAL") neuralRef.current?.resume();
    else if (activeLaneRef.current === "BROWSER") browserRef.current?.resume();
  }, []);

  const repeat = useCallback(
    (options?: { onEnded?: () => void }) => {
      const text = lastSpokenTextRef.current;
      if (!text) return false;

      stopAllLanes();
      utteranceEndedRef.current = options?.onEnded ?? null;

      if (neuralRef.current) {
        setLane("NEURAL");
        neuralRef.current.repeat(text);
        return true;
      }
      if (browserRef.current) {
        setLane("BROWSER");
        browserRef.current.repeat(text);
        return true;
      }
      setLane("NONE");
      return false;
    },
    [setLane, stopAllLanes],
  );

  const speaking = playbackState === "SPEAKING";
  const paused = playbackState === "PAUSED";
  // Neural playback (HTMLAudioElement) always supports pause/resume; browser
  // pause support is capability-dependent.
  const pauseSupported = activeLane === "BROWSER" ? browserPauseSupported : true;

  const snapshot = useMemo<LeoSpokenSessionSnapshot>(
    () => ({
      workspaceId: activeWorkspace,
      selectedCardId,
      selectedEntityRef,
      currentAnswerSpoken,
      currentAnswerDisplay,
      visibleItems,
      lastSpokenText,
      speechActive: speaking,
      recognitionAvailable,
      synthesisAvailable: synthAvailable,
    }),
    [
      activeWorkspace,
      currentAnswerDisplay,
      currentAnswerSpoken,
      lastSpokenText,
      recognitionAvailable,
      selectedCardId,
      selectedEntityRef,
      speaking,
      synthAvailable,
      visibleItems,
    ],
  );

  const value = useMemo<LeoSpokenSessionValue>(
    () => ({
      snapshot,
      speaking,
      paused,
      playbackState,
      pauseSupported,
      lastSpokenText,
      setVisibleItems,
      setSelected: (cardId, entityRef) => {
        setSelectedCardId(cardId);
        setSelectedEntityRef(entityRef);
      },
      setCurrentAnswer: (spoken, display) => {
        setCurrentAnswerSpoken(spoken);
        setCurrentAnswerDisplay(display);
      },
      speak,
      pause,
      resume,
      stop,
      repeat,
    }),
    [lastSpokenText, pause, pauseSupported, playbackState, paused, repeat, resume, snapshot, speak, speaking, stop],
  );

  return <LeoSpokenReactContext.Provider value={value}>{children}</LeoSpokenReactContext.Provider>;
}

export function useLeoSpokenSession(): LeoSpokenSessionValue {
  const ctx = useContext(LeoSpokenReactContext);
  if (!ctx) throw new Error("LeoSpokenSessionProvider required");
  return ctx;
}
