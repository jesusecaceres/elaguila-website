/**
 * ADMIN CATEGORY STATUS — DB OVERRIDE TRUTH (recovery 2026-09-25).
 *
 * Root cause of "Servicios READINESS: full" + "Staged because admin routes exist but client readiness or
 * source maturity is still partial": the canonical `site_category_config` table holds a seed row
 *   { slug: "servicios", operational_status: "staged", notes: "Puede seguir en transición según producto.",
 *     updated_at: "2026-04-09 02:10:09+00" }
 * `getClasificadosCategoryRegistryMerged` lets that row replace `operationalStatus` while `readiness` stays
 * the code value ("full"), which fell through to the generic staged reason and blamed readiness/source.
 *
 * Contract: an overlay that differs from the code default is NAMED as an override (reason + blocker), code
 * defaults stay live for the six primary verticals, and the override is not silently hidden.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-admin-category-db-override-truth-01.ts
 */
import { strict as assert } from "node:assert";
import { getClasificadosCategoryRegistry } from "../app/lib/clasificados/clasificadosCategoryRegistry";
import {
  adminCategoryStatusReasonKey,
  getAdminCategoryStatusProof,
  isAdminCategoryStatusDbOverride,
} from "../app/admin/_lib/adminCategoryStatusTruth";
import { adminTr } from "../app/admin/_lib/adminStrings";
import { mergeAdminCategoriesHubEntries } from "../app/admin/_lib/adminCategoriesHubEntries";

const registry = getClasificadosCategoryRegistry();
const servicios = registry.find((e) => e.slug === "servicios");
assert.ok(servicios, "servicios in registry");
assert.equal(servicios.operationalStatus, "live", "code default: Servicios live");
assert.equal(servicios.readiness, "full", "code default: Servicios readiness full");
assert.equal(servicios.codeDefaultOperationalStatus, "live", "code default recorded on entry");

for (const slug of ["en-venta", "restaurantes", "rentas", "bienes-raices", "empleos", "servicios"]) {
  const e = registry.find((r) => r.slug === slug);
  assert.ok(e, slug);
  assert.equal(e.operationalStatus, "live", `${slug} code default live`);
}

// Code-only entry: no override, live reason, no blocker.
const codeOnly = { ...servicios, configLayer: "code" as const, overlayNotes: null };
assert.equal(isAdminCategoryStatusDbOverride(codeOnly), false);
assert.equal(adminCategoryStatusReasonKey(codeOnly, getAdminCategoryStatusProof(codeOnly)), "hub.statusReason.live.servicios");
assert.equal(getAdminCategoryStatusProof(codeOnly).blockerKey, null);

// Exact canonical DB overlay row (read-only, 2026-09-25) merged the way getClasificadosCategoryRegistryMerged does.
const dbStaged = {
  ...servicios,
  visibility: "public" as const,
  operationalStatus: "staged" as const,
  sortOrder: 40,
  highlight: false,
  notes: "Puede seguir en transición según producto.",
  configLayer: "database" as const,
  overlayNotes: "Puede seguir en transición según producto.",
};
assert.equal(isAdminCategoryStatusDbOverride(dbStaged), true, "stale DB row detected as override");
const proof = getAdminCategoryStatusProof(dbStaged);
assert.equal(adminCategoryStatusReasonKey(dbStaged, proof), "hub.statusReason.dbOverride");
assert.equal(proof.blockerKey, "hub.blocker.dbOverrideBelowCodeLive", "blocker names the override, not hidden");
assert.notEqual(proof.blockerKey, "hub.blocker.stagedGeneric");
for (const lang of ["en", "es"] as const) {
  assert.notEqual(adminTr(lang, "hub.statusReason.dbOverride"), "hub.statusReason.dbOverride", `${lang} reason string`);
  assert.notEqual(adminTr(lang, "hub.blocker.dbOverrideBelowCodeLive"), "hub.blocker.dbOverrideBelowCodeLive", `${lang} blocker string`);
}

// DB row that agrees with code (e.g. rentas live) is not an override.
const rentas = registry.find((e) => e.slug === "rentas")!;
const dbAgrees = { ...rentas, configLayer: "database" as const, overlayNotes: "Publicada en chooser y operaciones." };
assert.equal(isAdminCategoryStatusDbOverride(dbAgrees), false);
assert.equal(adminCategoryStatusReasonKey(dbAgrees, getAdminCategoryStatusProof(dbAgrees)), "hub.statusReason.live.rentas");

// Launch truth 2026-09-25 (category reconciliation): code defaults.
const LIVE = [
  "en-venta",
  "restaurantes",
  "rentas",
  "bienes-raices",
  "empleos",
  "servicios",
  "autos",
  "clases",
  "comunidad",
  "busco",
  "mascotas-y-perdidos",
];
const hub = mergeAdminCategoriesHubEntries(registry);
for (const slug of LIVE) {
  const e = hub.find((r) => r.slug === slug);
  assert.ok(e, slug);
  assert.equal(e.operationalStatus, "live", `${slug} code default live`);
  assert.equal(e.readiness, "full", `${slug} readiness full`);
  const code = { ...e, configLayer: "code" as const, overlayNotes: null };
  const proof = getAdminCategoryStatusProof(code);
  assert.equal(proof.blockerKey, null, `${slug} has no blocker`);
  const key = adminCategoryStatusReasonKey(code, proof);
  assert.equal(key, `hub.statusReason.live.${slug}`, `${slug} live reason key`);
  for (const lang of ["en", "es"] as const) assert.notEqual(adminTr(lang, key), key, `${slug} ${lang} live reason text`);
}

// Legitimately staged: Viajes (travel), Comida Local, Ofertas Locales — each with its own real blocker.
const STAGED: Record<string, [string, string]> = {
  travel: ["hub.statusReason.stagedTravel", "hub.blocker.stagedViajesTable"],
  "comida-local": ["hub.statusReason.stagedComidaLocal", "hub.blocker.stagedComidaLocal"],
  "ofertas-locales": ["hub.statusReason.stagedOfertas", "hub.blocker.stagedOfertas"],
};
for (const [slug, [reasonKey, blockerKey]] of Object.entries(STAGED)) {
  const e = hub.find((r) => r.slug === slug);
  assert.ok(e, slug);
  assert.equal(e.operationalStatus, "staged", `${slug} stays staged`);
  const code = { ...e, configLayer: "code" as const, overlayNotes: null };
  const proof = getAdminCategoryStatusProof(code);
  assert.equal(adminCategoryStatusReasonKey(code, proof), reasonKey, `${slug} reason key`);
  assert.equal(proof.blockerKey, blockerKey, `${slug} blocker key`);
  for (const lang of ["en", "es"] as const) {
    assert.notEqual(adminTr(lang, reasonKey), reasonKey, `${slug} ${lang} reason text`);
    assert.notEqual(adminTr(lang, blockerKey), blockerKey, `${slug} ${lang} blocker text`);
  }
}
assert.match(adminTr("en", "hub.statusReason.stagedTravel"), /checkout\/fulfillment is not launch-ready and pricing remains unresolved/);
assert.match(adminTr("en", "hub.statusReason.stagedOfertas"), /ofertas_locales source and paid review circuit exist/);
assert.match(adminTr("en", "hub.statusReason.stagedComidaLocal"), /no production listing has completed the end-to-end paid launch circuit/);

// Stale generic language removed.
for (const lang of ["en", "es"] as const) {
  for (const key of ["hub.statusReason.stagedPartial", "hub.blocker.stagedPartialVertical"]) {
    const t = adminTr(lang, key);
    assert.ok(!/maturity below primary live verticals|madurez por debajo|primary-live/.test(t), `${key} ${lang} no stale maturity claim`);
  }
}
assert.equal(adminTr("en", "hub.statusReason.stagedAutos"), "hub.statusReason.stagedAutos", "stale Autos 'under QA' reason removed");
assert.equal(adminTr("en", "hub.blocker.stagedAutosPaid"), "hub.blocker.stagedAutosPaid", "stale Autos blocker removed");

console.log("PASS verify-admin-category-db-override-truth-01 (Servicios staged = stale site_category_config row, named; 11 live by code; Viajes/Comida/Ofertas staged with real blockers)");
