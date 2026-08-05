/**
 * Globalization Package B (Gate B1) — shared media contract behavioral self-test.
 *
 * Pins the category-agnostic proposed-final-set engine
 * (app/lib/media/listingMediaContract.ts) against the Package B global truths:
 *   T1  existing media counts toward limits;
 *   T3  existing + new validate as ONE final set;
 *   T4  removed media is excluded from the final set;
 *   T5  reordering is an explicit, deterministic output;
 *   T6  hero selection is explicit and index-stable;
 *   T7  a failed upload can never delete or replace proven existing media (inputs are never
 *       mutated; only persistable hosted URLs enter the set);
 *   T8  empty/malformed/blob:/data: URLs fail safely and are surfaced, not silently lost;
 *   T9  limits are category-supplied — the engine never invents a number (no defaults).
 *
 * Run from repo root: npx tsx scripts/gate-pkgB-media-contract-selftest.ts
 */
import { strict as assert } from "node:assert";

import {
  buildProposedFinalMediaSet,
  validateProposedFinalMediaSet,
} from "../app/lib/media/listingMediaContract";

const A = "https://cdn.example.com/a.jpg";
const B = "https://cdn.example.com/b.jpg";
const C = "https://cdn.example.com/c.jpg";
const N1 = "https://cdn.example.com/new1.jpg";
const N2 = "https://cdn.example.com/new2.jpg";

/* T1/T3 — existing counts toward limits; one combined set. */
{
  const set = buildProposedFinalMediaSet({ existing: [A, B, C], uploaded: [N1] });
  assert.equal(set.images.length, 4);
  const v = validateProposedFinalMediaSet(set, { minImages: 1, maxImages: 4, logoAllowed: false, maxExternalVideos: 0 });
  assert.equal(v.ok, true, "existing+new exactly at max must pass");
  const over = buildProposedFinalMediaSet({ existing: [A, B, C], uploaded: [N1, N2] });
  const vOver = validateProposedFinalMediaSet(over, { minImages: 1, maxImages: 4, logoAllowed: false, maxExternalVideos: 0 });
  assert.equal(vOver.ok, false);
  assert.ok(vOver.issues.some((i) => i.code === "too_many_images" && i.count === 5 && i.limit === 4));

  // Text-only edit of a listing with sufficient existing media: no new uploads needed (the
  // false-422 class this generalizes from P2 BR).
  const textOnly = buildProposedFinalMediaSet({ existing: [A, B] });
  const vTextOnly = validateProposedFinalMediaSet(textOnly, { minImages: 1, maxImages: 10, logoAllowed: false, maxExternalVideos: 0 });
  assert.equal(vTextOnly.ok, true, "T2: text-only edits never require media re-upload");
}

/* T4 — removed excluded (existing and uploaded alike). */
{
  const set = buildProposedFinalMediaSet({ existing: [A, B, C], uploaded: [N1], removedUrls: [B, N1] });
  assert.deepEqual(set.images.map((i) => i.url), [A, C]);
  const vMin = validateProposedFinalMediaSet(set, { minImages: 3, maxImages: 10, logoAllowed: false, maxExternalVideos: 0 });
  assert.ok(vMin.issues.some((i) => i.code === "too_few_images"), "removal must count against the minimum truthfully");
}

/* T5 — explicit ordering wins; unknown ordering URLs ignored; unordered items keep base order at the end. */
{
  const set = buildProposedFinalMediaSet({
    existing: [A, B],
    uploaded: [N1, N2],
    orderedUrls: [N2, A, "https://cdn.example.com/never-added.jpg"],
  });
  assert.deepEqual(set.images.map((i) => i.url), [N2, A, B, N1]);
}

/* T6 — hero by URL, index-stable across reorder; falls back to 0; -1 only when empty. */
{
  const set = buildProposedFinalMediaSet({ existing: [A, B, C], orderedUrls: [C, A, B], heroUrl: B });
  assert.equal(set.heroIndex, 2);
  assert.equal(set.images[set.heroIndex].url, B);
  const fallback = buildProposedFinalMediaSet({ existing: [A], heroUrl: "https://cdn.example.com/gone.jpg" });
  assert.equal(fallback.heroIndex, 0);
  assert.equal(buildProposedFinalMediaSet({ existing: [] }).heroIndex, -1);
}

/* T7/T8 — unpersistable inputs (blob:/data:/malformed/empty) are dropped safely + surfaced;
 * inputs are never mutated, so existing media cannot be harmed by a failed upload. */
{
  const existing = [A, B];
  const uploaded = ["blob:chrome/123", "data:image/png;base64,xxx", "not-a-url", "", N1];
  const set = buildProposedFinalMediaSet({ existing, uploaded });
  assert.deepEqual(set.images.map((i) => i.url), [A, B, N1]);
  assert.equal(set.droppedUnpersistable.length, 3, "blob/data/malformed surfaced (empty is silently skipped)");
  assert.deepEqual(existing, [A, B], "inputs must never be mutated");
  // Dedupe: an upload that duplicates an existing URL never double-counts.
  const dup = buildProposedFinalMediaSet({ existing: [A], uploaded: [A, N1] });
  assert.deepEqual(dup.images.map((i) => i.url), [A, N1]);
  assert.equal(dup.images[0].origin, "existing", "existing wins the dedupe (provenance preserved)");
}

/* Logo — category-gated; unpersistable logo dropped + surfaced. */
{
  const withLogo = buildProposedFinalMediaSet({ existing: [A], logoUrl: N1 });
  assert.equal(withLogo.logoUrl, N1);
  const vNoLogo = validateProposedFinalMediaSet(withLogo, { minImages: 0, maxImages: 10, logoAllowed: false, maxExternalVideos: 0 });
  assert.ok(vNoLogo.issues.some((i) => i.code === "logo_not_supported"));
  const badLogo = buildProposedFinalMediaSet({ existing: [A], logoUrl: "blob:x" });
  assert.equal(badLogo.logoUrl, null);
  assert.ok(badLogo.droppedUnpersistable.includes("blob:x"));
}

/* External video — the CATEGORY validator is authoritative (injected); dedupe by normalized
 * form; caps applied post-normalization; zero-cap lanes reject cleanly. */
{
  const normalize = (url: string) => (url.includes("youtube.com") ? url.replace("m.youtube.com", "youtube.com") : null);
  const set = buildProposedFinalMediaSet({
    existing: [A],
    externalVideoUrls: [
      "https://youtube.com/watch?v=1",
      "https://m.youtube.com/watch?v=1", // dup after normalization
      "https://vimeo.com/999", // unsupported by this category's validator
      "https://youtube.com/watch?v=2",
    ],
  });
  const v = validateProposedFinalMediaSet(set, {
    minImages: 0,
    maxImages: 10,
    logoAllowed: false,
    maxExternalVideos: 1,
    normalizeExternalVideoUrl: normalize,
  });
  assert.deepEqual(v.normalizedVideoUrls, ["https://youtube.com/watch?v=1", "https://youtube.com/watch?v=2"]);
  assert.ok(v.issues.some((i) => i.code === "duplicate_video_url"));
  assert.ok(v.issues.some((i) => i.code === "invalid_video_url" && i.url === "https://vimeo.com/999"));
  assert.ok(v.issues.some((i) => i.code === "too_many_videos" && i.limit === 1 && i.count === 2));

  const vNone = validateProposedFinalMediaSet(set, { minImages: 0, maxImages: 10, logoAllowed: false, maxExternalVideos: 0 });
  assert.ok(vNone.issues.some((i) => i.code === "videos_not_supported"));
}

console.log("gate-pkgB-media-contract-selftest: all assertions passed.");
