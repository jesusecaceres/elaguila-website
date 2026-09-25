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
 * in-app (SPA) navigation to a route outside `isPathInsideFlow` (checked on unmount).
 * Deliberately does NOT clear on `pagehide` / `pageshow`: those fire identically for a hard
 * refresh and a real tab close, so treating them as "leaving the flow" silently wiped the
 * in-progress (paid) draft -- sessionStorage, localStorage and IndexedDB media -- on a plain
 * refresh of the form or preview. Refresh must be draft-safe; explicit resets ("Reiniciar")
 * and post-publish clears remain the owners of intentional wipes.
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
