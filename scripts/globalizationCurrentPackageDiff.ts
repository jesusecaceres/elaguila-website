/**
 * Globalization program — current in-flight package diff allowlist.
 *
 * Several historical gate self-tests assert that the CURRENT working diff (`git diff HEAD`)
 * contains no locked/external-system file. Those checks are package-scoped snapshots: they were
 * written while their own package was the only in-flight diff, so every later package that
 * legitimately touches an intersecting file re-trips them (the exact stale-assertion class
 * Globalization P1 already hit and documented). Instead of re-editing five gates with bespoke
 * exception sets every package, they now all consume this single module.
 *
 * RULES (same standard P1 set — narrow, exact-file, never a loosened fragment match):
 *  - Exact repo-relative paths only. No globs, no directories, no fragments.
 *  - Every entry carries the package/gate that owns it and why the file is legitimately in
 *    the in-flight diff.
 *  - Entries are inert once their package's commit lands (the working diff resets), but stay
 *    here as the audit trail of what each package was authorized to touch.
 *  - A file listed here is still subject to every OTHER assertion in every gate — this only
 *    exempts it from the "not part of this package's diff" scope checks.
 */

export const GLOBALIZATION_CURRENT_PACKAGE_FILES: ReadonlySet<string> = new Set([
  // ——— Package A Gate 1 (catalog and contract freeze) ———
  // Lane-record types + guarded child-edit target helper (additive contract work):
  "app/lib/listingIdentity/types.ts",
  "app/lib/listingIdentity/categoryRouteRegistry.ts",
  "app/lib/listingIdentity/index.ts",
  // Gate self-test updated to pin the NEW guarded truth (was pinning the old unguarded truth
  // as documentation):
  "scripts/gate-i5-7f-full-catalog-route-contract-selftest.ts",
  // New Package A Gate 1 proof + the aggregate runner it certifies:
  "scripts/gate-pkgA-catalog-freeze-selftest.ts",
  "scripts/run-all-gates.ts",
  "scripts/globalizationCurrentPackageDiff.ts",
  // package.json: ONLY the added `test:gates` script entry (pinned exactly by
  // gate-pkgA-catalog-freeze-selftest.ts §3) — no dependency or build change.
  "package.json",
  // Ledger update log for Package A:
  "docs/gate-i5-7f-full-catalog-route-contract-matrix.md",
  // Historical diff-scope gates rewired onto this module (this file):
  "scripts/gate-i13a-launch-readiness-selftest.ts",
  "scripts/gate-i13b-public-visibility-filter-selftest.ts",
  "scripts/gate-p1-globalization-runtime-unblock-selftest.ts",
  "scripts/gate-i5-6-es-en-launch-language-controls-selftest.ts",
  "scripts/gate-i5-4d-rentas-canonical-public-route-selftest.ts",

  // ——— Package A Gate 2 (checkpoints and gateway completeness) ———
  // Seven new free/paid-truth checkpoint card builders + one shared client + seven pages:
  "app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts",
  "app/(site)/clasificados/publicar/_components/QuickLaneCheckpointClient.tsx",
  "app/(site)/publicar/busco/page.tsx",
  "app/(site)/publicar/clases/page.tsx",
  "app/(site)/publicar/comunidad/page.tsx",
  "app/(site)/publicar/mascotas-y-perdidos/page.tsx",
  "app/(site)/publicar/en-venta/page.tsx",
  "app/(site)/publicar/comida-local/checkpoint/page.tsx",
  "app/(site)/publicar/viajes/checkpoint/page.tsx",
  // Gateway checkpoint-first resolution + live legacy CTA map (5 lanes → checkpoints):
  "app/(site)/publicar/publicarGatewayResolver.ts",
  "app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes.ts",
  // Gate self-tests updated to pin the new checkpoint-first truth + new Gate 2 proof:
  "scripts/gate-i5-2-publish-gateway-selftest.ts",
  "scripts/gate-i5-8-empleos-autos-viajes-route-drift-selftest.ts",
  "scripts/gate-pkgA-checkpoints-selftest.ts",

  // ——— Package A Gate 3 (shared draft contract + publish idempotency) ———
  // Canonical draft-workspace contract (new shared module family):
  "app/lib/listingDrafts/draftWorkspaceContract.ts",
  // Approved additive migration: listings.publish_attempt_key + partial unique index
  // (closes the concurrent double-submit race; plan §13 item 5):
  "supabase/migrations/20260804120000_listings_publish_attempt_idempotency_key.sql",
  // Idempotency helpers + the three quick-lane publisher wirings:
  "app/(site)/clasificados/lib/quickListingIdempotency.ts",
  "app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts",
  "app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts",
  "app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts",
  // Rentas/BR pending-reuse lookup fail-closed (gated fix; lookup-error → hard stop):
  "app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts",
  // Staleness-capture hooks (additive) on the two P2-class edit workspaces:
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesDashboardListingEditWorkspace.ts",
  "app/(site)/clasificados/publicar/rentas/shared/rentasListingEditWorkspace.ts",
  // New Gate 3 proof:
  "scripts/gate-pkgA-draft-idempotency-selftest.ts",

  // ——— Package A Gate 4 (preview-mode wiring full catalog) ———
  // Latent-guard closures (P3-documented) + the Empleos paid-lane guards + BR Negocio 3-way split:
  "app/(site)/clasificados/bienes-raices/preview/privado/components/BienesRaicesPrivadoPreviewClient.tsx",
  "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx",
  "app/(site)/clasificados/empleos/premium-preview/EmpleoPremiumPreviewClient.tsx",
  "app/(site)/clasificados/empleos/quick-preview/EmpleoQuickPreviewClient.tsx",
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
  // Lane-registry correction (Empleos quick = paid job post) + its Gate 1 selftest update:
  "scripts/gate-pkgA-catalog-freeze-selftest.ts",
  // New Gate 4 proof:
  "scripts/gate-pkgA-preview-modes-selftest.ts",

  // ——— Package A Gate 5 (edit/save truth and lifecycle parity) ———
  // Mascotas + BR Privado wired to the generic owner-verified editor (registry above already
  // authorized); coupled truth tables + pinned gates updated rather than left stale:
  "app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts",
  "app/admin/_lib/adminActionTruth.ts",
  "scripts/gate-i6a-quick-clasificados-lifecycle-selftest.ts",
  "scripts/gate-i6b-quick-clasificados-integrity-selftest.ts",
  "scripts/gate-i8a-global-dashboard-truth-selftest.ts",
  "scripts/gate-i8b-live-dashboard-coverage-selftest.ts",
  "scripts/gate-i9a-admin-operations-truth-selftest.ts",
  "scripts/gate-i9b-admin-write-safety-selftest.ts",
  "scripts/gate-i5-4a-1-br-privado-seller-photo-persistence-selftest.ts",
  "scripts/gate-i7a-specialized-lifecycle-reconciliation-selftest.ts",
  // Autos owner resume (removed→active, owner-verified) — service + API + dashboard wiring:
  "app/lib/clasificados/autos/autosClassifiedsListingService.ts",
  "app/api/clasificados/autos/listings/[id]/restore/route.ts",
  "app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx",
  // Comida Local owner lifecycle (first owner-side mutation capability) — API + card + page hook:
  "app/api/clasificados/comida-local/lifecycle/route.ts",
  "app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx",
  "app/(site)/dashboard/mis-anuncios/page.tsx",
  // New Gate 5 proof:
  "scripts/gate-pkgA-edit-save-truth-selftest.ts",

  // ——— Package A terminal closure (owner-directed corrections) ———
  // Comida Local dedicated editor (own-table adapter; same-row via draft_listing_id):
  "app/lib/clasificados/comida-local/comidaLocalDraftPersistence.ts",
  "app/lib/clasificados/comida-local/comidaLocalListingEditContext.ts",
  "app/lib/clasificados/comida-local/useComidaLocalDraft.ts",
  "app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx",
  "app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx",
  // BR/Rentas stale-draft precedence adoption (Rule 3 wired into the named surfaces):
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesPublishedToAgenteApplicationDraft.ts",
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx",
  "app/(site)/clasificados/publicar/rentas/shared/rentasDashboardEditHydration.ts",
  "app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx",
  "app/(site)/clasificados/publicar/rentas/negocio/application/RentasNegocioForm.tsx",
  // New closure proofs:
  "scripts/gate-pkgA-comida-local-editor-selftest.ts",
  "scripts/gate-pkgA-stale-draft-precedence-selftest.ts",

  // ═══ PACKAGE B — MEDIA + PARENT/CHILD INVENTORY ═══
  // (Package A entries above are inert since commit cdb75453; they remain as the audit trail.)
  // Gate B1/B3 — shared media contract engine + per-lane config registry + strict video validator:
  "app/lib/media/listingMediaContract.ts",
  "app/lib/media/listingMediaConfigs.ts",
  "app/lib/media/externalVideoUrlValidation.ts",
  // Gate B3 — Servicios add-video path gated by the shared strict validator:
  "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx",
  // Gate B4 — BR parent/child: cap removal + skip surfacing + child card actions + deep link
  // (the BR application/preview/hydration files are already authorized above from Package A):
  "app/(site)/clasificados/bienes-raices/dashboard/BrNegocioListingInventoryActions.tsx",
  // Gate B5 — Autos child lifecycle: server sync + PATCH wiring + child edit action + deep link:
  "app/api/clasificados/autos/listings/[id]/route.ts",
  // Gate B2/B4/B5 — registry child routes + resolver delegation + generic-editor upgrade
  // (categoryRouteRegistry/editar page/dashboard section already authorized above):
  "app/lib/listingIdentity/dashboardActionResolver.ts",
  // Historical pin updated to the Package B truth (child card gained 2 prefetch-disabled links):
  "scripts/gate-i4-4c-br-inventory-final-prefetch-gap-selftest.ts",
  // New Package B proofs:
  "scripts/gate-pkgB-media-contract-selftest.ts",
  "scripts/gate-pkgB-media-adoption-selftest.ts",
  "scripts/gate-pkgB-parent-child-selftest.ts",

  // ═══ PACKAGE B CLOSURE — RUNTIME ADOPTION (owner-rejected the config-only B6 report) ═══
  // Real listingMediaContract.ts call sites added at each dedicated-editor lane's actual
  // save/validation boundary (additive gates alongside each lane's own proven validation —
  // no existing category logic rewritten; the locked publishLeonixRealEstateListingCore.ts
  // was deliberately NOT touched):
  "app/api/clasificados/servicios/publish/route.ts",
  "app/api/clasificados/restaurantes/publish/route.ts",
  "app/lib/clasificados/comida-local/comidaLocalPublishValidation.ts",
  "app/lib/clasificados/autos/autosListingPayloadPersistence.ts",
  "app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts",
  "app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts",
  // New runtime-adoption proof:
  "scripts/gate-pkgB-media-runtime-adoption-selftest.ts",
]);

/** Drop the current package's own authorized files from a changed-file list before running a
 * historical package-scoped diff assertion. */
export function excludeCurrentPackageFiles(changed: readonly string[]): string[] {
  return changed.filter((file) => !GLOBALIZATION_CURRENT_PACKAGE_FILES.has(file));
}
