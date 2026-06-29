import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const auditRel = "app/lib/clasificados/autos/AUTOS_NEGOCIOS_FINAL_BATTLEFIELD_AUDIT.md";
const auditPath = path.join(root, auditRel);

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

function gitChanged(): string[] {
  return execFileSync("git", ["diff", "--name-only"], { cwd: root, encoding: "utf8" })
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => x.replace(/\\/g, "/"));
}

function assertNoChangedPath(label: string, predicate: (file: string) => boolean): void {
  const hits = changed.filter(predicate);
  assert.equal(hits.length, 0, `${label} files modified: ${hits.join(", ")}`);
}

assert.ok(existsSync(auditPath), "final battlefield audit file exists");

const audit = read(auditRel);
for (const needle of [
  "| Requirement",
  "Negocios",
  "public detail",
  "results",
  "dashboard",
  "admin",
  "analytics",
  "Like",
  "Share",
  "CTA",
  "READY TO COMMIT AND PUSH",
]) {
  assert.ok(audit.includes(needle), `audit includes ${needle}`);
}

const changed = gitChanged();

assertNoChangedPath("En Venta/Varios", (file) => file.includes("/en-venta/") || file.includes("/varios/"));
assertNoChangedPath("Rentas", (file) => file.includes("/rentas/"));
assertNoChangedPath("Servicios", (file) => file.includes("/servicios/"));
assertNoChangedPath("Restaurantes", (file) => file.includes("/restaurantes/"));
assertNoChangedPath("Bienes Raices", (file) => file.includes("/bienes-raices/"));
assertNoChangedPath("Supabase schema/migration", (file) => file.startsWith("supabase/") || file.includes("/migrations/"));
assertNoChangedPath("Stripe/payment", (file) => /stripe|payment|pago/i.test(file));

for (const locked of [
  "app/components/cta/CtaActionSheet.tsx",
  "app/(site)/clasificados/autos/shared/components/AutosSheetCtaLink.tsx",
  "app/(site)/clasificados/autos/shared/lib/autosCtaSheet.ts",
]) {
  assert.ok(!changed.includes(locked), `locked CTA file modified: ${locked}`);
}

const addedLines = execFileSync("git", ["diff", "--unified=0"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
  .filter((line) => !line.includes("autos-negocios-final-battlefield-audit.ts"));

for (const fakeNeedle of ["Cifras de ejemplo", "Sample figures", "fake analytics", "demo metrics"]) {
  const hits = addedLines.filter((line) => line.includes(fakeNeedle));
  assert.equal(hits.length, 0, `fake metric string added: ${fakeNeedle}`);
}

console.log("AUTOS-NEGOCIOS-FINAL-BATTLEFIELD audit passed");
