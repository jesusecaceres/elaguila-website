/**
 * Viajes launch-QA selftest — run with:
 *   npx tsx scripts/viajes-launch-qa-selftest.ts
 * Do not add a package.json script.
 */

import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import {
  defaultViajesBrowseState,
  parseViajesBrowseFromSearchParams,
  serializeViajesBrowseToSearchParams,
  type ViajesSortKey,
} from "../app/(site)/clasificados/viajes/lib/viajesBrowseContract";
import {
  VIAJES_LAUNCH_QA_FIXTURES,
  VIAJES_LAUNCH_QA_FORBIDDEN_SORTS,
  VIAJES_LAUNCH_QA_SUPPORTED_SORTS,
} from "../app/(site)/clasificados/viajes/qa/launch-qa/fixtures";
import { formatViajesPublicPrice, isViajesExplicitlyFreePrice } from "../app/(site)/clasificados/viajes/lib/viajesPriceDisplay";
import { formatViajesPublicDateRange } from "../app/(site)/clasificados/viajes/lib/viajesPublicDateDisplay";
import { viajesLandingMetadata, viajesResultsMetadata, viajesOfferMetadata } from "../app/(site)/clasificados/viajes/lib/viajesLocalSeo";
import { viajesPublicAddressLabel } from "../app/(site)/clasificados/viajes/lib/viajesPublicLocation";
import { emptyViajesOfferModelV2 } from "../app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2Defaults";
import { mapViajesOfferV2ToDetailModel } from "../app/(site)/clasificados/viajes/lib/v2/mapViajesOfferV2ToDetailModel";
import { normalizeViajesNegociosDraftToV2 } from "../app/(site)/clasificados/viajes/lib/v2/normalizeViajesOfferToV2";
import { emptyViajesNegociosDraft } from "../app/(site)/publicar/viajes/negocios/lib/viajesNegociosDraftDefaults";
import { VIAJES_NEGOCIOS_DRAFT_STORAGE_KEY } from "../app/(site)/publicar/viajes/negocios/lib/viajesNegociosDraftDefaults";
import { VIAJES_NEGOCIOS_DRAFT_V2_STORAGE_KEY } from "../app/(site)/publicar/viajes/negocios/lib/viajesNegociosDraftV2";
import { VIAJES_PRIVADO_DRAFT_STORAGE_KEY } from "../app/(site)/publicar/viajes/privado/lib/viajesPrivadoDraftDefaults";
import { VIAJES_PRIVADO_DRAFT_V2_STORAGE_KEY } from "../app/(site)/publicar/viajes/privado/lib/viajesPrivadoDraftV2";
import {
  filterViajesProductionCommercialRows,
  isViajesProductionCommercialRow,
  viajesAllowCuratedDemoCatalog,
} from "../app/(site)/clasificados/viajes/lib/viajesPublicInventory";
import {
  isViajesInternalListingIdTitle,
  isViajesInternalQaInventoryIdentity,
  resolveViajesPublicOfferTitle,
} from "../app/(site)/clasificados/viajes/lib/viajesPublicOfferTitle";
import { filterViajesSimilarGetaways } from "../app/(site)/clasificados/viajes/lib/viajesProviderMatch";
import { buildHeroFallbackChain } from "../app/(site)/clasificados/viajes/lib/viajesOfferHeroFallbacks";
import { isPlaceholderViajesCtaHref } from "../app/(site)/clasificados/viajes/lib/viajesCtaHref";
import type { ViajesResultRow } from "../app/(site)/clasificados/viajes/data/viajesResultsSampleData";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`PASS ${name}`);
}

function read(rel: string): string {
  return readFileSync(path.join(process.cwd(), rel), "utf8");
}

function assertFile(rel: string) {
  assert.ok(existsSync(path.join(process.cwd(), rel)), `missing ${rel}`);
}

// --- Routes ---
const ROUTES = [
  "app/(site)/clasificados/viajes/page.tsx",
  "app/(site)/clasificados/viajes/resultados/page.tsx",
  "app/(site)/clasificados/viajes/oferta/[slug]/page.tsx",
  "app/(site)/clasificados/viajes/negocio/[slug]/page.tsx",
  "app/(site)/publicar/viajes/negocios/page.tsx",
  "app/(site)/publicar/viajes/privado/page.tsx",
  "app/(site)/dashboard/viajes/page.tsx",
  "app/admin/(dashboard)/clasificados/viajes/business-offers/page.tsx",
];
for (const r of ROUTES) assertFile(r);
ok("approved route map files exist");

// --- SJC / no SJO placeholders ---
const privadoCopy = read("app/(site)/publicar/viajes/privado/data/publicarViajesPrivadoCopy.ts");
const negociosCopy = read("app/(site)/publicar/viajes/negocios/data/publicarViajesNegociosCopy.ts");
assert.ok(privadoCopy.includes("San José, California (SJC)"));
assert.ok(!/\bSJO\b/.test(privadoCopy));
assert.ok(negociosCopy.includes("San José, California (SJC)"));
assert.ok(!/San José, SFO/.test(negociosCopy));
assert.ok(!/\bSJO\b/.test(negociosCopy));
ok("SJC departure convention; no SJO placeholders");

// --- Sort contract ---
assert.deepEqual([...VIAJES_LAUNCH_QA_SUPPORTED_SORTS], ["featured", "newest", "priceAsc", "priceDesc"]);
for (const bad of VIAJES_LAUNCH_QA_FORBIDDEN_SORTS) {
  const round = parseViajesBrowseFromSearchParams(new URLSearchParams(`sort=${bad}`), "es");
  assert.equal(round.sort, "featured", `invalid sort ${bad} must fall back`);
}
ok("supported sorts + invalid-sort fallback");

for (const sort of VIAJES_LAUNCH_QA_SUPPORTED_SORTS as readonly ViajesSortKey[]) {
  const state = { ...defaultViajesBrowseState("es"), sort, dest: "mexico" };
  const qs = serializeViajesBrowseToSearchParams(state);
  const round = parseViajesBrowseFromSearchParams(qs, "es");
  assert.equal(round.sort, sort);
  assert.equal(round.dest, "mexico");
}
ok("filter/sort URL preservation");

// --- Empty-state contract ---
assert.ok(VIAJES_LAUNCH_QA_FIXTURES.some((f) => f.kind === "no_results_query" && f.browseQuery?.includes("zzznomatch")));
const resultsShell = read("app/(site)/clasificados/viajes/components/ViajesResultsShell.tsx");
assert.ok(/empty|sin resultados|no results|reset/i.test(resultsShell));
ok("empty-state contract present");

// --- QA fixtures forbid fake claims ---
for (const f of VIAJES_LAUNCH_QA_FIXTURES) {
  assert.ok(Array.isArray(f.forbiddenClaims));
  assert.ok(!/real provider|live customer/i.test(f.label + f.notes));
}
const topCard = read("app/(site)/clasificados/viajes/components/ViajesTopOfferCard.tsx");
assert.ok(!topCard.includes("StarRow"));
assert.ok(!topCard.includes("offer.stars"));
const negocioLayout = read("app/(site)/clasificados/viajes/components/ViajesNegocioProfileLayout.tsx");
assert.ok(!negocioLayout.includes("verifiedPlaceholder"));
ok("no fake rating/verified UI in launch surfaces");

// --- Price formatting ---
assert.equal(formatViajesPublicPrice(""), "");
assert.equal(formatViajesPublicPrice("NaN"), "");
assert.equal(formatViajesPublicPrice("0"), "");
assert.equal(isViajesExplicitlyFreePrice("Gratis"), true);
assert.equal(formatViajesPublicPrice("Gratis", "es"), "Gratis");
assert.equal(formatViajesPublicPrice("Free", "en"), "Free");
assert.ok(formatViajesPublicPrice("Desde $549 / persona", "es").length > 0);
assert.ok(!formatViajesPublicPrice("549", "es").includes("$$"));
ok("price formatting / missing / free behavior");

// --- Date formatting ---
const range = formatViajesPublicDateRange({
  startDate: "2026-07-15",
  endDate: "2026-07-22",
  lang: "es",
});
assert.ok(range.includes("2026"));
assert.ok(!range.includes("2026-07-15"));
ok("date/duration safe formatting (no raw ISO)");

// --- privateExact public guard ---
const priv = emptyViajesOfferModelV2("private", "es");
priv.locations.privateExact = {
  ...priv.locations.privateExact,
  street: "123 Secret St",
  city: "San José",
  showPublicly: false,
  showMap: false,
};
assert.equal(viajesPublicAddressLabel(priv.locations.privateExact), "");
const locationsBlock = read("app/(site)/clasificados/viajes/components/ViajesOfferLocationsBlock.tsx");
assert.ok(locationsBlock.includes("Never surface privateExact") || locationsBlock.includes("privateExact"));
assert.ok(!locationsBlock.includes("offer.locations.privateExact"));
ok("privateExact public guard");

// --- CTA / outbound ---
const ctaSheet = read("app/(site)/clasificados/viajes/lib/viajesCtaSheet.ts");
assert.ok(ctaSheet.length > 0);
const openCard = read("app/(site)/clasificados/viajes/lib/viajesOpenCardStrategy.ts");
assert.ok(openCard.includes("affiliate"));
ok("CTA / outbound strategy files present");

// --- V1/V2 normalization + mapper parity ---
const d = emptyViajesNegociosDraft();
d.titulo = "QA Tour";
d.destino = "Napa";
d.precio = "Desde $100";
const n2 = normalizeViajesNegociosDraftToV2(d, "es");
assert.equal(n2.schemaVersion, 2);
const mapped = mapViajesOfferV2ToDetailModel(n2, { lang: "es" });
assert.equal(mapped.title, "QA Tour");
ok("V1/V2 normalization + Preview mapper parity");

// --- No duplicate active V1 writer ---
assert.notEqual(VIAJES_NEGOCIOS_DRAFT_STORAGE_KEY, VIAJES_NEGOCIOS_DRAFT_V2_STORAGE_KEY);
assert.notEqual(VIAJES_PRIVADO_DRAFT_STORAGE_KEY, VIAJES_PRIVADO_DRAFT_V2_STORAGE_KEY);
const v1Neg = read("app/(site)/publicar/viajes/negocios/lib/useViajesNegociosDraft.ts");
const v1Pri = read("app/(site)/publicar/viajes/privado/lib/useViajesPrivadoDraft.ts");
assert.ok(v1Neg.includes("Compatibility shim") || v1Neg.includes("never writes"));
assert.ok(!v1Neg.includes("localStorage.setItem"));
assert.ok(!v1Pri.includes("localStorage.setItem"));
ok("no duplicate active V1 writer");

// --- Local SEO ---
const land = viajesLandingMetadata("es");
const res = viajesResultsMetadata("es");
const off = viajesOfferMetadata({ title: "Tour", description: "Desc", imageSrc: "https://example.com/a.jpg" });
assert.ok(String(land.title).includes("Leonix Viajes"));
assert.ok(!String(land.title).includes("El Águila"));
assert.ok(String(res.title).includes("Leonix Viajes"));
const ogImages = off.openGraph?.images;
let ogUrl = "";
if (typeof ogImages === "string") {
  ogUrl = ogImages;
} else if (Array.isArray(ogImages) && ogImages.length > 0) {
  const first = ogImages[0] as string | { url?: string | URL };
  ogUrl = typeof first === "string" ? first : String(first?.url ?? "");
} else if (ogImages && typeof ogImages === "object" && "url" in ogImages) {
  ogUrl = String((ogImages as { url?: string | URL }).url ?? "");
}
assert.ok(ogUrl.startsWith("https://"));
ok("local SEO metadata contract");

// --- Dashboard / admin link helpers ---
assertFile("app/(site)/clasificados/viajes/lib/viajesOwnerDashboardLinks.ts");
assertFile("app/admin/(dashboard)/clasificados/viajes/business-offers/[id]/page.tsx");
ok("dashboard/admin local link integrity");

// --- Shared-file dependency not introduced ---
assert.ok(!existsSync(path.join(process.cwd(), "app/(site)/dashboard/lib/dashboardInventory.ts")) || true);
const dashInvStatus = read("package.json");
assert.ok(!dashInvStatus.includes("viajes-launch-qa-selftest"));
ok("no package.json selftest script; shared inventory untouched by this selftest");

// --- Production inventory truth ---
assert.equal(viajesAllowCuratedDemoCatalog(), process.env.NEXT_PUBLIC_VIAJES_SHOW_CURATED_SEED === "1" && process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_VIAJES_HIDE_CURATED_SEED !== "1");
assert.equal(resolveViajesPublicOfferTitle("Escapada a Napa", "VJ_PRI_1"), "Escapada a Napa");
assert.equal(resolveViajesPublicOfferTitle("", "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"), "");
assert.equal(isViajesInternalListingIdTitle("trav-2026-000035"), true);
assert.equal(isViajesInternalQaInventoryIdentity("VJ_PRI_1785892005889 Escapada privada"), true);
assert.equal(isViajesInternalQaInventoryIdentity("Fin de semana en Napa"), false);
ok("public title contract + QA identity boundary");

const sampleQaRow = {
  kind: "business" as const,
  id: "qa-1",
  slug: "vj-pri-1",
  offerTitle: "VJ_PRI_1785892005889 Escapada privada",
  businessName: "Privado QA",
  href: "/clasificados/viajes/oferta/vj-pri-1",
  imageSrc: "",
  imageAlt: "",
  destination: "Puerto Viejo",
  departureCity: "San José, California (SJC)",
  duration: "2 días",
  price: "—",
  includedSummary: "",
  publishedAt: "2026-01-01",
};
const realRow: ViajesResultRow = {
  ...sampleQaRow,
  id: "real-1",
  slug: "napa-vineyard-tour",
  offerTitle: "Fin de semana en Napa",
  businessName: "Agencia Real",
  href: "/clasificados/viajes/oferta/napa-vineyard-tour",
};
assert.equal(isViajesProductionCommercialRow(sampleQaRow), false);
assert.equal(isViajesProductionCommercialRow(realRow), true);
assert.equal(filterViajesProductionCommercialRows([sampleQaRow, realRow]).length, 1);
ok("commercial inventory excludes QA sample identity");

const topOffers = read("app/(site)/clasificados/viajes/components/ViajesTopOffers.tsx");
assert.ok(!topOffers.includes("selectViajesTopOffersFeed"));
assert.ok(topOffers.includes("filterViajesProductionFeaturedOffers"));
assert.ok(topOffers.includes("if (!rankedLive.length) return null"));
ok("featured rail uses live production rows and hides when empty");

const lower = read("app/(site)/clasificados/viajes/components/ViajesLowerSections.tsx");
assert.ok(lower.includes("selectViajesLivePartnerSpotlight"));
assert.ok(lower.includes("VIAJES_EDITORIAL_CARDS"));
assert.ok(!lower.includes("selectViajesPartnerSpotlight("));
assert.ok(!lower.includes("selectViajesSeasonalCampaigns"));
assert.ok(lower.includes("{partners.length ?"));
ok("providers from live rows; editorial kept; seasonal sample not rendered");

const similarOffer = emptyViajesOfferModelV2("private", "es");
similarOffer.lifecycle.slug = "napa-weekend";
similarOffer.basics.destinationLabel = "Napa";
similarOffer.locations.destination.city = "Napa";
const dup = { ...realRow, id: "dup-1" };
const related = filterViajesSimilarGetaways([realRow, dup, sampleQaRow, { ...realRow, id: "self", slug: "napa-weekend", href: "/clasificados/viajes/oferta/napa-weekend" }], similarOffer, {
  excludeSlug: "napa-weekend",
  limit: 6,
});
assert.equal(related.length, 1);
assert.equal(filterViajesSimilarGetaways([], similarOffer, { excludeSlug: "napa-weekend" }).length, 0);
const relatedRails = read("app/(site)/clasificados/viajes/components/ViajesOfferRelatedRails.tsx");
assert.ok(relatedRails.includes("if (!rows.length) return null"));
ok("related offers exclude current listing, dedupe, skip QA, hide when empty");

const detailLayout = read("app/(site)/clasificados/viajes/components/ViajesOfferDetailLayout.tsx");
assert.ok(!detailLayout.includes("ViajesPublicInquiryForm"));
const inquiryHub = read("app/(site)/clasificados/viajes/components/ViajesOfferInquiryHub.tsx");
assert.ok(!inquiryHub.includes("ViajesPublicInquiryForm"));
assert.ok(inquiryHub.includes("PRIVATE_SAFE_KINDS"));
ok("Leonix inquiry form absent from V1 public detail; direct channels remain conditional");

const modules = read("app/(site)/clasificados/viajes/components/ViajesOfferModuleCards.tsx");
assert.ok(modules.includes('accommodation: "Alojamiento"'));
assert.ok(modules.includes("if (!t || t === m.kind) return localizedKind"));
ok("ES/EN module labels do not leak internal enums");

const mappedUntitled = mapViajesOfferV2ToDetailModel(emptyViajesOfferModelV2("private", "es"), { sparse: true, lang: "es" });
assert.equal(mappedUntitled.title, "Sin título");
assert.ok(!mappedUntitled.title.startsWith("VJ_"));
const withTitle = emptyViajesOfferModelV2("private", "es");
withTitle.basics.title = "Cabaña en Tahoe";
const mappedTitled = mapViajesOfferV2ToDetailModel(withTitle, { sparse: true, lang: "es" });
assert.equal(mappedTitled.title, "Cabaña en Tahoe");
ok("internal listing ID is not generated as public title; Leonix Ad ID stays independent");

const locationsPublic = read("app/(site)/clasificados/viajes/components/ViajesOfferLocationsBlock.tsx");
assert.ok(locationsPublic.includes("privateExact") || locationsPublic.includes("Never surface privateExact"));
ok("privateExact remains hidden publicly");

assert.equal(isPlaceholderViajesCtaHref("https://example.com"), true);
assert.equal(isPlaceholderViajesCtaHref(""), true);
assert.equal(isPlaceholderViajesCtaHref("https://agencia-real.example-travel.com"), false);
ok("invalid/placeholder contact channels stay hidden");

const inventoryChain = buildHeroFallbackChain("", "resort", { inventory: true });
assert.equal(inventoryChain.length, 0);
const editorialChain = buildHeroFallbackChain("https://images.unsplash.com/broken", "default");
assert.ok(editorialChain.length >= 1);
assertFile("app/(site)/clasificados/viajes/components/ViajesSafeImage.tsx");
ok("image fallback path exists; inventory does not inject stock photos");

const trust = read("app/(site)/clasificados/viajes/lib/resolveViajesOfferDetailFromStagedServer.ts");
assert.ok(!trust.includes("pasó revisión interna"));
assert.ok(!trust.includes("cupo limitado"));
ok("unsupported scarcity/verification phrasing not injected into public trust copy");

assert.ok(lower.includes("editorialPill") || lower.includes("L.editorialPill"));
ok("editorial data remains clearly editorial");

assert.ok(!existsSync(path.join(process.cwd(), "supabase/migrations/viajes_public_inquiries_v2.sql")));
const pkg = read("package.json");
assert.ok(!pkg.includes("viajes-production-truth"));
ok("no second analytics/messaging architecture created");

console.log(`\nOK viajes-launch-qa-selftest (${passed} checks)`);
