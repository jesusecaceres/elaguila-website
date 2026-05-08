"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Generic session-storage backed draft hook for community quick flows.
 *
 * `normalize` is called on the raw parsed JSON to repair partial / legacy drafts so
 * the form always sees a fully-shaped state.
 */
export function useCommunityDraftSession<T extends object>(
  storageKey: string,
  initial: T,
  normalize: (raw: unknown) => T
) {
  const initialRef = useRef(initial);
  initialRef.current = initial;
  const normalizeRef = useRef(normalize);
  normalizeRef.current = normalize;

  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        setState(normalizeRef.current(JSON.parse(raw)));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [hydrated, storageKey, state]);

  const patch = useCallback((next: Partial<T> | ((prev: T) => T)) => {
    setState((prev) => (typeof next === "function" ? (next as (p: T) => T)(prev) : { ...prev, ...next }));
  }, []);

  const reset = useCallback(() => {
    const base = initialRef.current;
    setState(base);
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  return useMemo(() => ({ state, patch, reset, hydrated }), [state, patch, reset, hydrated]);
}

/** Synchronous flush so the latest edits are in sessionStorage before a preview navigation. */
export function flushCommunityDraftToSession(
  storageKey: string,
  state: object,
  normalize: (raw: unknown) => unknown
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(normalize(state)));
  } catch {
    /* ignore */
  }
}
