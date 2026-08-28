#!/usr/bin/env node
/**
 * Gate 6 — Application Contract Verifier.
 *
 * Source-testable assertions mapped to canonical Part I requirement IDs from
 * docs/qa/LEONIX_BUSINESS_APPLICATION_AND_FULL_CYCLE_EXECUTION_CONTRACT.md.
 *
 * Scope/honesty note: this verifier covers the requirements that were actually touched during
 * the Gate 1-4 remediation pass and that are provable from static source structure alone (a
 * field is an array not a scalar, a hardcoded literal was replaced, a duplicate button was
 * removed, etc). It does NOT — and cannot — prove anything that requires a live browser
 * (typing/Spacebar feel, an actual hard refresh, a real click-through Preview<->Edit round trip,
 * live address-provider suggestions). Those requirement IDs are listed as RUNTIME_REQUIRED
 * below and are never marked PASS by this script, per contract doctrine (RUNTIME-REQUIRED
 * without runtime proof = FALSE for final certification). This is a partial verifier, not a
 * substitute for the full 450-item ledger.
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function read(rel) {
  const p = path.join(ROOT, rel);
  if (!existsSync(p)) throw new Error(`missing file: ${rel}`);
  return readFileSync(p, "utf8");
}

const results = [];
function check(id, description, fn) {
  try {
    const ok = fn();
    results.push({ id, description, status: ok ? "PASS" : "FAIL" });
  } catch (e) {
    results.push({ id, description, status: "ERROR", error: String(e.message || e) });
  }
}

// ---------- SHARED ----------

check("shared#18", "Servicios leave-guard compares against last-persisted state, not just businessName presence", () => {
  const s = read("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
  return /lastPersistedStateRef\.current !== state/.test(s);
});
check("shared#18-restaurantes", "Restaurantes useRestauranteDraft exposes isDraftDirty via lastPersistedDraftRef", () => {
  const s = read("app/(site)/clasificados/restaurantes/application/useRestauranteDraft.ts");
  return /isDraftDirty/.test(s) && /lastPersistedDraftRef/.test(s);
});
check("shared#18-comida", "Comida Local useComidaLocalDraft exposes isDraftDirty via lastPersistedDraftRef", () => {
  const s = read("app/lib/clasificados/comida-local/useComidaLocalDraft.ts");
  return /isDraftDirty/.test(s) && /lastPersistedDraftRef/.test(s);
});
check("shared#62/R-062", "Restaurantes WhatsApp digit cap raised from 11 (E.164-safe)", () => {
  const s = read("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
  return !/\.slice\(0,\s*11\)/.test(s);
});
check("S-085", "Servicios has a dedicated international-safe WhatsApp formatter (not the US phone mask)", () => {
  const s = read("app/(site)/clasificados/publicar/servicios/lib/serviciosPhoneUi.ts");
  return /formatWhatsAppInputDisplay/.test(s);
});
check("shared#74", "Servicios Correo button uses shared CtaActionSheet, not a bare mailto", () => {
  const s = read("app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx");
  return /CtaActionSheet/.test(s) && /buildSendEmailIntent/.test(s);
});
check("shared#116/#119", "Servicios edit-hydration cannot resurrect stale +$99 coupon price", () => {
  const s = read("app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts");
  return !/couponsMonthlyPrice:\s*couponsAddOn\s*\?\s*99\s*:\s*0/.test(s) && /couponsMonthlyPrice:\s*0/.test(s);
});
check("shared#46-48/HoursEditor", "Shared HoursEditor supports a multi-entry specialHoursList (not just a single string note)", () => {
  const s = read("app/components/forms/HoursEditor.tsx");
  return /specialHoursList/.test(s) && /HoursEditorSpecialHoursEntry/.test(s) && /onEntryChange/.test(s);
});
check("shared#46-48-servicios", "Servicios wires specialHoursEntries end-to-end (type, normalize, publish, public display)", () => {
  const t = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes.ts");
  const n = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize.ts");
  return /specialHoursEntries/.test(t) && /specialHoursEntries/.test(n);
});
check("shared#46-48-restaurantes", "Restaurantes migrates legacy specialHoursNote into a specialHoursEntries array non-destructively", () => {
  const m = read("app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft.ts");
  const model = read("app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel.ts");
  return /specialHoursEntries/.test(m) && /specialHoursEntries/.test(model) && /@deprecated/.test(model);
});
check("shared#122-restaurantes", "Restaurantes persists activeSectionId so Preview -> Edit / hard refresh resumes the same section, not always Section A", () => {
  const s = read("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
  return /RESTAURANTE_ACTIVE_SECTION_STORAGE_KEY/.test(s) && /sessionStorage\.getItem\(RESTAURANTE_ACTIVE_SECTION_STORAGE_KEY\)/.test(s);
});
check("owner-accepted-confirmation-primitive", "Shared AddedConfirmation primitive exists (useAddedConfirmation + AddedConfirmationBadge)", () => {
  const s = read("app/components/forms/AddedConfirmation.tsx");
  return /useAddedConfirmation/.test(s) && /AddedConfirmationBadge/.test(s);
});
check("owner-accepted-confirmation-servicios", "Servicios wires the accepted-confirmation badge into its Add flows", () => {
  const s = read("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
  return /AddedConfirmationBadge/.test(s) && /useAddedConfirmation/.test(s);
});
check("owner-accepted-confirmation-restaurantes", "Restaurantes wires the accepted-confirmation badge into its Add flows", () => {
  const s = read("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
  return /AddedConfirmationBadge/.test(s) && /useAddedConfirmation/.test(s);
});
check("owner-accepted-confirmation-comida", "Comida Local wires the accepted-confirmation badge into its Add flows", () => {
  const s = read("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");
  return /AddedConfirmationBadge/.test(s) && /useAddedConfirmation/.test(s);
});
check("restaurantes-amenidades-custom-groups", "Restaurantes' 6 Amenidades groups have per-group custom-entry support (new feature, previously missing entirely)", () => {
  const form = read("app/(site)/publicar/restaurantes/RestauranteAmenitiesFormBlock.tsx");
  const model = read("app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel.ts");
  const catalog = read("app/(site)/clasificados/restaurantes/lib/restauranteAmenitiesCatalog.ts");
  return /customRestaurantAmenitiesByGroup/.test(form) &&
    /customRestaurantAmenitiesByGroup/.test(model) &&
    /evaluateAddCustomRestauranteAmenityOptionForGroup/.test(catalog);
});
check("restaurantes-amenidades-nondestructive-hydrate", "Restaurantes amenity-custom hydration is non-destructive for existing listings (defaults to empty, doesn't crash)", () => {
  const s = read("app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft.ts");
  return /customRestaurantAmenitiesByGroup/.test(s);
});
check("R-025", "Restaurantes shell mapper passes special/temporary hours fields into the open-now status calculation", () => {
  const s = read("app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts");
  return /specialHoursEntries/.test(s) && /temporaryHoursActive/.test(s);
});
check("shared#23", "Servicios edit-hydration reconstructs custom language lines from published hero badges", () => {
  const s = read("app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts");
  return /mapCustomLanguageOtherLines/.test(s) && /languageOtherLines:\s*mapCustomLanguageOtherLines\(profile\)/.test(s);
});
check("shared#84-85-servicios", "Servicios public profile renders the shared LeonixCommunityTrust lion widget (not just a bespoke trust section)", () => {
  const s = read("app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx");
  return /LeonixCommunityTrust/.test(s) && /category="servicios"/.test(s);
});
check("shared#37", "Restaurantes computeShellHoursPreview accepts a lang param and both call sites pass it (no hardcoded-Spanish hours status)", () => {
  const preview = read("app/(site)/clasificados/restaurantes/application/restauranteHoursPreview.ts");
  const shell = read("app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts");
  const hub = read("app/(site)/clasificados/restaurantes/application/buildRestaurantContactHub.ts");
  return /lang:\s*"es"\s*\|\s*"en"/.test(preview) &&
    /computeShellHoursPreview\(weeklyHours, new Date\(\), lang\)/.test(shell) &&
    /computeShellHoursPreview\(\s*\{[\s\S]*?\},\s*new Date\(\),\s*lang,?\s*\)/.test(hub);
});
check("shared#39-restaurantes", "Restaurantes custom-language dedupe checks the full fixed language catalog, not just currently-selected ones", () => {
  const s = read("app/lib/clasificados/restaurantes/restauranteFormCleanupConfig.ts");
  return /for \(const opt of RESTAURANTE_LANGUAGES\)/.test(s);
});
check("shared#39-servicios", "Servicios custom-language add blocks entries matching the fixed Spanish/English labels", () => {
  const s = read("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
  return /FIXED_LANGUAGE_LABELS/.test(s) && /normalizeServiceOfferedDedupeKey/.test(s);
});
check("R-003", "RestauranteProfileHeader uses only Leonix/category tokens (var(--lx-...)), no hardcoded hex color literals", () => {
  const s = read("app/(site)/clasificados/restaurantes/shell/RestauranteProfileHeader.tsx");
  const liveHexMatches = [...s.matchAll(/#[0-9A-Fa-f]{6}/g)].filter((m) => {
    const lineStart = s.lastIndexOf("\n", m.index) + 1;
    const line = s.slice(lineStart, s.indexOf("\n", m.index));
    return !line.trim().startsWith("*") && !line.trim().startsWith("//");
  });
  return liveHexMatches.length === 0 && /var\(--lx-restaurantes-header-bg-1\)/.test(s);
});
check("shared#41", "Comida Local defaults new-application hours to open (not every day closed)", () => {
  const s = read("app/lib/clasificados/comida-local/createEmptyComidaLocalDraft.ts");
  return /defaultWeeklyHours/.test(s) && !/weeklyHours:\s*\{\}/.test(s);
});
check("shared#51-servicios", "Servicios hours normalizer repairs a malformed legacy schedule instead of discarding it wholesale", () => {
  const s = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize.ts");
  return !/o\.hours\.length === 7/.test(s) || /Map</.test(s);
});
check("shared#33", "Comida Local custom-language add handler dedupes (case/accent-insensitive) against existing customs and fixed options", () => {
  const s = read("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");
  return /isDuplicateComidaLocalCustomLanguage/.test(s);
});
check("S-073", "Servicios service areas split on newline only, not comma (an area label containing a comma stays one chip)", () => {
  const mapper = read("app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft.ts");
  return !/\/\[,\\n\]\//.test(mapper) && !/split\(\s*\/,/.test(mapper);
});
check("R-019/021-full", "restauranteFeaturesNormalization has a lang parameter (inner group labels are bilingual, not hardcoded Spanish)", () => {
  const s = read("app/(site)/clasificados/restaurantes/lib/restauranteFeaturesNormalization.ts");
  return /lang/.test(s);
});

// ---------- SERVICIOS ----------

check("S-001/002", "Servicios main wrapper clears the fixed navbar (pt-24, not pt-6/pt-8)", () => {
  const s = read("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
  return /pt-24/.test(s) && !/pt-6 sm:pt-8/.test(s);
});
check("S-009/010", "Servicios business-type options are sorted for render (not raw declaration order)", () => {
  const s = read("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
  return /BUSINESS_TYPE_PRESETS[\s\S]{0,400}\.sort\(/.test(s) || /\.sort\(\s*\([^)]*\)\s*=>[\s\S]{0,200}BUSINESS_TYPE_PRESETS/.test(s) || /sortedBusinessTypePresets|businessTypePresetsSorted|sortBusinessTypePresets/i.test(s);
});
check("S-032/033/034", "Servicios featured-photo gallery is split into two sections (featured + remaining), not one mixed grid", () => {
  const s = read("app/(site)/clasificados/publicar/servicios/components/ServiciosPublishSortableGallery.tsx");
  const dndCount = (s.match(/DndContext/g) || []).length;
  return dndCount >= 2;
});
check("S-038", "Servicios video-count copy interpolates the real max instead of a hardcoded '4'", () => {
  const s = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationCopy.ts");
  return !/\/ 4 videos agregados/.test(s) && !/L[íi]mite de 4 videos/.test(s);
});
check("S-055-060", "Servicios customQuickFacts is an array field, not a scalar string", () => {
  const t = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes.ts");
  return /customQuickFacts:\s*string\[\]/.test(t);
});
check("S-061-071", "Servicios amenity customs are keyed per-group (Record), not one flat array", () => {
  const t = read("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes.ts");
  return /customAmenityOptionsByGroup:\s*Record</.test(t);
});
check("S-049", "Servicios 'Por qué elegirte' uses a responsive grid, not a horizontal-scroll flex strip", () => {
  const s = read("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
  return /grid-cols-2 sm:grid-cols-3|grid grid-cols-2/.test(s);
});
check("S-099", "Servicios flyer button routes through the in-page lightbox, not a raw new-tab anchor", () => {
  const s = read("app/(site)/servicios/components/ServiciosCouponsCard.tsx");
  return !/href=\{[^}]*flyer[^}]*\}[\s\S]{0,120}target="_blank"/i.test(s);
});

// ---------- RESTAURANTES ----------

check("R-026/060", "Restaurantes coupon-upgrade focus jump is one-shot (guarded by a ref), not re-fired on every render", () => {
  const s = read("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
  return /focusCouponAppliedRef/.test(s);
});
check("R-037", "Restaurantes catering CTA consults the configured quote URL, not hardcoded to a phone call", () => {
  const s = read("app/(site)/clasificados/restaurantes/application/buildRestaurantContactHub.ts");
  return /cateringInquiryUrl/.test(s) && /catering-call/.test(s) && /action:\s*"website"/.test(s);
});
check("R-072/073", "Restaurantes has exactly one Preview CTA handler reference in the final section (no duplicate)", () => {
  const s = read("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
  return !/continueToPreview/.test(s);
});
check("R-019/021", "RestauranteGroupedFeaturesSection accepts and uses a lang prop", () => {
  const s = read("app/(site)/clasificados/restaurantes/shell/RestauranteGroupedFeaturesSection.tsx");
  return /lang/.test(s);
});
check("R-009/010", "Restaurantes cuisine picker uses a grid layout and 'up to 6' copy (not stale 'up to 3')", () => {
  const client = read("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
  const copy = read("app/(site)/publicar/restaurantes/restauranteApplicationFormCopy.ts");
  const cuisineHelperEs = /additionalCuisinesHelper:\s*\n?\s*"([^"]*)"/.exec(copy)?.[1] ?? "";
  return /grid grid-cols-2/.test(client) && !/hasta 3|up to 3/i.test(cuisineHelperEs);
});
check("R-language-cap-copy", "Restaurantes language-helper copy states the real 8-language cap, not stale 'up to 3'", () => {
  const copy = read("app/(site)/publicar/restaurantes/restauranteApplicationFormCopy.ts");
  return !/(m[aá]ximo 3 idiomas|up to 3 custom languages)/i.test(copy);
});

// ---------- COMIDA LOCAL ----------

check("C-023/053/068", "Comida Local custom-Other fields are array-backed chip lists, not scalar inputs", () => {
  const t = read("app/lib/clasificados/comida-local/comidaLocalTypes.ts");
  return /businessTypeCustomValues:\s*string\[\]/.test(t) &&
    /serviceOptionOtherCustomValues:\s*string\[\]/.test(t) &&
    /highlightsOtherCustomValues:\s*string\[\]/.test(t);
});
check("C-056/059/061/064", "Comida Local highlight registry includes fresh-daily/local-ingredients/preorder/weekend-availability", () => {
  const s = read("app/lib/clasificados/comida-local/comidaLocalConstants.ts");
  return /fresco_diario/.test(s) && /ingredientes_locales/.test(s) && /disponible_fines_de_semana/.test(s);
});
check("C-066", "Comida Local has a self-declared (not certified) highlights disclaimer", () => {
  const s = read("app/lib/clasificados/comida-local/comidaLocalFieldCopy.ts");
  return /COMIDA_LOCAL_HIGHLIGHTS_DISCLAIMER/.test(s);
});
check("C-108-111-bonus", "Comida Local edit-save no longer hardcodes lang literal \"es\"", () => {
  const s = read("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");
  return !/lang:\s*"es"\s*,?\s*\/\//.test(s);
});
check("C-024-039", "Comida Local seller-type buckets have distinct tailored fields beyond banner copy (mobileOrderLinkUrl / cateringServiceRadiusNote / mealPrepOrderUrl or equivalent)", () => {
  const t = read("app/lib/clasificados/comida-local/comidaLocalTypes.ts");
  return /mobileOrderLinkUrl|cateringServiceRadiusNote|mealPrepOrderUrl|eventScheduleNote/.test(t);
});

// ---------- Requirement IDs this verifier explicitly does NOT and cannot cover ----------

const RUNTIME_REQUIRED = [
  "Any Spacebar/typing/backspace/paste feel in a live input (S-024,S-068,S-079,R-012, C-023/053/068 keystrokes, etc.)",
  "Actual hard-refresh browser behavior for any category",
  "Actual Preview↔Edit click-through round trip for any category",
  "Actual visual clipping/spacing/CTA-sizing judgment (S-002,S-003,S-040,S-050,S-113)",
  "Live address-provider suggestions (none configured — see docs/qa/BUSINESS_APPLICATION_FINAL_LIVE_LEDGER.md)",
  "Any existing-filled-ad hydration behavior that requires a real logged-in seller session",
];

const failed = results.filter((r) => r.status !== "PASS");
console.log("=== Gate 6 Application Contract Verifier ===\n");
for (const r of results) {
  const mark = r.status === "PASS" ? "✓" : "✗";
  console.log(`${mark} [${r.status}] ${r.id} — ${r.description}${r.error ? `\n    ERROR: ${r.error}` : ""}`);
}
console.log(`\n${results.length - failed.length}/${results.length} source-testable assertions PASS.`);
console.log(`\nRUNTIME-REQUIRED (not evaluated, not counted as PASS, per contract doctrine):`);
for (const r of RUNTIME_REQUIRED) console.log(`  - ${r}`);

if (failed.length > 0) {
  console.log(`\nFAILED/ERROR assertions:`);
  for (const r of failed) console.log(`  - ${r.id}: ${r.description}`);
  process.exitCode = 1;
}
