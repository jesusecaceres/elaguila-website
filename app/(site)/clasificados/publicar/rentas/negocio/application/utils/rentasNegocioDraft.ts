import {
  mergePartialRentasNegocioState,
  type RentasNegocioFormState,
} from "../../schema/rentasNegocioFormState";
import {
  clearRentasNegocioDraftMediaIdb,
  inlineRentasNegocioHeavyMediaFromIdb,
  offloadRentasNegocioHeavyMediaToIdb,
} from "./rentasNegocioDraftMedia";
import { rentasCategoriaPropiedadForTipo } from "@/app/clasificados/rentas/shared/rentasRentalTypeTaxonomy";

export const RENTAS_NEGOCIO_DRAFT_STORAGE_KEY = "rentas-negocio-draft-v1";

export const RENTAS_NEGOCIO_DRAFT_LS_FALLBACK_KEY = "rentas-negocio-draft-v1-ls-fallback";

function readDraftRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromSession = sessionStorage.getItem(RENTAS_NEGOCIO_DRAFT_STORAGE_KEY);
    if (fromSession != null && fromSession !== "") return fromSession;
    const fromFallback = localStorage.getItem(RENTAS_NEGOCIO_DRAFT_LS_FALLBACK_KEY);
    if (fromFallback) {
      try {
        sessionStorage.setItem(RENTAS_NEGOCIO_DRAFT_STORAGE_KEY, fromFallback);
      } catch {
        /* ignore */
      }
      return fromFallback;
    }
    const legacy = localStorage.getItem(RENTAS_NEGOCIO_DRAFT_STORAGE_KEY);
    if (legacy) {
      try {
        sessionStorage.setItem(RENTAS_NEGOCIO_DRAFT_STORAGE_KEY, legacy);
      } catch {
        /* ignore */
      }
      localStorage.removeItem(RENTAS_NEGOCIO_DRAFT_STORAGE_KEY);
      return legacy;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** BR-INV-WAVE1-GATE3: now async — resolves IndexedDB-offloaded photo/logo refs. */
export async function loadRentasNegocioDraft(): Promise<RentasNegocioFormState | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = readDraftRaw();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const merged = mergePartialRentasNegocioState(parsed as Partial<RentasNegocioFormState>);
    // Item 13 fix — legacy drafts saved before categoriaPropiedad was derived from tipoDeRenta may
    // carry a mismatched combination. Normalize on load rather than migrating storage
    // destructively: every other field is preserved untouched.
    const normalized = merged.tipoDeRenta
      ? { ...merged, categoriaPropiedad: rentasCategoriaPropiedadForTipo(merged.tipoDeRenta) }
      : merged;
    return await inlineRentasNegocioHeavyMediaFromIdb(normalized);
  } catch {
    return null;
  }
}

/** BR-INV-WAVE1-GATE3: now async — offloads heavy photo/logo data: URLs to IndexedDB first. */
export async function saveRentasNegocioDraft(state: RentasNegocioFormState): Promise<void> {
  if (typeof window === "undefined") return;
  const stripped: RentasNegocioFormState = {
    ...state,
    media: {
      ...state.media,
      videoLocalDataUrl: "",
    },
  } satisfies RentasNegocioFormState;
  const toSave = await offloadRentasNegocioHeavyMediaToIdb(stripped);
  const raw = JSON.stringify(toSave);
  try {
    sessionStorage.setItem(RENTAS_NEGOCIO_DRAFT_STORAGE_KEY, raw);
    try {
      localStorage.removeItem(RENTAS_NEGOCIO_DRAFT_LS_FALLBACK_KEY);
    } catch {
      /* ignore */
    }
    return;
  } catch {
    /* quota */
  }
  try {
    localStorage.setItem(RENTAS_NEGOCIO_DRAFT_LS_FALLBACK_KEY, raw);
  } catch {
    /* ignore */
  }
}

export async function clearRentasNegocioDraft(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(RENTAS_NEGOCIO_DRAFT_STORAGE_KEY);
    localStorage.removeItem(RENTAS_NEGOCIO_DRAFT_LS_FALLBACK_KEY);
    localStorage.removeItem(RENTAS_NEGOCIO_DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  await clearRentasNegocioDraftMediaIdb();
}
