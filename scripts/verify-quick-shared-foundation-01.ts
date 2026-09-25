/**
 * QUICK / FULL SHARED FOUNDATION (owner lock 2026-09-24).
 *
 * Pins the three shared pieces every business family builds on:
 *  1. ONE per-category Quick photo-cap table (never a universal 3): the number that fills the family's
 *     proven native media composition.
 *  2. Plan carry-through: `plan=quick` survives the application <-> preview edit round trip and a Quick
 *     link can never be rewritten into `plan=full`.
 *  3. The Full-only field boundary: a Quick save cannot add socials/extra URLs/reviews/Yelp/extra
 *     links, but stored values are RESTORED, never deleted; and it applies ONLY to a proven Quick
 *     product (an `unverified` first save may be a Full customer and is never stripped).
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-quick-shared-foundation-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  QUICK_BUSINESS_MAX_IMAGES_BY_CATEGORY,
  QUICK_BUSINESS_PUBLISH_MAX_IMAGES,
  buildQuickMediaLimits,
  buildQuickPublishMediaLimits,
  quickImageMaxForBusinessCategory,
} from "../app/lib/quickBusiness/quickBusinessMediaSemantics";
import { QUICK_BUSINESS_DEFINITIONS } from "../app/lib/quickBusiness/quickBusinessRegistry";
import { carryBusinessPlanParam, businessPlanFromParam } from "../app/lib/listingPlans/businessQuickPlanSignal";
import { applyQuickFullOnlyBoundary, quickFullOnlyBoundaryApplies } from "../app/lib/quickBusiness/quickFullOnlyBoundary";

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
const raw = (rel: string) => readFileSync(rel, "utf8").replace(/\r\n/g, "\n");

check("caps: the table is category-aware and is the single source (servicios 5, restaurantes 5, autos-dealer 4, bienes-negocio 8)", () => {
  assert.deepEqual({ ...QUICK_BUSINESS_MAX_IMAGES_BY_CATEGORY }, { servicios: 5, restaurantes: 5, "autos-dealer": 4, "bienes-negocio": 8 });
  assert.notEqual(new Set(Object.values(QUICK_BUSINESS_MAX_IMAGES_BY_CATEGORY)).size, 1, "not one universal number");
  for (const cat of Object.keys(QUICK_BUSINESS_MAX_IMAGES_BY_CATEGORY) as (keyof typeof QUICK_BUSINESS_MAX_IMAGES_BY_CATEGORY)[]) {
    assert.equal(quickImageMaxForBusinessCategory(cat), QUICK_BUSINESS_MAX_IMAGES_BY_CATEGORY[cat]);
    assert.equal(QUICK_BUSINESS_PUBLISH_MAX_IMAGES[cat], QUICK_BUSINESS_MAX_IMAGES_BY_CATEGORY[cat], `${cat}: publish seam reads the table`);
    assert.equal(buildQuickPublishMediaLimits(cat)!.maxImages, QUICK_BUSINESS_MAX_IMAGES_BY_CATEGORY[cat]);
    assert.equal(buildQuickMediaLimits(cat)!.maxImages, QUICK_BUSINESS_MAX_IMAGES_BY_CATEGORY[cat]);
    assert.equal(buildQuickMediaLimits(cat)!.videoAllowed, false, `${cat}: no video in Quick`);
  }
  assert.equal(quickImageMaxForBusinessCategory("rentas"), null, "flat lanes have no Quick cap");
  assert.equal(quickImageMaxForBusinessCategory(undefined), null);
});
check("caps: the registry contract and its customer-facing note read the table in both languages", () => {
  const map = { servicios: "servicios", restaurantes: "restaurantes", "autos-dealer": "autos-dealer", "bienes-negocio": "bienes-negocio" } as const;
  for (const key of Object.keys(map) as (keyof typeof map)[]) {
    const contract = QUICK_BUSINESS_DEFINITIONS[key as keyof typeof QUICK_BUSINESS_DEFINITIONS].media;
    const n = QUICK_BUSINESS_MAX_IMAGES_BY_CATEGORY[key];
    assert.equal(contract.maxImages, n);
    assert.equal(contract.videoOptional, false);
    assert.ok(contract.note.es.includes(String(n)) && contract.note.en.includes(String(n)), `${key}: note states ${n}`);
  }
});
check("caps: checkpoint card copy reads the table (no stale 'up to 3 photos')", () => {
  const src = raw("app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts");
  assert.ok(!/Hasta 3 fotos|Up to 3 photos/.test(src), "no literal 3-photo copy left");
  assert.ok(src.includes('quickImageMaxForBusinessCategory("servicios")'));
  assert.ok(src.includes('quickImageMaxForBusinessCategory("restaurantes")'));
  assert.ok(src.includes('quickImageMaxForBusinessCategory("autos-dealer")'));
  assert.ok(src.includes('quickImageMaxForBusinessCategory("bienes-negocio")'));
});

check("plan: Quick is carried across edit round trips, Full is never written, other params/hash survive", () => {
  assert.equal(carryBusinessPlanParam("/publicar/servicios", "quick"), "/publicar/servicios?plan=quick");
  assert.equal(carryBusinessPlanParam("/publicar/servicios?lang=en", "quick"), "/publicar/servicios?lang=en&plan=quick");
  assert.equal(carryBusinessPlanParam("/x?plan=full&lang=es#top", "quick"), "/x?plan=quick&lang=es#top");
  assert.equal(carryBusinessPlanParam("/publicar/servicios?lang=en", "full"), "/publicar/servicios?lang=en", "Full adds nothing");
  assert.ok(!carryBusinessPlanParam("/a", "full").includes("plan=full"), "plan=full is never minted");
  assert.equal(businessPlanFromParam("quick"), "quick");
  assert.equal(businessPlanFromParam("full"), "full");
  assert.equal(businessPlanFromParam(null), "full");
});

check("boundary: applies ONLY to a proven Quick product (never unverified, never Full, never a flat lane)", () => {
  assert.equal(quickFullOnlyBoundaryApplies({ product: "quick", source: "assisted_context" }), true);
  assert.equal(quickFullOnlyBoundaryApplies({ product: "quick", source: "declared_simple_package" }), true);
  assert.equal(quickFullOnlyBoundaryApplies({ product: "unverified", source: "none" }), false);
  assert.equal(quickFullOnlyBoundaryApplies({ product: "full", source: "live_entitlement" }), false);
  assert.equal(quickFullOnlyBoundaryApplies({ product: "unverified", source: "no_quick_product" }), false);
  assert.equal(quickFullOnlyBoundaryApplies(null), false);
});
check("boundary: a NEW Quick listing cannot carry Full-only content; the primary website stays", () => {
  const incoming = {
    website: "https://acme.example",
    contact: { socialLinks: { instagram: "https://ig/acme" }, extraLinks: [{ label: "Blog", url: "https://blog" }], phone: "408" },
    externalReviewLinks: { google: "https://g", yelp: "https://y" },
  };
  const r = applyQuickFullOnlyBoundary({ incoming, existing: null, paths: ["contact.socialLinks", "contact.extraLinks", "externalReviewLinks"] });
  assert.deepEqual(r.value.contact.socialLinks, {});
  assert.deepEqual(r.value.contact.extraLinks, []);
  assert.deepEqual(r.value.externalReviewLinks, {});
  assert.equal(r.value.website, "https://acme.example", "primary website untouched");
  assert.equal(r.value.contact.phone, "408", "contact channels untouched");
  assert.deepEqual(r.changedPaths.sort(), ["contact.extraLinks", "contact.socialLinks", "externalReviewLinks"]);
  assert.equal(incoming.contact.socialLinks.instagram, "https://ig/acme", "the caller's object is not mutated");
});
check("boundary: stored Full-only history is RESTORED on a Quick edit, never deleted, and browser input never wins", () => {
  const existing = { contact: { socialLinks: { facebook: "https://fb/acme" } }, googleReviewsUrl: "https://g/stored" };
  const incoming = { contact: { socialLinks: { instagram: "https://ig/new" } }, googleReviewsUrl: "https://g/forged", name: "Acme" };
  const r = applyQuickFullOnlyBoundary({ incoming, existing, paths: ["contact.socialLinks", "googleReviewsUrl"] });
  assert.deepEqual(r.value.contact.socialLinks, { facebook: "https://fb/acme" });
  assert.equal(r.value.googleReviewsUrl, "https://g/stored");
  assert.equal(r.value.name, "Acme");
});
check("boundary: nothing to strip -> unchanged; a path absent from the payload is not invented", () => {
  const incoming = { name: "Acme", contact: { phone: "1" } };
  const r = applyQuickFullOnlyBoundary({ incoming, existing: null, paths: ["contact.socialLinks", "yelpUrl"] });
  assert.deepEqual(r.value, incoming);
  assert.deepEqual(r.changedPaths, []);
});

check("shared modules stay pure/server-safe (no app/(site) imports, no fetch)", () => {
  for (const rel of ["app/lib/quickBusiness/quickFullOnlyBoundary.ts", "app/lib/quickBusiness/quickBusinessMediaSemantics.ts"]) {
    const src = raw(rel);
    assert.ok(!src.includes("app/(site)"), `${rel}: no app/(site) import`);
    assert.ok(!/\bfetch\(/.test(src), `${rel}: no network`);
  }
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nverify-quick-shared-foundation-01: all checks passed");
