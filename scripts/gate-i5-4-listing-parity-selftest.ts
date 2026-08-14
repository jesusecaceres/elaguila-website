/**
 * Gate I.5.4 — self-test for the Bienes Raíces cover-photo-order parity repair.
 *
 * Confirmed bug (evidence in the Gate I.5.4 report): BR Privado and BR Negocio publish
 * builders sent `state.media.photoDataUrls`/`photoUrls` to the shared publish core in raw
 * upload order, ignoring the seller's chosen `primaryImageIndex` — while the published detail
 * page and results card both assume "first image in the array = cover photo." Rentas (same
 * file) already had a proven fix for the identical problem via `orderedRentasGallerySourcesForPublish`;
 * this gate applies the same helper to both BR builders rather than inventing new logic.
 *
 * This test proves two things: (1) the reordering helper itself has the exact contract both BR
 * builders now depend on (unit-level, no fixtures needed), and (2) both BR builders' source now
 * actually call it with the correct field names, instead of the old raw-array literal — a
 * source-level check, since constructing full valid `BienesRaicesPrivadoFormState`/
 * `BienesRaicesNegocioFormState` fixtures is out of proportion to what this narrow fix needs to
 * prove and risks a fixture bug masquerading as a passing test.
 *
 * No network, no React, no Supabase. Run from repo root:
 *   npx tsx scripts/gate-i5-4-listing-parity-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { orderedRentasGallerySourcesForPublish } from "../app/(site)/clasificados/rentas/shared/rentasPublishFormHelpers";

const REPO_ROOT = path.resolve(__dirname, "..");
const TARGET_FILE = "app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts";

function readSource(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

async function main() {
  /* ---------------------------------------------------------------------------------------- *
   * 1 — the reordering helper's contract: cover photo moves to index 0, everything else keeps
   * its relative order, empty/whitespace entries are dropped, out-of-range index clamps safely.
   * ---------------------------------------------------------------------------------------- */
  {
    assert.deepEqual(
      orderedRentasGallerySourcesForPublish(["a", "b", "c", "d"], 2),
      ["c", "d", "a", "b"],
      "cover photo (index 2) must move to the front; the rest keep relative order",
    );
    assert.deepEqual(
      orderedRentasGallerySourcesForPublish(["a", "b", "c"], 0),
      ["a", "b", "c"],
      "cover already first — no reordering needed",
    );
    assert.deepEqual(
      orderedRentasGallerySourcesForPublish(["a", "b", "c"], 99),
      ["c", "a", "b"],
      "out-of-range index clamps to the last real photo rather than throwing or dropping data",
    );
    assert.deepEqual(orderedRentasGallerySourcesForPublish([], 0), [], "empty gallery stays empty");
    assert.deepEqual(
      orderedRentasGallerySourcesForPublish(["  ", "a", ""], 0),
      ["a"],
      "blank/whitespace-only entries are dropped, not treated as real photos",
    );
  }

  /* ---------------------------------------------------------------------------------------- *
   * 2 — BR Privado builder now calls the reordering helper on the correct field
   * (state.media.photoDataUrls + state.media.primaryImageIndex), not the old raw literal.
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource(TARGET_FILE);
    assert.ok(
      src.includes(
        "imageSources: orderedRentasGallerySourcesForPublish(state.media.photoDataUrls, state.media.primaryImageIndex),",
      ),
      "BR Privado builder must reorder photoDataUrls by primaryImageIndex before publish",
    );
    assert.ok(
      !src.includes("imageSources: [...state.media.photoDataUrls],"),
      "the old unordered BR Privado literal must be gone",
    );
  }

  /* ---------------------------------------------------------------------------------------- *
   * 3 — BR Negocio builder now calls the reordering helper on the correct field
   * (state.media.photoUrls + state.media.primaryImageIndex) — this builder is also the live
   * agente-individual (Negocio parent) path's downstream target, so this one change covers both
   * the Negocio-form entry and the actually-live agente-individual entry, plus inventory
   * children, which all funnel through it.
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource(TARGET_FILE);
    assert.ok(
      src.includes(
        "imageSources: orderedRentasGallerySourcesForPublish(state.media.photoUrls, state.media.primaryImageIndex),",
      ),
      "BR Negocio builder must reorder photoUrls by primaryImageIndex before publish",
    );
    assert.ok(
      !src.includes("imageSources: [...state.media.photoUrls],"),
      "the old unordered BR Negocio literal must be gone",
    );
  }

  /* ---------------------------------------------------------------------------------------- *
   * 4 — no unrelated builder was touched: Autos, Servicios, Empleos, Restaurantes, Comida
   * Local publish paths are untouched by this gate (this file only ever contained BR/Rentas
   * real-estate builders to begin with, but assert the Rentas builders — which were already
   * correct — are still byte-identical in their own reordering call, proving this gate didn't
   * accidentally alter the pattern it borrowed from).
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource(TARGET_FILE);
    const photoDataUrlsCall = "orderedRentasGallerySourcesForPublish(state.media.photoDataUrls, state.media.primaryImageIndex)";
    const occurrences = src.split(photoDataUrlsCall).length - 1;
    // Rentas Privado + Rentas Negocio (both pre-existing, both use `photoDataUrls`) + BR Privado
    // (new, this gate). BR Negocio uses the differently-named `photoUrls` field, asserted above.
    assert.equal(occurrences, 3, "expected Rentas Privado + Rentas Negocio (pre-existing) + BR Privado (new) to share this call shape");
  }

  console.log(`gate-i5-4-listing-parity-selftest: OK`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
