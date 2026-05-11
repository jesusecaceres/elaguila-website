/**
 * Rentas field → public listing → browse filters contract (no DB).
 * Proves persisted-shaped `detail_pairs` + row fields map and are discoverable via URL contract.
 * Run: npx tsx scripts/rentas-field-contract-selftest.ts
 */
import assert from "node:assert/strict";
import { parseLeonixImageUrlsFromDescription } from "../app/(site)/clasificados/lib/leonixListingGalleryMarker";
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
import { getRentasListingDetailExtra } from "../app/(site)/clasificados/rentas/listing/rentasListingDetailModel";
import { mapRentasListingToPrivadoPreviewVm } from "../app/(site)/clasificados/rentas/listing/mapRentasListingLiveToPreviewVm";
import {
  RENTAS_DP_DEPOSIT_USD,
  RENTAS_DP_FURNISHED_CODE,
  RENTAS_DP_HALF_BATHS_COUNT,
  RENTAS_DP_LEASE_CONDITIONS,
  RENTAS_DP_LEASE_TERM,
  RENTAS_DP_LISTING_STATUS,
  RENTAS_DP_PETS_CODE,
  RENTAS_DP_RENTAL_TYPE_CODE,
  RENTAS_DP_RENTAL_TYPE_CUSTOM,
  RENTAS_DP_ROOM_BATH_KIND,
  RENTAS_DP_ROOM_KITCHEN_KIND,
  RENTAS_DP_ROOM_MAX_OCC,
  RENTAS_DP_STORAGE_ACCESS_24H,
  RENTAS_DP_STORAGE_SECURITY,
  RENTAS_DP_VIDEO_URL,
} from "../app/(site)/clasificados/rentas/lib/rentasMachineDetailPairs";
import { parseRentasBrowseParams } from "../app/(site)/clasificados/rentas/shared/rentasBrowseContract";
import { filterRentasPublicListings } from "../app/(site)/clasificados/rentas/shared/rentasBrowseFilters";
import { buildRentasResultsCardSummaryEs } from "../app/(site)/clasificados/rentas/shared/rentasRentalTypeApply";
import { formatRentasTipoDeRentaDisplay } from "../app/(site)/clasificados/rentas/shared/rentasRentalTypeTaxonomy";
import { orderedRentasGallerySourcesForPublish } from "../app/(site)/clasificados/rentas/shared/rentasPublishFormHelpers";
import { mergePartialRentasPrivadoState } from "../app/(site)/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";

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

  assert.deepEqual(orderedRentasGallerySourcesForPublish(["a", "b", "c"], 1), ["b", "c", "a"]);
  assert.deepEqual(orderedRentasGallerySourcesForPublish(["x"], 99), ["x"]);

  const u1 = "https://cdn.example.com/rentas/parity-01.jpg";
  const u2 = "https://cdn.example.com/rentas/parity-02.jpg";
  const descWithMarker = `Body\n[LEONIX_IMAGES]\nurl=${u1}\nurl=${u2}\n[/LEONIX_IMAGES]\n`;
  assert.deepEqual(parseLeonixImageUrlsFromDescription(descWithMarker), [u1, u2]);

  const withGallery = baseRow({
    id: "00000000-0000-4000-8000-00000000ff10",
    images: [],
    description: `Field contract + gallery marker.\n${descWithMarker}`,
  });
  const mg = mapListingRowToRentasPublicListing(withGallery, "es");
  assert.ok(mg);
  assert.equal(mg!.imageUrl, u1, "cover from LEONIX_IMAGES when images column empty");
  assert.deepEqual(mg!.galleryUrls, [u1, u2]);

  const logoOnlyImages = baseRow({
    id: "00000000-0000-4000-8000-00000000ff11",
    images: ["/logo.png"],
    description: `Stale images column with logo only.\n${descWithMarker}`,
  });
  const recovered = mapListingRowToRentasPublicListing(logoOnlyImages, "es");
  assert.ok(recovered);
  assert.equal(recovered!.imageUrl, u1, "ignore placeholder images[] when description has LEONIX_IMAGES");
  assert.deepEqual(recovered!.galleryUrls, [u1, u2]);

  const pairsBase = baseRow().detail_pairs as Array<{ label: string; value: string }>;
  const mixedPhotosRow = baseRow({
    id: "00000000-0000-4000-8000-00000000ff12",
    images: ["https://cdn.example.com/aa.jpg", "/logo.png", "https://cdn.example.com/bb.jpg"],
    detail_pairs: [...pairsBase, { label: RENTAS_DP_VIDEO_URL, value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }],
  });
  const mMix = mapListingRowToRentasPublicListing(mixedPhotosRow, "es");
  assert.ok(mMix);
  const extraMix = getRentasListingDetailExtra(mMix!);
  const vmMix = mapRentasListingToPrivadoPreviewVm(mMix!, extraMix, "es");
  assert.deepEqual(vmMix.media.allPhotoUrls, ["https://cdn.example.com/aa.jpg", "https://cdn.example.com/bb.jpg"]);
  assert.equal(vmMix.media.heroUrl, "https://cdn.example.com/aa.jpg");
  assert.equal(vmMix.media.hasVideo1, true);
  const blobVideoRow = baseRow({
    id: "00000000-0000-4000-8000-00000000ff13",
    images: ["https://cdn.example.com/only.jpg"],
    detail_pairs: [...pairsBase, { label: RENTAS_DP_VIDEO_URL, value: "blob:http://local/abc" }],
  });
  const mBlob = mapListingRowToRentasPublicListing(blobVideoRow, "es");
  assert.ok(mBlob);
  const vmBlob = mapRentasListingToPrivadoPreviewVm(mBlob!, getRentasListingDetailExtra(mBlob!), "es");
  assert.equal(vmBlob.media.hasVideo1, false);

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

  assert.equal(formatRentasTipoDeRentaDisplay("otro", "  Casita de invitados  "), "Casita de invitados");
  assert.equal(formatRentasTipoDeRentaDisplay("otro", ""), "Otro");

  const legacyMerge = mergePartialRentasPrivadoState({ titulo: "Borrador mínimo" });
  assert.equal(legacyMerge.titulo, "Borrador mínimo");
  assert.equal(typeof legacyMerge.tipoDeRenta, "string");

  const pairsRoom = [
    ...pairsBase,
    { label: RENTAS_DP_RENTAL_TYPE_CODE, value: "cuarto_recamara" },
    { label: RENTAS_DP_LEASE_CONDITIONS, value: "No fumar en áreas comunes." },
    { label: RENTAS_DP_ROOM_BATH_KIND, value: "compartido" },
    { label: RENTAS_DP_ROOM_KITCHEN_KIND, value: "compartida" },
    { label: RENTAS_DP_ROOM_MAX_OCC, value: "1" },
  ];
  const roomRow = baseRow({
    id: "00000000-0000-4000-8000-00000000ff20",
    detail_pairs: pairsRoom,
  });
  const roomListing = mapListingRowToRentasPublicListing(roomRow, "es");
  assert.ok(roomListing);
  assert.equal(roomListing!.rentalTypeCode, "cuarto_recamara");
  assert.equal(roomListing!.leaseConditions, "No fumar en áreas comunes.");
  assert.equal(roomListing!.rentasRoomBathLabel, "compartido");
  const roomCard = buildRentasResultsCardSummaryEs(roomListing!);
  assert.ok(roomCard.includes("Baño compartido"), roomCard);
  assert.ok(roomCard.includes("Cocina compartida"), roomCard);
  assert.ok(roomCard.includes("Máx. 1 persona"), roomCard);

  const pairsGarage = [
    ...pairsBase.map((p) =>
      (p as { label: string }).label === LEONIX_DP_BEDROOMS_COUNT ? { ...p, value: "0" } : p,
    ),
    { label: RENTAS_DP_RENTAL_TYPE_CODE, value: "garaje" },
    { label: RENTAS_DP_STORAGE_ACCESS_24H, value: "si" },
    { label: RENTAS_DP_STORAGE_SECURITY, value: "si" },
  ];
  const garageRow = baseRow({
    id: "00000000-0000-4000-8000-00000000ff21",
    detail_pairs: pairsGarage,
  });
  const garageListing = mapListingRowToRentasPublicListing(garageRow, "es");
  assert.ok(garageListing);
  const gCard = buildRentasResultsCardSummaryEs(garageListing!);
  assert.ok(!gCard.includes("rec"), gCard);
  assert.ok(gCard.includes("Acceso 24/7"), gCard);

  const pairsOtro = [
    ...pairsBase,
    { label: RENTAS_DP_RENTAL_TYPE_CODE, value: "otro" },
    { label: RENTAS_DP_RENTAL_TYPE_CUSTOM, value: "Vagoneta RV" },
  ];
  const otroListing = mapListingRowToRentasPublicListing(
    baseRow({ id: "00000000-0000-4000-8000-00000000ff22", detail_pairs: pairsOtro }),
    "es",
  );
  assert.ok(otroListing);
  assert.equal(otroListing!.rentalTypeCode, "otro");
  assert.equal(otroListing!.rentalTypeCustom, "Vagoneta RV");

  console.log("rentas-field-contract-selftest: OK");
}

main();
