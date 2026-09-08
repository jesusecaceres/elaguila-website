/**
 * Globalization P3 — Gate 1: shared preview-mode contract self-test.
 *
 * Proves: (1) the shared contract (app/lib/listingIdentity/previewModeContract.ts) resolves the
 * three documented modes correctly and is exported from the barrel; (2) it is actually imported
 * and used — not just created and left unwired — by every lane confirmed to have a real,
 * live-reachable, listing-bound preview page: Bienes Raíces Negocio (the reference
 * implementation), Servicios, Rentas Negocio, Rentas Privado; (3) the two lanes with a real but
 * more nuanced pre-existing state machine (Autos Negocios, Autos Privado) were independently
 * verified conformant rather than force-rewired, and that verification is pinned here so a
 * regression is caught if their gating logic ever changes; (4) the one confirmed live payment
 * defect this gate fixed — Empleos dashboard "Vista previa" no longer opens the stale/checkout
 * draft preview for an existing published listing — is real and in place.
 *
 * Run from repo root:
 *   npx tsx scripts/gate-p3-preview-mode-contract-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  previewModeIsListingBound,
  previewModeSuppressesBasePlanCheckout,
  resolvePreviewMode,
} from "../app/lib/listingIdentity/previewModeContract";
import { resolvePreviewMode as resolvePreviewModeViaBarrel } from "../app/lib/listingIdentity";

const REPO_ROOT = path.resolve(__dirname, "..");
function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

/* ================================================================================================
 * 1. The resolver itself is correct for all three modes, and is exported from the barrel.
 * ============================================================================================== */
assert.equal(resolvePreviewMode({ listingBound: false }), "new-publish");
assert.equal(resolvePreviewMode({ listingBound: true }), "edit-draft");
assert.equal(resolvePreviewMode({ listingBound: true, hasUnsavedEditDraft: true }), "edit-draft");
assert.equal(resolvePreviewMode({ listingBound: true, hasUnsavedEditDraft: false }), "published-readonly");
assert.equal(resolvePreviewModeViaBarrel({ listingBound: false }), "new-publish", "must also be reachable via the app/lib/listingIdentity barrel export");

assert.equal(previewModeIsListingBound("new-publish"), false);
assert.equal(previewModeIsListingBound("edit-draft"), true);
assert.equal(previewModeIsListingBound("published-readonly"), true);

assert.equal(previewModeSuppressesBasePlanCheckout("new-publish"), false, "new-publish must retain checkout");
assert.equal(previewModeSuppressesBasePlanCheckout("edit-draft"), true, "edit-draft must never show base-plan checkout again");
assert.equal(previewModeSuppressesBasePlanCheckout("published-readonly"), true, "published-readonly must never show base-plan checkout");

/* ================================================================================================
 * 2. Lanes formally wired to the shared contract actually import and call it.
 * ============================================================================================== */
const WIRED_FILES = [
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
  "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx",
  "app/(site)/clasificados/rentas/preview/negocio/components/RentasNegocioPreviewClient.tsx",
  "app/(site)/clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx",
];
for (const rel of WIRED_FILES) {
  const src = readSource(rel);
  assert.ok(
    /from\s+"@\/app\/lib\/listingIdentity"/.test(src),
    `${rel} must import from the shared app/lib/listingIdentity barrel`,
  );
  assert.ok(src.includes("resolvePreviewMode("), `${rel} must call resolvePreviewMode(...)`);
}

/* ================================================================================================
 * 3. Bienes Raíces Negocio (the reference lane) still suppresses the checkout widget when
 * listing-bound — the exact defect this contract formalizes the fix for — and now derives that
 * suppression from the shared, named preview mode rather than an unnamed local boolean alone.
 * ============================================================================================== */
{
  const src = readSource(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
  );
  assert.ok(src.includes("listingBoundPreview = previewModeIsListingBound(sharedPreviewMode)"));
  assert.ok(
    /if \(inventoryCtx \|\| !needsNegocioPayment \|\| listingBoundPreview\) return null;/.test(src),
    "checkpointConfig must still return null whenever listing-bound",
  );
}

/* ================================================================================================
 * 4. Servicios: same shape, same guarantee.
 * ============================================================================================== */
{
  const src = readSource("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx");
  assert.ok(src.includes("listingBoundPreview = previewModeIsListingBound(sharedPreviewMode)"));
  assert.ok(
    /showFinalCheckout =\s*\n?\s*!listingBoundPreview/.test(src),
    "showFinalCheckout must still exclude listing-bound preview",
  );
}

/* ================================================================================================
 * 5. Rentas Negocio/Privado: the checkout widget render is gated on the shared, named mode (in
 * addition to the pre-existing editContext null-check, preserved for TypeScript narrowing).
 * ============================================================================================== */
for (const rel of [
  "app/(site)/clasificados/rentas/preview/negocio/components/RentasNegocioPreviewClient.tsx",
  "app/(site)/clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx",
]) {
  const src = readSource(rel);
  assert.ok(src.includes("isListingBoundPreview = previewModeIsListingBound(previewMode)"));
  assert.ok(
    src.includes("{isListingBoundPreview && editContext ? ("),
    `${rel} must gate its edit-workspace-vs-checkout branch on the shared mode`,
  );
}

/* ================================================================================================
 * 6. Autos Negocios / Autos Privado — verified conformant by direct inspection, deliberately NOT
 * rewired onto the shared resolver (each has a more nuanced, already-correct multi-state machine
 * that predates this gate; forcing a 3-mode reshape risked regressing the pending-payment-resume
 * case neither shared contract models). Pin the exact guard expressions so a future edit to
 * either file that weakens this guarantee fails this test instead of shipping silently.
 * ============================================================================================== */
{
  const src = readSource("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  assert.ok(
    src.includes('mode: fetched.status === "active" ? "canonical-active" : "draft"'),
    "an already-active canonical dealer listing must resolve to the no-checkout mode",
  );
}
{
  const src = readSource("app/(site)/clasificados/autos/privado/preview/AutosPrivadoPreviewClient.tsx");
  assert.ok(
    src.includes('const showSellerCheckout = mode === "draft";'),
    "checkout must remain excluded from dashboard_edit/mock/empty modes",
  );
}

/* ================================================================================================
 * 7. Empleos — the one confirmed LIVE (not merely latent) payment/content-truth defect this gate
 * fixed: dashboard "Vista previa" for an existing published job no longer opens the stale/empty
 * sessionStorage-draft checkout preview (which had no listingId concept at all and could show a
 * stranded checkout widget for an already-paid listing); it now opens the listing's own real
 * public page, matching the same safe pattern already used for Restaurantes/BR Privado.
 * ============================================================================================== */
{
  const src = readSource("app/(site)/dashboard/lib/dashboardInventory.ts");
  assert.ok(
    !src.includes("function empleosPreviewHrefForLane"),
    "the removed dead helper must not be reintroduced",
  );
  assert.ok(
    /previewHref:\s*appendLangToPath\(`\/clasificados\/empleos\/\$\{encodeURIComponent\(row\.slug\)\}`, L\)/.test(src),
    "Empleos previewHref must resolve to the real public listing page, not the draft-based checkout preview",
  );
}

console.log("gate-p3-preview-mode-contract-selftest: OK");
