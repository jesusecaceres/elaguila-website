#!/usr/bin/env node
/** GLOBAL-MONETIZED-CATEGORY-STACK-STANDARD-01 verifier */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (m) => { console.error(`verify-global-monetized-category-stack-standard-01: FAIL — ${m}`); process.exit(1); };
const ok = (m) => console.log(`OK: ${m}`);

const doc = read("docs/global-monetized-category-stack-standard-01.md");
const bienesDoc = read("docs/bienes-inventory-golden-stack-parity-01.md");
const pkg = read("package.json");

for (const needle of [
  "CTA URL contract", "edit hydration", "golden loop", "add-on-only", "public output",
  "pipeline audit", "TRUE/FALSE", "Bienes Raíces", "Dealers de Autos", "Ofertas",
  "Clases", "no-upgrade",
]) {
  if (!doc.includes(needle)) fail(`global stack doc missing: ${needle}`);
}
ok("global stack doc complete");

if (!bienesDoc.includes("GLOBAL-MONETIZED-CATEGORY-STACK-01-BIENES-PROOF")) fail("bienes proof doc missing gate ref");
ok("bienes proof doc linked");

if (!pkg.includes("verify:global-monetized-category-stack-standard-01")) fail("package script missing");
if (!pkg.includes("verify:bienes-inventory-golden-stack-parity-01")) fail("bienes verifier script missing");
ok("package scripts registered");

console.log("\nverify-global-monetized-category-stack-standard-01: ALL CHECKS PASSED");
