#!/usr/bin/env node
/**
 * Verifier — Bienes text-input Spacebar + horarios contract (fixture + source).
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
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const links = read("app/(site)/clasificados/publicar/bienes-raices/negocio/application/bienesAdditionalBusinessLinks.ts");
assert(links.includes("without live trim") || links.includes("Preserve") || links.includes("trailing spaces") || links.includes("live trim"), "draft sanitize preserves spaces");
assert(links.includes("title.trim()") && links.includes("out.push({ title, url })"), "emptiness uses trim but value preserved");

const schema = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState.ts",
);
assert(schema.includes("fechaFin") && schema.includes("diasHorariosAdicionales"), "open-house multi-day fields");
assert(schema.includes("startDate") && schema.includes("endDate"), "legacy alias normalization");

const step09 = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps04-09.tsx",
);
assert(step09.includes("data-br-oh-end-date") && step09.includes("data-br-oh-additional-days"), "UI multi-day fields");
assert(step09.includes("data-br-business-link-title"), "link title test hook");

const kb = read("app/(site)/clasificados/publicar/bienes-raices/negocio/application/brWizardKeyboard.ts");
assert(kb.includes("brShouldIgnoreWizardShortcut") && kb.includes("brIsEditableKeyboardTarget"), "keyboard foundation");

const en = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialCopy.en.ts",
);
assert(en.includes("Starting date") && en.includes("Ending date (optional)"), "EN labels");
assert(en.includes("The first date is the starting date"), "EN helper");
assert(en.includes("continues on more days") || en.includes("continues on additional days"), "EN multi-day helper detail");

const es = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialCopy.es.ts",
);
assert(es.includes("Fecha de inicio") && es.includes("Fecha de finalización (opcional)"), "ES labels");

execFileSync("npx", ["tsx", "scripts/bienes-spacebar-multiday-open-house-01-core.ts"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});

console.log("verify:bienes-text-input-spacebar-horarios-01 PASS");
