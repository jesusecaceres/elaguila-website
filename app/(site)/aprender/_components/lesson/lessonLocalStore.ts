"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Gate G2 — anonymous, device-local lesson state (activity answers, checklist ticks, prompt
 * fields). localStorage only: nothing here is sent to Leonix, to an AI, or anywhere else. Server
 * progress semantics are untouched in G2 (that is Gate G5).
 */
const STORAGE_KEY = "leonix.learning.v1";
const CHANGE_EVENT = "leonix:learning-store";

export type LessonLocalState = {
  answers: Record<string, string>;
  checklist: Record<string, boolean>;
  prompt: Record<string, string>;
};

const EMPTY: LessonLocalState = { answers: {}, checklist: {}, prompt: {} };

type StoreShape = { lessons?: Record<string, Partial<LessonLocalState>> };

function readStore(): StoreShape {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === "object" ? (parsed as StoreShape) : {};
  } catch {
    return {};
  }
}

function readLesson(lessonKey: string): LessonLocalState {
  const stored = readStore().lessons?.[lessonKey];
  return { answers: { ...(stored?.answers ?? {}) }, checklist: { ...(stored?.checklist ?? {}) }, prompt: { ...(stored?.prompt ?? {}) } };
}

function writeLesson(lessonKey: string, next: LessonLocalState): void {
  try {
    const store = readStore();
    store.lessons = { ...(store.lessons ?? {}), [lessonKey]: next };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Private mode / storage full: the lesson still works, it just does not remember.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: lessonKey }));
}

/** Shared by every client island of one lesson so the activity, prompt, checklist, completion and print sheet stay in sync. */
export function useLessonLocalState(lessonKey: string): {
  state: LessonLocalState;
  hydrated: boolean;
  update: (patch: (prev: LessonLocalState) => LessonLocalState) => void;
} {
  const [state, setState] = useState<LessonLocalState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setState(readLesson(lessonKey));
    sync();
    setHydrated(true);
    const onChange = (e: Event) => {
      if (e instanceof CustomEvent && e.detail !== lessonKey) return;
      sync();
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", sync);
    };
  }, [lessonKey]);

  const update = useCallback(
    (patch: (prev: LessonLocalState) => LessonLocalState) => {
      writeLesson(lessonKey, patch(readLesson(lessonKey)));
    },
    [lessonKey],
  );

  return { state, hydrated, update };
}

/** Clipboard with a no-permission fallback; resolves false instead of throwing. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the textarea fallback
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
