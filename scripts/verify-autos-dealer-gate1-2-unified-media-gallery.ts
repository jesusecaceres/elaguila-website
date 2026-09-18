/**
 * Autos Dealer — Final Full Lifecycle Round-Trip Closeout — Gates 1 & 2 (2026-09-18).
 *
 * Gate 1: AutosNegociosMediaManager.tsx used to split listing.mediaImages into `fileImages`
 * (rendered in the real sortable/reorder/cover AutosSortablePhotoGrid) and `urlImages` (rendered
 * in a separate flat, non-draggable list). AutosSortablePhotoGrid itself was always generic over
 * any MediaImageEntry[] and already renders a per-tile source label as pure metadata — the split
 * was purely an artifact of the wrapper component, and it interacted badly with Gate 2's early
 * durable-upload step (autosDraftPhotoPublishPrepare.ts), which flips a photo's sourceType to
 * "url" the moment it becomes a durable Blob HTTPS URL — silently demoting it out of the sortable
 * grid mid-session. This proves the editor now feeds the COMPLETE unified array into the one real
 * gallery, and that the durable-upload step still preserves id/order/cover (Gate 2 must not
 * regress just because Gate 1 stopped keying UI behavior off sourceType).
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-autos-dealer-gate1-2-unified-media-gallery.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const raw = (rel: string) =>
  stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n"));

const MANAGER = "app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx";
const GRID = "app/(site)/publicar/autos/shared/components/AutosSortablePhotoGrid.tsx";
const UPLOAD = "app/lib/clasificados/autos/autosDraftPhotoPublishPrepare.ts";

/* ── Gate 1: one unified gallery, no second-class URL-only path ── */
check("editor no longer splits mediaImages into fileImages/urlImages collections", () => {
  const src = raw(MANAGER);
  assert.ok(!/const fileImages\s*=/.test(src), "fileImages split must be gone");
  assert.ok(!/const urlImages\s*=/.test(src), "urlImages split must be gone");
  assert.ok(!/function isUrlSource/.test(src), "the source-type gate helper must be gone");
});

check("AutosSortablePhotoGrid receives the COMPLETE unified images array, not a filtered subset", () => {
  const src = raw(MANAGER);
  assert.match(src, /<AutosSortablePhotoGrid\s*\n\s*images=\{images\}/, "grid must render the full images array");
});

check("reorder commits the grid's full returned array directly (no re-append of a separate url-only tail)", () => {
  const src = raw(MANAGER);
  const idx = src.indexOf("onReorder={(next) => {");
  assert.ok(idx > 0, "onReorder handler present");
  const body = src.slice(idx, src.indexOf("}}", idx));
  assert.ok(!/urlOnly/.test(body), "no separate url-only array spliced back in during reorder");
  assert.ok(body.includes("next.map((img, i) => ({ ...img, sortOrder: i }))"), "reindexes the complete reordered set");
});

check("move-before/after (chevron controls) operates over the complete images array, not a file-only subset", () => {
  const src = raw(MANAGER);
  const fnStart = src.indexOf("const move = (id: string, dir: -1 | 1) => {");
  assert.ok(fnStart > 0);
  const fnEnd = src.indexOf("\n  };", fnStart);
  const body = src.slice(fnStart, fnEnd);
  // Either spelling is the complete unified array — sortByOrder(images) and
  // sortByOrder(listing.mediaImages ?? []) are equivalent (images IS sortByOrder(listing.mediaImages
  // ?? []), and sortByOrder/normalizeMediaImagesOrder is idempotent) — no fileImages-only subset.
  assert.ok(
    body.includes("sortByOrder(images)") || body.includes("sortByOrder(listing.mediaImages ?? [])"),
    "move must sort/search over the full unified array, not a fileImages-only subset",
  );
  assert.ok(!body.includes("sortByOrder(fileImages)"), "must never reintroduce the fileImages-only subset");
});

check("no duplicate flat list of URL-sourced images below the gallery (the explicit URL field is an INPUT method only)", () => {
  const src = raw(MANAGER);
  assert.ok(!/urlImages\.map/.test(src), "no second rendering path for URL images");
  assert.ok(src.includes("addSingleImageUrl"), "the owner-entered URL add mechanism itself is preserved");
});

check("empty-state and reorder-hint banner are driven by the single unified images collection", () => {
  const src = raw(MANAGER);
  assert.ok(src.includes("{images.length > 0 ? (") && src.includes("{images.length === 0 ? ("));
  assert.ok(!/fileImages\.length/.test(src), "no leftover fileImages-based conditional");
});

check("AutosSortablePhotoGrid itself is source-agnostic: renders drag/move/cover/remove for any MediaImageEntry, source shown only as a metadata label", () => {
  const src = raw(GRID);
  assert.ok(src.includes("images: MediaImageEntry[];"), "generic over the full entry type, no file-only narrowing");
  assert.ok(
    /img\.sourceType === "file" \? copy\.sourceFile : copy\.sourceUrl/.test(src),
    "source is rendered as a plain text label, never gates which controls/behaviors are available",
  );
  assert.ok(src.includes("onSetPrimary") && src.includes("onMove") && src.includes("onRemove"), "cover/move/remove wired for every tile regardless of source");
});

/* ── Gate 2: early durable upload must still preserve identity/order/cover, and must stay idempotent ── */
check("durable upload preserves id/isPrimary/sortOrder — only url and sourceType change on the same entry", () => {
  const src = raw(UPLOAD);
  const idx = src.indexOf('return { ...m, url: publicUrl, sourceType: "url" as const };');
  assert.ok(idx > 0, "upload result must spread the original entry, not rebuild a new object");
});

check("already-durable HTTPS media is never re-uploaded (idempotent skip)", () => {
  const src = raw(UPLOAD);
  assert.ok(src.includes("if (!autosDraftImageRequiresUpload(url)) {"), "requires-upload gate present before any network call");
});

check("upload pool preserves array order after concurrent resolution (index-stable mapWithConcurrency)", () => {
  const src = raw(UPLOAD);
  assert.ok(src.includes("results[i] = await fn(items[i]!, i);"), "results written back by original index, not push order");
});

check("heroImages is re-derived from the same normalized mediaImages after upload (no divergence between the two)", () => {
  const src = raw(UPLOAD);
  assert.ok(src.includes("heroImages: deriveHeroImageUrls({ ...listing, mediaImages }),"));
});

if (failures.length) {
  console.error(`\nverify-autos-dealer-gate1-2-unified-media-gallery: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-autos-dealer-gate1-2-unified-media-gallery: PASS");
