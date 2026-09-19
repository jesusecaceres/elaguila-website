/**
 * Servicios Final Consolidated Lifecycle Execution — Gate 5 (Preview -> canonical field parity,
 * 2026-09-18).
 *
 * A. coverUrl is captured, uploaded to Blob, and even gates publish-readiness, but was never
 *    actually written into profile_json.hero.coverImageUrl (every downstream consumer already
 *    reads that field). Two-line fix in the one mapper that was missing it.
 * B. Preview's professional result-card mock previously claimed a Verified badge from the owner's
 *    stated INTEREST (opsMeta.leonixVerifiedInterest), which is not, and must never render as, the
 *    real staff-granted leonix_verified truth. Fixed to the same honest false the DB insert itself
 *    uses for a new row.
 * C. The $399 checkpoint's includedBullets no longer claims "up to 4 free promotions included" —
 *    that capability was already retired from the live application flow in a prior gate (GATE-03,
 *    verify-servicios-gate-03-simple-offer-chips.mjs); the coupons/offers module remains correctly
 *    described via optionalUpgradeLine/optionalUpgradeBullets. No invented replacement benefit.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-exec-gate5-preview-field-parity.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

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
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const raw = (rel: string) =>
  stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n"));

const MAPPER = "app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft.ts";
const PREVIEW = "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx";
const CHECKPOINTS = "app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts";

check("A: coverUrl is now written into hero.coverImageUrl/coverImageAlt", () => {
  const src = raw(MAPPER);
  assert.ok(src.includes("coverImageUrl: state.coverUrl.trim() || undefined,"));
  assert.ok(src.includes("coverImageAlt: state.coverUrl.trim() ? coverAlt : undefined,"));
  // Must sit inside the same `hero:` object as the already-working logoUrl round-trip.
  const heroStart = src.indexOf("hero: {");
  const heroEnd = src.indexOf("contact,", heroStart);
  const heroBlock = src.slice(heroStart, heroEnd);
  assert.ok(heroBlock.includes("logoUrl:") && heroBlock.includes("coverImageUrl:"), "cover must be a sibling of logo in the same hero object");
});

check("B: Preview's mock listing row never fabricates the Verified badge from owner-stated interest", () => {
  const src = raw(PREVIEW);
  assert.ok(!/leonix_verified:\s*appState\.leonixVerifiedInterest/.test(src), "must not derive the real badge from the interest flag");
  // Refined by Golden Gate 4: listing-bound previews use the REAL DB value; a fresh application
  // still defaults to the same honest `false` the DB insert itself uses.
  assert.ok(
    src.includes("leonix_verified: listingBoundPreview ? listingBoundLeonixVerified === true : false,"),
    "must be real DB truth for a listing-bound preview and the honest false default otherwise",
  );
});

check("C: the unsupported '4 free promotions included' bullet is gone from both locales, no invented replacement", () => {
  const src = raw(CHECKPOINTS);
  assert.ok(!/promociones generales/i.test(src));
  assert.ok(!/general promotions/i.test(src));
  // The truthful, already-correct coupons/offers description must remain untouched.
  assert.ok(src.includes("Cupones y ofertas destacadas incluidos sin costo adicional"));
  assert.ok(src.includes("Featured coupons and offers included at no extra cost"));
});

if (failures.length) {
  console.error(`\nverify-servicios-exec-gate5-preview-field-parity: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-exec-gate5-preview-field-parity: PASS");
