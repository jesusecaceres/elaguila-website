import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resource = readFileSync(path.join(repoRoot, "docs/OFERTAS_PACKAGE_14_RESOURCE_AWARE_VALIDATION.md"), "utf8");

for (const marker of [
  "Run one heavy command at a time",
  "Do not run concurrent builds across worktrees",
  "Never stop another worktree's process",
  "RESOURCE-DEFERRED",
  "One retry maximum",
  "Do not repeat builds merely because docs/audits changed",
  "Preview build becomes authoritative only after exact-HEAD Preview is authorized",
  "Production build never substitutes for Preview QA",
  "repository PASS",
  "deterministic PASS",
  "environment BLOCKED",
  "resource DEFERRED",
  "real-QA PASS",
  "owner PASS",
]) {
  if (!resource.includes(marker)) throw new Error(`Resource governance missing ${marker}`);
}

for (const forbidden of ["vercel deploy", "git push main", "production database"]) {
  if (resource.toLowerCase().includes(forbidden)) throw new Error(`Resource governance includes forbidden instruction ${forbidden}`);
}

console.log("PASS: Package 14 resource-aware validation policy is machine-safe.");
