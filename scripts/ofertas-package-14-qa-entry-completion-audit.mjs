import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "docs/OFERTAS_PACKAGE_14_QA_AUTHORIZATION_MANIFEST.md",
  "docs/OFERTAS_PACKAGE_14_QA_EXECUTION_BOARD.md",
  "docs/OFERTAS_PACKAGE_14_DEFECT_TRIAGE.md",
  "docs/OFERTAS_PACKAGE_14_FIRST_QA_SESSION.md",
  "docs/OFERTAS_PACKAGE_14_RESOURCE_AWARE_VALIDATION.md",
  "scripts/ofertas-package-14-qa-authorization-audit.mjs",
  "scripts/ofertas-package-14-execution-board-audit.mjs",
  "scripts/ofertas-package-14-defect-triage-audit.mjs",
  "scripts/ofertas-package-14-resource-governance-audit.mjs",
  "scripts/ofertas-package-14-qa-entry-completion-audit.mjs",
];

for (const file of required) {
  if (!existsSync(path.join(repoRoot, file))) throw new Error(`Package 14 required artifact missing ${file}`);
}

const staged = execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: repoRoot, encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);

const changed = execFileSync("git", ["diff", "--name-only"], { cwd: repoRoot, encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: repoRoot, encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);

for (const file of [...new Set([...changed, ...untracked, ...staged])]) {
  if (!required.includes(file)) throw new Error(`Unexpected Package 14 path ${file}`);
  if (!file.endsWith(".md")) continue;
  const text = readFileSync(path.join(repoRoot, file), "utf8");
  for (const forbidden of ["sk_live", "SUPABASE_SERVICE_ROLE_KEY=", "BLOB_READ_WRITE_TOKEN=", "AIza", ".env.local", "vercel deploy"]) {
    if (text.includes(forbidden)) throw new Error(`Forbidden Package 14 marker in ${file}: ${forbidden}`);
  }
}

const allDocs = required.filter((file) => file.endsWith(".md")).map((file) => readFileSync(path.join(repoRoot, file), "utf8")).join("\n");
for (const marker of [
  "Non-Production",
  "No fake results",
  "No Preview",
  "No Production",
  "Owner acceptance authority",
  "Defect owner",
  "Notification test authorization",
  "RESOURCE-DEFERRED",
  "owner PASS",
  "Ordered actions",
  "checkpoint",
  "real Gemini scan",
  "no shopping list",
  "notification outbox",
]) {
  if (!allDocs.includes(marker)) throw new Error(`Package 14 docs missing ${marker}`);
}

console.log("PASS: Package 14 QA entry gate is complete, unstaged, non-Production, and evidence-driven.");
