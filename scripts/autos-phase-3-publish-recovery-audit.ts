/**
 * Autos Phase 3 — publish recovery audit artifact + Autos-only bypass gates (no DB / no Stripe calls).
 * Run: npm run autos:phase3-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
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

const DISALLOW_STRIPE_PATH_SUBSTR = [
  "app/api/stripe/",
  "app/lib/stripe",
  "stripe/webhook",
  "middleware/stripe",
];

const DISALLOW_I18N_PATH_SUBSTR = ["next-intl", "app/i18n", "messages/", "locales/"];

const PUBLISH_RECOVERY_TABLE_ROWS = [
  "Only allowed files were changed",
  "No unrelated files were modified",
  "Build/check passed or unrelated failure was clearly reported",
  "git diff --name-only was reported",
  "Publish writes a real public row",
  "Publish does not return success without persistence",
  "Landing reads the canonical public table",
  "Results reads the canonical public table",
  "Detail route reads the canonical public table",
  "Preview and public use compatible data shape",
  "Large optional media does not block publish",
  "Final publish payload avoids giant base64 media",
  "Videos use durable public playback data if supported",
  "Stable key strategy is leonix_ad_id → id → slug",
  "Republish updates the same row",
  "Republish preserves engagement identity",
  "Dashboard can resolve the listing",
  "Admin can resolve the listing",
  "Like/save uses real tables if enabled",
  "No fake public listings were added",
  "No fake counts were added",
  "No unrelated categories were touched",
  "npm run build passed",
] as const;

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

function assertPhase3RuntimeVisibilityAuditStructure() {
  const md = read("app/lib/clasificados/autos/AUTOS_PHASE_3_RUNTIME_VISIBILITY_AUDIT.md");
  assert.ok(md.includes("| ID | Claim | Runtime proof | Verdict | If FALSE, exact fix needed |"));
  assert.ok(md.includes("## Runtime proof"), "Phase 3 runtime audit must include ## Runtime proof section");
  assert.ok(/###\s*Privado/i.test(md), "Runtime audit must include Privado subsection");
  assert.ok(/###\s*Negocios/i.test(md), "Runtime audit must include Negocios subsection");
  for (let n = 1; n <= 27; n++) {
    const id = `R${n}`;
    assert.ok(new RegExp(`\\| ${id} \\|`).test(md), `Runtime audit matrix must include row ${id}`);
  }
  assert.ok(
    /TRUE \(runtime\)|FALSE \(runtime\)|TRUE \(code\)/.test(md),
    "Runtime audit must include verdict wording: TRUE (runtime), FALSE (runtime), or TRUE (code)",
  );
  assert.ok(
    /Listing ID:|Runtime proof not executed because:/i.test(md),
    "Runtime audit must mention Listing ID fields or explicit blocker phrasing",
  );
  assert.ok(
    /Landing URL checked:|Results URL checked:|Detail URL checked:|User dashboard URL checked:|Admin dashboard URL checked:/i.test(md),
    "Runtime audit must include URL field labels for landing/results/detail/dashboard/admin",
  );
}

function assertPublishRecoveryAuditStructure() {
  const rel = "app/lib/clasificados/autos/AUTOS_PHASE_3_PUBLISH_RECOVERY_AUDIT.md";
  assert.ok(fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep))), `${rel} must exist`);
  const md = read(rel);
  for (const section of [
    "## 1. Files inspected",
    "## 11. Runtime proof",
    "## 12. Changed files",
    "## 16. Remaining risks",
  ]) {
    assert.ok(md.includes(section), `${rel} must include section: ${section}`);
  }
  assert.ok(/###\s*Privado/i.test(md), "Publish recovery audit runtime proof must include Privado");
  assert.ok(/###\s*Negocios/i.test(md), "Publish recovery audit runtime proof must include Negocios");
  assert.ok(
    /Listing ID:|Runtime proof was blocked|runtime proof blocked|not executed/i.test(md),
    "Publish recovery audit must mention listing IDs or explicit runtime proof blocker",
  );
  assert.ok(
    /(\/clasificados\/autos\b|Landing URL|Results URL|detail)/i.test(md),
    "Publish recovery audit must reference public Autos URLs or paths",
  );
  assert.ok(md.includes("| Requirement | TRUE/FALSE | Evidence |"), "Publish recovery audit must include TRUE/FALSE table header");
  for (const row of PUBLISH_RECOVERY_TABLE_ROWS) {
    assert.ok(md.includes(row), `TRUE/FALSE table must include requirement row: ${row}`);
  }
  assert.ok(
    /TRUE|FALSE|TRUE runtime|TRUE code|FALSE runtime/i.test(md),
    "Publish recovery audit must document TRUE/FALSE/runtime/code verdicts in the table or narrative",
  );
}

function assertPhase1And2AuditsPresent() {
  assert.ok(fs.existsSync(path.join(ROOT, "app", "lib", "clasificados", "autos", "AUTOS_PHASE_1_STRICT_GO_LIVE_AUDIT.md")));
  assert.ok(fs.existsSync(path.join(ROOT, "app", "lib", "clasificados", "autos", "AUTOS_PHASE_2_PUBLISH_VISIBILITY_AUDIT.md")));
}

function assertDetailPathContract() {
  const contract = read("app/(site)/clasificados/autos/filters/autosBrowseFilterContract.ts");
  assert.ok(
    contract.includes("/clasificados/autos/vehiculo/"),
    "Public live detail path must use /clasificados/autos/vehiculo/[id]",
  );
}

function assertCheckoutUsesTestBypassGate() {
  const checkout = read("app/api/clasificados/autos/checkout/route.ts");
  assert.ok(checkout.includes("isAutosAllowTestPublishBypassEnabled"), "Autos checkout must reference test publish bypass gate");
  assert.ok(checkout.includes("testPublishBypass"), "Autos checkout must name testPublishBypass branch");
  assert.ok(
    checkout.includes("getAutosClassifiedsListingById") && checkout.includes("activate_verify_failed"),
    "Autos checkout must verify DB activation after bypass paths",
  );
}

function assertGitDiffAutosOnlyIfDirty() {
  const pathspecs = [
    "app/(site)/clasificados/autos",
    "app/(site)/publicar/autos",
    "app/lib/clasificados/autos",
    "app/api/clasificados/autos",
    "app/admin/(dashboard)/workspace/clasificados/autos",
    "e2e/autos",
    "playwright.autos-runtime.config.mjs",
    "scripts/autos",
    "package.json",
  ];
  const gr = spawnSync("git", ["diff", "--name-only", "HEAD", "--", ...pathspecs], { encoding: "utf8", cwd: ROOT });
  if (gr.status !== 0 || !gr.stdout?.trim()) return;
  const files = gr.stdout
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowRe =
    /^(app\/\(site\)\/(clasificados\/autos|publicar\/autos)\/|app\/lib\/clasificados\/autos\/|app\/api\/clasificados\/autos\/|app\/admin\/\(dashboard\)\/workspace\/clasificados\/autos\/|e2e\/autos\/|playwright\.autos-runtime\.config\.mjs|scripts\/autos-|package\.json$)/;
  for (const f of files) {
    const rel = f.replace(/\\/g, "/");
    assert.ok(allowRe.test(rel), `Unexpected modified file in scoped Autos git diff: ${rel}`);
    for (const d of DISALLOW_STRIPE_PATH_SUBSTR) {
      assert.ok(!rel.includes(d), `Stripe-global path must not change in Phase 3: ${rel}`);
    }
    for (const d of DISALLOW_I18N_PATH_SUBSTR) {
      assert.ok(!rel.includes(d), `Global i18n path must not change in Phase 3: ${rel}`);
    }
  }
}

function run() {
  assertBypassEnvOnlyInAutosScope();
  assertPhase1And2AuditsPresent();
  assertPhase3RuntimeVisibilityAuditStructure();
  assertPublishRecoveryAuditStructure();
  assertDetailPathContract();
  assertCheckoutUsesTestBypassGate();
  assertGitDiffAutosOnlyIfDirty();

  const bypass = read("app/lib/clasificados/autos/autosTestPublishBypass.ts");
  assert.ok(
    /VERCEL_ENV.*production/.test(bypass),
    "Test publish bypass must still block Vercel production tier",
  );

  const persist = read("app/lib/clasificados/autos/autosListingPayloadPersistence.ts");
  assert.ok(
    persist.includes("sanitizeAutosListingPayloadForPersistence"),
    "Autos persistence sanitizer must exist for large inline media guard",
  );

  console.log("autos-phase-3-publish-recovery-audit: OK");
}

run();
