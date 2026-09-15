/**
 * ⚠️38A — SERVICIOS STRUCTURED BILINGUAL DISCOVERY FOUNDATION (2026-09-14).
 *
 * Doctrine: every published listing belongs to ONE language-neutral inventory. Viewer language may
 * change chrome and canonical labels; it must never change membership. Source / authoring language
 * never filters inventory. The Servicios language filter means "languages the business can serve".
 *
 * Execution-first: the real adapter, document, matcher, results filters, saved-search matcher and
 * card mapper run against Spanish- and English-authored fixtures of the same canonical concepts.
 * Source guards pin the URL contract, the landing tiles and the no-translation-during-search rule.
 *
 * ⚠️38B (cross-language discovery of arbitrary owner prose) is DEFERRED and asserted as out of scope.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-bilingual-discovery.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync, readdirSync } from "node:fs";
import {
  normalizeBilingualSearchKey,
  normalizeBilingualSearchText,
} from "../app/lib/clasificados/discovery/bilingualSearchText";
import { conceptKey } from "../app/lib/clasificados/discovery/canonicalTaxonomyAdapter";
import { buildBilingualSearchDocument } from "../app/lib/clasificados/discovery/bilingualSearchDocument";
import { matchesDiscoveryIntent } from "../app/lib/clasificados/discovery/discoveryMatcher";
import { matchesLanguagesServed } from "../app/lib/clasificados/discovery/languagesServed";
import {
  serviciosDiscoveryAdapter,
  serviciosLanguagesServedFromProfile,
  serviciosRowBusinessTypeId,
} from "../app/(site)/clasificados/servicios/lib/serviciosDiscoveryAdapter";
import {
  filterServiciosPublicListingRows,
  filterServiciosRowsByKeyword,
  filterServiciosRowsBySeller,
  serviciosResultsHasActiveFilters,
} from "../app/(site)/clasificados/servicios/lib/serviciosResultsFilter";
import {
  buildServiciosResultsBrowseHref,
  parseServiciosFilterFormData,
  serviciosFilterQueryToUrlParams,
} from "../app/(site)/clasificados/servicios/lib/serviciosBrowseParams";
import { normalizeServiciosSearchText } from "../app/(site)/clasificados/servicios/lib/serviciosSearchSynonyms";
import { mapServiciosTradePresentationProfile } from "../app/(site)/clasificados/servicios/lib/mapServiciosTradePresentation";
import { serviciosEngagementListingKey } from "../app/(site)/clasificados/servicios/lib/serviciosPublicListingSort";
import { SERVICIOS_LANDING_EXPLORE_CATEGORIES } from "../app/(site)/clasificados/servicios/landing/serviciosLandingSampleData";
import { getBusinessTypePreset } from "../app/(site)/clasificados/publicar/servicios/lib/businessTypePresets";
import {
  serviciosFilterQueryToSavedSearch,
  savedSearchToServiciosFilterQuery,
} from "../app/lib/saved-search/servicios/savedSearchServiciosAdapter";
import { matchesServiciosSavedSearch } from "../app/lib/saved-search/servicios/savedSearchServiciosMatcher";
import { certifyServiciosPublicEligibleListing } from "../app/lib/saved-search/servicios/serviciosPublicEligibleListing";
import { buildServiciosSavedSearchResultsUrl } from "../app/lib/saved-search/servicios/serviciosSavedSearchResultsUrl";
import type { ServiciosPublicListingRow } from "../app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer";
import type { SavedSearchNormalizedInput } from "../app/lib/saved-search/savedSearchTypes";

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
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

/* ==============================================================================================
 * Fixtures — the SAME canonical concepts authored in Spanish and in English.
 * ============================================================================================ */
const PLOMERIA = getBusinessTypePreset("plomeria")!;
const TECHOS = getBusinessTypePreset("techos_canales")!;
const svcChip = (preset: typeof PLOMERIA, i: number) => preset.suggestedServices[i]!;
const reasonChip = (preset: typeof PLOMERIA, i: number) => preset.reasonsToChoose[i]!;

type Authored = "es" | "en";

function row(input: {
  id: string;
  slug: string;
  businessName: string;
  preset: typeof PLOMERIA;
  authored: Authored;
  languagesServed: string[];
  persistBusinessTypeId?: boolean;
  customServiceTitle?: string;
  about?: string;
  legacyBadgesOnly?: boolean;
}): ServiciosPublicListingRow {
  const L = (chip: { es: string; en: string }) => (input.authored === "en" ? chip.en : chip.es);
  const persist = input.persistBusinessTypeId !== false;
  const badges = [
    ...(input.languagesServed.includes("lang_es") ? [{ kind: "spanish", label: input.authored === "en" ? "Spanish" : "Español" }] : []),
    ...(input.languagesServed.includes("lang_en") ? [{ kind: "custom", label: input.authored === "en" ? "English" : "Inglés" }] : []),
  ];
  const profile_json = {
    identity: { slug: input.slug, businessName: input.businessName },
    hero: {
      title: input.businessName,
      categoryLine: input.authored === "en" ? input.preset.labelEn : input.preset.labelEs,
      badges,
      locationSummary: "San José",
    },
    about: { text: input.about ?? (input.authored === "en" ? "Family business since 2004." : "Empresa familiar desde 2004.") },
    services: [
      { id: `svc_${svcChip(input.preset, 0).id}`, title: L(svcChip(input.preset, 0)), secondaryLine: "", imageAlt: L(svcChip(input.preset, 0)), visualVariant: "instalacion" },
      { id: `svc_${svcChip(input.preset, 1).id}`, title: L(svcChip(input.preset, 1)), secondaryLine: "", imageAlt: L(svcChip(input.preset, 1)), visualVariant: "instalacion" },
      ...(input.customServiceTitle
        ? [{ id: "custom_offer_1", title: input.customServiceTitle, secondaryLine: "", imageAlt: input.customServiceTitle, visualVariant: "instalacion" }]
        : []),
    ],
    trust: [{ id: `trust_${reasonChip(input.preset, 0).id}`, label: L(reasonChip(input.preset, 0)), icon: "shield" }],
    quickFacts: [],
    contact: {},
    opsMeta: {
      ...(persist ? { businessTypeId: input.preset.id } : {}),
      ...(input.legacyBadgesOnly ? {} : { discovery: { languageChipIds: input.languagesServed } }),
    },
  };
  return {
    id: input.id,
    slug: input.slug,
    leonix_ad_id: `SERV-2026-${input.id.padStart(6, "0")}`,
    business_name: input.businessName,
    city: "San José",
    published_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
    profile_json,
    leonix_verified: false,
    listing_status: "published",
    internal_group: input.preset.internalGroup,
    owner_user_id: null,
  } as unknown as ServiciosPublicListingRow;
}

const esPlomeria = row({ id: "1", slug: "plomeria-hernandez", businessName: "Plomería Hernández", preset: PLOMERIA, authored: "es", languagesServed: ["lang_es", "lang_en"], customServiceTitle: "Restauración de antigüedades" });
const enPlumbing = row({ id: "2", slug: "bay-plumbing-pros", businessName: "Bay Plumbing Pros", preset: PLOMERIA, authored: "en", languagesServed: ["lang_en"] });
const esTechos = row({ id: "3", slug: "techos-lopez", businessName: "Techos López", preset: TECHOS, authored: "es", languagesServed: ["lang_es"] });
const legacyEnPlumbing = row({ id: "4", slug: "legacy-plumbing", businessName: "Legacy Plumbing Co", preset: PLOMERIA, authored: "en", languagesServed: ["lang_es", "lang_en"], persistBusinessTypeId: false, legacyBadgesOnly: true });
const ALL = [esPlomeria, enPlumbing, esTechos, legacyEnPlumbing];

const slugs = (rows: ServiciosPublicListingRow[]) => rows.map((r) => r.slug).sort();
const keyword = (rows: ServiciosPublicListingRow[], lang: "es" | "en", q: string) => filterServiciosRowsByKeyword(rows, lang, q);
const savedInput = (payload: Record<string, unknown>, city = ""): SavedSearchNormalizedInput => ({
  category: "servicios",
  city,
  minPrice: null,
  maxPrice: null,
  filterPayload: payload,
});

/* ==============================================================================================
 * 1–4  Structured cross-language keyword matching (both authoring directions, no translation API).
 * ============================================================================================ */
check("1 ES-authored plomería row + q=plumber → MATCH (and plumbers / plumbing)", () => {
  for (const q of ["plumber", "plumbers", "plumbing", "Plumbing"]) {
    assert.ok(keyword([esPlomeria], "en", q).length === 1, `q=${q}`);
    assert.ok(keyword([esPlomeria], "es", q).length === 1, `q=${q} (es page)`);
  }
});
check("2 EN-authored plumbing row + q=plomero → MATCH (and plomería / plomeria)", () => {
  for (const q of ["plomero", "plomeros", "plomería", "plomeria"]) {
    assert.ok(keyword([enPlumbing], "es", q).length === 1, `q=${q}`);
    assert.ok(keyword([enPlumbing], "en", q).length === 1, `q=${q} (en page)`);
  }
});
check("3 ES-authored techos_canales + q=roofing → MATCH through the canonical catalog label (no alias table entry)", () => {
  assert.ok(keyword([esTechos], "en", "roofing").length === 1);
  assert.ok(keyword([esTechos], "en", "gutters").length === 1, "EN service chip label 'Gutter installation'");
  assert.ok(keyword([esTechos], "en", "roof repair").length === 1, "EN service chip label");
});
check("4 same techos row + q=techos → MATCH; unrelated concept does not", () => {
  assert.ok(keyword([esTechos], "es", "techos").length === 1);
  assert.ok(keyword([esTechos], "es", "canales").length === 1);
  assert.equal(keyword([esTechos], "es", "plomero").length, 0, "no cross-concept leak");
});

/* ==============================================================================================
 * 5  Source / page language never alters eligibility.
 * ============================================================================================ */
check("5 page language does not alter inclusion; source language is not an input anywhere", () => {
  for (const q of ["plumber", "plomero", "roofing", "techos", "hogar y oficios", "home & trades", "english", "inglés"]) {
    assert.deepEqual(slugs(keyword(ALL, "es", q)), slugs(keyword(ALL, "en", q)), `q=${q}`);
  }
  // W1 / W2 closed: trade-family and language labels match in BOTH locales on either page.
  assert.deepEqual(slugs(keyword(ALL, "es", "home & trades")), slugs(ALL));
  assert.deepEqual(slugs(keyword(ALL, "en", "hogar y oficios")), slugs(ALL));
  assert.deepEqual(slugs(keyword(ALL, "es", "english")), ["bay-plumbing-pros", "legacy-plumbing", "plomeria-hernandez"]);
  const filter = raw("app/(site)/clasificados/servicios/lib/serviciosResultsFilter.ts");
  const adapter = raw("app/(site)/clasificados/servicios/lib/serviciosDiscoveryAdapter.ts");
  for (const src of [filter, adapter]) {
    assert.ok(!/original_language|sourceLocale|source_language|detectedSourceLocale/.test(src), "no source-language input");
  }
  assert.ok(filter.includes("_lang: ServiciosLang,\n  rawQ: string | undefined,"), "keyword filter ignores the page lang");
});

/* ==============================================================================================
 * 6–7  Languages served (canonical ids), never authoring language.
 * ============================================================================================ */
check("6 languagesServed=[es,en] + filter en → MATCH; filter es → MATCH", () => {
  assert.equal(filterServiciosPublicListingRows([esPlomeria], "es", { langEn: "1" }).length, 1);
  assert.equal(filterServiciosPublicListingRows([esPlomeria], "en", { langEs: "1" }).length, 1);
  assert.equal(filterServiciosPublicListingRows([esPlomeria], "es", { langOt: "1" }).length, 0, "Other not selected → no match");
  assert.ok(matchesLanguagesServed(["lang_es", "lang_en"], ["lang_en"]));
  assert.ok(matchesLanguagesServed(["lang_es", "lang_en"], ["lang_es", "lang_en"]));
});
check("7 languagesServed=[es] + filter en → NO MATCH; legacy badge fallback still resolves ids", () => {
  assert.equal(filterServiciosPublicListingRows([esTechos], "en", { langEn: "1" }).length, 0);
  assert.ok(!matchesLanguagesServed(["lang_es"], ["lang_en"]));
  assert.deepEqual(serviciosLanguagesServedFromProfile(legacyEnPlumbing.profile_json).sort(), ["lang_en", "lang_es"]);
  // An English-authored row that serves only English is NOT hidden from a Spanish page — only the facet decides.
  assert.equal(filterServiciosPublicListingRows([enPlumbing], "es", {}).length, 1);
  assert.equal(filterServiciosPublicListingRows([enPlumbing], "es", { langEs: "1" }).length, 0);
});

/* ==============================================================================================
 * 8  Landing tiles: ES and EN emit the same canonical `type=`; URL contract round-trips.
 * ============================================================================================ */
check("8 ES/EN landing tiles emit the same canonical type intent; only lang differs", () => {
  const byId = new Map(SERVICIOS_LANDING_EXPLORE_CATEGORIES.map((c) => [c.id, c]));
  assert.equal(byId.get("plomeria")?.resultsType, "plomeria");
  for (const cat of SERVICIOS_LANDING_EXPLORE_CATEGORIES) {
    assert.ok(cat.resultsType && getBusinessTypePreset(cat.resultsType), `${cat.id}: canonical preset id`);
  }
  const landing = raw("app/(site)/clasificados/servicios/landing/ServiciosLandingPage.tsx");
  assert.ok(landing.includes("appendResultsParams(resultsHref, { type: cat.resultsType })"), "tiles emit type=");
  const es = buildServiciosResultsBrowseHref("es", {}, { type: "plomeria" });
  const en = buildServiciosResultsBrowseHref("en", {}, { type: "plomeria" });
  assert.equal(es, "/clasificados/servicios/results?lang=es&type=plomeria");
  assert.equal(en, "/clasificados/servicios/results?lang=en&type=plomeria");
  assert.equal(serviciosFilterQueryToUrlParams({ type: "plomeria", group: "home_trade" }).type, "plomeria");
  const fd = new FormData();
  fd.set("type", "plomeria");
  assert.equal(parseServiciosFilterFormData(fd).type, "plomeria");
  assert.ok(serviciosResultsHasActiveFilters({ type: "plomeria" }));
  const page = raw("app/(site)/clasificados/servicios/resultados/page.tsx");
  assert.ok(page.includes("type: sp.type,"), "results page reads type=");
  // type= is exact canonical concept matching; legacy rows recover the concept from the catalog label.
  assert.deepEqual(slugs(filterServiciosPublicListingRows(ALL, "es", { type: "plomeria" })), ["bay-plumbing-pros", "legacy-plumbing", "plomeria-hernandez"]);
  assert.deepEqual(slugs(filterServiciosPublicListingRows(ALL, "en", { type: "techos_canales" })), ["techos-lopez"]);
  assert.equal(filterServiciosPublicListingRows(ALL, "en", { group: "automotive" }).length, 0, "group= stays exact and separate");
  // Old q-based tile URLs keep working.
  assert.deepEqual(slugs(keyword(ALL, "en", "plumbing")), slugs(keyword(ALL, "es", "plomería")));
});

/* ==============================================================================================
 * 9–11  Result cards: identity invariant, canonical labels follow viewer locale, name preserved.
 * ============================================================================================ */
check("9 same listingId / slug / engagement key under lang es and en", () => {
  const en = mapServiciosTradePresentationProfile({ row: esPlomeria, lang: "en" })!;
  const es = mapServiciosTradePresentationProfile({ row: esPlomeria, lang: "es" })!;
  assert.equal(en.identity.slug, es.identity.slug);
  assert.equal(serviciosEngagementListingKey(esPlomeria), "SERV-2026-000001");
  const card = raw("app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard.tsx");
  assert.ok(card.includes("`/clasificados/servicios/${encodeURIComponent(listingSlug)}?lang=${lang}`"), "path is lang-invariant");
  assert.ok(card.includes("categoryLabel: row.profile_json.hero?.categoryLine,"), "template routing reads the ORIGINAL line");
  const pro = raw("app/(site)/clasificados/servicios/ServiciosProfessionalResultCard.tsx");
  assert.ok(pro.includes("categoryLabel: row.profile_json.hero?.categoryLine,"));
});
check("10 result-card canonical labels follow the viewer locale (both authoring directions)", () => {
  const esRowEn = mapServiciosTradePresentationProfile({ row: esPlomeria, lang: "en" })!;
  assert.equal(esRowEn.hero.categoryLine, PLOMERIA.labelEn);
  assert.equal(esRowEn.services[0]!.title, svcChip(PLOMERIA, 0).en);
  assert.equal(esRowEn.trust[0]!.label, reasonChip(PLOMERIA, 0).en);
  assert.deepEqual(esRowEn.hero.badges.map((b) => b.label), ["Spanish", "English"]);
  const esRowEs = mapServiciosTradePresentationProfile({ row: esPlomeria, lang: "es" })!;
  assert.equal(esRowEs.hero.categoryLine, PLOMERIA.labelEs);
  assert.equal(esRowEs.services[0]!.title, svcChip(PLOMERIA, 0).es);
  const enRowEs = mapServiciosTradePresentationProfile({ row: enPlumbing, lang: "es" })!;
  assert.equal(enRowEs.hero.categoryLine, PLOMERIA.labelEs);
  assert.equal(enRowEs.services[1]!.title, svcChip(PLOMERIA, 1).es);
  assert.deepEqual(enRowEs.hero.badges.map((b) => b.label), ["Inglés"]);
  // Custom service stays original in both locales (⚠️38B).
  assert.equal(esRowEn.services[2]!.title, "Restauración de antigüedades");
  // Detail / preview branches are NOT relabeled (owner content original until Translate Ad).
  const mapper = raw("app/(site)/clasificados/servicios/lib/mapServiciosTradePresentation.ts");
  assert.ok(mapper.includes("if (direct) return direct;"), "profile/previewProfile passthrough intact");
});
check("11 business name, city, ids preserved on the localized card", () => {
  const en = mapServiciosTradePresentationProfile({ row: esPlomeria, lang: "en" })!;
  assert.equal(en.identity.businessName, "Plomería Hernández");
  assert.equal(en.hero.locationSummary, "San José");
  assert.equal(en.services[0]!.id, `svc_${svcChip(PLOMERIA, 0).id}`);
  assert.equal(esPlomeria.profile_json.hero?.categoryLine, PLOMERIA.labelEs, "stored row untouched");
});

/* ==============================================================================================
 * 12–13  Saved search: same matcher, both authoring directions, language-neutral.
 * ============================================================================================ */
check("12 saved q=plumber matches the Spanish-authored plomería row (any lang argument)", () => {
  const listing = certifyServiciosPublicEligibleListing(esPlomeria)!;
  const saved = savedInput({ q: "plumber" });
  assert.ok(matchesServiciosSavedSearch(listing, saved, "es"));
  assert.ok(matchesServiciosSavedSearch(listing, saved, "en"));
  assert.ok(matchesServiciosSavedSearch(listing, savedInput({ type: "plomeria" }), "es"), "type= facet round-trips");
  assert.ok(!matchesServiciosSavedSearch(listing, savedInput({ type: "techos_canales" }), "es"));
});
check("13 saved q=plomero matches the English-authored plumbing row; W4 hardcoded lang is now inert", () => {
  const listing = certifyServiciosPublicEligibleListing(enPlumbing)!;
  assert.ok(matchesServiciosSavedSearch(listing, savedInput({ q: "plomero" }), "es"));
  assert.ok(matchesServiciosSavedSearch(listing, savedInput({ q: "plomero" }), "en"));
  assert.ok(matchesServiciosSavedSearch(listing, savedInput({ q: "home & trades" }), "es"), "EN label saved from an EN page fires in the es orchestrator");
  const orch = raw("app/lib/saved-search/servicios/serviciosSavedSearchMatchOrchestrator.ts");
  assert.ok(orch.includes('matchesServiciosSavedSearch(certified, normalized, "es", { offersCapabilityByListingId })'), "orchestrator call unchanged (pinned elsewhere)");
  const matcher = raw("app/lib/saved-search/servicios/savedSearchServiciosMatcher.ts");
  assert.ok(matcher.includes("filterServiciosRowsByKeyword(rows, lang, query.q)"), "same pipeline");
});
check("13b NEW saves normalize q + carry type; reopen URL uses the shared serializer", () => {
  const a = serviciosFilterQueryToSavedSearch({ q: "Plomería", type: "plomeria", langEn: "1" });
  const b = serviciosFilterQueryToSavedSearch({ q: "  PLOMERIA ", type: "plomeria", langEn: "1" });
  assert.deepEqual(a.filterPayload, { q: "plomeria", type: "plomeria", langEn: true });
  assert.deepEqual(a.filterPayload, b.filterPayload, "same fingerprint input for accent/case variants");
  const back = savedSearchToServiciosFilterQuery(a);
  assert.equal(back.type, "plomeria");
  assert.equal(back.q, "plomeria");
  assert.equal(back.langEn, "1");
  const url = buildServiciosSavedSearchResultsUrl(savedInput({ q: "plomeria", type: "plomeria", openNow: true, freeEstimate: true, state: "CA" }), "en");
  assert.equal(url, "/clasificados/servicios/results?lang=en&q=plomeria&state=CA&type=plomeria&open_now=1&free_estimate=1");
  const urlSrc = raw("app/lib/saved-search/servicios/serviciosSavedSearchResultsUrl.ts");
  assert.ok(urlSrc.includes("serviciosFilterQueryToUrlParams(q, { stateTouched: true, countryTouched: true })"));
  assert.ok(!urlSrc.includes("FLAG_PARAM_BY_KEY"), "duplicate flag table removed");
});

/* ==============================================================================================
 * 14  Accent / case normalization → one canonical intent.
 * ============================================================================================ */
check("14 Plomería / plomeria / PLOMERIA → same canonical intent and same normalizer everywhere", () => {
  const intents = ["Plomería", "plomeria", "PLOMERIA", "  Plomería  "].map((q) => serviciosDiscoveryAdapter.intentFromQuery(q));
  const key = conceptKey({ kind: "businessType", id: "plomeria" });
  for (const intent of intents) {
    assert.ok(intent.conceptKeys.has(key), `intent for ${intent.normalizedQuery}`);
    assert.equal(intent.normalizedQuery, "plomeria");
  }
  assert.equal(normalizeServiciosSearchText("Plomería"), normalizeBilingualSearchText("Plomería"));
  assert.equal(normalizeBilingualSearchText("  Ñandú  Ünico "), "nandu  unico");
  assert.equal(normalizeBilingualSearchKey("  Ñandú  Ünico "), "nandu unico");
  const syn = raw("app/(site)/clasificados/servicios/lib/serviciosSearchSynonyms.ts");
  assert.ok(syn.includes("return normalizeBilingualSearchText(value);"), "Servicios normalizer delegates to the shared one");
});

/* ==============================================================================================
 * 15–17  No translation during search, no duplicate rows, analytics identity untouched.
 * ============================================================================================ */
check("15 no /api/translate-ad or translation request in discovery code", () => {
  const dir = "app/lib/clasificados/discovery";
  const files = readdirSync(new URL(`../${dir}`, import.meta.url)).filter((f) => f.endsWith(".ts"));
  assert.ok(files.length >= 5, "foundation files present");
  for (const rel of [
    ...files.map((f) => `${dir}/${f}`),
    "app/(site)/clasificados/servicios/lib/serviciosDiscoveryAdapter.ts",
    "app/(site)/clasificados/servicios/lib/serviciosResultsFilter.ts",
    "app/(site)/clasificados/servicios/lib/serviciosSearchSynonyms.ts",
    "app/(site)/servicios/lib/serviciosCanonicalPresetLabels.ts",
    "app/lib/saved-search/servicios/savedSearchServiciosMatcher.ts",
  ]) {
    const src = raw(rel);
    assert.ok(!/translate-ad|requestAdTranslation|requestServiciosAdTranslation|fetch\(|server-only/.test(src), `${rel}: pure, no translation, no network`);
  }
});
check("16 no duplicate / translated listing rows and no schema change", () => {
  const publish = raw("app/api/clasificados/servicios/publish/route.ts");
  assert.ok(!/serviciosDiscoveryAdapter|search_document|bilingualSearchDocument/.test(publish), "publish path untouched by discovery");
  const migrations = readdirSync(new URL("../supabase/migrations", import.meta.url));
  assert.ok(!migrations.some((m) => /bilingual|search_document|source_language|original_language/i.test(m)), "no discovery migration");
  assert.ok(!migrations.some((m) => /^2026091[4-9]|^20260920/.test(m) && /servicios/i.test(m)), "no Servicios migration added by ⚠️38A");
  // One inventory: the loader still has no language predicate.
  const loader = raw("app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts");
  assert.ok(loader.includes('.ilike("listing_status", SERVICIOS_LISTING_STATUS_PUBLISHED)'));
  assert.ok(!/\.eq\("lang|\.eq\("locale|original_language|source_language/.test(loader));
});
check("17 analytics identity untouched", () => {
  assert.equal(serviciosEngagementListingKey(esPlomeria), "SERV-2026-000001");
  assert.equal(serviciosEngagementListingKey({ ...esPlomeria, leonix_ad_id: null }), "1");
  const sort = raw("app/(site)/clasificados/servicios/lib/serviciosPublicListingSort.ts");
  assert.ok(sort.includes("export function serviciosEngagementListingKey"));
  const analytics = raw("app/(site)/clasificados/servicios/lib/recordServiciosGlobalAnalytics.ts");
  assert.ok(analytics.includes('source_table: "servicios_public_listings"') || analytics.includes("servicios_public_listings"));
});

/* ==============================================================================================
 * 18–19  Custom owner text: original-language search works; cross-language prose is ⚠️38B.
 * ============================================================================================ */
check("18 custom text is searchable in its original language (accent-insensitive) from any page", () => {
  assert.equal(keyword([esPlomeria], "en", "antiguedades").length, 1);
  assert.equal(keyword([esPlomeria], "es", "Restauración").length, 1);
  assert.equal(keyword([esPlomeria], "en", "empresa familiar").length, 1, "about text");
  assert.equal(keyword([enPlumbing], "es", "family business").length, 1);
  const doc = buildBilingualSearchDocument(serviciosDiscoveryAdapter, esPlomeria);
  assert.ok(doc.customText.includes("restauracion de antiguedades"));
  assert.ok(doc.canonicalText.includes("plumbing") && doc.canonicalText.includes("plomeria"), "canonical labels in both locales");
  assert.ok(doc.literalText.includes("plomeria hernandez"));
  assert.equal(serviciosRowBusinessTypeId(legacyEnPlumbing.profile_json), "plomeria", "legacy row recovers its type from the catalog label");
});
check("19 ⚠️38B — cross-language arbitrary custom prose is OUT OF SCOPE (documented boundary, not a defect)", () => {
  const doc = buildBilingualSearchDocument(serviciosDiscoveryAdapter, esPlomeria);
  const intent = serviciosDiscoveryAdapter.intentFromQuery("antique restoration");
  assert.equal(matchesDiscoveryIntent(doc, intent), false, "custom prose is not machine-translated during search");
  const adapter = raw("app/(site)/clasificados/servicios/lib/serviciosDiscoveryAdapter.ts");
  assert.ok(adapter.includes("⚠️38B"), "boundary documented at the adapter");
});

/* ==============================================================================================
 * Pipeline order + seller pass untouched.
 * ============================================================================================ */
check("pipeline: filter → keyword → seller order intact on the results page", () => {
  const page = raw("app/(site)/clasificados/servicios/resultados/page.tsx");
  const a = page.indexOf("filterServiciosPublicListingRows(allRows, lang, filterQuery, { offersCapabilityByListingId })");
  const b = page.indexOf("filterServiciosRowsByKeyword(rows, lang, filterQuery.q)");
  const c = page.indexOf("filterServiciosRowsBySeller(rows, lang, filterQuery.seller)");
  assert.ok(a > 0 && b > a && c > b);
  assert.equal(filterServiciosRowsBySeller(ALL, "es", "all").length, ALL.length);
});

if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-bilingual-discovery: PASS");
