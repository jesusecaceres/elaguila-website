import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function gitStatusShort() {
  return execFileSync("git", ["status", "--short"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const docRel = "docs/admin-live-supabase-mutation-proof-01.md";
const packageRel = "package.json";
const browserSmokeDocRel = "docs/admin-live-proof-and-mobile-browser-smoke-01.md";
const triageDocRel = "docs/admin-verifier-suite-triage-and-repair-01.md";
const actionProofDocRel = "docs/admin-action-qa-and-live-schema-proof-01.md";

for (const rel of [docRel, packageRel, browserSmokeDocRel, triageDocRel, actionProofDocRel]) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
}

const doc = read(docRel);
const pkg = read(packageRel);

for (const section of [
  "Live Supabase Access Status",
  "Live Table/Column Proof",
  "Safe Read Query Proof",
  "Admin Action Live Proof Matrix",
  "Mutation Safety Rules Applied",
  "Safe Mutation Proof Performed",
  "Audit Log Proof",
  "Schema Drift Fix Live Proof",
  "Actions Still Needing Test Rows",
  "Actions Not Safe To Test On Real Data",
  "Manual SQL Checklist For Chuy",
  "Next Recommended Admin OS Gate",
  "Final Recommendation",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

for (const requiredTruth of [
  "listing_moderation_reviews",
  "admin_live_proof_test",
  "NEEDS SCHEMA GATE",
  "NEEDS LIVE PROOF",
  "MISSING LIVE",
  "No production client listing, lead, staff account, order, payment record",
]) {
  assert(doc.includes(requiredTruth), `Document must include live-proof truth: ${requiredTruth}`);
}

const secretPatterns = [
  /postgres(?:ql)?:\/\/\S+/i,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/,
  /\b(sb_secret|sb_publishable|supabase_[a-z_]*key|service_role_key|anon_key)\s*=\s*["']?[-A-Za-z0-9_.]{16,}/i,
  /\b[A-Za-z0-9_-]{80,}\b/,
];

for (const pattern of secretPatterns) {
  assert(!pattern.test(doc), `Document appears to contain a secret-like value matching ${pattern}`);
}

assert(
  pkg.includes('"verify:admin-live-supabase-mutation-proof-01"') &&
    pkg.includes("scripts/verify-admin-live-supabase-mutation-proof-01.mjs"),
  "package script verify:admin-live-supabase-mutation-proof-01 must exist",
);

const added = gitStatusShort()
  .split(/\r?\n/)
  .map((line) => line.trimEnd())
  .filter((line) => line.startsWith("?? ") || line.startsWith("A "))
  .map((line) => line.slice(3).replaceAll("\\", "/"));

const allowedAdded = new Set([docRel, "scripts/verify-admin-live-supabase-mutation-proof-01.mjs"]);

for (const rel of added) {
  if (rel.startsWith("supabase/migrations/")) {
    throw new Error(`No migration file may be added by this gate: ${rel}`);
  }
  if (/(^|\/)(stripe|payment|payments)(\/|$)/i.test(rel) || /stripe/i.test(rel)) {
    throw new Error(`No Stripe route/file may be added by this gate: ${rel}`);
  }
  if (
    !allowedAdded.has(rel) &&
    (rel.startsWith("app/(site)/clasificados/") ||
      rel.startsWith("app/lib/clasificados/") ||
      rel.startsWith("components/clasificados/") ||
      (rel.startsWith("docs/") && /clasificados.*(preview|public|output)/i.test(rel)))
  ) {
    throw new Error(`No public Clasificados output doc/file may be added by this gate: ${rel}`);
  }
}

console.log("verify:admin-live-supabase-mutation-proof-01 PASS");
