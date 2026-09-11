/**
 * Gate SERVICIOS-EDIT-ROUNDTRIP-OFFERS-DISCOVERY-1 — regression proof for the two blockers the
 * SERVICIOS-FOUNDATIONAL-QA-GREEN-LIGHT-ABSOLUTE-02 execution probe found.
 *
 * F1 — "Otro servicio" description round-trip. The owner's "Describe tu servicio" text is persisted
 *      ONLY as the public `hero.categoryLine`. Dashboard edit hydration (and the listing-bound
 *      Preview, which hydrates the same way) never read it back, so the edit form reopened with the
 *      field empty, the Preview lost the category line, and republish was refused by readiness
 *      until the owner retyped it.
 * F2 — "Tiene ofertas" discovery truth. The results filter counted only old-style promotions, so a
 *      listing whose INCLUDED coupons/offers render on its detail page never matched. The filter
 *      now reads the same current `coupons_offers` capability the detail page uses, at read time.
 *
 * Execution-first. F1 runs the REAL client payload builder → server mapper chain → B5 split →
 * owner merge → dashboard hydration → republish. F2 runs the REAL results filter and Saved Search
 * matcher over rows built by that same pipeline, with capability decided by the REAL plan policy.
 * Source assertions then pin the wiring (detail page, results page, Saved Search, batch resolver).
 *
 * Sensitivity: the new helpers are loaded dynamically so this file also RUNS against the pre-fix
 * tree (87b3f7f7) and reports the defects as FAILs instead of crashing on a missing import.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-edit-roundtrip.ts
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createDefaultClasificadosServiciosState } from "../app/(site)/clasificados/publicar/servicios/lib/defaultClasificadosServiciosState";
import { normalizeClasificadosServiciosApplicationState } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize";
import { buildServiciosPublishPayload } from "../app/(site)/clasificados/publicar/servicios/lib/buildServiciosPublishPayload";
import {
  applyClasificadosCouponsToServiciosWireProfile,
  mapClasificadosServiciosApplicationToServiciosDraft,
} from "../app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft";
import { mapServiciosApplicationDraftToBusinessProfile } from "../app/(site)/servicios/lib/mapServiciosApplicationDraftToBusinessProfile";
import { serviciosPublishedToApplicationDraft } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft";
import { evaluateServiciosPublishReadiness } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosPublishReadiness";
import * as categoryLabel from "../app/(site)/clasificados/publicar/servicios/lib/resolveServiciosPublicCategoryLabel";
import { BUSINESS_TYPE_PRESETS } from "../app/(site)/clasificados/publicar/servicios/lib/businessTypePresets";
import type { ClasificadosServiciosApplicationState } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import {
  mergeServiciosPrivateAddressForOwner,
  splitServiciosAddressForPersistence,
} from "../app/(site)/clasificados/servicios/lib/serviciosAddressPrivacy";
import { filterServiciosPublicListingRows } from "../app/(site)/clasificados/servicios/lib/serviciosResultsFilter";
import type { ServiciosPublicListingRow } from "../app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer";
import { resolveServiciosProfile } from "../app/(site)/servicios/lib/resolveServiciosProfile";
import type { ServiciosBusinessProfile, ServiciosProfileResolved } from "../app/(site)/servicios/types/serviciosBusinessProfile";
import * as planPolicy from "../app/lib/listingPlans/categoryCommercialPlanPolicy";
import type { CategoryListingPlan, EntitlementRowFacts } from "../app/lib/listingPlans/categoryCommercialPlanPolicy";
import { matchesServiciosSavedSearch } from "../app/lib/saved-search/servicios/savedSearchServiciosMatcher";
import { certifyServiciosPublicEligibleListing } from "../app/lib/saved-search/servicios/serviciosPublicEligibleListing";

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
function stripComments(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const src = (rel: string) => stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8"));

// New helpers (absent before this gate) — loaded dynamically so the pre-fix tree fails, not crashes.
type OffersVisibilityModule = {
  applyServiciosPublicOffersVisibility: (p: ServiciosProfileResolved, allowed: boolean) => ServiciosProfileResolved;
  serviciosResolvedProfileHasVisibleOffers: (p: ServiciosProfileResolved) => boolean;
  serviciosWireHasOfferContent: (p: ServiciosBusinessProfile | null | undefined) => boolean;
};
const OFFERS_VISIBILITY_REL = "app/(site)/clasificados/servicios/lib/serviciosPublicOffersVisibility.ts";
const requireFromHere = createRequire(import.meta.url);
const offersVisibility: OffersVisibilityModule | null = existsSync(new URL(`../${OFFERS_VISIBILITY_REL}`, import.meta.url))
  ? (requireFromHere(`../${OFFERS_VISIBILITY_REL}`) as OffersVisibilityModule)
  : null;
const requireOffersVisibility = (): OffersVisibilityModule => {
  assert.ok(offersVisibility, `${OFFERS_VISIBILITY_REL} is missing (pre-fix tree)`);
  return offersVisibility;
};

// ---------------------------------------------------------------------------------
// The real save pipeline (publish route ~349–358 + the B5 split at ~505). The discovery facet is
// server-only and irrelevant to both contracts, so opsMeta is compared separately.
// ---------------------------------------------------------------------------------

type State = ClasificadosServiciosApplicationState;
const IMG = (n: string) => `https://example.public.blob.vercel-storage.com/servicios/qa-${n}.jpg`;
const PLOMERIA = BUSINESS_TYPE_PRESETS.find((p) => p.id === "plomeria") ?? BUSINESS_TYPE_PRESETS[0];

function completeState(over: Partial<State> = {}): State {
  const s = createDefaultClasificadosServiciosState();
  return {
    ...s,
    businessTypeId: PLOMERIA.id,
    businessName: "Servicio QA Ida y Vuelta",
    city: "Oakland",
    phone: "5105551234",
    aboutText: "Servicio profesional con garantía por escrito.",
    selectedServiceIds: PLOMERIA.suggestedServices.slice(0, 2).map((c) => c.id),
    customServicesOffered: ["Servicio a domicilio"],
    gallery: [
      { id: "g1", url: IMG("g1"), source: "url" },
      { id: "g2", url: IMG("g2"), source: "url" },
    ],
    featuredGalleryIds: ["g2", "g1"],
    confirmListingAccurate: true,
    confirmPhotosRepresentBusiness: true,
    confirmCommunityRules: true,
    ...over,
  };
}

function save(raw: State, slug: string) {
  const state = normalizeClasificadosServiciosApplicationState(buildServiciosPublishPayload(raw));
  const readiness = evaluateServiciosPublishReadiness(state, "es");
  const draft = mapClasificadosServiciosApplicationToServiciosDraft(state, "es");
  draft.identity.slug = slug;
  let wire = mapServiciosApplicationDraftToBusinessProfile(draft);
  wire = applyClasificadosCouponsToServiciosWireProfile(wire, draft);
  const opsMeta = { ...wire.opsMeta } as NonNullable<ServiciosBusinessProfile["opsMeta"]>;
  if (state.businessTypeId.trim()) opsMeta.businessTypeId = state.businessTypeId.trim();
  wire = { ...wire, opsMeta };
  const { publicProfile, privateContact } = splitServiciosAddressForPersistence(wire);
  return { state, readiness, wire, publicProfile, privateContact };
}

/** Dashboard edit / listing-bound Preview: my-listing API (owner merge) → hydration. */
function hydrate(first: ReturnType<typeof save>, slug: string) {
  const ownerProfile = mergeServiciosPrivateAddressForOwner(first.publicProfile, first.privateContact);
  return serviciosPublishedToApplicationDraft({
    id: "00000000-0000-4000-8000-00000000f001",
    slug,
    business_name: first.state.businessName,
    city: first.state.city,
    listing_status: "published",
    profile_json: ownerProfile,
  });
}

const withoutOpsMeta = (p: ServiciosBusinessProfile) => JSON.stringify({ ...p, opsMeta: undefined });
const reconfirmed = (s: State): State => ({
  ...s,
  confirmListingAccurate: true,
  confirmPhotosRepresentBusiness: true,
  confirmCommunityRules: true,
});

// =================================================================================
// F1 — "Otro servicio" description round-trip
// =================================================================================

const OTRO = "servicio_otro_generico";
const DESCRIPTION = "Reparación de celulares";

const otroFirst = save(completeState({ businessTypeId: OTRO, customServiceDescription: DESCRIPTION, selectedServiceIds: [] }), "celulares-qa");
const otroHydrated = hydrate(otroFirst, "celulares-qa");
const otroSecond = save(reconfirmed(otroHydrated.state), "celulares-qa");

check("F1 fixture: first publish is ready and the description IS the public category line", () => {
  assert.equal(otroFirst.readiness.ok, true, JSON.stringify(otroFirst.readiness.missing));
  assert.equal(otroFirst.wire.hero?.categoryLine, DESCRIPTION);
});
check("F1: dashboard edit hydration restores the Otro servicio description", () => {
  assert.equal(otroHydrated.state.businessTypeId, OTRO);
  assert.equal(otroHydrated.state.customServiceDescription, DESCRIPTION);
});
check("F1: listing-bound Preview data carries it (the Preview renders from the hydrated state)", () => {
  assert.equal(categoryLabel.resolveServiciosPublicCategoryLabel(otroHydrated.state, "es"), DESCRIPTION);
  const previewDraft = mapClasificadosServiciosApplicationToServiciosDraft(otroHydrated.state, "es");
  assert.equal(previewDraft.hero.categoryLine, DESCRIPTION);
});
check("F1: the edited listing is republishable without retyping (readiness no longer refuses it)", () => {
  assert.equal(otroSecond.readiness.ok, true, JSON.stringify(otroSecond.readiness.missing));
});
check("F1: republish serialization preserves the public category line and the whole public profile", () => {
  assert.equal(otroSecond.wire.hero?.categoryLine, DESCRIPTION);
  assert.equal(withoutOpsMeta(otroSecond.publicProfile), withoutOpsMeta(otroFirst.publicProfile));
  assert.equal(otroSecond.publicProfile.opsMeta?.businessTypeId, OTRO);
});
check("F1: surrounding whitespace is trimmed once at publish and the round trip is stable", () => {
  const first = save(completeState({ businessTypeId: OTRO, customServiceDescription: `  ${DESCRIPTION}  `, selectedServiceIds: [] }), "celulares-ws");
  const h = hydrate(first, "celulares-ws");
  const second = save(reconfirmed(h.state), "celulares-ws");
  assert.equal(first.wire.hero?.categoryLine, DESCRIPTION);
  assert.equal(h.state.customServiceDescription, DESCRIPTION);
  assert.equal(withoutOpsMeta(second.publicProfile), withoutOpsMeta(first.publicProfile));
});
check("F1: Otro + hidden exact address — both the description and the private street round-trip", () => {
  const first = save(
    completeState({
      businessTypeId: OTRO,
      customServiceDescription: DESCRIPTION,
      selectedServiceIds: [],
      physicalStreet: "100 Calle Prueba",
      physicalAddressCity: "Oakland",
      physicalPostalCode: "94601",
      showExactAddress: false,
    }),
    "celulares-priv",
  );
  assert.ok(!JSON.stringify(first.publicProfile).includes("100 Calle Prueba"), "street must stay private");
  const h = hydrate(first, "celulares-priv");
  assert.equal(h.state.customServiceDescription, DESCRIPTION);
  assert.equal(h.state.physicalStreet, "100 Calle Prueba");
  const second = save(reconfirmed(h.state), "celulares-priv");
  assert.equal(withoutOpsMeta(second.publicProfile), withoutOpsMeta(first.publicProfile));
});

const presetFirst = save(completeState(), "plomeria-qa");
const presetHydrated = hydrate(presetFirst, "plomeria-qa");
const presetSecond = save(reconfirmed(presetHydrated.state), "plomeria-qa");
check("F1: a predefined category is unaffected (preset label, no invented description, stable republish)", () => {
  assert.equal(presetFirst.wire.hero?.categoryLine, PLOMERIA.labelEs);
  assert.equal(presetHydrated.state.businessTypeId, PLOMERIA.id);
  assert.equal(presetHydrated.state.customServiceDescription ?? "", "");
  assert.equal(presetSecond.wire.hero?.categoryLine, PLOMERIA.labelEs);
  assert.equal(withoutOpsMeta(presetSecond.publicProfile), withoutOpsMeta(presetFirst.publicProfile));
});
check("F1: exactly one authority decides which business types use the custom label", () => {
  const predicate = (categoryLabel as Record<string, unknown>).serviciosBusinessTypeUsesCustomCategoryLabel;
  assert.equal(typeof predicate, "function", "shared predicate is missing (pre-fix tree)");
  const uses = predicate as (id: string) => boolean;
  assert.equal(uses(OTRO), true);
  assert.equal(uses(PLOMERIA.id), false);
  const label = src("app/(site)/clasificados/publicar/servicios/lib/resolveServiciosPublicCategoryLabel.ts");
  const hydration = src("app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts");
  assert.match(label, /if \(serviciosBusinessTypeUsesCustomCategoryLabel\(state\.businessTypeId\)\)/, "label resolver must use it");
  assert.match(hydration, /serviciosBusinessTypeUsesCustomCategoryLabel\(businessTypeId\)/, "hydration must use it");
  assert.match(hydration, /customServiceDescription:[\s\S]{0,160}clean\(hero\.categoryLine\)/, "hydration must read hero.categoryLine");
});
check("F1 sensitivity: the historical hydration (description dropped) is caught by these assertions", () => {
  const historical = { ...reconfirmed(otroHydrated.state), customServiceDescription: "" };
  const replay = save(historical, "celulares-qa");
  assert.equal(replay.readiness.ok, false, "pre-fix republish was refused by readiness");
  assert.ok(replay.readiness.missing.some((m) => m.id === "business_type"));
  assert.equal(replay.wire.hero?.categoryLine, undefined, "and the category line would be gone");
  assert.notEqual(withoutOpsMeta(replay.publicProfile), withoutOpsMeta(otroFirst.publicProfile));
});

// =================================================================================
// F2 — "Tiene ofertas" reads the current coupons_offers capability
// =================================================================================

const NOW = Date.parse("2026-09-10T12:00:00Z");
const FUTURE = "2026-10-10T12:00:00Z";
const PAST = "2026-08-01T12:00:00Z";
const COUPON = {
  title: "Cupón QA $25",
  description: "Descuento en destape",
  regularPrice: "$125",
  specialPrice: "$100",
  savings: "$25",
  imageUrl: "",
  url: "",
  couponCode: "QA25",
  expirationDate: "2026-12-31",
  redemptionNote: "Uno por cliente",
  ctaLabel: "Usar cupón",
};
const EMPTY_OFFERS = { couponsAddOn: true, coupons: [], couponFlyer: { imageUrl: "" }, couponMoreOffers: { url: "", buttonLabel: "" } };

function listingRow(id: string, slug: string, over: Partial<State>, legacyPromoHeadline?: string): ServiciosPublicListingRow {
  let profile = save(completeState({ businessName: `QA ${slug}`, ...EMPTY_OFFERS, ...over }), slug).publicProfile;
  if (legacyPromoHeadline) profile = { ...profile, promo: { id: "promo", headline: legacyPromoHeadline } };
  return {
    id,
    slug,
    business_name: `QA ${slug}`,
    city: "Oakland",
    published_at: "2026-09-01T00:00:00Z",
    profile_json: profile,
    leonix_verified: false,
    internal_group: PLOMERIA.internalGroup,
    listing_status: "published",
  };
}

type Fixture = { id: string; slug: string; row: ServiciosPublicListingRow; rows: EntitlementRowFacts[]; sub?: "grace" | "suspended" | null };
const base = (over: Partial<EntitlementRowFacts> = {}): EntitlementRowFacts => ({
  id: "ent-base",
  packageKey: "servicios_base_monthly",
  grantSource: "stripe_webhook",
  packageTier: "digital_only",
  status: "active",
  startsAt: "2026-08-10T12:00:00Z",
  endsAt: FUTURE,
  ...over,
});
const mk = (n: number, slug: string, over: Partial<State>, rows: EntitlementRowFacts[], extra: Partial<Fixture> = {}, promo?: string): Fixture => {
  const id = `00000000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`;
  return { id, slug, row: listingRow(id, slug, over, promo), rows, ...extra };
};
const FIX = {
  coupon: mk(1, "coupon-active", { coupons: [COUPON] }, [base()]),
  flyer: mk(2, "flyer-active", { couponFlyer: { imageUrl: IMG("flyer") } }, [base()]),
  more: mk(3, "more-active", { couponMoreOffers: { url: "https://qa.example.com/ofertas", buttonLabel: "Más ofertas" } }, [base()]),
  staleExpired: mk(4, "coupon-expired", { coupons: [COUPON] }, [base({ endsAt: PAST })]),
  staleNone: mk(5, "coupon-no-plan", { coupons: [COUPON] }, []),
  legacyAddon: mk(6, "coupon-legacy-addon", { coupons: [COUPON] }, [base({ id: "ent-addon", packageKey: "servicios_offers_addon" })]),
  promoOnly: mk(7, "promo-legacy", {}, [], {}, "10% en septiembre"),
  noContent: mk(8, "no-offers-active", {}, [base()]),
  suspended: mk(9, "coupon-suspended", { coupons: [COUPON] }, [base()], { sub: "suspended" }),
  grace: mk(10, "coupon-grace", { coupons: [COUPON] }, [base()], { sub: "grace" }),
};
const fixtures = Object.values(FIX);
const HAS_OFFERS = { hasOffers: "1" } as const;

/** Capability exactly as the detail page derives it (single-listing policy path). */
function singleAllowed(f: Fixture): boolean {
  const plan = planPolicy.decideCategoryListingPlan({ category: "servicios", rows: f.rows, nowMs: NOW, subscriptionOverride: f.sub ?? null });
  return planPolicy.decideBusinessToolsAccess({ plan, capability: "coupons_offers" }).allowed;
}
/** Capability as the results page derives it (batched path). */
function batchCapabilityMap(): Map<string, boolean> {
  const decide = (planPolicy as Record<string, unknown>).decideCategoryListingPlansForListings;
  assert.equal(typeof decide, "function", "batched plan decision is missing (pre-fix tree)");
  const plans = (decide as (i: unknown) => Map<string, CategoryListingPlan>)({
    category: "servicios",
    listingIds: fixtures.map((f) => f.id),
    rows: fixtures.flatMap((f) => f.rows.map((facts) => ({ listingId: f.id, facts }))),
    subscriptionOverrideByListingId: new Map(fixtures.filter((f) => f.sub).map((f) => [f.id, f.sub ?? null])),
    nowMs: NOW,
  });
  const out = new Map<string, boolean>();
  for (const f of fixtures) {
    const plan = plans.get(f.id);
    assert.ok(plan, `no plan for ${f.slug}`);
    out.set(f.id, planPolicy.decideBusinessToolsAccess({ plan, capability: "coupons_offers" }).allowed);
  }
  return out;
}
function hasOffersSlugs(capability?: Map<string, boolean>): Set<string> {
  const options = capability ? { offersCapabilityByListingId: capability } : undefined;
  const call = filterServiciosPublicListingRows as unknown as (...a: unknown[]) => ServiciosPublicListingRow[];
  return new Set(call(fixtures.map((f) => f.row), "es", HAS_OFFERS, options).map((r) => r.slug));
}

check("F2 fixtures: the real pipeline persisted each offer payload", () => {
  assert.equal(FIX.coupon.row.profile_json.coupons?.length, 1);
  assert.ok(FIX.flyer.row.profile_json.couponFlyer?.imageUrl);
  assert.ok(FIX.more.row.profile_json.couponMoreOffers?.url);
  assert.equal(FIX.noContent.row.profile_json.coupons?.length ?? 0, 0);
});
check("F2: batched capability decisions equal the single-listing decision for every listing", () => {
  const batch = batchCapabilityMap();
  for (const f of fixtures) assert.equal(batch.get(f.id), singleAllowed(f), f.slug);
  assert.deepEqual(
    fixtures.filter((f) => batch.get(f.id)).map((f) => f.slug).sort(),
    ["coupon-active", "coupon-grace", "coupon-legacy-addon", "flyer-active", "more-active", "no-offers-active"].sort(),
  );
});

const matched = (() => {
  try {
    return hasOffersSlugs(batchCapabilityMap());
  } catch {
    return hasOffersSlugs(new Map(fixtures.map((f) => [f.id, singleAllowed(f)])));
  }
})();
check("F2: an included coupon qualifies under the current coupons_offers capability", () => {
  assert.ok(matched.has("coupon-active"));
});
check("F2: a flyer alone qualifies", () => assert.ok(matched.has("flyer-active")));
check("F2: a more-offers link alone qualifies", () => assert.ok(matched.has("more-active")));
check("F2: grace keeps paid access usable (locked lifecycle doctrine)", () => assert.ok(matched.has("coupon-grace")));
check("F2: a historical offers add-on holder stays compatible through the SAME plan policy", () => {
  assert.ok(matched.has("coupon-legacy-addon"));
});
check("F2: an old-style promotion still qualifies (never capability-gated, same as the detail page)", () => {
  assert.ok(matched.has("promo-legacy"));
});
check("F2: stale offer data without current capability does NOT qualify (expired / none / suspended)", () => {
  for (const slug of ["coupon-expired", "coupon-no-plan", "coupon-suspended"]) assert.ok(!matched.has(slug), slug);
});
check("F2: an entitled listing with no offer content does not qualify", () => assert.ok(!matched.has("no-offers-active")));
check("F2: without capability truth the filter fails closed for coupon content (promotions unaffected)", () => {
  const blind = hasOffersSlugs();
  assert.deepEqual([...blind].sort(), ["promo-legacy"]);
});
check("F2: filter truth equals the detail page's visibility authority for every listing", () => {
  const ov = requireOffersVisibility();
  const capability = new Map(fixtures.map((f) => [f.id, singleAllowed(f)]));
  for (const f of fixtures) {
    const wire = { ...f.row.profile_json, identity: { ...f.row.profile_json.identity, leonixVerified: false } };
    const detail = ov.applyServiciosPublicOffersVisibility(resolveServiciosProfile(wire, "es"), capability.get(f.id) === true);
    assert.equal(matched.has(f.slug), ov.serviciosResolvedProfileHasVisibleOffers(detail), f.slug);
  }
});
check("F2: the shared visibility helper strips coupon/flyer/more-offers only, and only without capability", () => {
  const ov = requireOffersVisibility();
  const resolved = resolveServiciosProfile({ ...FIX.coupon.row.profile_json, promo: { id: "promo", headline: "10%" } }, "es");
  assert.equal(ov.applyServiciosPublicOffersVisibility(resolved, true), resolved);
  const hidden = ov.applyServiciosPublicOffersVisibility(resolved, false);
  assert.equal(hidden.coupons.length, 0);
  assert.equal(hidden.couponFlyer, undefined);
  assert.equal(hidden.couponMoreOffers, undefined);
  assert.equal(hidden.promotions.length, resolved.promotions.length);
});
check("F2: the capability lookup is limited to rows that actually carry offer content", () => {
  const ov = requireOffersVisibility();
  const needs = fixtures.filter((f) => ov.serviciosWireHasOfferContent(f.row.profile_json)).map((f) => f.slug).sort();
  assert.deepEqual(
    needs,
    ["coupon-active", "coupon-expired", "coupon-grace", "coupon-legacy-addon", "coupon-no-plan", "coupon-suspended", "flyer-active", "more-active"].sort(),
  );
});
check("F2: Saved Search 'Con ofertas' matches with the same capability truth as the results page", () => {
  const certified = certifyServiciosPublicEligibleListing(FIX.coupon.row);
  assert.ok(certified);
  const saved = { category: "servicios", city: "", minPrice: null, maxPrice: null, filterPayload: { hasOffers: true } };
  const call = matchesServiciosSavedSearch as unknown as (...a: unknown[]) => boolean;
  assert.equal(call(certified, saved, "es", { offersCapabilityByListingId: new Map([[FIX.coupon.id, true]]) }), true);
  assert.equal(call(certified, saved, "es", { offersCapabilityByListingId: new Map([[FIX.coupon.id, false]]) }), false);
  assert.equal(call(certified, saved, "es"), false, "no capability truth → fail closed");
});

// ---------------------------------------------------------------------------------
// Wiring (source) — one authority, read time, no per-row lookups
// ---------------------------------------------------------------------------------

check("WIRING: the detail page renders through the shared visibility helper on coupons_offers", () => {
  const page = src("app/(site)/clasificados/servicios/[slug]/page.tsx");
  assert.match(page, /capability: "coupons_offers",/);
  assert.match(page, /applyServiciosPublicOffersVisibility\(profile, serviciosOffersVisible\)/);
});
check("WIRING: the results page resolves capability at read time and hands it to the filter", () => {
  const page = src("app/(site)/clasificados/servicios/resultados/page.tsx");
  assert.match(page, /resolveServiciosOffersCapabilityByListingId\(allRows\)/);
  assert.match(page, /filterServiciosPublicListingRows\(allRows, lang, filterQuery, \{ offersCapabilityByListingId \}\)/);
  assert.match(page, /filterQuery\.hasOffers === "1"/, "no lookup unless the filter is on");
});
check("WIRING: the server helper batches through the shared resolver (no per-row lookups)", () => {
  const helper = src("app/(site)/clasificados/servicios/lib/serviciosOffersCapabilityServer.ts");
  assert.match(helper, /resolveBusinessToolsAccessForListings\(\{[\s\S]*?capability: "coupons_offers",[\s\S]*?\}\)/);
  assert.match(helper, /serviciosWireHasOfferContent\(/);
  assert.ok(!/resolveBusinessToolsAccess\(/.test(helper), "must not call the single-listing resolver per row");
});
check("WIRING: the single-listing resolver delegates to the batched path (one fetch implementation)", () => {
  const plan = src("app/lib/listingPlans/categoryCommercialPlan.ts");
  assert.match(plan, /export async function resolveCategoryListingPlans\(/);
  assert.match(plan, /export async function resolveBusinessToolsAccessForListings\(/);
  assert.match(plan, /const plans = await resolveCategoryListingPlans\(\{[\s\S]*?listingIds: \[listingId\][\s\S]*?\}\);/);
  assert.match(plan, /decideCategoryListingPlansForListings\(/);
  assert.equal((plan.match(/\.from\(ENTITLEMENTS_TABLE\)/g) ?? []).length, 1, "exactly one entitlement query");
});
check("WIRING: Saved Search activation matching supplies the same capability truth", () => {
  const orch = src("app/lib/saved-search/servicios/serviciosSavedSearchMatchOrchestrator.ts");
  const matcher = src("app/lib/saved-search/servicios/savedSearchServiciosMatcher.ts");
  assert.match(orch, /resolveServiciosOffersCapabilityByListingId\(\[certified\]\)/);
  assert.match(orch, /matchesServiciosSavedSearch\(certified, normalized, "es", \{ offersCapabilityByListingId \}\)/);
  assert.match(matcher, /filterServiciosPublicListingRows\(\[listing\], lang, query, options\)/);
});
check("WIRING: the results filter stays pure (no DB / network / server-only import)", () => {
  const filter = src("app/(site)/clasificados/servicios/lib/serviciosResultsFilter.ts");
  assert.ok(!/server-only|getAdminSupabase|categoryCommercialPlan"|fetch\(/.test(filter));
  assert.match(filter, /serviciosResolvedProfileHasVisibleOffers\(\s*applyServiciosPublicOffersVisibility\(profile, offersCapabilityByListingId\?\.get\(row\.id \?\? ""\) === true\),?\s*\)/);
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-servicios-edit-roundtrip: PASS");
