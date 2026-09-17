/**
 * BR-INV-RENTAS-I18N-FIX — behavioral proof that the live Rentas listing detail page's structured
 * fact labels (not just values) now follow `lang`. Found via live testing on Production: switching
 * to English via the navbar toggle (and a hard reload of `?lang=en`) left every row label
 * ("Depósito", "Plazo del contrato", "Renta mensual", etc.) hardcoded in Spanish, and highlight
 * rows always showed "Sí" regardless of language, in `mapRentasListingLiveToPreviewVm.ts`.
 *
 * Run from repo root:
 *   npx tsx scripts/rentas-live-i18n-labels-selftest.ts
 */
import { strict as assert } from "node:assert";
import {
  mapRentasListingToPrivadoPreviewVm,
  mapRentasListingToNegocioPreviewVm,
} from "../app/(site)/clasificados/rentas/listing/mapRentasListingLiveToPreviewVm";

const listing = {
  categoriaPropiedad: "comercial",
  title: "Beautiful Garage for Rent",
  rentDisplay: "USD 1,200 / mes",
  rentalTypeCode: "garaje",
  rentalTypeCustom: "",
  depositUsd: 1200,
  leaseTermCode: "1-ano",
  leaseTermCustom: "",
  availabilityNote: "18 de julio de 2026",
  amueblado: null,
  mascotasPermitidas: null,
  servicesIncluded: "Agua, Gas, Mantenimiento",
  requirements: "comprobante de ingresos",
  sharedSpacePreferences: "",
  leaseConditions: "Live in style...",
  resultBrowseLocation: "San José, CA 95116 · East San Jose",
  rentasListingAvailability: "disponible",
  resultsPropertyKind: "comercial",
  propertySubtype: "",
  beds: "",
  fullBaths: "",
  baths: "",
  halfBaths: "",
  halfBathsCount: 0,
  sqft: "",
  lotSqft: "",
  parking: "",
  parkingSpots: 0,
  yearBuilt: "",
  condition: "",
  pool: false,
  highlightSlugs: ["piscina"],
  city: "San José",
  stateRegion: "CA",
  postalCode: "95116",
  country: "United States",
  showExactAddress: true,
  addressLine: "87 N King Rd",
  mapUrl: null,
  contactSmsDigits: "4088021531",
  contactWhatsappDigits: "4088021531",
  contactEmail: "chuy@leonixmedia.com",
  contactChannels: null,
  contactNote: "",
  virtualTourUrl: "",
  businessAgentName: "",
  businessMarca: "",
  businessLicense: "",
  businessDescription: "",
  businessSocial: "",
  businessWebsite: "",
  imageUrl: "",
  videoUrl: "",
  videoPosterUrl: "",
  videoUrls: [],
} as unknown as Parameters<typeof mapRentasListingToPrivadoPreviewVm>[0];

const extra = {
  gallery: ["https://example.com/1.jpg"],
  sellerDisplayEn: "Advertiser",
  sellerDisplayEs: "Anunciante",
  descriptionEn: "Live in style...",
  descriptionEs: "Vive con estilo...",
  contactPhone: "4088021531",
  contactSmsDigits: "4088021531",
  contactWhatsappDigits: "4088021531",
  contactEmail: "chuy@leonixmedia.com",
} as unknown as Parameters<typeof mapRentasListingToPrivadoPreviewVm>[1];

const vmEs = mapRentasListingToPrivadoPreviewVm(listing, extra, "es");
const vmEn = mapRentasListingToPrivadoPreviewVm(listing, extra, "en");

assert.equal(vmEn.operationSummary, "Commercial rental", "EN operationSummary must be English");
assert.equal(vmEs.operationSummary, "Renta comercial", "ES operationSummary must be Spanish (no regression)");
assert.ok(vmEn.propertyDetailsRows.some((r) => r.label === "Monthly rent"), "EN must have 'Monthly rent' label");
assert.ok(vmEn.propertyDetailsRows.some((r) => r.label === "Deposit"), "EN must have 'Deposit' label");
assert.ok(vmEn.propertyDetailsRows.some((r) => r.label === "Lease term"), "EN must have 'Lease term' label");
assert.ok(vmEn.propertyDetailsRows.some((r) => r.label === "Utilities included"), "EN must have 'Utilities included' label");
assert.ok(vmEn.propertyDetailsRows.some((r) => r.label === "Listing status"), "EN must have 'Listing status' label");
assert.ok(!vmEn.propertyDetailsRows.some((r) => r.label === "Depósito"), "EN must NOT show 'Depósito'");
assert.ok(!vmEn.propertyDetailsRows.some((r) => r.label === "Plazo del contrato"), "EN must NOT show 'Plazo del contrato'");
assert.equal(vmEn.highlightsRows[0]?.value, "Yes", "EN highlight value must be 'Yes', not always 'Sí'");
assert.equal(vmEs.highlightsRows[0]?.value, "Sí", "ES highlight value must be 'Sí' (no regression)");
assert.ok(vmEs.propertyDetailsRows.some((r) => r.label === "Depósito"), "ES must still show 'Depósito' (no regression)");
assert.ok(vmEs.propertyDetailsRows.some((r) => r.label === "Plazo del contrato"), "ES must still show 'Plazo del contrato' (no regression)");

const vmNegocioEn = mapRentasListingToNegocioPreviewVm(listing, extra, "en");
assert.equal(vmNegocioEn.operationSummary, "Commercial rental", "Negocio EN operationSummary must be English too");
assert.ok(vmNegocioEn.propertyDetailsRows.some((r) => r.label === "Deposit"), "Negocio EN must have 'Deposit' label");
assert.equal(vmNegocioEn.highlightsRows[0]?.value, "Yes", "Negocio EN highlight value must be 'Yes'");

console.log("RENTAS LIVE I18N FIX: VERIFIED TRUE (Privado + Negocio, ES unchanged, EN fixed)");
