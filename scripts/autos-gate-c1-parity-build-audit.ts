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

const auditPath = "app/lib/clasificados/autos/AUTOS_GATE_C1_PARITY_BUILD_AUDIT.md";
const rowPath = "app/(site)/clasificados/autos/shared/components/AutosEngagementRow.tsx";

assert(exists(auditPath), "C1 audit file exists");
assert(exists(rowPath), "AutosEngagementRow exists");

const audit = exists(auditPath) ? read(auditPath) : "";
const row = exists(rowPath) ? read(rowPath) : "";

assert(audit.includes("| Requirement"), "TRUE/FALSE table exists");
for (const label of ["Me gusta", "Compartir", "Like", "Share"]) {
  assert(row.includes(label) || audit.includes(label), `required label exists: ${label}`);
}

assert(audit.includes("Negocios and Privado were compared"), "Negocios/Privado comparison documented");
assert(audit.includes("Dashboard Autos landing inspected read-only"), "dashboard read-only finding documented");
assert(audit.includes("Admin Autos landing inspected read-only"), "admin read-only finding documented");

const lockedCtaFiles = new Set([
  "app/components/cta/CtaActionSheet.tsx",
  "app/(site)/clasificados/autos/shared/components/AutosSheetCtaLink.tsx",
  "app/(site)/clasificados/autos/shared/lib/autosCtaSheet.ts",
]);

for (const file of diffFiles) {
  assert(!lockedCtaFiles.has(file), `locked CTA file modified: ${file}`);
  assert(!file.startsWith("app/(site)/clasificados/en-venta/"), `En Venta file modified: ${file}`);
  assert(!file.startsWith("app/(site)/dashboard/"), `dashboard file modified: ${file}`);
  assert(!file.startsWith("app/admin/"), `admin file modified: ${file}`);
  assert(!file.startsWith("supabase/"), `Supabase schema/migration file modified: ${file}`);
  assert(!/(stripe|payment|checkout|pago)/i.test(file), `Stripe/payment file modified: ${file}`);
}

assert(row.includes("LeonixLikeButton"), "AutosEngagementRow uses LeonixLikeButton");
assert(row.includes("LeonixShareButton"), "AutosEngagementRow uses LeonixShareButton");
assert(!/\b(localStorage|sessionStorage)\b/.test(row), "AutosEngagementRow has no local/session storage count truth");

if (failures.length > 0) {
  console.error("AUTOS-GATE-C1 parity/build audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("AUTOS-GATE-C1 parity/build audit passed");
