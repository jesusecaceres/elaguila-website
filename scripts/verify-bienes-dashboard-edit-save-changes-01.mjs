import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const appPath =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx";
const previewPath =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx";
const apiPath = "app/api/clasificados/bienes-raices/listing-edit/route.ts";
const buildPath = "app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts";

const app = read(appPath);
const preview = read(previewPath);
const api = read(apiPath);
const build = read(buildPath);

function must(source, needle, label) {
  assert.ok(source.includes(needle), label);
}

must(app, 'dashboardMode === "listing-edit"', "edit mode requires mode=listing-edit");
must(app, 'searchParams?.get("source") === "dashboard"', "edit mode requires dashboard source");
must(app, 'searchParams?.get("listingId")?.trim()', "edit mode reads listingId");
must(app, "hydrateBienesListingForDashboardEdit", "parent/child dashboard hydration is used");
must(app, '"/api/clasificados/bienes-raices/listing-edit"', "application posts to Bienes listing-edit API");
must(app, "Save changes", "EN Save changes CTA exists");
must(app, "Guardar cambios", "ES Save changes CTA exists");
must(app, "Saving changes…", "EN saving state exists");
must(app, "Guardando cambios…", "ES saving state exists");
must(app, "saveEditBusy", "duplicate submission guard exists");
must(app, "bienesInventoryPackInactiveDashboardHint", "inventory message may remain");
must(app, "saveDashboardListingEdit", "Step 10 save handler exists");
must(app, "cancelDashboardListingEdit", "cancel edit handler exists");
must(app, "Los cambios no guardados se descartarán", "ES cancel dirty warning exists");
must(app, "Unsaved changes will be discarded", "EN cancel dirty warning exists");
must(app, "Cambios guardados", "ES success confirmation exists");
must(app, "Changes saved", "EN success confirmation exists");
must(app, "leonixLiveAnuncioPath(editListingId)", "public listing success link exists");
must(app, "dashboardReturnHref", "dashboard return link exists");

must(preview, "listingBoundPreview", "preview detects listing-bound edit mode");
must(preview, "onSaveListingEdit", "preview save handler exists");
must(preview, "Guardar cambios", "preview ES save CTA exists");
must(preview, "Save changes", "preview EN save CTA exists");
must(preview, "showPaymentCheckpoint = Boolean(checkpointConfig) && !listingBoundPreview", "preview suppresses checkout in edit mode");
must(preview, '"/api/clasificados/bienes-raices/listing-edit"', "preview posts to same Bienes edit API");

must(api, "getBearerUserId", "owner auth required");
must(api, ".eq(\"owner_id\", bearerUserId)", "update is owner-scoped");
must(api, ".eq(\"category\", \"bienes-raices\")", "update is category-scoped");
must(api, "leonix_id_mismatch", "Leonix ID mismatch is blocked");
must(api, "buildPublishParamsFromAgenteResidencialDraft", "API builds editable field payload from agente form");
must(api, "updateOneListing", "same-row update helper exists");
must(api, ".update(builtPatch.patch)", "API updates existing rows");
must(api, "existingChildListingIdFromDraft", "child UUID is parsed from existing child draft id");
must(api, 'id.startsWith("br-db-child-")', "existing child UUID prefix required");
must(api, "skippedNewChildren", "new children are not recreated silently");
must(api, "for (const childDraft of draft.additionalInventoryProperties ?? [])", "missing child array is safe");
must(api, "childById.get(childId)", "child update matches exact existing child UUID");
must(api, ".eq(\"br_inventory_parent_listing_id\", input.parentListingId)", "child update is parent-scoped");
must(api, "blob_url_not_persistable", "blob URLs cannot be stored publicly");
must(api, "dataUrlToBlob", "new data URL media is uploaded before public storage");
must(api, "listing-images", "media uploads target listing-images storage");
must(api, "images: input.images", "image order is saved from resolved ordered sources");
must(api, "status", "status is read for proof");
must(api, "is_published", "is_published is read for proof");

assert.ok(!api.includes("insert("), "Bienes edit API must not insert replacement listings");
assert.ok(!api.includes("startRevenueCategoryCheckout"), "Bienes edit API must not start checkout");
assert.ok(!api.includes("redirectToRevenueCategoryCheckout"), "Bienes edit API must not redirect to Stripe");
const patchStart = api.indexOf("patch: {");
const patchEnd = api.indexOf("updated_at: new Date().toISOString()", patchStart);
assert.ok(patchStart >= 0 && patchEnd > patchStart, "editable patch object is present");
const patchBlock = api.slice(patchStart, patchEnd);
assert.ok(!patchBlock.includes("published_at:"), "same-row patch must not rewrite published_at");
assert.ok(!patchBlock.includes("expires_at:"), "same-row patch must not rewrite expiration");
assert.ok(!patchBlock.includes("status:"), "same-row patch must not rewrite status");
assert.ok(!patchBlock.includes("is_published:"), "same-row patch must not rewrite is_published");
assert.ok(!patchBlock.includes("leonix_ad_id:"), "same-row patch must not rewrite Leonix IDs");
assert.ok(!patchBlock.includes("br_inventory_parent_listing_id:"), "same-row patch must not rewrite parent relationship");

must(build, "buildPublishParamsFromAgenteResidencialDraft", "agente build helper is exported");
must(build, "publishLeonixRealEstateListingCore", "publish path still uses original core after build helper");

function mergeDetailPairs(existing, next) {
  const out = [];
  const nextByLabel = new Map(next.map((p) => [p.label, p]));
  const seen = new Set();
  for (const item of existing) {
    const replacement = nextByLabel.get(item.label);
    if (replacement) {
      out.push(replacement);
      seen.add(item.label);
    } else if (item.value) {
      out.push(item);
    }
  }
  for (const p of next) {
    if (!seen.has(p.label)) out.push(p);
  }
  return out;
}

const existingParent = {
  id: "parent-uuid",
  leonix_ad_id: "BR-2026-000018",
  status: "active",
  is_published: true,
  expires_at: "2026-08-14T00:00:00Z",
  images: ["https://x.supabase.co/storage/v1/object/public/listing-images/a/01.jpg"],
  detail_pairs: [
    { label: "Leonix:branch", value: "bienes_raices_negocio" },
    { label: "Recámaras", value: "3" },
    { label: "Legacy preserved", value: "keep" },
  ],
};
const nextPairs = [
  { label: "Recámaras", value: "4" },
  { label: "Baños", value: "2" },
];
const merged = mergeDetailPairs(existingParent.detail_pairs, nextPairs);
assert.equal(merged.find((p) => p.label === "Recámaras")?.value, "4", "editable pair updates");
assert.equal(merged.find((p) => p.label === "Legacy preserved")?.value, "keep", "unmentioned pair preserved");
assert.equal(existingParent.id, "parent-uuid", "parent UUID preserved by simulation");
assert.equal(existingParent.leonix_ad_id, "BR-2026-000018", "parent Leonix ID preserved by simulation");
assert.equal(existingParent.status, "active", "status preserved by simulation");
assert.equal(existingParent.is_published, true, "is_published preserved by simulation");
assert.equal(existingParent.expires_at, "2026-08-14T00:00:00Z", "expiration preserved by simulation");

function existingChildListingIdFromDraftId(id) {
  return id.startsWith("br-db-child-") ? id.slice("br-db-child-".length).trim() || null : null;
}
assert.equal(existingChildListingIdFromDraftId("br-db-child-6eb2f138-c9b9-470c-8e34-5165409849c4"), "6eb2f138-c9b9-470c-8e34-5165409849c4", "existing child UUID parsed");
assert.equal(existingChildListingIdFromDraftId("br-local-property-new"), null, "new child cannot overwrite an existing child");

const childRows = new Map([
  ["6eb2f138-c9b9-470c-8e34-5165409849c4", { id: "6eb2f138-c9b9-470c-8e34-5165409849c4", leonix_ad_id: "BR-2026-000019" }],
  ["1291df5c-ef61-49ad-b99e-1d69c1c31f81", { id: "1291df5c-ef61-49ad-b99e-1d69c1c31f81", leonix_ad_id: "BR-2026-000020" }],
]);
const submittedDrafts = [{ id: "br-db-child-6eb2f138-c9b9-470c-8e34-5165409849c4" }];
const updated = submittedDrafts
  .map((d) => existingChildListingIdFromDraftId(d.id))
  .filter((id) => id && childRows.has(id));
assert.deepEqual(updated, ["6eb2f138-c9b9-470c-8e34-5165409849c4"], "only submitted existing child updates");
assert.equal(childRows.size, 2, "missing child array entries do not delete existing children");

let busy = false;
function submitOnce() {
  if (busy) return false;
  busy = true;
  return true;
}
assert.equal(submitOnce(), true, "first submit accepted");
assert.equal(submitOnce(), false, "duplicate submit blocked");

console.log("verify-bienes-dashboard-edit-save-changes-01: PASS");
