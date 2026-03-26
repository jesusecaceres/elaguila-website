import {
  createEmptyEnVentaFreeState,
  type EnVentaFreeApplicationState,
} from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";

export const EN_VENTA_PREVIEW_DRAFT_KEY_FREE = "en-venta-preview-draft-free";
export const EN_VENTA_PREVIEW_DRAFT_KEY_PRO = "en-venta-preview-draft-pro";

function keyForPlan(plan: "free" | "pro") {
  return plan === "free" ? EN_VENTA_PREVIEW_DRAFT_KEY_FREE : EN_VENTA_PREVIEW_DRAFT_KEY_PRO;
}

export function saveEnVentaPreviewDraft(plan: "free" | "pro", state: EnVentaFreeApplicationState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(keyForPlan(plan), JSON.stringify(state));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadEnVentaPreviewDraft(plan: "free" | "pro"): EnVentaFreeApplicationState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(keyForPlan(plan));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<EnVentaFreeApplicationState>;
    const base = createEmptyEnVentaFreeState();
    return {
      ...base,
      ...parsed,
      listingVideoSlots:
        Array.isArray(parsed.listingVideoSlots) && parsed.listingVideoSlots.length === 2
          ? [ { ...base.listingVideoSlots[0], ...parsed.listingVideoSlots[0] }, { ...base.listingVideoSlots[1], ...parsed.listingVideoSlots[1] } ]
          : base.listingVideoSlots,
    };
  } catch {
    return null;
  }
}
