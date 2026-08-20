import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "tests/ofertas-locales/scenarios/ofertasPackage13Scenarios.ts",
  "docs/OFERTAS_PACKAGE_13_REAL_QA_DATA_CONTRACT.md",
  "docs/OFERTAS_PACKAGE_13_MIGRATION_EXECUTION_MATRIX.md",
  "docs/OFERTAS_PACKAGE_13_ENVIRONMENT_QA_MATRIX.md",
  "docs/OFERTAS_PACKAGE_13_REAL_QA_RUNBOOK.md",
  "docs/OFERTAS_PACKAGE_13_QA_CONTROL_CENTER.md",
  "docs/OFERTAS_PACKAGE_13_HISTORICAL_AUDIT_GOVERNANCE.md",
  "scripts/ofertas-package-13-audit-governance-audit.mjs",
  "scripts/ofertas-package-13-scenario-contract-audit.mjs",
  "scripts/ofertas-package-13-identity-continuity-audit.mjs",
  "scripts/ofertas-package-13-advertiser-flow-audit.mjs",
  "scripts/ofertas-package-13-admin-flow-audit.mjs",
  "scripts/ofertas-package-13-shopper-flow-audit.mjs",
  "scripts/ofertas-package-13-dead-action-fake-state-audit.mjs",
  "scripts/ofertas-package-13-route-link-audit.mjs",
  "scripts/ofertas-package-13-error-privacy-audit.mjs",
  "scripts/ofertas-package-13-migration-readiness-audit.mjs",
  "scripts/ofertas-package-13-qa-control-center-audit.mjs",
  "scripts/ofertas-package-13-pre-qa-completion-audit.mjs",
  "scripts/ofertas-package-11-local-certification-audit.mjs",
  "scripts/ofertas-locales-ai-power-1-audit.ts",
  "scripts/ofertas-locales-ai-quality-1-audit.ts",
  "scripts/ofertas-locales-final-1b-en-venta-pipeline-audit.ts",
  "scripts/ofertas-locales-final-1c-full-pipeline-smoke-audit.ts",
  "scripts/ofertas-locales-final-1d-public-tab-activation-audit.ts",
  "scripts/ofertas-locales-final-1-pipeline-audit.ts",
  "scripts/ofertas-locales-final-4-public-detail-audit.ts",
  "scripts/ofertas-locales-gate-1-foundation-audit.ts",
  "scripts/ofertas-locales-mobile-public-search-ux-audit.ts",
  "scripts/ofertas-locales-ol3-step1-cta-cleanup-audit.ts",
  "scripts/ofertas-locales-ol7-ai-scan-action-candidate-review-audit.ts",
  "scripts/ofertas-locales-ol7e-production-scan-prep-runtime-diagnostic-audit.ts",
];

for (const file of required) {
  if (!existsSync(path.join(repoRoot, file))) throw new Error(`Package 13 required artifact missing ${file}`);
}

const unstaged = execFileSync("git", ["diff", "--name-only"], { cwd: repoRoot, encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);
const staged = execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: repoRoot, encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);
const changed = [...new Set([...unstaged, ...staged])];

for (const file of changed) {
  if (!required.includes(file)) throw new Error(`Unexpected Package 13 dirty path ${file}`);
  if (!file.includes("PACKAGE_13") && !file.startsWith("tests/ofertas-locales/")) continue;
  const text = readFileSync(path.join(repoRoot, file), "utf8");
  for (const forbidden of ["Vercel CLI", "vercel link", "vercel deploy", ".env.local", "sk_live", "SUPABASE_SERVICE_ROLE_KEY="]) {
    if (text.includes(forbidden)) throw new Error(`Forbidden infrastructure marker in ${file}: ${forbidden}`);
  }
}

console.log("PASS: Package 13 pre-QA completion artifacts are present, scoped, and commit-ready.");
