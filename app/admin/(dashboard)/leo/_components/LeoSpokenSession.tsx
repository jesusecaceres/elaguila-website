"use client";

/**
 * LEO-22B — Shared spoken session (single TTS stream).
 * Hands-Free starts only from an owner gesture. No always-on mic. No paid TTS.
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
} from "@/app/leo/_lib/leoSpeechSynthesis";
import { useLeoWorkspaceController } from "./LeoWorkspaceController";

type LeoSpokenSessionValue = {
  snapshot: LeoSpokenSessionSnapshot;
  speaking: boolean;
  lastSpokenText: string | null;
  setVisibleItems: (items: LeoAddressableSpokenItem[]) => void;
  setSelected: (cardId: string | null, entityRef: LeoConversationEntityRef | null) => void;
  setCurrentAnswer: (spoken: string | null, display: string | null) => void;
  speak: (text: string, options?: { onEnded?: () => void }) => boolean;
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
  const [speaking, setSpeaking] = useState(false);
  const [synthAvailable, setSynthAvailable] = useState(false);
  const [recognitionAvailable, setRecognitionAvailable] = useState(false);

  const ttsRef = useRef<ReturnType<typeof createLeoSpeechSynthesisController> | null>(null);
  const utteranceEndedRef = useRef<(() => void) | null>(null);

  const fireUtteranceEnded = useCallback(() => {
    const cb = utteranceEndedRef.current;
    utteranceEndedRef.current = null;
    cb?.();
  }, []);

  useEffect(() => {
    setSynthAvailable(getLeoSpeechSynthesisCapability(window).supported);
    setRecognitionAvailable(
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window,
    );
    const lang = resolveLeoSpeechSynthesisLang("auto", navigator.language);
    ttsRef.current = createLeoSpeechSynthesisController(window, lang, {
      onStateChange: (s) => setSpeaking(s === "SPEAKING"),
      onEnd: () => {
        setSpeaking(false);
        fireUtteranceEnded();
      },
      onError: () => {
        setSpeaking(false);
        fireUtteranceEnded();
      },
    });
    return () => {
      utteranceEndedRef.current = null;
      ttsRef.current?.dispose();
      ttsRef.current = null;
    };
  }, [fireUtteranceEnded]);

  const speak = useCallback((text: string, options?: { onEnded?: () => void }) => {
    const trimmed = text.trim();
    if (!trimmed || !ttsRef.current) return false;
    utteranceEndedRef.current = options?.onEnded ?? null;
    ttsRef.current.stop();
    ttsRef.current.speak(trimmed);
    setLastSpokenText(trimmed);
    return true;
  }, []);

  const stop = useCallback(() => {
    utteranceEndedRef.current = null;
    ttsRef.current?.stop();
    setSpeaking(false);
  }, []);

  const repeat = useCallback((options?: { onEnded?: () => void }) => {
    if (!lastSpokenText || !ttsRef.current) return false;
    utteranceEndedRef.current = options?.onEnded ?? null;
    ttsRef.current.repeat(lastSpokenText);
    return true;
  }, [lastSpokenText]);

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
      stop,
      repeat,
    }),
    [lastSpokenText, repeat, snapshot, speak, speaking, stop],
  );

  return <LeoSpokenReactContext.Provider value={value}>{children}</LeoSpokenReactContext.Provider>;
}

export function useLeoSpokenSession(): LeoSpokenSessionValue {
  const ctx = useContext(LeoSpokenReactContext);
  if (!ctx) throw new Error("LeoSpokenSessionProvider required");
  return ctx;
}
