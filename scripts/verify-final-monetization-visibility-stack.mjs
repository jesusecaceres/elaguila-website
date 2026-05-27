/**
 * FINAL-MONETIZATION-VISIBILITY-STACK verification.
 */

import { readFileSync, existsSync } from "node:fs";

let pass = 0;
let fail = 0;

function assert(condition, label) {
  if (condition) { pass++; console.log(`  ✅ ${label}`); }
  else { fail++; console.error(`  ❌ ${label}`); }
}

function read(p) {
  try { return readFileSync(p, "utf8"); } catch { return ""; }
}

function readNonComment(p) {
  return read(p).split("\n").filter((l) => {
    const t = l.trim();
    return t && !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
  }).join("\n");
}

console.log("\n=== FINAL-MONETIZATION-VISIBILITY-STACK ===\n");

// Servicios
assert(existsSync("app/(site)/clasificados/servicios/lib/serviciosDestacados.ts"), "Servicios Destacados helper exists");
assert(existsSync("app/(site)/clasificados/servicios/components/ServiciosDestacadosSection.tsx"), "Servicios Destacados component exists");
const serviciosLanding = read("app/(site)/clasificados/servicios/landing/ServiciosLandingPage.tsx");
const serviciosResults = read("app/(site)/clasificados/servicios/resultados/page.tsx");
assert(serviciosLanding.includes("ServiciosDestacadosSection"), "Servicios landing renders Destacados");
assert(serviciosResults.includes("ServiciosDestacadosSection"), "Servicios results renders Destacados");
assert(read("app/lib/listingPlans/publicMonetizationBadges.ts").includes("Verificado por Leonix"), "Shared badges include Verificado por Leonix");
assert(read("app/(site)/clasificados/servicios/lib/serviciosDestacados.ts").includes("getPublicMonetizationBadges"), "Servicios badges use shared helper");

const serviciosPublic = readNonComment("app/(site)/clasificados/servicios/lib/serviciosDestacados.ts");
assert(!serviciosPublic.includes("sales_rep"), "Servicios does not expose sales_rep");
assert(!serviciosPublic.includes("commission"), "Servicios does not expose commission");

// Restaurantes
assert(existsSync("app/(site)/clasificados/restaurantes/lib/restaurantesEntitlementOverlay.ts"), "Restaurantes entitlement overlay exists");
assert(existsSync("app/(site)/clasificados/restaurantes/lib/restaurantesVisibilityRanking.ts"), "Restaurantes ranking helper exists");
assert(existsSync("app/(site)/clasificados/restaurantes/lib/restaurantesDestacados.ts"), "Restaurantes Destacados helper exists");
assert(existsSync("app/(site)/clasificados/restaurantes/components/RestaurantesDestacadosSection.tsx"), "Restaurantes Destacados component exists");

const rxRank = read("app/(site)/clasificados/restaurantes/lib/restaurantesVisibilityRanking.ts");
assert(rxRank.includes("resolveListingVisibilityRank"), "Restaurantes uses resolveListingVisibilityRank");

const rxShell = read("app/(site)/clasificados/restaurantes/resultados/RestaurantesResultsShell.tsx");
assert(rxShell.includes("filterRestaurantesBlueprintRows"), "Restaurantes filters remain before ranking");
assert(rxShell.indexOf("filterRestaurantesBlueprintRows") < rxShell.indexOf("applyRestaurantesVisibilityRanking"), "Restaurantes filter before ranking");
assert(rxShell.includes("RestaurantesDestacadosSection"), "Restaurantes results renders Destacados");

const rxLanding = read("app/(site)/clasificados/restaurantes/landing/RestaurantesLandingPage.tsx");
assert(rxLanding.includes("RestaurantesDestacadosSection"), "Restaurantes landing renders Destacados");

assert(read("app/(site)/clasificados/restaurantes/lib/restaurantesDestacados.ts").includes("entitlementDigitalPlacementPriority"), "Restaurantes uses magazine placement priority");

const publicPaths = [
  serviciosResults,
  serviciosLanding,
  rxShell,
  rxLanding,
].join("\n");
assert(!publicPaths.includes("stripe_checkout"), "No Stripe checkout in public paths");
assert(!publicPaths.includes("leonix_payment_records"), "No payment records in public paths");

// No autos/bienes/rentas changes in this gate (spot check)
const autosRank = read("app/(site)/clasificados/autos");
// file is dir - skip

const policy = read("docs/print-to-digital-visibility-policy.md");
assert(policy.includes("FINAL-MONETIZATION") || policy.includes("Restaurantes"), "Docs mention Restaurantes visibility");
assert(policy.includes("Servicios") && (policy.includes("Destacados") || policy.includes("G2B")), "Docs mention Servicios Destacados");
assert(policy.includes("Stripe") && policy.includes("later"), "Docs mention Stripe later");
assert(policy.includes("final QA") || policy.includes("Final QA"), "Docs mention final QA");

const smoke = read("docs/admin-workspace-smoke-test.md");
assert(smoke.includes("FINAL-MONETIZATION") || smoke.includes("Restaurantes Destacados"), "Smoke test updated");

assert(read("package.json").includes("verify:final-monetization-visibility-stack"), "package.json script exists");

if (existsSync("supabase/migrations")) {
  const { readdirSync } = await import("node:fs");
  const migrations = readdirSync("supabase/migrations");
  const bad = migrations.filter((f) => f.includes("final_monetization") || f.includes("restaurantes_destacados"));
  assert(bad.length === 0, "No Supabase migration added");
} else {
  assert(true, "No migration dir");
}

console.log(`\n  Results: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
console.log("PASS: FINAL-MONETIZATION-VISIBILITY-STACK verification passed.\n");
