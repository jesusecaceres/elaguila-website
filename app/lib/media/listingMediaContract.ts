/**
 * Gate I.11A — Shared listing-media contract.
 *
 * Additive foundation only: these types/predicates are not wired into any existing category's
 * publish/draft pipeline. Each category keeps its own bespoke media shape (Autos `MediaImageEntry`,
 * Bienes Raíces `BrChildMediaImage`, Servicios `GalleryItem`/`VideoItem`, plain `string[]` for
 * En Venta/Bienes Raíces main listing, etc.) — this module does not migrate or replace any of
 * them. It exists so new code (and, incrementally, future work packages) has one place to express
 * "what kind of media state is this" and "is this URL safe to persist" without re-deriving the
 * blob/data-URL rejection logic that already exists ad hoc in a few places (e.g. Bienes Raíces'
 * `sourceToUpload` throwing on a `blob:` prefix).
 */

/** A local file the user picked but that has not been uploaded anywhere yet. */
export type LocalUnsavedMedia = {
  kind: "local";
  /** `blob:` or `data:` preview URL — never persistable as-is. */
  previewUrl: string;
  file?: File;
};

/** Media that was just uploaded this session and now has a real hosted URL. */
export type UploadedHostedMedia = {
  kind: "uploaded";
  url: string;
};

/** Media that already existed on the listing before this edit session began. */
export type ExistingDbMedia = {
  kind: "existing";
  url: string;
};

/** A reference the user explicitly removed — distinct from an item simply never having existed. */
export type RemovedMediaRef = {
  kind: "removed";
  url: string;
};

/** An existing hosted item being swapped for a new upload; the old url is kept until the new one succeeds. */
export type ReplacementMedia = {
  kind: "replacement";
  previousUrl: string;
  url: string;
};

/** A normalized external video URL (YouTube/Vimeo/etc.) — never an uploaded video file. */
export type ExternalVideoUrl = {
  kind: "video";
  url: string;
};

export type ListingMediaState =
  | LocalUnsavedMedia
  | UploadedHostedMedia
  | ExistingDbMedia
  | RemovedMediaRef
  | ReplacementMedia;

export function isBlobOrObjectUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.trim().toLowerCase().startsWith("blob:");
}

export function isDataUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.trim().toLowerCase().startsWith("data:");
}

/**
 * True only for a real, persistable hosted URL — never a local preview. Mirrors (does not
 * replace) the independent `blob:`-rejection guard already proven in the Bienes Raíces publish
 * core; used here to certify that guard's rule against a single shared definition.
 */
export function isPersistableMediaUrl(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  const v = value.trim();
  if (!v) return false;
  if (isBlobOrObjectUrl(v) || isDataUrl(v)) return false;
  return /^https?:\/\//i.test(v);
}

/** Re-derives sortOrder from array position — matches the Autos/Bienes Raíces `sortOrder` convention. */
export function withNormalizedMediaOrder<T extends { sortOrder?: number }>(items: readonly T[]): T[] {
  return items.map((item, index) => ({ ...item, sortOrder: index }));
}
