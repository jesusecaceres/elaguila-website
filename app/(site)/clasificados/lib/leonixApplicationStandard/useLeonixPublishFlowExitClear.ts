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
 * Clears unpublished application state only when the user actually leaves the flow via an
 * in-app (SPA) navigation to a route outside `isPathInsideFlow`. Deliberately does NOT clear
 * on `pagehide`/`pageshow` — those fire identically for a hard refresh and for a real tab
 * close, so treating them as "leaving the flow" silently wiped in-progress drafts on refresh.
 * A real tab close is left to the storage layer's own session scoping; this mirrors the
 * refresh-safe pattern already used by Servicios/Restaurantes/Comida Local via
 * `useBusinessApplicationLeaveGuard` instead of duplicating the destructive abandon-on-pagehide
 * behavior from `publishFlowLifecycleClient.ts`.
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
