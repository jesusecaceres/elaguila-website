/**
 * TRANSLATE-AD-CONTROL-VIEWER-LANGUAGE-01 (2026-09-15).
 *
 * Owner-identified global UX defect: the shared Translate Ad control's default labels
 * ("Traducir anuncio" / "Show original") never named the viewer's own target language or the
 * content's actual original language — SOURCE CONTENT LANGUAGE and VIEWER UI LANGUAGE were
 * conflated. Fixed once in the shared control (app/components/translation/TranslateAdControl.tsx)
 * so every consumer inherits it; no category file was edited.
 *
 * Execution-first: `buildDefaultLabels` and `translateAdLocaleDisplayName` are pure functions,
 * exercised directly against the owner's exact locked strings. Source assertions pin (a) the
 * engine lines this repair must never touch, (b) that every consumer still inherits the shared
 * control with no local label override, and (c) that only one control implementation exists.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-translate-ad-control-viewer-language-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync, readdirSync } from "node:fs";
import { buildDefaultLabels } from "../app/components/translation/TranslateAdControl";
import { translateAdLocaleDisplayName } from "../app/lib/translation/localeCodes";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

/* ================================================================================================
 * 1-2. Owner's exact locked label contract.
 * ============================================================================================ */
check("English UI + Spanish original: 'Translate to English' / 'View original (Spanish)'", () => {
  const labels = buildDefaultLabels("en", "es");
  assert.equal(labels.translateAd, "Translate to English");
  assert.equal(labels.showOriginal, "View original (Spanish)");
  assert.equal(labels.translating, "Translating…");
});
check("Spanish UI + English original: 'Traducir al español' / 'Ver original (inglés)'", () => {
  const labels = buildDefaultLabels("es", "en");
  assert.equal(labels.translateAd, "Traducir al español");
  assert.equal(labels.showOriginal, "Ver original (inglés)");
  assert.equal(labels.translating, "Traduciendo…");
});

/* ================================================================================================
 * 3. Unknown original locale — never fabricated.
 * ============================================================================================ */
check("Unknown original locale: no fabricated source-language name, in either viewer UI language", () => {
  assert.equal(buildDefaultLabels("en", "unknown").showOriginal, "View original");
  assert.equal(buildDefaultLabels("es", "unknown").showOriginal, "Ver original");
  assert.equal(buildDefaultLabels("en", "unknown").translateAd, "Translate to English");
  assert.equal(buildDefaultLabels("es", "unknown").translateAd, "Traducir al español");
  assert.equal(translateAdLocaleDisplayName("unknown", "en"), null, "unknown never resolves to a name");
  assert.equal(translateAdLocaleDisplayName("unknown", "es"), null, "unknown never resolves to a name");
});
check("Additional known-locale coverage is truthful, not just es/en (no invented target-only scope)", () => {
  assert.equal(translateAdLocaleDisplayName("vi", "en"), "Vietnamese");
  assert.equal(translateAdLocaleDisplayName("vi", "es"), "vietnamita");
  assert.equal(buildDefaultLabels("en", "vi").showOriginal, "View original (Vietnamese)");
  assert.equal(buildDefaultLabels("es", "vi").showOriginal, "Ver original (vietnamita)");
});

/* ================================================================================================
 * 4. Translated state still restores exact original — engine untouched, proven at both layers.
 * ============================================================================================ */
check("Shared control engine lines untouched: translation target, cache key, no-op guard, masking", () => {
  const control = raw("app/components/translation/TranslateAdControl.tsx");
  assert.ok(control.includes("targetLocale: siteLocale,"), "translation target still driven by siteLocale");
  assert.ok(control.includes("cached.targetLocale === siteLocale"), "cache-hit guard unchanged");
  assert.ok(control.includes("sourceLocale: originalLocale,"), "original content locale still passed through, never rewritten");
  assert.ok(control.includes("export function isNoOpTranslation"), "no-op/echo guard still exported and present");
  assert.ok(control.includes("maskTranslatableFields(picked)") && control.includes("unmaskTranslatableFields("), "masking/unmasking unchanged");
  assert.ok(control.includes("buildTranslateCacheKey({"), "cache-key builder unchanged");
  const buildDefaultLabelsSrc = control.slice(
    control.indexOf("export function buildDefaultLabels"),
    control.indexOf("export type TranslateAdControlProps"),
  );
  assert.ok(buildDefaultLabelsSrc.length > 0, "buildDefaultLabels function located in source");
  assert.ok(
    !buildDefaultLabelsSrc.includes("requestTranslation(") && !buildDefaultLabelsSrc.includes("fetch("),
    "label computation makes no translation request — pure lookup only",
  );
});
check("'View Original' restoration is identical across every consumer — falls back to the untouched source object", () => {
  const restorationLines: Record<string, string> = {
    "app/(site)/clasificados/autos/vehiculo/[id]/AutosListingTranslationLayer.tsx": "return listing;",
    "app/(site)/clasificados/viajes/components/ViajesOfferTranslationLayer.tsx": "return offer;",
    "app/(site)/clasificados/empleos/components/EmpleosJobTranslationLayer.tsx": "return job;",
    "app/(site)/servicios/components/ServiciosPublicTranslationLayer.tsx": "return profile;",
    "app/(site)/clasificados/ofertas-locales/lib/useOfertasLocalesPublicTranslation.tsx": "return offer;",
    "app/(site)/clasificados/comida-local/lib/useComidaLocalPublicTranslation.tsx": "return vm;",
    "app/(site)/clasificados/restaurantes/lib/useRestauranteShellTranslation.ts": "return data;",
    "app/(site)/clasificados/rentas/lib/useRentasListingTranslation.ts": "return listing;",
  };
  for (const [file, tail] of Object.entries(restorationLines)) {
    const src = raw(file);
    assert.ok(
      src.includes(`if (!showTranslated || !translation?.translated) ${tail}`),
      `${file}: restoration guard must be untouched`,
    );
  }
});

/* ================================================================================================
 * 5-6. Shared inheritance — Servicios and Autos consume the one shared control, no local override.
 * ============================================================================================ */
check("Servicios consumes the shared control with no local label override", () => {
  const layer = raw("app/(site)/servicios/components/ServiciosPublicTranslationLayer.tsx");
  assert.ok(layer.includes('from "@/app/components/translation/TranslateAdControl"'));
  assert.ok(layer.includes("<TranslateAdControl"));
  assert.ok(!/labels=\{/.test(layer), "Servicios must not override shared labels");
});
check("Autos consumes the shared control with no local label override", () => {
  const layer = raw("app/(site)/clasificados/autos/vehiculo/[id]/AutosListingTranslationLayer.tsx");
  assert.ok(layer.includes('from "@/app/components/translation/TranslateAdControl"'));
  assert.ok(layer.includes("<TranslateAdControl"));
  assert.ok(!/labels=\{/.test(layer), "Autos must not override shared labels");
});
check("No current consumer anywhere overrides the shared control's labels prop", () => {
  const consumers = [
    "app/(site)/servicios/components/ServiciosPublicTranslationLayer.tsx",
    "app/(site)/clasificados/autos/vehiculo/[id]/AutosListingTranslationLayer.tsx",
    "app/(site)/clasificados/viajes/components/ViajesOfferTranslationLayer.tsx",
    "app/(site)/clasificados/empleos/components/EmpleosJobTranslationLayer.tsx",
    "app/(site)/clasificados/ofertas-locales/lib/useOfertasLocalesPublicTranslation.tsx",
    "app/(site)/clasificados/comida-local/lib/useComidaLocalPublicTranslation.tsx",
    "app/(site)/clasificados/restaurantes/shell/RestauranteAdStoryPreview.tsx",
    "app/(site)/clasificados/rentas/listing/[id]/RentasListingDetailClient.tsx",
    "app/(site)/clasificados/anuncio/[id]/page.tsx",
  ];
  for (const file of consumers) {
    const src = raw(file);
    assert.ok(src.includes("<TranslateAdControl"), `${file}: must render the shared control`);
    assert.ok(!/labels=\{/.test(src), `${file}: no local label override introduced`);
  }
});

/* ================================================================================================
 * 7-8. Exactly one shared control; no category-specific duplicate.
 * ============================================================================================ */
check("Exactly one TranslateAdControl implementation exists; icon added there only", () => {
  const files = readdirSync("app/components/translation").filter((f) => /TranslateAdControl/.test(f));
  assert.equal(files.length, 1, "no second implementation file introduced");
  const control = raw("app/components/translation/TranslateAdControl.tsx");
  assert.ok(control.includes('from "react-icons/fi"') && control.includes("FiGlobe"), "shared globe icon present");
  assert.ok(control.includes('aria-hidden'), "icon marked decorative");
});
check("No category-specific duplicate control was introduced by this repair", () => {
  for (const dir of [
    "app/(site)/clasificados/autos",
    "app/(site)/servicios",
    "app/(site)/clasificados/viajes",
    "app/(site)/clasificados/empleos",
  ]) {
    let found = false;
    const walk = (d: string) => {
      for (const entry of readdirSync(new URL(`../${d}`, import.meta.url), { withFileTypes: true })) {
        const rel = `${d}/${entry.name}`;
        if (entry.isDirectory()) walk(rel);
        else if (/\.tsx?$/.test(entry.name) && /^TranslateAdControl/.test(entry.name)) found = true;
      }
    };
    walk(dir);
    assert.ok(!found, `${dir}: no category-local TranslateAdControl file`);
  }
});

if (failures.length) {
  console.error(`\nverify-translate-ad-control-viewer-language-01: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\nverify-translate-ad-control-viewer-language-01: PASS");
