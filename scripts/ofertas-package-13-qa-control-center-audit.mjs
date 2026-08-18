import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const control = readFileSync(path.join(repoRoot, "docs/OFERTAS_PACKAGE_13_QA_CONTROL_CENTER.md"), "utf8");
const env = readFileSync(path.join(repoRoot, "docs/OFERTAS_PACKAGE_13_ENVIRONMENT_QA_MATRIX.md"), "utf8");
const data = readFileSync(path.join(repoRoot, "docs/OFERTAS_PACKAGE_13_REAL_QA_DATA_CONTRACT.md"), "utf8");
const runbook = readFileSync(path.join(repoRoot, "docs/OFERTAS_PACKAGE_13_REAL_QA_RUNBOOK.md"), "utf8");

for (const system of [
  "Checkpoint", "Application", "Persistence", "Upload", "Scan", "Review", "Preview", "Commercial",
  "Submission", "Admin moderation", "Correction", "Publication", "Public discovery", "Cards/drawers",
  "Flyer source", "Business Hub", "Shopping list", "Coupons", "Partner", "Analytics", "Owner ops",
  "Admin ops", "Expiration", "Renewal", "Recovery", "Cleanup", "Notifications", "ES/EN",
  "Mobile/tablet", "Accessibility", "Migrations", "Environment", "Staging", "Preview", "Production",
]) {
  if (!control.includes(system)) throw new Error(`QA control center missing ${system}`);
}

for (const marker of ["Exact Next Action", "Pass Criteria", "Evidence", "No broad pending QA"]) {
  if (!control.includes(marker)) throw new Error(`QA control center missing ${marker}`);
}

for (const doc of [env, data, runbook]) {
  if (/sk_live|service_role_[A-Za-z0-9]|AIza|eyJ/i.test(doc)) throw new Error("QA docs contain secret-looking values.");
}

console.log("PASS: Package 13 QA control center, data contract, env matrix, and runbook are complete.");
