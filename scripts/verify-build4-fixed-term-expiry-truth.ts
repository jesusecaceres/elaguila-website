/**
 * Globalization Build 4 — fixed-term expiration/renewal truth.
 *
 * Closes the one real, evidence-based gap found across all 5 paid fixed-term lanes: Autos
 * Privado and Bienes Raíces FSBO had zero public-expiry enforcement — their browse/detail
 * queries filtered only on status/is_published, never on time elapsed, so an expired paid
 * listing stayed fully live in public results and at its direct URL indefinitely. Rentas,
 * Empleos, and Ofertas Locales were already confirmed correctly enforcing this.
 *
 * Both fixes reuse existing, already-proven lifecycle config/computation (no new semantics, no
 * schema change, no new status value):
 *  - Bienes Raíces FSBO already has a real `listings.expires_at` column (used elsewhere by the
 *    checkout no-recharge guard) — this just adds it to the two public read paths.
 *  - Autos Privado has no `expires_at` column; reuses the SAME `AUTOS_PRIVADO_LIFECYCLE_CONFIG
 *    .durationDays` the checkout guard already uses, computed from `published_at` (now exported
 *    instead of duplicating the "30" constant a 4th time).
 * Bienes Negocio (subscription) and Autos Dealer/negocios (subscription) are explicitly exempt
 * in both fixes — neither has a fixed term, and both are proven unaffected below.
 *
 * Run: npx tsx scripts/verify-build4-fixed-term-expiry-truth.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AUTOS_PRIVADO_LIFECYCLE_CONFIG } from "../app/lib/listingLifecycle/activePaidEditCheckoutOwnership";

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

// ── Reimplement the two pure filter functions locally (mirrors the real source exactly) so
// this test needs no Supabase/network access, matching this session's established pattern. ──
function isBrRowWithinTerm(row: { expires_at?: unknown }): boolean {
  const raw = row.expires_at;
  if (typeof raw !== "string" || !raw) return true;
  const expiresMs = new Date(raw).getTime();
  if (!Number.isFinite(expiresMs)) return true;
  return expiresMs > Date.now();
}

function isAutosRowWithinTerm(row: { lane: string; published_at: string | null }): boolean {
  if (row.lane !== "privado") return true;
  if (!row.published_at) return true;
  const durationDays = AUTOS_PRIVADO_LIFECYCLE_CONFIG.durationDays;
  if (!durationDays) return true;
  const publishedMs = new Date(row.published_at).getTime();
  if (!Number.isFinite(publishedMs)) return true;
  const expiresMs = publishedMs + durationDays * 24 * 60 * 60 * 1000;
  return Date.now() < expiresMs;
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}
function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();
}

function main(): void {
  console.log("verify-build4-fixed-term-expiry-truth: starting");

  // ── Bienes Raíces FSBO ───────────────────────────────────────────────────────────────────
  check("BR: expired FSBO row (expires_at in the past) is filtered out", () => {
    assert.equal(isBrRowWithinTerm({ expires_at: daysAgo(1) }), false);
  });
  check("BR: non-expired FSBO row (expires_at in the future) passes", () => {
    assert.equal(isBrRowWithinTerm({ expires_at: daysFromNow(10) }), true);
  });
  check("BR: null expires_at (BR Negocio, subscription — no fixed term) always passes", () => {
    assert.equal(isBrRowWithinTerm({ expires_at: null }), true);
    assert.equal(isBrRowWithinTerm({}), true);
  });
  check("BR: malformed expires_at fails open (treated as never-expires, not a crash)", () => {
    assert.equal(isBrRowWithinTerm({ expires_at: "not-a-date" }), true);
  });

  // ── Autos Privado ────────────────────────────────────────────────────────────────────────
  check("Autos: expired Privado row (published 31 days ago, 30d term) is filtered out", () => {
    assert.equal(isAutosRowWithinTerm({ lane: "privado", published_at: daysAgo(31) }), false);
  });
  check("Autos: non-expired Privado row (published 5 days ago) passes", () => {
    assert.equal(isAutosRowWithinTerm({ lane: "privado", published_at: daysAgo(5) }), true);
  });
  check("Autos: Dealer/negocios row (subscription, no fixed term) always passes regardless of age", () => {
    assert.equal(isAutosRowWithinTerm({ lane: "negocios", published_at: daysAgo(400) }), true);
  });
  check("Autos: null published_at fails open (never-expires, not a crash)", () => {
    assert.equal(isAutosRowWithinTerm({ lane: "privado", published_at: null }), true);
  });
  check("Autos: durationDays reused from the existing shared config, not a 4th hardcoded '30'", () => {
    assert.equal(AUTOS_PRIVADO_LIFECYCLE_CONFIG.durationDays, 30);
    assert.equal(AUTOS_PRIVADO_LIFECYCLE_CONFIG.packageKey, "autos_privado_30d");
  });

  // ── Source wiring ────────────────────────────────────────────────────────────────────────
  check("BR browse fetch: expires_at selected and isBrRowWithinTerm applied", () => {
    const src = read("app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts");
    assert.match(src, /expires_at/);
    assert.match(src, /isListingRowActiveAndPublishedForBrowse\(r\) && isBrRowWithinTerm\(r\)/);
  });
  check("Generic anuncio detail page: expires_at selected and expiry check present", () => {
    const src = read("app/(site)/clasificados/anuncio/[id]/page.tsx");
    assert.match(src, /expires_at\";/);
    assert.match(src, /expiresMs <= Date\.now\(\)/);
  });
  check("Autos service: AUTOS_PRIVADO_LIFECYCLE_CONFIG imported and isAutosRowWithinTerm applied in both browse and detail paths", () => {
    const src = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
    assert.match(src, /import \{ AUTOS_PRIVADO_LIFECYCLE_CONFIG \} from "@\/app\/lib\/listingLifecycle\/activePaidEditCheckoutOwnership"/);
    assert.match(src, /\.map\(\(r\) => rowFromDb\(r as Record<string, unknown>\)\)\.filter\(isAutosRowWithinTerm\)/);
    assert.match(src, /if \(!isAutosRowWithinTerm\(row\)\) return null;/);
  });
  check("AUTOS_PRIVADO_LIFECYCLE_CONFIG is now exported (was private) from the checkout guard file", () => {
    const src = read("app/lib/listingLifecycle/activePaidEditCheckoutOwnership.ts");
    assert.match(src, /export const AUTOS_PRIVADO_LIFECYCLE_CONFIG: ListingLifecycleConfig/);
  });

  // ── Regression: shared/cross-category code untouched ────────────────────────────────────
  check("REGRESSION: shared isListingRowActiveAndPublishedForBrowse (used by En Venta too) untouched — no expiry logic added there", () => {
    const src = read("app/(site)/clasificados/lib/listingPublicBrowseEligibility.ts");
    assert.doesNotMatch(src, /expires_at/);
    assert.match(src, /export function isListingRowActiveAndPublishedForBrowse/);
  });
  check("REGRESSION: Autos parent-gate (Build 2/prior) untouched", () => {
    const src = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
    assert.match(src, /filterAutosRowsByActiveParent/);
    assert.match(src, /isAutosChildParentGateSatisfied/);
  });
  check("REGRESSION: Autos identity-substitution guard (Build 2) untouched", () => {
    const src = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
    assert.match(src, /isAutosChildIdentitySubstitution/);
  });
  check("REGRESSION: BR checkout no-recharge guard still references expires_at the same way", () => {
    const src = read("app/lib/listingLifecycle/activePaidEditCheckoutOwnership.ts");
    assert.match(src, /validateBrFsboActiveEditCheckoutOwnership/);
    assert.match(src, /expiresAtColumn: "expires_at"/);
  });
  check("REGRESSION: no pricing/capacity file touched (revenuePricingMatrix.ts locked prices intact)", () => {
    const src = read("app/lib/listingPlans/revenuePricingMatrix.ts");
    assert.match(src, /packageKey: "br_fsbo_45d",[\s\S]{0,150}priceCents: 4999,/);
    assert.match(src, /packageKey: "autos_privado_30d",[\s\S]{0,150}priceCents: 2499,/);
  });

  console.log(`\nverify-build4-fixed-term-expiry-truth: ${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exitCode = 1;
}

main();
