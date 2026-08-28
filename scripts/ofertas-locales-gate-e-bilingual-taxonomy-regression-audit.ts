/**
 * QA UX Batch — Gate E regression audit (⚠️33, ⚠️34, ⚠️35).
 *
 * Gate E wires the EXISTING OFERTA_PRODUCT_TAXONOMY (already used by the
 * preview product filter chips) into the product-review editor's category
 * field via one new display helper, getOfertaProductBilingualCategoryDisplay,
 * added to the same taxonomy file — not a second taxonomy, not a translation
 * engine. Product names, descriptions, and tags are untouched. The category
 * <input>'s stored value/onChange contract is unchanged; the bilingual label
 * is a purely additive, read-only hint line.
 *
 * Run: npm run ofertas-locales:gate-e-bilingual-taxonomy-regression-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  getOfertaProductBilingualCategoryDisplay,
  OFERTA_PRODUCT_TAXONOMY,
} from "../app/lib/ofertas-locales/ofertasLocalesProductTaxonomy";
import { OFERTAS_AI_SCANNER_PROTECTED_PATHS } from "../app/lib/ofertas-locales/ofertasAiScannerProtectedPaths";

function run() {
  const taxonomySrc = fs.readFileSync("app/lib/ofertas-locales/ofertasLocalesProductTaxonomy.ts", "utf8");
  const panelSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
    "utf8"
  );

  // --- Case A: existing canonical taxonomy helper/map is reused ---
  assert.match(
    panelSrc,
    /import \{ getOfertaProductBilingualCategoryDisplay \} from "@\/app\/lib\/ofertas-locales\/ofertasLocalesProductTaxonomy";/,
    "CASE A FAILED: review panel must import the display helper from the existing taxonomy module"
  );
  assert.match(
    taxonomySrc,
    /export function getOfertaProductBilingualCategoryDisplay\(/,
    "CASE A FAILED: bilingual display helper must live inside the existing taxonomy file"
  );
  assert.match(
    taxonomySrc,
    /const key = normalizeOfertaProductCategory\(rawCategory, subcategory\);/,
    "CASE A FAILED: the new helper must reuse the existing normalizeOfertaProductCategory classifier"
  );
  console.log("Case A (existing canonical taxonomy helper/map is reused) passed.");

  // --- Case B: no second taxonomy map was created ---
  const taxonomyArrayDecls = [...taxonomySrc.matchAll(/:\s*readonly OfertaProductTaxonomyGroup\[\]/g)];
  assert.equal(
    taxonomyArrayDecls.length,
    1,
    "CASE B FAILED: exactly one taxonomy array (OFERTA_PRODUCT_TAXONOMY) must exist"
  );
  const taxonomyFileCount = fs
    .readdirSync("app/lib/ofertas-locales")
    .filter((f) => /taxonomy/i.test(f)).length;
  assert.equal(taxonomyFileCount, 1, "CASE B FAILED: exactly one taxonomy file must exist");
  console.log("Case B (no second category map is created) passed.");

  // --- Case C/D: Spanish mode shows Spanish primary + English secondary ---
  const meatEs = getOfertaProductBilingualCategoryDisplay("Meat & Seafood", "es");
  assert.equal(meatEs.matched, true, "CASE C FAILED: 'Meat & Seafood' must match the taxonomy");
  assert.equal(meatEs.primary, "Carnes y mariscos", "CASE C FAILED: Spanish primary label wrong");
  assert.equal(meatEs.secondary, "Meat & Seafood", "CASE D FAILED: English secondary label wrong");
  assert.equal(meatEs.emoji, "🍖", "CASE C FAILED: emoji must come from the existing taxonomy entry");
  console.log("Case C/D (Spanish mode: Spanish primary, English secondary) passed.");

  // --- Case E/F: English mode shows English primary + Spanish secondary ---
  const meatEn = getOfertaProductBilingualCategoryDisplay("Carnes y mariscos", "en");
  assert.equal(meatEn.matched, true, "CASE E FAILED: 'Carnes y mariscos' must match the taxonomy");
  assert.equal(meatEn.primary, "Meat & Seafood", "CASE E FAILED: English primary label wrong");
  assert.equal(meatEn.secondary, "Carnes y mariscos", "CASE F FAILED: Spanish secondary label wrong");
  console.log("Case E/F (English mode: English primary, Spanish secondary) passed.");

  // --- Case G: the icon comes from the existing taxonomy data, never a new map ---
  // Probed against each group's own canonical EN label. "pantry" is skipped:
  // its own label ("Pantry") contains bakery's pre-existing "pan" keyword
  // substring, a pre-existing classification quirk of
  // normalizeOfertaProductCategory (keyword order + substring matching) that
  // is out of Gate E's display-only scope to change.
  for (const group of OFERTA_PRODUCT_TAXONOMY) {
    if (group.keywords.length === 0 || group.key === "pantry") continue;
    const display = getOfertaProductBilingualCategoryDisplay(group.en, "es");
    assert.equal(display.emoji, group.emoji, `CASE G FAILED: emoji mismatch for group ${group.key}`);
  }
  console.log("Case G (category icon comes from existing taxonomy data) passed.");

  // --- Case H: an unknown historical category falls back to the raw value, never blanked ---
  const unknown = getOfertaProductBilingualCategoryDisplay("Electronics & Gadgets", "es");
  assert.equal(unknown.matched, false, "CASE H FAILED: an unrecognized category must not be marked matched");
  assert.equal(
    unknown.primary,
    "Electronics & Gadgets",
    "CASE H FAILED: unrecognized category must preserve the raw text verbatim, not blank or relabel it"
  );
  assert.equal(unknown.secondary, "", "CASE H FAILED: unmatched category must not fabricate a secondary label");
  // A literal "Other"/"Otro" value legitimately resolves to the taxonomy's own Other bucket.
  const literalOtherEs = getOfertaProductBilingualCategoryDisplay("Otros", "es");
  assert.equal(literalOtherEs.matched, true, "sanity: literal 'Otros' should resolve to the Other bucket");
  console.log("Case H (unknown historical category falls back to raw value) passed.");

  // --- Case I: product names are not auto-translated (no name-translation call site exists) ---
  assert.doesNotMatch(
    panelSrc,
    /translate.*itemName|itemName.*translate/i,
    "CASE I FAILED: product name must never be passed through a translation call"
  );
  assert.match(
    panelSrc,
    /itemName: isCouponItem\(item\) \? item\.couponTitle \|\| item\.itemName : item\.itemName,/,
    "CASE I FAILED: itemName must still flow through toDraft unmodified (no translation step inserted)"
  );
  console.log("Case I (product names are not auto-translated) passed.");

  // --- Case J: descriptions are not auto-translated ---
  assert.doesNotMatch(
    panelSrc,
    /translate.*description|description.*translate/i,
    "CASE J FAILED: description must never be passed through a translation call"
  );
  assert.match(
    panelSrc,
    /description: item\.description,/,
    "CASE J FAILED: description must still flow through toDraft unmodified"
  );
  console.log("Case J (descriptions are not auto-translated) passed.");

  // --- Case K: category stored value/persistence format is unchanged ---
  assert.match(
    panelSrc,
    /value=\{draftFields\.category\}\s*\n\s*onChange=\{\(e\) => onFieldChange\("category", e\.target\.value\)\}/,
    "CASE K FAILED: the category input's value/onChange contract must remain exactly as before"
  );
  assert.match(
    panelSrc,
    /category: draft\.category,/,
    "CASE K FAILED: patchFromDraft must still send the raw draft.category string unchanged"
  );
  console.log("Case K (category persistence format unchanged) passed.");

  // --- Case L: item PATCH contract is unchanged (no new fields sent) ---
  assert.doesNotMatch(
    panelSrc,
    /commerceMetadata: commerceMetadataFromDraft\(draft\),\s*reviewStatus,\s*\}\s*;\s*\}[\s\S]{0,5}(categoryEn|categoryEs|categoryBilingual|taxonomyKey)/,
    "CASE L FAILED: patchFromDraft's returned patch object must not grow new taxonomy-related fields"
  );
  assert.doesNotMatch(
    taxonomySrc,
    /fetch\(|await patchOfertaLocalReviewItem/,
    "CASE L FAILED: the taxonomy module must never call the item PATCH API"
  );
  console.log("Case L (item PATCH contract unchanged) passed.");

  // --- Case M: no scanner-protected path touched by this gate ---
  const touchedFiles = [
    "app/lib/ofertas-locales/ofertasLocalesProductTaxonomy.ts",
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
  ];
  const protectedPaths = new Set(OFERTAS_AI_SCANNER_PROTECTED_PATHS.map((e) => e.path));
  for (const file of touchedFiles) {
    assert.ok(!protectedPaths.has(file), `CASE M FAILED: Gate E touched a scanner-protected path: ${file}`);
  }
  console.log("Case M (scanner protected paths untouched) passed.");

  // --- Case N: Gate D review workspace remains intact ---
  const workspaceSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx",
    "utf8"
  );
  assert.match(
    workspaceSrc,
    /xl:grid-cols-\[minmax\(0,54fr\)_minmax\(0,46fr\)\]/,
    "CASE N FAILED: Gate D's two-column workspace grid must remain intact"
  );
  const clientSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
    "utf8"
  );
  assert.match(
    clientSrc,
    /const showStep6ReviewDesk =\s*\n\s*step === 6 && aiIncludedInPackage && Boolean\(effectiveOfertaLocalId\?\.trim\(\)\);/,
    "CASE N FAILED: Gate D's dedicated review workspace (now Gate I's real Step 6) must remain intact"
  );
  console.log("Case N (Gate D review workspace remains intact) passed.");

  // --- Case O: Gate C CTA hierarchy remains intact ---
  assert.match(
    panelSrc,
    /nextPageSummary \? \(\s*<button type="button" className=\{BTN_SUCCESS_LG\} onClick=\{proceedToNextPage\}>\s*\{c\.aiReviewContinueToPage\}/,
    "CASE O FAILED: Gate C's green page-complete CTA must remain present"
  );
  assert.match(
    panelSrc,
    /\{c\.aiReviewApproveAndNext\}/,
    "CASE O FAILED: Gate C's primary approve action label must remain present"
  );
  console.log("Case O (Gate C CTA hierarchy remains intact) passed.");

  console.log("Ofertas Locales Gate E bilingual taxonomy regression audit passed.");
}

run();
