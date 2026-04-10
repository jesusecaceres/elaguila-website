"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EMPLEOS_SESSION_KEYS } from "../constants/empleosSessionKeys";
import { normalizeEmpleosFeriaDraft, type EmpleosFeriaDraft } from "../types/empleosFeriaDraft";
import { normalizeEmpleosPremiumDraft, type EmpleosPremiumDraft } from "../types/empleosPremiumDraft";
import { normalizeEmpleosQuickDraft } from "../types/empleosQuickDraft";

/**
 * SessionStorage-backed draft: survives edit ↔ preview and in-tab refresh.
 * Clears when the browser tab is closed (session scope — not long-lived local drafts).
 */
export function useEmpleosDraftSession<T extends object>(storageKey: string, initial: T) {
  const initialRef = useRef(initial);
  initialRef.current = initial;

  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<T>;
        if (storageKey === EMPLEOS_SESSION_KEYS.quick) {
          setState(normalizeEmpleosQuickDraft(parsed as Parameters<typeof normalizeEmpleosQuickDraft>[0]) as T);
        } else if (storageKey === EMPLEOS_SESSION_KEYS.premium) {
          setState(normalizeEmpleosPremiumDraft(parsed as Partial<EmpleosPremiumDraft>) as T);
        } else if (storageKey === EMPLEOS_SESSION_KEYS.feria) {
          setState(normalizeEmpleosFeriaDraft(parsed as Partial<EmpleosFeriaDraft>) as T);
        } else {
          setState((prev) => ({ ...prev, ...parsed }));
        }
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
