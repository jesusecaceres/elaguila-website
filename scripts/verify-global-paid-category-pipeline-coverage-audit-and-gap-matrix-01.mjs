#!/usr/bin/env node
/**
 * GLOBAL-PAID-CATEGORY-PIPELINE-COVERAGE-AUDIT-AND-GAP-MATRIX-01 verifier
 * Read-only-first planning gate: docs + verifier + package script only.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (m) => {
  console.error(`verify-global-paid-category-pipeline-coverage-audit-and-gap-matrix-01: FAIL — ${m}`);
  process.exit(1);
};
const ok = (m) => console.log(`OK: ${m}`);

const matrixRel = "docs/global-paid-category-pipeline-coverage-audit-and-gap-matrix-01.md";
const orderRel = "docs/global-paid-category-pipeline-next-build-order-01.md";

for (const rel of [matrixRel, orderRel]) {
  if (!existsSync(path.join(ROOT, rel))) fail(`Missing required doc: ${rel}`);
}
ok("Required docs exist");

const matrix = read(matrixRel);
const order = read(orderRel);
const pkg = read("package.json");

// Required category/pipeline coverage (evidence rows)
const REQUIRED_ROWS = [
  "Restaurantes — established restaurant lane",
  "Restaurantes — truck / mobile / popup / local food lane",
  "Servicios — professional / white-collar lane",
  "Servicios — blue-collar / trades lane",
  "Bienes Raíces — private (FSBO) listing lane",
  "Bienes Raíces — business / agent parent lane",
  "Bienes Raíces — child property inventory lane",
  "Autos — privado lane",
  "Autos — dealer / business parent lane",
  "Autos — child vehicle inventory lane",
  "Ofertas Locales — supermarket / flyer lane",
  "Ofertas Locales — coupon / promo lane",
  "Ofertas Locales — AI searchable specials lane",
  "Clases — free class lane",
  "Clases — paid class lane",
  "Empleos — paid job lane",
  "Viajes — paid / affiliate lane",
  "Rentas — paid listing lane",
  "En Venta / Varios — free/pro lane",
  "Comunidad / Eventos — free lane",
  "Mascotas / Perdidos — free lane",
  "Busco / Se busca — free lane",
];
for (const row of REQUIRED_ROWS) {
  if (!matrix.includes(row)) fail(`Matrix missing required row: ${row}`);
}
ok(`All ${REQUIRED_ROWS.length} required category/pipeline rows present`);

// Required named matrices / sections
const REQUIRED_SECTIONS = [
  "Category / Pipeline Inventory Map",
  "Checkpoint Coverage Matrix",
  "Add-on and Inventory Truth Matrix",
  "Dashboard CTA and Golden Loop Matrix",
  "Revenue OS Truth Matrix",
  "Newsletter + Promo Code Implementation Blueprint",
];
for (const s of REQUIRED_SECTIONS) {
  if (!matrix.includes(s)) fail(`Matrix missing required section: ${s}`);
}
ok("All required matrices/sections present");

// Status labels must appear
for (const label of ["REAL", "PARTIAL", "UI-ONLY", "MISSING", "BLOCKED"]) {
  if (!matrix.includes(label)) fail(`Status label missing: ${label}`);
}
ok("Status labels REAL/PARTIAL/UI-ONLY/MISSING/BLOCKED present");

// Evidence + next-gate columns/keywords
if (!matrix.includes("evidence")) fail("evidence file/path references required");
if (!matrix.includes("next gate") && !matrix.includes("next required gate")) {
  fail("next required gate references required");
}
ok("Evidence + next-gate references present");

// Newsletter/promo blueprint rules
for (const rule of [
  "10%",
  "One promo code per checkout",
  "Apply button required",
  "Server-side validation required",
  "Webhook redeems promo after successful payment",
  "No fake subscription",
]) {
  if (!matrix.includes(rule)) fail(`Newsletter/promo blueprint missing rule: ${rule}`);
}
ok("Newsletter + promo blueprint rules present");

// Next-build-order doc: 5 gates + required per-gate fields
for (let i = 1; i <= 5; i++) {
  if (!order.includes(`### Gate ${i} —`)) fail(`Next-build-order missing Gate ${i}`);
}
for (const field of ["**Why next:**", "**Risk level:**", "**QA required:**", "**Stripe/webhook touched:**", "**Expected outcome:**"]) {
  if (!order.includes(field)) fail(`Next-build-order missing field: ${field}`);
}
ok("Next-build-order: 5 gates with why/risk/QA/stripe/outcome");

// Package script
if (!pkg.includes("verify:global-paid-category-pipeline-coverage-audit-and-gap-matrix-01")) {
  fail("package.json script missing");
}
ok("Package script registered");

// Guard: no runtime files changed — only docs/scripts/package.json allowed in working tree + staged
let changed = "";
try {
  changed = execSync("git status --porcelain", { cwd: ROOT, encoding: "utf8" });
} catch {
  changed = "";
}
const changedFiles = changed
  .split("\n")
  .map((l) => l.slice(3).trim())
  .filter(Boolean)
  // handle rename "old -> new"
  .map((f) => (f.includes(" -> ") ? f.split(" -> ")[1] : f));

const ALLOWED = (f) =>
  f.startsWith("docs/") ||
  f.startsWith("scripts/") ||
  f === "package.json" ||
  f === "package-lock.json" ||
  // pre-existing unrelated audit note (untracked) is tolerated but must not be a runtime file
  f.startsWith("app/lib/website-audit/");

const RUNTIME = (f) =>
  (f.startsWith("app/") && !f.startsWith("app/lib/website-audit/")) ||
  f.startsWith("supabase/") ||
  f.startsWith("components/") ||
  f.startsWith("lib/");

const violations = changedFiles.filter((f) => RUNTIME(f) || !ALLOWED(f));
if (violations.length > 0) {
  fail(`Runtime/disallowed files changed in this gate: ${violations.join(", ")}`);
}
ok("No runtime files changed (docs/scripts/package only)");

console.log("\nverify-global-paid-category-pipeline-coverage-audit-and-gap-matrix-01: ALL CHECKS PASSED");
