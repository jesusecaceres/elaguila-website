/**
 * Globalization P2 — Gates 4/5 (B/D): Bienes Raíces Negocio dashboard preview/edit self-test.
 *
 * Two confirmed owner-QA defects, both in
 * app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx:
 *
 * 1. (No-repeat-payment) Dashboard "Vista previa" on an already-published, already-paid listing
 *    showed the full new-ad checkout widget (package price, confirmation checkboxes, "Continuar
 *    al pago seguro") because `checkpointConfig` never checked `listingBoundPreview`.
 * 2. (Existing-media validation / false 422) Editing a published listing could silently lose its
 *    correctly DB-hydrated existing photos to a stale, unrelated `applicationInstanceId`-scoped
 *    sessionStorage draft left over from an earlier, unrelated new-ad session — because neither
 *    the dashboard preview nor edit href ever sets `applicationInstanceId`, so the generic draft
 *    lookup falls back to whatever (possibly empty) draft already happens to be in the tab.
 *
 * Run from repo root:
 *   npx tsx scripts/gate-p2-bienes-negocio-preview-edit-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..");
const TARGET =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx";

function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

const src = readSource(TARGET).replace(/\r\n/g, "\n");

/* ================================================================================================
 * 1. No-repeat-payment: checkpointConfig's own memo must bail out to null when listingBoundPreview
 * is true — the fix must live at the single source, not just in a derived display flag, so every
 * consumer (the widget's own conditional render, showPaymentCheckpoint, etc.) agrees.
 * ============================================================================================== */
{
  const memoStart = src.indexOf("const checkpointConfig = useMemo(");
  assert.ok(memoStart > -1, "checkpointConfig useMemo must exist");
  const memoBodyEnd = src.indexOf("return {", memoStart);
  assert.ok(memoBodyEnd > -1, "checkpointConfig useMemo must have a return block");
  const guardClause = src.slice(memoStart, memoBodyEnd);
  assert.ok(
    /if\s*\(inventoryCtx\s*\|\|\s*!needsNegocioPayment\s*\|\|\s*listingBoundPreview\)\s*return null;/.test(guardClause),
    "checkpointConfig must return null whenever listingBoundPreview is true, not just when there's no payment requirement",
  );
  assert.ok(
    /\},\s*\[childInventoryCount,\s*inventoryCtx,\s*lang,\s*listingBoundPreview,\s*needsNegocioPayment\]\)/.test(src),
    "checkpointConfig's dependency array must include listingBoundPreview",
  );
}

/* ================================================================================================
 * 2. The checkout widget is still rendered from `checkpointConfig` truthiness (regression check —
 * confirms the fix works through the existing render, not a second, redundant guard).
 * ============================================================================================== */
assert.ok(src.includes("{checkpointConfig ? ("), "the checkout widget's render must still gate on checkpointConfig");
assert.ok(src.includes("<PublishCheckoutCheckpoint"), "the checkout component itself must remain, not be deleted");

/* ================================================================================================
 * 3. Existing-media validation / false-422 root cause: the listing-bound mount effect must not
 * let the generic, applicationInstanceId-scoped new-ad draft override the DB-hydrated existing-
 * listing workspace state.
 * ============================================================================================== */
{
  const effectStart = src.indexOf("if (listingBoundPreview && listingIdParam) {");
  assert.ok(effectStart > -1, "the listing-bound mount effect must exist");
  const closingReturnIdx = src.indexOf("\n      return;\n    }", effectStart);
  assert.ok(closingReturnIdx > effectStart, "the listing-bound branch's closing `return;` must be found");
  const effectBody = src.slice(effectStart, closingReturnIdx);
  assert.ok(
    !/void loadAgenteResPreviewDraftResolved\(/.test(effectBody),
    "the listing-bound branch must not call the generic new-ad draft lookup at all — it has no valid scoping to this specific listing",
  );
  assert.ok(
    /setData\(workspace\)/.test(effectBody),
    "the listing-bound branch must set state directly from the DB-hydrated workspace, not from an unrelated draft",
  );
  assert.ok(
    /loadBienesListingEditWorkspace\(\{\s*parentListingId:\s*listingIdParam,\s*hydratedFromDatabase:\s*result\.state,\s*\}\)\s*\?\?\s*result\.state/.test(effectBody),
    "the workspace fallback chain (local edit-in-progress -> real DB-hydrated state) must remain intact",
  );
}

/* ================================================================================================
 * 4. Regression: the generic new-ad draft path (non-listing-bound, i.e. a real brand-new
 * application) must still exist and still consult the draft — this fix must not remove that
 * flow's own, legitimate persistence.
 * ============================================================================================== */
assert.ok(
  /void loadAgenteResPreviewDraftResolved\(\{ applicationInstanceId \}\)\.then\(\(loaded\) => \{\s*if \(loaded\) setData\(loaded\);/.test(src),
  "the non-listing-bound (brand-new-ad) path must still hydrate from the generic draft — only the listing-bound path was fixed",
);

console.log("gate-p2-bienes-negocio-preview-edit-selftest: OK");
