/**
 * Gate G2B-SERVICIOS-STACK — Servicios Destacados module verification.
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

console.log("\n=== Gate G2B-SERVICIOS-STACK — Servicios Destacados Module ===\n");

const helperPath = "app/(site)/clasificados/servicios/lib/serviciosDestacados.ts";
const componentPath = "app/(site)/clasificados/servicios/components/ServiciosDestacadosSection.tsx";
const resultsPath = "app/(site)/clasificados/servicios/resultados/page.tsx";
const landingPath = "app/(site)/clasificados/servicios/landing/ServiciosLandingPage.tsx";

const helper = read(helperPath);
const component = read(componentPath);
const results = read(resultsPath);
const landing = read(landingPath);
const helperCode = readNonComment(helperPath);
const resultsCode = readNonComment(resultsPath);

assert(existsSync(helperPath), "Servicios Destacados helper exists");
assert(helper.includes("getServiciosDestacadosRows"), "Helper exports getServiciosDestacadosRows");
assert(helper.includes("compareServiciosDestacadosRows"), "Helper exports compareServiciosDestacadosRows");
assert(helper.includes("getServiciosDestacadoDisplayMode"), "Helper exports getServiciosDestacadoDisplayMode");
assert(helper.includes("isServiciosRowDestacadoEligible"), "Helper uses active entitlement/rank fields");
assert(
  helper.includes("entitlement_digital_placement_priority") || helper.includes("placementPriorityForRow"),
  "Helper uses magazine placement/page priority or documented fallback",
);

assert(existsSync(componentPath), "Servicios Destacados component exists");
assert(
  component.includes("Destacados") && (component.includes("Patrocinados") || component.includes("Sponsored")),
  "Component says Destacados or Patrocinados",
);
assert(component.includes("hero") || component.includes("getServiciosDestacadoDisplayMode"), "One-card layout mode exists");
assert(component.includes("compact") || component.includes("overflow-x"), "Multi-card compact/scroll layout exists");

assert(results.includes("ServiciosDestacadosSection"), "Results page renders Destacados section");
assert(results.includes("getServiciosDestacadosRows"), "Results page uses Destacados helper");
assert(
  landing.includes("ServiciosDestacadosSection"),
  "Landing page renders Destacados section",
);

const resultsBody = results.slice(results.indexOf("export default async function"));
const overlayIdx = resultsBody.indexOf("overlayActiveEntitlementsForServiciosResults");
const destacadosIdx = resultsBody.indexOf("getServiciosDestacadosRows");
const sortIdx = resultsBody.indexOf("sortServiciosResultsForDisplay");
assert(overlayIdx >= 0 && destacadosIdx > overlayIdx, "Destacados runs after entitlement overlay on results");
assert(sortIdx > destacadosIdx || sortIdx > overlayIdx, "Ranking/sort pipeline present on results page");

assert(!helperCode.toLowerCase().includes("stripe"), "Helper does not reference Stripe");
assert(!helperCode.includes("sales_rep"), "Helper does not expose sales_rep");
assert(!helperCode.includes("commission"), "Helper does not expose commission");
assert(!component.includes("checkout"), "Component has no checkout CTA");

const serviciosPublic = [
  helperPath,
  componentPath,
  resultsPath,
  landingPath,
  "app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard.tsx",
].map(readNonComment).join("\n");
assert(!serviciosPublic.includes("leonix_payment_records"), "No payment records in Servicios public path");
assert(!serviciosPublic.includes("public redemption"), "No public redemption in Servicios public path");

const visibilityDoc = read("docs/print-to-digital-visibility-policy.md");
assert(visibilityDoc.includes("G2B-SERVICIOS"), "Docs mention G2B Servicios Destacados");
assert(visibilityDoc.includes("Servicios only") || visibilityDoc.includes("Servicios-only"), "Docs mention Servicios-only Destacados");
assert(
  visibilityDoc.includes("Homepage") || visibilityDoc.includes("Clasificados") || visibilityDoc.includes("Nuestros Negocios"),
  "Docs mention homepage/Clasificados/Nuestros Negocios later",
);
assert(visibilityDoc.includes("No Stripe") || visibilityDoc.includes("No Stripe,"), "Docs mention no Stripe in gate");

const smokeDoc = read("docs/admin-workspace-smoke-test.md");
assert(smokeDoc.includes("G2B-SERVICIOS"), "Smoke test doc has G2B section");

const pkg = read("package.json");
assert(pkg.includes("verify:servicios-destacados-module"), "package.json has verify script");

if (existsSync("supabase/migrations")) {
  const { readdirSync } = await import("node:fs");
  const migrations = readdirSync("supabase/migrations");
  const g2b = migrations.filter((f) => f.includes("servicios_destacados") || f.includes("destacados_module"));
  assert(g2b.length === 0, "No Supabase migration added for G2B");
} else {
  assert(true, "No migration dir (OK)");
}

console.log(`\n  Results: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
console.log("PASS: Gate G2B-SERVICIOS-STACK verification passed.\n");
