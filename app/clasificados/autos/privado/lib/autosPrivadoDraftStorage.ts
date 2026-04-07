import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { normalizeLoadedListing } from "@/app/clasificados/autos/negocios/lib/autoDealerDraftDefaults";
import { buildAutosPrivadoDraftLocalStorageKey } from "./autosPrivadoDraftNamespace";

export type AutosPrivadoDraftV1 = {
  v: 1;
  vehicleTitleOverride: boolean;
  listing: AutoDealerListing;
};

export function isAutosPrivadoDraftV1(x: unknown): x is AutosPrivadoDraftV1 {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return o.v === 1 && typeof o.vehicleTitleOverride === "boolean" && typeof o.listing === "object" && o.listing !== null;
}

export function loadAutosPrivadoDraft(namespace: string): AutosPrivadoDraftV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(buildAutosPrivadoDraftLocalStorageKey(namespace));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isAutosPrivadoDraftV1(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function loadAutosPrivadoDraftResolved(namespace: string): Promise<AutosPrivadoDraftV1 | null> {
  const sync = loadAutosPrivadoDraft(namespace);
  if (!sync) return null;
  const listing = normalizeLoadedListing({ ...sync.listing, autosLane: "privado" });
  return { ...sync, listing };
}

export async function saveAutosPrivadoDraftResolved(namespace: string, draft: AutosPrivadoDraftV1): Promise<void> {
  if (typeof window === "undefined") return;
  const listing = normalizeLoadedListing({ ...draft.listing, autosLane: "privado" });
  const payload: AutosPrivadoDraftV1 = { ...draft, listing };
  window.localStorage.setItem(buildAutosPrivadoDraftLocalStorageKey(namespace), JSON.stringify(payload));
}

export async function clearAutosPrivadoDraft(namespace: string): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(buildAutosPrivadoDraftLocalStorageKey(namespace));
}
