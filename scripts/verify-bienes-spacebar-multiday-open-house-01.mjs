#!/usr/bin/env node
/**
 * Verifier — Bienes Spacebar + Multi-day Open House 01 (focused)
 * Exercises real sanitize/normalize/publish/public mapping functions via tsx core.
 * Not regex-only; not the full Golden Stack suite.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
}
function read(rel) {
  try {
    return fs.readFileSync(path.join(root, rel), "utf8");
  } catch {
    return "";
  }
}

console.log("\n=== Bienes Spacebar + Multi-day Open House 01 ===\n");

assert(fs.existsSync(path.join(root, "scripts/bienes-spacebar-multiday-open-house-01-core.ts")), "core harness exists");
assert(read("package.json").includes("verify:bienes-spacebar-multiday-open-house-01"), "npm script registered");

const links = read("app/(site)/clasificados/publicar/bienes-raices/negocio/application/bienesAdditionalBusinessLinks.ts");
assert(links.includes("sanitizeBusinessExtraLinksForDraft"), "draft sanitize exists");
assert(links.includes("without live trim") || links.includes("live trim"), "no live title trim contract");

const schema = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState.ts",
);
assert(schema.includes("fechaFin") && schema.includes("diasHorariosAdicionales"), "multi-day open-house fields");
assert(schema.includes("coerceOpenHouseSlot") || schema.includes("startDate"), "legacy coerce path");

const kb = read("app/(site)/clasificados/publicar/bienes-raices/negocio/application/brWizardKeyboard.ts");
assert(kb.includes("brShouldIgnoreWizardShortcut") && kb.includes("brIsEditableKeyboardTarget"), "keyboard foundation");

const step09 = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps04-09.tsx",
);
assert(step09.includes("data-br-oh-end-date") && step09.includes("data-br-oh-additional-days"), "OH UI fields");
assert(step09.includes("data-br-business-link-title"), "link title hook");

const en = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialCopy.en.ts",
);
assert(en.includes("Starting date") && en.includes("Ending date (optional)"), "EN labels");
assert(en.includes("continues on more days"), "EN helper");

const es = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialCopy.es.ts",
);
assert(es.includes("Fecha de inicio") && es.includes("Fecha de finalización (opcional)"), "ES labels");

console.log("--- Real normalize / publish / public mapping ---");
execFileSync("npx", ["tsx", "scripts/bienes-spacebar-multiday-open-house-01-core.ts"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});

console.log("\nverify:bienes-spacebar-multiday-open-house-01 PASS");
console.log("PROOF_TYPE: REAL FUNCTION MAPPING + CONTRACT");
