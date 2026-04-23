/**
 * Rentas launch proof: browse contract + filters + persisted highlight slugs mapping (no live browser).
 * Run: npx tsx scripts/rentas-launch-selftest.ts
 */
import assert from "node:assert/strict";
import {
  LEONIX_DP_BRANCH,
  LEONIX_DP_CATEGORIA_PROPIEDAD,
  LEONIX_DP_HIGHLIGHT_SLUGS,
  LEONIX_DP_OPERATION,
  LEONIX_DP_PROMOTED,
} from "../app/(site)/clasificados/lib/leonixRealEstateListingContract";
import { selectRentasLandingRecientes } from "../app/(site)/clasificados/rentas/data/rentasSectionSelectors";
import { mapListingRowToRentasPublicListing } from "../app/(site)/clasificados/rentas/data/mapListingRowToRentasPublicListing";
import { rentasResultsFeatured, rentasResultsGridDemo } from "../app/(site)/clasificados/rentas/results/rentasResultsDemoData";
import { filterRentasPublicListings } from "../app/(site)/clasificados/rentas/shared/rentasBrowseFilters";
import { parseRentasBrowseParams, rentasBrowseHasActiveFilters } from "../app/(site)/clasificados/rentas/shared/rentasBrowseContract";

const demoPool = [rentasResultsFeatured, ...rentasResultsGridDemo];

function main() {
  const pPoolPiscina = parseRentasBrowseParams(new URLSearchParams("highlights=piscina&pool=1"));
  const filteredPool = filterRentasPublicListings(demoPool, pPoolPiscina);
  assert.ok(filteredPool.some((l) => l.id === "r-mty-1"), "pool + piscina highlight should match r-mty-1");

  const pKindCasa = parseRentasBrowseParams(new URLSearchParams("kind=casa"));
  const byKind = filterRentasPublicListings(demoPool, pKindCasa);
  assert.ok(byKind.length > 0);
  assert.ok(byKind.every((l) => l.resultsPropertyKind === "casa"));

  const pSubtype = parseRentasBrowseParams(new URLSearchParams("subtype=apartamento"));
  const bySub = filterRentasPublicListings(demoPool, pSubtype);
  assert.ok(bySub.some((l) => l.id === "r-cdmx-1"));

  const pMultiHl = parseRentasBrowseParams(new URLSearchParams("highlights=balcon,elevador"));
  const byHl = filterRentasPublicListings(demoPool, pMultiHl);
  assert.ok(byHl.some((l) => l.id === "r-cdmx-1"));

  assert.equal(rentasBrowseHasActiveFilters(parseRentasBrowseParams(new URLSearchParams("lat=19&lng=-99"))), false);

  const row = {
    id: "00000000-0000-4000-8000-000000000099",
    title: "Test renta",
    description: "d",
    city: "Testville",
    zip: "",
    category: "rentas",
    price: 1000,
    is_free: false,
    detail_pairs: [
      { label: LEONIX_DP_BRANCH, value: "rentas_privado" },
      { label: LEONIX_DP_OPERATION, value: "rent" },
      { label: LEONIX_DP_CATEGORIA_PROPIEDAD, value: "residencial" },
      { label: LEONIX_DP_HIGHLIGHT_SLUGS, value: "patio,terraza" },
    ],
    seller_type: "private",
    business_name: "",
    business_meta: "",
    status: "active",
    is_published: true,
    created_at: "2026-01-01T00:00:00.000Z",
    images: [],
    contact_phone: "",
    contact_email: "",
  };
  const mapped = mapListingRowToRentasPublicListing(row as never, "es");
  assert.ok(mapped);
  assert.deepEqual(mapped!.highlightSlugs, ["patio", "terraza"]);

  const boostedRow = {
    ...row,
    boost_expires: new Date(Date.now() + 86400000).toISOString(),
  };
  const boostedMap = mapListingRowToRentasPublicListing(boostedRow as never, "es");
  assert.ok(boostedMap?.promoted);
  assert.ok(boostedMap?.badges.includes("destacada"));

  const promotedPairRow = {
    ...row,
    id: "00000000-0000-4000-8000-000000000098",
    detail_pairs: [
      ...(row.detail_pairs as object[]),
      { label: LEONIX_DP_PROMOTED, value: "true" },
    ],
  };
  const pm = mapListingRowToRentasPublicListing(promotedPairRow as never, "es");
  assert.ok(pm?.promoted);
  assert.ok(pm?.badges.includes("destacada"));

  const priv = {
    ...rentasResultsFeatured,
    id: "rec-priv",
    branch: "privado" as const,
    publishedAt: "2026-01-02T00:00:00.000Z",
    browseActive: true,
  };
  const neg = {
    ...rentasResultsGridDemo[0]!,
    id: "rec-neg",
    branch: "negocio" as const,
    publishedAt: "2026-01-05T00:00:00.000Z",
    browseActive: true,
  };
  const rec = selectRentasLandingRecientes([priv, neg]);
  assert.equal(rec[0]?.id, "rec-neg");
  assert.equal(rec[1]?.id, "rec-priv");

  console.log("rentas-launch-selftest: OK");
}

main();
