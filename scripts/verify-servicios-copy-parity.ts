/**
 * SERVICIOS LIVE LAUNCH PERFECTION — Wave 1 (⚠️1 / ⚠️2 / ⚠️3), 2026-09-13.
 *
 * ⚠️1  One canonical paid door. The Clasificados hub resolved through the publish gateway to the
 *      bare application (`SERVICIOS_ADAPTER` had no `checkpointRoute`) while the Negocios Locales
 *      lane reached the $399 checkpoint through the /clasificados/publicar/servicios redirect.
 * ⚠️2  The only proven product-copy defect: the EN application labelled the plan "$399/mes".
 * ⚠️3  ES / EN semantic parity — every Servicios copy getter must expose the same key set in both
 *      locales, and no EN table may carry the Spanish "/mes" unit (nor ES the English "/month").
 *
 * Execution-first: the real gateway resolver, the real registry adapter and the real copy getters
 * are executed. Source assertions then pin the two doors and the application's own unit strings.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-copy-parity.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { resolvePublicarGatewayDestination } from "../app/(site)/publicar/publicarGatewayResolver";
import { CATEGORY_ROUTE_REGISTRY } from "../app/lib/listingIdentity/categoryRouteRegistry";
import { getClasificadosServiciosCopy } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationCopy";
import { getServiciosApplicationStepLabels } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosApplicationStepLabels";
import { getServiciosPublishSuccessCopy } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosPublishSuccessCopy";
import { getServiciosCheckpointCard } from "../app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints";
import {
  getServiciosCredentialsCardCopy,
  getServiciosProfileLabels,
  getServiciosPromocionesSectionCopy,
  getServiciosSmartTrustSummaryCopy,
} from "../app/(site)/servicios/copy/serviciosProfileCopy";

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
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const src = (rel: string) => stripComments(raw(rel));

const CHECKPOINT = "/clasificados/publicar/servicios/checkpoint";
const APPLICATION = "/publicar/servicios";
const APP_COMPONENT =
  "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx";

/** Sorted, dotted key paths of every nested plain object; functions and arrays are leaves. */
function keyPaths(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return prefix ? [prefix] : [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) out.push(...keyPaths(v, path));
    else out.push(path);
  }
  return out.sort();
}
/** Every string leaf (arrays included) of a copy object. */
function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => strings(v, out));
  return out;
}
function assertParity(name: string, es: unknown, en: unknown) {
  assert.deepEqual(keyPaths(es), keyPaths(en), `${name}: ES/EN key sets differ`);
  assert.ok(keyPaths(es).length > 0, `${name}: empty copy object`);
}
function assertNoUnitLeak(name: string, es: unknown, en: unknown) {
  const enLeaks = strings(en).filter((s) => /\/mes\b/.test(s));
  assert.deepEqual(enLeaks, [], `${name}: EN copy carries the Spanish "/mes" unit`);
  const esLeaks = strings(es).filter((s) => /\/month\b/.test(s));
  assert.deepEqual(esLeaks, [], `${name}: ES copy carries the English "/month" unit`);
}

/* ==============================================================================================
 * ⚠️1 — both doors converge on the checkpoint; the application route stays direct for edit.
 * ============================================================================================ */
check("⚠️1 gateway: category=servicios (es) resolves to the paid checkpoint", () => {
  assert.equal(resolvePublicarGatewayDestination("servicios", "es"), `${CHECKPOINT}?lang=es`);
});
check("⚠️1 gateway: category=servicios (en) resolves to the paid checkpoint, lang preserved", () => {
  assert.equal(resolvePublicarGatewayDestination("servicios", "en"), `${CHECKPOINT}?lang=en`);
});
check("⚠️1 adapter: checkpointRoute declared, applicationRoute unchanged", () => {
  const adapter = CATEGORY_ROUTE_REGISTRY.servicios;
  assert.equal(adapter.checkpointRoute, CHECKPOINT);
  assert.equal(adapter.applicationRoute, APPLICATION);
  assert.equal(adapter.hubRoute, undefined, "Servicios has no hub; the checkpoint is the door");
});
check("⚠️1 adapter: dashboard edit / offers-edit / preview stay on the direct routes", () => {
  const adapterSrc = src("app/lib/listingIdentity/categoryRouteRegistry.ts");
  const start = adapterSrc.indexOf("const SERVICIOS_ADAPTER");
  const end = adapterSrc.indexOf("knownLimitations", start);
  const block = adapterSrc.slice(start, end);
  assert.ok(start > 0 && end > start, "SERVICIOS_ADAPTER block not found");
  assert.equal((block.match(/\$\{SERVICIOS_APPLICATION_BASE\}\?/g) ?? []).length, 2, "editRoute + secondaryManageRoute");
  assert.equal((block.match(/\$\{SERVICIOS_PREVIEW_BASE\}\?/g) ?? []).length, 1, "previewRoute");
  assert.ok(!block.includes(`${CHECKPOINT}?`), "no edit/preview route may route through the checkpoint");
});
check("⚠️1 Negocios door: /clasificados/publicar/servicios still redirects to the checkpoint", () => {
  const page = src("app/(site)/clasificados/publicar/servicios/page.tsx");
  assert.ok(page.includes(CHECKPOINT), "plain entry page must redirect to the checkpoint");
  const client = src("app/(site)/clasificados/publicar/servicios/checkpoint/ServiciosCheckpointClient.tsx");
  assert.ok(client.includes(`${APPLICATION}?`) || client.includes(`"${APPLICATION}"`), "checkpoint CTA hands off to the application");
  assert.ok(!client.includes("redirect("), "checkpoint must remain a real pricing page, not a redirect");
});

/* ==============================================================================================
 * ⚠️2 — the EN application never says "/mes".
 * ============================================================================================ */
check("⚠️2 application: EN plan label and pricing summary use /month, ES keeps /mes", () => {
  const app = src(APP_COMPONENT);
  assert.ok(app.includes(`"Professional services — $399/month"`), "EN product-param label");
  assert.ok(app.includes(`"Servicios profesionales — $399/mes"`), "ES product-param label untouched");
  assert.ok(!app.includes(`Professional services — $399/mes`), "EN label must not carry /mes");
  const lines = app.split("\n").filter((l) => /\/mes\b/.test(l));
  assert.ok(lines.length > 0, "the ES unit must still exist");
  for (const line of lines) {
    // Every remaining "/mes" is either the ES side of a lang ternary or the ES plan literal
    // that shares its line with the (now English) EN literal.
    const okEsTernary = /"\/month" : "\/mes"/.test(line);
    const okEsLiteral =
      /Servicios profesionales — \$399\/mes/.test(line) && /Professional services — \$399\/month/.test(line);
    assert.ok(okEsTernary || okEsLiteral, `unguarded "/mes" in the application: ${line.trim()}`);
  }
});
check("⚠️2 checkpoint card: EN card has no /mes, ES card has no /month, bullets parity", () => {
  const es = getServiciosCheckpointCard("es", APPLICATION);
  const en = getServiciosCheckpointCard("en", APPLICATION);
  assertNoUnitLeak("checkpoint card", es, en);
  assert.equal(es.includedBullets.length, en.includedBullets.length, "includedBullets count");
  assert.equal(es.id, en.id);
  assert.ok(es.priceLabel.startsWith("$399.00"), `price derives from the matrix (39900): ${es.priceLabel}`);
  assert.ok(en.priceLabel.startsWith("$399.00"), `price derives from the matrix (39900): ${en.priceLabel}`);
});

/* ==============================================================================================
 * ⚠️3 — every Servicios copy getter exposes identical key sets in ES and EN.
 * ============================================================================================ */
check("⚠️3 application copy: ES/EN key parity + no unit leak", () => {
  const es = getClasificadosServiciosCopy("es");
  const en = getClasificadosServiciosCopy("en");
  assertParity("application copy", es, en);
  assertNoUnitLeak("application copy", es, en);
});
check("⚠️3 application step labels: same count in ES and EN", () => {
  const es = getServiciosApplicationStepLabels("es");
  const en = getServiciosApplicationStepLabels("en");
  assert.equal(es.length, en.length);
  assert.equal(es.length, 8);
});
check("⚠️3 publish success copy: ES/EN key parity", () => {
  assertParity("publish success", getServiciosPublishSuccessCopy("es"), getServiciosPublishSuccessCopy("en"));
});
check("⚠️3 public profile labels: ES/EN key parity", () => {
  assertParity("profile labels", getServiciosProfileLabels("es"), getServiciosProfileLabels("en"));
});
check("⚠️3 public credentials / trust / promociones copy: ES/EN key parity", () => {
  assertParity("credentials", getServiciosCredentialsCardCopy("es"), getServiciosCredentialsCardCopy("en"));
  assertParity("smart trust", getServiciosSmartTrustSummaryCopy("es"), getServiciosSmartTrustSummaryCopy("en"));
  assertParity("promociones", getServiciosPromocionesSectionCopy("es"), getServiciosPromocionesSectionCopy("en"));
});

if (failures.length) {
  console.error(`\nverify-servicios-copy-parity: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\nverify-servicios-copy-parity: PASS");
