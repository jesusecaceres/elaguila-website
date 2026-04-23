/**
 * Rentas field → public listing → browse filters contract (no DB).
 * Proves persisted-shaped `detail_pairs` + row fields map and are discoverable via URL contract.
 * Run: npx tsx scripts/rentas-field-contract-selftest.ts
 */
import assert from "node:assert/strict";
import {
  LEONIX_DP_BATHROOMS_COUNT,
  LEONIX_DP_BEDROOMS_COUNT,
  LEONIX_DP_BRANCH,
  LEONIX_DP_CATEGORIA_PROPIEDAD,
  LEONIX_DP_HIGHLIGHT_SLUGS,
  LEONIX_DP_OPERATION,
  LEONIX_DP_PARKING_SPOTS,
  LEONIX_DP_POOL,
  LEONIX_DP_POSTAL_CODE,
  LEONIX_DP_PROPERTY_SUBTYPE,
  LEONIX_DP_RESULTS_PROPERTY_KIND,
} from "../app/(site)/clasificados/lib/leonixRealEstateListingContract";
import { mapListingRowToRentasPublicListing } from "../app/(site)/clasificados/rentas/data/mapListingRowToRentasPublicListing";
import {
  RENTAS_DP_DEPOSIT_USD,
  RENTAS_DP_FURNISHED_CODE,
  RENTAS_DP_HALF_BATHS_COUNT,
  RENTAS_DP_LEASE_TERM,
  RENTAS_DP_LISTING_STATUS,
  RENTAS_DP_PETS_CODE,
} from "../app/(site)/clasificados/rentas/lib/rentasMachineDetailPairs";
import { parseRentasBrowseParams } from "../app/(site)/clasificados/rentas/shared/rentasBrowseContract";
import { filterRentasPublicListings } from "../app/(site)/clasificados/rentas/shared/rentasBrowseFilters";

function baseRow(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  const id = "00000000-0000-4000-8000-00000000ff01";
  const detail_pairs = [
    { label: LEONIX_DP_BRANCH, value: "rentas_privado" },
    { label: LEONIX_DP_OPERATION, value: "rent" },
    { label: LEONIX_DP_CATEGORIA_PROPIEDAD, value: "residencial" },
    { label: LEONIX_DP_BEDROOMS_COUNT, value: "3" },
    { label: LEONIX_DP_BATHROOMS_COUNT, value: "2" },
    { label: LEONIX_DP_POSTAL_CODE, value: "66220" },
    { label: LEONIX_DP_RESULTS_PROPERTY_KIND, value: "casa" },
    { label: LEONIX_DP_PROPERTY_SUBTYPE, value: "casa" },
    { label: LEONIX_DP_HIGHLIGHT_SLUGS, value: "terraza,jardin" },
    { label: LEONIX_DP_POOL, value: "true" },
    { label: LEONIX_DP_PARKING_SPOTS, value: "2" },
    { label: RENTAS_DP_DEPOSIT_USD, value: "1200" },
    { label: RENTAS_DP_LEASE_TERM, value: "12-meses" },
    { label: RENTAS_DP_LISTING_STATUS, value: "disponible" },
    { label: RENTAS_DP_HALF_BATHS_COUNT, value: "1" },
    { label: RENTAS_DP_FURNISHED_CODE, value: "amueblado" },
    { label: RENTAS_DP_PETS_CODE, value: "permitidas" },
    { label: "Superficie", value: "1650" },
  ];
  return {
    id,
    title: "Contract row",
    description: "Field contract selftest listing.",
    city: "San Pedro Contractville",
    zip: "66220",
    category: "rentas",
    price: 22000,
    is_free: false,
    detail_pairs,
    seller_type: "private",
    business_name: "",
    business_meta: "",
    status: "active",
    is_published: true,
    created_at: "2026-04-01T12:00:00.000Z",
    images: [],
    contact_phone: "+15555550111",
    contact_email: "contract@test.invalid",
    boost_expires: null,
    ...overrides,
  };
}

function main() {
  const row = baseRow();
  const mapped = mapListingRowToRentasPublicListing(row, "es");
  assert.ok(mapped, "maps rentas row");
  assert.equal(mapped!.rentMonthly, 22000);
  assert.equal(mapped!.depositUsd, 1200);
  assert.equal(mapped!.leaseTermCode, "12-meses");
  assert.equal(mapped!.halfBathsCount, 1);
  assert.equal(mapped!.parkingSpots, 2);
  assert.equal(mapped!.interiorSqftApprox, 1650);
  assert.equal(mapped!.amueblado, true);
  assert.equal(mapped!.mascotasPermitidas, true);
  assert.equal(mapped!.pool, true);
  assert.equal(mapped!.branch, "privado");
  assert.deepEqual(mapped!.highlightSlugs?.sort(), ["jardin", "terraza"]);
  assert.equal(mapped!.resultsPropertyKind, "casa");
  assert.equal((mapped!.propertySubtype ?? "").toLowerCase(), "casa");
  assert.equal(mapped!.postalCode, "66220");
  assert.equal(mapped!.browseActive, true);

  const list = [mapped!];

  const assertFinds = (qs: string, msg: string) => {
    const p = parseRentasBrowseParams(new URLSearchParams(qs));
    const f = filterRentasPublicListings(list, p);
    assert.ok(f.some((l) => l.id === mapped!.id), msg);
  };

  assertFinds(`city=${encodeURIComponent("San Pedro Contractville")}`, "city filter");
  assertFinds("zip=66220", "zip filter");
  assertFinds("rent_min=20000&rent_max=25000", "rent band");
  assertFinds("deposit_min=1000&deposit_max=1500", "deposit band");
  assertFinds("lease=12-meses", "lease term");
  assertFinds("baths_min=2", "baths min");
  assertFinds("half_baths_min=1", "half baths min");
  assertFinds("parking_min=2", "parking min");
  assertFinds("sqft_min=1600&sqft_max=1700", "sqft band");
  assertFinds("amueblado=1", "amueblado");
  assertFinds("mascotas=1", "mascotas");
  assertFinds("pool=1", "pool");
  assertFinds("highlights=terraza,jardin", "highlights AND");
  assertFinds("subtype=casa", "subtype");
  assertFinds("kind=casa", "results kind");
  assertFinds("branch=privado", "branch privado");
  assertFinds("recs=3", "min bedrooms recs");

  const negRow = baseRow({
    id: "00000000-0000-4000-8000-00000000ff02",
    seller_type: "business",
    business_name: "Inmo Contract",
    business_meta: JSON.stringify({
      negocioDescripcion: "Bio de prueba",
      negocioNombreCorreduria: "Marca X",
      negocioAgente: "Agente Y",
      negocioRedes: "@inmo",
    }),
    detail_pairs: (baseRow().detail_pairs as object[]).map((p) =>
      (p as { label: string }).label === LEONIX_DP_BRANCH ? { ...p, value: "rentas_negocio" } : p,
    ),
  });
  const negMap = mapListingRowToRentasPublicListing(negRow, "es");
  assert.ok(negMap);
  assert.equal(negMap!.branch, "negocio");
  const both = [mapped!, negMap!];
  const pNeg = parseRentasBrowseParams(new URLSearchParams("branch=negocio"));
  const negOnly = filterRentasPublicListings(both, pNeg);
  assert.ok(negOnly.every((l) => l.branch === "negocio"));
  assert.ok(negOnly.some((l) => l.id === negMap!.id));

  const rentado = baseRow({
    id: "00000000-0000-4000-8000-00000000ff03",
    detail_pairs: (baseRow().detail_pairs as object[]).map((p) =>
      (p as { label: string }).label === RENTAS_DP_LISTING_STATUS ? { ...p, value: "rentado" } : p,
    ),
  });
  const off = mapListingRowToRentasPublicListing(rentado, "es");
  assert.equal(off?.browseActive, false);

  console.log("rentas-field-contract-selftest: OK");
}

main();
