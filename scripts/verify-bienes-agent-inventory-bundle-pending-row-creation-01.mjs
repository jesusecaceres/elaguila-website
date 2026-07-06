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

const docRel = "docs/bienes-agent-inventory-bundle-pending-row-creation-01.md";
const helperRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryBundlePendingPublish.ts";
const previewRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx";
const verifierRel = "scripts/verify-bienes-agent-inventory-bundle-pending-row-creation-01.mjs";

for (const rel of [docRel, helperRel, previewRel, verifierRel]) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
}

const doc = read(docRel);
const helper = read(helperRel);
const preview = read(previewRel);
const pkg = read("package.json");

for (const section of [
  "Executive Summary",
  "Task Classification",
  "Autos Reference Comparison",
  "Bienes Gap",
  "Implementation",
  "Parent Row Behavior",
  "Child Pending Row Behavior",
  "SQL Proof Query",
  "Retry / Duplicate Risk",
  "Manual QA Checklist",
  "Remaining Risks",
]) {
  assert(doc.includes(section), `Document must include section: ${section}`);
}

assert(doc.includes("inventory_role = inventory_property"), "Doc must document child inventory_role");
assert(doc.includes("br_inventory_parent_listing_id"), "Doc must document parent listing id on children");
assert(doc.includes("pending_payment") || doc.includes("status = pending"), "Doc must document pending state");

assert(
  helper.includes("publishLeonixListingFromAgenteResidencialDraft"),
  "Helper must call publishLeonixListingFromAgenteResidencialDraft",
);
assert(helper.includes('mode: "add"'), "Helper must use inventory add mode");
assert(helper.includes("parentListingId"), "Helper must pass parentListingId");
assert(helper.includes("brInventoryGroupId"), "Helper must pass brInventoryGroupId");
assert(helper.includes("pending_payment"), "Helper must use pending_payment activation");

assert(
  preview.includes("publishBrAgenteInventoryBundlePendingRows"),
  "Preview client must call bundle helper",
);
const pendingBlock = preview.slice(preview.indexOf("if (r.pendingPayment && needsPayment)"));
assert(
  pendingBlock.includes("publishBrAgenteInventoryBundlePendingRows"),
  "Bundle helper must run inside pending-payment block before checkout",
);
assert(preview.includes("startRevenueCategoryCheckout"), "Preview must still start checkout after bundle");
assert(
  preview.includes("handleMainPublishWithOptionalQueue"),
  "Queue fallback must remain for non-pending immediate publish",
);

const lockedPrefixes = [
  "app/api/stripe/",
  "app/api/revenue-os/checkout/",
  "app/api/revenue-os/webhook/",
  "supabase/migrations/",
  "app/lib/clasificados/autos/",
];

for (const prefix of lockedPrefixes) {
  const changed = gitDiffForPrefix(prefix);
  assert(!changed, `Locked path must not be modified: ${prefix} (${changed})`);
}

assert(
  pkg.includes('"verify:bienes-agent-inventory-bundle-pending-row-creation-01"'),
  "package.json must include verifier script",
);

console.log("verify:bienes-agent-inventory-bundle-pending-row-creation-01 — all checks passed");
