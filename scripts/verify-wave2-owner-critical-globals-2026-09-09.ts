/**
 * Globalization Integration Wave 2 — owner-critical business globals across 5 categories.
 * Proves the 6 real, safely-fixable defects found by rigorous end-to-end tracing (5 parallel
 * research agents, one per category, covering G13/G14/G15/G16/G17/G18/G20/G21/G24) are fixed
 * at the source level. Source-level checks only — not a substitute for owner browser QA.
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

console.log("verify-wave2-owner-critical-globals-2026-09-09: starting");

// --- 1. Comida Local G21 — critical unconditional data-loss fix ---
{
  const f = read("app/lib/clasificados/comida-local/comidaLocalDraftPersistence.ts");
  check(
    "COMIDA G21: mergeComidaLocalDraftFromStorage now restores googleReviewsUrl/yelpReviewsUrl (previously always wiped)",
    /googleReviewsUrl: safeString\(parsed\.googleReviewsUrl/.test(f) &&
      /yelpReviewsUrl: safeString\(parsed\.yelpReviewsUrl/.test(f),
  );
}

// --- 2. Bienes Negocio G16 — agenteWhatsapp dropped at publish ---
{
  const schema = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState.ts",
  );
  check("BIENES G16 1: identityAgente.whatsapp field declared", schema.includes("whatsapp: string;"));
  const mapper = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish.ts",
  );
  check(
    "BIENES G16 2: publish mapper now forwards agenteWhatsapp instead of dropping it",
    mapper.includes("whatsapp: trim(s.agenteWhatsapp)"),
  );
  const meta = read("app/(site)/clasificados/lib/leonixNegocioBusinessMetaFromFormState.ts");
  check(
    "BIENES G16 3: business_meta serializer persists negocioWhatsapp",
    meta.includes("meta.negocioWhatsapp = trim(id.whatsapp)"),
  );
  // Wave 4 P0 fix relocated this read-back logic out of the shell and into the shared parser
  // that both the public shell and the dashboard-edit reverse mapper now call.
  const sharedParser = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/parseBienesAgenteResidencialPublishedState.ts",
  );
  check(
    "BIENES G16 4: public read-back prefers the real negocioWhatsapp over the phone fallback",
    sharedParser.includes("agenteWhatsapp: trim(identityMeta.negocioWhatsapp) || phone"),
  );
}

// --- 3. Restaurantes G24 — missing privacy toggle UI ---
{
  const client = read("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
  check(
    "RESTAURANTES G24: showExactAddress checkbox now rendered in the application form (previously no UI control existed anywhere)",
    client.includes('id="restaurante-show-exact-address"') && client.includes("draft.showExactAddress"),
  );
  const copy = read("app/(site)/publicar/restaurantes/restauranteApplicationFormCopy.ts");
  check(
    "RESTAURANTES G24: bilingual copy added for the new toggle",
    copy.includes("showExactAddressLabel") && copy.includes("showExactAddressHelper"),
  );
}

// --- 4. Rentas Negocio G13 — negocioIdiomas write-only, never read back or rendered ---
{
  const rowMapper = read("app/(site)/clasificados/rentas/data/mapListingRowToRentasPublicListing.ts");
  check(
    "RENTAS G13 1: businessMetaFromRow now parses negocioIdiomas (was silently discarded)",
    rowMapper.includes("const idiomas = trim(o.negocioIdiomas)") && rowMapper.includes("businessIdiomas"),
  );
  const model = read("app/(site)/clasificados/rentas/model/rentasPublicListing.ts");
  check("RENTAS G13 2: RentasPublicListing declares businessIdiomas", model.includes("businessIdiomas?:"));
  const vm = read("app/(site)/clasificados/rentas/listing/mapRentasListingLiveToPreviewVm.ts");
  check(
    "RENTAS G13 3: preview VM threads businessIdiomas into identity.languagesLine",
    vm.includes("languagesLine: trim(listing.businessIdiomas"),
  );
  const view = read("app/(site)/clasificados/rentas/preview/shared/RentasVisualMatchPreviewView.tsx");
  check(
    "RENTAS G13 4: live component actually renders languagesLine (previously the VM had no field for it at all)",
    view.includes("vm.identity.languagesLine"),
  );
}

// --- 5. Restaurantes G14 — timezone-unsafe Open Now on the live detail page ---
{
  const preview = read("app/(site)/clasificados/restaurantes/application/restauranteHoursPreview.ts");
  check(
    "RESTAURANTES G14 1: computeShellHoursPreview no longer reads server-local now.getDay()/getHours() directly (the one remaining literal match is this fix's own explanatory comment, not live code)",
    !/const key = DAY_KEYS\[now\.getDay\(\)\]/.test(preview) && !/function minutesNow/.test(preview),
  );
  check(
    "RESTAURANTES G14 2: reuses the timezone-pinned helpers already proven correct for the discovery-card badge",
    preview.includes("weekdayKeyFromDateInTimeZone(now, DEFAULT_RESTAURANTE_TIME_ZONE)") &&
      preview.includes("minutesInTimeZone(now, DEFAULT_RESTAURANTE_TIME_ZONE)"),
  );
  const source = read("app/(site)/clasificados/restaurantes/lib/restauranteOpenNowFromHours.ts");
  check(
    "RESTAURANTES G14 3: the reused helpers are now exported (were previously private to one file)",
    source.includes("export function weekdayKeyFromDateInTimeZone") &&
      source.includes("export function minutesInTimeZone"),
  );
}

// --- 6. Autos Dealer G17 — dealerEmail had no form input, CTA was structurally unreachable ---
{
  const app = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  check(
    "AUTOS G17: dealerEmail now has a real form input in the Negocios application (previously zero matches for email anywhere in this file)",
    app.includes("listing.dealerEmail") && app.includes("dealerEmail: autosDraftTextValue"),
  );
  const copyEs = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  check("AUTOS G17: bilingual email label added", /email:\s*"Correo electrónico/.test(copyEs) && /email:\s*"Email/.test(copyEs));
}

console.log(`\nverify-wave2-owner-critical-globals-2026-09-09: ${pass}/${pass + fail} checks passed`);
if (fail > 0) process.exit(1);
