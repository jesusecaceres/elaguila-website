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

const auditPath = "app/lib/clasificados/autos/AUTOS_GATE_C1_MOBILE_AUDIT.md";
const rowPath = "app/(site)/clasificados/autos/shared/components/AutosEngagementRow.tsx";
const galleryPath = "app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx";
const specsPath = "app/(site)/clasificados/autos/negocios/components/VehicleSpecsGrid.tsx";
const equipmentPath = "app/(site)/clasificados/autos/negocios/components/VehicleHighlights.tsx";

assert(exists(auditPath), "mobile audit file exists");
assert(exists(rowPath), "AutosEngagementRow still exists");

const audit = exists(auditPath) ? read(auditPath) : "";
const gallery = exists(galleryPath) ? read(galleryPath) : "";
const specs = exists(specsPath) ? read(specsPath) : "";
const equipment = exists(equipmentPath) ? read(equipmentPath) : "";

assert(audit.includes("| Requirement | TRUE/FALSE | Evidence |"), "TRUE/FALSE table exists");
for (const term of ["gallery", "specs", "equipment", "related inventory", "Privado"]) {
  assert(audit.toLowerCase().includes(term.toLowerCase()), `audit mentions ${term}`);
}
assert(gallery.includes("aspect-[16/9]") && gallery.includes("sm:aspect-[16/10]"), "gallery has mobile-only compact aspect");
assert(specs.includes("Ver más especificaciones") && specs.includes("View more specs"), "specs mobile disclosure labels exist");
assert(equipment.includes("Ver todo el equipo") && equipment.includes("View all equipment"), "equipment mobile disclosure labels exist");

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

if (failures.length > 0) {
  console.error("AUTOS-GATE-C1-MOBILE audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("AUTOS-GATE-C1-MOBILE audit passed");
