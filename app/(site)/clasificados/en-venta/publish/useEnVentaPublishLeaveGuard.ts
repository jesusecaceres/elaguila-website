"use client";

import { useEffect, useRef } from "react";
import {
  LEONIX_PREVIEW_NAV_SESSION_FLAG,
  LEONIX_RETURNING_TO_EDIT_SESSION_FLAG,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";
import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import {
  saveEnVentaPreviewDraft,
  saveEnVentaPreviewReturnDraft,
} from "@/app/clasificados/en-venta/preview/enVentaPreviewDraft";

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
 * Varios publish leave guard: persist draft on tab close/refresh instead of wiping storage.
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
      const s = stateRef.current;
      saveEnVentaPreviewDraft(p.plan, s, p.lang);
      saveEnVentaPreviewReturnDraft(p.plan, s);
    };

    const onPageHide = () => {
      if (isInFlowPublishNavigation()) return;
      persist();
    };

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!p.isDirty) return;
      if (isInFlowPublishNavigation()) return;
      persist();
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
