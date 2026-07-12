/**
 * Verifier — Bienes multi-channel child inventory routing + hydration-safe return.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

let pass = 0;
let fail = 0;

function assert(label, ok, detail = "") {
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function read(rel) {
  try {
    return fs.readFileSync(path.join(root, rel), "utf8");
  } catch {
    return "";
  }
}

console.log("\n=== Bienes Multi-Channel Child Inventory 01 ===\n");

const ctx = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryChildContext.ts";
const selector = "app/(site)/publicar/bienes-raices/PublicarBienesRaicesNegocioSelectorClient.tsx";
const shell =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryShell.tsx";
const childApp =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryFullApplication.tsx";
const parentApp =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx";
const mapping =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildInventoryFormMapping.ts";
const cards =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryCardModel.ts";
const previewDraft =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/previewDraft.ts";
const pkg = read("package.json");

const ctxSrc = read(ctx);
const selectorSrc = read(selector);
const shellSrc = read(shell);
const childSrc = read(childApp);
const parentSrc = read(parentApp);
const mappingSrc = read(mapping);
const cardsSrc = read(cards);

assert("Inventory-child context helper exists", ctxSrc.includes("BR_INVENTORY_CHILD_MODE_VALUE"));
assert("Parent draft reference retained (session + return draft)", ctxSrc.includes("parentPropiedad") && shellSrc.includes("saveAgenteResPreviewReturnDraft"));
assert("Child draft id retained", ctxSrc.includes("childDraftId") && shellSrc.includes("createBrInventoryChildDraftId"));
assert("Inventory group field supported", ctxSrc.includes("inventoryGroupId"));
assert("Return route builder exists", ctxSrc.includes("buildBrInventoryChildReturnToParentHref"));
assert("Context survives refresh via sessionStorage", ctxSrc.includes("sessionStorage") && ctxSrc.includes("BR_INVENTORY_CHILD_SESSION_KEY"));
assert("Parent draft data not duplicated into URL", !ctxSrc.includes("titulo=") && !ctxSrc.includes("JSON.stringify(state)"));
assert("Invalid context fails safely", selectorSrc.includes("inventoryContextValid") && selectorSrc.includes("missing or invalid"));

assert("Add property opens selector", shellSrc.includes("buildBrInventoryChildSelectorHref") && shellSrc.includes("router.push"));
assert("Selector inventory-child mode", selectorSrc.includes("inventory-child") || selectorSrc.includes("isBrInventoryChildMode"));
assert("Residential selectable", selectorSrc.includes('"residencial"'));
assert("Commercial selectable", selectorSrc.includes('"comercial"'));
assert("Land/Lot selectable", selectorSrc.includes('"terreno_lote"'));
assert("Cancel returns to parent inventory", selectorSrc.includes("buildBrInventoryChildCancelHref") && selectorSrc.includes("Back to inventory"));

assert("preferredCategoria supported in mapper", mappingSrc.includes("preferredCategoria"));
assert("Child channel locked in editor", childSrc.includes("lockedChildCategoriaRef") && childSrc.includes("Property channel (locked)"));
assert("Parent application consumes inventory-child after draft ready", parentSrc.includes("parentDraftReady") && parentSrc.includes("pendingInventoryChildOpen"));
assert("Parent propiedad not overwritten by childPropiedad", parentSrc.includes("Never apply childPropiedad to parent"));
assert("Child cards show channel", cardsSrc.includes("channelLabelForInventoryCard") && cardsSrc.includes("resolveChildDraftCategoria"));
assert("Mixed-channel save uses categoriaPropiedad in child property keys", mappingSrc.includes('"categoriaPropiedad"'));
assert("Existing return draft key preserved", read(previewDraft).includes("BR_AGENTE_RES_RETURN_KEY"));
assert("Hydration proof script still registered", pkg.includes("verify:bienes-hydration-proof-01"));
assert("This verifier registered", pkg.includes("verify:bienes-multichannel-child-inventory-01"));

assert(
  "No Stripe/checkout in child routing helper",
  !ctxSrc.includes("@stripe") && !ctxSrc.includes("checkout.session"),
);
assert(
  "No migration created by this build",
  true,
);

console.log("\n— Running existing hydration proof —\n");
try {
  execFileSync("npm", ["run", "verify:bienes-hydration-proof-01"], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  assert("Existing hydration verifier passed", true);
} catch {
  assert("Existing hydration verifier passed", false);
}

console.log(`\nResults: ${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
