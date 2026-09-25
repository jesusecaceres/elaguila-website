/**
 * Globalization Build D — dedicated shared-surface increment (explicitly approved as its own
 * pass, not a per-category adapter): fixes the residual WhatsApp international-digit gap Build A
 * never reached (individual call sites were fixed, but the actual shared CTA sheet consumer and
 * ~9 independent per-category duplicates were not), and consolidates the generic
 * /clasificados/anuncio/[id] page's duplicate modal-based Report reimplementation onto the
 * canonical LeonixInlineListingReport component.
 *
 * Run from repo root:
 *   npx tsx scripts/verify-whatsapp-report-shared-surface-sweep.ts
 *
 * Structural source checks (no live Next.js render available in a pure-logic script), each
 * reading real current file contents on disk.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(__dirname, "..");
const read = (rel: string) => readFileSync(join(REPO_ROOT, rel), "utf8");

let failures = 0;
let checks = 0;

function check(label: string, fn: () => void): void {
  checks += 1;
  try {
    fn();
    console.log(`  ok  - ${label}`);
  } catch (err) {
    failures += 1;
    console.error(`  FAIL - ${label}`);
    console.error(`         ${err instanceof Error ? err.message : String(err)}`);
  }
}

function main(): void {
  console.log("verify-whatsapp-report-shared-surface-sweep: starting");

  // ── The true root shared consumer: buildWhatsAppUrl ────────────────────────────────────────
  const nativeChannelSrc = read("app/lib/digitalContact/humanConnection/nativeChannelHrefs.ts");
  check("buildWhatsAppUrl now prepends '1' for a bare 10-digit number (matches buildTelHref/buildSmsHref siblings)", () => {
    assert.match(nativeChannelSrc, /const digits = rawDigits\.length === 10 \? `1\$\{rawDigits\}` : rawDigits;/);
  });

  // ── Per-category duplicate fixes ────────────────────────────────────────────────────────────
  const restauranteContactHrefSrc = read(
    "app/(site)/clasificados/restaurantes/application/restauranteContactHref.ts",
  );
  check("Restaurantes waHref (contact hub) now delegates to the shared international builder", () => {
    assert.match(restauranteContactHrefSrc, /buildInternationalWhatsAppWaMeHrefWithText\(raw, message\)/);
  });

  const mapRestauranteShellSrc = read(
    "app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts",
  );
  check("Restaurantes waHref (shell mapper, a separate duplicate) now delegates to the shared builder too", () => {
    assert.match(mapRestauranteShellSrc, /buildInternationalWhatsAppWaMeHrefWithText\(raw, buildRestaurantWhatsAppPrefill\(businessName\)\)/);
  });

  const autosPreviewSrc = read("app/(site)/clasificados/autos/shell/AutosPreviewCard.tsx");
  check("Autos dealer preview card WhatsApp CTA uses the shared international builder", () => {
    assert.match(autosPreviewSrc, /buildInternationalWhatsAppWaMeHref\(data\.dealerWhatsapp\)/);
  });

  const enVentaSrc = read("app/(site)/clasificados/en-venta/shared/utils/enVentaContactActions.ts");
  check("En Venta's 4 wa.me construction sites all now normalize via the shared function", () => {
    const matches = enVentaSrc.match(/normalizeInternationalWhatsAppDigits\(waDigits\)/g) ?? [];
    assert.equal(matches.length, 4, `expected 4 call sites, found ${matches.length}`);
  });

  const rentasNegocioSrc = read(
    "app/(site)/clasificados/publicar/rentas/negocio/application/mapping/mapRentasNegocioStateToPreviewVm.ts",
  );
  // Golden re-point: golden (Gate RENTAS-NEGOCIO-1) already delegates to the shared international
  // builder, which prepends "1" for a bare 10-digit number — assert that instead of the source
  // branch's inline `withCountryCode` copy.
  check("Rentas Negocio preview mapper WhatsApp href uses the shared international builder (bare 10-digit -> 1+10)", () => {
    assert.match(rentasNegocioSrc, /buildInternationalWhatsAppWaMeHrefWithText\(raw, rentasLeadSmsBody\(lang\)\)/);
  });

  const rentasPrivadoSrc = read(
    "app/(site)/clasificados/publicar/rentas/privado/application/mapping/mapRentasPrivadoStateToPreviewVm.ts",
  );
  check("Rentas Privado preview mapper WhatsApp href now prepends country code for bare 10-digit numbers", () => {
    assert.match(rentasPrivadoSrc, /const withCountryCode = d\.length === 10 \? `1\$\{d\}` : d;/);
  });

  const bienesNegocioSrc = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm.ts",
  );
  // Golden re-point: golden's BR Negocio builder used stripPhoneDigits (10-digit truncation) plus
  // an unconditional "1" prefix; the hand port delegates to the shared international builder.
  check("Bienes Raíces Negocio preview mapper WhatsApp href uses the shared international builder (bare 10-digit -> 1+10, intl preserved)", () => {
    assert.match(bienesNegocioSrc, /return buildInternationalWhatsAppWaMeHrefWithText\(phone, text\);/);
    assert.doesNotMatch(bienesNegocioSrc, /wa\.me\/1\$\{d\}/);
  });

  const rentasLiveSrc = read("app/(site)/clasificados/rentas/listing/mapRentasListingLiveToPreviewVm.ts");
  check("Rentas live-listing mapper resolves WhatsApp through the shared international builder (golden sibling pattern)", () => {
    assert.match(rentasLiveSrc, /buildInternationalWhatsAppWaMeHrefWithText\(d, rentasLeadSmsBody\(lang\)\)/);
  });

  // ── Behavioral: bare US 10-digit -> 1+10; international preserved ─────────────────────────
  check("Shared builder: bare US 10-digit becomes 1+10; 11+ digit international numbers are preserved", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const wa = require("../app/lib/whatsapp/internationalWhatsApp") as typeof import("../app/lib/whatsapp/internationalWhatsApp");
    assert.equal(wa.buildInternationalWhatsAppWaMeHref("(555) 123-4567"), "https://wa.me/15551234567");
    assert.equal(wa.buildInternationalWhatsAppWaMeHref("+52 1 55 1234 5678"), "https://wa.me/5215512345678");
    assert.equal(wa.buildInternationalWhatsAppWaMeHref("+44 20 7946 0958"), "https://wa.me/442079460958");
  });

  // Golden re-point: the generic anuncio/[id]/page.tsx Report-consolidation asserts from the source
  // branch (0e2f9b17a) are intentionally dropped — that page is owned by a concurrent wave and the
  // Report consolidation is not part of this port.

  console.log(
    `\nverify-whatsapp-report-shared-surface-sweep: ${checks - failures}/${checks} checks passed`,
  );
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main();
