/**
 * Gate G2-SERVICIOS — Verification script
 * Verifies Print-to-Digital ranking is wired into Servicios behind existing filters.
 */
import { readFileSync, existsSync } from "node:fs";

let pass = 0;
let fail = 0;

function assert(label, ok) {
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(`  ✗ ${label}`);
  }
}

function readFile(p) {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

console.log("\n=== Gate G2-SERVICIOS: Print-to-Digital Ranking Behind Existing Filters ===\n");

// --- 1. Servicios ranking adapter exists ---
const adapterPath = "app/(site)/clasificados/servicios/lib/serviciosVisibilityRanking.ts";
const adapterSrc = readFile(adapterPath);
assert("Servicios ranking adapter exists", adapterSrc.length > 0);

// --- 2. Adapter imports resolveListingVisibilityRank ---
assert(
  "Adapter imports resolveListingVisibilityRank",
  adapterSrc.includes("resolveListingVisibilityRank") &&
    adapterSrc.includes("printDigitalVisibilityRank"),
);

// --- 3. Adapter imports compareVisibilityRank ---
assert(
  "Adapter imports compareVisibilityRank",
  adapterSrc.includes("compareVisibilityRank"),
);

// --- 4. Adapter exports applyServiciosVisibilityRanking ---
assert(
  "Adapter exports applyServiciosVisibilityRanking",
  adapterSrc.includes("export function applyServiciosVisibilityRanking"),
);

// --- 5. Adapter exports resolveServiciosListingRank ---
assert(
  "Adapter exports resolveServiciosListingRank",
  adapterSrc.includes("export function resolveServiciosListingRank"),
);

// --- 6. Adapter is pure (no Supabase, no fetch, no import server) ---
assert(
  "Adapter is pure (no supabase/fetch/server imports)",
  !adapterSrc.includes("createClient") &&
    !adapterSrc.includes("supabase") &&
    !adapterSrc.includes("fetch(") &&
    !adapterSrc.includes("'use server'"),
);

// --- 7. serviciosResultsFilter uses the adapter ---
const filterPath = "app/(site)/clasificados/servicios/lib/serviciosResultsFilter.ts";
const filterSrc = readFile(filterPath);
assert(
  "serviciosResultsFilter imports from serviciosVisibilityRanking",
  filterSrc.includes("serviciosVisibilityRanking"),
);

// --- 8. sortServiciosResultsForDisplay calls resolveServiciosListingRank ---
assert(
  "sortServiciosResultsForDisplay uses resolveServiciosListingRank",
  filterSrc.includes("resolveServiciosListingRank"),
);

// --- 9. sortServiciosResultsForDisplay calls applyServiciosVisibilityRanking ---
assert(
  "sortServiciosResultsForDisplay uses applyServiciosVisibilityRanking",
  filterSrc.includes("applyServiciosVisibilityRanking"),
);

// --- 10. Ranking applied after filtering in results page ---
const resultsPagePath = "app/(site)/clasificados/servicios/resultados/page.tsx";
const resultsPageSrc = readFile(resultsPagePath);
assert(
  "Results page applies filtering before sortServiciosResultsForDisplay",
  resultsPageSrc.includes("filterServiciosPublicListingRows") &&
    resultsPageSrc.includes("filterServiciosRowsByKeyword") &&
    resultsPageSrc.includes("filterServiciosRowsBySeller") &&
    resultsPageSrc.includes("sortServiciosResultsForDisplay"),
);

// --- 11. Ranking preserves existing order on equal rank ---
assert(
  "Adapter preserves existing order on equal rank (stable sort with _originalIndex)",
  adapterSrc.includes("_originalIndex"),
);

// --- 12. No Stripe/checkout/payment code in Servicios public path ---
const serviciosPublicFiles = [
  adapterPath,
  resultsPagePath,
  filterPath,
  "app/(site)/clasificados/servicios/page.tsx",
];
let hasStripe = false;
for (const f of serviciosPublicFiles) {
  const src = readFile(f);
  const lines = src.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/**")) continue;
    if (
      /\bstripe\b/i.test(trimmed) ||
      /\bcheckout\b/i.test(trimmed) ||
      trimmed.includes("payment_intent") ||
      trimmed.includes("PaymentIntent")
    ) {
      hasStripe = true;
      break;
    }
  }
  if (hasStripe) break;
}
assert("No Stripe/checkout/payment code in Servicios public path", !hasStripe);

// --- 13. No public redemption in Servicios public path ---
let hasPublicRedemption = false;
for (const f of serviciosPublicFiles) {
  const src = readFile(f);
  if (src.includes("redeemPromo") || src.includes("publicRedemption") || src.includes("redeem_code")) {
    hasPublicRedemption = true;
    break;
  }
}
assert("No public redemption in Servicios public path", !hasPublicRedemption);

// --- 14. No commission/payout in Servicios public path ---
let hasCommission = false;
for (const f of serviciosPublicFiles) {
  const src = readFile(f);
  if (
    src.includes("commission_payout") ||
    src.includes("commissionPayout") ||
    src.includes("payroll")
  ) {
    hasCommission = true;
    break;
  }
}
assert("No commission/payout in Servicios public path", !hasCommission);

// --- 15. No Supabase migration added for this gate ---
const migrationDir = "supabase/migrations";
let hasG2Migration = false;
if (existsSync(migrationDir)) {
  const { readdirSync } = await import("node:fs");
  const files = readdirSync(migrationDir);
  for (const f of files) {
    if (f.includes("servicios_ranking") || f.includes("g2_servicios")) {
      hasG2Migration = true;
      break;
    }
  }
}
assert("No Supabase migration added for G2-SERVICIOS", !hasG2Migration);

// --- 16–19. Docs checks ---
const visibilityPolicyDoc = readFile("docs/print-to-digital-visibility-policy.md");
assert(
  "Docs mention Servicios ranking is behind existing filters",
  visibilityPolicyDoc.includes("after") &&
    visibilityPolicyDoc.includes("filter") &&
    visibilityPolicyDoc.includes("G2-SERVICIOS"),
);

assert(
  "Docs mention public ranking is Servicios-only in this gate",
  visibilityPolicyDoc.includes("No other category is changed"),
);

assert(
  "Docs mention Stripe remains later/global",
  visibilityPolicyDoc.includes("Stripe remains global and later"),
);

const smokeTestDoc = readFile("docs/admin-workspace-smoke-test.md");
assert(
  "Smoke test doc includes G2-SERVICIOS section",
  smokeTestDoc.includes("G2-SERVICIOS") &&
    smokeTestDoc.includes("verify:servicios-print-digital-ranking"),
);

// --- 20. No Destacados module activation built in this gate ---
assert(
  "No homepage/category Destacados module activation in adapter",
  !adapterSrc.includes("HomepageDestacados") &&
    !adapterSrc.includes("CategoryLandingDestacados") &&
    !adapterSrc.includes("DestacadosModuleComponent") &&
    !adapterSrc.includes("renderDestacadosModule"),
);

// --- 21. Build script exists in package.json ---
const pkgJson = readFile("package.json");
assert(
  "package.json has verify:servicios-print-digital-ranking script",
  pkgJson.includes("verify:servicios-print-digital-ranking"),
);

// --- 22. Barrel export re-exports adapter ---
const barrelPath = "app/(site)/clasificados/servicios/lib/serviciosResultsRanking.ts";
const barrelSrc = readFile(barrelPath);
assert(
  "Barrel re-exports serviciosVisibilityRanking adapter",
  barrelSrc.includes("serviciosVisibilityRanking") &&
    barrelSrc.includes("applyServiciosVisibilityRanking"),
);

// --- 23. Premium maps to Destacados module eligibility ---
assert(
  "Adapter mentions Premium/Destacados module eligibility (not forced into results)",
  adapterSrc.includes("eligibleForDestacadosModule") ||
    adapterSrc.includes("Destacados module eligibility"),
);

// --- 24. Full-page maps to results priority ---
assert(
  "Adapter mentions Full-page/results priority",
  adapterSrc.includes("eligibleForResultsPriority") ||
    adapterSrc.includes("Full-page"),
);

// --- 25. Category is always "servicios" ---
assert(
  "Adapter always passes category: servicios",
  adapterSrc.includes('category: "servicios"'),
);

// --- Summary ---
console.log(`\n  ${pass} passed, ${fail} failed (total ${pass + fail})\n`);
if (fail > 0) {
  console.error("FAIL: Gate G2-SERVICIOS verification failed.\n");
  process.exit(1);
}
console.log("PASS: Gate G2-SERVICIOS verification passed.\n");
