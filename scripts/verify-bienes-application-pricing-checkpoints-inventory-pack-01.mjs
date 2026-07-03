import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function gitDiffNameOnly() {
  try {
    return execFileSync("git", ["diff", "--name-only"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    return "";
  }
}

const docRel = "docs/bienes-application-pricing-checkpoints-inventory-pack-01.md";
const copyRel = "app/(site)/clasificados/publicar/bienes-raices/shared/brAgenteApplicationPricingCopy.ts";
const hubRel = "app/(site)/clasificados/publicar/bienes-raices/BienesRaicesPublicarHubClient.tsx";
const appRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx";
const checkpointRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrAgenteInventoryPackCheckpoint.tsx";
const confirmRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrAgenteApplicationConfirmations.tsx";
const verifierRel = "scripts/verify-bienes-application-pricing-checkpoints-inventory-pack-01.mjs";

for (const rel of [docRel, copyRel, hubRel, appRel, checkpointRel, confirmRel, verifierRel]) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
}

const doc = read(docRel);
const copy = read(copyRel);
const hub = read(hubRel);
const app = read(appRel);
const checkpoint = read(checkpointRel);
const confirm = read(confirmRel);
const pkg = read("package.json");

for (const section of [
  "Executive Summary",
  "Task Classification",
  "Files Inspected",
  "Files Changed",
  "Start Page Checkpoint Result",
  "See More Drawer Result",
  "Inventory Pack Accept/Decline Result",
  "Inventory Count Rule",
  "Final Step Pricing Summary Result",
  "Final Step Confirmation Checkbox Result",
  "Preview Handoff Result",
  "Stripe/Revenue OS Not Touched",
  "Draft Persistence Safety",
  "ES/EN Copy",
  "Manual QA Checklist",
  "Remaining Risks / Deferred Work",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

assert(
  hub.includes("$399/month") || copy.includes("$399/month"),
  "Start page or copy must include $399/month",
);
assert(
  hub.includes("$399/mes") || copy.includes("$399/mes"),
  "Start page or copy must include $399/mes",
);
assert(copy.includes("Inventory Pack") && copy.includes("Paquete de inventario"), "Copy must include inventory pack labels");
assert(copy.includes("+$99/month") && copy.includes("+$99/mes"), "Copy must include +$99 pricing");
assert(
  copy.includes("Payment is completed after preview") || copy.includes("El pago se completa después de la vista previa"),
  "Copy must mention payment after preview",
);
assert(copy.includes("confirmInventory") || confirm.includes("confirmInventoryPackPricing"), "Inventory pack confirmation required");
assert(
  checkpoint.includes("acceptPack") || checkpoint.includes("onAcceptPack"),
  "Inventory checkpoint must support accept",
);
assert(
  checkpoint.includes("continueMainOnly") || checkpoint.includes("onContinueMainOnly"),
  "Inventory checkpoint must support decline/main-only",
);

assert(
  pkg.includes('"verify:bienes-application-pricing-checkpoints-inventory-pack-01"'),
  "package.json must include verifier script",
);

const lockedPathPrefixes = [
  "app/api/stripe/",
  "app/api/revenue-os/checkout/",
  "app/api/revenue-os/webhook/",
  "supabase/migrations/",
];

function gitDiffForPrefix(prefix) {
  try {
    return execFileSync("git", ["diff", "--name-only", "--", prefix], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

for (const prefix of lockedPathPrefixes) {
  const changed = gitDiffForPrefix(prefix);
  assert(!changed, `Locked path must not be modified by this gate: ${prefix} (${changed})`);
}

const gateScopePrefixes = [
  "app/(site)/clasificados/publicar/bienes-raices/",
  "docs/bienes-application-pricing-checkpoints-inventory-pack-01.md",
  "scripts/verify-bienes-application-pricing-checkpoints-inventory-pack-01.mjs",
];

function isGateScopedPath(line) {
  if (line === "package.json") return true;
  return gateScopePrefixes.some((p) => line === p || line.startsWith(p));
}

for (const line of gitDiffNameOnly().split("\n").filter(Boolean)) {
  if (isGateScopedPath(line)) continue;
  const unrelatedCategory =
    /^app\/\(site\)\/clasificados\/(rentas|restaurantes|autos|empleos|servicios)\//.test(line) ||
    /^app\/\(site\)\/publicar\/(restaurantes|empleos|autos)\//.test(line);
  if (unrelatedCategory) {
    console.warn(`warn: unrelated dirty file present (untouched by gate): ${line}`);
  }
}

console.log("verify:bienes-application-pricing-checkpoints-inventory-pack-01 — all checks passed");
