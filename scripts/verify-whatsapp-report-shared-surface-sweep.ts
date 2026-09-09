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
  check("Rentas Negocio preview mapper WhatsApp href now prepends country code for bare 10-digit numbers", () => {
    assert.match(rentasNegocioSrc, /const withCountryCode = d\.length === 10 \? `1\$\{d\}` : d;/);
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
  check("Bienes Raíces Negocio preview mapper WhatsApp href now prepends country code for bare 10-digit numbers", () => {
    assert.match(bienesNegocioSrc, /const withCountryCode = d\.length === 10 \? `1\$\{d\}` : d;/);
  });

  const rentasLiveSrc = read("app/(site)/clasificados/rentas/listing/mapRentasListingLiveToPreviewVm.ts");
  check("Rentas live-listing mapper already had the correct fix pre-existing (confirms the sibling pattern this sweep copied)", () => {
    assert.match(rentasLiveSrc, /const withCountryCode = x\.length === 10 \? `1\$\{x\}` : x;/);
  });

  // ── Generic anuncio page Report consolidation ───────────────────────────────────────────────
  const anuncioSrc = read("app/(site)/clasificados/anuncio/[id]/page.tsx");
  check("Generic anuncio page now imports the canonical LeonixInlineListingReport", () => {
    assert.match(anuncioSrc, /import \{ LeonixInlineListingReport \} from "@\/app\/clasificados\/components\/LeonixInlineListingReport"/);
  });
  check("Generic anuncio page renders the canonical component instead of its own modal", () => {
    assert.match(anuncioSrc, /<LeonixInlineListingReport listingId=\{listing\.id\} lang=\{lang === "en" \? "en" : "es"\} \/>/);
  });
  check("The duplicate modal-based Report reimplementation (state, handlers, raw action import) is fully removed", () => {
    assert.doesNotMatch(anuncioSrc, /showReportModal/);
    assert.doesNotMatch(anuncioSrc, /reportSubmitting/);
    assert.doesNotMatch(anuncioSrc, /handleReportSubmit/);
    assert.doesNotMatch(anuncioSrc, /submitListingReportAction/);
  });

  console.log(
    `\nverify-whatsapp-report-shared-surface-sweep: ${checks - failures}/${checks} checks passed`,
  );
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main();
