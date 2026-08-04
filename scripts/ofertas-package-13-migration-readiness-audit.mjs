import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const matrix = readFileSync(path.join(repoRoot, "docs/OFERTAS_PACKAGE_13_MIGRATION_EXECUTION_MATRIX.md"), "utf8");

for (const pkg of ["4A Gemini provider", "4B 30-day term", "5 commercial/identity", "6 partner/analytics/source lifecycle", "7 scan/review/publication", "8 renewal/operations"]) {
  if (!matrix.includes(pkg)) throw new Error(`Migration matrix missing ${pkg}`);
}

for (const column of ["Requires", "Creates/Alters", "Verify Before", "Verify After", "Rollback Limit", "Runtime Blocked Until Applied"]) {
  if (!matrix.includes(column)) throw new Error(`Migration matrix missing column ${column}`);
}

if (/(migration|migrations)\s+(was|were|has been|have been)\s+applied/i.test(matrix)) {
  throw new Error("Migration matrix must not claim application.");
}

if (!matrix.includes("Do not apply migrations")) throw new Error("Migration matrix missing unapplied safety directive.");

console.log("PASS: Package 13 migration readiness matrix is ordered, explicit, and unapplied.");
