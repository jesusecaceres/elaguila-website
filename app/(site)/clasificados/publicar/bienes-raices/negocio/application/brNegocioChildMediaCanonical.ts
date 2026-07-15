/**
 * Bienes child inventory — single canonical media collection (Autos mediaImages conceptual parity).
 * Display consumers use `url` after `hydrateBrChildMediaCanonical` / `resolveBrChildMediaImagesForDisplay`.
 * Persistence uses `durableRef` (IDB / http) — never object URLs as durable storage.
 */

import {
  BR_AGENTE_IDB_PREFIX,
  resolveBrAgenteIdbMediaRefToDataUrl,
} from "../agente-individual/application/utils/brAgenteResDraftMedia";

export type BrChildMediaImage = {
  id: string;
  /** Display src after resolve — never an unresolved IDB token. */
  url: string;
  /** Durable persistence token (IDB / http) — never a data: blob. */
  durableRef: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type BrChildMediaAliasInput = {
  childId?: string | null;
  fotosDataUrls?: string[] | null;
  fotoPortadaIndex?: number | null;
  photoUrls?: string[] | null;
  mainPhotoUrl?: string | null;
  primaryPhotoIndex?: number | null;
};

export type BrChildMediaProjectedFields = {
  fotosDataUrls: string[];
  fotoPortadaIndex: number;
  photoUrls: string[];
  mainPhotoUrl: string;
  primaryPhotoIndex: number;
};

function trim(u: unknown): string {
  return String(u ?? "").trim();
}

export function isBrChildMediaIdbRef(url: string): boolean {
  return trim(url).startsWith(BR_AGENTE_IDB_PREFIX);
}

export function isBrChildMediaDisplayableUrl(url: string): boolean {
  const u = trim(url);
  return Boolean(u && (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("data:image/")));
}

function isAcceptableMediaSlot(url: string): boolean {
  const u = trim(url);
  if (!u || u.startsWith("blob:")) return false;
  return isBrChildMediaDisplayableUrl(u) || isBrChildMediaIdbRef(u);
}

function durableRefFromRaw(url: string): string {
  const u = trim(url);
  if (!u || u.startsWith("data:") || u.startsWith("blob:")) return "";
  if (isBrChildMediaIdbRef(u) || u.startsWith("http://") || u.startsWith("https://")) return u;
  return "";
}

function markPrimary(images: BrChildMediaImage[], preferredId: string | null): BrChildMediaImage[] {
  if (!images.length) return [];
  const hit = preferredId && images.some((i) => i.id === preferredId) ? preferredId : images[0]!.id;
  return images.map((row, index) => ({
    ...row,
    sortOrder: index,
    isPrimary: row.id === hit,
  }));
}

/**
 * Alias expansion (Autos `expandAutosVehicleMediaSourceFields` parity):
 * prefer form `fotosDataUrls`; else flat `photoUrls`; else `mainPhotoUrl`.
 */
export function expandBrChildMediaSourceFields(input: BrChildMediaAliasInput | null | undefined): {
  urls: string[];
  primaryIndex: number;
  childId: string;
} {
  const childId = trim(input?.childId) || "child";
  const form = (Array.isArray(input?.fotosDataUrls) ? input!.fotosDataUrls! : [])
    .map(trim)
    .filter(isAcceptableMediaSlot);
  const flat = (Array.isArray(input?.photoUrls) ? input!.photoUrls! : [])
    .map(trim)
    .filter(isAcceptableMediaSlot);
  const main = trim(input?.mainPhotoUrl);
  const urls = form.length
    ? form
    : flat.length
      ? flat
      : main && isAcceptableMediaSlot(main)
        ? [main]
        : [];

  const rawPrimary =
    form.length > 0 ? Number(input?.fotoPortadaIndex) || 0 : Number(input?.primaryPhotoIndex) || 0;
  const primaryIndex = urls.length ? Math.min(Math.max(0, rawPrimary), urls.length - 1) : 0;
  return { urls, primaryIndex, childId };
}

/** Structural normalize — order + portada + stable ids. Unresolved IDB lives only in `durableRef`. */
export function normalizeBrChildMediaImages(input: BrChildMediaAliasInput | null | undefined): BrChildMediaImage[] {
  const { urls, primaryIndex, childId } = expandBrChildMediaSourceFields(input);
  const preferredId = urls.length ? `${childId}::media::${primaryIndex}` : null;
  const staged = urls.map((raw, index) => {
    const durableRef = durableRefFromRaw(raw) || (isBrChildMediaIdbRef(raw) ? raw : "");
    const url = isBrChildMediaDisplayableUrl(raw) ? raw : "";
    return {
      id: `${childId}::media::${index}`,
      url,
      durableRef,
      isPrimary: false,
      sortOrder: index,
    };
  });
  return markPrimary(staged, preferredId);
}

/**
 * Resolve IDB tokens into displayable `url` values.
 * A failed ref drops only that slot; valid siblings remain.
 */
export async function resolveBrChildMediaImagesForDisplay(
  images: BrChildMediaImage[],
): Promise<BrChildMediaImage[]> {
  const preferredId = images.find((i) => i.isPrimary)?.id ?? images[0]?.id ?? null;
  const out: BrChildMediaImage[] = [];
  for (const image of images) {
    if (isBrChildMediaDisplayableUrl(image.url)) {
      out.push({ ...image, url: trim(image.url) });
      continue;
    }
    const ref = trim(image.durableRef);
    if (isBrChildMediaIdbRef(ref)) {
      const resolved = await resolveBrAgenteIdbMediaRefToDataUrl(ref);
      if (resolved && isBrChildMediaDisplayableUrl(resolved)) {
        out.push({ ...image, url: resolved, durableRef: ref });
      }
      continue;
    }
    if (isBrChildMediaDisplayableUrl(ref)) {
      out.push({ ...image, url: ref, durableRef: durableRefFromRaw(ref) });
    }
  }
  return markPrimary(out, preferredId);
}

/** Normalize aliases then resolve for display (Autos hydrateChildInventoryEditorDraft parity). */
export async function hydrateBrChildMediaCanonical(
  input: BrChildMediaAliasInput | null | undefined,
): Promise<BrChildMediaImage[]> {
  return resolveBrChildMediaImagesForDisplay(normalizeBrChildMediaImages(input));
}

export function brChildMediaPrimaryDisplayUrl(images: BrChildMediaImage[]): string {
  const ordered = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const primary = ordered.find((i) => i.isPrimary) ?? ordered[0];
  const u = trim(primary?.url);
  return isBrChildMediaDisplayableUrl(u) ? u : "";
}

export function brChildMediaGalleryDisplayUrls(images: BrChildMediaImage[], slotCount = 6): string[] {
  const ordered = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const primary = ordered.find((i) => i.isPrimary) ?? ordered[0];
  const rest = ordered.filter((i) => i.id !== primary?.id);
  const slots: string[] = [];
  for (let i = 0; i < slotCount; i++) {
    const u = trim(rest[i]?.url);
    slots.push(isBrChildMediaDisplayableUrl(u) ? u : "");
  }
  return slots;
}

/**
 * Project canonical media onto Bienes legacy fields.
 * - display: displayable urls only
 * - persist: durableRef first (IDB/http); else live data: for in-memory offload handoff
 */
export function projectBrChildMediaToBienesFields(
  images: BrChildMediaImage[],
  mode: "display" | "persist",
): BrChildMediaProjectedFields {
  const ordered = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const preferredId = ordered.find((i) => i.isPrimary)?.id ?? ordered[0]?.id ?? null;
  const urls: string[] = [];
  let coverIdx = 0;
  ordered.forEach((img, index) => {
    let next = "";
    if (mode === "display") {
      next = isBrChildMediaDisplayableUrl(img.url) ? img.url : "";
    } else {
      const durable = trim(img.durableRef);
      next = durable || (isBrChildMediaDisplayableUrl(img.url) ? img.url : "");
    }
    if (!next) return;
    if (img.id === preferredId) coverIdx = urls.length;
    urls.push(next);
    void index;
  });
  const primaryPhotoIndex = urls.length ? Math.min(coverIdx, urls.length - 1) : 0;
  const cover = urls[primaryPhotoIndex] ?? urls[0] ?? "";
  return {
    fotosDataUrls: urls,
    fotoPortadaIndex: primaryPhotoIndex,
    photoUrls: urls,
    mainPhotoUrl: cover,
    primaryPhotoIndex,
  };
}

export function applyBrChildMediaDisplayFieldsToSlice<T extends { fotosDataUrls?: string[]; fotoPortadaIndex?: number }>(
  slice: T,
  images: BrChildMediaImage[],
): T {
  const fields = projectBrChildMediaToBienesFields(images, "display");
  return {
    ...slice,
    fotosDataUrls: fields.fotosDataUrls,
    fotoPortadaIndex: fields.fotoPortadaIndex,
  };
}
