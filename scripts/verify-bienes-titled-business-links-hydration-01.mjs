#!/usr/bin/env node
/**
 * Verifier — Bienes titled additional business links + real hydration proof.
 * Uses actual normalization/persistence functions (not grep-only).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
}

const steps = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps04-09.tsx",
);
const helper = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/bienesAdditionalBusinessLinks.ts",
);
const copyEn = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialCopy.en.ts",
);
const copyEs = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialCopy.es.ts",
);

assert(steps.includes("businessLinkTitleLabel"), "UI must render link title field");
assert(steps.includes("businessLinkUrlLabel"), "UI must render URL field");
assert(steps.includes("patchLink"), "UI must patch title+url independently");
assert(steps.includes("removeLink"), "UI must remove single pair");
assert(!steps.includes("businessUrlLabel(index + 1)"), "old URL-only label must not drive primary UI");

assert(copyEn.includes("Link title"), "EN link title label");
assert(copyEn.includes("Add another business link"), "EN add CTA");
assert(copyEn.includes("Remove"), "EN remove CTA");
assert(copyEs.includes("Título del enlace"), "ES link title label");
assert(copyEs.includes("Agregar otro enlace comercial"), "ES add CTA");
assert(copyEs.includes("Eliminar"), "ES remove CTA");

assert(helper.includes("normalizeBusinessExtraLinks"), "normalization helper exists");
assert(helper.includes('title: ""'), "legacy string preserves empty title");
assert(helper.includes("Visit link"), "approved EN empty-title fallback");
assert(helper.includes("Visitar enlace"), "approved ES empty-title fallback");

execFileSync("npx", ["tsx", "scripts/bienes-titled-business-links-hydration-01-core.ts"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});

console.log("verify:bienes-titled-business-links-hydration-01 PASS");
