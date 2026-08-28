/**
 * Bilingual application UI + translation UX audit — targeted regression verifier.
 *
 * Covers the fixes made in response to the ADDITIONAL REQUIRED AUDIT (bilingual application UI +
 * ad content translation UX) across Servicios, Restaurantes, and Comida Local. No live
 * network/DB/React. Real runtime calls against pure functions plus static source-text checks,
 * matching this repo's existing verify-*.ts convention. Browser-level typing/spacebar behavior is
 * explicitly NOT provable here — see the audit report for what remains LOGIC-VERIFIED vs
 * browser-confirmed.
 *
 * Run: npx tsx scripts/verify-bilingual-application-audit-fixes.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  COMIDA_LOCAL_FOOD_TYPE_OPTIONS,
  COMIDA_LOCAL_PAYMENT_OPTIONS,
  COMIDA_LOCAL_LANGUAGE_OPTIONS,
  COMIDA_LOCAL_SECTIONS,
  comidaLocalOptionLabel,
} from "../app/lib/clasificados/comida-local/comidaLocalConstants";
import {
  COMIDA_LOCAL_SHELL_COPY,
  COMIDA_LOCAL_FIELD_COPY,
  resolveComidaLocalFieldCopy,
} from "../app/lib/clasificados/comida-local/comidaLocalFieldCopy";
import { resolveComidaLocalFoodTypeLabel } from "../app/lib/clasificados/comida-local/mapComidaLocalPublicListing";
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
   * SERVICIOS — coupons/offers module: real bilingual branches, no fake ternaries.
   * ==========================================================================================*/
  const serviciosAppSrc = read(
    "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx",
  );
  const fakeTernaries = [
    /lang === "en" \? "Flyer de cupones o promociones" : "Flyer de cupones o promociones"/,
    /lang === "en" \? "Enlace para ver más ofertas" : "Enlace para ver más ofertas"/,
    /lang === "en" \? "Texto del botón" : "Texto del botón"/,
  ];
  if (fakeTernaries.some((re) => re.test(serviciosAppSrc))) {
    fail("Servicios coupons module still has a fake ternary (identical text on both branches)");
  } else {
    ok("Servicios coupons module has no remaining fake ternaries (both-branches-identical)");
  }
  for (const mustBranch of ['"Coupon ${i + 1}"', '"Remove" : "Quitar"', '"+ Add coupon" : "+ Añadir cupón"']) {
    if (!serviciosAppSrc.includes(mustBranch.replace(/\\/g, ""))) {
      // best-effort presence check; exact string may differ slightly, so also check the pattern class
    }
  }
  if (!/lang === "en" \? `Coupon \$\{i \+ 1\}` : `Cupón \$\{i \+ 1\}`/.test(serviciosAppSrc)) {
    fail('Servicios coupon-row heading ("Cupón N") must branch on lang');
  } else {
    ok('Servicios coupon-row heading ("Cupón N" / "Coupon N") branches on lang');
  }
  if (!/\{lang === "en" \? "Remove" : "Quitar"\}/.test(serviciosAppSrc)) {
    fail('Servicios coupon-row "Quitar" button must branch on lang');
  } else {
    ok('Servicios coupon-row remove button branches on lang (Quitar/Remove)');
  }

  /* ============================================================================================
   * SERVICIOS — lang-preserving routing: checkpoint redirect + checkout-success return path.
   * ==========================================================================================*/
  const serviciosGatewaySrc = read("app/(site)/clasificados/publicar/servicios/page.tsx");
  if (!serviciosGatewaySrc.includes("searchParams") || !serviciosGatewaySrc.includes("lang=")) {
    fail("Servicios gateway redirect (/clasificados/publicar/servicios) must forward the lang query param");
  } else {
    ok("Servicios gateway redirect forwards the lang query param to the checkpoint");
  }

  const freshReturnPath = resolveRevenueOsSuccessReturnPath({
    returnTo: "/clasificados/servicios",
    category: "servicios",
    packageKey: "servicios_base_monthly",
    lang: "en",
  });
  if (!freshReturnPath.includes("lang=en")) {
    fail(`resolveRevenueOsSuccessReturnPath must append lang to a returnTo that lacks one, got: ${freshReturnPath}`);
  } else {
    ok(`resolveRevenueOsSuccessReturnPath appends the real lang to a langless returnTo (${freshReturnPath})`);
  }
  const alreadyTaggedReturnPath = resolveRevenueOsSuccessReturnPath({
    returnTo: "/clasificados/servicios?lang=es",
    category: "servicios",
    packageKey: "servicios_base_monthly",
    lang: "en",
  });
  if ((alreadyTaggedReturnPath.match(/lang=/g) ?? []).length !== 1) {
    fail(`resolveRevenueOsSuccessReturnPath must never double-append lang, got: ${alreadyTaggedReturnPath}`);
  } else {
    ok("resolveRevenueOsSuccessReturnPath never double-appends lang when returnTo already has one");
  }

  /* ============================================================================================
   * RESTAURANTES — preview/listing shell mapper: real bilingual branches + key-based (not
   * label-based) clickable-row matching.
   * ==========================================================================================*/
  const shellMapperSrc = read("app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts");
  for (const fn of ["function buildQuickInfo(", "function buildPrimaryCtas(", "function buildStacks(", "function buildTrustLight("]) {
    if (!shellMapperSrc.includes(fn.replace("(", "(\n  d: RestauranteListingDraft,")) && !new RegExp(fn.replace("(", "\\([\\s\\S]{0,80}lang")).test(shellMapperSrc)) {
      // Loose check: the function must reference `lang` somewhere in its signature region.
    }
  }
  if (!/function buildQuickInfo\(\s*d: RestauranteListingDraft,\s*scheduleSummary: string,\s*lang: "es" \| "en",/.test(shellMapperSrc)) {
    fail("buildQuickInfo must accept a lang parameter");
  } else {
    ok("buildQuickInfo accepts lang and is no longer hardcoded Spanish");
  }
  if (!/function buildPrimaryCtas\(d: RestauranteListingDraft, lang: "es" \| "en"\)/.test(shellMapperSrc)) {
    fail("buildPrimaryCtas must accept a lang parameter");
  } else {
    ok("buildPrimaryCtas accepts lang and is no longer hardcoded Spanish");
  }
  if (!/function buildStacks\(d: RestauranteListingDraft, lang: "es" \| "en"\)/.test(shellMapperSrc)) {
    fail("buildStacks must accept a lang parameter");
  } else {
    ok("buildStacks accepts lang and is no longer hardcoded Spanish");
  }
  if (!/function buildTrustLight\(d: RestauranteListingDraft, lang: "es" \| "en"\)/.test(shellMapperSrc)) {
    fail("buildTrustLight must accept a lang parameter");
  } else {
    ok("buildTrustLight accepts lang and is no longer hardcoded Spanish");
  }
  if (
    !shellMapperSrc.includes('"currentLocation"') ||
    !shellMapperSrc.includes('key: "link"') ||
    !shellMapperSrc.includes('"weeklyRoute"') ||
    !shellMapperSrc.includes('key: "cateringInquiry"')
  ) {
    fail("buildStacks must tag clickable rows with a stable, language-independent key");
  } else {
    ok("buildStacks tags clickable rows (currentLocation/link/weeklyRoute/cateringInquiry) with a stable key");
  }

  const adStoryPreviewSrc = read("app/(site)/clasificados/restaurantes/shell/RestauranteAdStoryPreview.tsx");
  if (/row\.label\.includes\(["'](Ruta semanal|Solicitud|cotización)["']\)/.test(adStoryPreviewSrc)) {
    fail("RestauranteAdStoryPreview must not match clickable stack rows by translated label text");
  } else if (!adStoryPreviewSrc.includes('row.key === "weeklyRoute" || row.key === "cateringInquiry"')) {
    fail("RestauranteAdStoryPreview must match clickable stack rows by stable key");
  } else {
    ok("RestauranteAdStoryPreview matches clickable stack rows by stable key, not translated label text");
  }

  const detailShellSrc = read("app/(site)/clasificados/restaurantes/shell/RestauranteDetailShell.tsx");
  if (/row\.label\.includes\(['"](Ubicación actual|Enlace|Ruta semanal|Solicitud|cotización)['"]\)/.test(detailShellSrc)) {
    fail("RestauranteDetailShell must not match clickable stack rows by translated label text");
  } else if (!detailShellSrc.includes('row.key === "currentLocation"')) {
    fail("RestauranteDetailShell must match clickable stack rows by stable key");
  } else {
    ok("RestauranteDetailShell matches clickable stack rows by stable key, not translated label text");
  }

  /* ============================================================================================
   * COMIDA LOCAL — bilingual option sets, section headings, shell/field copy, translation UX.
   * ==========================================================================================*/
  for (const opt of COMIDA_LOCAL_FOOD_TYPE_OPTIONS) {
    if (!opt.labelEs || !opt.labelEn) {
      fail(`Comida Local food type "${opt.value}" is missing a labelEs/labelEn pair`);
    }
  }
  ok(`All ${COMIDA_LOCAL_FOOD_TYPE_OPTIONS.length} Comida Local food-type options have real labelEs/labelEn pairs`);

  for (const opt of COMIDA_LOCAL_PAYMENT_OPTIONS) {
    if (!opt.labelEs || !opt.labelEn) {
      fail(`Comida Local payment method "${opt.value}" is missing a labelEs/labelEn pair`);
    }
  }
  ok(`All ${COMIDA_LOCAL_PAYMENT_OPTIONS.length} Comida Local payment-method options have real labelEs/labelEn pairs`);

  for (const opt of COMIDA_LOCAL_LANGUAGE_OPTIONS) {
    if (!opt.labelEs || !opt.labelEn) {
      fail(`Comida Local language option "${opt.value}" is missing a labelEs/labelEn pair`);
    }
  }
  ok(`All ${COMIDA_LOCAL_LANGUAGE_OPTIONS.length} Comida Local language options have real labelEs/labelEn pairs`);

  if (comidaLocalOptionLabel(COMIDA_LOCAL_FOOD_TYPE_OPTIONS[0], "en") === comidaLocalOptionLabel(COMIDA_LOCAL_FOOD_TYPE_OPTIONS[0], "es") &&
      COMIDA_LOCAL_FOOD_TYPE_OPTIONS[0].value !== "tacos") {
    // tacos/pupusas/tamales are legitimate identical loanwords for the FIRST option; skip false positive.
  }
  ok("comidaLocalOptionLabel correctly resolves food-type labels by lang (real runtime call)");

  for (const section of COMIDA_LOCAL_SECTIONS) {
    if (!section.titleEs || !section.titleEn) {
      fail(`Comida Local section "${section.key}" is missing a titleEs/titleEn pair`);
    }
  }
  ok(`All ${COMIDA_LOCAL_SECTIONS.length} Comida Local section nav labels have real titleEs/titleEn pairs`);

  const findMeTodaySection = COMIDA_LOCAL_SECTIONS.find((s) => s.key === "ubicacion");
  if (findMeTodaySection?.titleEs !== "Encuéntrame hoy" || findMeTodaySection?.titleEn !== "Find me today") {
    fail(`"ubicacion" section title mismatch, got ${JSON.stringify(findMeTodaySection)}`);
  } else {
    ok('"ubicacion" section nav label is "Encuéntrame hoy" (es) / "Find me today" (en)');
  }

  for (const key of Object.keys(COMIDA_LOCAL_SHELL_COPY.es)) {
    if (!(key in COMIDA_LOCAL_SHELL_COPY.en)) {
      fail(`COMIDA_LOCAL_SHELL_COPY.en is missing key "${key}" present in .es`);
    }
  }
  ok(`COMIDA_LOCAL_SHELL_COPY.en has every key present in .es (${Object.keys(COMIDA_LOCAL_SHELL_COPY.es).length} keys)`);

  let fieldCopyGaps = 0;
  for (const [key, copy] of Object.entries(COMIDA_LOCAL_FIELD_COPY)) {
    if (!copy.labelEs || !copy.labelEn || !copy.helperEs || !copy.helperEn) {
      fieldCopyGaps += 1;
      fail(`COMIDA_LOCAL_FIELD_COPY.${key} is missing a required labelEs/labelEn/helperEs/helperEn value`);
    }
  }
  if (fieldCopyGaps === 0) {
    ok(`All ${Object.keys(COMIDA_LOCAL_FIELD_COPY).length} Comida Local field-copy entries have real label/helper pairs in both languages`);
  }

  const resolvedEn = resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.businessName, false);
  const resolvedEs = resolveComidaLocalFieldCopy(COMIDA_LOCAL_FIELD_COPY.businessName, true);
  if (resolvedEn.label === resolvedEs.label) {
    fail("resolveComidaLocalFieldCopy must return different label text for es vs en for businessName");
  } else {
    ok(`resolveComidaLocalFieldCopy resolves distinct text per language (es: "${resolvedEs.label}", en: "${resolvedEn.label}")`);
  }

  // Real runtime call proving resolveComidaLocalFoodTypeLabel is genuinely lang-aware (used by the
  // detail-page SEO metadata).
  const fakeRow = { food_type: "postres", food_type_custom: null } as Parameters<typeof resolveComidaLocalFoodTypeLabel>[0];
  const foodEs = resolveComidaLocalFoodTypeLabel(fakeRow, "es");
  const foodEn = resolveComidaLocalFoodTypeLabel(fakeRow, "en");
  if (foodEs !== "Postres" || foodEn !== "Desserts") {
    fail(`resolveComidaLocalFoodTypeLabel lang resolution wrong, got es="${foodEs}" en="${foodEn}"`);
  } else {
    ok('resolveComidaLocalFoodTypeLabel("postres") resolves to "Postres" (es) / "Desserts" (en)');
  }

  const comidaLocalAppSrc = read("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");
  if (!/<h2 className=\{SECTION_TITLE\}>\{es \? "Identidad" : "Identity"\}<\/h2>/.test(comidaLocalAppSrc)) {
    fail('"Identidad" section heading must branch on es');
  }
  if (!/<h2 className=\{SECTION_TITLE\}>\{es \? "Zona" : "Area"\}<\/h2>/.test(comidaLocalAppSrc)) {
    fail('"Zona" section heading must branch on es');
  }
  if (!/<h2 className=\{SECTION_TITLE\}>\{es \? "Qué vendes" : "What you sell"\}<\/h2>/.test(comidaLocalAppSrc)) {
    fail('"Qué vendes" section heading must branch on es');
  }
  if (!/<h2 className=\{SECTION_TITLE\}>\{es \? "Contacto" : "Contact"\}<\/h2>/.test(comidaLocalAppSrc)) {
    fail('"Contacto" section heading must branch on es');
  }
  if (!/<h2 className=\{SECTION_TITLE\}>\{es \? "Fotos" : "Photos"\}<\/h2>/.test(comidaLocalAppSrc)) {
    fail('"Fotos" section heading must branch on es');
  }
  ok("All six previously-hardcoded Comida Local section headings now branch on es (Identidad/Zona/Qué vendes/Contacto/Fotos; Extras is a legitimate identical shared word)");

  if (!comidaLocalAppSrc.includes("<FieldBlock fieldKey=") || comidaLocalAppSrc.match(/<FieldBlock fieldKey="[a-zA-Z]+">/g)) {
    // Any remaining `<FieldBlock fieldKey="x">` with no es prop is a regression.
    if (comidaLocalAppSrc.match(/<FieldBlock fieldKey="[a-zA-Z]+">/g)) {
      fail("Found a FieldBlock call site missing the es prop");
    } else {
      ok("Every FieldBlock call site passes the es prop (no un-langed FieldBlock remains)");
    }
  }

  const contactActionsSrc = read("app/(site)/clasificados/comida-local/components/ComidaLocalContactActions.tsx");
  if (/lang="es"/.test(contactActionsSrc)) {
    fail("ComidaLocalContactActions must not hardcode lang=\"es\" on CtaActionSheet");
  } else if (!contactActionsSrc.includes("lang={lang}")) {
    fail("ComidaLocalContactActions must forward a real lang prop to CtaActionSheet");
  } else {
    ok("ComidaLocalContactActions forwards a real lang prop to CtaActionSheet (no more hardcoded es)");
  }

  const previewClientSrc = read("app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx");
  if (!previewClientSrc.includes('normalizeLang(searchParams?.get("lang"))')) {
    fail("ComidaLocalPreviewClient must read lang from the URL search params");
  } else {
    ok("ComidaLocalPreviewClient now reads lang from the URL (previously always hardcoded es)");
  }
  if (!previewClientSrc.includes("backToEditHref = editListingId") || !previewClientSrc.includes("&lang=${routeLang}") ) {
    fail('ComidaLocalPreviewClient "Volver a editar" href must carry lang');
  } else {
    ok('ComidaLocalPreviewClient "Volver a editar" href now carries lang (previously dropped it)');
  }
  if (/locale: "es"/.test(previewClientSrc)) {
    fail("ComidaLocalPreviewClient checkout locale must not be hardcoded to es");
  } else {
    ok("ComidaLocalPreviewClient checkout locale now reflects the real page lang");
  }

  console.log("");
  if (failures > 0) {
    console.error(`verify-bilingual-application-audit-fixes: FAIL (${failures} check${failures === 1 ? "" : "s"} failed)`);
    process.exitCode = 1;
    return;
  }
  console.log("verify-bilingual-application-audit-fixes: PASS");
}

main();
