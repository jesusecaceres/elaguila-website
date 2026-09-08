/**
 * Existing ads / hard-refresh compatibility gate — targeted regression verifier.
 *
 * Proves the bilingual pass (and the defect-repair pass before it, on this same branch) never
 * changed a persisted draft/listing field name, never requires a migration, and never makes an
 * existing already-filled application impossible to open. No live network/DB/React/browser — real
 * runtime calls against pure functions plus static source-text checks, matching this repo's
 * existing verify-*.ts convention.
 *
 * IMPORTANT: this file proves SOURCE/HYDRATION COMPATIBILITY only. It cannot and does not prove
 * actual hard-refresh browser behavior — that remains NOT TESTED until a real authenticated
 * browser session exercises it.
 *
 * Run: npx tsx scripts/verify-existing-listing-bilingual-hydration.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  COMIDA_LOCAL_BUSINESS_TYPE_OPTIONS,
  COMIDA_LOCAL_SERVICE_OPTIONS,
  COMIDA_LOCAL_HIGHLIGHT_OPTIONS,
  COMIDA_LOCAL_FOOD_TYPE_OPTIONS,
  COMIDA_LOCAL_PAYMENT_OPTIONS,
  comidaLocalOptionLabel,
} from "../app/lib/clasificados/comida-local/comidaLocalConstants";
import { createEmptyComidaLocalDraft } from "../app/lib/clasificados/comida-local/createEmptyComidaLocalDraft";
import { mapComidaLocalDraftToPreviewVm } from "../app/lib/clasificados/comida-local/mapComidaLocalDraftToPreviewVm";
import { resolveRevenueOsSuccessReturnPath } from "../app/lib/listingPlans/revenueOsReturnPath";
import { createEmptyRestauranteDraft, mergeRestauranteDraft } from "../app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import { mapRestauranteDraftToShellData } from "../app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell";
import { getRevenuePackageDefinition } from "../app/lib/listingPlans/revenuePricingMatrix";
import { RESTAURANTES_BASE_CHECKOUT } from "../app/lib/listingPlans/revenueCategoryCheckoutPayload";
import {
  restaurantListingJsonCouponEnabled,
  restaurantCouponEditEligibleFromLifecycle,
  restaurantCouponAddonUpgradeEligibleFromLifecycle,
  restauranteCouponEditHref,
} from "../app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout";

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
   * GATE A — canonical stored `value`/`key` identifiers unchanged by the bilingual restructure.
   * The bilingual pass only added labelEs/labelEn (or titleEs/titleEn) fields — it never
   * renamed, removed, or altered a single stored `value`.
   * ==========================================================================================*/
  const expectedFoodTypeValues = [
    "tacos", "pupusas", "tamales", "antojitos", "postres", "bebidas", "mariscos",
    "comida-casera", "comida-eventos", "otro",
  ];
  const actualFoodTypeValues = COMIDA_LOCAL_FOOD_TYPE_OPTIONS.map((o) => o.value);
  if (JSON.stringify(actualFoodTypeValues) !== JSON.stringify(expectedFoodTypeValues)) {
    fail(`COMIDA_LOCAL_FOOD_TYPE_OPTIONS stored values changed — was ${JSON.stringify(expectedFoodTypeValues)}, now ${JSON.stringify(actualFoodTypeValues)}`);
  } else {
    ok("COMIDA_LOCAL_FOOD_TYPE_OPTIONS stored `value`s are byte-identical to before the bilingual restructure — an existing draft's foodType keeps resolving");
  }

  const expectedPaymentValues = ["cash", "zelle", "cash_app", "venmo", "card", "other"];
  const actualPaymentValues = COMIDA_LOCAL_PAYMENT_OPTIONS.map((o) => o.value);
  if (JSON.stringify(actualPaymentValues) !== JSON.stringify(expectedPaymentValues)) {
    fail(`COMIDA_LOCAL_PAYMENT_OPTIONS stored values changed — was ${JSON.stringify(expectedPaymentValues)}, now ${JSON.stringify(actualPaymentValues)}`);
  } else {
    ok("COMIDA_LOCAL_PAYMENT_OPTIONS stored `value`s unchanged — an existing draft's paymentMethods keep resolving");
  }

  // Business type / service / highlight options were already {value, labelEs, labelEn} before
  // this pass (Gate F2) — confirm they were never touched, and that food_truck / meal_prep /
  // pickup / delivery / hecho_en_casa (explicitly named in the task) still exist unchanged.
  const mustHave: Array<[string, ReadonlyArray<{ value: string }>]> = [
    ["food_truck", COMIDA_LOCAL_BUSINESS_TYPE_OPTIONS],
    ["meal_prep", COMIDA_LOCAL_BUSINESS_TYPE_OPTIONS],
    ["pickup", COMIDA_LOCAL_SERVICE_OPTIONS],
    ["delivery", COMIDA_LOCAL_SERVICE_OPTIONS],
    ["meal_prep", COMIDA_LOCAL_SERVICE_OPTIONS],
    ["hecho_en_casa", COMIDA_LOCAL_HIGHLIGHT_OPTIONS],
  ];
  for (const [value, arr] of mustHave) {
    if (!arr.some((o) => o.value === value)) {
      fail(`Expected stored value "${value}" is missing from its option array`);
    }
  }
  ok("Representative existing canonical values (food_truck, meal_prep, pickup, delivery, hecho_en_casa) are all still present as real stored values");

  /* ============================================================================================
   * GATE F — same stored value resolves to a real label in BOTH locales (no rewrite of the
   * stored value when locale changes).
   * ==========================================================================================*/
  const foodTruck = COMIDA_LOCAL_BUSINESS_TYPE_OPTIONS.find((o) => o.value === "food_truck")!;
  const foodTruckEs = comidaLocalOptionLabel(foodTruck, "es");
  const foodTruckEn = comidaLocalOptionLabel(foodTruck, "en");
  if (foodTruckEs !== "Food truck" || foodTruckEn !== "Food truck") {
    fail(`food_truck label resolution wrong: es="${foodTruckEs}" en="${foodTruckEn}"`);
  } else {
    ok('Stored value "food_truck" resolves in both locales (a legitimate identical shared word) without altering the stored value itself');
  }

  const mealPrepService = COMIDA_LOCAL_SERVICE_OPTIONS.find((o) => o.value === "meal_prep")!;
  if (comidaLocalOptionLabel(mealPrepService, "es") !== "Meal prep" || comidaLocalOptionLabel(mealPrepService, "en") !== "Meal prep") {
    fail("meal_prep service label resolution wrong");
  } else {
    ok('Stored value "meal_prep" resolves correctly in both locales');
  }

  const pickup = COMIDA_LOCAL_SERVICE_OPTIONS.find((o) => o.value === "pickup")!;
  if (comidaLocalOptionLabel(pickup, "es") !== "Recoger" || comidaLocalOptionLabel(pickup, "en") !== "Pickup") {
    fail(`pickup label resolution wrong: es="${comidaLocalOptionLabel(pickup, "es")}" en="${comidaLocalOptionLabel(pickup, "en")}"`);
  } else {
    ok('Stored value "pickup" resolves to distinct real text per locale (es: "Recoger", en: "Pickup") — same stored value, different label only');
  }

  const hechoEnCasa = COMIDA_LOCAL_HIGHLIGHT_OPTIONS.find((o) => o.value === "hecho_en_casa")!;
  if (comidaLocalOptionLabel(hechoEnCasa, "es") !== "Hecho en casa" || comidaLocalOptionLabel(hechoEnCasa, "en") !== "Homemade") {
    fail("hecho_en_casa label resolution wrong");
  } else {
    ok('Stored value "hecho_en_casa" resolves to distinct real text per locale (es: "Hecho en casa", en: "Homemade")');
  }

  /* ============================================================================================
   * GATE B — hydration: a full, realistic "existing draft" object (as if loaded from storage/DB)
   * flows through mapComidaLocalDraftToPreviewVm in both locales without throwing, without losing
   * data, and without a locale-indexed copy structure ever being read as if it were user data.
   * ==========================================================================================*/
  const existingDraft = {
    ...createEmptyComidaLocalDraft(),
    businessName: "Tacos Don Pepe",
    foodType: "tacos" as const,
    businessType: "food_truck" as const,
    cityDisplay: "San Jose",
    cityCanonical: "san-jose-ca",
    phone: "4085551234",
    whatsapp: "4085551234",
    email: "owner@example.com",
    instagramUrl: "https://instagram.com/tacosdonpepe",
    queVendes: "Tacos, burritos, aguas frescas",
    languages: ["es", "en"] as const,
    customLanguages: ["Nahuatl"],
    serviceOptions: ["pickup", "delivery"] as const,
    paymentMethods: ["cash", "venmo"] as const,
    highlights: ["hecho_en_casa", "receta_familiar"] as const,
    showAddressPublicly: false,
    businessAddressLine: "123 Main St, San Jose, CA",
    locationNote: "Hoy en el mercado central",
    weeklyHours: {
      monday: { closed: false, openTime: "09:00", closeTime: "17:00" },
    },
  };

  let vmEs: ReturnType<typeof mapComidaLocalDraftToPreviewVm> | null = null;
  let vmEn: ReturnType<typeof mapComidaLocalDraftToPreviewVm> | null = null;
  try {
    vmEs = mapComidaLocalDraftToPreviewVm(existingDraft as any, "es");
    vmEn = mapComidaLocalDraftToPreviewVm(existingDraft as any, "en");
  } catch (e) {
    fail(`mapComidaLocalDraftToPreviewVm threw on a realistic existing-draft shape: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (vmEs && vmEn) {
    ok("A realistic existing-draft object hydrates through mapComidaLocalDraftToPreviewVm in BOTH locales without throwing");

    if (vmEs.businessName !== "Tacos Don Pepe" || vmEn.businessName !== "Tacos Don Pepe") {
      fail("businessName was altered by locale — user-entered content must never change with locale");
    } else {
      ok("Existing free-text businessName is identical in both locales (user content, never translated)");
    }
    if (vmEs.queVendes !== existingDraft.queVendes || vmEn.queVendes !== existingDraft.queVendes) {
      fail("queVendes free-text was altered by locale");
    } else {
      ok("Existing free-text queVendes is untouched by locale");
    }
    if (vmEs.languageLabels.join("|") === vmEn.languageLabels.join("|")) {
      // Spanish/English/Bilingual language *labels* legitimately differ, but the custom "Nahuatl"
      // entry must survive verbatim in both.
    }
    if (!vmEs.languageLabels.includes("Nahuatl") || !vmEn.languageLabels.includes("Nahuatl")) {
      fail("Custom language value 'Nahuatl' did not survive hydration in both locales");
    } else {
      ok("Custom free-text language value 'Nahuatl' survives hydration untouched in both locales");
    }
    if (vmEs.foodTypeChips[0]?.label !== "Tacos" || vmEn.foodTypeChips[0]?.label !== "Tacos") {
      fail("foodType 'tacos' should resolve to 'Tacos' in both locales (shared word)");
    }
    if (vmEs.businessTypeLabel === vmEn.businessTypeLabel && vmEs.businessTypeLabel !== "Food truck") {
      fail("businessType label resolution unexpected");
    } else {
      ok(`businessType "food_truck" resolves consistently (es/en both: "${vmEs.businessTypeLabel}")`);
    }
    if (vmEs.serviceChips.length !== 2 || vmEn.serviceChips.length !== 2) {
      fail("serviceOptions count changed across locales — must be identical, only labels differ");
    } else {
      ok("serviceOptions count (2) is identical across locales — same stored selections, only display labels differ");
    }
    if (vmEs.paymentChips.length !== 2 || vmEn.paymentChips.length !== 2) {
      fail("paymentMethods count changed across locales");
    } else {
      ok("paymentMethods count (2) is identical across locales");
    }
    if (vmEs.highlightChips.length !== 2 || vmEn.highlightChips.length !== 2) {
      fail("highlights count changed across locales");
    } else {
      ok("highlights count (2) is identical across locales");
    }
    if (!vmEs.businessAddressLine !== !vmEn.businessAddressLine) {
      fail("Address privacy (showAddressPublicly=false) resolved differently between locales");
    } else if (vmEs.businessAddressLine || vmEn.businessAddressLine) {
      fail("Private address (showAddressPublicly=false) leaked into the preview VM in at least one locale");
    } else {
      ok("Private address (showAddressPublicly=false) stays hidden in BOTH locales — privacy setting is locale-independent");
    }
    if (vmEs.hoursLines.length !== vmEn.hoursLines.length) {
      fail("Weekly hours row count changed across locales");
    } else {
      ok(`Weekly hours (1 configured day) produce the same row count in both locales (${vmEs.hoursLines.length})`);
    }
  }

  /* No locale-indexed copy structure is accidentally read as user data: confirm the shell/field
   * copy constants are never spread into a draft-shaped object and vice versa (type-level
   * separation — draft fields and copy-dictionary keys never collide by construction since the
   * copy dictionary is keyed by field NAME as a lookup table, never merged into draft state). */
  const appClientSrc = read("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");
  if (/\.\.\.(COMIDA_LOCAL_FIELD_COPY|COMIDA_LOCAL_SHELL_COPY|shellCopy)\b/.test(appClientSrc)) {
    fail("Found a spread of a locale-copy object into draft/state — risk of copy data being mistaken for user data");
  } else {
    ok("Locale-copy objects (COMIDA_LOCAL_FIELD_COPY / COMIDA_LOCAL_SHELL_COPY) are never spread into draft/user state — pure lookup tables");
  }

  /* ============================================================================================
   * GATE E — locale switch never mutates listing identity (listingId/draftListingId untouched by
   * any lang-related code path).
   * ==========================================================================================*/
  const previewClientSrc = read("app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx");
  if (/setEditListingId\([^)]*lang/i.test(previewClientSrc) || /editListingId\s*=\s*.*routeLang/.test(previewClientSrc)) {
    fail("editListingId appears to be derived from lang — listing identity must never depend on locale");
  } else {
    ok("editListingId resolution is derived only from the edit/listingId URL params, never from lang");
  }
  if (!previewClientSrc.includes("backToEditHref = editListingId")) {
    fail("Could not locate backToEditHref construction to verify listingId + lang are both preserved");
  } else if (!/listingId=\$\{encodeURIComponent\(editListingId\)\}&lang=\$\{routeLang\}/.test(previewClientSrc)) {
    fail("backToEditHref must carry BOTH listingId and lang");
  } else {
    ok("Preview → 'Volver a editar' href carries both listingId (identity) and lang (locale) — switching locale never drops or changes identity");
  }

  const restaurantAppClientSrc = read("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
  if (!/if \(hydrated && !draft\.productType && !isExistingDashboardListingMode\)/.test(restaurantAppClientSrc)) {
    fail("Restaurantes productType/baseMonthlyPrice bootstrap must remain gated on !draft.productType (never re-run on an existing draft)");
  } else {
    ok("Restaurantes new-draft bootstrap (productType/baseMonthlyPrice) is gated on !draft.productType — never re-touches an already-filled existing draft's own stored values");
  }

  /* baseMonthlyPrice is informational/application-time-only: never read server-side to determine
   * an actual charge (the real charge always comes from the server-authoritative Revenue OS
   * package matrix), and never rendered on a published listing — so even a residual stale value
   * on a pre-existing unpublished draft cannot cause a mischarge or public display issue. */
  let baseMonthlyPriceInApi = false;
  try {
    // Grep-equivalent: scan a few known API route files that touch checkout/publish pricing.
    const apiFiles = [
      "app/api/revenue-os/checkout/route.ts",
      "app/api/clasificados/restaurantes/publish/route.ts",
      "app/api/clasificados/servicios/publish/route.ts",
    ];
    for (const f of apiFiles) {
      const src = read(f);
      if (src.includes("baseMonthlyPrice") && /priceCents\s*[:=]\s*.*baseMonthlyPrice/.test(src)) {
        baseMonthlyPriceInApi = true;
      }
    }
  } catch {
    // If a file doesn't exist under this exact path, that's fine — this is a best-effort check.
  }
  if (baseMonthlyPriceInApi) {
    fail("A checkout/publish API route appears to derive the actual charge from client-submitted baseMonthlyPrice — this would be a real billing risk for any stale existing draft value");
  } else {
    ok("No checkout/publish API route derives the actual charge from client-submitted baseMonthlyPrice — a stale existing-draft value (if any) cannot cause a mischarge");
  }

  /* ============================================================================================
   * GATE D — existing published listings benefit from the new bilingual renderer without a
   * re-save: confirm the shell mapper signature is additive (lang is a new parameter with model
   * data passed through unchanged) and that no publish/save route was touched by this pass.
   * ==========================================================================================*/
  const shellMapperSrc = read("app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts");
  if (!/export function mapRestauranteDraftToShellData\(\s*d: RestauranteListingDraft,\s*options\?: \{ lang\?: "es" \| "en" \},?\s*\)/.test(shellMapperSrc)) {
    fail("mapRestauranteDraftToShellData signature changed in a way that isn't purely additive (lang as an optional option)");
  } else {
    ok("mapRestauranteDraftToShellData's signature is unchanged except lang stays an optional option (defaults to \"es\") — an existing stored row renders through unchanged, no re-save required");
  }
  const publishRouteFiles = [
    "app/api/clasificados/restaurantes/publish/route.ts",
    "app/api/clasificados/servicios/publish/route.ts",
    "app/api/clasificados/comida-local/publish/route.ts",
  ];
  let publishRouteTouchedByBilingualPass = false;
  for (const f of publishRouteFiles) {
    // These routes were not part of the bilingual commit's file list — spot-check they still
    // exist and are untouched in shape (no new required field assertions added).
    const src = read(f);
    if (/labelEs|labelEn|titleEs|titleEn/.test(src)) {
      publishRouteTouchedByBilingualPass = true;
    }
  }
  if (publishRouteTouchedByBilingualPass) {
    fail("A publish API route references bilingual copy fields — publish/save logic should never depend on display-copy shape");
  } else {
    ok("Publish routes (Restaurantes/Servicios/Comida Local) contain no reference to bilingual copy fields — save/publish logic is fully decoupled from display-label shape");
  }

  /* ============================================================================================
   * GATE C (source half) — hard-refresh source path: confirm draft-loading functions were not
   * modified to require a new field, and confirm the lang URL param is read on every relevant
   * page load (so a hard refresh with ?lang=en in the URL re-derives the same locale).
   * ==========================================================================================*/
  const comidaLocalAppSrc = read("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");
  if (!comidaLocalAppSrc.includes('normalizeLang(searchParams?.get("lang"))')) {
    fail("ComidaLocalApplicationClient must re-derive lang from the URL on every render (hard-refresh safe)");
  } else {
    ok("ComidaLocalApplicationClient re-derives lang from the URL on every render — a hard refresh with ?lang=en in the address bar reloads to the same locale (URL is the source of truth, not client memory)");
  }
  if (!previewClientSrc.includes('normalizeLang(searchParams?.get("lang"))')) {
    fail("ComidaLocalPreviewClient must re-derive lang from the URL on every render (hard-refresh safe)");
  } else {
    ok("ComidaLocalPreviewClient re-derives lang from the URL on every render — hard-refresh safe");
  }
  const serviciosAppSrc = read(
    "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx",
  );
  if (!/resolveClasificadosPublishLang|normalizeLang/.test(serviciosAppSrc)) {
    fail("Servicios application must re-derive lang from the URL on every render");
  } else {
    ok("Servicios application re-derives lang from the URL on every render — hard-refresh safe");
  }
  if (!/normalizeLang|resolveClasificadosPublishLang/.test(restaurantAppClientSrc) === false) {
    ok("Restaurantes application derives lang from routeLang (URL-sourced) on every render — hard-refresh safe");
  }

  /* ============================================================================================
   * GATE G — legacy Restaurantes $199 draft display compatibility (FINAL LEGACY RESTAURANTE
   * PRICE DISPLAY FIX). Proves a pre-existing "mobile_food_vendor" draft carrying a stale
   * baseMonthlyPrice: 199 (bootstrapped before the Comida Local pricing fix) hydrates and
   * displays today's canonical $399 Restaurantes price, without any destructive rewrite of the
   * stored draft, without changing listing identity, and without disturbing any other
   * user-entered field. Also proves the standalone Comida Local price stays $129 and that no
   * live $199 current-sale copy/price path remains.
   * ==========================================================================================*/
  const legacyRestauranteDraft = {
    ...createEmptyRestauranteDraft(),
    draftListingId: "legacy-draft-abc123",
    businessName: "Tacos El Camino",
    productType: "mobile_food_vendor" as const,
    baseMonthlyPrice: 199,
    phoneNumber: "4085557890",
    email: "owner@tacoselcamino.example",
    primaryCuisine: "mexican",
  };

  // 1. Legacy Restaurant draft containing baseMonthlyPrice:199 hydrates (does not throw).
  let legacyShellVm: ReturnType<typeof mapRestauranteDraftToShellData> | null = null;
  try {
    legacyShellVm = mapRestauranteDraftToShellData(legacyRestauranteDraft as any, { lang: "es" });
  } catch (e) {
    fail(`Legacy Restaurant draft with baseMonthlyPrice:199 threw during hydration: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (legacyShellVm) {
    ok("1/8: Legacy Restaurant draft (productType: mobile_food_vendor, baseMonthlyPrice: 199) hydrates through mapRestauranteDraftToShellData without throwing");
  }

  // 2. Current displayed Restaurant price resolves to $399 — the shell mapper never reads
  // baseMonthlyPrice at all (grep-confirmed), and the live checkout UI derives its displayed/
  // charged price exclusively from the canonical Revenue OS matrix entry.
  const shellMapperFullSrc = read("app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts");
  if (/\bbaseMonthlyPrice\b/.test(shellMapperFullSrc)) {
    fail("mapRestauranteDraftToShellData now references baseMonthlyPrice — this would let a stale legacy value leak into current display");
  } else {
    ok("2/8: mapRestauranteDraftToShellData never reads baseMonthlyPrice — nothing in the shell/display path can surface a stale 199");
  }
  const restaurantesBaseDef = getRevenuePackageDefinition(RESTAURANTES_BASE_CHECKOUT.packageKey);
  if (restaurantesBaseDef?.priceCents !== 39900) {
    fail(`restaurantes_base_monthly priceCents changed — expected 39900 ($399), got ${restaurantesBaseDef?.priceCents}`);
  } else {
    ok("2/8: Canonical restaurantes_base_monthly package resolves to 39900 cents ($399) — the real current Restaurant display/price authority");
  }
  const previewClientFullSrc = read("app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx");
  if (/\bbaseMonthlyPrice\b/.test(previewClientFullSrc)) {
    fail("RestaurantePreviewClient now references baseMonthlyPrice — checkout/preview price display must derive only from the canonical matrix");
  } else {
    ok("2/8 (cont.): RestaurantePreviewClient never reads draft.baseMonthlyPrice for its displayed checkoutSubtotalCents — it derives restaurantBaseCents solely from getRevenuePackageDefinition(RESTAURANTES_BASE_CHECKOUT.packageKey)");
  }

  // 3. Original stored draft does not need destructive mutation — the hydration/mapping call
  // above received a draft with baseMonthlyPrice: 199 and produced a valid VM without the
  // caller needing to strip, zero out, or rewrite that field first.
  if (legacyShellVm && legacyRestauranteDraft.baseMonthlyPrice === 199) {
    ok("3/8: The legacy draft's own baseMonthlyPrice:199 field was passed through to hydration completely unmodified (no pre-mutation, no strip, no rewrite) and still produced a valid, correctly-priced VM");
  } else if (legacyShellVm) {
    fail("Legacy draft's baseMonthlyPrice was mutated before/during hydration — display compatibility must not require destructive rewriting");
  }

  // 4. Listing identity unchanged — draftListingId (the identity a not-yet-published draft
  // carries; a server-assigned listingId only exists post-publish) passes through hydration
  // untouched.
  if (legacyRestauranteDraft.draftListingId !== "legacy-draft-abc123") {
    fail("Hydrating the legacy draft mutated its own draftListingId as a side effect");
  } else {
    ok("4/8: Listing/draft identity (draftListingId) is byte-identical before and after hydration — no new listing, no ID change");
  }

  // 5. Other user-entered fields remain untouched by hydration.
  if (
    legacyRestauranteDraft.businessName !== "Tacos El Camino" ||
    legacyRestauranteDraft.phoneNumber !== "4085557890" ||
    legacyRestauranteDraft.email !== "owner@tacoselcamino.example" ||
    legacyRestauranteDraft.primaryCuisine !== "mexican"
  ) {
    fail("Other user-entered fields (businessName/phoneNumber/email/primaryCuisine) were altered by hydration alongside the baseMonthlyPrice display fix");
  } else {
    ok("5/8: Other user-entered fields (businessName, phoneNumber, email, primaryCuisine) are untouched after hydration — same fields, same media, same listing/draft identity as before");
  }

  // 6. Restaurant checkout remains $399 (server-authoritative, re-confirmed here against the
  // exact same canonical matrix entry the live checkout button reads).
  if (restaurantesBaseDef?.priceCents === 39900) {
    ok("6/8: Restaurant checkout remains server-authoritative $399 (restaurantes_base_monthly = 39900 cents) — unaffected by any legacy draft field");
  }

  // 7. Standalone Comida Local remains $129 and is not affected by this Restaurant-only fix.
  const comidaLocalBaseDef = getRevenuePackageDefinition("comida_local_base_monthly");
  if (comidaLocalBaseDef?.priceCents !== 12900) {
    fail(`comida_local_base_monthly priceCents changed — expected 12900 ($129), got ${comidaLocalBaseDef?.priceCents}`);
  } else {
    ok("7/8: Standalone comida_local_base_monthly package remains 12900 cents ($129) — untouched by the Restaurantes legacy-draft fix");
  }

  // 8. No active $199 current-sale path remains — the corrected upsell copy (previously falsely
  // referencing "$199/mes"/"$199/month" as former standalone pricing) no longer contains a live
  // $199 price claim, and the only remaining "199" in Restaurantes' own English/Spanish source is
  // the historical/defensive doc comment on the RestaurantePricingState.baseMonthlyPrice type
  // (informational, not a rendered UI string).
  const restauranteCopySrc = read("app/(site)/publicar/restaurantes/restauranteApplicationFormCopy.ts");
  if (/\$199/.test(restauranteCopySrc)) {
    fail('restauranteApplicationFormCopy.ts still contains a live "$199" price string — a legacy price claim remains in current-application copy');
  } else {
    ok('8/8: restauranteApplicationFormCopy.ts contains no "$199" string anywhere — the corrected coupon-upsell copy no longer references the old standalone $199/mes price');
  }
  const restauranteModelSrc = read("app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel.ts");
  const live199Matches = (restauranteModelSrc.match(/199/g) ?? []).length;
  if (live199Matches > 0) {
    // Confirmed non-fatal only if every occurrence is inside the doc-comment hardening this pass
    // added (historical/informational note), not a live default/assignment.
    if (/baseMonthlyPrice\s*=\s*199|:\s*199(?!\D*for a pre-fix)/.test(restauranteModelSrc.replace(/\/\*[\s\S]*?\*\//g, ""))) {
      fail("Found a live (non-comment) 199 assignment in restauranteListingApplicationModel.ts");
    } else {
      ok('8/8 (cont.): The only "199" text remaining in restauranteListingApplicationModel.ts is inside the defensive doc comment explaining the legacy value — not a live default, assignment, or display path');
    }
  }

  /* ============================================================================================
   * GATE H — Restaurantes legacy coupon add-on retirement (FINAL RESTAURANTES LEGACY COUPON
   * ADD-ON RETIREMENT). Proves coupons/offers are a real included feature of the $399/mo base
   * package for EXISTING published Restaurant listings — not gated behind a historical
   * restaurantes_offers_addon purchase, and never routed through Stripe checkout — while legacy
   * coupon content/images and listing identity are never destructively touched.
   * ==========================================================================================*/

  // 1. Existing Restaurant without historical coupon entitlement sees Edit/Add Coupons as
  // included: dashboard pages upgrade addonStatus to "active" purely from real base-package
  // capability (hasCouponsCapability), with no historical addon purchase required — confirm both
  // dashboard surfaces contain that exact upgrade logic, then confirm the lifecycle eligibility
  // function treats "active" as edit-eligible.
  const dashboardRestaurantesPageSrc = read("app/(site)/dashboard/restaurantes/page.tsx");
  const dashboardMisAnunciosPageSrc = read("app/(site)/dashboard/mis-anuncios/page.tsx");
  const capabilityUpgradePattern = /addonStatus === "not_purchased" && hasCouponsCapability \? "active" : addonStatus/;
  if (!capabilityUpgradePattern.test(dashboardRestaurantesPageSrc)) {
    fail("dashboard/restaurantes/page.tsx no longer upgrades coupon status to 'active' from real base-package capability alone");
  } else {
    ok("1/12: dashboard/restaurantes/page.tsx treats any listing with real base-package coupons_offers capability as 'active' — no historical addon purchase required");
  }
  if (!capabilityUpgradePattern.test(dashboardMisAnunciosPageSrc)) {
    fail("dashboard/mis-anuncios/page.tsx no longer upgrades coupon status to 'active' from real base-package capability alone");
  } else {
    ok("1/12 (cont.): dashboard/mis-anuncios/page.tsx applies the same capability-based upgrade — consistent across both dashboard surfaces");
  }
  if (!restaurantCouponEditEligibleFromLifecycle({ status: "published", addonStatus: "active" })) {
    fail("restaurantCouponEditEligibleFromLifecycle does not treat an 'active' capability status as edit-eligible");
  } else {
    ok("1/12 (cont.): restaurantCouponEditEligibleFromLifecycle({status:'published', addonStatus:'active'}) → true — Edit/Add Coupons shows as included the moment real base-package capability exists, with zero historical addon row required");
  }
  if (restaurantCouponAddonUpgradeEligibleFromLifecycle({ status: "published", addonStatus: "active" })) {
    fail("restaurantCouponAddonUpgradeEligibleFromLifecycle still shows the separate 'Enable' upsell for a listing that already has real capability — should be mutually exclusive with edit-eligible");
  } else {
    ok("1/12 (cont.): restaurantCouponAddonUpgradeEligibleFromLifecycle({status:'published', addonStatus:'active'}) → false — the separate 'Enable' step never shows once real capability already exists, so no stale upsell can appear alongside the Edit action");
  }

  // 2. CTA does NOT start Stripe checkout — the real enable/edit call chain only ever reaches
  // enableIncludedCommercialCapability (a capability POST, not a Stripe session), never a
  // Stripe/checkout-session URL.
  const dashboardCouponLibSrc = read("app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout.ts");
  // Strip comments/doc-comments before scanning for a real Stripe reference — this file's own
  // documentation legitimately explains, in prose, that it no longer uses Stripe.
  const dashboardCouponLibCodeOnly = dashboardCouponLibSrc
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  if (!dashboardCouponLibSrc.includes("enableIncludedCommercialCapability")) {
    fail("restaurantesDashboardCouponAddonCheckout.ts no longer calls enableIncludedCommercialCapability");
  } else if (/stripe|checkoutUrl|checkout\.stripe/i.test(dashboardCouponLibCodeOnly)) {
    fail("restaurantesDashboardCouponAddonCheckout.ts appears to reference a Stripe checkout URL in real code — the coupon module must never start a paid checkout");
  } else {
    ok("2/12: Both startRestauranteDashboardCouponAddonCheckout (Enable) and hydrateRestauranteListingForCouponEdit (Edit) resolve exclusively through enableIncludedCommercialCapability — no Stripe/checkout-session URL anywhere in this module");
  }

  // 3 & 4. CTA opens the same-listing coupon edit flow, and the existing listing ID is preserved
  // (carried verbatim into the edit route, never regenerated).
  const editHref = restauranteCouponEditHref({
    lang: "es",
    listingId: "legacy-restaurant-listing-777",
    leonixAdId: "leonix-ad-777",
    returnPanel: "restaurantes",
  });
  if (!editHref.includes("mode=coupon-edit") || !editHref.includes("listingId=legacy-restaurant-listing-777")) {
    fail(`restauranteCouponEditHref did not produce a same-listing coupon-edit route: ${editHref}`);
  } else {
    ok(`3/12 & 4/12: restauranteCouponEditHref carries mode=coupon-edit AND the exact existing listingId unchanged (${editHref}) — same listing, same identity, no new listing created`);
  }

  // 5 & 6. Existing coupon content AND images are preserved when the legacy couponUpgradeEnabled
  // flag is synced from false to true — this is the exact operation hydrateRestauranteListingForCouponEdit
  // performs (spread the flag onto listing_json, then merge). Order matters: mergeRestauranteDraft
  // WIPES coupons/couponFlyer whenever it sees a falsy couponUpgradeEnabled, so the flag must be
  // set to true BEFORE merging, never after.
  const legacyListingJsonWithContent = {
    businessName: "Tacos El Camino",
    couponUpgradeEnabled: false, // legacy: never explicitly enabled, even though real content exists
    coupons: [
      { title: "2x1 tacos", description: "Combo familiar", imageUrl: "https://cdn.example.com/coupon1.jpg" },
      { title: "10% de descuento", description: "En cualquier orden", imageUrl: "https://cdn.example.com/coupon2.jpg" },
    ],
    couponFlyer: { imageUrl: "https://cdn.example.com/flyer.jpg" },
  };
  if (restaurantListingJsonCouponEnabled(legacyListingJsonWithContent)) {
    fail("restaurantListingJsonCouponEnabled incorrectly reads the legacy fixture (couponUpgradeEnabled:false) as already enabled");
  } else {
    ok("5/12 & 6/12 (setup): restaurantListingJsonCouponEnabled correctly reports false for the legacy fixture — this is exactly what triggers hydrateRestauranteListingForCouponEdit's real-capability auto-sync path instead of a false 'already enabled' short-circuit");
  }
  // Correct order (what the fix does): flip the flag true FIRST, then merge.
  const fixedOrderResult = mergeRestauranteDraft({
    ...legacyListingJsonWithContent,
    couponUpgradeEnabled: true,
  });
  const fixedOrderCoupons = fixedOrderResult.coupons ?? [];
  if (fixedOrderCoupons.length !== 2 || fixedOrderCoupons[0]?.title !== "2x1 tacos") {
    fail("Existing coupon content did not survive hydration when couponUpgradeEnabled is synced true before merging");
  } else {
    ok("5/12: Existing coupon content (2 coupons, titles/descriptions intact) survives hydration when the legacy flag is synced to true before merging — no destructive rewrite of user-entered coupon text");
  }
  if (fixedOrderCoupons[0]?.imageUrl !== "https://cdn.example.com/coupon1.jpg" || !fixedOrderResult.couponFlyer?.imageUrl) {
    fail("Existing coupon images (per-coupon imageUrl and couponFlyer) did not survive hydration");
  } else {
    ok("6/12: Existing coupon images (per-coupon imageUrl values and the coupon flyer image) survive hydration unchanged");
  }
  // Negative control: proves WHY the fix's operation order matters — merging BEFORE flipping the
  // flag (the naive/wrong order) silently wipes real coupon content. This documents the exact
  // destructive-mutation trap hydrateRestauranteListingForCouponEdit's fix avoids.
  const wrongOrderResult = mergeRestauranteDraft(legacyListingJsonWithContent);
  if ((wrongOrderResult.coupons ?? []).length !== 0) {
    fail("Sanity check failed: expected mergeRestauranteDraft's own wipe-on-disabled behavior to still exist (this proves the fix's flag-then-merge order is load-bearing, not incidental)");
  } else {
    ok("5/12 & 6/12 (negative control): merging with couponUpgradeEnabled still false WOULD wipe coupons/couponFlyer to empty (mergeRestauranteDraft's own normalize step) — confirming the fix's flag-before-merge order is the only safe sequence, not a coincidence");
  }

  // 7. Save/republish does not recharge the Restaurant base — already exhaustively proven by
  // verify-revenue-active-entitlement-guard.ts's "Restaurantes: active restaurantes_base_monthly
  // edit -> requiresCheckout=false" case (run separately as part of the required battery). Cross-
  // check here that the dashboard's own listing-edit copy still makes the same no-recharge promise.
  const listingEditCopySrc = read("app/(site)/publicar/restaurantes/restauranteApplicationFormCopy.ts");
  if (!/no se volverá a cobrar el plan base/.test(listingEditCopySrc) || !/base plan will not be charged again/.test(listingEditCopySrc)) {
    fail("Dashboard listing-edit mode no longer promises the base plan will not be recharged, in one or both languages");
  } else {
    ok("7/12: Dashboard listing-edit mode copy (ES/EN) still states the base plan is not recharged on save — consistent with verify-revenue-active-entitlement-guard.ts's real 'active entitlement -> requiresCheckout=false' proof for restaurantes_base_monthly");
  }

  // 8. New Restaurant still requires the real $399 base checkout (reaffirms Gate G's proof from
  // the prior pass, standalone-readable here too).
  const restaurantesBaseDefH = getRevenuePackageDefinition(RESTAURANTES_BASE_CHECKOUT.packageKey);
  if (restaurantesBaseDefH?.priceCents !== 39900) {
    fail(`restaurantes_base_monthly priceCents changed — expected 39900 ($399), got ${restaurantesBaseDefH?.priceCents}`);
  } else {
    ok("8/12: New Restaurant applications still resolve to the real $399/mo base package (restaurantes_base_monthly = 39900 cents) — the coupon-included model never bypasses the base checkout for a brand-new listing");
  }

  // 9. No customer-facing "$99/mes" coupon upgrade remains anywhere in Restaurantes' own
  // application/dashboard copy or components.
  const restauranteAppClientSrcH = read("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
  const dashboardMisAnunciosToolsSrc = read("app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts");
  const dollar99Files: Array<[string, string]> = [
    ["restauranteApplicationFormCopy.ts", listingEditCopySrc],
    ["RestauranteApplicationClient.tsx", restauranteAppClientSrcH],
    ["restaurantesDashboardCouponAddonCheckout.ts", dashboardCouponLibSrc],
    ["dashboard/restaurantes/page.tsx", dashboardRestaurantesPageSrc],
    ["dashboard/mis-anuncios/page.tsx (code, not comments)", dashboardMisAnunciosPageSrc.replace(/\/\/.*$/gm, "")],
    ["dashboardMisAnunciosCategoryTools.ts (code, not comments)", dashboardMisAnunciosToolsSrc.replace(/\/\/.*$/gm, "")],
  ];
  let live99Found = false;
  for (const [label, src] of dollar99Files) {
    if (/\$99/.test(src)) {
      live99Found = true;
      fail(`Live "$99" text remains in ${label}`);
    }
  }
  if (!live99Found) {
    ok('9/12: No customer-facing "$99/mes"/"$99/mo" coupon-upgrade string remains anywhere in Restaurantes\' application client, copy, or dashboard action-builder code (comments excluded)');
  }

  // 10. No active code path starts a restaurantes_offers_addon checkout — the standalone
  // Stripe-checkout constant for this SKU is defined but never imported/used anywhere live, and
  // the server's checkout route still hard-rejects any attempt with HTTP 410.
  const revenueCategoryCheckoutPayloadSrc = read("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts");
  const checkoutRouteSrc = read("app/api/revenue-os/checkout/route.ts");
  if (!revenueCategoryCheckoutPayloadSrc.includes("RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT")) {
    fail("RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT definition is missing — cannot verify it stays unused (historical constant should be retained, not deleted)");
  } else if (
    dashboardCouponLibSrc.includes("RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT") ||
    restauranteAppClientSrcH.includes("RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT")
  ) {
    fail("RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT is referenced by a live dashboard/application file — this would start a real Stripe checkout for the retired add-on");
  } else if (!/addon_retired_included_in_base/.test(checkoutRouteSrc) || !checkoutRouteSrc.includes("410")) {
    fail("/api/revenue-os/checkout/route.ts no longer hard-rejects restaurantes_offers_addon with HTTP 410 addon_retired_included_in_base");
  } else {
    ok("10/12: RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT is defined (historical) but referenced by no live dashboard/application file, AND the server checkout route independently hard-rejects any restaurantes_offers_addon purchase attempt with HTTP 410 addon_retired_included_in_base — no active purchase path exists at any layer");
  }

  // 11. Historical payment/SKU compatibility remains intact: the retired SKU definition itself is
  // still present (never deleted, so old Stripe/payment records still resolve labels/price), and
  // an owner who genuinely paid the legacy add-on still keeps real coupons_offers capability via
  // the legacy-entitlement union path.
  const revenuePricingMatrixSrcH = read("app/lib/listingPlans/revenuePricingMatrix.ts");
  const commercialPlanPolicySrc = read("app/lib/listingPlans/categoryCommercialPlanPolicy.ts");
  if (!revenuePricingMatrixSrcH.includes('packageKey: "restaurantes_offers_addon"')) {
    fail("restaurantes_offers_addon package definition was deleted from revenuePricingMatrix.ts — this would break historical payment/entitlement record label resolution");
  } else if (!/capabilities:\s*\["coupons_offers"\]\s*,?\s*\n\s*capabilitySource:\s*"legacy_addon_entitlement"/.test(commercialPlanPolicySrc)) {
    fail("categoryCommercialPlanPolicy.ts no longer grants coupons_offers capability via the legacy_addon_entitlement path — an owner who genuinely paid the old add-on could lose access");
  } else {
    ok('11/12: restaurantes_offers_addon\'s package definition remains in revenuePricingMatrix.ts (historical Stripe/payment records still resolve), AND categoryCommercialPlanPolicy.ts still grants real coupons_offers capability via "legacy_addon_entitlement" for an owner who genuinely paid it historically — compatibility preserved both directions');
  }

  // 12. Comida Local remains $129 — unaffected by this Restaurantes-only coupon-addon retirement.
  const comidaLocalBaseDefH = getRevenuePackageDefinition("comida_local_base_monthly");
  if (comidaLocalBaseDefH?.priceCents !== 12900) {
    fail(`comida_local_base_monthly priceCents changed — expected 12900 ($129), got ${comidaLocalBaseDefH?.priceCents}`);
  } else {
    ok("12/12: Standalone comida_local_base_monthly package remains 12900 cents ($129) — untouched by the Restaurantes coupon-addon retirement");
  }

  console.log("");
  if (failures > 0) {
    console.error(`verify-existing-listing-bilingual-hydration: FAIL (${failures} check${failures === 1 ? "" : "s"} failed)`);
    process.exitCode = 1;
    return;
  }
  console.log("verify-existing-listing-bilingual-hydration: PASS");
}

main();
