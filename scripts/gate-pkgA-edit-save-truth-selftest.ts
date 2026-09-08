/**
 * Globalization Package A Gate 5 — edit/save truth and lifecycle parity self-test.
 *
 * Pins the Gate 5 deliverables:
 *   1. EDITOR PARITY — Mascotas and BR Privado now resolve the generic owner-verified editor
 *      (with the safety proofs the ledger required), so every `listings`-table pipeline with
 *      an active lane has a real edit surface.
 *   2. AUTOS OWNER RESUME — the missing second half of the pause cycle: an owner-verified
 *      restore API (strictly "removed" → "active"; admin-suspended rows never
 *      owner-restorable), wired into the dealer dashboard.
 *   3. COMIDA LOCAL OWNER LIFECYCLE — the pipeline's first owner-side mutation capability:
 *      pause/resume API (published ↔ paused; ownership fail-closed incl. legacy null owners;
 *      zero-row detection), wired into the dashboard card. No schema change — 'paused' was
 *      already in the table CHECK.
 *   4. SAME-ROW SAVE TRUTH — every quick publisher's reuse path updates the same row (never
 *      inserts under a verified existing identity), and the Gate 3 idempotency/staleness
 *      hooks remain in place.
 *
 * Run from repo root: npx tsx scripts/gate-pkgA-edit-save-truth-selftest.ts
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { getCategoryRouteAdapter } from "../app/lib/listingIdentity/categoryRouteRegistry";
import type { ListingIdentity } from "../app/lib/listingIdentity/types";

const REPO_ROOT = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(REPO_ROOT, p), "utf8");

function fakeIdentity(overrides: Partial<ListingIdentity>): ListingIdentity {
  return {
    sourceTable: "listings",
    sourceId: "00000000-0000-0000-0000-000000000099",
    category: "en-venta",
    pipeline: "en_venta",
    leonixAdId: "",
    ownerUserId: "owner-1",
    publicUrl: "/x",
    editUrl: null,
    previewUrl: null,
    dashboardUrl: null,
    ...overrides,
  };
}

/* 1 — Editor parity across the listings-table family. */
{
  const expectGenericEditor = [
    ["en_venta", "en-venta"],
    ["busco", "busco"],
    ["clases", "clases"],
    ["comunidad", "comunidad"],
    ["mascotas_y_perdidos", "mascotas-y-perdidos"],
    ["bienes_raices_privado", "bienes-raices"],
  ] as const;
  for (const [pipeline, category] of expectGenericEditor) {
    const adapter = getCategoryRouteAdapter(pipeline);
    const href = adapter.editRoute(
      fakeIdentity({ pipeline, category, sourceId: "00000000-0000-0000-0000-000000000042" }),
      { lang: "es" },
    );
    assert.ok(
      href?.includes("/dashboard/mis-anuncios/00000000-0000-0000-0000-000000000042/editar"),
      `${pipeline} must resolve the generic owner-verified editor`,
    );
  }
  // The generic editor is genuinely owner-scoped and same-row (regression pin on the page).
  const editor = read("app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx");
  assert.ok(editor.includes('.eq("owner_id", u.id)'), "the generic editor must stay owner-scoped");
}

/* 2 — Autos owner resume. */
{
  const service = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  const restoreIdx = service.indexOf("export async function markAutosClassifiedsListingRestoredIfOwner");
  assert.ok(restoreIdx > -1, "the owner restore service function must exist");
  const restoreBody = service.slice(restoreIdx, restoreIdx + 600);
  assert.ok(restoreBody.includes('row.status !== "removed"'), "restore must be strictly removed→active (never suspended/draft/pending)");
  assert.ok(restoreBody.includes("assertAutosListingOwner"), "restore must verify ownership server-side");
  assert.ok(
    existsSync(path.join(REPO_ROOT, "app/api/clasificados/autos/listings/[id]/restore/route.ts")),
    "the restore API route must exist",
  );
  const dashboard = read("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx");
  assert.ok(dashboard.includes("/restore"), "the dealer dashboard must call the restore API");
  assert.ok(dashboard.includes('row.status === "removed"'), "the resume button must render only for owner-removed rows");
}

/* 3 — Comida Local owner lifecycle. */
{
  const route = read("app/api/clasificados/comida-local/lifecycle/route.ts");
  assert.ok(route.includes("comidaLocalOwnerIdFromBearer"), "must authenticate via bearer, never trust body owner ids");
  assert.ok(route.includes("!rowOwner || rowOwner !== ownerUserId"), "must fail closed on legacy null owners and mismatches");
  assert.ok(route.includes('action === "pause" ? "published" : "paused"'), "pause/resume must be strict status transitions");
  assert.ok(route.includes('.select("id")') && route.includes("no_row_updated"), "must apply the I.13A zero-row-detection rule");
  const card = read("app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx");
  assert.ok(card.includes("/api/clasificados/comida-local/lifecycle"), "the dashboard card must call the lifecycle API");
  assert.ok(card.includes('item.status === "published"') && card.includes('item.status === "paused"'), "buttons must key off the raw status");
}

/* 4 — Same-row save truth: verified reuse never falls through to INSERT; failed verification
 * fails closed (the I.6C rule, re-pinned here as this package's own regression net). */
{
  for (const publisher of [
    "app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts",
    "app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts",
    "app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts",
  ]) {
    const src = read(publisher);
    assert.ok(src.includes("verifyQuickListingReusable"), `${publisher} must verify existing identities`);
    assert.ok(src.includes("quickListingExistingIdentityInvalidMessage"), `${publisher} must fail closed on failed verification`);
    assert.ok(src.includes("updateListingsRowResilient"), `${publisher} must UPDATE the same row on verified reuse`);
    assert.ok(src.includes("getOrCreateSessionPublishAttemptKey"), `${publisher} must keep the Gate 3 idempotency key`);
  }
}

console.log("gate-pkgA-edit-save-truth-selftest: all assertions passed.");
