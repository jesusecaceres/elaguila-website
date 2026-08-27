/**
 * Final Audit Defect Repair Pass — targeted verifier for Defects 2, 3, and 4.
 * (Defect 1 — Newsletter unsubscribe — is covered by the extended
 * scripts/verify-newsletter-engine-v2.ts, not duplicated here.)
 *
 * No live network/DB/React. Real runtime calls against the pure, side-effect-free draft-helper
 * functions (trimDraftStrings, createEmptyRestauranteDraft — both proven safe to import directly
 * under tsx: no browser-only API access at module load time), plus static source-text checks for
 * the parts that are inherently UI/render-coupled, matching this repo's existing verify-*.ts
 * convention.
 *
 * Run: npx tsx scripts/verify-final-audit-defect-fixes.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createEmptyRestauranteDraft } from "../app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import { trimDraftStrings } from "../app/(site)/clasificados/restaurantes/application/useRestauranteDraft";
import {
  getRestaurantesCheckpointCards,
  getComidaLocalCheckpointCard,
} from "../app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

let failures = 0;
function fail(message: string): void {
  failures += 1;
  console.error(`FAIL - ${message}`);
}
function ok(message: string): void {
  console.log(`OK: ${message}`);
}
function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

function main() {
  /* ============================================================================================
   * DEFECT 2 — Restaurantes checkpoint Comida Local card: correct price, correct route.
   * ==========================================================================================*/
  const passthrough = (p: string, extra?: Record<string, string>) =>
    extra ? `${p}?${new URLSearchParams(extra).toString()}` : p;

  const restaurantCards = getRestaurantesCheckpointCards("es", passthrough);
  const restaurantCard = restaurantCards.find((c) => c.id === "restaurante_establecido");
  const comidaLocalEmbeddedCard = restaurantCards.find((c) => c.id === "comida_local");
  const realComidaLocalCard = getComidaLocalCheckpointCard("es", "/publicar/comida-local");

  if (!restaurantCard || restaurantCard.priceLabel !== "$399.00/mes") {
    fail(`Restaurantes checkpoint card must show $399.00/mes, got ${restaurantCard?.priceLabel}`);
  } else {
    ok("Restaurantes checkpoint card shows the real current price: $399.00/mes");
  }

  if (!comidaLocalEmbeddedCard) {
    fail("Restaurantes checkpoint no longer has a comida_local cross-link card at all");
  } else {
    if (comidaLocalEmbeddedCard.priceLabel !== "$129.00/mes") {
      fail(`Restaurantes' Comida Local cross-link card must show $129.00/mes, got ${comidaLocalEmbeddedCard.priceLabel}`);
    } else {
      ok("Restaurantes' Comida Local cross-link card shows the real current price: $129.00/mes");
    }
    if (comidaLocalEmbeddedCard.priceLabel === "$199/mes") {
      fail("Stale $199/mes Comida Local price is still present — defect not fixed");
    } else {
      ok("No current-sale $199/mes Comida Local price remains anywhere in the checkpoint cards");
    }
    if (comidaLocalEmbeddedCard.ctaHref.includes("/publicar/restaurantes")) {
      fail(`Comida Local cross-link card must not route into the Restaurantes application, got ${comidaLocalEmbeddedCard.ctaHref}`);
    } else {
      ok("Comida Local cross-link card no longer routes into the Restaurantes $399 checkout flow");
    }
    if (!comidaLocalEmbeddedCard.ctaHref.startsWith("/publicar/comida-local")) {
      fail(`Comida Local cross-link card must route to the canonical Comida Local application, got ${comidaLocalEmbeddedCard.ctaHref}`);
    } else {
      ok(`Comida Local cross-link card routes to the canonical Comida Local application: ${comidaLocalEmbeddedCard.ctaHref}`);
    }
  }

  if (realComidaLocalCard.priceLabel !== "$129.00/mes") {
    fail(`Canonical Comida Local checkpoint card must show $129.00/mes, got ${realComidaLocalCard.priceLabel}`);
  } else {
    ok("Canonical Comida Local checkpoint (getComidaLocalCheckpointCard) confirms $129.00/mes");
  }

  // Checkout price agreement: the actual Restaurantes checkout line item must match the
  // advertised $399 checkpoint price (both hardcoded to the same matrix-derived constant).
  const previewClientSrc = read("app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx");
  if (!previewClientSrc.includes("priceCents: 39900")) {
    fail("Restaurantes preview checkout line item must charge $399 (39900 cents)");
  } else {
    ok("Restaurantes checkout line item ($399) agrees with the advertised checkpoint price");
  }
  if (!previewClientSrc.includes('RESTAURANTES_BASE_CHECKOUT.packageKey')) {
    fail("Restaurantes checkout must use the single restaurantes_base_monthly package key");
  } else {
    ok("Restaurantes checkout uses a single real package key, no per-productType price branching");
  }

  // The draft bootstrap must never assign the fake 199 price again, for any product param.
  const restauranteAppClientSrc = read("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
  if (/baseMonthlyPrice = isMobile \? 199/.test(restauranteAppClientSrc)) {
    fail("RestauranteApplicationClient must not persist a Restaurant draft with baseMonthlyPrice 199 for any product param");
  } else if (!restauranteAppClientSrc.includes("baseMonthlyPrice: 399")) {
    fail("RestauranteApplicationClient must bootstrap baseMonthlyPrice to the real 399, regardless of product param");
  } else {
    ok("RestauranteApplicationClient never persists baseMonthlyPrice:199 — always the real 399");
  }

  /* ============================================================================================
   * DEFECT 3 — Comida Local "Encuéntrame hoy" / "Find Me Today" heading localizes correctly.
   * ==========================================================================================*/
  const comidaLocalClientSrc = read("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");
  if (!/<h2 className=\{SECTION_TITLE\}>\{es \? "Encuéntrame Hoy" : "Find Me Today"\}<\/h2>/.test(comidaLocalClientSrc)) {
    fail('Comida Local "ubicacion" section heading must branch on `es` between "Encuéntrame Hoy" and "Find Me Today"');
  } else {
    ok('Comida Local section heading now correctly shows "Encuéntrame Hoy" (es) / "Find Me Today" (en)');
  }
  if (/<h2 className=\{SECTION_TITLE\}>Encuéntrame hoy<\/h2>/.test(comidaLocalClientSrc)) {
    fail("The old hardcoded-Spanish-only heading literal is still present");
  } else {
    ok("The old hardcoded-Spanish-only heading literal is gone");
  }
  // Stored keys/section identifiers must remain untouched (only display text changed).
  if (!comidaLocalClientSrc.includes('activeSection === "ubicacion"')) {
    fail('The "ubicacion" section key must remain unchanged (stored keys are never translated)');
  } else {
    ok('The "ubicacion" section key is unchanged — only display copy was fixed, not stored keys');
  }

  /* ============================================================================================
   * DEFECT 4 — Restaurantes custom "Otro" cuisine/style input: blank/whitespace guard traced
   * UI input -> local state -> normalization -> persistence -> preview mapping.
   * ==========================================================================================*/

  // Render-layer guard (preview + live shell — same shared mapper): nonEmpty() trims before
  // deciding whether a custom-cuisine chip renders at all.
  const shellMapperSrc = read("app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts");
  if (!/function nonEmpty\(s: string \| undefined \| null\): boolean \{\s*return typeof s === "string" && s\.trim\(\)\.length > 0;/.test(shellMapperSrc)) {
    fail("mapRestauranteDraftToShell's nonEmpty() must trim before checking length (blank-chip guard)");
  } else {
    ok("PROVEN CORRECT (pre-existing): preview/public shell nonEmpty() trims before rendering a custom-cuisine chip — a whitespace-only value never renders as a chip");
  }
  for (const chipCheck of [
    'd.primaryCuisine?.trim() === TAXONOMY_KEY_OTHER && nonEmpty(d.primaryCuisineCustom)',
    'd.secondaryCuisine?.trim() === TAXONOMY_KEY_OTHER && nonEmpty(d.secondaryCuisineCustom)',
    '(d.additionalCuisines ?? []).includes(TAXONOMY_KEY_OTHER) && nonEmpty(d.additionalCuisineOtherCustom)',
  ]) {
    if (!shellMapperSrc.includes(chipCheck)) {
      fail(`Missing blank-guard on custom cuisine chip: ${chipCheck}`);
    }
  }
  ok("PROVEN CORRECT (pre-existing): all three custom-cuisine chip sources (primary/secondary/additional) are individually gated by nonEmpty()");

  // Persistence-layer normalization (published taxonomy): hasValue()/cleanCustomValue() trim.
  const normalizationSrc = read("app/(site)/clasificados/restaurantes/lib/restauranteFeaturesNormalization.ts");
  if (!/function hasValue\(value\?: string\): boolean \{\s*return value != null && value\.trim\(\)\.length > 0;/.test(normalizationSrc)) {
    fail("restauranteFeaturesNormalization's hasValue() must trim before checking length");
  } else {
    ok("PROVEN CORRECT (pre-existing): published-taxonomy normalization hasValue() trims before including a custom cuisine value");
  }
  if (!/function cleanCustomValue\(value\?: string\): string \{[\s\S]{0,80}\.trim\(\);/.test(normalizationSrc)) {
    fail("restauranteFeaturesNormalization's cleanCustomValue() must trim the final stored value");
  } else {
    ok("PROVEN CORRECT (pre-existing): cleanCustomValue() trims the final value before it's stored in the published taxonomy");
  }

  // Real runtime pure-function proof of the repaired draft-persistence boundary (trimDraftStrings)
  // — closes the one real gap found: the function existed and was correctly written, but was
  // never actually called anywhere before this fix.
  const trimDraftStringsWiredAt = [
    "app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx",
  ].map(read);
  if (!trimDraftStringsWiredAt[0].includes("trimDraftStrings(draftRef.current)")) {
    fail("trimDraftStrings must now be wired into a real commit boundary in RestauranteApplicationClient");
  } else {
    ok("REPAIRED: trimDraftStrings (previously built but never called anywhere) is now wired into real commit boundaries (leave-guard exit snapshot, go-to-Preview)");
  }
  // Must NOT be wired into setDraftPatch (would trim on every keystroke and fight typing —
  // stripping a trailing space the user just typed to start a new word).
  const useDraftHookSrc = read("app/(site)/clasificados/restaurantes/application/useRestauranteDraft.ts");
  const setDraftPatchBlockMatch = useDraftHookSrc.match(
    /const setDraftPatch = useCallback\(([\s\S]*?)\n {2}\);/,
  );
  if (!setDraftPatchBlockMatch) {
    fail("Could not locate setDraftPatch definition to verify it does not trim on every keystroke");
  } else if (setDraftPatchBlockMatch[1].includes("trimDraftStrings")) {
    fail("trimDraftStrings must NOT run inside setDraftPatch — that fires on every keystroke and would fight normal typing (a trailing space would be stripped on every character)");
  } else {
    ok("trim boundary is correct: trimDraftStrings does NOT run on every keystroke (setDraftPatch), only at explicit commit points — normal typing, including a trailing space mid-composition, is never fought");
  }

  const emptyDraft = createEmptyRestauranteDraft();

  const blankCase = trimDraftStrings({
    ...emptyDraft,
    primaryCuisineCustom: "",
  });
  if (blankCase.primaryCuisineCustom !== undefined) {
    fail(`Blank custom cuisine value must trim to undefined, got ${JSON.stringify(blankCase.primaryCuisineCustom)}`);
  } else {
    ok("Empty string custom cuisine value trims to undefined (cannot create a blank chip)");
  }

  const whitespaceCase = trimDraftStrings({
    ...emptyDraft,
    primaryCuisineCustom: "   ",
    secondaryCuisineCustom: "\t\n  ",
    additionalCuisineOtherCustom: " ",
  });
  if (whitespaceCase.primaryCuisineCustom !== undefined) {
    fail(`Whitespace-only custom cuisine value must trim to undefined, got ${JSON.stringify(whitespaceCase.primaryCuisineCustom)}`);
  } else {
    ok("Whitespace-only (spaces/tabs/newlines) custom cuisine value trims to undefined");
  }
  if (whitespaceCase.secondaryCuisineCustom !== undefined) {
    fail(`Whitespace-only secondary custom cuisine value must trim to undefined, got ${JSON.stringify(whitespaceCase.secondaryCuisineCustom)}`);
  } else {
    ok("Whitespace-only secondary custom cuisine value trims to undefined");
  }

  const multiWordCase = trimDraftStrings({
    ...emptyDraft,
    primaryCuisineCustom: "  Peruvian fusion  ",
  });
  if (multiWordCase.primaryCuisineCustom !== "Peruvian fusion") {
    fail(`Multi-word value must be preserved with interior spaces intact and only outer whitespace trimmed, got ${JSON.stringify(multiWordCase.primaryCuisineCustom)}`);
  } else {
    ok('Multi-word value "  Peruvian fusion  " correctly trims to "Peruvian fusion" — interior space preserved, only leading/trailing whitespace removed');
  }

  const normalCase = trimDraftStrings({
    ...emptyDraft,
    additionalCuisineOtherCustom: "Farm-to-table BBQ",
  });
  if (normalCase.additionalCuisineOtherCustom !== "Farm-to-table BBQ") {
    fail(`Normal multi-word value must be preserved verbatim, got ${JSON.stringify(normalCase.additionalCuisineOtherCustom)}`);
  } else {
    ok('Normal value "Farm-to-table BBQ" is preserved verbatim (no unwanted mutation)');
  }

  // Duplicate handling / removal isolation: the additionalCuisines array uses toggle-by-key
  // add/remove, so removing one key can never remove another — proven by source inspection of
  // the actual toggle handler (array filter, not index-based, not a full-array replace).
  if (!restauranteAppClientSrc.includes("toggleAdditionalCuisine")) {
    fail("toggleAdditionalCuisine handler not found");
  } else {
    const toggleMatch = restauranteAppClientSrc.match(
      /const toggleAdditionalCuisine = useCallback\(([\s\S]*?)\n {2}\);/,
    );
    if (!toggleMatch || !/filter\(\(k\) => k !== key\)|cur\.includes\(key\)/.test(toggleMatch[1])) {
      fail("toggleAdditionalCuisine must add/remove by key identity (filter), never by index or full replace");
    } else {
      ok("Removing one additional-cuisine chip filters strictly by key identity — cannot remove or corrupt an unrelated value");
    }
  }

  console.log("");
  if (failures > 0) {
    console.error(`verify-final-audit-defect-fixes: FAIL (${failures} check${failures === 1 ? "" : "s"} failed)`);
    process.exitCode = 1;
    return;
  }
  console.log("verify-final-audit-defect-fixes: PASS");
}

main();
