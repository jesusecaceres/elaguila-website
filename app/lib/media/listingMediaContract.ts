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

/* ==============================================================================================
 * Globalization Package B (Gate B1) — proposed-final-set model + validation engine.
 *
 * SHARED MEDIA CONTRACT + CATEGORY MEDIA CONFIG + SMALL CATEGORY ADAPTER.
 *
 * This engine is deliberately category-agnostic: it never invents a limit, a provider list, or
 * a role vocabulary. Each category supplies its OWN real limits/validators (its existing
 * constants) through `ProposedMediaLimits`; the engine only guarantees the global truths that
 * were previously re-derived (or missed) per category:
 *
 *   T1  Existing media counts toward limits.
 *   T3  Existing and new media validate as ONE proposed final set.
 *   T4  Removed media is excluded from the final set.
 *   T5/T6 Ordering and hero selection are explicit outputs, not incidental array state.
 *   T7  A failed upload contributes nothing — only persistable hosted URLs enter the set, and
 *       building the set never mutates its inputs, so proven existing media cannot be lost by
 *       a failed new upload.
 *   T8  Empty/malformed/blob:/data: URLs are dropped safely (never persisted, never crash).
 *
 * The P2 Bienes Raíces false-422 repair is the reference behavior this generalizes: the save
 * validator was never the bug — the state handed to it had silently lost existing media. This
 * engine makes "the state handed to the validator" a single, testable construction.
 * ============================================================================================ */

export type ProposedMediaOrigin = "existing" | "uploaded";

export type ProposedMediaItem = {
  /** Persistable hosted URL — guaranteed by construction (isPersistableMediaUrl). */
  url: string;
  origin: ProposedMediaOrigin;
};

export type ProposedFinalMediaSet = {
  /** Final ordered gallery: existing + newly uploaded, minus removed, deduped. */
  images: readonly ProposedMediaItem[];
  /** Index into `images` of the hero/primary image (0 when unset/unresolvable; -1 only when
   * `images` is empty). */
  heroIndex: number;
  /** Category-supported logo, or null. Never counted in `images`. */
  logoUrl: string | null;
  /** Normalized external video URLs (validation is the category validator's job). */
  externalVideoUrls: readonly string[];
  /** URLs that were provided but dropped as unpersistable (blob:/data:/malformed) — surfaced
   * so callers can warn instead of silently losing intent. */
  droppedUnpersistable: readonly string[];
};

export function buildProposedFinalMediaSet(input: {
  /** Hosted URLs that existed on the listing before this edit session, in persisted order. */
  existing: readonly string[];
  /** Hosted URLs uploaded this session, in selection order. */
  uploaded?: readonly string[];
  /** URLs the user explicitly removed this session (existing OR uploaded). */
  removedUrls?: readonly string[];
  /** Explicit final ordering from the UI (reorder). URLs not present fall to the end in
   * existing-then-uploaded order; unknown URLs in the ordering are ignored. */
  orderedUrls?: readonly string[] | null;
  /** Hero selection by URL; falls back to the first image. */
  heroUrl?: string | null;
  logoUrl?: string | null;
  externalVideoUrls?: readonly string[];
}): ProposedFinalMediaSet {
  const removed = new Set((input.removedUrls ?? []).map((u) => u.trim()).filter(Boolean));
  const dropped: string[] = [];

  const collect = (urls: readonly string[], origin: ProposedMediaOrigin): ProposedMediaItem[] => {
    const out: ProposedMediaItem[] = [];
    for (const raw of urls) {
      const url = (raw ?? "").trim();
      if (!url) continue;
      if (!isPersistableMediaUrl(url)) {
        dropped.push(url);
        continue;
      }
      if (removed.has(url)) continue;
      out.push({ url, origin });
    }
    return out;
  };

  const base = [...collect(input.existing, "existing"), ...collect(input.uploaded ?? [], "uploaded")];
  // Dedupe by URL, first occurrence wins (existing before uploaded by construction).
  const byUrl = new Map<string, ProposedMediaItem>();
  for (const item of base) if (!byUrl.has(item.url)) byUrl.set(item.url, item);

  let images: ProposedMediaItem[];
  const ordering = (input.orderedUrls ?? []).map((u) => (u ?? "").trim()).filter(Boolean);
  if (ordering.length > 0) {
    const orderedItems: ProposedMediaItem[] = [];
    const seen = new Set<string>();
    for (const url of ordering) {
      const item = byUrl.get(url);
      if (item && !seen.has(url)) {
        orderedItems.push(item);
        seen.add(url);
      }
    }
    for (const item of byUrl.values()) if (!seen.has(item.url)) orderedItems.push(item);
    images = orderedItems;
  } else {
    images = [...byUrl.values()];
  }

  const heroUrl = (input.heroUrl ?? "").trim();
  const heroIndex = images.length === 0 ? -1 : Math.max(0, images.findIndex((i) => i.url === heroUrl));

  const logoRaw = (input.logoUrl ?? "").trim();
  const logoUrl = logoRaw && isPersistableMediaUrl(logoRaw) && !removed.has(logoRaw) ? logoRaw : null;
  if (logoRaw && !logoUrl && !removed.has(logoRaw)) dropped.push(logoRaw);

  const externalVideoUrls = (input.externalVideoUrls ?? [])
    .map((u) => (u ?? "").trim())
    .filter(Boolean);

  return { images, heroIndex, logoUrl, externalVideoUrls, droppedUnpersistable: dropped };
}

export type ProposedMediaIssueCode =
  | "too_few_images"
  | "too_many_images"
  | "logo_not_supported"
  | "videos_not_supported"
  | "too_many_videos"
  | "invalid_video_url"
  | "duplicate_video_url";

export type ProposedMediaIssue = {
  code: ProposedMediaIssueCode;
  /** The offending URL for per-URL issues. */
  url?: string;
  /** The category limit involved, for message formatting by the category's own copy. */
  limit?: number;
  count?: number;
};

/**
 * Category-supplied limits — always the category's OWN existing constants, cited at the
 * adapter that builds this object. This engine never defaults a numeric limit.
 */
export type ProposedMediaLimits = {
  minImages: number;
  maxImages: number;
  logoAllowed: boolean;
  /** 0 = videos not supported for this lane. */
  maxExternalVideos: number;
  /** The category's OWN validator/normalizer: returns the normalized URL or null when
   * invalid/unsupported provider. Required whenever maxExternalVideos > 0. */
  normalizeExternalVideoUrl?: (url: string) => string | null;
};

export type ProposedMediaValidation = {
  ok: boolean;
  issues: readonly ProposedMediaIssue[];
  /** Videos after per-category normalization + dedupe (what the caller should persist). */
  normalizedVideoUrls: readonly string[];
};

/** Validates the FINAL proposed set (T1/T3/T4): existing + new − removed, as one whole. */
export function validateProposedFinalMediaSet(
  set: ProposedFinalMediaSet,
  limits: ProposedMediaLimits,
): ProposedMediaValidation {
  const issues: ProposedMediaIssue[] = [];
  const count = set.images.length;
  if (count < limits.minImages) issues.push({ code: "too_few_images", limit: limits.minImages, count });
  if (count > limits.maxImages) issues.push({ code: "too_many_images", limit: limits.maxImages, count });
  if (set.logoUrl && !limits.logoAllowed) issues.push({ code: "logo_not_supported", url: set.logoUrl });

  const normalizedVideoUrls: string[] = [];
  if (set.externalVideoUrls.length > 0 && limits.maxExternalVideos === 0) {
    issues.push({ code: "videos_not_supported", count: set.externalVideoUrls.length });
  } else if (set.externalVideoUrls.length > 0) {
    const seen = new Set<string>();
    for (const raw of set.externalVideoUrls) {
      const normalized = limits.normalizeExternalVideoUrl ? limits.normalizeExternalVideoUrl(raw) : null;
      if (!normalized) {
        issues.push({ code: "invalid_video_url", url: raw });
        continue;
      }
      if (seen.has(normalized)) {
        issues.push({ code: "duplicate_video_url", url: raw });
        continue;
      }
      seen.add(normalized);
      normalizedVideoUrls.push(normalized);
    }
    if (normalizedVideoUrls.length > limits.maxExternalVideos) {
      issues.push({ code: "too_many_videos", limit: limits.maxExternalVideos, count: normalizedVideoUrls.length });
    }
  }

  return { ok: issues.length === 0, issues, normalizedVideoUrls };
}
