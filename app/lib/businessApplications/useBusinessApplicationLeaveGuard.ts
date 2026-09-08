"use client";

import { useEffect, useRef } from "react";
import {
  LEONIX_PREVIEW_NAV_SESSION_FLAG,
  LEONIX_RETURNING_TO_EDIT_SESSION_FLAG,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";

/**
 * Reuses the existing shared "in-flow publish navigation" session flags (already set by
 * Servicios around its preview/"Volver a editar" links) so the native exit warning never
 * fires for expected in-app preview round-trips — mirrors the suppression check in
 * publishFlowLifecycleClient.ts without duplicating that file's destructive
 * abandon-on-pagehide behavior, which is not appropriate for these categories' persistent,
 * refresh-safe drafts.
 */
function isInFlowBusinessApplicationNavigation(): boolean {
  try {
    if (sessionStorage.getItem(LEONIX_PREVIEW_NAV_SESSION_FLAG) === "1") return true;
    if (sessionStorage.getItem(LEONIX_RETURNING_TO_EDIT_SESSION_FLAG) === "1") return true;
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Shared unsaved-exit protection for long business-listing applications (Servicios,
 * Restaurantes, Comida Local). Only ever warns via the native beforeunload prompt on a
 * true browser/tab exit and best-effort re-persists via the caller's own save function on
 * pagehide — it never clears, resets, or reshapes any category's draft storage. Each
 * category keeps its own existing persistence engine; this hook only observes `isDirty`
 * and calls the category's own `persist` callback, so draft keys/schemas never change.
 */
export function useBusinessApplicationLeaveGuard(p: {
  isDirty: boolean;
  persist?: () => void;
}): void {
  const persistRef = useRef(p.persist);
  persistRef.current = p.persist;

  useEffect(() => {
    const onPageHide = () => {
      if (isInFlowBusinessApplicationNavigation()) return;
      if (!p.isDirty) return;
      persistRef.current?.();
    };

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isInFlowBusinessApplicationNavigation()) return;
      if (!p.isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [p.isDirty]);
}
