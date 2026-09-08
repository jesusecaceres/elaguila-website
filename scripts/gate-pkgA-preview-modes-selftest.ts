/**
 * Globalization Package A Gate 4 — full-catalog preview-mode contract self-test.
 *
 * Pins the Gate 4 deliverables:
 *   1. EVERY PAID-CAPABLE PREVIEW CLIENT IS GUARDED — a listing-bound context
 *      (source=dashboard + listingId, or preview=listing) can never re-render a base-plan
 *      checkout. Newly guarded this gate: BR Privado (latent, P3-documented), Restaurantes
 *      (latent, P3-documented), Empleos premium AND quick (the live P3 defect's lane family —
 *      quick is the standard paid job post, corrected in the lane registry this gate).
 *      Previously guarded and untouched: BR Negocio (P2), Servicios/Rentas ×2 (P3), Autos ×2
 *      (own pinned state machines, gate-p3).
 *   2. BR NEGOCIO 3-WAY SPLIT — the reference lane now distinguishes edit-draft (unsaved
 *      edit workspace exists → "Guardar cambios") from published-readonly (no workspace →
 *      strictly read-only, only an "Editar anuncio" navigation), completing the split P2
 *      documented as the most direct next step.
 *   3. FREE PREVIEWS STAY CHECKOUT-FREE — the free-lane preview clients contain no checkout
 *      component at all; if one is ever added, this gate fires and forces contract adoption.
 *
 * Run from repo root: npx tsx scripts/gate-pkgA-preview-modes-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { resolvePreviewMode } from "../app/lib/listingIdentity/previewModeContract";
import { getCategoryLaneRecordByKey } from "../app/lib/listingIdentity/categoryRouteRegistry";

const REPO_ROOT = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(REPO_ROOT, p), "utf8");

/* 1 — Guarded paid previews (source-level: import + guard + conditional render). */
{
  const guarded = [
    "app/(site)/clasificados/bienes-raices/preview/privado/components/BienesRaicesPrivadoPreviewClient.tsx",
    "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx",
    "app/(site)/clasificados/empleos/premium-preview/EmpleoPremiumPreviewClient.tsx",
    "app/(site)/clasificados/empleos/quick-preview/EmpleoQuickPreviewClient.tsx",
  ];
  for (const file of guarded) {
    const src = read(file);
    assert.ok(
      src.includes("previewModeSuppressesBasePlanCheckout") && src.includes("resolvePreviewMode"),
      `${file} must resolve the shared preview-mode contract`,
    );
    assert.ok(
      src.includes('"preview") ?? "") === "listing"') || src.includes('get("preview") === "listing"'),
      `${file} must treat preview=listing as listing-bound`,
    );
    assert.ok(
      src.includes("suppressListingBoundCheckout") || src.includes("suppressCheckout"),
      `${file} must gate its checkout render on the resolved mode`,
    );
    assert.ok(src.includes("PublishCheckoutCheckpoint"), `${file} sanity: still renders the checkout in new-publish mode`);
  }
}

/* 2 — BR Negocio 3-way split. */
{
  const src = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
  );
  assert.ok(src.includes("readBienesListingEditWorkspaceMeta"), "the split must detect the edit workspace via the Gate 3 meta accessor");
  assert.ok(src.includes("hasUnsavedEditDraft: hasUnsavedEditWorkspace ?? undefined"), "the workspace check must feed the shared resolver's hasUnsavedEditDraft input");
  assert.ok(src.includes('sharedPreviewMode === "published-readonly"'), "the client must derive a distinct published-readonly state");
  assert.ok(
    src.includes("readOnlyBoundPreview ? (") && src.includes('lang === "es" ? "Editar anuncio" : "Edit listing"'),
    "published-readonly must render only the Editar navigation, never the save affordance",
  );
  assert.ok(src.includes("Vista previa · Solo lectura"), "the read-only header label must exist");
  // The P2 protections stay: checkout suppressed for BOTH bound modes.
  assert.ok(src.includes("Boolean(checkpointConfig) && !listingBoundPreview"), "the P2 no-repeat-payment guard must remain intact");
  // Resolver behavior backing the split:
  assert.equal(resolvePreviewMode({ listingBound: true, hasUnsavedEditDraft: false }), "published-readonly");
  assert.equal(resolvePreviewMode({ listingBound: true, hasUnsavedEditDraft: true }), "edit-draft");
  assert.equal(resolvePreviewMode({ listingBound: true }), "edit-draft");
  assert.equal(resolvePreviewMode({ listingBound: false }), "new-publish");
}

/* 3 — Free previews contain no checkout component (vacuous contract satisfaction, pinned). */
{
  const freePreviewFiles = [
    "app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx",
    "app/(site)/clasificados/empleos/feria-preview/EmpleoFeriaPreviewClient.tsx",
    "app/(site)/publicar/community/shared/preview/CommunityQuickPreviewClient.tsx",
    "app/(site)/publicar/mascotas-y-perdidos/quick/preview/MascotasPerdidosQuickPreviewClient.tsx",
    "app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx",
  ];
  for (const file of freePreviewFiles) {
    const src = read(file);
    assert.ok(
      !src.includes("PublishCheckoutCheckpoint"),
      `${file} is a free-lane preview and must not render a checkout — adding one requires adopting the shared preview-mode guard first`,
    );
  }
}

/* 4 — Lane-registry correction backing this gate: Empleos quick is the paid job-post lane. */
{
  assert.equal(getCategoryLaneRecordByKey("empleos_quick")?.paid, true);
  assert.equal(getCategoryLaneRecordByKey("empleos_premium")?.paid, true);
  assert.equal(getCategoryLaneRecordByKey("empleos_feria")?.paid, false);
}

console.log("gate-pkgA-preview-modes-selftest: all assertions passed.");
