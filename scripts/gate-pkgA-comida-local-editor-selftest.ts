/**
 * Globalization Package A terminal closure — Comida Local dedicated editor self-test.
 *
 * Pins the correction's contract:
 *   1. IDENTITY + SAME-ROW — hydration forces the draft's draftListingId to the ROW's own
 *      draft_listing_id (the exact key the publish route's update branch matches), so a saved
 *      edit can only ever update the same row; the update branch itself preserves id, slug,
 *      Leonix Ad ID, status, payment status, and enforces ownership (I.13A guard).
 *   2. FAIL-CLOSED — hydration is owner-scoped and refuses legacy rows without a stored
 *      draft_listing_id (publishing a regenerated id would INSERT a duplicate).
 *   3. NAMESPACE ISOLATION (Rule 1) — the edit workspace key is per-listing and distinct from
 *      the new-ad draft key; publish success clears only the edit workspace + marker.
 *   4. WIRING — registry editRoute, dashboard Edit action, application edit mode (banner,
 *      Save-changes labels ES/EN, discard), preview edit-draft mode with return-to-edit, and
 *      no payment/checkout behavior anywhere in the lane.
 *
 * Run from repo root: npx tsx scripts/gate-pkgA-comida-local-editor-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { comidaLocalEditWorkspaceStorageKey, COMIDA_LOCAL_DRAFT_STORAGE_KEY } from "../app/lib/clasificados/comida-local/comidaLocalDraftPersistence";
import { getCategoryRouteAdapter } from "../app/lib/listingIdentity/categoryRouteRegistry";
import type { ListingIdentity } from "../app/lib/listingIdentity/types";

const REPO_ROOT = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(REPO_ROOT, p), "utf8");

/* 1/3 — Namespace isolation is structural. */
{
  const editKey = comidaLocalEditWorkspaceStorageKey("abc-123");
  assert.notEqual(editKey, COMIDA_LOCAL_DRAFT_STORAGE_KEY, "edit workspace must never share the new-ad draft key");
  assert.ok(editKey.includes(":edit:") && editKey.endsWith("abc-123"), "edit key must be per-listing");
  assert.notEqual(
    comidaLocalEditWorkspaceStorageKey("a"),
    comidaLocalEditWorkspaceStorageKey("b"),
    "two listings must never share an edit workspace",
  );
}

/* 1/2 — Hydration adapter contract. */
{
  const src = read("app/lib/clasificados/comida-local/comidaLocalListingEditContext.ts");
  assert.ok(src.includes('.eq("owner_user_id", ownerUserId)'), "hydration must be owner-scoped server-side");
  assert.ok(
    src.includes("draftListingId: rowDraftListingId"),
    "the hydrated draft's draftListingId must be forced to the ROW's draft_listing_id (same-row guarantee)",
  );
  assert.ok(
    src.includes('"not_editable_legacy_row"') && src.includes("!slug || !rowDraftListingId"),
    "legacy rows without draft_listing_id must fail closed — never risk a duplicate insert",
  );
  assert.ok(src.includes("sourceUpdatedAt"), "hydration must capture the Rule 3 staleness anchor");

  // The server update branch this rides on still preserves identity/status/ownership.
  const route = read("app/api/clasificados/comida-local/publish/route.ts");
  assert.ok(route.includes('.eq("draft_listing_id", draftListingId)'), "the update branch must key on draft_listing_id");
  assert.ok(route.includes("ownership_mismatch"), "the I.13A ownership guard must remain");
  assert.ok(route.includes("existing.leonix_ad_id") && route.includes("existing.slug"), "Leonix Ad ID and slug must be preserved from the existing row");
  assert.ok(route.includes("(existing.status"), "status must be preserved from the existing row");
}

/* 4 — Wiring: registry, dashboard, application, preview. */
{
  const adapter = getCategoryRouteAdapter("comida_local");
  const identity: ListingIdentity = {
    sourceTable: "comida_local_public_listings",
    sourceId: "00000000-0000-0000-0000-000000000042",
    category: "comida-local",
    pipeline: "comida_local",
    leonixAdId: "",
    ownerUserId: "owner-1",
    publicUrl: "/x",
    editUrl: null,
    previewUrl: null,
    dashboardUrl: null,
  };
  const editHref = adapter.editRoute(identity, { lang: "es" });
  assert.ok(
    editHref?.includes("/publicar/comida-local?edit=1&listingId=00000000-0000-0000-0000-000000000042"),
    "registry editRoute must resolve the dedicated listing-bound editor",
  );

  const card = read("app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx");
  assert.ok(card.includes("edit=1&listingId="), "the dashboard card must expose the real Edit action");

  const app = read("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");
  assert.ok(app.includes("fetchOwnerComidaLocalListingForEdit"), "the application must hydrate via the owner-scoped adapter");
  assert.ok(app.includes("comidaLocalEditWorkspaceStorageKey"), "the application must persist edits under the per-listing edit key");
  assert.ok(app.includes("resolveDraftPrecedence"), "the application must apply Rule 3 staleness precedence");
  assert.ok(app.includes('"Guardar cambios"') && app.includes('"Save changes"'), "edit mode must use truthful ES/EN save labels");
  assert.ok(app.includes("Editando anuncio publicado") && app.includes("Editing published listing"), "edit mode must show the ES/EN edit banner");
  assert.ok(app.includes("clearComidaLocalEditContext"), "publish success / discard must clear the edit context");
  assert.ok(!app.toLowerCase().includes("stripe"), "no payment behavior may enter this free lane's editor");

  const preview = read("app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx");
  assert.ok(preview.includes("resolvePreviewMode"), "the preview must resolve the shared preview-mode contract");
  assert.ok(preview.includes("comidaLocalEditWorkspaceStorageKey"), "the edit-draft preview must read the per-listing edit workspace, never the new-ad draft");
  assert.ok(preview.includes("Volver a editar"), "the edit-draft preview must offer return-to-edit");
  assert.ok(!preview.includes("PublishCheckoutCheckpoint"), "the preview must stay checkout-free");
}

console.log("gate-pkgA-comida-local-editor-selftest: all assertions passed.");
