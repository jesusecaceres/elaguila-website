/**
 * Globalization Build D, Family 1 — targeted verifier for Servicios' Admin shared-truth adoption:
 * the Servicios admin workspace page now renders the shared AdminListingMonetizationSummary
 * component (already fully supporting the "servicios" category internally, per
 * categoryListingMonetization.ts's own servicios-specific branches), matching the exact pattern
 * already used by Restaurantes/Autos/Empleos/Travel — no new engine, no bespoke Servicios-only
 * monetization view.
 *
 * Run from repo root:
 *   npx tsx scripts/verify-family1-servicios-admin-monetization.ts
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
  console.log("verify-family1-servicios-admin-monetization: starting");

  const pageSrc = read("app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx");

  check("Servicios admin page imports the shared AdminListingMonetizationSummary component", () => {
    assert.match(pageSrc, /import \{ AdminListingMonetizationSummary \} from "\.\.\/_components\/AdminListingMonetizationSummary"/);
  });

  check("Servicios admin page renders it with the real category/source pair (matches Restaurantes' pattern)", () => {
    assert.match(pageSrc, /<AdminListingMonetizationSummary\s+category="servicios"\s+source="servicios_public_listings"/);
  });

  const resolverSrc = read("app/lib/listingPlans/categoryListingMonetization.ts");
  check("The shared resolver already has real servicios-specific handling (not a stub)", () => {
    assert.match(resolverSrc, /case "servicios":/);
    assert.match(resolverSrc, /if \(category === "servicios"\)/);
  });

  console.log(`\nverify-family1-servicios-admin-monetization: ${checks - failures}/${checks} checks passed`);
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main();
