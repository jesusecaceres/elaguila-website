/** Main gallery strip: indices into `galleryImages` plus optional video slot. */
export type RestauranteGallerySeqEntry = number | "v";

type SeqSource = {
  galleryImages?: string[] | undefined;
  galleryMediaSequence?: unknown;
  galleryOrder?: string[] | undefined;
  videoFile?: string | undefined;
  videoUrl?: string | undefined;
};

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

function draftHasVideo(d: SeqSource): boolean {
  return nonEmpty(d.videoFile) || nonEmpty(d.videoUrl);
}

function coerceSeqEntry(x: unknown): RestauranteGallerySeqEntry | null {
  if (x === "v" || x === "video") return "v";
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string" && x === "v") return "v";
  if (typeof x === "string") {
    const num = Number(x);
    if (Number.isFinite(num)) return num;
  }
  return null;
}

/**
 * Resolve gallery+video sequence: preserves user order (including video between images),
 * drops invalid indices, inserts missing image indices before the first `v` when present.
 */
export function resolveRestauranteGallerySequence(d: SeqSource): RestauranteGallerySeqEntry[] {
  const imgs = d.galleryImages ?? [];
  const n = imgs.length;
  const hasVideo = draftHasVideo(d);

  let raw: RestauranteGallerySeqEntry[] = [];

  if (Array.isArray(d.galleryMediaSequence) && d.galleryMediaSequence.length > 0) {
    for (const x of d.galleryMediaSequence) {
      const c = coerceSeqEntry(x);
      if (c !== null) raw.push(c);
    }
  } else {
    const orderIdx = (d.galleryOrder ?? [])
      .map((s) => Number(String(s)))
      .filter((i) => Number.isFinite(i) && i >= 0 && i < n);
    if (orderIdx.length === n && n > 0) {
      raw = orderIdx as RestauranteGallerySeqEntry[];
    } else {
      raw = imgs.map((_, i) => i);
    }
    if (hasVideo) raw.push("v");
  }

  const out: RestauranteGallerySeqEntry[] = [];
  const used = new Set<number>();
  let vUsed = false;

  for (const e of raw) {
    if (e === "v") {
      if (hasVideo && !vUsed) {
        out.push("v");
        vUsed = true;
      }
      continue;
    }
    if (typeof e === "number" && Number.isFinite(e) && e >= 0 && e < n && !used.has(e)) {
      used.add(e);
      out.push(e);
    }
  }

  const missing: number[] = [];
  for (let i = 0; i < n; i++) {
    if (!used.has(i)) missing.push(i);
  }

  if (missing.length) {
    const vIdx = out.indexOf("v");
    if (vIdx >= 0) {
      out.splice(vIdx, 0, ...missing);
    } else {
      out.push(...missing);
    }
  }

  if (hasVideo && !out.includes("v")) {
    out.push("v");
  }

  if (!hasVideo) {
    return out.filter((x) => x !== "v");
  }

  return out;
}

/**
 * Sequence for the publish UI: guarantees a tile per non-empty gallery URL and a video slot when video exists.
 * If stored `galleryMediaSequence` is missing, corrupt, or out of sync with `galleryImages`, falls back to index order.
 */
export function computePublishGallerySequence(d: SeqSource): RestauranteGallerySeqEntry[] {
  const imgs = d.galleryImages ?? [];
  const validIdx = imgs
    .map((u, i) => (typeof u === "string" && u.trim().length > 0 ? i : null))
    .filter((i): i is number => i !== null);
  const hasVideo = draftHasVideo(d);
  if (validIdx.length === 0 && !hasVideo) return [];

  const resolved = resolveRestauranteGallerySequence(d);
  const resolvedNums = resolved.filter((x): x is number => typeof x === "number");
  const vInResolved = resolved.includes("v");
  const ok =
    resolvedNums.length === validIdx.length &&
    validIdx.every((i) => resolvedNums.includes(i)) &&
    resolvedNums.every((i) => validIdx.includes(i)) &&
    hasVideo === vInResolved;

  if (ok) return resolved;

  const out: RestauranteGallerySeqEntry[] = [...validIdx];
  if (hasVideo) out.push("v");
  return out;
}

/** After removing gallery image at `removedIndex`, remap sequence indices. */
export function remapSequenceAfterImageRemove(
  seq: RestauranteGallerySeqEntry[],
  removedIndex: number
): RestauranteGallerySeqEntry[] {
  return seq
    .map((e) => {
      if (e === "v") return "v" as const;
      if (typeof e !== "number" || !Number.isFinite(e)) return null;
      if (e === removedIndex) return null;
      if (e > removedIndex) return e - 1;
      return e;
    })
    .filter((x): x is RestauranteGallerySeqEntry => x !== null);
}
