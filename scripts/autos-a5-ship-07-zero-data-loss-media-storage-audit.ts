/**
 * A5.SHIP-07 — Autos zero data loss + media storage audit.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(
  ROOT,
  "app/lib/clasificados/autos/AUTOS_A5_SHIP_07_ZERO_DATA_LOSS_MEDIA_STORAGE_AUDIT.md",
);

const AUDIT_ROWS = [
  "Correct repo confirmed",
  "Autos scope lock respected",
  "Lane impact classified before edits",
  "Existing draft/media behavior inspected",
  "Draft persists for current tab/session",
  "Closing tab/session starts clean by design",
  "Refresh does not clear Negocios draft",
  "Refresh preserves Negocios current step",
  "Preview/back preserves Negocios draft",
  "Volver a editar returns to last review/edit step",
  "Language toggle does not clear draft",
  "Opening/closing Inventory Boost does not clear draft",
  "Opening/closing inventory drawer does not clear parent draft",
  "Negocios vehicle fields persist",
  "Negocios specs persist",
  "Negocios equipment/highlights persist",
  "Negocios business/contact fields persist",
  "Negocios finance fields persist",
  "Negocios socials/reviews/custom links persist",
  "Negocios description persists",
  "additionalInventoryVehicles persist after refresh",
  "Child vehicle edit/remove persists after refresh",
  "In-progress child drawer draft is protected",
  "Outside click cannot silently lose child drawer data",
  "Escape key cannot silently lose child drawer data",
  "Dirty cancel requires confirmation",
  "Local objectURL/blob URLs are not treated as durable saved media",
  "Durable media upload path exists or exact blocker documented",
  "Main vehicle uploaded photos persist durably or blocker documented",
  "Child inventory uploaded photos persist durably or blocker documented",
  "Privado uploaded photos persist durably or blocker documented",
  "Dealer logo upload persists durably or blocker documented",
  "Finance image/logo upload persists durably or blocker documented",
  "URL images persist after refresh",
  "Video URLs persist after refresh",
  "Cover image persists",
  "Image order persists",
  "Media maps to preview",
  "Media maps to listing_payload/publish payload",
  "Upload errors are visible and do not wipe draft",
  "Explicit clear/new application path exists or session close behavior documented",
  "Publish success clears draft only after real listings are safely created",
  "Privado checked for shared impact",
  "Privado refresh preserves draft",
  "Privado preview/back preserves draft",
  "No dealer inventory drawer added to Privado",
  "No dealer-only Business Hub/finance/review/custom links added to Privado",
  "No global Stripe/payment touched",
  "No unrelated categories touched",
  "No schema/migration touched unless approved/documented",
  "npm run build passed",
];

const DRAWER_UNSAVED_ES = "Tienes cambios sin guardar";
const DRAWER_UNSAVED_EN = "You have unsaved changes";

const PRIVADO_DEALER_ONLY = [
  "Inventory Boost",
  "Agregar vehículo al inventario",
  "Más vehículos de este dealer",
  "financeContactImage",
  "dealerCustomLinks",
  "googleReviewsUrl",
  "yelpReviewsUrl",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/servicios/",
  "app/api/stripe/",
  "supabase/migrations/",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  const out = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" }).trim();
  const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" }).trim();
  return [...out.split("\n").filter(Boolean), ...untracked.split("\n").filter(Boolean)];
}

function run() {
  const toplevel = execSync("git rev-parse --show-toplevel", { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(path.resolve(toplevel), ROOT);
  assert.ok(fs.existsSync(AUDIT_MD), "Audit markdown must exist");

  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  const dealerDraft = read("app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts");
  const privadoDraft = read("app/(site)/publicar/autos/privado/hooks/useAutoPrivadoDraft.ts");
  const tabSession = read("app/(site)/clasificados/autos/shared/lib/autosEditorTabSession.ts");
  const persistEffects = read("app/lib/clasificados/autos/useAutosDraftPersistEffects.ts");
  const negociosStorage = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts");
  const idbRefs = read("app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftIdbRefs.ts");
  const inventoryFlow = read("app/lib/clasificados/autos/autosDealerInventoryAddFlow.ts");
  const drawer = read("app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx");
  const mediaCopy = read("app/lib/clasificados/autos/autosDraftLocalMediaCopy.ts");
  const payloadSanitize = read("app/lib/clasificados/autos/autosListingPayloadPersistence.ts");
  const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  const listingTypes = read("app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts");

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");

  for (const row of AUDIT_ROWS) {
    assert.match(
      auditText,
      new RegExp(`\\|\\s*${row.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\|\\s*(TRUE|FALSE)\\s*\\|`),
      `Audit row missing: ${row}`,
    );
  }

  if (recMatch[1]!.toUpperCase() === "GREEN") {
    const tableSection = auditText.slice(auditText.indexOf("## TRUE/FALSE table"));
    assert.ok(!tableSection.includes("| FALSE |"), "No FALSE rows when GREEN");
  }

  assert.ok(tabSession.includes("AUTOS_NEGOCIOS_EDITOR_SESSION_KEY"));
  assert.ok(tabSession.includes("AUTOS_PRIVADO_EDITOR_SESSION_KEY"));
  assert.ok(dealerDraft.includes("editorStep"));
  assert.ok(dealerDraft.includes("flushDraft"));
  assert.ok(dealerDraft.includes("inProgressInventoryVehicleDraft"));
  assert.ok(dealerDraft.includes("additionalInventoryVehicles"));
  assert.ok(privadoDraft.includes("AUTOS_PRIVADO_EDITOR_SESSION_KEY"));
  assert.ok(inventoryFlow.includes('p.set("resume", "1")'));
  assert.ok(persistEffects.includes("pagehide"));
  assert.ok(persistEffects.includes("beforeunload"));
  assert.ok(negociosStorage.includes("inProgressInventoryVehicleDraft"));
  assert.ok(idbRefs.includes("offloadAdditionalInventoryVehiclesToIdb"));
  assert.ok(drawer.includes(DRAWER_UNSAVED_ES.split(" ")[0]!) || drawer.includes("autosInventoryDrawerUnsavedCloseConfirm"));
  assert.ok(read("app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts").includes(DRAWER_UNSAVED_ES));
  assert.ok(read("app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts").includes(DRAWER_UNSAVED_EN));
  assert.ok(mediaCopy.includes("temporary draft") || mediaCopy.includes("borrador temporal"));
  assert.ok(payloadSanitize.includes('startsWith("blob:")'));
  assert.ok(!dealerDraft.includes("createObjectURL"));
  assert.ok(listingTypes.includes("sourceType"));
  assert.ok(listingTypes.includes("isPrimary"));
  assert.ok(listingTypes.includes("sortOrder"));

  for (const phrase of PRIVADO_DEALER_ONLY) {
    assert.ok(!privadoApp.includes(phrase), `Privado must not contain: ${phrase}`);
  }

  const changed = changedFiles();
  for (const file of changed) {
    const norm = file.replace(/\\/g, "/");
    for (const prefix of FORBIDDEN_PREFIXES) {
      assert.ok(!norm.startsWith(prefix), `Forbidden path modified: ${file}`);
    }
  }

  console.log("A5.SHIP-07 zero data loss media storage audit: PASS");
}

run();
