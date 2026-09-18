/**
 * Servicios Final Consolidated Lifecycle Execution — Gate 4 (Entry convergence, 2026-09-18).
 *
 * 1. The three generic "Anunciar mi negocio" Negocios Locales CTAs (hero, sponsor block, bottom
 *    promo) no longer route through the deprecated generic /publicar gateway via a login redirect —
 *    per owner decision, they anchor to the on-page sector grid (#sectores), where Servicios'
 *    already-correct per-lane card link lives alongside Restaurantes/Autos-Dealer's own (co-equal
 *    priority lanes, per PRIORITY_LANES) — fixing the deprecated-gateway defect for every lane
 *    without biasing the page's most prominent CTAs toward one lane over the others.
 * 2. Three hardcoded duplicates of the Servicios checkpoint route literal now read from the shared
 *    CATEGORY_ROUTE_REGISTRY instead of a copy-pasted string.
 * 3. The proven-zero-importer PublishServiceCTA.tsx dead file is removed.
 * 4. The internal /clasificados/publicar/servicios application route itself (implementation
 *    infrastructure, not customer-entry doctrine) is untouched.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-exec-gate4-entry-convergence.ts
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

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
const ROOT = new URL("..", import.meta.url);
const raw = (rel: string) => stripComments(readFileSync(new URL(rel, ROOT), "utf8").replace(/\r\n/g, "\n"));

const NEGOCIOS_CLIENT = "app/(site)/negocios-locales/NegociosLocalesClient.tsx";
const NEGOCIOS_LANES = "app/(site)/negocios-locales/_lib/negociosLocalesLanes.ts";
const PUBLICAR_CLIENT = "app/(site)/clasificados/publicar/PublicarPageClient.tsx";
const CATEGORY_DISPATCH = "app/(site)/clasificados/publicar/[category]/page.tsx";
const APPLICATION_ROUTE = "app/(site)/clasificados/publicar/servicios/page.tsx";

check("the three generic Negocios Locales CTAs anchor to the sector grid, not a login-wrapped generic gateway", () => {
  const src = raw(NEGOCIOS_CLIENT);
  assert.ok(src.includes('const advertiseEntryHref = "#sectores";'));
  assert.ok(!src.includes("buildBusinessAdvertiseEntryHref"), "the retired generic-gateway builder must no longer be referenced");
  const hits = [...src.matchAll(/href=\{advertiseEntryHref\}/g)].length;
  assert.equal(hits, 3, "all three prominent CTAs (hero, sponsor, promo) must use the fixed anchor");
});

check("the retired generic-gateway builder is fully removed from the lane helper module, not just unused", () => {
  const src = raw(NEGOCIOS_LANES);
  assert.ok(!src.includes("buildBusinessAdvertiseEntryHref"));
});

check("Servicios' own sector-grid card link is untouched — still the real, correct per-lane route", () => {
  const src = raw(NEGOCIOS_CLIENT);
  assert.ok(src.includes("advertiseHref={buildNegociosAdvertiseHref(lane, routeLang)}"));
});

check("all three hardcoded checkpoint-route literals now read from the shared category registry", () => {
  for (const file of [PUBLICAR_CLIENT, CATEGORY_DISPATCH]) {
    const src = raw(file);
    assert.ok(
      !/["'`]\/clasificados\/publicar\/servicios\/checkpoint/.test(src),
      `${file} must no longer hardcode the checkpoint route literal`,
    );
    assert.ok(
      src.includes("CATEGORY_ROUTE_REGISTRY.servicios.checkpointRoute"),
      `${file} must read the checkpoint route from the shared registry`,
    );
    assert.ok(
      src.includes('from "@/app/lib/listingIdentity/categoryRouteRegistry"'),
      `${file} must import the registry`,
    );
  }
});

check("the proven-zero-importer dead CTA file is deleted", () => {
  assert.ok(
    !existsSync(new URL("app/(site)/clasificados/servicios/landing/PublishServiceCTA.tsx", ROOT)),
    "PublishServiceCTA.tsx must be removed",
  );
  const hits = execSync('git grep -l "PublishServiceCTA" || true', { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  // Tolerated: the historical doc reference, and this verifier script's own text (which necessarily
  // names the deleted file to check for it) once it is committed and tracked by git grep itself.
  assert.ok(
    hits.every((f) => f.includes("SERVICIOS_LIVE_WIRING_MAP.md") || f.endsWith("verify-servicios-exec-gate4-entry-convergence.ts")),
    "no remaining code reference to the deleted file",
  );
});

check("the internal Servicios application route (implementation infrastructure) is untouched", () => {
  assert.ok(existsSync(new URL(APPLICATION_ROUTE, ROOT)), "the application route redirect shim must still exist");
});

if (failures.length) {
  console.error(`\nverify-servicios-exec-gate4-entry-convergence: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-exec-gate4-entry-convergence: PASS");
