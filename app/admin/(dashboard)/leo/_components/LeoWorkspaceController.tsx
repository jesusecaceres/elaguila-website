"use client";

/**
 * LEO-22A — Session-local visual workspace controller.
 * Conversation state is independent. No DB. No authority.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  leoPresentationIntentChangesWorkspace,
  type LeoPresentationIntent,
} from "@/app/leo/_lib/leoPresentationIntent";
import {
  LEO_DEFAULT_WORKSPACE,
  type LeoWorkspaceId,
} from "@/app/leo/_lib/leoWorkspaceModel";

type LeoWorkspaceControllerValue = {
  activeWorkspace: LeoWorkspaceId;
  conversationActive: boolean;
  historyLength: number;
  setWorkspace: (id: LeoWorkspaceId) => void;
  goBack: () => boolean;
  applyPresentationIntent: (intent: LeoPresentationIntent) => boolean;
  markConversationActive: () => void;
  focusConversation: () => void;
};

const LeoWorkspaceContext = createContext<LeoWorkspaceControllerValue | null>(null);

export function LeoWorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeWorkspace, setActive] = useState<LeoWorkspaceId>(LEO_DEFAULT_WORKSPACE);
  const [history, setHistory] = useState<LeoWorkspaceId[]>([]);
  const [conversationActive, setConversationActive] = useState(false);

  const setWorkspace = useCallback((id: LeoWorkspaceId) => {
    setActive((prev) => {
      if (prev === id) return prev;
      setHistory((h) => [...h.slice(-11), prev]);
      return id;
    });
    requestAnimationFrame(() => {
      document.getElementById("leo-active-workspace")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  const goBack = useCallback((): boolean => {
    let did = false;
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1]!;
      did = true;
      setActive(prev);
      return h.slice(0, -1);
    });
    return did;
  }, []);

  const markConversationActive = useCallback(() => {
    setConversationActive(true);
  }, []);

  const focusConversation = useCallback(() => {
    document.getElementById("leo-conversation-shell")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    const el = document.querySelector<HTMLTextAreaElement>("[data-leo-composer] textarea");
    el?.focus();
  }, []);

  const applyPresentationIntent = useCallback(
    (intent: LeoPresentationIntent): boolean => {
      if (intent.kind === "BACK") {
        markConversationActive();
        return goBack();
      }
      if (intent.kind === "NAVIGATE" || intent.kind === "PRESENT") {
        markConversationActive();
        setWorkspace(intent.workspace);
        return true;
      }
      if (intent.kind === "FOCUS_CONVERSATION") {
        markConversationActive();
        focusConversation();
        return true;
      }
      if (intent.kind === "OPEN_VISIBLE_ITEM") {
        return false;
      }
      return false;
    },
    [focusConversation, goBack, markConversationActive, setWorkspace],
  );

  const value = useMemo<LeoWorkspaceControllerValue>(
    () => ({
      activeWorkspace,
      conversationActive,
      historyLength: history.length,
      setWorkspace,
      goBack,
      applyPresentationIntent,
      markConversationActive,
      focusConversation,
    }),
    [
      activeWorkspace,
      conversationActive,
      history.length,
      applyPresentationIntent,
      focusConversation,
      goBack,
      markConversationActive,
      setWorkspace,
    ],
  );

  return <LeoWorkspaceContext.Provider value={value}>{children}</LeoWorkspaceContext.Provider>;
}

export function useLeoWorkspaceController(): LeoWorkspaceControllerValue {
  const ctx = useContext(LeoWorkspaceContext);
  if (!ctx) {
    throw new Error("LeoWorkspaceProvider required");
  }
  return ctx;
}

export function leoIntentIsWorkspaceCommand(intent: LeoPresentationIntent): boolean {
  return leoPresentationIntentChangesWorkspace(intent) || intent.kind === "FOCUS_CONVERSATION";
}
