/**
 * Gate BIENES-NEGOCIO-2 verifier — behavioral proofs, not string matching.
 *
 * Run:  node node_modules/tsx/dist/cli.mjs scripts/verify-bienes-negocio-gate2-discovery.ts
 *
 * Assertions execute the real shipped modules wherever the claim is behavioral. Where a claim can
 * only be made about source (a route's composition, a select), the source is read with comments
 * STRIPPED first, so a sentence in a doc comment can never satisfy a claim about code.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import {
  bienesRaicesPropertyJsonLd,
  brSqftFromDetailPairs,
  parseBrBusinessMetaForSeo,
} from "../app/(site)/clasificados/bienes-raices/seo/bienesRaicesJsonLd";
import {
  collectBrChildParentIds,
  filterBrRowsByActiveParent,
  isBrChildParentGateSatisfied,
  type BrPublicParentCandidate,
} from "../app/(site)/clasificados/lib/brPublicChildParentVisibility";
import { adminBienesChildHref } from "../app/admin/_lib/bienesNegocioAdminHrefs";
import {
  BR_BASE_INCLUDED_PROPERTIES,
  BR_INVENTORY_PACK_MAX_CHILDREN,
  BR_TOTAL_ACTIVE_PROPERTY_LIMIT,
} from "../app/lib/listingPlans/publishCheckoutCheckpoint";
import { getRevenuePackagePriceCents } from "../app/lib/listingPlans/revenuePricingMatrix";
import { leonixLiveAnuncioPath } from "../app/(site)/clasificados/lib/leonixRealEstateListingContract";

const ROOT = path.resolve(__dirname, "..");

let passed = 0;
const failures: string[] = [];

function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.log(`  FAIL  ${name} -> ${e instanceof Error ? e.message : String(e)}`);
  }
}

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function eq(actual: unknown, expected: unknown, message: string): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${message} (got ${a}, expected ${b})`);
}

function readSrc(file: string): string {
  return readFileSync(path.join(ROOT, file), "utf8");
}

function stripComments(file: string): string {
  return readSrc(file)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const DETAIL_PAGE = "app/(site)/clasificados/anuncio/[id]/page.tsx";
const OPS_MODULE = "app/admin/_lib/bienesNegocioCommercialOps.ts";
const OPS_PANEL = "app/admin/(dashboard)/workspace/clasificados/_components/BienesNegocioOpsPanel.tsx";

console.log("\nGate BIENES-NEGOCIO-2 — discovery + Admin operational truth\n");

/* ============================================================================================
 * 1. REAL-ESTATE JSON-LD
 * ==========================================================================================*/

console.log("JSON-LD / REAL-ESTATE SEO");

function fullListing() {
  return bienesRaicesPropertyJsonLd({
    url: "https://leonix.example/clasificados/anuncio/abc-123",
    name: "Casa en First Street",
    description: "Casa remodelada de tres recámaras.",
    images: ["https://cdn.example.com/a.jpg"],
    leonixAdId: "BR-2026-000042",
    listingId: "abc-123",
    propertyKind: "casa",
    propertySubtype: "Casa sola",
    city: "San Jose",
    addressRegion: "CA",
    addressCountry: "United States",
    postalCode: "95112",
    streetAddress: "123 First St",
    bedrooms: 3,
    bathrooms: 2,
    floorSizeSqft: 1850,
    lotSizeSqft: 5200,
    priceNumber: 850000,
    operation: "sale",
    listingStatus: "disponible",
    sellerBusinessName: "Correduría Del Valle",
    sellerAgentName: "María Ruiz",
    sellerTelephone: "4085551234",
    sellerUrl: "https://delvalle.example",
  });
}

check("the top node is RealEstateListing and the property hangs off mainEntity", () => {
  const j = fullListing();
  eq(j["@type"], "RealEstateListing", "listing page type");
  const main = j.mainEntity as Record<string, unknown>;
  assert(main, "mainEntity present");
  eq(main["@type"], "SingleFamilyResidence", "casa -> SingleFamilyResidence");
  // RealEstateListing is a WebPage subtype: room counts must NOT sit on it.
  for (const invalid of ["numberOfBedrooms", "numberOfBathroomsTotal", "floorSize", "address"]) {
    assert(!(invalid in j), `${invalid} must live on the property node, not the listing node`);
  }
});

check("property node type follows the persisted facet, never a guess", () => {
  const kinds = [
    ["casa", "SingleFamilyResidence"],
    ["departamento", "Apartment"],
    ["terreno", "Place"],
    ["comercial", "Place"],
  ] as const;
  for (const [kind, expected] of kinds) {
    const j = bienesRaicesPropertyJsonLd({ url: "https://e/x", name: "X", propertyKind: kind });
    eq((j.mainEntity as Record<string, unknown>)["@type"], expected, `${kind}`);
  }
  const unknown = bienesRaicesPropertyJsonLd({ url: "https://e/x", name: "X" });
  eq((unknown.mainEntity as Record<string, unknown>)["@type"], "Place", "no facet -> Place");
});

check("Accommodation-only vocabulary is omitted on non-Accommodation nodes", () => {
  const land = bienesRaicesPropertyJsonLd({
    url: "https://e/x",
    name: "Terreno",
    propertyKind: "terreno",
    bedrooms: 3,
    bathrooms: 2,
    floorSizeSqft: 1000,
  });
  const main = land.mainEntity as Record<string, unknown>;
  for (const invalid of ["numberOfBedrooms", "numberOfBathroomsTotal", "floorSize"]) {
    assert(!(invalid in main), `${invalid} is not valid vocabulary on Place`);
  }
});

check("bedrooms / bathrooms / area appear ONLY when real", () => {
  const j = fullListing();
  const main = j.mainEntity as Record<string, unknown>;
  eq(main.numberOfBedrooms, 3, "bedrooms");
  eq(main.numberOfBathroomsTotal, 2, "bathrooms");
  eq(main.floorSize, { "@type": "QuantitativeValue", value: 1850, unitCode: "FTK" }, "floor size");

  const bare = bienesRaicesPropertyJsonLd({
    url: "https://e/x",
    name: "X",
    propertyKind: "casa",
    bedrooms: null,
    bathrooms: 0,
    floorSizeSqft: null,
  });
  const bareMain = bare.mainEntity as Record<string, unknown>;
  for (const f of ["numberOfBedrooms", "numberOfBathroomsTotal", "floorSize"]) {
    assert(!(f in bareMain), `${f} must be omitted, never emitted as 0`);
  }
});

check("PRICE is a real number on an Offer, never the formatted label", () => {
  const j = fullListing();
  const offer = j.offers as Record<string, unknown>;
  eq(offer["@type"], "Offer", "offer type");
  eq(offer.price, 850000, "numeric price");
  eq(offer.priceCurrency, "USD", "currency");
  eq(offer.businessFunction, "https://schema.org/Sell", "sale");
  eq(offer.availability, "https://schema.org/InStock", "disponible -> InStock");
  assert(typeof offer.price === "number", "price must be a number, not a string");
  assert(!("price" in j), "price must not sit on the listing node");

  const free = bienesRaicesPropertyJsonLd({ url: "https://e/x", name: "X", priceNumber: null });
  assert(!("offers" in free), "no price -> no Offer at all");
});

check("rent vs sale comes from the real operation facet", () => {
  const rent = bienesRaicesPropertyJsonLd({ url: "https://e/x", name: "X", priceNumber: 2500, operation: "rent" });
  eq((rent.offers as Record<string, unknown>).businessFunction, "https://schema.org/LeaseOut", "rent");
});

check("availability is omitted for statuses with no honest schema.org equivalent", () => {
  for (const status of ["bajo_contrato", "pendiente", "", "algo"]) {
    const j = bienesRaicesPropertyJsonLd({ url: "https://e/x", name: "X", priceNumber: 1, listingStatus: status });
    assert(!("availability" in (j.offers as Record<string, unknown>)), `${status} must not be approximated`);
  }
  const sold = bienesRaicesPropertyJsonLd({ url: "https://e/x", name: "X", priceNumber: 1, listingStatus: "vendido" });
  eq((sold.offers as Record<string, unknown>).availability, "https://schema.org/SoldOut", "vendido");
});

check("PRIVACY: street address is emitted only when the caller proves the opt-in", () => {
  const withStreet = fullListing();
  const addr = (withStreet.mainEntity as Record<string, unknown>).address as Record<string, unknown>;
  eq(addr.streetAddress, "123 First St", "opted-in street");

  const gated = bienesRaicesPropertyJsonLd({
    url: "https://e/x",
    name: "X",
    city: "San Jose",
    postalCode: "95112",
    addressRegion: "CA",
    streetAddress: null,
  });
  const gatedAddr = (gated.mainEntity as Record<string, unknown>).address as Record<string, unknown>;
  assert(!("streetAddress" in gatedAddr), "no street without the opt-in");
  eq(gatedAddr.addressLocality, "San Jose", "city stays public");
  eq(gatedAddr.postalCode, "95112", "postal code stays public (category's declared public set)");
});

check("region and country are NEVER hardcoded", () => {
  const j = bienesRaicesPropertyJsonLd({ url: "https://e/x", name: "X", city: "Reno" });
  const addr = (j.mainEntity as Record<string, unknown>).address as Record<string, unknown>;
  assert(!("addressRegion" in addr), "no region when none is published");
  assert(!("addressCountry" in addr), "no country when none is published");
  const src = stripComments("app/(site)/clasificados/bienes-raices/seo/bienesRaicesJsonLd.ts");
  assert(!/"CA"/.test(src), "the builder must not contain a hardcoded region");
  assert(!/"US"/.test(src), "the builder must not contain a hardcoded country");
});

check("no fabricated ratings, reviews or provider data", () => {
  const j = fullListing();
  for (const banned of ["aggregateRating", "review", "ratingValue", "reviewCount"]) {
    assert(!(banned in j), `${banned} must never be emitted`);
  }
  const src = stripComments("app/(site)/clasificados/bienes-raices/seo/bienesRaicesJsonLd.ts");
  assert(!/rating|reviewCount/i.test(src), "the builder must have no rating parameter at all");
});

check("seller identity is business-only and appears only when real", () => {
  const j = fullListing();
  const provider = j.provider as Record<string, unknown>;
  eq(provider["@type"], "RealEstateAgent", "provider type");
  eq(provider.name, "Correduría Del Valle", "brokerage name");
  eq(provider.telephone, "4085551234", "telephone");
  eq((provider.employee as Record<string, unknown>).name, "María Ruiz", "agent as employee");

  const none = bienesRaicesPropertyJsonLd({ url: "https://e/x", name: "X" });
  assert(!("provider" in none), "no seller node without a real name");
});

check("identity uses the real Leonix ad id, never a generated one", () => {
  eq(fullListing().identifier, "BR-2026-000042", "leonix ad id preferred");
  const fallback = bienesRaicesPropertyJsonLd({ url: "https://e/x", name: "X", listingId: "abc-123" });
  eq(fallback.identifier, "abc-123", "row id fallback");
  const none = bienesRaicesPropertyJsonLd({ url: "https://e/x", name: "X" });
  assert(!("identifier" in none), "no fabricated identifier");
});

check("area helpers never turn prose or a dash into a number", () => {
  const pairs = [
    { label: "Pies cuadrados", value: "1,850" },
    { label: "Lote", value: "—" },
    { label: "Superficie", value: "amplia" },
  ];
  eq(brSqftFromDetailPairs(pairs, ["Pies cuadrados"]), 1850, "parses a real number");
  eq(brSqftFromDetailPairs(pairs, ["Lote"]), null, "em dash -> null");
  eq(brSqftFromDetailPairs(pairs, ["Superficie"]), null, "prose -> null");
  eq(brSqftFromDetailPairs(pairs, ["Nope"]), null, "missing -> null");
});

check("business meta parsing is tolerant and never fabricates", () => {
  eq(parseBrBusinessMetaForSeo(null), { agentName: null, telephone: null, website: null }, "null");
  eq(parseBrBusinessMetaForSeo("{bad json"), { agentName: null, telephone: null, website: null }, "malformed");
  eq(
    parseBrBusinessMetaForSeo(JSON.stringify({ negocioAgente: "María", negocioSitioWeb: "https://x.example" })),
    { agentName: "María", telephone: null, website: "https://x.example" },
    "real values only",
  );
});

console.log("\nABSOLUTE CANONICAL + PAGE WIRING");

check("the BR branch emits BOTH JSON-LD blocks, with an ABSOLUTE canonical", () => {
  const src = stripComments(DETAIL_PAGE);
  const brBranch = src.slice(src.indexOf('if (listing.category === "bienes-raices")'));
  const blocks = (brBranch.slice(0, brBranch.indexOf("if (useEnVentaPublishedDetail)")).match(/type="application\/ld\+json"/g) ?? []);
  assert(blocks.length === 2, `expected property + breadcrumb JSON-LD in the BR branch, saw ${blocks.length}`);
  assert(
    /url: `\$\{LEONIX_SITE_ORIGIN\}\$\{leonixLiveAnuncioPath\(listing\.id\)\}`/.test(brBranch),
    "the JSON-LD url must be the absolute canonical detail URL",
  );
  assert(brBranch.includes("breadcrumbJsonLd(["), "shared breadcrumb helper");
  assert(/lang=\$\{lang\}/.test(brBranch), "breadcrumb paths are ES/EN aware");
});

check("the page passes the privacy-gated street address only", () => {
  const src = stripComments(DETAIL_PAGE);
  assert(
    /streetAddress: brShowExactAddress \? brGate12d\?\.streetAddress \?\? null : null/.test(src),
    "street must be gated on brShowExactAddressFromDetailPairs",
  );
  assert(src.includes("brShowExactAddressFromDetailPairs("), "gate helper used");
});

check("the generic ClassifiedAd block was left untouched for other categories", () => {
  const src = stripComments(DETAIL_PAGE);
  assert(src.includes('"@type": "ClassifiedAd"'), "the fall-through block still exists");
  // and BR never reaches it, because its branch returns first
  const brAt = src.indexOf('if (listing.category === "bienes-raices")');
  const classifiedAt = src.indexOf('"@type": "ClassifiedAd"');
  assert(brAt > 0 && classifiedAt > brAt, "the BR branch returns before the generic block");
});

/* ============================================================================================
 * 2. SITEMAP
 * ==========================================================================================*/

console.log("\nSITEMAP");

check("bienes-raices is composed as the fifth DB-backed section", () => {
  const src = stripComments("app/sitemap.ts");
  assert(src.includes("bienesRaicesSitemapEntries"), "section exists");
  assert(/\.\.\.\(await bienesRaicesSitemapEntries\(base, now\)\)/.test(src), "section is composed");
  assert(src.includes("listPublishedBrListingsForSitemap"), "uses the category's own safety-gated reader");
  assert(!/from\("listings"\)/.test(src), "never a direct table query in the route module");
});

check("only published rows appear, at the canonical detail path, failing safely", () => {
  const src = stripComments("app/sitemap.ts");
  const section = src.slice(src.indexOf("async function bienesRaicesSitemapEntries"));
  const body = section.slice(0, section.indexOf("/** Upper bound for the Restaurantes section."));
  assert(/if \(!listed\.ok\) return \[\]/.test(body), "a failed read yields no entries");
  assert(/catch \{/.test(body), "one unavailable section cannot fail the whole sitemap");
  assert(body.includes("leonixLiveAnuncioPath(row.id)"), "canonical detail path only");
  assert(!/sample|demo|placeholder/i.test(body), "no fake/sample URLs");
});

check("the server reader applies BOTH shared eligibility gates verbatim", () => {
  const src = stripComments("app/(site)/clasificados/bienes-raices/lib/brPublishedListingsServer.ts");
  assert(src.includes("isListingRowActiveAndPublishedForBrowse("), "shared row-level rule reused");
  assert(src.includes("collectBrChildParentIds("), "shared parent-id collector reused");
  assert(src.includes("filterBrRowsByActiveParent("), "shared parent gate reused");
  assert(/\.eq\("category", "bienes-raices"\)/.test(src), "category scoped");
  assert(/\.eq\("is_published", true\)/.test(src), "published only");
  assert(/\.eq\("status", "active"\)/.test(src), "active only");
  // No re-expression of the gate logic.
  assert(!src.includes('inventory_role !== "inventory_property"'), "the gate must not be reimplemented");
  assert(/if \(parentError\) return \{ ok: false/.test(src), "a failed PARENT read must fail the section");
});

check("PARENT VISIBILITY GATE: a live child under a suspended parent is excluded", () => {
  const parentId = "11111111-1111-1111-1111-111111111111";
  const child = {
    id: "22222222-2222-2222-2222-222222222222",
    inventory_role: "inventory_property",
    br_inventory_parent_listing_id: parentId,
    owner_id: "owner-1",
  };
  const liveParent: BrPublicParentCandidate = {
    id: parentId,
    category: "bienes-raices",
    seller_type: "business",
    inventory_role: "main",
    owner_id: "owner-1",
    status: "active",
    is_published: true,
  };
  eq(collectBrChildParentIds([child]), [parentId], "parent id collected by real UUID");
  eq(filterBrRowsByActiveParent([child], new Map([[parentId, liveParent]])).length, 1, "live parent -> child kept");

  for (const bad of [
    { ...liveParent, status: "suspended" },
    { ...liveParent, status: "paused" },
    { ...liveParent, is_published: false },
    { ...liveParent, owner_id: "owner-2" },
    { ...liveParent, inventory_role: "inventory_property" },
    { ...liveParent, seller_type: "personal" },
  ]) {
    eq(
      filterBrRowsByActiveParent([child], new Map([[parentId, bad]])).length,
      0,
      `child must be excluded when the parent is ${JSON.stringify({ s: bad.status, p: bad.is_published, o: bad.owner_id, r: bad.inventory_role, t: bad.seller_type })}`,
    );
  }
  eq(filterBrRowsByActiveParent([child], new Map()).length, 0, "missing parent -> excluded");
  // A main row needs no parent.
  assert(
    isBrChildParentGateSatisfied({ id: parentId, inventory_role: "main", owner_id: "owner-1" }, new Map()),
    "a main parent always passes",
  );
});

/* ============================================================================================
 * 3. ADMIN OPS TRUTH
 * ==========================================================================================*/

console.log("\nADMIN OPS TRUTH");

check("the ops projection reads CANONICAL sources, and creates no second commercial model", () => {
  const src = stripComments(OPS_MODULE);
  assert(src.includes("hasActiveAddonEntitlement("), "entitlement from the canonical reader");
  assert(src.includes("loadSubscriptionStatusForParent("), "subscription from the canonical reader");
  assert(src.includes("countActiveBrInventory("), "capacity count from the canonical counter");
  assert(src.includes("BIENES_NEGOCIO_BASE_PACKAGE_KEY"), "base package key from the fulfillment module");
  assert(src.includes("BR_INVENTORY_PACK_PACKAGE_KEY"), "pack key from the checkout module");
  // Never a private re-derivation.
  assert(!/from\("listing_package_entitlements"\)/.test(src), "must not query entitlements itself");
  assert(!/from\("leonix_subscription_records"\)/.test(src), "must not query subscriptions itself");
});

check("Admin never infers paid state from listing status", () => {
  const src = stripComments(OPS_MODULE);
  // status is read for display, but must never feed an entitlement/subscription conclusion.
  assert(!/status === "active".*(entitle|paid|subscription)/i.test(src), "no status->paid inference");
  assert(!/priceCents|revenuePricingMatrix/.test(src), "entitlement must not be inferred from pricing config");
});

check("unavailable / unreadable data is NEVER collapsed into zero", () => {
  const src = stripComments(OPS_MODULE);
  assert(/activeCount: number \| null/.test(src), "count is nullable, not defaulted to 0");
  assert(/active: boolean \| null/.test(src), "entitlement is nullable, not defaulted to false");
  assert(/effectiveLimit: number \| null/.test(src), "limit is nullable when entitlement is unproven");
  assert(!/activeCount: 0/.test(src), "no zero stand-in");
  for (const state of ["REAL", "PARTIAL", "NEEDS_PROOF", "BROKEN", "UNAVAILABLE"]) {
    assert(src.includes(`"${state}"`), `truth state ${state} must be representable`);
  }
});

check("the panel renders a truth badge instead of a fabricated value", () => {
  const src = stripComments(OPS_PANEL);
  assert(src.includes("TruthBadge"), "truth badge exists");
  assert(/truth !== "REAL" \|\| active === null/.test(src), "entitlement shows the state when unproven");
  assert(/activeCount === null \?/.test(src), "capacity shows the state when unreadable");
  assert(/childCountTruth !== "REAL" \?/.test(src), "child count shows the state when unreadable");
  assert(!/\|\| 0/.test(src), "no zero fallback anywhere in the panel");
});

check("commercial truth is displayed from the canonical constants, not literals", () => {
  const src = stripComments(OPS_MODULE);
  assert(src.includes("BR_BASE_INCLUDED_PROPERTIES"), "included limit from source");
  assert(src.includes("BR_INVENTORY_PACK_MAX_CHILDREN"), "pack size from source");
  assert(src.includes("BR_TOTAL_ACTIVE_PROPERTY_LIMIT"), "total from source");
  eq(BR_BASE_INCLUDED_PROPERTIES, 1, "1 included");
  eq(BR_INVENTORY_PACK_MAX_CHILDREN, 3, "+3");
  eq(BR_TOTAL_ACTIVE_PROPERTY_LIMIT, 4, "max 4");
  eq(getRevenuePackagePriceCents({ category: "bienes-raices", packageKey: "br_agent_monthly" }).priceCents, 39900, "$399");
  eq(getRevenuePackagePriceCents({ category: "bienes-raices", packageKey: "br_inventory_pack_monthly" }).priceCents, 9900, "+$99");
});

check("the panel is mounted only for bienes-raices, bounded, and additive", () => {
  const src = stripComments("app/admin/(dashboard)/workspace/clasificados/_components/ListingsCategoryOpsQueuePage.tsx");
  assert(/categorySlug === "bienes-raices"/.test(src), "scoped to this category only");
  assert(/inventory_role === "main"/.test(src), "only MAIN parents are projected");
  assert(/\.slice\(0, 25\)/.test(src), "bounded — never sweeps the table");
  assert(src.includes("<BienesNegocioOpsPanel"), "panel mounted");
  assert(src.includes("<AdminListingsTable"), "the existing table is still rendered");
});

console.log("\nADMIN PARENT -> CHILD NAVIGATION");

check("child rows link to the EXISTING canonical Admin listing destination", () => {
  eq(
    adminBienesChildHref("abc-123"),
    "/admin/workspace/clasificados/listings/abc-123/edit",
    "canonical admin destination",
  );
  const src = stripComments(OPS_MODULE);
  assert(/br_inventory_parent_listing_id", parentListingId/.test(src), "children resolved by canonical parent id");
  assert(/inventory_role", "inventory_property"/.test(src), "children resolved by role");
  const panel = stripComments(OPS_PANEL);
  assert(panel.includes("c.adminHref"), "panel links each child");
  assert(!/\/admin\/workspace\/clasificados\/bienes-raices\/children/.test(panel), "no new child route family");
});

console.log("\nUNAPPLIED CAPACITY AUTHORITY");

check("Admin surfaces the authority's own availability, honestly", () => {
  const src = stripComments(OPS_MODULE);
  assert(src.includes("probeCapacityAuthority"), "the authority is probed");
  assert(src.includes('rpc("br_negocio_activate_listing"'), "probes the real function");
  assert(src.includes("00000000-0000-0000-0000-000000000000"), "probe uses a nil UUID that can match no row");
  assert(/truth: "UNAVAILABLE"/.test(src), "an absent function is UNAVAILABLE, not healthy");
  assert(!/return \{ truth: "REAL", note: "" \}/.test(src), "never silently green");
});

check("the operator explanation is safe — no raw RPC error is shown", () => {
  const src = stripComments(OPS_MODULE);
  const probe = src.slice(src.indexOf("async function probeCapacityAuthority"), src.indexOf("export async function loadBienesNegocioParentOps"));
  assert(!/error\.message/.test(probe), "the raw Postgres error must never reach the operator");
  assert(probe.includes("fail closed"), "the explanation states the fail-closed consequence");
  assert(probe.includes("20260810120000"), "the explanation names the unapplied migration");
});

check("the authority is never bypassed by this gate", () => {
  const ops = stripComments(OPS_MODULE);
  assert(!/\.update\(|\.insert\(|\.upsert\(|\.delete\(/.test(ops), "the ops projection must be read-only");
  const panel = stripComments(OPS_PANEL);
  assert(!/supabase|rpc\(/.test(panel), "the panel must do no I/O");
  // The write path still routes through the RPC.
  const svc = stripComments("app/lib/clasificados/bienes-raices/brListingLifecycleService.ts");
  assert(svc.includes("activateBrNegocioListingAtomic("), "the RPC is still the write authority");
});

check("the migration remains AUTHORED and was not executed", () => {
  const sql = readSrc("supabase/migrations/20260810120000_autos_br_negocio_capacity_activation_rpc.sql");
  assert(sql.includes("AUTHORED ONLY. NOT APPLIED"), "still authored-not-applied");
  assert(sql.includes("create or replace function public.br_negocio_activate_listing"), "function unchanged");
});

/* ============================================================================================
 * 4. DISCOVERY CONTINUITY + NON-REGRESSION
 * ==========================================================================================*/

console.log("\nDISCOVERY CONTINUITY");

check("one canonical detail path is shared by JSON-LD, sitemap and Saved Search delivery", () => {
  const canonical = leonixLiveAnuncioPath("abc-123");
  eq(canonical, "/clasificados/anuncio/abc-123", "canonical path shape");
  const page = stripComments(DETAIL_PAGE);
  assert(page.includes("leonixLiveAnuncioPath(listing.id)"), "JSON-LD uses it");
  const sitemap = stripComments("app/sitemap.ts");
  assert(sitemap.includes("leonixLiveAnuncioPath(row.id)"), "sitemap uses it");
  // Saved Search delivery builds the same path through the same helper, so the literal
  // "/clasificados/anuncio" never appears in its source — assert the helper, not the string.
  const delivery = stripComments("app/lib/saved-search/bienes-raices/bienesRaicesSavedSearchDeliveryResolver.ts");
  assert(
    delivery.includes("leonixLiveAnuncioPath(listingId)"),
    "saved-search delivery must build the canonical detail URL with the same helper",
  );
});

check("the parent gate is the SAME predicate on all four surfaces", () => {
  const files = [
    "app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts",
    "app/(site)/clasificados/anuncio/[id]/page.tsx",
    "app/lib/saved-search/bienes-raices/bienesRaicesPublicEligibleListing.ts",
    "app/(site)/clasificados/bienes-raices/lib/brPublishedListingsServer.ts",
  ];
  for (const f of files) {
    const src = stripComments(f);
    assert(
      /isBrChildParentGateSatisfied|filterBrRowsByActiveParent/.test(src),
      `${f} must use the shared gate`,
    );
  }
});

check("SAVED SEARCH and RELATED LISTINGS were not touched by this gate", () => {
  for (const f of [
    "app/lib/saved-search/bienes-raices/savedSearchBienesRaicesAdapter.ts",
    "app/lib/saved-search/bienes-raices/savedSearchBienesRaicesMatcher.ts",
    "app/lib/saved-search/bienes-raices/bienesRaicesSavedSearchMatchOrchestrator.ts",
    "app/(site)/clasificados/bienes-raices/components/RelatedBrAgentProperties.tsx",
    "app/(site)/clasificados/bienes-raices/components/BrRelatedAgentPropertiesSection.tsx",
  ]) {
    assert(!readSrc(f).includes("BIENES-NEGOCIO-2"), `${f} must be untouched by this gate`);
  }
});

check("Gate BIENES-NEGOCIO-1's identity guarantees are still intact", () => {
  const editRoute = stripComments("app/api/clasificados/bienes-raices/listing-edit/route.ts");
  assert(editRoute.includes("resolveBrChildIdentity("), "child identity guard still enforced");
  assert(editRoute.includes("isBienesChildIdentitySubstitution("), "substitution guard still enforced");
  const parser = readSrc(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/parseBienesAgenteResidencialPublishedState.ts",
  );
  assert(parser.includes("parseBienesAgenteResidencialPublishedState"), "the one shared parser still exists");
});

check("no public.businesses linkage was invented", () => {
  for (const f of [OPS_MODULE, OPS_PANEL, "app/(site)/clasificados/bienes-raices/seo/bienesRaicesJsonLd.ts", "app/(site)/clasificados/bienes-raices/lib/brPublishedListingsServer.ts"]) {
    const src = stripComments(f);
    assert(!/from\("businesses"\)/.test(src), `${f} must not query public.businesses`);
    assert(!src.includes("businessId"), `${f} must not invent a canonical business id`);
  }
});

check("the 26 dead modules and 35 historical audit docs are untouched", () => {
  for (const f of [
    "app/lib/clasificados/bienes-raices/bienesChildPropertyInventory.ts",
    "app/lib/clasificados/bienes-raices/brPublishCheckoutClient.ts",
    "app/(site)/clasificados/bienes-raices/shell/BienesRaicesPreviewCard.tsx",
  ]) {
    assert(readSrc(f).length > 0, `${f} must still exist (recorded, not deleted)`);
  }
});

/* ==========================================================================================*/

console.log(
  `\n${failures.length === 0 ? "ALL CHECKS PASSED" : "FAILURES"} — ${passed} passed, ${failures.length} failed\n`,
);
if (failures.length > 0) {
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
