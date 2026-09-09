/**
 * Globalization Build D, Family 2 (Bienes Raíces Privado/Negocio, Rentas Privado/Negocio) —
 * targeted verifier for:
 *   1. Recently Viewed + Report adoption on Rentas (both lanes share one detail page/component),
 *      reusing the same RecentlyViewedAndReportMount built in Family 1 — no new engine.
 *   2. Confirming Bienes Raíces (both lanes) already had Recently Viewed adopted via the shared
 *      generic /clasificados/anuncio/[id] page — a stale Plan-01 cell, not new work.
 *
 * Run from repo root:
 *   npx tsx scripts/verify-family2-bienes-rentas-adoption.ts
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
  console.log("verify-family2-bienes-rentas-adoption: starting");

  // ── Rentas (both lanes share RentasListingDetailClient.tsx) ────────────────────────────────
  const rentasSrc = read(
    "app/(site)/clasificados/rentas/listing/[id]/RentasListingDetailClient.tsx",
  );
  check("Rentas detail client reuses the shared RecentlyViewedAndReportMount (no new engine)", () => {
    assert.match(rentasSrc, /import \{ RecentlyViewedAndReportMount \} from "@\/app\/clasificados\/components\/RecentlyViewedAndReportMount"/);
    assert.match(rentasSrc, /<RecentlyViewedAndReportMount listingId=\{listing\.id\} lang=\{lang\} \/>/);
  });

  // ── Bienes Raíces stale-cell reclassification evidence ─────────────────────────────────────
  const brRedirectSrc = read("app/(site)/clasificados/bienes-raices/anuncio/[id]/page.tsx");
  check("Bienes Raíces detail route redirects into the shared generic anuncio page (not a bespoke page)", () => {
    assert.match(brRedirectSrc, /leonixLiveAnuncioPath/);
  });

  const genericAnuncioSrc = read("app/(site)/clasificados/anuncio/[id]/page.tsx");
  check("The shared generic anuncio page already calls addListingView generically (category-agnostic)", () => {
    assert.match(genericAnuncioSrc, /import \{ addListingView \} from "@\/app\/lib\/recentlyViewed"/);
    assert.match(genericAnuncioSrc, /addListingView\(listing\.id\)/);
  });
  check("The generic page reads category off the row rather than hardcoding one (so Bienes Raíces rows are covered too)", () => {
    assert.match(genericAnuncioSrc, /category:\s*listing\.category/);
  });

  console.log(`\nverify-family2-bienes-rentas-adoption: ${checks - failures}/${checks} checks passed`);
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main();
