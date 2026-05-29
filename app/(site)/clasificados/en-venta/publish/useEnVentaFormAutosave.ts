"use client";

import { useEffect } from "react";
import { enVentaFormHasProgress } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { saveEnVentaPreviewDraft } from "@/app/clasificados/en-venta/preview/enVentaPreviewDraft";

/** Debounced autosave so refresh/preview/back-to-edit keep the Varios draft. */
export function useEnVentaFormAutosave(
  plan: "free" | "pro",
  state: EnVentaFreeApplicationState,
  lang: "es" | "en" = "es"
): void {
  useEffect(() => {
    if (!enVentaFormHasProgress(state)) return;
    const id = window.setTimeout(() => {
      saveEnVentaPreviewDraft(plan, state, lang);
    }, 700);
    return () => window.clearTimeout(id);
  }, [plan, state, lang]);
}

export const EN_VENTA_AUTOSAVE_COPY = {
  es: {
    title: "Borrador guardado automáticamente",
    body: "Puedes volver, actualizar la página o abrir la vista previa sin perder tu información. Algunas fotos o videos grandes pueden requerir volver a cargarse si cierras el navegador.",
  },
  en: {
    title: "Draft saved automatically",
    body: "You can go back, refresh, or preview without losing your information. Some large photos or videos may need to be uploaded again if you close the browser.",
  },
} as const;

export function confirmLeaveEnVentaPublishFlow(lang: "es" | "en"): boolean {
  const msg =
    lang === "es"
      ? "¿Salir del formulario? Tu borrador guardado sigue disponible en esta sesión."
      : "Leave the form? Your saved draft stays available in this session.";
  return window.confirm(msg);
}
