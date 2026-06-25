/**
 * Ofertas Locales scan review runtime — polling + progress copy (Gate OFERTAS-REVIEW-RUNTIME-1).
 */

import type { OfertasLocalesAppLang } from "./useOfertasLocalesAppLang";
import type { OfertaLocalItemReviewViewModel } from "./ofertasLocalesTypes";

export const OFERTA_LOCAL_SCAN_REVIEW_POLL_MS = 3500;
export const OFERTA_LOCAL_SCAN_REVIEW_POLL_TIMEOUT_MS = 10 * 60 * 1000;
export const OFERTA_LOCAL_SCAN_UI_LONG_WAIT_MS = 3 * 60 * 1000;

export type OfertaLocalScanUiPhase =
  | "preparing"
  | "rendering_pages"
  | "gemini_analysis"
  | "generating_crops"
  | "saving"
  | "long_wait";

export function getOfertaLocalScanPhaseMessage(
  elapsedMs: number,
  lang: OfertasLocalesAppLang
): { phase: OfertaLocalScanUiPhase; message: string; longWait: boolean } {
  const es: Record<OfertaLocalScanUiPhase, string> = {
    preparing: "Preparando archivo…",
    rendering_pages: "Renderizando páginas…",
    gemini_analysis: "Analizando con Gemini…",
    generating_crops: "Generando recortes…",
    saving: "Guardando sugerencias…",
    long_wait:
      "El escaneo sigue procesando. Puedes esperar o revisar los resultados que ya estén disponibles abajo.",
  };
  const en: Record<OfertaLocalScanUiPhase, string> = {
    preparing: "Preparing file…",
    rendering_pages: "Rendering pages…",
    gemini_analysis: "Analyzing with Gemini…",
    generating_crops: "Generating ad clips…",
    saving: "Saving suggestions…",
    long_wait:
      "The scan is still processing. You can wait or review any results already available below.",
  };
  const copy = lang === "en" ? en : es;

  if (elapsedMs >= OFERTA_LOCAL_SCAN_UI_LONG_WAIT_MS) {
    return { phase: "long_wait", message: copy.long_wait, longWait: true };
  }
  if (elapsedMs < 15_000) return { phase: "preparing", message: copy.preparing, longWait: false };
  if (elapsedMs < 45_000) return { phase: "rendering_pages", message: copy.rendering_pages, longWait: false };
  if (elapsedMs < 120_000) return { phase: "gemini_analysis", message: copy.gemini_analysis, longWait: false };
  if (elapsedMs < 180_000) return { phase: "generating_crops", message: copy.generating_crops, longWait: false };
  return { phase: "saving", message: copy.saving, longWait: false };
}

export function formatScanElapsed(seconds: number, lang: OfertasLocalesAppLang): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (lang === "en") return m > 0 ? `${m}m ${s}s` : `${s}s`;
  return m > 0 ? `${m} min ${s} s` : `${s} s`;
}

export function logOfertaLocalScanUi(event: string, payload: Record<string, unknown> = {}): void {
  console.info(`[ofertas-locales scan ui] ${event}`, payload);
}

export function isOfertaLocalScanJobActive(status: string | undefined): boolean {
  return status === "pending" || status === "processing";
}

export function pickDefaultOfertaLocalReviewItemId(
  items: OfertaLocalItemReviewViewModel[]
): string | null {
  if (items.length === 0) return null;
  const needsReview = items.find((item) => item.reviewStatus === "needs_review");
  return needsReview?.id ?? items[0].id;
}
