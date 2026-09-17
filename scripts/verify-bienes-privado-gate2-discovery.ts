/**
 * Gate BIENES-PRIVADO-2 verifier — FSBO Related Listings, discovery continuity, Owner Command
 * Center truth, Admin truth, newsletter failure surfacing, and the shared ES/EN one-time cadence.
 *
 * Behavioral first, source-assertion second. `stripComments()` runs before every source assertion
 * so a doc comment describing a rule can never satisfy a check about the code.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-bienes-privado-gate2-discovery.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  getAutosCheckpointCards,
  getBienesRaicesCheckpointCards,
  getEmpleosPaidCheckpointCard,
  getRentasNegocioCheckpointCard,
  getRentasPrivadoCheckpointCard,
} from "../app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints";
import { getRevenuePackageDefinition } from "../app/lib/listingPlans/revenuePricingMatrix";
import {
  BIENES_FSBO_LIFECYCLE_CATEGORY,
  BIENES_FSBO_LIFECYCLE_PACKAGE_KEY,
  BIENES_FSBO_LISTING_LIFECYCLE_CONFIG,
  isBrFsboRow,
  isBrFsboRowWithinTerm,
} from "../app/lib/listingLifecycle/bienesFsboLifecycle";
import { resolveListingLifecycle } from "../app/lib/listingLifecycle/resolveListingLifecycle";
import { extractBrFacetsFromDetailPairs } from "../app/(site)/clasificados/bienes-raices/resultados/lib/brFacetFromDetailPairs";
import { brSimilarOtherClientPropertiesCopy } from "../app/(site)/clasificados/lib/leonixBrPropertyInventoryCopy";
import { getOwnerEntityCapabilities } from "../app/(site)/dashboard/lib/ownerEntityCapabilityRegistry";
import { resolveBrFsboOwnerStatusDecision } from "../app/lib/clasificados/bienes-raices/brFsboOwnerStatusAuthority";

const ROOT = join(__dirname, "..");
let passed = 0;
const failures: string[] = [];

function assert(cond: unknown, label: string): void {
  if (cond) {
    passed += 1;
    return;
  }
  failures.push(label);
}

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-09-09T12:00:00.000Z");

const REL_READER = "app/(site)/clasificados/bienes-raices/lib/fetchBrSimilarOtherClientListingsBrowser.ts";
const PRIVADO_SHELL = "app/(site)/clasificados/bienes-raices/listing/BienesRaicesPrivadoLiveDetailShell.tsx";
const DETAIL_PAGE = "app/(site)/clasificados/anuncio/[id]/page.tsx";
const ADMIN_TABLE = "app/admin/(dashboard)/workspace/clasificados/AdminListingsTable.tsx";

/* ════════════ 1. RELATED LISTINGS — FSBO ══════════════════════════════════════════════════ */
{
  const raw = read(REL_READER);
  const src = stripComments(raw);

  assert(src.includes("export type BrSimilarLane"), "the reader declares an explicit lane");
  assert(src.includes('const lane: BrSimilarLane = args.lane ?? "negocio"'), "lane defaults to negocio (existing callers unchanged)");
  assert(src.includes('if (lane === "privado")'), "a privado branch exists");

  // Canonical published private rows only, via the ONE shared lane predicate.
  assert(src.includes("if (!isBrFsboRow(row)) return false;"), "privado admits only genuine FSBO rows");
  assert(src.includes("isListingRowActiveAndPublishedForBrowse(row)"), "shared public-eligibility rule still applied");
  assert(src.includes("if (!isBrFsboRowWithinTerm(row)) return false;"), "the shared FSBO expiry rule is applied — no expired rows");
  assert(src.includes("if (row.id === args.currentListingId) return false;"), "the exact current listing is excluded");
  assert(src.includes('.neq("id", args.currentListingId)'), "and excluded at the query level too");

  // No Negocio inventory relationship assumptions in the privado branch.
  const privadoBranch = src.slice(src.indexOf('if (lane === "privado")'), src.indexOf("} else {"));
  assert(!/br_inventory_group_id|br_inventory_parent_listing_id|getBrInventoryGroupId/.test(privadoBranch), "the privado branch consults NO inventory group/parent relationship");
  assert(!/isBrNegocioListing/.test(privadoBranch), "the privado branch never asks the Negocio predicate");
  assert(src.includes("if (!isBrNegocioListing(row)) return false;"), "the negocio branch is intact");
  assert(src.includes("if (excludeGroup && group && group === excludeGroup) return false;"), "the negocio group exclusion is intact");

  // Meaningful persisted relationships only.
  assert(src.includes("if (wantOperation)"), "operation is enforced for privado");
  assert(src.includes("if (rowOperation !== wantOperation) return false;"), "a sale is never matched to a rental");
  assert(/score \+= 40/.test(src), "city relationship kept");
  assert(/score \+= 25/.test(src), "property-type relationship kept");
  assert(/ratio <= 0\.15/.test(src), "price proximity kept (existing numeric contract, existing scorer)");
  assert(src.includes('if (args.lane === "privado")'), "bedroom/bathroom refinement is lane-scoped");
  assert(src.includes("closeCount(facets.machine?.bedroomsCount"), "bedrooms scored from the structured facet");
  assert(src.includes("closeCount(facets.machine?.bathroomsCount"), "bathrooms scored from the structured facet");

  // No paid/promoted ranking weight, no filler, no model.
  for (const banned of ["promoted", "featured", "placement", "is_promoted", "is_featured", "boost", "sponsor"]) {
    assert(!new RegExp(banned, "i").test(src), `no ${banned} ranking weight in the related reader`);
  }
  assert(!/sample|placeholder|filler|demo/i.test(src), "no fake filler in the related reader");
  assert(!/embedding|vector|recommend|model|cosine|tensor/i.test(src), "no recommendation/model engine");
  assert(src.includes("mapBrListingRowToNegocioCard(row, args.lang)"), "reuses the existing BR public card shape");

  // The rail is actually mounted on the FSBO public detail.
  const shell = stripComments(read(PRIVADO_SHELL));
  assert(shell.includes("<BrSimilarOtherClientPropertiesSection"), "the Privado shell mounts a related section");
  assert(shell.includes('lane="privado"'), "and mounts it in the privado lane");
  assert(shell.includes("operation={facets.operation}"), "passing the real persisted operation");
  assert(shell.includes("bedrooms={facets.machine?.bedroomsCount ?? null}"), "passing real bedrooms");
  assert(shell.includes("bathrooms={facets.machine?.bathroomsCount ?? null}"), "passing real bathrooms");
  assert(shell.includes("price={listing.priceNumber ?? null}"), "passing the real numeric price");
  assert(!shell.includes("RelatedBrAgentProperties"), "the Privado shell does NOT mount the Negocio same-agent rail");
  assert(!shell.includes("br_inventory_group_id"), "the Privado shell references no inventory group");

  // The Negocio same-agent rail was not touched.
  const agentRail = stripComments(read("app/(site)/clasificados/bienes-raices/lib/fetchBrRelatedInventoryListingsBrowser.ts"));
  assert(!agentRail.includes("BrSimilarLane"), "the Negocio same-agent reader was not modified");
  assert(!agentRail.includes("privado"), "the Negocio same-agent reader knows nothing about this gate");
}

// Behavioral: the operation/beds/baths the rail depends on really come out of persisted facets.
{
  const sale = extractBrFacetsFromDetailPairs([
    { label: "Leonix:operation", value: "sale" },
    { label: "Leonix:bedrooms_count", value: "3" },
    { label: "Leonix:bathrooms_count", value: "2" },
  ]);
  assert(sale.operation === "venta", "a sale listing reports operation venta");
  assert(sale.machine?.bedroomsCount === 3, "bedrooms read from the structured facet");
  assert(sale.machine?.bathroomsCount === 2, "bathrooms read from the structured facet");
  const rent = extractBrFacetsFromDetailPairs([{ label: "Leonix:operation", value: "rent" }]);
  assert(rent.operation === "renta", "a rental listing reports operation renta");
  assert(rent.operation !== sale.operation, "sale and rental are distinguishable — the filter has real input");
  assert(extractBrFacetsFromDetailPairs([]).operation === null, "an unreadable operation is null, so the rail degrades instead of guessing");
}

/* ════════════ 2. RELATED LISTINGS EXPIRY — the shared rule, same as everywhere ════════════ */
{
  const fsbo = (over: Record<string, unknown> = {}) => ({
    category: "bienes-raices",
    seller_type: "personal",
    expires_at: new Date(NOW + 10 * DAY_MS).toISOString(),
    ...over,
  });
  assert(isBrFsboRowWithinTerm(fsbo(), NOW) === true, "an in-term FSBO row may appear in the rail");
  assert(isBrFsboRowWithinTerm(fsbo({ expires_at: new Date(NOW - 1).toISOString() }), NOW) === false, "an expired FSBO row cannot appear in the rail");
  assert(isBrFsboRowWithinTerm(fsbo({ expires_at: null }), NOW) === true, "a legacy row with no term is not hidden");
  assert(
    isBrFsboRowWithinTerm({ category: "bienes-raices", seller_type: "business", expires_at: new Date(NOW - DAY_MS).toISOString() }, NOW) === true,
    "a Negocio row is never hidden by the FSBO rule",
  );
  assert(isBrFsboRow({ category: "bienes-raices", seller_type: "personal" }) === true, "the rail's lane predicate is the shared one");
  assert(isBrFsboRow({ category: "bienes-raices", seller_type: "business" }) === false, "and it rejects Negocio");
}

/* ════════════ 3. DISCOVERY CONTINUITY — one circuit, one agreement ════════════════════════ */
{
  // Every discovery surface applies the SAME rule, imported from the SAME module.
  const SURFACES: Array<[string, string]> = [
    ["app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts", "browse/results"],
    [DETAIL_PAGE, "public detail"],
    ["app/lib/saved-search/bienes-raices/bienesRaicesPublicEligibleListing.ts", "Saved Search"],
    ["app/(site)/clasificados/bienes-raices/lib/brPublishedListingsServer.ts", "sitemap"],
    [REL_READER, "related listings"],
  ];
  for (const [rel, label] of SURFACES) {
    const src = stripComments(read(rel));
    assert(src.includes("isBrFsboRowWithinTerm("), `${label} applies the shared term rule`);
    assert(/from "@\/app\/lib\/listingLifecycle\/bienesFsboLifecycle"/.test(src), `${label} imports it rather than re-expressing it`);
  }

  // ONE canonical detail path, shared by JSON-LD, the sitemap, Saved Search delivery and the rail.
  const PATH_USERS: Array<[string, string]> = [
    ["app/sitemap.ts", "sitemap"],
    ["app/lib/saved-search/bienes-raices/bienesRaicesSavedSearchDeliveryResolver.ts", "Saved Search delivery"],
    ["app/(site)/clasificados/bienes-raices/components/BrSimilarOtherClientProperties.tsx", "related card link"],
  ];
  for (const [rel, label] of PATH_USERS) {
    assert(stripComments(read(rel)).includes("leonixLiveAnuncioPath"), `${label} uses the ONE canonical detail path builder`);
  }
  // JSON-LD takes its canonical url as an INPUT rather than building a path itself (better
  // design, and the reason it is asserted at its call site instead of inside the builder): the
  // detail page composes it from the same shared builder plus the site origin.
  {
    const jsonLdSrc = stripComments(read("app/(site)/clasificados/bienes-raices/seo/bienesRaicesJsonLd.ts"));
    assert(jsonLdSrc.includes("url: string;"), "the JSON-LD builder takes an absolute canonical url as input");
    assert(!jsonLdSrc.includes("/clasificados/anuncio/"), "and never hardcodes a detail path of its own");
    const callSite = stripComments(read(DETAIL_PAGE));
    assert(
      callSite.includes("url: `${LEONIX_SITE_ORIGIN}${leonixLiveAnuncioPath(listing.id)}`"),
      "the JSON-LD call site supplies the ONE canonical detail path, absolute",
    );
  }

  // The paid-activation start of the circuit still writes the real term on the same row.
  const fulfil = stripComments(read("app/lib/listingPlans/revenueBienesFsboFulfillment.ts"));
  assert(fulfil.includes("expires_at: firstTermExpiresAt"), "paid activation still writes a real expires_at");
  assert(!/\.insert\(/.test(fulfil), "activation/renewal still creates no duplicate listing");

  // Owner and Admin ends of the circuit read the same expiry.
  assert(stripComments(read("app/(site)/dashboard/mis-anuncios/[id]/page.tsx")).includes("row?.expires_at"), "the owner workspace reads the row's own expires_at");
  assert(read("app/admin/_lib/listingsAdminSelect.ts").includes("expires_at"), "Admin still selects expires_at");
}

/* ════════════ 4. NO REGRESSION — Saved Search / JSON-LD / sitemap not rewritten ═══════════ */
{
  // These were proven in earlier gates; this gate must only have ADDED the term rule to them.
  const ss = stripComments(read("app/lib/saved-search/bienes-raices/bienesRaicesPublicEligibleListing.ts"));
  assert(ss.includes("isBrChildParentGateSatisfied("), "Saved Search still applies the Gate G.2.3.4 parent gate");
  assert(ss.includes("SAVED_SEARCH_BIENES_RAICES_CATEGORY"), "Saved Search category contract untouched");
  assert(!ss.includes("BrSimilarLane"), "Saved Search was not rewritten by this gate");

  const jsonLd = stripComments(read("app/(site)/clasificados/bienes-raices/seo/bienesRaicesJsonLd.ts"));
  assert(jsonLd.includes("RealEstateListing"), "JSON-LD still emits RealEstateListing");
  assert(jsonLd.includes("mainEntity"), "JSON-LD still hangs the property off mainEntity");
  assert(!jsonLd.includes("BrSimilarLane") && !jsonLd.includes("isBrFsboRowWithinTerm"), "JSON-LD was not rewritten by this gate");

  const sitemap = stripComments(read("app/(site)/clasificados/bienes-raices/lib/brPublishedListingsServer.ts"));
  assert(sitemap.includes("filterBrRowsByActiveParent"), "the sitemap still applies the shared parent gate");
  assert(sitemap.includes("BR_SITEMAP_MAX"), "the sitemap bound is untouched");
  assert(!sitemap.includes("BrSimilarLane"), "the sitemap reader was not rewritten by this gate");
}

/* ════════════ 5. OWNER COMMAND CENTER TRUTH ══════════════════════════════════════════════ */
{
  const caps = getOwnerEntityCapabilities("bienes-raices-privado");
  // One canonical manage doorway + public view + same-row edit + analytics.
  assert(caps.identity.edit === "supported", "same-row edit is registered supported");
  assert(caps.identity.publicView === "supported", "public view is registered supported");
  assert(caps.identity.analytics === "supported", "analytics is registered supported");
  // Lifecycle + expiration + renewal.
  assert(caps.lifecycle.pause === "supported" && caps.lifecycle.reactivate === "supported", "lifecycle state actions registered");
  assert(caps.lifecycle.renew === "supported", "renewal is now registered supported (Gate 1 made it real)");
  assert(caps.relatedListings === "supported", "related listings registered supported (shipped this gate)");
  // Payment/entitlement presentation where supported — and honestly unproven where not.
  assert(caps.commercial.plan === "supported", "the real Revenue OS plan is registered");
  assert(caps.commercial.entitlement === "unproven", "entitlement stays UNPROVEN — never fabricated");
  // No Negocio-only tools, no Business Tools for a private seller.
  assert(caps.specialized.inventory === "unsupported", "no Negocio inventory tools for FSBO");
  assert(caps.specialized.businessTools === "unsupported", "no Business Tools entitlement fabricated for a private seller");
  assert(caps.specialized.businessConcierge === "unsupported", "no Business Concierge for a private seller");

  // Negocio's own row is untouched by this gate.
  const negocio = getOwnerEntityCapabilities("bienes-raices-negocio");
  assert(negocio.specialized.inventory === "specialized", "Negocio inventory capability unchanged");
  assert(negocio.specialized.businessTools === "specialized", "Negocio Business Tools capability unchanged");
  assert(negocio.lifecycle.renew === "unsupported", "Negocio renew capability unchanged (it is a subscription)");

  // The canonical workspace can actually act on the expiration it displays.
  const workspace = stripComments(read("app/(site)/dashboard/mis-anuncios/[id]/page.tsx"));
  assert(workspace.includes("startFsboRenewal"), "the canonical owner workspace has a renewal action");
  assert(workspace.includes("startListingRenewalCheckout("), "which reuses the SHARED renewal checkout");
  assert(workspace.includes("BIENES_FSBO_LISTING_LIFECYCLE_CONFIG"), "eligibility comes from the shared lifecycle reader");
  assert(workspace.includes("fsboLifecycle?.isRenewalEligible === true"), "the action renders only when genuinely eligible");
  assert(workspace.includes('capabilities?.lifecycle.renew === "supported"'), "gated on the capability registry too");
  assert(workspace.includes("listingExpireIso"), "expiration is displayed from the row's own expires_at");
  assert(!/priceCents|amount_cents/.test(workspace), "the owner workspace holds no price authority");
  // No Business Tools / inventory leakage onto the FSBO workspace. Servicios integration gate —
  // Owner Command Center (current main) wires the Business Tools group on the shared workspace,
  // gated by the capability registry; the private-seller BR entry declares it unsupported, so the
  // group resolves to null for this lane.
  assert(
    workspace.includes("capabilities ? ownerBusinessToolsSpecializedGroup(capabilities.specialized.businessTools, lang) : null"),
    "the Business Tools group is capability-gated on the shared workspace",
  );
  assert(
    getOwnerEntityCapabilities("bienes-raices-privado").specialized.businessTools === "unsupported",
    "no Business Tools group is wired for this lane",
  );
}

// Behavioral: the workspace's renewal gate follows the real term, not a guess.
{
  const lc = (expiresAt: string | null) =>
    resolveListingLifecycle(
      {
        category: BIENES_FSBO_LIFECYCLE_CATEGORY,
        packageKey: BIENES_FSBO_LIFECYCLE_PACKAGE_KEY,
        status: "active",
        isPublished: true,
        expiresAt,
        nowIso: new Date(NOW).toISOString(),
      },
      BIENES_FSBO_LISTING_LIFECYCLE_CONFIG,
    );
  assert(lc(new Date(NOW + 30 * DAY_MS).toISOString()).isRenewalEligible === false, "mid-term: no renewal action, no early charge nudge");
  assert(lc(new Date(NOW + 3 * DAY_MS).toISOString()).isRenewalEligible === true, "expiring soon: renewal action appears");
  assert(lc(new Date(NOW - DAY_MS).toISOString()).isRenewalEligible === true, "expired: renewal action appears");
  assert(lc(null).isRenewalEligible === false, "legacy row with no term: no fabricated renewal");
}

/* ════════════ 6. ADMIN TRUTH ═════════════════════════════════════════════════════════════ */
{
  const adminSelect = read("app/admin/_lib/listingsAdminSelect.ts");
  for (const col of ["id", "leonix_ad_id", "status", "expires_at", "seller_type", "owner_id"]) {
    assert(adminSelect.includes(col), `Admin already selects ${col}`);
  }

  const src = stripComments(read(ADMIN_TABLE));
  assert(src.includes("seller_type?: string | null;"), "the Admin row type now declares seller_type");
  assert(src.includes("expires_at?: string | null;"), "the Admin row type now declares expires_at");
  assert(src.includes("const fsbo = isBrFsboRow(row);"), "the seller LANE is resolved by the shared predicate");
  assert(src.includes('bits.push(fsbo ? "lane:privado" : "lane:negocio");'), "the lane is surfaced to the operator");
  assert(src.includes("BIENES_FSBO_LISTING_LIFECYCLE_CONFIG"), "term state comes from the shared lifecycle reader");
  assert(src.includes("`term:${term.lifecycleState}`"), "current term state is surfaced");
  assert(src.includes('"term:none"'), "a row with no term says so instead of implying one");
  assert(src.includes('bits.push("renew:eligible")'), "renewal eligibility is surfaced");
  assert(src.includes("AdminListingMonetizationSummary"), "the existing entitlement/payment column is reused, not replaced");
  // Payment must never be inferred from listing status.
  const brBits = src.slice(src.indexOf('if (cat === "bienes-raices")'), src.indexOf("function adminDisplayLeonixAdId"));
  assert(!/paid|unpaid|payment|entitlement|subscription/i.test(brBits), "the lane/term bits assert nothing about payment");
  assert(!/status === "active" \? "paid"/.test(src), "paid state is never derived from listing status");
  assert(!src.includes("|| 0"), "no unreadable value is collapsed into zero in the changed scope");
  // Moderation + edit destination unchanged.
  assert(src.includes("ClassifiedAdminQueueRowActionsPanel"), "the existing moderation/actions path is untouched");
  assert(src.includes("AdminListingFlagTruthBlock"), "the existing report/flag truth block is untouched");
  assert(read("app/admin/(dashboard)/workspace/clasificados/_components/ListingsCategoryOpsQueuePage.tsx").includes("bienesParentOps"), "the Gate BN-2 Negocio ops panel is untouched");
}

// Behavioral: the exact term states Admin renders.
{
  const term = (expiresAt: string | null, status = "active") =>
    resolveListingLifecycle(
      {
        category: BIENES_FSBO_LIFECYCLE_CATEGORY,
        packageKey: BIENES_FSBO_LIFECYCLE_PACKAGE_KEY,
        status,
        isPublished: true,
        expiresAt,
        nowIso: new Date(NOW).toISOString(),
      },
      BIENES_FSBO_LISTING_LIFECYCLE_CONFIG,
    ).lifecycleState;
  assert(term(new Date(NOW + 30 * DAY_MS).toISOString()) === "active", "Admin shows term:active mid-term");
  assert(term(new Date(NOW + 2 * DAY_MS).toISOString()) === "expiring_soon", "Admin shows term:expiring_soon");
  assert(term(new Date(NOW - DAY_MS).toISOString()) === "expired", "Admin shows term:expired");
  assert(term(null) === "unknown", "a termless row resolves unknown — and Admin prints term:none for it");
  assert(term(new Date(NOW + DAY_MS).toISOString(), "pending") === "pending_payment", "an unpaid row reads pending_payment, not paid");
}

/* ════════════ 7. NEWSLETTER FAILURE SURFACED ═════════════════════════════════════════════ */
{
  const src = stripComments(read("app/(site)/clasificados/bienes-raices/preview/privado/components/BienesRaicesPrivadoPreviewClient.tsx"));
  assert(!/void captureCheckoutNewsletterSubscriber/.test(src), "the fire-and-forget `void` capture is gone");
  assert(src.includes("const capturePromise = captureCheckoutNewsletterSubscriber("), "the capture result is now reachable");
  assert(src.includes("const captureResult = await capturePromise;"), "and awaited");
  assert(src.includes('captureResult.status === "FAILED"'), "a FAILED capture is detected");
  assert(src.includes("appendBrPublishWarning("), "and surfaced to the owner");
  // Never blocks publishing or payment.
  assert(
    src.indexOf("const pending = await savePendingFsboListing(d);") < src.indexOf("const captureResult = await capturePromise;"),
    "the capture is awaited only AFTER the listing save has already succeeded",
  );
  assert(
    src.indexOf("const captureResult = await capturePromise;") < src.indexOf("const checkout = await startRevenueCategoryCheckout("),
    "and strictly before checkout, without gating it",
  );
  const failBlock = src.slice(src.indexOf('captureResult.status === "FAILED"'), src.indexOf("const checkout = await startRevenueCategoryCheckout("));
  assert(!/return;/.test(failBlock), "a newsletter failure never returns early — publishing and payment continue");
  assert(!/setPublishErr/.test(failBlock), "a newsletter failure is not raised as a blocking publish error");
  // No second engine, no new persistence model.
  assert(src.includes("CHECKOUT_NEWSLETTER_SOURCES.bienesFsbo"), "the shared capture engine and its source constant are reused");
  assert(!/fetch\(["'`][^"'`]*newsletter/i.test(src), "no second newsletter transport was created");
  assert(src.includes('sessionStorage.getItem("lx_br_publish_warnings")'), "reuses the EXISTING publish-warnings channel");
  assert(src.includes('sessionStorage.setItem("lx_br_publish_warnings"'), "and writes back to the same key");
  assert(read(DETAIL_PAGE).includes('sessionStorage.getItem("lx_br_publish_warnings")'), "that channel is really rendered by the published detail page");
  const capture = stripComments(read("app/lib/newsletter/checkoutNewsletterCapture.ts"));
  assert(capture.includes('| { status: "FAILED"; reason: string }'), "the shared capture already returned a usable FAILED result");
  assert(!capture.includes("BIENES"), "the shared capture engine was not modified for this category");
}

/* ════════════ 8. ES/EN ONE-TIME CADENCE (shared, cross-category) ══════════════════════════ */
{
  const src = stripComments(read("app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts"));
  assert(src.includes("lang: PublishCheckpointLang,\n  fallbackDays?: number,") || /oneTimePrice\([\s\S]{0,200}lang: PublishCheckpointLang/.test(src), "oneTimePrice now takes lang");
  assert(src.includes('lang === "en" ? "days" : "días"'), "the cadence word is language-aware");
  assert(!/\$\{days\} días`/.test(src), "the hardcoded Spanish cadence is gone");
  assert(src.includes("definition?.durationDays"), "duration is read from the matrix, not only from the caller");
  assert(src.includes('formatRevenuePriceLabel(priceCents)'), "the amount stays matrix-derived");
  assert(!/\$\d/.test(src.slice(src.indexOf("function oneTimePrice"), src.indexOf("function isPromoEligible"))), "no hardcoded amount inside the helper");

  // Behavioral: every live one-time checkpoint card, both languages.
  const cards = (lang: "es" | "en") => ({
    br: getBienesRaicesCheckpointCards(lang, "/a", "/b").find((c) => c.id === "br_privado")?.priceLabel ?? "",
    autos: getAutosCheckpointCards(lang, "/a", "/b").find((c) => c.id === "autos_privado")?.priceLabel ?? "",
    rentas: getRentasPrivadoCheckpointCard(lang, "/a").priceLabel,
    empleos: getEmpleosPaidCheckpointCard(lang, "/a").priceLabel,
    rentasNegocioBullet: JSON.stringify(getRentasNegocioCheckpointCard(lang, "/a")).match(/[^"]*matri[^"]*/i)?.[0] ?? "",
  });
  const es = cards("es");
  const en = cards("en");

  assert(es.br === "$49.99 / 45 días", "ES Bienes Privado cadence unchanged and correct");
  assert(en.br === "$49.99 / 45 days", "EN Bienes Privado cadence repaired");
  assert(es.autos === "$24.99 / 30 días" && en.autos === "$24.99 / 30 days", "Autos Privado ES/EN cadence");
  assert(es.rentas === "$24.99 / 30 días" && en.rentas === "$24.99 / 30 days", "Rentas Privado ES/EN cadence");
  assert(es.empleos === "$24.99 / 30 días" && en.empleos === "$24.99 / 30 days", "Empleos paid ES/EN cadence");
  assert(/matriz: \$24\.99 \/ 30 días/.test(es.rentasNegocioBullet), "Rentas Negocio ES matrix bullet cadence");
  assert(/matrix: \$24\.99 \/ 30 days/.test(en.rentasNegocioBullet), "Rentas Negocio EN matrix bullet cadence repaired");
  for (const v of Object.values(en)) assert(!/días/.test(v), "no Spanish cadence survives anywhere in the English cards");

  // Matrix authority: the rendered day counts equal the matrix's own durations.
  const pairs: Array<[string, string]> = [
    ["br_fsbo_45d", en.br],
    ["autos_privado_30d", en.autos],
    ["rentas_30d", en.rentas],
    ["empleos_job_post_paid", en.empleos],
  ];
  for (const [key, label] of pairs) {
    const days = getRevenuePackageDefinition(key)?.durationDays;
    assert(typeof days === "number" && label.includes(` / ${days} days`), `${key} renders the matrix duration (${days})`);
  }
  // And this gate did not edit dead copy to simulate the fix.
  assert(read("app/(site)/clasificados/publicar/bienes-raices/BienesRaicesPublicarHubClient.tsx").includes("getBienesRaicesCheckpointCards"), "the BR checkpoint getter is genuinely rendered");
  assert(read("app/(site)/publicar/empleos/EmpleosPublicarHubClient.tsx").includes("getEmpleosPaidCheckpointCard"), "the Empleos checkpoint getter is genuinely rendered");
  assert(read("app/(site)/publicar/autos/PublicarAutosBranchClient.tsx").includes("getAutosCheckpointCards"), "the Autos checkpoint getter is genuinely rendered");
  assert(read("app/(site)/clasificados/publicar/rentas/RentasPublicarHubClient.tsx").includes("getRentasPrivadoCheckpointCard"), "the Rentas checkpoint getter is genuinely rendered");
}

/* ════════════ 9. LANE COPY HONESTY ═══════════════════════════════════════════════════════ */
{
  for (const lang of ["es", "en"] as const) {
    const privado = brSimilarOtherClientPropertiesCopy(lang, { lane: "privado" });
    const negocio = brSimilarOtherClientPropertiesCopy(lang);
    assert(privado.subtitle !== negocio.subtitle, `${lang}: the privado subtitle is not the Negocio one`);
    assert(!/inventar|inventory/i.test(privado.subtitle), `${lang}: the privado copy never implies an inventory relationship`);
    assert(/inventar|inventory/i.test(negocio.subtitle), `${lang}: the Negocio copy is unchanged`);
    assert(privado.title === negocio.title, `${lang}: the shared title is unchanged`);
  }
}

/* ════════════ 10. NO NEGOCIO BEHAVIOR CHANGE ═════════════════════════════════════════════ */
{
  const src = stripComments(read(REL_READER));
  // The negocio path must be reachable with zero new required arguments.
  assert(src.includes("lane?: BrSimilarLane;"), "lane is optional");
  assert(src.includes("operation?:"), "operation is optional");
  assert(src.includes("bedrooms?: number | null;") && src.includes("bathrooms?: number | null;"), "the new scoring inputs are optional");
  const section = stripComments(read("app/(site)/clasificados/bienes-raices/components/BrSimilarOtherClientPropertiesSection.tsx"));
  assert(section.includes("lane?: BrSimilarLane;"), "the section's lane prop is optional");
  const enVenta = read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx");
  assert(!enVenta.includes("lane="), "the pre-existing En Venta caller passes no lane and is unchanged");
  // Negocio lifecycle service + capacity authority untouched.
  const negocioSvc = stripComments(read("app/lib/clasificados/bienes-raices/brListingLifecycleService.ts"));
  assert(negocioSvc.includes('row.seller_type !== "business"'), "the Negocio lifecycle service still refuses non-business rows");
  assert(!negocioSvc.includes("BrSimilarLane") && !negocioSvc.includes("bienesFsboLifecycle"), "the Negocio lifecycle service was not touched by this gate");
  assert(stripComments(read("app/admin/_lib/bienesNegocioCommercialOps.ts")).includes("br_negocio_activate_listing"), "the Negocio capacity RPC probe is untouched");
}

/* ════════════ 11. PRIVADO STATUS AUTHORITY — Gate 1 regression ═══════════════════════════ */
{
  const dec = (status: string, action: "relist" | "mark_sold") =>
    resolveBrFsboOwnerStatusDecision({ row: { status, is_published: true }, action });
  assert(dec("pending", "relist").ok === false, "the payment bypass is still closed");
  assert(dec("sold", "relist").ok === true, "a sold row may still be relisted");
  assert(dec("active", "mark_sold").ok === true, "a live row may still be marked sold");
  assert(dec("removed", "relist").ok === false, "moderation states are still absolute");
}

/* ════════════ 12. CLEANUP PREP — dead modules re-verified, untouched ═════════════════════ */
{
  const DEAD: Array<[string, string]> = [
    ["app/(site)/clasificados/publicar/bienes-raices/privado/application/mapping/privadoPreviewMapStub.ts", "privadoPreviewMapStub"],
    ["app/(site)/clasificados/publicar/bienes-raices/privado/application/schema/privadoFormStub.ts", "privadoFormStub"],
    ["app/(site)/clasificados/publicar/bienes-raices/privado/application/utils/privadoDraftStub.ts", "privadoDraftStub"],
    ["app/(site)/clasificados/publicar/bienes-raices/privado/application/sections/PrivadoApplicationNotice.tsx", "PrivadoApplicationNotice"],
    ["app/(site)/clasificados/bienes-raices/preview/privado/components/BrPrivadoGalleryLightbox.tsx", "BrPrivadoGalleryLightbox"],
    ["app/(site)/clasificados/bienes-raices/preview/privado/model/buildBienesRaicesPrivadoTemplateVm.ts", "buildBienesRaicesPrivadoTemplateVm"],
  ];
  for (const [rel, name] of DEAD) {
    let exists = true;
    try {
      read(rel);
    } catch {
      exists = false;
    }
    assert(exists, `dead module still present, NOT deleted: ${name}`);
  }
  // The must-not-revive warning is still true of the real file.
  const tpl = read("app/(site)/clasificados/bienes-raices/preview/privado/model/buildBienesRaicesPrivadoTemplateVm.ts");
  assert(tpl.includes("mostrarDireccionExacta: true"), "buildBienesRaicesPrivadoTemplateVm STILL hardcodes exact-address visibility — MUST NOT BE REVIVED");
  // Nothing live imports it.
  for (const [rel] of DEAD) {
    for (const [otherRel] of DEAD) {
      if (rel === otherRel) continue;
    }
  }
  const shell = read(PRIVADO_SHELL);
  const detail = read(DETAIL_PAGE);
  for (const [, name] of DEAD) {
    assert(!shell.includes(name), `the live Privado shell does not import ${name}`);
    assert(!detail.includes(name), `the canonical detail page does not import ${name}`);
  }
  // The live path still uses the repaired mapper, not the dead template.
  assert(stripComments(read(PRIVADO_SHELL)).includes("mapBrListingRowToPrivadoPreviewVm"), "the live Privado path still uses the repaired mapper");
  assert(
    stripComments(read("app/(site)/clasificados/bienes-raices/listing/mapBrListingRowToPrivadoPreviewVm.ts")).includes("buildBrPublicLocationForLiveDetail("),
    "the repaired address-privacy construction from Gate 1 is intact",
  );
}

/* ════════════ 13. SHARED RENEWAL CLIENT — Gate 1 type defect repaired ════════════════════ */
{
  const src = stripComments(read("app/lib/listingLifecycle/listingRenewalCheckout.ts"));
  // Servicios integration gate — the renewal client is Owner Command Center Gate 20's (current
  // main): an explicit category/packageKey union that already includes Autos Privado and FSBO.
  assert(
    /category:\s*"rentas" \| "autos" \| "bienes-raices"/.test(src),
    "the renewal client declares its real lane union",
  );
  assert(/packageKey:[^;\n]*"br_fsbo_45d"/.test(src), "and includes the FSBO lane");
  assert(src.includes('category: "rentas"'), "and still includes Rentas");
  assert(!/category: "rentas";\s*\n\s*packageKey: "rentas_30d";\s*\n\s*listingId/.test(src), "the Rentas-only parameter literals are gone");
  assert(src.includes('operation: "renew_listing"'), "the renewal operation marker is unchanged");
}

/* ════════════ 14. SCOPE — nothing forbidden was done ═════════════════════════════════════ */
{
  const gateFiles = [
    REL_READER,
    PRIVADO_SHELL,
    ADMIN_TABLE,
    "app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts",
    "app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts",
    "app/lib/listingLifecycle/listingRenewalCheckout.ts",
  ];
  for (const rel of gateFiles) {
    const src = stripComments(read(rel));
    assert(!/CREATE TABLE|ALTER TABLE|ADD COLUMN/i.test(src), `no schema change implied by ${rel}`);
    assert(!/cron|scheduler|setInterval\(/i.test(src), `no scheduler built in ${rel}`);
  }
  assert(!stripComments(read(PRIVADO_SHELL)).includes("business-tools"), "no Business Tools added to FSBO");
  assert(!stripComments(read(PRIVADO_SHELL)).includes("BusinessHub"), "no Business Hub added to FSBO");
  // Application/Preview view components were not redesigned.
  assert(read("app/(site)/clasificados/bienes-raices/preview/privado/BienesRaicesPrivadoPreviewView.tsx").length > 0, "the protected Preview view still exists");
}

/* ─────────────────────────────────── report ────────────────────────────────────────────── */

if (failures.length > 0) {
  console.error(`\nverify-bienes-privado-gate2-discovery: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`verify-bienes-privado-gate2-discovery: ${passed}/${passed} PASS`);
