"use client";

import { useEffect, useRef } from "react";

export type UseLeonixPublishFlowExitClearArgs = {
  /** When true, skip all clearing (e.g. after successful publish before redirect). */
  getSuspend: () => boolean;
  /** Return true if `pathname` should keep draft/media alive (form + preview routes). */
  isPathInsideFlow: (pathname: string) => boolean;
  onClear: () => void;
};

/**
 * Clears unpublished application state when the user leaves the flow (SPA navigation),
 * closes/refreshes the tab (`pagehide`), or returns via bfcache (`pageshow` persisted).
 * Callers must pass `isPathInsideFlow` that includes every in-flow URL segment (form + preview).
 */
export function useLeonixPublishFlowExitClear({ getSuspend, isPathInsideFlow, onClear }: UseLeonixPublishFlowExitClearArgs) {
  const getSuspendRef = useRef(getSuspend);
  getSuspendRef.current = getSuspend;
  const isPathInsideFlowRef = useRef(isPathInsideFlow);
  isPathInsideFlowRef.current = isPathInsideFlow;
  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;

  useEffect(() => {
    const runClear = () => {
      if (getSuspendRef.current()) return;
      onClearRef.current();
    };

    const onPageHide = () => {
      runClear();
    };

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) runClear();
    };

    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (getSuspendRef.current()) return;
      queueMicrotask(() => {
        if (getSuspendRef.current()) return;
        try {
          const p = window.location.pathname;
          if (!isPathInsideFlowRef.current(p)) onClearRef.current();
        } catch {
          onClearRef.current();
        }
      });
    };
  }, []);
}
