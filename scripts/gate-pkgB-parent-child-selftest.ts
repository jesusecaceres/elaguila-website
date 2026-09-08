/**
 * Globalization Package B (Gates B4/B5) — parent/child inventory lifecycle self-test.
 *
 * Pins the Bienes and Autos repairs:
 *   BR  — 4-child hydration cap removed; skippedNewChildren surfaced by BOTH save callers;
 *         direct child dashboard actions; openChildDraftId deep link; child edit route real;
 *         cascade/isolation protections untouched.
 *   Autos — dealer-parent saves propagate embedded inventory edits to each child's OWN row
 *         (same creation-time mapper; owner-scoped per child; foreign/draft-only ids never
 *         touched; only listing_payload/lang written); direct child dashboard edit action;
 *         editVehicleId deep link; child edit route real.
 *
 * Run from repo root: npx tsx scripts/gate-pkgB-parent-child-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(REPO_ROOT, p), "utf8");

/* BR — hydration cap removed; hero-first child mapping unchanged. */
{
  const hydration = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesPublishedToAgenteApplicationDraft.ts",
  );
  // The children mapping chain must carry NO slice cap between the role filter and the
  // per-child mapper (the removal rationale comment may mention the old literal).
  assert.ok(
    !/isBrInventoryProperty[\s\S]{0,240}\.slice\(/.test(hydration),
    "the hard-coded 4-child hydration cap must be gone from the children mapping chain",
  );
  assert.ok(
    hydration.includes("Visibility ≠ activation"),
    "the cap-removal rationale must document visibility vs entitlement-activation separation",
  );
}

/* BR — skippedNewChildren surfaced by BOTH save callers; route still returns it. */
{
  const route = read("app/api/clasificados/bienes-raices/listing-edit/route.ts");
  assert.ok(route.includes("skippedNewChildren,"), "the edit route must keep returning skippedNewChildren");
  for (const caller of [
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx",
  ]) {
    const src = read(caller);
    assert.ok(src.includes("skippedNewChildren"), `${caller} must consume skippedNewChildren`);
    assert.ok(
      src.includes("NO se crearon desde esta edición") && src.includes("NOT created from this edit"),
      `${caller} must surface the skip bilingually — never silent`,
    );
  }
}

/* BR — direct child dashboard actions + deep link handler. */
{
  const card = read("app/(site)/clasificados/bienes-raices/dashboard/BrNegocioListingInventoryActions.tsx");
  assert.ok(card.includes("openChildDraftId=") && card.includes("br-db-child-"), "child card must deep-link its own editor");
  assert.ok(card.includes("Editar propiedad") && card.includes("Edit property"), "child card must offer the bilingual Edit action");
  assert.ok(card.includes("Ver pública") && card.includes("View public"), "child card must offer the public-view action");

  const application = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx",
  );
  assert.ok(application.includes('searchParams?.get("openChildDraftId")'), "the application must read the child deep-link param");
  assert.ok(application.includes("resolveChildDraftCategoria(child)"), "the deep link must resolve the child's own categoría");
}

/* Autos — server-side child-row propagation (defect D4). */
{
  const service = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  const fnStart = service.indexOf("export async function syncDealerInventoryChildRowsFromParentPayload");
  assert.ok(fnStart > -1, "the child-row sync function must exist");
  const fn = service.slice(fnStart, fnStart + 3500);
  assert.ok(fn.includes("mapInheritedDealerPreviewListing"), "sync must rebuild through the SAME creation-time mapper (VIN/NHTSA fields carry)");
  assert.ok(fn.includes("updateAutosClassifiedsListingDraft(childId, ownerUserId"), "per-child updates go through the owner-scoped service (only listing_payload/lang written)");
  assert.ok(fn.includes("ownedChildIds.has(childId)"), "foreign/draft-only ids are never touched");
  assert.ok(fn.includes("id === parent.id) return false"), "no self-parenting: the parent's own id is excluded");
  assert.ok(fn.includes("failedChildIds"), "partial failures are reported, never swallowed");

  const patchRoute = read("app/api/clasificados/autos/listings/[id]/route.ts");
  assert.ok(patchRoute.includes("syncDealerInventoryChildRowsFromParentPayload"), "the PATCH route must invoke the sync after a dealer-parent save");
  assert.ok(patchRoute.includes('inventory_role !== "inventory_vehicle"'), "the sync must never run for a child row's own PATCH");
  assert.ok(patchRoute.includes("childSyncUpdated") && patchRoute.includes("childSyncFailed"), "the PATCH response must surface the sync result");
}

/* Autos — direct child dashboard edit action + deep link handler. */
{
  const dashboard = read("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx");
  assert.ok(dashboard.includes("editVehicleId=") && dashboard.includes("isChildRow && parentId"), "child rows must offer the direct Edit action");
  const application = read("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  assert.ok(application.includes('searchParams?.get("editVehicleId")'), "the dealer application must read the child deep-link param");
  assert.ok(application.includes("setInventoryDrawerOpen(true, editVehicleId)"), "the deep link must open THIS vehicle's drawer editor");
}

/* Registry/resolver child truths are pinned in gate-pkgA-catalog-freeze, gate-i5-7f, and
 * gate-i5-8 (updated in this package) — not duplicated here. */

console.log("gate-pkgB-parent-child-selftest: all assertions passed.");
