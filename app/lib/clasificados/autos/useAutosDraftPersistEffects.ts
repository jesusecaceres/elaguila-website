"use client";

import { useEffect } from "react";

/** Debounced + immediate flush on tab close/refresh so in-progress drafts survive F5. */
export function useAutosDraftPersistEffects(
  hydrated: boolean,
  flushDraft: () => Promise<void>,
  deps: unknown[],
  debounceMs = 400,
): void {
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      void flushDraft();
    }, debounceMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies draft deps
  }, [hydrated, flushDraft, debounceMs, ...deps]);

  useEffect(() => {
    if (!hydrated) return;
    const flush = () => {
      void flushDraft();
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
    };
  }, [hydrated, flushDraft]);
}
