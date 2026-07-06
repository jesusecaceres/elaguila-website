#!/usr/bin/env node
/**
 * SERVICIOS-GATE-02 — remove contact preview step + custom cover upload.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const steps = read("app/(site)/clasificados/publicar/servicios/lib/serviciosApplicationStepLabels.ts");
const app = read("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
const mapper = read("app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft.ts");
const hero = read("app/(site)/servicios/components/ServiciosHero.tsx");
const pkg = read("package.json");

assert(steps.includes("SERVICIOS_APPLICATION_STEP_COUNT = 9"), "Step count must be 9");
assert(!steps.includes("Vista de contacto y opciones"), "Spanish contact preview step label removed");
assert(!steps.includes("Contact preview & options"), "English contact preview step label removed");
assert(steps.includes("migrateServiciosApplicationStepIndex"), "Legacy step migration helper present");

assert(!app.includes("contactPreviewLines"), "Contact hub preview UI removed");
assert(!app.includes("copy.sections.contact"), "Contact preview section heading removed from flow");
assert(!app.includes("copy.labels.cover"), "Cover upload label not rendered in application");
assert(!app.includes("coverInputRef"), "Cover file input ref removed");
assert(!app.includes("coverUrlDraft"), "Cover URL draft input removed");
assert(!app.includes("step === 9"), "No step index 9 in application UI");
assert(app.includes("step === 8"), "Final review step uses index 8");
assert(app.includes("migrateServiciosApplicationStepIndex"), "Application migrates legacy step indices");

assert(!mapper.includes("coverImageUrl: state.coverUrl"), "Mapper must not set hero cover from coverUrl");
assert(mapper.includes("phone"), "Contact phone mapping preserved");
assert(mapper.includes("email"), "Contact email mapping preserved");
assert(mapper.includes("website"), "Contact website mapping preserved");
assert(mapper.includes("physicalStreet"), "Physical address mapping preserved");

assert(!hero.includes("hero.coverImageUrl"), "Hero no longer renders uploaded cover image");

assert(!app.includes('accept="video/*"'), "Gate 01: no video file upload regression");
assert(app.includes("SERVICIOS_MAX_VIDEO_URLS"), "Gate 01: video URL cap preserved");

assert(pkg.includes('"verify:servicios-gate-02"'), "package.json verifier registered");

console.log("OK: 9-step flow without contact preview");
console.log("OK: cover upload removed from application");
console.log("OK: mapper + hero standard background");
console.log("OK: contact output mapping preserved");
console.log("verify-servicios-gate-02-contact-cover-cleanup: PASS");
