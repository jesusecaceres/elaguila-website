#!/usr/bin/env node
/** SVC-LAUNCH-INTELLIGENCE-1 — discovery/placement truth */
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const assert = (c, m) => { if (!c) throw new Error(m); };

const resultados = read("app/(site)/clasificados/servicios/resultados/page.tsx");
const ranking = read("app/(site)/clasificados/servicios/lib/serviciosVisibilityRanking.ts");
const filter = read("app/(site)/clasificados/servicios/lib/serviciosResultsFilter.ts");
const landing = read("app/(site)/clasificados/servicios/landing/ServiciosLandingPage.tsx");

assert(resultados.includes("filterServiciosPublicListingRows"), "pipeline: filter first");
assert(resultados.includes("overlayActiveEntitlementsForServiciosResults"), "pipeline: entitlement overlay");
assert(resultados.includes("sortServiciosResultsForDisplay"), "pipeline: sort after filter");
assert(!resultados.match(/sortServiciosResultsForDisplay[\s\S]{0,200}filterServiciosPublicListingRows/), "no ranking before filter");

assert(ranking.includes("resolveListingPlacementEntitlement"), "ranking: entitlement-first");
assert(ranking.includes("listing_package_entitlements"), "ranking: entitlement source");
assert(filter.includes("print_package_tier"), "filter: tier maps to rank input");

assert(landing.includes("whatsapp: \"1\""), "landing: whatsapp shortcut");
assert(landing.includes("free_estimate: \"1\""), "landing: quote shortcut");
assert(landing.includes("verified: \"1\""), "landing: verified shortcut");

for (const f of [ranking, filter, resultados, landing]) {
  assert(!f.includes("membership_tier"), "no account plan leakage");
  assert(!f.includes("business_premium"), "no account plan leakage");
}

console.log("verify-servicios-discovery-placement-truth: PASS");
