/**
 * AUTOS DEALER — Quick / Full SHARED PRESENTATION (owner lock 2026-09-24).
 *
 * Quick renders through the SAME canonical dealer/vehicle presentation components as Full/public; the
 * difference is entitlement data only:
 *  - the dealer preview and the public vehicle page both render AutosNegociosDealershipPreviewPage (no
 *    Quick-specific public component / CSS / hardcoded width);
 *  - the results-card translate wrapper keeps production grid stretch (RESTORED);
 *  - `plan=quick` survives application -> preview -> "Volver a editar" (executed with carryBusinessPlanParam) and is
 *    never rewritten to plan=full;
 *  - the Quick photo cap (Autos Dealer = 4) comes from the ONE table; no literal 3 is left in the dealer media path;
 *  - Full-only fields (socials incl. its `website` key, Google/Yelp/Google Business, extra links, booking link,
 *    financing application link, video) are hidden in the application for Quick and stripped SERVER-side
 *    (POST, PATCH, staff assisted publish), RESTORING stored values, and only for a PROVEN Quick product;
 *  - Quick = ONE active vehicle, no pack: enforced at the commercial write guard and at fulfillment;
 *  - Full limits/fields/media are unchanged.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-quick-shared-presentation-autos-dealer-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { quickImageMaxForBusinessCategory } from "../app/lib/quickBusiness/quickBusinessMediaSemantics";
import { carryBusinessPlanParam, businessPlanFromParam } from "../app/lib/listingPlans/businessQuickPlanSignal";
import { quickFullOnlyBoundaryApplies } from "../app/lib/quickBusiness/quickFullOnlyBoundary";
import {
  AUTOS_DEALER_QUICK_FULL_ONLY_PATHS,
  applyAutosDealerQuickBoundary,
  stripQuickDealerFullOnlyFields,
} from "../app/lib/clasificados/autos/stripQuickDealerFullOnlyFields";
import {
  QUICK_DEALER_ACTIVE_VEHICLE_LIMIT,
  STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT,
  BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT,
  resolveDealerActiveVehicleLimit,
} from "../app/lib/clasificados/autos/autosDealerInventoryPolicy";
import { resolveQuickBusinessProduct } from "../app/lib/listingPlans/quickBusinessProductIdentity";

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

const PREVIEW = "app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx";
const LIVE = "app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx";
const APP = "app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx";
const MEDIA = "app/(site)/publicar/autos/negocios/components/AutosNegociosMediaManager.tsx";
const FINANCE = "app/(site)/publicar/autos/shared/components/AutosDealerFinanceFields.tsx";
const POST = "app/api/clasificados/autos/listings/route.ts";
const PATCH = "app/api/clasificados/autos/listings/[id]/route.ts";
const ASSISTED = "app/api/clasificados/autos/assisted-publish/route.ts";
const GUARD = "app/lib/listingPlans/commercialWriteGuard.ts";
const FULFILL = "app/lib/listingPlans/revenueAutosDealerFulfillment.ts";
const TRANSLATED = "app/(site)/clasificados/autos/components/public/AutosPublicTranslatedCard.tsx";
const SHELL = "app/(site)/clasificados/autos/components/public/AutosPublicResultsShell.tsx";

// ---------------------------------------------------------------------------------------------
// 1. Shared presentation
// ---------------------------------------------------------------------------------------------
check("presentation: dealer preview and public vehicle page render the SAME AutosNegociosDealershipPreviewPage", () => {
  const preview = raw(PREVIEW);
  const live = raw(LIVE);
  assert.ok(preview.includes("AutosNegociosDealershipPreviewPage"), "preview renders the dealership page");
  assert.ok(live.includes("AutosNegociosDealershipPreviewPage"), "public vehicle page renders the dealership page");
  assert.ok(
    !/QuickAutos\w*Preview|AutosQuick\w*(Page|Preview|Gallery|Card)|QuickDealer\w*(Page|Preview|Gallery|Card)/.test(
      preview + live + raw(APP),
    ),
    "no Quick-specific dealer presentation component",
  );
});

check("presentation: preview and public use the shared page width token (no hardcoded Quick width)", () => {
  const preview = raw(PREVIEW);
  assert.ok(preview.includes("autosPreviewPageMaxWidthClass"), "preview uses the shared max-width token");
  const quickBranch = preview.split("\n").filter((l) => /quickPlan|isQuick/.test(l)).join("\n");
  assert.ok(!/max-w-\[|w-\[\d/.test(quickBranch), "no width literal on a Quick-conditioned line");
});

check("presentation: preview results card shows the Quick 1-vehicle limit, never the Full 10 hint", () => {
  const preview = raw(PREVIEW);
  assert.ok(/inventoryVehicleLimit=\{quickPlan \? QUICK_DEALER_ACTIVE_VEHICLE_LIMIT : undefined\}/.test(preview));
  assert.ok(/additionalCount=\{quickPlan \? 0 : additionalCount\}/.test(preview));
  const app = raw(APP);
  assert.ok(/resolveDealerActiveVehicleLimit\(inventoryPackActive, \{ quick: isQuickBusinessPlan \}\)/.test(app));
});

check("regression restored: the results translate wrapper keeps production grid stretch (no wrapper without a teaser)", () => {
  const t = raw(TRANSLATED);
  assert.ok(
    /if \(!financeTeaser\) \{\s*return <AutosPublicStandardCard listing=\{displayListing\} copy=\{copy\} lang=\{lang\} \/>;\s*\}/.test(t),
    "a card with nothing to translate renders as the direct grid item, exactly like production",
  );
  assert.ok(/flex h-full min-w-0 flex-col/.test(t), "translated cards fill the grid row height");
  assert.ok(/flex-1/.test(t) && /\[&>a\]:flex-1/.test(t), "the card slot grows to the row height");
  assert.ok(!/<div className="min-w-0">/.test(t), "the old height-less min-w-0 wrapper is gone");
  // The translate control itself stays.
  assert.ok(t.includes("TranslateAdControl") && raw(SHELL).includes("AutosPublicTranslatedCard"));
});

// ---------------------------------------------------------------------------------------------
// 2. Plan carried across the edit round trip
// ---------------------------------------------------------------------------------------------
check("plan: carryBusinessPlanParam writes plan=quick only (executed), never plan=full", () => {
  const hrefs = [
    "/clasificados/autos/negocios/preview?lang=es",
    "/publicar/autos/negocios?lang=es&resume=1",
    "/publicar/autos/negocios?edit=1&source=dashboard&mode=listing-edit&listingId=abc&returnPanel=autos&lang=en",
  ];
  for (const h of hrefs) {
    const q = carryBusinessPlanParam(h, "quick");
    assert.equal(businessPlanFromParam(new URL(q, "https://x.test").searchParams.get("plan")), "quick", q);
    assert.ok(q.includes("listingId=abc") || !h.includes("listingId"), "other params preserved");
    assert.equal(carryBusinessPlanParam(h, "full"), h, "Full is never written into a link");
    assert.ok(!/plan=full/.test(q));
  }
});

check("plan: application -> preview and preview -> 'Volver a editar' both carry the plan", () => {
  const app = raw(APP);
  assert.ok(app.includes('useIsQuickBusinessPlan("autos")'), 'dealer uses the "autos" QuickSalesCategory key');
  assert.ok(/const previewHref = carryBusinessPlanParam\(previewHrefBase, businessPlan\)/.test(app));
  const preview = raw(PREVIEW);
  assert.ok(/const editBackHref = carryBusinessPlanParam\(/.test(preview), "preview back-to-edit carries the plan");
  assert.ok(preview.includes("staffQuickPlan.isQuick") && preview.includes("quickPlan ||"));
  assert.ok(!/plan=full|"full"\s*\)\s*;?\s*$/.test(preview.split("editBackHref = carryBusinessPlanParam")[1]?.slice(0, 200) ?? "x"));
  assert.ok((preview.match(/basePackageKey: baseCheckout\.packageKey/g) ?? []).length >= 3, "POST + 2 PATCH declare the base package");
});

// ---------------------------------------------------------------------------------------------
// 3. Photo cap from the ONE table
// ---------------------------------------------------------------------------------------------
check("cap: Autos Dealer Quick cap = 4 from the table; dealer media path has no literal 3", () => {
  assert.equal(quickImageMaxForBusinessCategory("autos-dealer"), 4);
  const media = raw(MEDIA);
  assert.ok(media.includes('quickImageMaxForBusinessCategory("autos-dealer")'));
  assert.ok(media.includes('useIsQuickBusinessPlan("autos")'), "staff custody plan is honored, not only the URL");
  assert.ok(!/\b3 images|hasta 3|up to 3 images|imageLimit = isQuickBusinessPlan \? 3/.test(media), "no literal 3 photo cap");
  assert.ok(/imageLimit = isQuickBusinessPlan \? quickImageCap : null/.test(media), "Full stays uncapped (null)");
  assert.ok(/applyBusinessPlanLimits && quickPlan\.isQuick/.test(media), "Privado (applyBusinessPlanLimits=false) is untouched");
  assert.ok(/applyBusinessPlanLimits = true/.test(media), "default stays dealer");
  const privado = raw("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  assert.ok(/applyBusinessPlanLimits=\{false\}/.test(privado));
  assert.ok(media.includes("data-quick-video-locked"), "video stays locked for Quick");
});

// ---------------------------------------------------------------------------------------------
// 4. Application hides Full-only fields for Quick
// ---------------------------------------------------------------------------------------------
check("application: Full-only sections are hidden (not just disabled) for Quick; the primary website + contacts stay", () => {
  const app = raw(APP);
  const between = (a: string, b: string) => app.slice(app.indexOf(a), app.indexOf(b, app.indexOf(a)));
  // booking link
  const booking = between("{isQuickBusinessPlan ? null : (", "<AutosDealerStructuredAddressFields");
  assert.ok(booking.includes("dealerBookingUrl"));
  // socials + google/yelp/business + custom links are all inside the non-Quick branch
  const nonQuick = app.slice(app.indexOf("<>\n            <p className=\"mt-6 text-xs font-bold uppercase tracking-[0.12em]"), app.indexOf("customLinksMaxReached}"));
  for (const k of ["dealerSocials", "googleReviewsUrl", "yelpReviewsUrl", "googleBusinessUrl", "dealerCustomLinks"]) {
    assert.ok(nonQuick.includes(k), `${k} lives inside the Full-only branch`);
  }
  // the locked note is bilingual and never mentions 'plan=full'
  assert.ok(app.includes("Disponible con Full") && app.includes("Available with Full"));
  assert.ok(app.includes('data-quick-full-only-locked="1"'));
  // primary website + contact channels are outside the branch (always shown)
  const website = app.indexOf("t.app.labels.website");
  const branchStart = app.indexOf("{isQuickBusinessPlan ? null : (");
  assert.ok(website > 0 && website < branchStart, "the primary website input renders before (outside) the Full-only gates");
  for (const k of ["dealerPhoneOffice", "dealerPhoneMobile", "dealerWhatsapp", "dealerSmsPhone", "dealerEmail"]) {
    assert.ok(app.includes(k), `${k} contact channel stays`);
  }
  // finance application link hidden, contact channels remain
  assert.ok(app.includes("hideApplicationUrl={isQuickBusinessPlan}"));
  const finance = raw(FINANCE);
  assert.ok(/hideApplicationUrl \? null : \(/.test(finance) && finance.includes("financeContactPhone"));
  // inventory: no drawer / bundle / pack / package review price for Quick
  assert.ok(app.includes('data-quick-inventory-locked="1"'));
  assert.ok(/!inventoryAddMode && !isQuickBusinessPlan \?/.test(app), "the Full pricing summary is not shown to Quick");
});

// ---------------------------------------------------------------------------------------------
// 5. Server boundary (executed)
// ---------------------------------------------------------------------------------------------
const fullListing = () => ({
  dealerWebsite: "https://primary.example.com",
  dealerPhoneOffice: "(555) 111-2222",
  dealerSocials: { instagram: "https://ig/x", website: "https://second.example.com" },
  googleReviewsUrl: "https://g/reviews",
  yelpReviewsUrl: "https://yelp/x",
  googleBusinessUrl: "https://g/biz",
  dealerCustomLinks: [{ id: "1", label: "A", url: "https://a" }],
  dealerBookingUrl: "https://book",
  financeApplicationUrl: "https://fin",
  financeContactPhone: "(555) 333-4444",
  videoUrls: ["https://youtu.be/a"],
  videoUrl: "https://youtu.be/a",
  videoSourceType: "url",
  additionalInventoryVehicles: [{ id: "v2" }],
  mediaImages: [{ id: "i1", url: "https://img/1", sourceType: "url", isPrimary: true, sortOrder: 0 }],
});

const quickDecision = resolveQuickBusinessProduct({ category: "autos", assistedPackageKey: "autos_dealer_quick_monthly" });
const fullDecision = resolveQuickBusinessProduct({ category: "autos", assistedPackageKey: "autos_dealer_monthly" });
const unverifiedDecision = resolveQuickBusinessProduct({ category: "autos" });
const declaredQuick = resolveQuickBusinessProduct({ category: "autos", declaredPackageKey: "autos_dealer_quick_monthly" });

check("strip: covers every Full-only dealer field name that exists on AutoDealerListing", () => {
  const type = raw("app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts");
  for (const p of AUTOS_DEALER_QUICK_FULL_ONLY_PATHS) {
    assert.ok(new RegExp(`\\b${p}\\??:`).test(type), `${p} is a real listing field`);
  }
  for (const k of [
    "dealerSocials", "googleReviewsUrl", "yelpReviewsUrl", "googleBusinessUrl", "dealerCustomLinks",
    "dealerBookingUrl", "financeApplicationUrl", "videoUrls", "additionalInventoryVehicles",
  ]) {
    assert.ok((AUTOS_DEALER_QUICK_FULL_ONLY_PATHS as readonly string[]).includes(k), `${k} is Full-only`);
  }
  for (const k of ["dealerWebsite", "dealerPhoneOffice", "dealerPhoneMobile", "dealerWhatsapp", "dealerSmsPhone", "dealerEmail", "mediaImages"]) {
    assert.ok(!(AUTOS_DEALER_QUICK_FULL_ONLY_PATHS as readonly string[]).includes(k), `${k} must stay for Quick`);
  }
});

check("strip: proven Quick empties every Full-only path on a NEW row, keeps the primary website + contacts + photos", () => {
  for (const decision of [quickDecision, declaredQuick]) {
    assert.equal(quickFullOnlyBoundaryApplies(decision), true);
    const out = stripQuickDealerFullOnlyFields({ listing: fullListing(), existing: null, decision });
    const l = out.listing as ReturnType<typeof fullListing>;
    assert.deepEqual(l.dealerSocials, {}, "socials (incl. its website key) emptied");
    assert.equal(l.googleReviewsUrl, "");
    assert.equal(l.yelpReviewsUrl, "");
    assert.equal(l.googleBusinessUrl, "");
    assert.deepEqual(l.dealerCustomLinks, []);
    assert.equal(l.dealerBookingUrl, "");
    assert.equal(l.financeApplicationUrl, "");
    assert.deepEqual(l.videoUrls, []);
    assert.equal(l.videoUrl, "", "single video url emptied");
    assert.equal(l.videoSourceType, null, "no orphan video source flag");
    assert.deepEqual(l.additionalInventoryVehicles, []);
    assert.equal(l.dealerWebsite, "https://primary.example.com");
    assert.equal(l.dealerPhoneOffice, "(555) 111-2222");
    assert.equal(l.financeContactPhone, "(555) 333-4444", "finance CONTACT channels stay");
    assert.equal(l.mediaImages.length, 1);
    assert.ok(out.changedPaths.length >= 9);
  }
});

check("strip: stored Full values are RESTORED for Quick (never deleted, never overwritten by the browser)", () => {
  const stored = fullListing();
  const incoming = { ...fullListing(), googleReviewsUrl: "https://attacker/new", dealerSocials: { instagram: "https://ig/new" }, videoUrls: ["https://youtu.be/new"] };
  const out = stripQuickDealerFullOnlyFields({ listing: incoming, existing: stored, decision: quickDecision });
  const l = out.listing as ReturnType<typeof fullListing>;
  assert.equal(l.googleReviewsUrl, stored.googleReviewsUrl);
  assert.deepEqual(l.dealerSocials, stored.dealerSocials);
  assert.deepEqual(l.videoUrls, stored.videoUrls);
  assert.deepEqual(l.additionalInventoryVehicles, stored.additionalInventoryVehicles);
  assert.equal(l.videoSourceType, "url", "a restored video keeps a consistent source flag");
  // input untouched
  assert.equal(incoming.googleReviewsUrl, "https://attacker/new");
});

check("strip: Full and UNVERIFIED are never stripped (a first pre-payment save may be a Full customer)", () => {
  for (const decision of [fullDecision, unverifiedDecision]) {
    assert.equal(quickFullOnlyBoundaryApplies(decision), false);
    const input = fullListing();
    const out = stripQuickDealerFullOnlyFields({ listing: input, existing: null, decision });
    assert.equal(out.listing, input, "same object, untouched");
    assert.deepEqual(out.changedPaths, []);
  }
  // Privado / categories with no Quick product are never gated either.
  const privado = resolveQuickBusinessProduct({ category: "autos-privado", declaredPackageKey: "autos_dealer_quick_monthly" });
  assert.equal(quickFullOnlyBoundaryApplies(privado), false);
  assert.equal(stripQuickDealerFullOnlyFields({ listing: fullListing(), decision: null }).changedPaths.length, 0);
});

check("strip: the unconditional client variant matches the gated one for a Quick session", () => {
  const a = applyAutosDealerQuickBoundary({ listing: fullListing(), existing: null });
  const b = stripQuickDealerFullOnlyFields({ listing: fullListing(), existing: null, decision: quickDecision });
  assert.deepEqual(a.listing, b.listing);
});

check("seams: POST, PATCH and staff assisted publish all call the strip with the proven-product decision", () => {
  const post = raw(POST);
  assert.ok(post.includes("stripQuickDealerFullOnlyFields({") && /decision: identity/.test(post));
  assert.ok(/body\.listing = quickFieldBoundary\.listing/.test(post));
  assert.ok(!/enforceQuickContract[^\n]*stripQuick|stripQuick[^\n]*enforceQuickContract/.test(post), "gated by the proven product, not enforceQuickContract");
  const patch = raw(PATCH);
  assert.ok(patch.includes("stripQuickDealerFullOnlyFields({") && /existing: storedRow\.listing_payload/.test(patch));
  assert.ok(/storedRow\.lane === "negocios"/.test(patch), "dealer rows only");
  assert.ok(/listing: listingToWrite/.test(patch), "the stripped payload is what is written");
  assert.ok(/basePackageKey\?: string/.test(patch) && /declaredPackageKey/.test(patch));
  const assisted = raw(ASSISTED);
  assert.ok(assisted.includes("quickFullOnlyBoundaryApplies(assistedProduct)"));
  assert.equal((assisted.match(/stripQuickDealerFullOnlyFields\(\{/g) ?? []).length, 2, "dealer AND vehicle listing");
  assert.ok(/listing: dealerListingToWrite/.test(assisted) && /const vehicleListing = vehicleListingToWrite/.test(assisted));
  assert.ok(/existing: storedMain\?\.listing_payload/.test(assisted) && /existing: storedChild\?\.listing_payload/.test(assisted));
  // enforced on SAVE as well as publish: the product resolve is no longer inside `if (isAssistedPublish)`.
  const before = assisted.slice(0, assisted.indexOf("if (isAssistedPublish) {\n    // Gate QB-MEDIA-03"));
  assert.ok(before.includes("resolveQuickBusinessPublishIdentity({"), "product resolved before the publish-only block");
  // external videos are now counted at the assisted seam
  assert.ok(/externalVideoCount/.test(assisted) && /externalVideoCount \}/.test(assisted));
});

// ---------------------------------------------------------------------------------------------
// 6. One vehicle, no pack (Quick); Full limits unchanged
// ---------------------------------------------------------------------------------------------
check("limits: Quick = 1 vehicle (pack can never lift it); Full stays 10 / 20", () => {
  assert.equal(QUICK_DEALER_ACTIVE_VEHICLE_LIMIT, 1);
  assert.equal(resolveDealerActiveVehicleLimit(false, { quick: true }), 1);
  assert.equal(resolveDealerActiveVehicleLimit(true, { quick: true }), 1, "a stray pack entitlement does not lift Quick");
  assert.equal(resolveDealerActiveVehicleLimit(false), STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT);
  assert.equal(STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT, 10);
  assert.equal(resolveDealerActiveVehicleLimit(true), BOOSTED_DEALER_ACTIVE_VEHICLE_LIMIT);
  assert.equal(resolveDealerActiveVehicleLimit(false, { quick: false }), 10);
});

check("limits: the write guard and fulfillment enforce Quick = 1 for a PROVEN product only", () => {
  const guard = raw(GUARD);
  assert.ok(/const quickDealer = quickFullOnlyBoundaryApplies\(/.test(guard));
  assert.ok(/quickDealer\s*\n?\s*\? QUICK_DEALER_ACTIVE_VEHICLE_LIMIT/.test(guard));
  assert.ok(/: boostActive\s*\n?\s*\? AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT\s*\n?\s*: AUTOS_DEALER_BASE_INCLUDED_VEHICLES/.test(guard), "Full 10/20 branch unchanged");
  const fulfill = raw(FULFILL);
  assert.ok(/productForBasePackageKey\("autos", packageKey\) === "quick"/.test(fulfill), "the PAID base package names the product");
  assert.ok(/quickDealerPaid \? \[\] :/.test(fulfill), "no staged child is published for a paid Quick package");
  assert.ok(fulfill.includes("publishNegociosBundleAdditionalVehicles"), "Full child publishing is intact");
});

check("Full is unchanged: Full application fields, video and unlimited photos are not gated on the Full path", () => {
  const app = raw(APP);
  // Full renders the original branch verbatim (the same input handlers).
  for (const k of ["dealerBookingUrl", "dealerSocials", "googleReviewsUrl", "yelpReviewsUrl", "googleBusinessUrl", "dealerCustomLinks", "customLinksAtMax"]) {
    assert.ok(app.includes(k), `${k} still rendered for Full`);
  }
  assert.ok(app.includes("AutosNegociosInventoryBundlePreview") && app.includes("AutosNegociosInventoryValueModule") && app.includes("AutosNegociosPackageReviewSummary"));
  const media = raw(MEDIA);
  assert.ok(media.includes("AutosExternalVideoUrlsField"), "Full keeps its video field");
  assert.equal(carryBusinessPlanParam("/x?a=1", "full"), "/x?a=1");
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-quick-shared-presentation-autos-dealer-01: all checks passed");
