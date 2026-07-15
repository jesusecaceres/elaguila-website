import type { AutoDealerListing } from "../types/autoDealerListing";
import { normalizeLoadedListing } from "./autoDealerDraftDefaults";
import { buildAutosNegociosDraftLocalStorageKey, LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY } from "./autosNegociosDraftNamespace";
import { stripDraftMuxFields } from "./autosNegociosDraftGuards";
import { idbClearDraftVideo, idbGetDraftVideoDataUrl, idbPutDraftVideoDataUrl } from "./autosNegociosDraftVideoIdb";
import {
  clearAdditionalInventoryVehiclesIdb,
  clearDraftListingImageAndLogoIdb,
  inlineAdditionalInventoryVehiclesFromIdb,
  inlineDraftListingAssetsFromIdb,
  inlineInventoryVehicleMediaFromIdb,
  offloadAdditionalInventoryVehiclesToIdb,
  offloadDraftListingAssetsToIdb,
  offloadInventoryVehicleMediaToIdb,
  stripUnresolvedIdbRefsFromListing,
} from "./autosNegociosDraftIdbRefs";
import { safeNormalizeAutosDraftListing } from "@/app/clasificados/autos/shared/lib/safeNormalizeAutosDraftListing";
import { buildAutosNegociosActiveDraftSessionKey } from "@/app/lib/clasificados/autos/autosSessionDraftKeys";
import {
  normalizeAdditionalInventoryVehicles,
  sanitizeAdditionalInventoryVehiclesForDraft,
  type AutosAdditionalInventoryVehicleDraft,
} from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";

/** @deprecated Use `LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY` or `storageEventAffectsAutosNegociosDraft`. */
export const AUTOS_NEGOCIOS_DRAFT_KEY = LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY;

export { AUTOS_NEGOCIOS_DRAFT_STORAGE_PREFIX, LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY } from "./autosNegociosDraftNamespace";
export { storageEventAffectsAutosNegociosDraft } from "./autosNegociosDraftNamespace";

export type AutosNegociosDraftV1 = {
  v: 1;
  /** When true, auto title from Y/M/M/T is disabled. */
  vehicleTitleOverride: boolean;
  listing: AutoDealerListing;
  /** Stepped shell index (0-based). Paso 7 = 6. */
  editorStep?: number;
  editorMaxReached?: number;
  /** Additional vehicles bundled with the same application (not published alone). */
  additionalInventoryVehicles?: AutosAdditionalInventoryVehicleDraft[];
  /** Unsaved child drawer draft — survives refresh and accidental close (Negocios only). */
  inProgressInventoryVehicleDraft?: AutosAdditionalInventoryVehicleDraft | null;
  /** When drawer is open: null = add new; string = editing saved child id. */
  inventoryDrawerEditingId?: string | null;
  inventoryDrawerOpen?: boolean;
  /** Pre-publish application: seller selected Inventory Boost add-on (+$129/mo, 20 slots). */
  inventoryBoostSelected?: boolean;
};

export function isAutosNegociosDraftV1(x: unknown): x is AutosNegociosDraftV1 {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return o.v === 1 && typeof o.vehicleTitleOverride === "boolean" && typeof o.listing === "object" && o.listing !== null;
}

function coerceLooseAutosNegociosDraftV1(parsed: unknown): AutosNegociosDraftV1 | null {
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  if (o.v !== 1) return null;
  if (!o.listing || typeof o.listing !== "object") return null;
  const vehicleTitleOverride = o.vehicleTitleOverride === true;
  return {
    v: 1,
    vehicleTitleOverride,
    listing: safeNormalizeAutosDraftListing(o.listing, "negocios"),
    editorStep: typeof o.editorStep === "number" ? o.editorStep : undefined,
    editorMaxReached: typeof o.editorMaxReached === "number" ? o.editorMaxReached : undefined,
    additionalInventoryVehicles: normalizeAdditionalInventoryVehicles(o.additionalInventoryVehicles),
    inProgressInventoryVehicleDraft:
      o.inProgressInventoryVehicleDraft && typeof o.inProgressInventoryVehicleDraft === "object"
        ? (normalizeAdditionalInventoryVehicles([o.inProgressInventoryVehicleDraft])[0] ?? null)
        : undefined,
    inventoryDrawerEditingId:
      o.inventoryDrawerEditingId === null || typeof o.inventoryDrawerEditingId === "string"
        ? o.inventoryDrawerEditingId
        : undefined,
    inventoryDrawerOpen: o.inventoryDrawerOpen === true ? true : undefined,
    inventoryBoostSelected: o.inventoryBoostSelected === true ? true : undefined,
  };
}

function stripBrokenFileVideo(listing: AutoDealerListing): AutoDealerListing {
  if (listing.videoSourceType !== "file") return listing;
  if (listing.videoFileDataUrl?.trim()) return listing;
  return {
    ...listing,
    videoSourceType: null,
    videoFileDataUrl: undefined,
    videoFileName: undefined,
    videoUploadStatus: null,
  };
}

/** Read draft JSON from sessionStorage; one-time migrate from legacy localStorage. */
function readAutosNegociosDraftJson(namespace: string): string | null {
  if (typeof window === "undefined") return null;
  const sessionKey = buildAutosNegociosActiveDraftSessionKey(namespace);
  try {
    const fromSession = window.sessionStorage.getItem(sessionKey);
    if (fromSession) return fromSession;
  } catch {
    /* ignore */
  }
  const legacyKey = buildAutosNegociosDraftLocalStorageKey(namespace);
  try {
    const fromLocal = window.localStorage.getItem(legacyKey);
    if (!fromLocal) return null;
    window.sessionStorage.setItem(sessionKey, fromLocal);
    window.localStorage.removeItem(legacyKey);
    return fromLocal;
  } catch {
    return null;
  }
}

function writeAutosNegociosDraftJson(namespace: string, json: string): void {
  if (typeof window === "undefined") return;
  const sessionKey = buildAutosNegociosActiveDraftSessionKey(namespace);
  try {
    window.sessionStorage.setItem(sessionKey, json);
  } catch {
    /* quota / private mode */
  }
  try {
    window.localStorage.removeItem(buildAutosNegociosDraftLocalStorageKey(namespace));
    window.localStorage.removeItem(LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

/** Synchronous parse of sessionStorage JSON only (large video may live in IndexedDB). */
export function loadAutosNegociosDraft(namespace: string): AutosNegociosDraftV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = readAutosNegociosDraftJson(namespace);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isAutosNegociosDraftV1(parsed)) {
      return {
        v: 1,
        vehicleTitleOverride: parsed.vehicleTitleOverride,
        listing: safeNormalizeAutosDraftListing(parsed.listing, "negocios"),
        editorStep: parsed.editorStep,
        editorMaxReached: parsed.editorMaxReached,
        additionalInventoryVehicles: normalizeAdditionalInventoryVehicles(parsed.additionalInventoryVehicles),
        inProgressInventoryVehicleDraft: parsed.inProgressInventoryVehicleDraft ?? undefined,
        inventoryDrawerEditingId: parsed.inventoryDrawerEditingId,
        inventoryDrawerOpen: parsed.inventoryDrawerOpen,
      };
    }
    return coerceLooseAutosNegociosDraftV1(parsed);
  } catch {
    return null;
  }
}

/**
 * Full draft load: merges local video + image/logo blobs from IndexedDB when stripped from JSON.
 * Never throws; drops broken assets and returns null only when nothing usable remains.
 */
export async function loadAutosNegociosDraftResolved(namespace: string): Promise<AutosNegociosDraftV1 | null> {
  try {
    const sync = loadAutosNegociosDraft(namespace);
    if (!sync) return null;

    const baseListing = stripDraftMuxFields(safeNormalizeAutosDraftListing(sync.listing, "negocios"));

    let listing = baseListing;
    try {
      listing = await inlineDraftListingAssetsFromIdb(namespace, listing);
    } catch {
      listing = stripDraftMuxFields(safeNormalizeAutosDraftListing(sync.listing, "negocios"));
    }

    listing = stripDraftMuxFields(safeNormalizeAutosDraftListing(listing, "negocios"));

    if (listing.videoSourceType === "file") {
      const inline = listing.videoFileDataUrl?.trim();
      if (!inline) {
        try {
          const fromIdb = await idbGetDraftVideoDataUrl(namespace);
          if (fromIdb) {
            listing = { ...listing, videoFileDataUrl: fromIdb };
          } else {
            listing = stripBrokenFileVideo(listing);
          }
        } catch {
          listing = stripBrokenFileVideo(listing);
        }
      }
    }

    listing = stripDraftMuxFields(safeNormalizeAutosDraftListing(listing, "negocios"));

    let additionalInventoryVehicles = sync.additionalInventoryVehicles;
    try {
      additionalInventoryVehicles = await inlineAdditionalInventoryVehiclesFromIdb(namespace, additionalInventoryVehicles);
    } catch {
      /* keep JSON refs */
    }
    additionalInventoryVehicles = sanitizeAdditionalInventoryVehiclesForDraft(additionalInventoryVehicles);

    let inProgressInventoryVehicleDraft = sync.inProgressInventoryVehicleDraft ?? null;
    if (inProgressInventoryVehicleDraft) {
      try {
        inProgressInventoryVehicleDraft = await inlineInventoryVehicleMediaFromIdb(namespace, inProgressInventoryVehicleDraft);
      } catch {
        /* keep JSON */
      }
    }

    return {
      ...sync,
      listing,
      additionalInventoryVehicles,
      inProgressInventoryVehicleDraft,
    };
  } catch {
    return null;
  }
}

/**
 * Persists draft: offloads large data URLs to IndexedDB so localStorage quota does not drop the draft.
 * Mux: attach `muxAssetId` / `muxPlaybackId` only after publish/checkout is wired — loads strip these for safe preview.
 */
export async function saveAutosNegociosDraftResolved(namespace: string, draft: AutosNegociosDraftV1): Promise<void> {
  if (typeof window === "undefined") return;
  let listing = stripDraftMuxFields(normalizeLoadedListing(draft.listing));
  listing = await offloadDraftListingAssetsToIdb(namespace, listing);
  let toStore = listing;

  const additionalInventoryVehicles = sanitizeAdditionalInventoryVehiclesForDraft(
    await offloadAdditionalInventoryVehiclesToIdb(namespace, draft.additionalInventoryVehicles),
  );
  let inProgressInventoryVehicleDraft = draft.inProgressInventoryVehicleDraft ?? null;
  if (inProgressInventoryVehicleDraft) {
    inProgressInventoryVehicleDraft = await offloadInventoryVehicleMediaToIdb(namespace, inProgressInventoryVehicleDraft);
  }

  if (listing.videoSourceType === "file") {
    const raw = listing.videoFileDataUrl?.trim() ?? "";
    if (raw) {
      await idbPutDraftVideoDataUrl(namespace, raw);
      toStore = { ...listing, videoFileDataUrl: undefined };
    } else {
      await idbClearDraftVideo(namespace);
    }
  } else {
    await idbClearDraftVideo(namespace);
  }

  const payload: AutosNegociosDraftV1 = {
    ...draft,
    listing: stripDraftMuxFields(normalizeLoadedListing(toStore)),
    additionalInventoryVehicles,
    inProgressInventoryVehicleDraft,
  };

  try {
    writeAutosNegociosDraftJson(namespace, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export async function clearAutosNegociosDraft(namespace: string): Promise<void> {
  if (typeof window === "undefined") return;
  const sync = loadAutosNegociosDraft(namespace);
  const sessionKey = buildAutosNegociosActiveDraftSessionKey(namespace);
  try {
    window.sessionStorage.removeItem(sessionKey);
  } catch {
    /* ignore */
  }
  const legacyKey = buildAutosNegociosDraftLocalStorageKey(namespace);
  try {
    window.localStorage.removeItem(legacyKey);
  } catch {
    /* ignore */
  }
  try {
    window.localStorage.removeItem(LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY);
  } catch {
    /* ignore */
  }
  await clearDraftListingImageAndLogoIdb(namespace, sync?.listing ?? null);
  await clearAdditionalInventoryVehiclesIdb(namespace, sync?.additionalInventoryVehicles);
  if (sync?.inProgressInventoryVehicleDraft) {
    await clearAdditionalInventoryVehiclesIdb(namespace, [sync.inProgressInventoryVehicleDraft]);
  }
  await idbClearDraftVideo(namespace);
}
