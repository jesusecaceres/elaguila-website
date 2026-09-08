/**
 * Gate 2A — Clases QA foundation self-test.
 *
 * Pins the UX/data-contract/discovery/payment-method foundation work done in
 * Gate 2A for Clases (no Stripe/checkout wiring — that's Gate 2B):
 *   1. Multi-category data model: cap/dedupe/legacy-map, category mirrors categories[0]
 *   2. Legacy hydration: old listings without Leonix:classCategories fall back to [category]
 *   3. Persistence: Leonix:classCategories CSV only written when categories present
 *   4. Payment-methods catalog: whitelist/dedupe/cap, brand detection for "otro"
 *   5. Payment-methods persistence + hydration round trip
 *   6. Search blob indexes every selected class type, not just the primary one
 *   7. Discovery card type chip is capped ("+N más"), not raw chip soup
 *   8. shouldBlockClasesPaidPublish still blocks paid publish (unchanged)
 *   9. Taxonomy: Pilates + Adultos mayores present
 *   10. Contact canvas links carry groupLabel (Section Q grouping)
 *   11. Legacy detail adapter still builds with only the primary category present
 *   12. Website label no longer conflates "site" and "registration"
 *   13. Paid-class copy explicitly discloses $24.99/30 days (no vague "preparación" wording)
 *   14. Date-range fields persist and hydrate
 *   15. MAX_CLASES_CATEGORIES cap is 4
 *   16. Checkpoint card sells the full feature set (multi-type, payments, etc.)
 *
 * No network, no React, no Supabase. Run from repo root:
 *   npx tsx scripts/gate-2a-clases-qa-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  emptyClasesQuickDraft,
  normalizeClasesQuickDraft,
  MAX_CLASES_CATEGORIES,
  type ClasesQuickDraft,
} from "../app/(site)/publicar/community/shared/types/communityQuickDraft";
import {
  CLASES_CATEGORY_OPTIONS,
  COMMUNITY_AUDIENCE_OPTIONS,
} from "../app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import { shouldBlockClasesPaidPublish } from "../app/(site)/publicar/community/shared/required/communityRequiredForPreview";
import { buildClasesDetailPairs } from "../app/(site)/publicar/clases/lib/clasesPublishPayload";
import { clasesPublishedQuickToDraft, type ClasesPublishedListingLike } from "../app/(site)/publicar/clases/lib/clasesPublishedQuickToDraft";
import { buildClasesContactCanvasModel } from "../app/(site)/publicar/clases/lib/buildClasesContactCanvasModel";
import { buildClasesLegacyDetail } from "../app/(site)/clasificados/clases/shared/clasesLegacyDetailAdapter";
import { clasesSearchTypeAndLevel } from "../app/(site)/clasificados/clases/shared/clasesSearchBlob";
import type { CommunityListingPairMap } from "../app/(site)/clasificados/community/shared/communityListingDetailPairs";
import {
  buildClasesDiscoveryCardModel,
} from "../app/(site)/clasificados/clases/shared/clasesDiscoveryCardModel";
import type { CommunityListingBrowseRow } from "../app/(site)/clasificados/community/shared/communityListingsBrowseClient";
import {
  normalizePaymentMethods,
  detectClasesPaymentBrand,
  isClasesPaymentMethodId,
  MAX_CLASES_PAYMENT_METHODS,
} from "../app/(site)/publicar/clases/lib/clasesPaymentMethods";
import { getClasesCheckpointCard } from "../app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints";

function pairs(entries: Record<string, string>): { label: string; value: string }[] {
  return Object.entries(entries).map(([label, value]) => ({ label, value }));
}

function pairMap(entries: Record<string, string>): CommunityListingPairMap {
  return entries as CommunityListingPairMap;
}

function row(overrides: Partial<CommunityListingBrowseRow>): CommunityListingBrowseRow {
  return {
    id: "row-1",
    title: "Sample listing",
    description: "Sample description",
    city: "San José",
    price: 0,
    is_free: true,
    category: null,
    detail_pairs: [],
    images: [],
    created_at: null,
    owner_id: null,
    ...overrides,
  };
}

function readSrc(relPath: string): string {
  return readFileSync(join(__dirname, "..", relPath), "utf8");
}

// ---------------------------------------------------------------------------
// 1, 15. Multi-category data model
// ---------------------------------------------------------------------------
{
  assert.equal(MAX_CLASES_CATEGORIES, 4, "expected MAX_CLASES_CATEGORIES to be 4");

  const draft = normalizeClasesQuickDraft({
    category: "yoga",
    categories: ["yoga", "yoga", "boxeo", "pilates", "zumba", "musica"],
  });
  assert.deepEqual(draft.categories, ["yoga", "boxeo", "pilates", "zumba"], `expected dedupe + cap at 4, got ${JSON.stringify(draft.categories)}`);
  assert.equal(draft.category, "yoga", "expected category to mirror categories[0]");

  const legacySlugDraft = normalizeClasesQuickDraft({ category: "danza", categories: ["danza"] });
  assert.equal(legacySlugDraft.categories[0], "baile_danza", "expected legacy category slug remapped inside categories[]");

  const fallbackDraft = normalizeClasesQuickDraft({ category: "boxeo" });
  assert.deepEqual(fallbackDraft.categories, ["boxeo"], "expected categories[] to fall back to [category] when absent");

  console.log("OK: multi-category cap/dedupe/legacy-map + category mirroring");
}

// ---------------------------------------------------------------------------
// 2, 3, 11. Legacy compatibility: persistence + hydration + legacy detail adapter
// ---------------------------------------------------------------------------
{
  const singleCategoryDraft: ClasesQuickDraft = {
    ...emptyClasesQuickDraft(),
    category: "boxeo",
    categories: ["boxeo"],
  };
  const singlePairs = buildClasesDetailPairs(singleCategoryDraft);
  assert.equal(
    singlePairs.find((p) => p.label === "Leonix:classCategories")?.value,
    "boxeo",
    "single-category draft should still emit Leonix:classCategories for forward compatibility",
  );

  const multiCategoryDraft: ClasesQuickDraft = {
    ...emptyClasesQuickDraft(),
    category: "boxeo",
    categories: ["boxeo", "yoga", "pilates"],
  };
  const multiPairs = buildClasesDetailPairs(multiCategoryDraft);
  const catPair = multiPairs.find((p) => p.label === "Leonix:classCategories");
  assert.equal(catPair?.value, "boxeo,yoga,pilates", `expected CSV categories pair, got ${catPair?.value}`);

  const listing: ClasesPublishedListingLike = {
    id: "l1",
    title: { es: "Clase", en: "Class" },
    blurb: { es: "", en: "" },
    city: "San José",
  };

  const legacyPairsRaw = pairs({
    "Leonix:communityLane": "quick",
    "Leonix:communityKind": "clases",
    "Leonix:classCategory": "boxeo",
  });
  const legacyHydrated = clasesPublishedQuickToDraft(legacyPairsRaw, listing, "es");
  assert.deepEqual(legacyHydrated?.categories, ["boxeo"], "expected legacy listing (no classCategories key) to hydrate to [primary category]");

  const multiPairsRaw = pairs({
    "Leonix:communityLane": "quick",
    "Leonix:communityKind": "clases",
    "Leonix:classCategory": "boxeo",
    "Leonix:classCategories": "boxeo,yoga,pilates",
  });
  const multiHydrated = clasesPublishedQuickToDraft(multiPairsRaw, listing, "es");
  assert.deepEqual(multiHydrated?.categories, ["boxeo", "yoga", "pilates"], "expected multi-category hydration round trip");

  const legacyDetail = buildClasesLegacyDetail(pairMap({ "Leonix:classCategory": "boxeo", "Leonix:mode": "presencial", "Leonix:classCostType": "gratis" }), "es");
  assert.equal(legacyDetail.categoryChipLabel, "Clases", "legacy detail adapter must still build for old listings with only the primary category");

  console.log("OK: legacy-safe multi-category persistence + hydration + legacy detail adapter");
}

// ---------------------------------------------------------------------------
// 4, 5. Payment methods catalog + persistence
// ---------------------------------------------------------------------------
{
  const methods = normalizePaymentMethods(["zelle", "zelle", "cash", "bogus", "otro"]);
  assert.deepEqual(methods, ["cash", "zelle", "otro"], `expected whitelist/dedupe/catalog-order, got ${JSON.stringify(methods)}`);
  assert.ok(methods.length <= MAX_CLASES_PAYMENT_METHODS);
  assert.ok(isClasesPaymentMethodId("venmo"));
  assert.ok(!isClasesPaymentMethodId("bitcoin"));
  assert.equal(detectClasesPaymentBrand("Pago por Venmo por favor"), "venmo", "expected brand detection inside free-typed otro label");
  assert.equal(detectClasesPaymentBrand("Apple Pay"), null, "unrecognized brand should not false-positive");

  const paidDraft: ClasesQuickDraft = {
    ...emptyClasesQuickDraft(),
    paymentMethods: ["cash", "otro"],
    paymentMethodOther: "Apple Pay",
  };
  const payPairs = buildClasesDetailPairs(paidDraft);
  const pmPair = payPairs.find((p) => p.label === "Leonix:paymentMethods");
  assert.equal(pmPair?.value, "cash,otro");
  const otherPair = payPairs.find((p) => p.label === "Leonix:paymentMethodOther");
  assert.equal(otherPair?.value, "Apple Pay");

  const listing: ClasesPublishedListingLike = { id: "l2", title: { es: "C", en: "C" }, blurb: { es: "", en: "" }, city: "San José" };
  const hydrated = clasesPublishedQuickToDraft(
    pairs({
      "Leonix:communityLane": "quick",
      "Leonix:communityKind": "clases",
      "Leonix:classCategory": "boxeo",
      "Leonix:paymentMethods": "cash,otro",
      "Leonix:paymentMethodOther": "Apple Pay",
    }),
    listing,
    "es",
  );
  assert.deepEqual(hydrated?.paymentMethods, ["cash", "otro"]);
  assert.equal(hydrated?.paymentMethodOther, "Apple Pay");

  console.log("OK: payment-methods catalog, brand detection, persistence + hydration round trip");
}

// ---------------------------------------------------------------------------
// 6, 7. Search indexing (all types) + discovery card (capped display)
// ---------------------------------------------------------------------------
{
  const pmap = pairMap({
    "Leonix:classCategory": "boxeo",
    "Leonix:classCategories": "boxeo,yoga,pilates",
  });
  const { typeLine } = clasesSearchTypeAndLevel(pmap, true, "es");
  assert.ok(typeLine.includes("Boxeo"), `search blob missing Boxeo: ${typeLine}`);
  assert.ok(typeLine.includes("Yoga"), `search blob missing Yoga: ${typeLine}`);
  assert.ok(typeLine.includes("Pilates"), `search blob missing Pilates (all types must be searchable): ${typeLine}`);

  const clasesRow = row({
    detail_pairs: pairs({
      "Leonix:communityLane": "quick",
      "Leonix:communityKind": "clases",
      "Leonix:classCategory": "boxeo",
      "Leonix:classCategories": "boxeo,yoga,pilates",
      "Leonix:classCostType": "gratis",
      "Leonix:mode": "presencial",
    }),
    is_free: true,
  });
  const cardModel = buildClasesDiscoveryCardModel(clasesRow, "es", "/clasificados/anuncio/row-1");
  assert.ok(cardModel.typeChip, "expected a type chip");
  assert.ok(
    (cardModel.typeChip as string).includes("más") || (cardModel.typeChip as string).split(" + ").length <= 3,
    `expected capped type chip display (no chip soup), got ${cardModel.typeChip}`,
  );

  console.log("OK: search indexing covers all class types; discovery card caps chip display");
}

// ---------------------------------------------------------------------------
// 8. Paid publish gate unchanged
// ---------------------------------------------------------------------------
{
  const free: ClasesQuickDraft = { ...emptyClasesQuickDraft(), classCostType: "gratis" };
  const paid: ClasesQuickDraft = { ...emptyClasesQuickDraft(), classCostType: "pagada" };
  assert.equal(shouldBlockClasesPaidPublish(free), false);
  assert.equal(shouldBlockClasesPaidPublish(paid), true);
  console.log("OK: shouldBlockClasesPaidPublish unchanged (still blocks paid publish)");
}

// ---------------------------------------------------------------------------
// 9. Taxonomy additions
// ---------------------------------------------------------------------------
{
  assert.ok(CLASES_CATEGORY_OPTIONS.some((o) => o.value === "pilates"), "expected Pilates in Clases category taxonomy");
  assert.ok(COMMUNITY_AUDIENCE_OPTIONS.some((o) => o.value === "adultos_mayores"), "expected Adultos mayores in shared audience taxonomy");
  console.log("OK: taxonomy additions (Pilates, Adultos mayores) present");
}

// ---------------------------------------------------------------------------
// 10. Contact canvas grouping
// ---------------------------------------------------------------------------
{
  const draft: ClasesQuickDraft = {
    ...emptyClasesQuickDraft(),
    classLinks: {
      ...emptyClasesQuickDraft().classLinks,
      registrationUrl: "https://example.com/register",
      classMaterialsUrl: "https://example.com/materials",
      instructorPageUrl: "https://example.com/instructor",
    },
  };
  const model = buildClasesContactCanvasModel(draft, "es");
  const groups = new Set(model.linkItems.map((i) => i.groupLabel).filter(Boolean));
  assert.ok(groups.size >= 2, `expected at least 2 distinct link groups, got ${groups.size}`);
  assert.ok(model.linkItems.every((i) => i.groupLabel), "every Clases link item should carry a groupLabel");
  console.log("OK: class links carry groupLabel (Section Q grouping)");
}

// ---------------------------------------------------------------------------
// 12, 13. Copy fixes
// ---------------------------------------------------------------------------
{
  const formPrimitives = readSrc("app/(site)/publicar/community/shared/components/communityFormPrimitives.tsx");
  assert.ok(!formPrimitives.includes("Sitio web / registro"), "shared website label should no longer conflate site + registration");
  assert.ok(!formPrimitives.includes("Website / registration link"));

  const publishCopy = readSrc("app/(site)/publicar/community/shared/copy/communityPublishCopy.ts");
  assert.ok(!/en preparaci|in preparation/i.test(publishCopy), "paid-class copy must not use vague 'in preparation' wording anymore");
  assert.ok(publishCopy.includes("$24.99"), "paid-class copy must explicitly disclose the $24.99/30-day Leonix fee");

  const formSrc = readSrc("app/(site)/publicar/clases/quick/ClasesQuickApplication.tsx");
  assert.ok(!/en preparaci|in preparation/i.test(formSrc), "form paid notice must not use vague 'in preparation' wording");
  assert.ok(formSrc.includes("$24.99"), "form paid notice must explicitly show $24.99");

  const canvasSrc = readSrc("app/(site)/publicar/clases/components/ClasesQuickAdCanvas.tsx");
  assert.ok(!/en preparaci|in preparation/i.test(canvasSrc), "canvas paid notice must not use vague 'in preparation' wording");

  console.log("OK: website label + paid-class disclosure copy fixed everywhere");
}

// ---------------------------------------------------------------------------
// 14. Date range persistence + hydration
// ---------------------------------------------------------------------------
{
  const draft: ClasesQuickDraft = { ...emptyClasesQuickDraft(), startDate: "2026-09-01", endDate: "2026-10-15" };
  const p = buildClasesDetailPairs(draft);
  assert.equal(p.find((x) => x.label === "Leonix:classStartDate")?.value, "2026-09-01");
  assert.equal(p.find((x) => x.label === "Leonix:classEndDate")?.value, "2026-10-15");

  const listing: ClasesPublishedListingLike = { id: "l3", title: { es: "C", en: "C" }, blurb: { es: "", en: "" }, city: "San José" };
  const hydrated = clasesPublishedQuickToDraft(
    pairs({
      "Leonix:communityLane": "quick",
      "Leonix:communityKind": "clases",
      "Leonix:classCategory": "boxeo",
      "Leonix:classStartDate": "2026-09-01",
      "Leonix:classEndDate": "2026-10-15",
    }),
    listing,
    "es",
  );
  assert.equal(hydrated?.startDate, "2026-09-01");
  assert.equal(hydrated?.endDate, "2026-10-15");
  console.log("OK: optional date-range fields persist and hydrate; legacy listings without them stay valid");
}

// ---------------------------------------------------------------------------
// 16. Checkpoint card sells the full feature set
// ---------------------------------------------------------------------------
{
  const card = getClasesCheckpointCard("es", "/publicar/clases/quick");
  const joined = card.includedBullets.join(" ");
  assert.ok(/4 tipos|multiple|Boxeo/i.test(card.shortDescription + joined), "checkpoint card should mention multi-type support");
  assert.ok(/Pagos aceptados|accepted payments/i.test(joined), "checkpoint card should mention accepted payment methods");
  console.log("OK: Clases checkpoint card sells the full Gate 2A feature set");
}

// ---------------------------------------------------------------------------
// Section B / U / X — component composition checks (source inspection)
// ---------------------------------------------------------------------------
{
  const formSrc = readSrc("app/(site)/publicar/clases/quick/ClasesQuickApplication.tsx");
  const mediaIdx = formSrc.indexOf("copy.sections.media");
  const costIdx = formSrc.indexOf("copy.sections.cost");
  assert.ok(mediaIdx > 0 && costIdx > 0 && mediaIdx < costIdx, "media/flyer section must render before the cost section (Section B)");
  assert.ok(formSrc.includes("showPrimaryCtaSelector={false}"), "expected showPrimaryCtaSelector={false} wired on Clases CTA group (Section U)");
  assert.ok(formSrc.includes("showSecondaryActions={false}"), "expected showSecondaryActions={false} so the raw form ends in Vista previa only (Section X)");

  const canvasSrc = readSrc("app/(site)/publicar/clases/components/ClasesQuickAdCanvas.tsx");
  assert.ok(canvasSrc.includes("absolute right-3 top-3"), "expected status badge repositioned top-right (Section AA)");

  console.log("OK: form section order + CTA selector flags + badge position verified via source inspection");
}

console.log("gate-2a-clases-qa-selftest: PASS");
