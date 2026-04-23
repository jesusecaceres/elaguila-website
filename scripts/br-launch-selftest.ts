/**
 * Repo-level BR launch proof (no DB): URL parse/merge round-trip, machine facet keys, filter semantics.
 * Run from repo root: npx tsx scripts/br-launch-selftest.ts
 */

import { strict as assert } from "node:assert";

import {
  createEmptyBienesRaicesPrivadoFormState,
  mergePartialBienesRaicesPrivadoState,
} from "../app/(site)/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import {
  createEmptyBienesRaicesNegocioFormState,
  mergePartialBienesRaicesNegocioState,
} from "../app/(site)/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState";
import {
  buildLeonixMachineFacetPairsFromBienesRaicesNegocioState,
  buildLeonixMachineFacetPairsFromBienesRaicesPrivadoState,
} from "../app/(site)/clasificados/lib/leonixBrMachineFacetPairsFromFormState";
import { LEONIX_DP_PETS_ALLOWED, LEONIX_DP_POOL } from "../app/(site)/clasificados/lib/leonixRealEstateListingContract";
import { brNegocioFeaturedListing, brNegocioGridListings } from "../app/(site)/clasificados/bienes-raices/resultados/demoData";
import {
  compareBrListingFairness,
  filterBrListings,
} from "../app/(site)/clasificados/bienes-raices/resultados/lib/brResultsFilters";
import type { BrNegocioListing } from "../app/(site)/clasificados/bienes-raices/resultados/cards/listingTypes";
import { mergeBrResultsHref, parseBrResultsUrl } from "../app/(site)/clasificados/bienes-raices/resultados/lib/brResultsUrlState";

const poolState = parseBrResultsUrl(new URLSearchParams("lang=es&pool=true&operationType=venta"));
const poolRows = filterBrListings([brNegocioFeaturedListing, ...brNegocioGridListings], poolState, null);
assert.ok(poolRows.some((r) => r.id === "feat-encino"), "pool=true should include demo row with facetPool");

const petsState = parseBrResultsUrl(new URLSearchParams("lang=es&pets=true"));
const petsRows = filterBrListings([brNegocioFeaturedListing, ...brNegocioGridListings], petsState, null);
assert.ok(petsRows.some((r) => r.id === "priv-mty-cumbres"), "pets=true should include demo row with facetPets");

const furnishedState = parseBrResultsUrl(new URLSearchParams("lang=es&furnished=true"));
const furnRows = filterBrListings([brNegocioFeaturedListing, ...brNegocioGridListings], furnishedState, null);
assert.ok(furnRows.some((r) => r.id === "priv-mty-cumbres"), "furnished=true should include demo row with facetFurnished");

const baseQs = new URLSearchParams(
  "lang=en&operationType=renta&propertyType=departamento&city=Monterrey&beds=2&sort=precio_asc&page=2&pets=true",
);
const parsed = parseBrResultsUrl(baseQs);
assert.equal(parsed.lang, "en");
assert.equal(parsed.operationType, "renta");
assert.equal(parsed.propertyType, "departamento");
assert.equal(parsed.city, "Monterrey");
assert.equal(parsed.beds, "2");
assert.equal(parsed.sort, "precio_asc");
assert.equal(parsed.page, "2");
assert.equal(parsed.pets, "true");

const href = mergeBrResultsHref(baseQs, { page: "3", q: "vista" }, "en");
const round = parseBrResultsUrl(new URLSearchParams(href.split("?")[1] ?? ""));
assert.equal(round.page, "3");
assert.equal(round.q, "vista");

const brPriv = mergePartialBienesRaicesPrivadoState({
  petsAllowed: "yes",
  residencial: {
    ...createEmptyBienesRaicesPrivadoFormState().residencial,
    highlightKeys: ["piscina"],
  },
});
const machine = buildLeonixMachineFacetPairsFromBienesRaicesPrivadoState(brPriv);
const labels = new Set(machine.map((p) => p.label));
assert.ok(labels.has(LEONIX_DP_PETS_ALLOWED), "privado publish machine pairs must include pets label");
assert.ok(labels.has(LEONIX_DP_POOL), "privado residencial piscina highlight must emit pool machine label");

const brNeg = mergePartialBienesRaicesNegocioState({
  petsAllowed: "yes",
  highlightPresets: { ...createEmptyBienesRaicesNegocioFormState().highlightPresets, piscina: true },
});
const negMachine = buildLeonixMachineFacetPairsFromBienesRaicesNegocioState(brNeg);
const negLabels = new Set(negMachine.map((p) => p.label));
assert.ok(negLabels.has(LEONIX_DP_PETS_ALLOWED), "negocio publish machine pairs must include pets label");
assert.ok(negLabels.has(LEONIX_DP_POOL), "negocio piscina highlight must emit pool machine label");

const baseListing = {
  imageUrl: "",
  price: "$100,000",
  title: "t",
  addressLine: "",
  beds: "",
  baths: "",
  sqft: "",
  categoriaPropiedad: "residencial" as const,
  badges: [] as BrNegocioListing["badges"],
  advertiser: { kind: "agente" as const, name: "x" },
  demoPublishedAtMs: 1,
};
const privTie: BrNegocioListing = { ...baseListing, id: "priv-tie", sellerKind: "privado" };
const negTie: BrNegocioListing = { ...baseListing, id: "neg-tie", sellerKind: "negocio", badges: ["negocio"] };
assert.ok(
  compareBrListingFairness(privTie, negTie) < 0,
  "compareBrListingFairness: privado should sort before negocio on ties"
);

console.log("br-launch-selftest: OK");
