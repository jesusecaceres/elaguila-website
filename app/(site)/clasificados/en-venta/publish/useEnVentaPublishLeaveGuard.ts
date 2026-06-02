"use client";

import { useEffect, useRef } from "react";
import {
  LEONIX_PREVIEW_NAV_SESSION_FLAG,
  LEONIX_RETURNING_TO_EDIT_SESSION_FLAG,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";
import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import {
  hasEnVentaPreviewDraft,
  saveEnVentaPreviewDraft,
  saveEnVentaPreviewReturnDraft,
} from "@/app/clasificados/en-venta/preview/enVentaPreviewDraft";
import { enVentaHasUnsafeLeaveState } from "./enVentaPublishLeaveUnsafe";

function isInFlowPublishNavigation(): boolean {
  try {
    if (sessionStorage.getItem(LEONIX_PREVIEW_NAV_SESSION_FLAG) === "1") return true;
    if (sessionStorage.getItem(LEONIX_RETURNING_TO_EDIT_SESSION_FLAG) === "1") return true;
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Sync-save draft; returns whether a restorable copy exists (memory or sessionStorage).
 */
function persistAndHasRestorableDraft(
  plan: "free" | "pro",
  state: EnVentaFreeApplicationState,
  lang: "es" | "en"
): boolean {
  saveEnVentaPreviewDraft(plan, state, lang);
  saveEnVentaPreviewReturnDraft(plan, state);
  return hasEnVentaPreviewDraft(plan);
}

/**
 * Native reload warning only when publish/video upload is active, or progress cannot be persisted.
 */
function shouldWarnBeforeUnload(
  plan: "free" | "pro",
  isDirty: boolean,
  state: EnVentaFreeApplicationState,
  lang: "es" | "en"
): boolean {
  if (!isDirty) return false;
  if (enVentaHasUnsafeLeaveState()) return true;
  return !persistAndHasRestorableDraft(plan, state, lang);
}

/**
 * Varios publish leave guard: persist draft on tab close/refresh; no scary warning when autosaved.
 */
export function useEnVentaPublishLeaveGuard(p: {
  lang: "es" | "en";
  plan: "free" | "pro";
  isDirty: boolean;
  state: EnVentaFreeApplicationState;
}): void {
  const stateRef = useRef(p.state);
  stateRef.current = p.state;

  useEffect(() => {
    const persist = () => {
      if (!p.isDirty) return;
      persistAndHasRestorableDraft(p.plan, stateRef.current, p.lang);
    };

    const onPageHide = () => {
      if (isInFlowPublishNavigation()) return;
      persist();
    };

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isInFlowPublishNavigation()) return;
      if (!shouldWarnBeforeUnload(p.plan, p.isDirty, stateRef.current, p.lang)) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [p.isDirty, p.lang, p.plan]);
}
