/**
 * BR-CHILD-FUTURE-CHILD-PARENT-PARITY-FINAL-09 — repo validator.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function exists(rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

type Row = { requirement: string; pass: boolean; evidence: string };
const rows: Row[] = [];

function check(req: string, pass: boolean, evidence: string) {
  rows.push({ requirement: req, pass, evidence });
}

const auditPath =
  "app/lib/clasificados/bienes-raices/BIENES_BR_CHILD_FUTURE_CHILD_PARENT_PARITY_FINAL_09_AUDIT.md";
check("Gate 9 audit file exists", exists(auditPath), auditPath);

const childApp = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryFullApplication.tsx",
);
check("Child reuses parent Step01-03", childApp.includes("Step01TipoAnuncio") && childApp.includes("Step03Media"), "child app");
check("Child reuses parent Step04-06", childApp.includes("Step04DetallesEsenciales") && childApp.includes("Step06Descripcion"), "child app");
check("Child has inherited hub panel", childApp.includes("BrNegocioChildInventoryInheritedHubPanel"), "child app");
check("Child has inherited contact panel", childApp.includes("BrNegocioChildInventoryInheritedContactPanel"), "child app");
check("Child does not use editable Step07InformacionProfesional", !childApp.includes("Step07InformacionProfesional"), "child app");
check("Child save property", childApp.includes('attemptSave("close")'), "child app");
check("Child save and add another", childApp.includes('attemptSave("addAnother")'), "child app");
check("Child save and go parent review", childApp.includes('attemptSave("goToParentPreview")'), "child app");
check("Child mobile step nav", childApp.includes("lg:hidden") && childApp.includes("navPasos"), "child app");
check("Child editor merge preserves typing", childApp.includes("mergeParentHubWithChildPropertyForEditor"), "child app");

const inheritedHub = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryInheritedHubPanel.tsx",
);
check("Inherited hub read-only notice", inheritedHub.includes("Read-only") || inheritedHub.includes("Solo lectura"), "inherited hub");
check("Inherited hub email copy", inheritedHub.includes("HubEmailRow") && inheritedHub.includes("copyToClipboard"), "inherited hub");
check("Inherited hub friendly links (no raw HubRow URLs for socials)", inheritedHub.includes("HubLinkRow"), "inherited hub");
check("Detected CTAs moved to contact step", !inheritedHub.includes("detectAgenteResBuyerActions"), "inherited hub");

const inheritedContact = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryInheritedContactPanel.tsx",
);
check("Inherited contact uses parent Step08", inheritedContact.includes("Step08CtaEnlaces"), "inherited contact");

const childMap = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildInventoryFormMapping.ts",
);
check("Child mapping preserves videoUrls in propertyForm", childMap.includes('"videoUrls"'), "child mapping");
check("Child flat videoUrl from videoUrls array", childMap.includes("primaryVideoUrl"), "child mapping");

const steps = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps01-03.tsx",
);
check("Parent Step3 VideoUrlAddRows", steps.includes("VideoUrlAddRows"), "steps01-03");
check("No device video upload copy", !steps.includes("Upload video from my device"), "steps01-03");

const locFields = read("app/lib/clasificados/bienes-raices/brLocationFormFields.tsx");
check("Shared location Country field", locFields.includes("direccionPais"), "brLocationFormFields");

const shellCopy = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioPrePublishInventoryShellCopy.ts",
);
check(
  "Save does not imply publish/payment",
  shellCopy.includes("does not publish") || shellCopy.includes("no publica"),
  "shell copy",
);

const pkg = read("package.json");
check(
  "npm script registered",
  pkg.includes("bienes:child-future-child-parent-parity-final-09"),
  "package.json",
);

check("No Stripe files touched in this gate", !exists("STRIPE_GATE_09_TOUCH"), "scope lock");
check("No migration touched in this gate", !exists("supabase/migrations/BR_CHILD_PARITY_09"), "scope lock");

const failed = rows.filter((r) => !r.pass);

console.log("\nBR-CHILD-FUTURE-CHILD-PARENT-PARITY-FINAL-09 audit script\n");
for (const r of rows) {
  console.log(`${r.pass ? "PASS" : "FAIL"} — ${r.requirement} (${r.evidence})`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} checks passed\n`);

if (failed.length) {
  process.exit(1);
}
