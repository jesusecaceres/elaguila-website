import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function gitStatusShort() {
  return execFileSync("git", ["status", "--short"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const docRel = "docs/stripe-revenue-os-sandbox-e2e-proof-01.md";
assert(existsSync(path.join(ROOT, docRel)), `${docRel} must exist`);

const doc = read(docRel);
const pkg = read("package.json");
const smoke = existsSync(path.join(ROOT, "scripts/smoke-stripe-revenue-os-sandbox-e2e-01.mjs"))
  ? read("scripts/smoke-stripe-revenue-os-sandbox-e2e-01.mjs")
  : "";

for (const section of [
  "Executive Summary",
  "Repo Baseline",
  "Production/Vercel Env Readiness",
  "Stripe Webhook Endpoint Readiness",
  "Checkout Creation Proof",
  "Sandbox Payment Completion Proof",
  "Webhook Delivery Proof",
  "Payment Record Proof",
  "Promo Redemption Proof",
  "Entitlement Activation Proof",
  "Placement Entitlement Safety Proof",
  "Admin Audit Log Proof",
  "Free Package Rejection Proof",
  "Empleos Two-Pipeline Proof",
  "Expired Session Proof",
  "Idempotency Proof",
  "Blockers",
  "Manual QA Notes",
  "Next Gate: Admin/User Revenue Proof",
  "Final Recommendation",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

assert(
  doc.includes("rentas_30d") && doc.includes("empleos_job_post_paid"),
  "Doc must reference rentas and empleos paid packages",
);
assert(
  doc.includes("empleos_job_fair_free"),
  "Doc must reference empleos job fair rejection",
);
assert(
  doc.includes("PROMO E2E NOT RUN") || doc.toLowerCase().includes("promo e2e not run"),
  "Doc must honestly document promo proof status",
);

const secretPatterns = [
  /sk_(live|test)_[A-Za-z0-9]{16,}/,
  /whsec_[A-Za-z0-9]{16,}/,
  /\bSTRIPE_SECRET_KEY\s*=\s*.+/,
  /\bSTRIPE_WEBHOOK_SECRET\s*=\s*.+/,
];

for (const file of [doc, smoke, pkg]) {
  if (!file) continue;
  for (const pattern of secretPatterns) {
    assert(!pattern.test(file), `Secret-like content forbidden matching ${pattern}`);
  }
}

assert(
  pkg.includes('"verify:stripe-revenue-os-sandbox-e2e-proof-01"') &&
    pkg.includes("scripts/verify-stripe-revenue-os-sandbox-e2e-proof-01.mjs"),
  "package verify script must exist",
);

const gatePrefixes = [
  "docs/stripe-revenue-os-sandbox-e2e-proof-01.md",
  "scripts/verify-stripe-revenue-os-sandbox-e2e-proof-01.mjs",
  "scripts/smoke-stripe-revenue-os-sandbox-e2e-01.mjs",
  "package.json",
];

const forbiddenUiPrefixes = ["app/(site)/", "app/admin/(dashboard)/"];

const statusLines = gitStatusShort()
  .split(/\r?\n/)
  .map((line) => line.trimEnd())
  .filter(Boolean);

for (const line of statusLines) {
  const rel = line.slice(3).replaceAll("\\", "/");
  const isGateFile = gatePrefixes.some((p) => rel === p || rel.startsWith(p));

  if (line.startsWith("?? ") || line.startsWith("A ")) {
    assert(!rel.startsWith("supabase/migrations/"), `No migration added: ${rel}`);
    assert(!/^\.env(\.|$)/.test(rel), `.env must not be touched: ${rel}`);
  }

  if ((line.startsWith("M ") || line.startsWith("MM ")) && !isGateFile) {
    for (const prefix of forbiddenUiPrefixes) {
      assert(!rel.startsWith(prefix), `No UI edited by this gate: ${rel}`);
    }
  }
}

console.log("verify:stripe-revenue-os-sandbox-e2e-proof-01 PASS");
