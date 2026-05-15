/**
 * Autos Phase 3 — audit artifact + Autos-only bypass gates (no DB / no Stripe calls).
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

function assertPhase3AuditStructure() {
  const md = read("app/lib/clasificados/autos/AUTOS_PHASE_3_RUNTIME_VISIBILITY_AUDIT.md");
  assert.ok(md.includes("| ID | Claim | Runtime proof | Verdict | If FALSE, exact fix needed |"));
  assert.ok(md.includes("## Runtime proof"), "Phase 3 audit must include ## Runtime proof section");
  assert.ok(/###\s*Privado/i.test(md), "Runtime proof must include Privado subsection");
  assert.ok(/###\s*Negocios/i.test(md), "Runtime proof must include Negocios subsection");
  for (let n = 1; n <= 27; n++) {
    const id = `R${n}`;
    assert.ok(new RegExp(`\\| ${id} \\|`).test(md), `Audit matrix must include row ${id}`);
  }
  assert.ok(
    /TRUE \(runtime\)|FALSE \(runtime\)|TRUE \(code\)/.test(md),
    "Audit must include verdict wording: TRUE (runtime), FALSE (runtime), or TRUE (code)",
  );
  assert.ok(
    /Listing ID:|Runtime proof not executed because:/i.test(md),
    "Runtime proof must mention Listing ID fields or explicit blocker phrasing",
  );
  assert.ok(
    /Landing URL checked:|Results URL checked:|Detail URL checked:|User dashboard URL checked:|Admin dashboard URL checked:/i.test(md),
    "Runtime proof must include URL field labels for landing/results/detail/dashboard/admin",
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
}

function assertGitDiffAutosOnlyIfDirty() {
  const gr = spawnSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8", cwd: ROOT });
  if (gr.status !== 0 || !gr.stdout?.trim()) return;
  const files = gr.stdout
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowRe =
    /^(app\/(site)\/(clasificados\/autos|publicar\/autos)\/|app\/lib\/clasificados\/autos\/|app\/api\/clasificados\/autos\/|app\/admin\/\(dashboard\)\/workspace\/clasificados\/autos\/|e2e\/autos\/|playwright\.autos-runtime\.config\.mjs|scripts\/autos-|package\.json)/;
  for (const f of files) {
    const rel = f.replace(/\\/g, "/");
    assert.ok(allowRe.test(rel), `Unexpected modified file in git diff (keep Autos-only scope): ${rel}`);
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
  assertPhase3AuditStructure();
  assertDetailPathContract();
  assertCheckoutUsesTestBypassGate();
  assertGitDiffAutosOnlyIfDirty();

  const bypass = read("app/lib/clasificados/autos/autosTestPublishBypass.ts");
  assert.ok(
    /VERCEL_ENV.*production/.test(bypass),
    "Test publish bypass must still block Vercel production tier",
  );

  console.log("autos-phase-3-runtime-visibility-audit: OK");
}

run();
