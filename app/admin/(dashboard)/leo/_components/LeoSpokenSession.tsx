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
  speak: (text: string) => boolean;
  stop: () => void;
  repeat: () => boolean;
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

  useEffect(() => {
    setSynthAvailable(getLeoSpeechSynthesisCapability(window).supported);
    setRecognitionAvailable(
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window,
    );
    const lang = resolveLeoSpeechSynthesisLang("auto", navigator.language);
    ttsRef.current = createLeoSpeechSynthesisController(window, lang, {
      onStateChange: (s) => setSpeaking(s === "SPEAKING"),
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
    return () => {
      ttsRef.current?.dispose();
      ttsRef.current = null;
    };
  }, []);

  const speak = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !ttsRef.current) return false;
    ttsRef.current.stop();
    ttsRef.current.speak(trimmed);
    setLastSpokenText(trimmed);
    return true;
  }, []);

  const stop = useCallback(() => {
    ttsRef.current?.stop();
    setSpeaking(false);
  }, []);

  const repeat = useCallback(() => {
    if (!lastSpokenText || !ttsRef.current) return false;
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
