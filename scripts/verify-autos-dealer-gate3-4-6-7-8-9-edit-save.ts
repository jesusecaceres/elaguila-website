/**
 * Autos Dealer — Final Full Lifecycle Round-Trip Closeout — Gates 3, 4, 6, 7, 8, 9 (2026-09-18).
 *
 * Gate 3/6/12/13 (cover parity): the public card/browse cover used to be "whichever image sorts
 * first" (deriveHeroImageUrls(...)[0]), ignoring the owner's chosen isPrimary cover — diverging
 * from Preview/full-gallery rendering, which always honors isPrimary. Proves the new
 * derivePrimaryImageUrl helper is the one used for the public single-image surface.
 *
 * Gate 4/11 (child fallback round-trip): resolvePreviewStateForRoute used to hardcode
 * `additionalInventoryVehicles: []` for EVERY canonical (dashboard-edit) fetch, even though the
 * GET route returns the full listing_payload including the real embedded bundle — meaning a save
 * from that screen would silently wipe pre-fulfillment child data. Proves it's now hydrated from
 * the real payload via the existing normalizeAdditionalInventoryVehicles safe-parser.
 *
 * Gate 6/7/8/9 (route intent controls edit UX, not lifecycle status): proves a canonical
 * (listingId-bound) Preview session now shows "Guardar cambios" instead of the $399 checkout
 * checkpoint, in BOTH the canonical-active branch (Gate 8: active parent, Gate 9: canonical
 * child — both land here) and the non-active canonical branch (Gate 7: pending_payment/
 * payment_failed parent) — while a truly brand-new draft (no canonicalListingId) still shows
 * checkout (Case D). Also proves the existing gate-p3-preview-mode-contract-selftest's pinned
 * status-based mode-assignment line is untouched (that invariant belongs to a different, already-
 * shipped gate and must not regress), and that the Save action reuses the same PATCH-by-id path
 * checkout already uses (ensurePendingDealerListing), never creating a new row or a new charge.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-autos-dealer-gate3-4-6-7-8-9-edit-save.ts
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

const PREVIEW = "app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx";
const HERO = "app/(site)/clasificados/autos/negocios/lib/autoDealerHeroImages.ts";
const PUBLIC_MAP = "app/lib/clasificados/autos/mapAutosClassifiedsToPublic.ts";
const SAVE_BAR = "app/(site)/clasificados/autos/negocios/components/AutosNegociosSaveChangesBar.tsx";
const CONTRACT_SELFTEST = "scripts/gate-p3-preview-mode-contract-selftest.ts";

/* ── Gate 3/6/12/13: cover parity ── */
check("autoDealerHeroImages exports a deterministic isPrimary-based cover resolver", () => {
  const src = raw(HERO);
  assert.match(src, /export function derivePrimaryImageUrl\(listing: AutoDealerListing\): string \{/);
  assert.ok(/normalized\.find\(\(x\) => x\.isPrimary\)/.test(src), "must pick the owner's chosen cover, not index 0");
  assert.ok(src.includes("return listing.heroImages?.[0] ?? \"\";"), "legacy heroImages-only rows still get a safe fallback");
});

check("deriveHeroImageUrls (full gallery order) is untouched — only the single-cover resolver is new", () => {
  const src = raw(HERO);
  assert.ok(src.includes("export function deriveHeroImageUrls(listing: AutoDealerListing): string[] {"));
  const rawUnstripped = readFileSync(new URL(`../${HERO}`, import.meta.url), "utf8");
  assert.ok(rawUnstripped.includes("cover flag does not reshuffle gallery order"), "gallery order doc-comment/contract preserved");
});

check("the public card/browse mapper's single-image field now resolves through derivePrimaryImageUrl, not deriveHeroImageUrls(...)[0]", () => {
  const src = raw(PUBLIC_MAP);
  assert.ok(src.includes('import { derivePrimaryImageUrl } from "@/app/clasificados/autos/negocios/lib/autoDealerHeroImages";'));
  assert.ok(!/deriveHeroImageUrls/.test(src), "no leftover import/usage of the gallery-order-only helper for a single-image field");
  const fnStart = src.indexOf("function firstImageUrl(listing: AutoDealerListing): string {");
  assert.ok(fnStart > 0);
  const body = src.slice(fnStart, src.indexOf("\n}\n", fnStart));
  assert.ok(body.includes("return derivePrimaryImageUrl(normalizeLoadedListing(listing));"));
});

/* ── Gate 4/11: child fallback bundle must be hydrated, never hardcoded away ── */
check("fetchCanonicalDealerPreview extracts the real embedded additionalInventoryVehicles bundle", () => {
  const src = raw(PREVIEW);
  assert.ok(src.includes("import {\n  countApplicationInventoryVehicles,\n  normalizeAdditionalInventoryVehicles,\n}"));
  assert.ok(
    src.includes("const additionalInventoryVehicles = normalizeAdditionalInventoryVehicles(") &&
      src.includes("(json.listing as { additionalInventoryVehicles?: unknown })?.additionalInventoryVehicles,"),
    "must read the sibling field off the raw listing_payload, safely parsed",
  );
});

check("resolvePreviewStateForRoute's successful canonical branch uses the hydrated bundle, not a hardcoded []", () => {
  const src = raw(PREVIEW);
  const idx = src.indexOf('mode: fetched.status === "active" ? "canonical-active" : "draft",');
  assert.ok(idx > 0, "the pinned status-based mode line itself must still exist verbatim");
  const block = src.slice(idx, idx + 400);
  assert.ok(
    block.includes("additionalInventoryVehicles: fetched.additionalInventoryVehicles,"),
    "the success branch must round-trip the real bundle from the fetch, never []",
  );
});

/* ── Regression guard: the pre-existing, deliberately-pinned status-based mode contract must survive untouched ── */
check("REGRESSION GUARD: gate-p3-preview-mode-contract-selftest's pinned invariant line is still present verbatim", () => {
  const selftest = raw(CONTRACT_SELFTEST);
  assert.ok(
    selftest.includes('mode: fetched.status === "active" ? "canonical-active" : "draft"'),
    "this gate must not alter the older, deliberately-pinned status-based mode assignment",
  );
  const preview = raw(PREVIEW);
  assert.ok(
    preview.includes('mode: fetched.status === "active" ? "canonical-active" : "draft",'),
    "the actual source line the selftest pins must remain byte-for-byte in the Preview client",
  );
});

/* ── Gate 6/7: route intent (existing canonicalListingId) picks Save over checkout in the draft/edit shell ── */
check("the draft-capture shell shows Save (not checkout) whenever bound to an existing canonical listing", () => {
  const src = raw(PREVIEW);
  // Reconciled with a concurrent same-day fix (commit cbd30d73) that independently solved this
  // exact gate with a more precise discriminator (canonicalListingId AND ?edit=1&source=dashboard,
  // not canonicalListingId alone) — deferred to on merge; this check now pins THAT contract.
  assert.ok(
    src.includes(
      'const isDashboardListingEditPreview =\n    Boolean(canonicalListingId) && searchParams?.get("edit") === "1" && searchParams?.get("source") === "dashboard";',
    ),
    "route-intent discriminator must exist and require both canonicalListingId and the dashboard edit params",
  );
  const idx = src.indexOf("isDashboardListingEditPreview ? (");
  assert.ok(idx > 0, "conditional branch on isDashboardListingEditPreview must exist around the checkout/save area");
  const block = src.slice(idx, idx + 2600);
  assert.ok(block.includes("onSaveDealerChanges()"), "edit-intent branch calls the save handler");
  assert.ok(block.includes(") : (") && block.includes("<PublishCheckoutCheckpoint"), "non-edit-intent (brand new draft) branch still renders checkout");
});

check("Case D preserved: a brand-new draft (no canonicalListingId) still reaches the $399 checkout checkpoint", () => {
  const src = raw(PREVIEW);
  assert.ok(src.includes("onCheckout={(ctx) => void onStartDealerCheckout(ctx)}"), "checkout handler still wired for the non-edit-intent branch");
});

/* ── Gate 8/9: canonical-active branch (active parent OR canonical child) also gets a Save action ── */
check("canonical-active branch (active parent + canonical child edits both land here) renders the Save bar, never checkout", () => {
  const src = raw(PREVIEW);
  const modeIdx = src.indexOf('if (mode === "canonical-active") {');
  assert.ok(modeIdx > 0);
  const modeEnd = src.indexOf('if (mode === "empty") {', modeIdx);
  const block = src.slice(modeIdx, modeEnd);
  assert.ok(block.includes("<AutosNegociosSaveChangesBar"), "canonical-active branch must offer Save");
  assert.ok(!/PublishCheckoutCheckpoint/.test(block), "canonical-active branch must never render checkout");
});

/* ── Save reuses the existing safe PATCH-by-id path — never a new row, never a new charge ── */
check("onSaveDealerChanges reuses ensurePendingDealerListing (the same PATCH-by-id path checkout already uses) and never calls startRevenueCategoryCheckout", () => {
  const src = raw(PREVIEW);
  const fnStart = src.indexOf("const onSaveDealerChanges = useCallback(async () => {");
  assert.ok(fnStart > 0);
  const fnEnd = src.indexOf("}, [ensurePendingDealerListing]);", fnStart);
  assert.ok(fnEnd > fnStart);
  const body = src.slice(fnStart, fnEnd);
  assert.ok(body.includes("const result = await ensurePendingDealerListing();"));
  assert.ok(!/startRevenueCategoryCheckout|redirectToRevenueCategoryCheckout/.test(body), "save must never proceed to Stripe checkout");
});

check("ensurePendingDealerListing itself never falls back to POST when a canonicalListingId is present (no duplicate row risk from Save)", () => {
  const src = raw(PREVIEW);
  const fnStart = src.indexOf("const ensurePendingDealerListing = useCallback(async ()");
  const fnEnd = src.indexOf("}, [additionalInventoryVehicles, lang, listing, canonicalListingId]);", fnStart);
  const body = src.slice(fnStart, fnEnd);
  assert.ok(body.includes("if (canonicalListingId) {"), "canonical id short-circuits to PATCH-only");
  const canonicalBlockEnd = body.indexOf("const cached = readCachedDealerListingId();");
  const canonicalBlock = body.slice(0, canonicalBlockEnd);
  assert.ok(canonicalBlock.includes('method: "PATCH"'), "canonical path only ever PATCHes");
  assert.ok(!canonicalBlock.includes('method: "POST"'), "canonical path never POSTs (no duplicate-row path)");
});

check("Save bar component only ever offers Save — no checkout/promo/newsletter affordance leaks into edit mode", () => {
  const src = raw(SAVE_BAR);
  assert.ok(!/checkout|promo|newsletter|Continuar al pago/i.test(src), "save bar must stay a pure save action, nothing checkout-shaped");
});

if (failures.length) {
  console.error(`\nverify-autos-dealer-gate3-4-6-7-8-9-edit-save: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-autos-dealer-gate3-4-6-7-8-9-edit-save: PASS");
