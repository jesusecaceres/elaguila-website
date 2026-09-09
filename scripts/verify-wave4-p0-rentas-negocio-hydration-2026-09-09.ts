/**
 * Globalization Wave 4 P0 — Rentas Negocio (and Privado, same shared base) dashboard-edit
 * hydration data-loss fix. Proves `rentasDashboardEditHydration.ts` now restores the fields
 * Wave 2's audit found destroyed on every dashboard edit: the WhatsApp/SMS digits stranded on a
 * field RentasNegocioFormState's own merge function never reads, most business-identity fields,
 * the address block (line + exact-address toggle), zonaVecindario, the structured
 * residencial/comercial/terreno property facts, and the flow-specific extension blocks
 * (room_shared/storage_parking/commercial_space/land_parcel). Source-level checks only — not a
 * substitute for owner browser QA (published row → edit → preview → republish → same row → zero
 * field loss).
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
let pass = 0;
let fail = 0;

function read(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function check(label: string, condition: boolean): void {
  if (condition) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.error(`  FAIL - ${label}`);
  }
}

console.log("verify-wave4-p0-rentas-negocio-hydration-2026-09-09: starting");

const HYDRATION_PATH = "app/(site)/clasificados/publicar/rentas/shared/rentasDashboardEditHydration.ts";
const f = read(HYDRATION_PATH);

// --- 1. WhatsApp/SMS "doubly-broken" fix — the actual named P0 defect ---
check(
  "WHATSAPP 1: negocioWhatsapp is now read back from the real detail_pairs source (rx.contactWhatsappDigits), not stranded on `seller`",
  /negocioWhatsapp: rx\.contactWhatsappDigits/.test(f),
);
check(
  "WHATSAPP 2: negocioMensajesTexto is now read back from rx.contactSmsDigits",
  /negocioMensajesTexto: rx\.contactSmsDigits/.test(f),
);

// --- 2. Business identity fields restored on the Negocio lane ---
check(
  "IDENTITY: negocioMarca/negocioLogoDataUrl/negocioLicencia/negocioTelOficina/negocioSitioWeb/negocioRedes/negocioGoogleReviewsUrl/negocioYelpReviewsUrl/negocioBio/negocioIdiomas are all now sourced (previously only negocioNombre/negocioTelDirecto/negocioEmail were set)",
  f.includes("negocioMarca: trim(meta.negocioNombreCorreduria)") &&
    f.includes("negocioLogoDataUrl: trim(meta.negocioFotoAgenteUrl)") &&
    f.includes("negocioLicencia: rx.businessLicense || trim(meta.negocioLicencia)") &&
    f.includes("negocioTelOficina: trim(meta.negocioTelOficina)") &&
    f.includes("negocioSitioWeb: rx.businessWebsite || trim(meta.negocioSitioWeb)") &&
    f.includes("negocioRedes: rx.businessSocial || trim(meta.negocioRedes)") &&
    f.includes("negocioGoogleReviewsUrl: trim(meta.negocioGoogleReviewsUrl)") &&
    f.includes("negocioYelpReviewsUrl: trim(meta.negocioYelpReviewsUrl)") &&
    f.includes("negocioBio: trim(meta.negocioDescripcion)") &&
    f.includes("negocioIdiomas: trim(meta.negocioIdiomas)"),
);

// --- 3. Address block restored (previously zero read-back at all) ---
check(
  "ADDRESS 1: direccionLinea1 now reads the same 'Ubicación'/'Dirección' pair already proven correct on the public page",
  f.includes('const direccionLinea1 = pv(detailPairs, "Ubicación") || pv(detailPairs, "Dirección")'),
);
check(
  "ADDRESS 2: mostrarDireccionExacta now reads the real showExactAddress toggle instead of never being set",
  f.includes("mostrarDireccionExacta: showExact") && f.includes("rentasShowExactAddressFromDetailPairs(detailPairs)"),
);
check(
  "ADDRESS 3: zonaVecindario is read back (previously hardcoded to empty string on every edit)",
  f.includes('const zonaVecindario = pv(detailPairs, "Zona o vecindario") || pv(detailPairs, "Colonia")') &&
    !/zonaVecindario: ""/.test(f),
);

// --- 4. Structured residencial/comercial/terreno property facts restored ---
check(
  "STRUCTURED 1: structuredPropertyFactsFromDetailPairs helper exists and is spread into the base partial",
  f.includes("function structuredPropertyFactsFromDetailPairs(") &&
    f.includes("...structuredPropertyFactsFromDetailPairs(detailPairs, categoria)"),
);
check(
  "STRUCTURED 2: residencial branch reads real recamaras/banos/interiorSqft/loteSqft/estacionamiento/ano (previously entirely absent)",
  f.includes('recamaras: digits(pv(detailPairs, "Recámaras"))') &&
    f.includes('interiorSqft: digits(pv(detailPairs, "Interior (ft²)"))'),
);
check(
  "STRUCTURED 3: comercial and terreno branches are both implemented (not just residencial)",
  f.includes('uso: pv(detailPairs, "Uso")') && f.includes('usoZonificacion: pv(detailPairs, "Uso / zonificación")'),
);

// --- 5. Flow-specific extension blocks restored (room_shared/storage_parking/commercial_space/land_parcel) ---
check(
  "FLOW 1: flowExtensionFieldsFromDetailPairs helper exists and is spread into the Negocio return value",
  f.includes("function flowExtensionFieldsFromDetailPairs(") &&
    f.includes("...flowExtensionFieldsFromDetailPairs(detailPairs, rx.rentalTypeCode)"),
);
check(
  "FLOW 2: all 4 flow groups (room_shared, storage_parking, commercial_space, land_parcel) are handled",
  f.includes('g === "room_shared"') &&
    f.includes('g === "storage_parking"') &&
    f.includes('g === "commercial_space"') &&
    f.includes('g === "land_parcel"'),
);

// --- 6. Resilience parity with the proven public mapper (structured-payload augmentation) ---
check(
  "RESILIENCE: basePartialFromRow now augments detail_pairs from listing_json/contact_json, same as the proven public mapper",
  f.includes(
    "augmentLeonixDetailPairsFromStructuredColumns(row.detail_pairs, row.listing_json, row.contact_json)",
  ),
);
check(
  "RESILIENCE: the owner SELECT now fetches listing_json/contact_json/business_meta needed by the restored fields",
  /listing_json, contact_json/.test(f) && /\bbusiness_meta\b/.test(f),
);

console.log(`\nverify-wave4-p0-rentas-negocio-hydration-2026-09-09: ${pass}/${pass + fail} checks passed`);
if (fail > 0) process.exit(1);
