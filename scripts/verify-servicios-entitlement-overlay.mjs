/**
 * Gate G2A-SERVICIOS — Verification script
 * Verifies public-safe active entitlement overlay is wired into Servicios ranking pipeline.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";

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

console.log("\n=== Gate G2A-SERVICIOS: Active Entitlement Overlay for Ranking ===\n");

// --- 1. Overlay helper exists ---
const overlayPath = "app/(site)/clasificados/servicios/lib/serviciosEntitlementOverlay.ts";
const overlaySrc = readFile(overlayPath);
assert("Overlay helper exists", overlaySrc.length > 0);

// --- 2. Overlay is server-only ---
assert(
  "Overlay is server-only",
  overlaySrc.includes('"server-only"') || overlaySrc.includes("'server-only'"),
);

// --- 3. Overlay queries listing_package_entitlements via hydrate helper ---
assert(
  "Overlay queries listing_package_entitlements (via hydratePublicRowsWithActivePackageEntitlements)",
  overlaySrc.includes("hydratePublicRowsWithActivePackageEntitlements") ||
    overlaySrc.includes("listing_package_entitlements"),
);

// --- 4. Overlay filters category servicios ---
assert(
  "Overlay filters category servicios",
  overlaySrc.includes('"servicios"') || overlaySrc.includes("'servicios'"),
);

// --- 5. Overlay filters listing_source servicios_public_listings ---
assert(
  "Overlay filters listing_source servicios_public_listings",
  overlaySrc.includes("servicios_public_listings"),
);

// --- 6. Overlay does not expose sales_rep fields in code (comments documenting exclusion are OK) ---
const overlayCodeLines = overlaySrc
  .split("\n")
  .filter((l) => {
    const t = l.trim();
    return !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/**");
  })
  .join("\n");
assert(
  "Overlay does not expose sales_rep fields in code",
  !overlayCodeLines.includes("sales_rep_id") &&
    !overlayCodeLines.includes("sales_rep_name") &&
    !overlayCodeLines.includes("salesRepId") &&
    !overlayCodeLines.includes("salesRepName"),
);

// --- 7. Overlay does not expose payment/commission fields ---
assert(
  "Overlay does not expose payment/commission fields",
  !overlaySrc.includes("commission_payout") &&
    !overlaySrc.includes("commissionPayout") &&
    !overlaySrc.includes("payment_intent") &&
    !overlaySrc.includes("PaymentIntent"),
);

// --- 8. Overlay does not import Stripe ---
assert(
  "Overlay does not import Stripe",
  !overlaySrc.includes("from 'stripe'") &&
    !overlaySrc.includes('from "stripe"') &&
    !overlaySrc.includes("@stripe"),
);

// --- 9. Overlay does not add public redemption ---
assert(
  "Overlay does not add public redemption",
  !overlaySrc.includes("redeemPromo") &&
    !overlaySrc.includes("publicRedemption") &&
    !overlaySrc.includes("redeem_code"),
);

// --- 10. Overlay has graceful error handling ---
assert(
  "Overlay has graceful error handling (try/catch or fallback)",
  overlaySrc.includes("catch") || overlaySrc.includes("fallback"),
);

// --- 11. Results page imports overlay ---
const resultsPagePath = "app/(site)/clasificados/servicios/resultados/page.tsx";
const resultsPageSrc = readFile(resultsPagePath);
assert(
  "Results page imports overlay helper",
  resultsPageSrc.includes("overlayActiveEntitlementsForServiciosResults") ||
    resultsPageSrc.includes("serviciosEntitlementOverlay"),
);

// --- 12. Results page calls overlay after filtering ---
const filterIdx = resultsPageSrc.indexOf("filterServiciosRowsBySeller");
const overlayIdx = resultsPageSrc.indexOf("overlayActiveEntitlementsForServiciosResults");
const rankIdx = resultsPageSrc.indexOf("sortServiciosResultsForDisplay");
assert(
  "Overlay is called after filtering (filterServiciosRowsBySeller before overlay)",
  filterIdx >= 0 && overlayIdx >= 0 && filterIdx < overlayIdx,
);

// --- 13. Overlay is called before ranking (check function body, not imports) ---
const bodyStart = resultsPageSrc.indexOf("export default async function");
const bodyOverlayIdx = bodyStart >= 0
  ? resultsPageSrc.indexOf("overlayActiveEntitlementsForServiciosResults", bodyStart)
  : -1;
const bodyRankIdx = bodyStart >= 0
  ? resultsPageSrc.indexOf("sortServiciosResultsForDisplay", bodyStart)
  : -1;
assert(
  "Overlay is called before ranking (overlay before sortServiciosResultsForDisplay in body)",
  bodyOverlayIdx >= 0 && bodyRankIdx >= 0 && bodyOverlayIdx < bodyRankIdx,
);

// --- 14. Results page uses raw fetch (not pre-hydrated) ---
assert(
  "Results page uses listServiciosPublicListingsRaw (not pre-hydrated discovery)",
  resultsPageSrc.includes("listServiciosPublicListingsRaw"),
);

// --- 15. No Supabase migration added for this gate ---
let hasG2AMigration = false;
if (existsSync("supabase/migrations")) {
  const files = readdirSync("supabase/migrations");
  for (const f of files) {
    if (f.includes("g2a_servicios") || f.includes("servicios_entitlement_overlay")) {
      hasG2AMigration = true;
      break;
    }
  }
}
assert("No Supabase migration added for G2A-SERVICIOS", !hasG2AMigration);

// --- 16-19. Docs checks ---
const visibilityPolicyDoc = readFile("docs/print-to-digital-visibility-policy.md");
assert(
  "Docs mention active entitlement overlay is public-safe",
  visibilityPolicyDoc.includes("G2A-SERVICIOS") &&
    (visibilityPolicyDoc.includes("public-safe") || visibilityPolicyDoc.includes("public safe")),
);

assert(
  "Docs mention ranking still runs after filters",
  visibilityPolicyDoc.includes("filter") && visibilityPolicyDoc.includes("overlay"),
);

assert(
  "Docs mention no Destacados module yet",
  visibilityPolicyDoc.includes("No Destacados module") ||
    visibilityPolicyDoc.includes("no Destacados module"),
);

assert(
  "Docs mention Stripe remains later/global",
  visibilityPolicyDoc.includes("Stripe remains later"),
);

// --- 20. Smoke test doc includes G2A section ---
const smokeTestDoc = readFile("docs/admin-workspace-smoke-test.md");
assert(
  "Smoke test doc includes G2A-SERVICIOS section",
  smokeTestDoc.includes("G2A-SERVICIOS") &&
    smokeTestDoc.includes("verify:servicios-entitlement-overlay"),
);

// --- 21. package.json has script ---
const pkgJson = readFile("package.json");
assert(
  "package.json has verify:servicios-entitlement-overlay script",
  pkgJson.includes("verify:servicios-entitlement-overlay"),
);

// --- 22. Overlay documents public-safe fields ---
assert(
  "Overlay documents public-safe fields (package_entitlement_tier)",
  overlaySrc.includes("package_entitlement_tier"),
);

// --- 23. Overlay documents fields NOT exposed ---
assert(
  "Overlay documents fields NOT exposed (sales_rep, commission, payment)",
  overlaySrc.includes("NOT exposed") || overlaySrc.includes("not exposed") ||
    overlaySrc.includes("Fields NOT"),
);

// --- 24. Server helper file uses serviciosPublicListingsServer type ---
assert(
  "Overlay uses ServiciosPublicListingRow type",
  overlaySrc.includes("ServiciosPublicListingRow"),
);

// --- 25. Raw fetch function exists in server module ---
const serverPath = "app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts";
const serverSrc = readFile(serverPath);
assert(
  "listServiciosPublicListingsRaw exists in server module",
  serverSrc.includes("export async function listServiciosPublicListingsRaw"),
);

// --- Summary ---
console.log(`\n  ${pass} passed, ${fail} failed (total ${pass + fail})\n`);
if (fail > 0) {
  console.error("FAIL: Gate G2A-SERVICIOS verification failed.\n");
  process.exit(1);
}
console.log("PASS: Gate G2A-SERVICIOS verification passed.\n");
