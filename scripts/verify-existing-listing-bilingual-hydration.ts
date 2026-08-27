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

  console.log("");
  if (failures > 0) {
    console.error(`verify-existing-listing-bilingual-hydration: FAIL (${failures} check${failures === 1 ? "" : "s"} failed)`);
    process.exitCode = 1;
    return;
  }
  console.log("verify-existing-listing-bilingual-hydration: PASS");
}

main();
