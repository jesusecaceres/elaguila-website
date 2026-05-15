/**
 * Autos Phase 2 — code-level gates for test publish bypass + publish visibility audit artifacts.
 * Run: npm run autos:phase2-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const ALLOW_AUTOS_BYPASS_PREFIXES = [
  "app/(site)/clasificados/autos/",
  "app/(site)/publicar/autos/",
  "app/lib/clasificados/autos/",
  "app/api/clasificados/autos/",
  "app/admin/(dashboard)/workspace/clasificados/autos/",
  "scripts/",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function walkAllFiles(dir: string, acc: string[]) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === "node_modules" || name.name === ".next" || name.name === ".git" || name.name === ".cursor")
        continue;
      walkAllFiles(p, acc);
    } else if (/\.(ts|tsx|md|mdx)$/i.test(name.name)) {
      acc.push(p);
    }
  }
}

function assertBypassEnvOnlyInAutosScope() {
  const acc: string[] = [];
  walkAllFiles(ROOT, acc);
  const needle = "AUTOS_ALLOW_TEST_PUBLISH_BYPASS";
  for (const abs of acc) {
    const txt = fs.readFileSync(abs, "utf8");
    if (!txt.includes(needle)) continue;
    const rel = path.relative(ROOT, abs).replace(/\\/g, "/");
    const ok = ALLOW_AUTOS_BYPASS_PREFIXES.some((pre) => rel === pre || rel.startsWith(pre));
    assert.ok(ok, `AUTOS_ALLOW_TEST_PUBLISH_BYPASS must only appear under Autos scope; found in: ${rel}`);
  }
}

function assertPhase2AuditMatrix() {
  const md = read("app/lib/clasificados/autos/AUTOS_PHASE_2_PUBLISH_VISIBILITY_AUDIT.md");
  assert.ok(md.includes("| ID | Claim | Current proof | Verdict | If FALSE, exact fix needed |"));
  assert.ok(/Stripe.*paus|paused/i.test(md), "Phase 2 audit must document Stripe paused for Autos (P1)");
  for (let n = 1; n <= 24; n++) {
    const id = `P${n}`;
    assert.ok(new RegExp(`\\| ${id} \\|`).test(md), `Audit matrix must include row ${id}`);
  }
}

function run() {
  assertBypassEnvOnlyInAutosScope();

  const checkout = read("app/api/clasificados/autos/checkout/route.ts");
  assert.ok(
    checkout.includes("isAutosAllowTestPublishBypassEnabled"),
    "Autos checkout must gate test publish via isAutosAllowTestPublishBypassEnabled",
  );
  assert.ok(
    checkout.includes("activateAutosClassifiedsListing") && checkout.includes("testPublishBypass"),
    "Autos checkout must activate listing when testPublishBypass path is used",
  );

  const verify = read("app/api/clasificados/autos/checkout/verify-internal/route.ts");
  assert.ok(
    verify.includes("isAutosAllowTestPublishBypassEnabled"),
    "verify-internal must allow test bypass alongside internal bypass",
  );

  const bypass = read("app/lib/clasificados/autos/autosTestPublishBypass.ts");
  assert.ok(
    /VERCEL_ENV.*production/.test(bypass),
    "Test publish bypass must be disabled on Vercel production (VERCEL_ENV)",
  );

  const contract = read("app/(site)/clasificados/autos/filters/autosBrowseFilterContract.ts");
  assert.ok(
    contract.includes("/clasificados/autos/vehiculo/"),
    "Public live detail path must use /clasificados/autos/vehiculo/[id]",
  );

  const stdCard = read("app/(site)/clasificados/autos/components/public/AutosPublicStandardCard.tsx");
  for (const needle of ["sellerType", "formatAutosUsd", "formatAutosMiles", "formatAutosLocation", "vehicleTitle"]) {
    assert.ok(stdCard.includes(needle), `AutosPublicStandardCard must include ${needle} for card surface checks`);
  }

  const filters = read("app/(site)/clasificados/autos/components/public/autosPublicFilters.ts");
  assert.ok(
    filters.includes("applyAutosPublicFilters") && filters.includes("sortAutosPublicListings"),
    "Autos public filters + sort must exist",
  );
  assert.ok(
    filters.includes("radiusMiles") || read("app/(site)/clasificados/autos/filters/autosPublicFilterTypes.ts").includes("radiusMiles"),
    "Radius must remain documented in contract/types (not faked as an active filter)",
  );

  assert.ok(
    fs.existsSync(path.join(ROOT, "app", "admin", "(dashboard)", "workspace", "clasificados", "autos", "page.tsx")),
    "Admin Autos queue page must exist",
  );

  const dashBand = path.join(ROOT, "app", "(site)", "dashboard", "components", "DashboardAutosPaidDraftsBand.tsx");
  assert.ok(fs.existsSync(dashBand), "User dashboard Autos band component must exist for management entry");

  assertPhase2AuditMatrix();

  console.log("autos-phase-2-publish-visibility-audit: OK");
}

run();
