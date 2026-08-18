import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const triage = readFileSync(path.join(repoRoot, "docs/OFERTAS_PACKAGE_14_DEFECT_TRIAGE.md"), "utf8");

for (const severity of [
  "P0 — launch blocker",
  "P1 — major journey blocker",
  "P2 — functional, responsive, translation, or accessibility defect",
  "P3 — minor launch polish",
  "Dependency blocker",
  "Test-data issue",
  "Environment issue",
]) {
  if (!triage.includes(severity)) throw new Error(`Defect triage missing severity ${severity}`);
}

for (const field of [
  "Defect ID",
  "Discovery phase",
  "Route",
  "Test account",
  "Parent UUID",
  "Leonix Ad ID",
  "Source version",
  "Item or coupon ID",
  "Screenshot or evidence",
  "Expected result",
  "Actual result",
  "Console/network evidence",
  "Owner",
  "Workstream",
  "Severity",
  "Reproducibility",
  "Workaround",
  "Repair commit",
  "Retest evidence",
  "Closed by",
]) {
  if (!triage.includes(field)) throw new Error(`Defect triage missing field ${field}`);
}

for (const route of ["Ofertas-owned defect", "Shared platform defect", "Globalization handoff", "Infrastructure owner", "Other-category defect", "Chuy"]) {
  if (!triage.includes(route)) throw new Error(`Defect triage missing route ${route}`);
}

console.log("PASS: Package 14 defect triage defines severity, evidence, ownership, and closure.");
