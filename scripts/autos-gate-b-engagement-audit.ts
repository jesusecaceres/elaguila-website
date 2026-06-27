import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const exists = (path: string) => existsSync(join(root, path));

const failures: string[] = [];
const assert = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

const diffFiles = execSync("git diff --name-only", { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .map((line) => line.trim().replace(/\\/g, "/"))
  .filter(Boolean);

const auditPath = "app/lib/clasificados/autos/AUTOS_GATE_B_ENGAGEMENT_AUDIT.md";
const rowPath = "app/(site)/clasificados/autos/shared/components/AutosEngagementRow.tsx";

assert(exists(auditPath), "audit file exists");
assert(exists(rowPath), "AutosEngagementRow exists");

const audit = exists(auditPath) ? read(auditPath) : "";
const row = exists(rowPath) ? read(rowPath) : "";

assert(audit.includes("| Requirement | TRUE/FALSE | Evidence |"), "TRUE/FALSE table exists");
for (const label of ["Me gusta", "Compartir", "Like", "Share"]) {
  assert(row.includes(label) || audit.includes(label), `required label exists: ${label}`);
}

const lockedExact = new Set([
  "app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx",
  "app/(site)/clasificados/autos/privado/components/PrivadoContactStrip.tsx",
  "app/(site)/clasificados/autos/shared/components/AutosSheetCtaLink.tsx",
  "app/(site)/clasificados/autos/shared/lib/autosCtaSheet.ts",
  "app/components/cta/CtaActionSheet.tsx",
  "app/components/cta/ctaIntentBuilders.ts",
  "app/components/cta/ctaLaunchers.ts",
]);

for (const file of diffFiles) {
  assert(!lockedExact.has(file), `locked file was modified: ${file}`);
  assert(!file.startsWith("app/(site)/clasificados/en-venta/"), `En Venta file modified: ${file}`);
  assert(!file.startsWith("app/(site)/dashboard/"), `dashboard file modified: ${file}`);
  assert(!file.startsWith("app/admin/"), `admin file modified: ${file}`);
  assert(!file.startsWith("supabase/"), `Supabase schema/migration file modified: ${file}`);
  assert(!/(stripe|payment|checkout|pago)/i.test(file), `Stripe/payment file modified: ${file}`);
}

assert(!/\b(localStorage|sessionStorage)\b/.test(row), "no localStorage/sessionStorage count truth in AutosEngagementRow");
assert(row.includes("LeonixLikeButton"), "AutosEngagementRow uses LeonixLikeButton");
assert(row.includes("LeonixShareButton"), "AutosEngagementRow uses LeonixShareButton");
assert(row.includes("onToggle={handleLikeToggle}"), "AutosEngagementRow wires LeonixLikeButton onToggle");
assert(row.includes("setDisplayCount"), "AutosEngagementRow maintains live display count");
assert(row.includes("Math.max(0"), "AutosEngagementRow clamps count at zero");
assert(read("app/lib/clasificados/autos/autosClassifiedsListingService.ts").includes("user_liked_listings"), "like count uses user_liked_listings");

if (failures.length > 0) {
  console.error("AUTOS-GATE-B engagement audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("AUTOS-GATE-B engagement audit passed");
