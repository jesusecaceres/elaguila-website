import { clearChildInventoryMediaBridge } from "../brNegocioInventoryDraftPersistence";

/**
 * BR-INV-FINAL-WAVE-B — trimmed to only the exports still consumed after the confirmed-dead
 * BienesRaicesNegocioApplication.tsx 15-step wizard (its sole consumer) was deleted. The live
 * agente-individual flow uses its own draft/media modules (previewDraft.ts,
 * brAgenteResDraftMedia.ts); this file now only holds the shared session-key constants and the
 * cross-flow cleanup helper still called from classifiedsDraftStorage.ts / publishFlowLifecycleClient.ts.
 */
export const BR_NEGOCIO_PREVIEW_DRAFT_KEY = "br-negocio-preview-draft";
export const BR_NEGOCIO_PREVIEW_RETURN_KEY = "BR_NEGOCIO_PREVIEW_RETURN_DRAFT";

/** Drop BR Negocio preview handoff keys (leaving flow / logout). */
export function clearBienesRaicesNegocioPublishTempState(): void {
  clearChildInventoryMediaBridge();
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(BR_NEGOCIO_PREVIEW_DRAFT_KEY);
    sessionStorage.removeItem(BR_NEGOCIO_PREVIEW_RETURN_KEY);
  } catch {
    /* ignore */
  }
}
