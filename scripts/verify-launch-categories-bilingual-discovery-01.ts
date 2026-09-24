/**
 * WAVE 4 — LAUNCH CATEGORIES BILINGUAL DISCOVERY ADOPTION (2026-09-24).
 *
 * Doctrine (same as Servicios ⚠️38A): every published listing belongs to ONE language-neutral inventory.
 * The query is resolved to canonical concepts (ids the row already persists) with deterministic ES/EN
 * labels + aliases; authored / viewer / page language never changes membership; no translation call.
 *
 * Execution-first: the REAL category filters (Rentas, Bienes Raíces, Restaurantes, Autos, Empleos,
 * Comida Local) run against Spanish- and English-authored synthetic rows of the same canonical concepts,
 * queried in both directions. Source guards pin the no-network / no-translate / no-server-only rule and
 * the absence of a new migration.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-launch-categories-bilingual-discovery-01.ts
 */
import { strict as assert } from "node:assert";
import { execSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { compileCatalogDiscoveryQuery } from "../app/lib/clasificados/discovery/catalogDiscovery";
import { buildBilingualSearchDocument } from "../app/lib/clasificados/discovery/bilingualSearchDocument";
import { conceptKey } from "../app/lib/clasificados/discovery/canonicalTaxonomyAdapter";
import { rentasDiscoveryAdapter } from "../app/lib/clasificados/discovery/adapters/rentasDiscoveryAdapter";
import { brDiscoveryAdapter } from "../app/lib/clasificados/discovery/adapters/brDiscoveryAdapter";
import { restaurantesBlueprintDiscoveryAdapter, restaurantesResultsDiscoveryAdapter, filterRestaurantesResultsRowsByKeyword } from "../app/lib/clasificados/discovery/adapters/restaurantesDiscoveryAdapter";
import { autosDiscoveryAdapter } from "../app/lib/clasificados/discovery/adapters/autosDiscoveryAdapter";
import { empleosDiscoveryAdapter } from "../app/lib/clasificados/discovery/adapters/empleosDiscoveryAdapter";
import { comidaLocalDiscoveryAdapter } from "../app/lib/clasificados/discovery/adapters/comidaLocalDiscoveryAdapter";
import { filterRentasPublicListings } from "../app/(site)/clasificados/rentas/shared/rentasBrowseFilters";
import { parseRentasBrowseParams } from "../app/(site)/clasificados/rentas/shared/rentasBrowseContract";
import { filterBrListings } from "../app/(site)/clasificados/bienes-raices/resultados/lib/brResultsFilters";
import { parseBrResultsUrl } from "../app/(site)/clasificados/bienes-raices/resultados/lib/brResultsUrlState";
import { filterRestaurantesBlueprintRows } from "../app/(site)/clasificados/restaurantes/lib/filterRestaurantesBlueprintRows";
import { parseRestaurantesResultsSearchParams } from "../app/(site)/clasificados/restaurantes/lib/restaurantesDiscoveryContract";
import { applyAutosPublicFilters } from "../app/(site)/clasificados/autos/components/public/autosPublicFilters";
import { emptyAutosPublicFilters } from "../app/(site)/clasificados/autos/filters/autosPublicFilterTypes";
import { filterEmpleosJobs, parseEmpleosResultsQuery } from "../app/(site)/clasificados/empleos/lib/empleosResultsQuery";
import { filterComidaLocalPublicRows } from "../app/lib/clasificados/comida-local/comidaLocalPublicFilter";
import type { RentasPublicListing } from "../app/(site)/clasificados/rentas/model/rentasPublicListing";
import type { BrNegocioListing } from "../app/(site)/clasificados/bienes-raices/resultados/cards/listingTypes";
import type { RestaurantesPublicBlueprintRow } from "../app/(site)/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import type { RestaurantePublicResultsRow } from "../app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingMapper";
import type { AutosPublicListing } from "../app/(site)/clasificados/autos/data/autosPublicSampleTypes";
import type { EmpleosJobRecord } from "../app/(site)/clasificados/empleos/data/empleosJobTypes";
import type { ComidaLocalPublicListingRow } from "../app/lib/clasificados/comida-local/comidaLocalPublicTypes";

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
const ids = <T extends { id: string }>(rows: T[]) => rows.map((r) => r.id).sort();

/* ==============================================================================================
 * Fixtures — the SAME canonical concepts authored in Spanish and in English.
 * ============================================================================================ */

// ---- Rentas ------------------------------------------------------------------------------------
function rentas(o: Partial<RentasPublicListing> & { id: string; title: string }): RentasPublicListing {
  return {
    imageUrl: "",
    rentDisplay: "$1,800",
    rentMonthly: 1800,
    addressLine: "Fresno, CA",
    city: "Fresno",
    stateRegion: "CA",
    postalCode: "93701",
    beds: "3",
    baths: "2",
    sqft: "1200",
    categoriaPropiedad: "residencial",
    branch: "privado",
    badges: [],
    ...o,
  } as RentasPublicListing;
}
const rEsCasa = rentas({ id: "r-es-casa", title: "Casa en renta cerca de la escuela", rentalTypeCode: "casa", description: { es: "Casa amplia con patio.", en: "" } as never });
const rEnHouse = rentas({ id: "r-en-house", title: "Bright house near downtown", rentalTypeCode: "casa", description: { es: "", en: "Bright house with a yard." } as never });
const rEsApto = rentas({ id: "r-es-apto", title: "Apartamento amplio", rentalTypeCode: "apartamento" });
const rEnApt = rentas({ id: "r-en-apt", title: "Sunny apartment", rentalTypeCode: "apartamento" });
const rEsCuarto = rentas({ id: "r-es-cuarto", title: "Cuarto individual con baño", rentalTypeCode: "cuarto_recamara" });
const rEnOffice = rentas({ id: "r-en-office", title: "Downtown office suite", rentalTypeCode: "oficina", categoriaPropiedad: "comercial" });
const rOtherCity = rentas({ id: "r-other-city", title: "Casa en renta", rentalTypeCode: "casa", city: "Modesto", addressLine: "Modesto, CA", postalCode: "95350" });
const RENTAS_ROWS = [rEsCasa, rEnHouse, rEsApto, rEnApt, rEsCuarto, rEnOffice, rOtherCity];
const rentasFilter = (q: string, extra: Record<string, string> = {}, lang = "es") =>
  ids(filterRentasPublicListings(RENTAS_ROWS, parseRentasBrowseParams(new URLSearchParams({ q, lang, ...extra }))));

// ---- Bienes Raíces -----------------------------------------------------------------------------
function br(o: Partial<BrNegocioListing> & { id: string; title: string }): BrNegocioListing {
  return {
    imageUrl: "",
    price: "$450,000",
    addressLine: "Fresno, CA",
    beds: "3",
    baths: "2",
    sqft: "1500",
    categoriaPropiedad: "residencial",
    badges: [],
    advertiser: { kind: "agente", name: "Agente Demo" },
    ...o,
  } as BrNegocioListing;
}
const bEsRent = br({ id: "b-es-rent", title: "Casa en renta en Fresno", operationLabel: "Renta", resultsPropertyKind: "casa" });
const bEnRent = br({ id: "b-en-rent", title: "House for rent in Fresno", operationLabel: "Renta", resultsPropertyKind: "casa" });
const bEsSale = br({ id: "b-es-sale", title: "Casa en venta", operationLabel: "Venta", resultsPropertyKind: "casa" });
const bEnSale = br({ id: "b-en-sale", title: "House for sale", operationLabel: "Venta", resultsPropertyKind: "casa" });
const bEsApto = br({ id: "b-es-apto", title: "Departamento en renta", operationLabel: "Renta", resultsPropertyKind: "departamento" });
const bEsTerreno = br({ id: "b-es-land", title: "Terreno con vista", operationLabel: "Venta", categoriaPropiedad: "terreno_lote", resultsPropertyKind: "terreno" });
const bOtherCity = br({ id: "b-other-city", title: "Casa en renta", operationLabel: "Renta", resultsPropertyKind: "casa", addressLine: "Modesto, CA" });
const BR_ROWS = [bEsRent, bEnRent, bEsSale, bEnSale, bEsApto, bEsTerreno, bOtherCity];
const brFilter = (q: string, extra: Record<string, string> = {}, lang = "es") =>
  ids(filterBrListings(BR_ROWS, parseBrResultsUrl(new URLSearchParams({ q, lang, ...extra })), null));

// ---- Restaurantes ------------------------------------------------------------------------------
function rb(o: Partial<RestaurantesPublicBlueprintRow> & { id: string; name: string; primaryCuisineKey: string }): RestaurantesPublicBlueprintRow {
  return {
    slug: o.id,
    cuisineLine: "",
    city: "Fresno",
    zip: "93701",
    rating: 4.2,
    priceLevel: "$$",
    imageSrc: "",
    serviceModes: ["dine_in"],
    familyFriendly: false,
    promoted: false,
    openNowDemo: false,
    veganOptions: false,
    glutenFreeOptions: false,
    halalCuisine: false,
    listedAt: "2026-09-01T00:00:00.000Z",
    state: "CA",
    ...o,
  } as RestaurantesPublicBlueprintRow;
}
const rbEsMariscos = rb({ id: "rb-es-mariscos", name: "Mariscos El Puerto", primaryCuisineKey: "seafood", cuisineLine: "Mariscos frescos" });
const rbEnSeafood = rb({ id: "rb-en-seafood", name: "Harbor Grill", primaryCuisineKey: "seafood", cuisineLine: "Fresh seafood" });
const rbTacos = rb({ id: "rb-tacos", name: "Taqueria Lupita", primaryCuisineKey: "mexican", cuisineLine: "Tacos y birria" });
const rbPizza = rb({ id: "rb-pizza", name: "Napoli Pizza", primaryCuisineKey: "pizza" });
const rbBakery = rb({ id: "rb-bakery", name: "La Espiga", primaryCuisineKey: "dessert", cuisineLine: "Panadería y repostería" });
const rbApos = rb({ id: "rb-apos", name: "Chuy's Diner", primaryCuisineKey: "american" });
const rbOtherCity = rb({ id: "rb-other-city", name: "Mariscos Modesto", primaryCuisineKey: "seafood", city: "Modesto", zip: "95350" });
const RB_ROWS = [rbEsMariscos, rbEnSeafood, rbTacos, rbPizza, rbBakery, rbApos, rbOtherCity];
const restFilter = (q: string, extra: Record<string, string> = {}, lang = "es") =>
  ids(filterRestaurantesBlueprintRows(RB_ROWS, parseRestaurantesResultsSearchParams(new URLSearchParams({ q, lang, ...extra }))));

function rr(o: Partial<RestaurantePublicResultsRow> & { id: string; businessName: string; primaryCuisineKey: string }): RestaurantePublicResultsRow {
  return {
    slug: o.id,
    businessTypeKey: "restaurant",
    cityCanonical: "Fresno",
    serviceModeKeys: [],
    highlightKeys: [],
    movingVendor: false,
    homeBasedBusiness: false,
    foodTruck: false,
    popUp: false,
    summaryShort: "",
    listedAt: "2026-09-01T00:00:00.000Z",
    ...o,
  } as RestaurantePublicResultsRow;
}
const rrEs = rr({ id: "rr-es", businessName: "Mariscos La Costa", primaryCuisineKey: "seafood", summaryShort: "Ceviche y camarones" });
const rrEn = rr({ id: "rr-en", businessName: "Bay Catch", primaryCuisineKey: "seafood", summaryShort: "Fresh fish and shrimp" });
const rrPizza = rr({ id: "rr-pizza", businessName: "Napoli Pizza", primaryCuisineKey: "pizza" });
const RR_ROWS = [rrEs, rrEn, rrPizza];

// ---- Autos -------------------------------------------------------------------------------------
function auto(o: Partial<AutosPublicListing> & { id: string; make: string; model: string; bodyStyle: string }): AutosPublicListing {
  return {
    sellerType: "dealer",
    featured: false,
    year: 2020,
    vehicleTitle: `${o.make} ${o.model}`,
    price: 25000,
    mileage: 40000,
    city: "Fresno",
    state: "CA",
    transmission: "Automatic",
    drivetrain: "4WD",
    fuelType: "Gasoline",
    condition: "used",
    primaryImageUrl: "",
    ...o,
  } as AutosPublicListing;
}
const aTruckEn = auto({ id: "a-truck-en", make: "Ford", model: "F-150", bodyStyle: "Truck", vehicleTitle: "2020 Ford F-150 XLT" });
const aPickupEs = auto({ id: "a-pickup-es", make: "Toyota", model: "Tacoma", bodyStyle: "Pickup", sellerType: "private", vehicleTitle: "2020 Toyota Tacoma" });
const aSedanEs = auto({ id: "a-sedan-es", make: "Honda", model: "Civic", bodyStyle: "Sedán", vehicleTitle: "2020 Honda Civic" });
const aSedanEn = auto({ id: "a-sedan-en", make: "Toyota", model: "Camry", bodyStyle: "Sedan", condition: "new", vehicleTitle: "2024 Toyota Camry" });
const aSuv = auto({ id: "a-suv", make: "Nissan", model: "Rogue", bodyStyle: "SUV", fuelType: "Hybrid", vehicleTitle: "2021 Nissan Rogue" });
const aOtherCity = auto({ id: "a-other-city", make: "Ford", model: "Ranger", bodyStyle: "Pickup", city: "Modesto", vehicleTitle: "2019 Ford Ranger" });
const AUTO_ROWS = [aTruckEn, aPickupEs, aSedanEs, aSedanEn, aSuv, aOtherCity];
const autosFilter = (q: string, city = "") => ids(applyAutosPublicFilters(AUTO_ROWS, { ...emptyAutosPublicFilters(), city }, q));

// ---- Empleos -----------------------------------------------------------------------------------
function job(o: Partial<EmpleosJobRecord> & { id: string; title: string; category: string }): EmpleosJobRecord {
  return {
    slug: o.id,
    company: "Demo Co",
    city: "Fresno",
    state: "CA",
    modality: "presencial",
    jobType: "tiempo-completo",
    salaryMin: 16,
    salaryMax: 20,
    salaryLabel: "$16-$20/h",
    experience: "entry",
    companyType: "small",
    quickApply: false,
    publishedAt: "2026-09-20T00:00:00.000Z",
    listingTier: "standard",
    verifiedEmployer: false,
    premiumEmployer: false,
    companyInitials: "DC",
    imageSrc: "",
    imageAlt: "",
    summary: "",
    description: "",
    requirements: [],
    benefits: [],
    benefitChips: [],
    showOnLandingFeatured: false,
    showOnLandingRecent: false,
    ...o,
  } as EmpleosJobRecord;
}
const jEsCocinero = job({ id: "j-es-cocinero", title: "Cocinero para restaurante", category: "restaurante" });
const jEnCook = job({ id: "j-en-cook", title: "Line Cook", category: "restaurante", description: "Busy kitchen." });
const jEsChofer = job({ id: "j-es-chofer", title: "Chofer de reparto", category: "transporte" });
const jEnDriver = job({ id: "j-en-driver", title: "Delivery Driver", category: "transporte", jobType: "medio-tiempo" });
const jEsLimpieza = job({ id: "j-es-limpieza", title: "Personal de limpieza", category: "limpieza" });
const jEnJanitor = job({ id: "j-en-janitor", title: "Night Janitor", category: "limpieza", jobType: "turno-nocturno" });
const jSales = job({ id: "j-sales", title: "Store Associate", category: "ventas" });
const jOtherCity = job({ id: "j-other-city", title: "Cook", category: "restaurante", city: "Modesto" });
const JOB_ROWS = [jEsCocinero, jEnCook, jEsChofer, jEnDriver, jEsLimpieza, jEnJanitor, jSales, jOtherCity];
const jobsFilter = (q: string, extra: Record<string, string> = {}) =>
  ids(filterEmpleosJobs(JOB_ROWS, parseEmpleosResultsQuery(new URLSearchParams({ q, ...extra })), Date.parse("2026-09-24T00:00:00.000Z")));

// ---- Comida Local ------------------------------------------------------------------------------
function cl(o: Partial<ComidaLocalPublicListingRow> & { id: string; business_name: string; food_type: string }): ComidaLocalPublicListingRow {
  return {
    slug: o.id,
    leonix_ad_id: null,
    status: "published",
    package_tier: "free",
    payment_status: "paid",
    published_at: "2026-09-01T00:00:00.000Z",
    food_type_custom: null,
    city_canonical: "fresno",
    city_display: "Fresno",
    zone_note: null,
    que_vendes: "",
    service_options: [],
    price_level: null,
    listing_json: null,
    ...o,
  } as unknown as ComidaLocalPublicListingRow;
}
const cEsMariscos = cl({ id: "c-es-mariscos", business_name: "Mariscos Doña Rosa", food_type: "mariscos", que_vendes: "Cocteles de camarón" });
const cEnSeafood = cl({ id: "c-en-seafood", business_name: "Bay Seafood Stand", food_type: "mariscos", que_vendes: "Fresh shrimp cocktails" });
const cTacos = cl({ id: "c-tacos", business_name: "Tacos El Güero", food_type: "tacos" });
const cPostres = cl({ id: "c-postres", business_name: "Dulce Hogar", food_type: "postres", que_vendes: "Pasteles y flanes" });
const cOtherCity = cl({ id: "c-other-city", business_name: "Mariscos Modesto", food_type: "mariscos", city_canonical: "modesto", city_display: "Modesto" });
const CL_ROWS = [cEsMariscos, cEnSeafood, cTacos, cPostres, cOtherCity];
const clFilter = (q: string, city = "") => ids(filterComidaLocalPublicRows(CL_ROWS, { q, city, foodType: "", service: "", priceLevel: "" }));

/* ==============================================================================================
 * 1. Rentas
 * ============================================================================================ */
check("Rentas: 'house for rent' <-> 'casa en renta' return the same house rentals regardless of authored language", () => {
  const expected = ["r-en-house", "r-es-casa", "r-other-city"];
  assert.deepEqual(rentasFilter("house for rent"), expected);
  assert.deepEqual(rentasFilter("casa en renta"), expected);
  assert.deepEqual(rentasFilter("Casa en Renta"), expected);
  assert.deepEqual(rentasFilter("home for rent"), expected);
});
check("Rentas: property-type concepts cross languages (apartment <-> apartamento/departamento, room <-> cuarto, office <-> oficina)", () => {
  assert.deepEqual(rentasFilter("apartment"), ["r-en-apt", "r-es-apto"]);
  assert.deepEqual(rentasFilter("apartamento"), ["r-en-apt", "r-es-apto"]);
  assert.deepEqual(rentasFilter("departamento"), ["r-en-apt", "r-es-apto"]);
  assert.ok(rentasFilter("room for rent").includes("r-es-cuarto"));
  assert.deepEqual(rentasFilter("cuarto"), ["r-es-cuarto"]);
  assert.deepEqual(rentasFilter("oficina"), ["r-en-office"]);
  assert.deepEqual(rentasFilter("office"), ["r-en-office"]);
});
check("Rentas: literal fallback intact (owner text / title substring, accent-insensitive)", () => {
  assert.deepEqual(rentasFilter("downtown"), ["r-en-house", "r-en-office"].sort());
  assert.deepEqual(rentasFilter("ESCUELA"), ["r-es-casa"]);
  assert.deepEqual(rentasFilter("yard"), ["r-en-house"]);
  assert.deepEqual(rentasFilter("zzz-no-such-thing"), []);
});
check("Rentas: page language does not change results; structured city/zip filters stay separate and narrow", () => {
  assert.deepEqual(rentasFilter("house for rent", {}, "en"), rentasFilter("house for rent", {}, "es"));
  assert.deepEqual(rentasFilter("casa en renta", {}, "en"), rentasFilter("casa en renta", {}, "es"));
  assert.deepEqual(rentasFilter("house for rent", { city: "Modesto" }), ["r-other-city"]);
  assert.deepEqual(rentasFilter("casa en renta", { city: "Fresno" }), ["r-en-house", "r-es-casa"]);
});

/* ==============================================================================================
 * 2. Bienes Raíces (Negocio + shared results)
 * ============================================================================================ */
check("BR: 'house for rent' <-> 'casa en renta' (operation + property type) regardless of authored language", () => {
  const expected = ["b-en-rent", "b-es-rent", "b-other-city"];
  assert.deepEqual(brFilter("house for rent"), expected);
  assert.deepEqual(brFilter("casa en renta"), expected);
});
check("BR: 'house for sale' <-> 'casa en venta'; sale and rent do not bleed into each other", () => {
  const expected = ["b-en-sale", "b-es-sale"];
  assert.deepEqual(brFilter("house for sale"), expected);
  assert.deepEqual(brFilter("casa en venta"), expected);
  assert.ok(!brFilter("casa en venta").includes("b-es-rent"));
});
check("BR: apartment <-> departamento, land <-> terreno", () => {
  assert.deepEqual(brFilter("apartment"), ["b-es-apto"]);
  assert.deepEqual(brFilter("departamento"), ["b-es-apto"]);
  assert.deepEqual(brFilter("land"), ["b-es-land"]);
  assert.deepEqual(brFilter("terreno"), ["b-es-land"]);
});
check("BR: page language irrelevant; structured city filter still narrows", () => {
  assert.deepEqual(brFilter("house for rent", {}, "en"), brFilter("house for rent", {}, "es"));
  assert.deepEqual(brFilter("house for rent", { city: "Modesto" }), ["b-other-city"]);
});

/* ==============================================================================================
 * 3. Restaurantes
 * ============================================================================================ */
check("Restaurantes: 'seafood' <-> 'mariscos' return every seafood listing whichever language authored it", () => {
  const expected = ["rb-en-seafood", "rb-es-mariscos", "rb-other-city"];
  assert.deepEqual(restFilter("seafood"), expected);
  assert.deepEqual(restFilter("mariscos"), expected);
  assert.deepEqual(restFilter("MARISCOS"), expected);
});
check("Restaurantes: dish / venue aliases map onto existing cuisine keys (tacos, panadería <-> bakery, pizza)", () => {
  assert.ok(restFilter("tacos").includes("rb-tacos"));
  assert.deepEqual(restFilter("bakery"), ["rb-bakery"]);
  assert.deepEqual(restFilter("panaderia"), ["rb-bakery"]);
  assert.deepEqual(restFilter("panadería"), ["rb-bakery"]);
  assert.deepEqual(restFilter("pizza"), ["rb-pizza"]);
  assert.deepEqual(restFilter("mexicana"), ["rb-tacos"]);
  assert.deepEqual(restFilter("mexican"), ["rb-tacos"]);
});
check("Restaurantes: literal fallback preserved, including apostrophe folding (Chuys <-> Chuy's)", () => {
  assert.deepEqual(restFilter("Chuys"), ["rb-apos"]);
  assert.deepEqual(restFilter("Chuy's"), ["rb-apos"]);
  assert.deepEqual(restFilter("Lupita"), ["rb-tacos"]);
  assert.deepEqual(restFilter("zzz-no-such-thing"), []);
});
check("Restaurantes: page language irrelevant; city facet still narrows", () => {
  assert.deepEqual(restFilter("seafood", {}, "en"), restFilter("seafood", {}, "es"));
  assert.deepEqual(restFilter("mariscos", {}, "en"), restFilter("mariscos", {}, "es"));
  assert.deepEqual(restFilter("seafood", { city: "Modesto" }), ["rb-other-city"]);
});
check("Restaurantes: client results rows use the same bilingual keyword (seafood <-> mariscos)", () => {
  const es = ids(filterRestaurantesResultsRowsByKeyword(RR_ROWS, "mariscos"));
  const en = ids(filterRestaurantesResultsRowsByKeyword(RR_ROWS, "seafood"));
  assert.deepEqual(es, ["rr-en", "rr-es"]);
  assert.deepEqual(en, es);
  assert.deepEqual(ids(filterRestaurantesResultsRowsByKeyword(RR_ROWS, "ceviche")), ["rr-en", "rr-es"]); // alias of the seafood concept
  assert.deepEqual(ids(filterRestaurantesResultsRowsByKeyword(RR_ROWS, "catch")), ["rr-en"]); // literal fallback
  assert.equal(filterRestaurantesResultsRowsByKeyword(RR_ROWS, "").length, RR_ROWS.length);
});

/* ==============================================================================================
 * 4. Autos
 * ============================================================================================ */
check("Autos: 'truck' <-> 'camioneta' <-> 'pickup' (body style recovered from the stored display string)", () => {
  assert.deepEqual(autosFilter("truck"), ["a-other-city", "a-pickup-es", "a-truck-en"]);
  assert.deepEqual(autosFilter("pickup"), ["a-other-city", "a-pickup-es", "a-truck-en"]);
  const camioneta = autosFilter("camioneta");
  for (const id of ["a-other-city", "a-pickup-es", "a-truck-en"]) assert.ok(camioneta.includes(id), `camioneta must include ${id}`);
  assert.ok(!autosFilter("truck").includes("a-sedan-es"));
});
check("Autos: 'sedan' <-> 'sedán' (accent fold) and English/Spanish sedan rows both found", () => {
  assert.deepEqual(autosFilter("sedan"), ["a-sedan-en", "a-sedan-es"]);
  assert.deepEqual(autosFilter("sedán"), ["a-sedan-en", "a-sedan-es"]);
  assert.deepEqual(autosFilter("suv"), ["a-suv"].concat(autosFilter("suv").filter((i) => i !== "a-suv")).sort());
  assert.ok(autosFilter("suv").includes("a-suv"));
});
check("Autos: condition / seller concepts cross languages (used <-> usado, new <-> nuevo, dealer <-> concesionario, private <-> privado)", () => {
  assert.equal(autosFilter("nuevo").join(), "a-sedan-en");
  assert.equal(autosFilter("new").join(), "a-sedan-en");
  assert.ok(autosFilter("usado").includes("a-truck-en") && !autosFilter("usado").includes("a-sedan-en"));
  assert.deepEqual(autosFilter("usado"), autosFilter("used"));
  assert.deepEqual(autosFilter("private"), ["a-pickup-es"]);
  assert.deepEqual(autosFilter("privado"), ["a-pickup-es"]);
  assert.ok(autosFilter("concesionario").includes("a-truck-en") && !autosFilter("concesionario").includes("a-pickup-es"));
  assert.deepEqual(autosFilter("hybrid"), ["a-suv"]);
  assert.deepEqual(autosFilter("hibrido"), ["a-suv"]);
});
check("Autos: composite queries AND their concepts; makes and models stay literal", () => {
  assert.deepEqual(autosFilter("used truck"), ["a-other-city", "a-pickup-es", "a-truck-en"]);
  assert.deepEqual(autosFilter("camioneta usada Ford"), ["a-other-city", "a-truck-en"]);
  assert.deepEqual(autosFilter("Toyota"), ["a-pickup-es", "a-sedan-en"]);
  assert.deepEqual(autosFilter("F-150"), ["a-truck-en"]);
  assert.deepEqual(autosFilter("zzz-no-such-thing"), []);
});
check("Autos: structured city filter is separate and still narrows", () => {
  assert.deepEqual(autosFilter("truck", "Modesto"), ["a-other-city"]);
});

/* ==============================================================================================
 * 5. Empleos
 * ============================================================================================ */
check("Empleos: 'cook' <-> 'cocinero' <-> 'chef' (category code restaurante) whichever language authored the title", () => {
  const expected = ["j-en-cook", "j-es-cocinero", "j-other-city"];
  assert.deepEqual(jobsFilter("cook"), expected);
  assert.deepEqual(jobsFilter("cocinero"), expected);
  assert.deepEqual(jobsFilter("cocinera"), expected);
});
check("Empleos: driver <-> chofer, cleaning <-> limpieza <-> janitor, sales <-> ventas", () => {
  assert.deepEqual(jobsFilter("driver"), ["j-en-driver", "j-es-chofer"]);
  assert.deepEqual(jobsFilter("chofer"), ["j-en-driver", "j-es-chofer"]);
  assert.deepEqual(jobsFilter("janitor"), ["j-en-janitor", "j-es-limpieza"]);
  assert.deepEqual(jobsFilter("limpieza"), ["j-en-janitor", "j-es-limpieza"]);
  assert.deepEqual(jobsFilter("cleaning"), ["j-en-janitor", "j-es-limpieza"]);
  assert.ok(jobsFilter("ventas").includes("j-sales"));
  assert.deepEqual(jobsFilter("sales"), jobsFilter("ventas"));
  assert.ok(jobsFilter("cashier").includes("j-sales"));
  assert.ok(jobsFilter("cajero").includes("j-sales"));
});
check("Empleos: job type words cross languages (part time <-> medio tiempo, night shift <-> turno nocturno)", () => {
  assert.deepEqual(jobsFilter("part time"), ["j-en-driver"]);
  assert.deepEqual(jobsFilter("medio tiempo"), ["j-en-driver"]);
  assert.deepEqual(jobsFilter("night shift"), ["j-en-janitor"]);
  assert.deepEqual(jobsFilter("turno nocturno"), ["j-en-janitor"]);
});
check("Empleos: category / jobType facets stay raw exact codes; location facet still narrows", () => {
  assert.deepEqual(jobsFilter("cook", { category: "restaurante", city: "Modesto" }), ["j-other-city"]);
  assert.deepEqual(jobsFilter("", { category: "transporte" }), ["j-en-driver", "j-es-chofer"]);
  assert.deepEqual(jobsFilter("cocinero", { jobType: "medio-tiempo" }), []);
});

/* ==============================================================================================
 * 6. Comida Local
 * ============================================================================================ */
check("Comida Local: 'seafood' <-> 'mariscos' return both stands whichever language authored them", () => {
  const expected = ["c-en-seafood", "c-es-mariscos", "c-other-city"];
  assert.deepEqual(clFilter("seafood"), expected);
  assert.deepEqual(clFilter("mariscos"), expected);
  assert.deepEqual(clFilter("MARISCOS"), expected);
});
check("Comida Local: aliases map onto existing food_type ids (bakery/pastel -> postres, birria -> tacos)", () => {
  assert.deepEqual(clFilter("dessert"), ["c-postres"]);
  assert.deepEqual(clFilter("postres"), ["c-postres"]);
  assert.deepEqual(clFilter("bakery"), ["c-postres"]);
  assert.ok(clFilter("birria").includes("c-tacos"));
  assert.deepEqual(clFilter("tacos"), ["c-tacos"]);
});
check("Comida Local: owner text stays searchable in its original language; city facet still narrows", () => {
  assert.deepEqual(clFilter("flanes"), ["c-postres"]);
  assert.deepEqual(clFilter("zzz-no-such-thing"), []);
  assert.deepEqual(clFilter("seafood", "Modesto"), ["c-other-city"]);
});

/* ==============================================================================================
 * 7. Foundation contract + doctrine guards
 * ============================================================================================ */
check("Every adapter builds a language-neutral document with both catalog labels; no authored-language partition", () => {
  const rDoc = buildBilingualSearchDocument(rentasDiscoveryAdapter, rEsCasa);
  assert.ok(rDoc.conceptKeys.has(conceptKey({ kind: "propertyType", id: "casa" })));
  assert.ok(rDoc.canonicalText.includes("house") && rDoc.canonicalText.includes("casa"));
  const bDoc = buildBilingualSearchDocument(brDiscoveryAdapter, bEnRent);
  assert.ok(bDoc.conceptKeys.has(conceptKey({ kind: "operation", id: "rent" })));
  assert.ok(bDoc.canonicalText.includes("renta"));
  const esDoc = buildBilingualSearchDocument(restaurantesBlueprintDiscoveryAdapter, rbEnSeafood);
  const enDoc = buildBilingualSearchDocument(restaurantesBlueprintDiscoveryAdapter, rbEsMariscos);
  assert.deepEqual([...esDoc.conceptKeys], [...enDoc.conceptKeys]);
  assert.equal(esDoc.canonicalText, enDoc.canonicalText);
  assert.ok(buildBilingualSearchDocument(restaurantesResultsDiscoveryAdapter, rrEs).canonicalText.includes("seafood"));
  assert.ok(buildBilingualSearchDocument(autosDiscoveryAdapter, aTruckEn).canonicalText.includes("camioneta"));
  assert.ok(buildBilingualSearchDocument(empleosDiscoveryAdapter, jEnCook).canonicalText.includes("cocinero"));
  assert.ok(buildBilingualSearchDocument(comidaLocalDiscoveryAdapter, cEnSeafood).canonicalText.includes("mariscos"));
  for (const adapter of [rentasDiscoveryAdapter, brDiscoveryAdapter, autosDiscoveryAdapter, empleosDiscoveryAdapter, comidaLocalDiscoveryAdapter]) {
    assert.deepEqual([...adapter.rowLanguagesServed({} as never)], []);
  }
});
check("Query resolution is a pure function of the query (no locale input, deterministic, empty query matches all)", () => {
  const a = compileCatalogDiscoveryQuery(rentasDiscoveryAdapter, "house for rent");
  const b = compileCatalogDiscoveryQuery(rentasDiscoveryAdapter, "  HOUSE   for RENT ");
  const docs = RENTAS_ROWS.map((r) => rentasDiscoveryAdapter.documentFor(r));
  assert.deepEqual(docs.map((d) => a.matches(d)), docs.map((d) => b.matches(d)));
  assert.equal(compileCatalogDiscoveryQuery(rentasDiscoveryAdapter, "   ").empty, true);
  assert.equal(rentasFilter("").length, RENTAS_ROWS.length);
});
check("No translation call, fetch, server-only or lang/locale input in the discovery adapters or the filters that use them", () => {
  const dir = "app/lib/clasificados/discovery";
  const files = [
    `${dir}/catalogDiscovery.ts`,
    ...readdirSync(new URL(`../${dir}/adapters/`, import.meta.url)).map((f) => `${dir}/adapters/${f}`),
  ];
  assert.ok(files.length >= 8, "expected the helper + 7 adapter/catalog files");
  for (const f of files) {
    const src = raw(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    assert.ok(!/\bfetch\s*\(/.test(src), `${f}: fetch`);
    assert.ok(!/server-only/.test(src), `${f}: server-only`);
    assert.ok(!/translate[-_ ]?ad|TranslateAd|translateText|translation/i.test(src), `${f}: translation`);
    assert.ok(!/["']use client["']/.test(src), `${f}: use client`);
    assert.ok(!/\b(lang|locale|routeLang|pageLang)\s*[:=,)]/.test(src.replace(/\blang:\s*"es"\s*\|\s*"en"/g, "")), `${f}: takes a language input`);
  }
  for (const f of [
    "app/(site)/clasificados/rentas/shared/rentasBrowseFilters.ts",
    "app/(site)/clasificados/bienes-raices/resultados/lib/brResultsFilters.ts",
    "app/(site)/clasificados/restaurantes/lib/filterRestaurantesBlueprintRows.ts",
    "app/(site)/clasificados/autos/components/public/autosPublicFilters.ts",
    "app/(site)/clasificados/empleos/lib/empleosResultsQuery.ts",
    "app/lib/clasificados/comida-local/comidaLocalPublicFilter.ts",
  ]) {
    assert.ok(/discovery\/(adapters\/|catalogDiscovery)/.test(raw(f)), `${f} must route q through the discovery adapter`);
  }
  assert.ok(/filterRestaurantesResultsRowsByKeyword/.test(raw("app/(site)/clasificados/restaurantes/resultados/RestauranteResultsClient.tsx")), "client results keyword");
});
check("Foundation files, saved-search matchers and the Translate Ad engine are untouched", () => {
  const changed = execSync("git status --porcelain", { cwd: new URL("..", import.meta.url), encoding: "utf8" })
    .split("\n")
    .map((l) => l.slice(3).trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
  const foundation = ["bilingualSearchDocument", "bilingualSearchText", "canonicalTaxonomyAdapter", "discoveryMatcher", "languagesServed"].map(
    (n) => `app/lib/clasificados/discovery/${n}.ts`,
  );
  for (const f of foundation) assert.ok(!changed.includes(f), `${f} must not change`);
  assert.ok(!changed.some((f) => f.startsWith("app/lib/saved-search/")), "saved-search matchers must not change");
  assert.ok(!changed.some((f) => /translate-?ad/i.test(f) && !f.startsWith("scripts/")), "Translate Ad engine must not change");
});
check("No new database migration introduced by this adoption", () => {
  const out = execSync("git status --porcelain", { cwd: new URL("..", import.meta.url), encoding: "utf8" });
  const added = out.split("\n").filter((l) => /supabase\/migrations\//.test(l) && /^(\?\?|A |\sA)/.test(l));
  assert.equal(added.length, 0, `unexpected new migration(s): ${added.join(", ")}`);
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nverify-launch-categories-bilingual-discovery-01: PASS");
