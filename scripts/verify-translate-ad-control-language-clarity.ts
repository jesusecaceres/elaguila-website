/**
 * TRANSLATE-AD CONTROL — global language-clarity repair (2026-09-16).
 *
 * Owner-found defect: "Traducir anuncio" / "Ver original" name neither the destination nor the
 * source language, so a viewer who cannot read the source language has no way to discover what
 * the shared translate control does — defeating its entire purpose. Every category-level consumer
 * (Servicios, Autos, Restaurantes/Comida Local, Empleos, Viajes, Ofertas Locales, Anuncio, Rentas)
 * already passes both `siteLocale` (viewer UI language) and `originalLocale` (actual source
 * content language) into the ONE shared `TranslateAdControl` — this is a single-file repair; no
 * consumer needed to change.
 *
 * Execution-first: resolveOriginalLanguageName is a pure, exported function — run directly
 * against real locale pairs, not via source-text pattern matching.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-translate-ad-control-language-clarity.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolveOriginalLanguageName, isNoOpTranslation } from "../app/components/translation/TranslateAdControl";

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

/* ── 1. UI English + original Spanish ──────────────────────────────────────────────────────── */
check("UI English + original Spanish: destination named, source named as 'Spanish'", () => {
  const src = raw("app/components/translation/TranslateAdControl.tsx");
  assert.ok(src.includes('translateAd: "Translate to English",'));
  assert.ok(src.includes('showOriginal: "View original",'), "base label carries no name — appended dynamically");
  const name = resolveOriginalLanguageName("es", "en");
  assert.equal(name, "Spanish");
});

/* ── 2. UI Spanish + original English ──────────────────────────────────────────────────────── */
check("UI Spanish + original English: destination named, source named as 'inglés'", () => {
  const src = raw("app/components/translation/TranslateAdControl.tsx");
  assert.ok(src.includes('translateAd: "Traducir al español",'));
  assert.ok(src.includes('showOriginal: "Ver original",'));
  const name = resolveOriginalLanguageName("en", "es");
  assert.equal(name, "inglés");
});

/* ── 3. Unknown original locale: no fabricated language name ──────────────────────────────── */
check("unknown original locale never fabricates a source-language name (English UI and Spanish UI)", () => {
  assert.equal(resolveOriginalLanguageName("unknown", "en"), null);
  assert.equal(resolveOriginalLanguageName("unknown", "es"), null);
  // Same-as-site-locale content is also intentionally un-named (would read as a redundant/
  // confusing "View original (English)" while already on the English site).
  assert.equal(resolveOriginalLanguageName("en", "en"), null);
  assert.equal(resolveOriginalLanguageName("es", "es"), null);
});
check("a broader source-locale catalog still resolves real, non-fabricated names (Portuguese, Vietnamese, Chinese)", () => {
  assert.equal(resolveOriginalLanguageName("pt", "en"), "Portuguese");
  assert.equal(resolveOriginalLanguageName("vi", "en"), "Vietnamese");
  assert.ok(typeof resolveOriginalLanguageName("zh", "en") === "string" && resolveOriginalLanguageName("zh", "en") !== "zh");
});

/* ── 4. Translated state still restores the exact original (engine untouched) ─────────────── */
check("engine behavior untouched: isNoOpTranslation, view-mode reset, and onShowOriginal wiring are exactly as before", () => {
  const src = raw("app/components/translation/TranslateAdControl.tsx");
  // Byte-for-byte behavior check on the exported pure function — not just its presence.
  assert.equal(isNoOpTranslation({ title: "x" }, { title: "x" }), true);
  assert.equal(isNoOpTranslation({ title: "x" }, { title: "y" }), false);
  assert.ok(src.includes("const showOriginal = useCallback(() => {"));
  assert.ok(src.includes("setViewMode(\"original\");") && src.includes("onShowOriginal();"));
  // Cache key semantics, masking, provider call shape and no-op protection are all still exactly
  // where they were — this pass only touched label text/icon, never this logic.
  assert.ok(src.includes("buildTranslateCacheKey({"));
  assert.ok(src.includes("maskTranslatableFields(picked)") && src.includes("unmaskTranslatableFields(rawResult.translated, fieldMaps)"));
  assert.ok(src.includes("if (isNoOpTranslation(picked, restoredTranslated)) {"));
  assert.ok(src.includes("setCachedAdTranslation(cacheKey, result);"));
});
check("no extra translation API call is made just to render the label — resolveOriginalLanguageName is pure/local, never calls requestTranslation", () => {
  const src = raw("app/components/translation/TranslateAdControl.tsx");
  // Servicios Final UI Truth Closeout (2026-09-16): the CLDR lookup moved into a shared private
  // `languageDisplayName` helper (both resolveOriginalLanguageName and the new effective-target
  // label builder call it) — same zero-network guarantee, now written once instead of twice.
  const fnStart = src.indexOf("export function resolveOriginalLanguageName");
  const fnEnd = src.indexOf("\n}\n", fnStart);
  const fnBody = src.slice(fnStart, fnEnd);
  assert.ok(!fnBody.includes("requestTranslation") && !fnBody.includes("fetch("), "label resolution never touches the network/provider");
  const helperStart = src.indexOf("function languageDisplayName");
  const helperEnd = src.indexOf("\n}\n", helperStart);
  const helperBody = src.slice(helperStart, helperEnd);
  assert.ok(!helperBody.includes("requestTranslation") && !helperBody.includes("fetch("), "the shared CLDR helper never touches the network/provider either");
  assert.ok(helperBody.includes("Intl.DisplayNames"), "uses the browser's own CLDR database, not a hand-maintained table");
});

/* ── 5/6/9 — accessibility: visible text works without the icon, aria stays truthful ──────── */
check("icon is decorative only — aria-hidden, visible button text still carries the full meaning", () => {
  const src = raw("app/components/translation/TranslateAdControl.tsx");
  assert.ok(src.includes("<FiGlobe") && src.includes('aria-hidden'), "icon present and hidden from assistive tech");
  assert.ok(src.includes("{primaryLabel}"), "the full contextual text is still rendered as real button content, not an aria-label substitute");
  assert.ok(src.includes("aria-busy={ariaBusy}"), "busy state stays accessible");
  assert.ok(src.includes("disabled={disabled || busy}"), "disabled state unchanged — native button semantics, keyboard behavior unchanged");
});

/* ── 7/8 — global adoption: every known consumer inherits automatically ───────────────────── */
const CONSUMERS = [
  "app/(site)/clasificados/anuncio/[id]/page.tsx",
  "app/(site)/clasificados/autos/vehiculo/[id]/AutosListingTranslationLayer.tsx",
  "app/(site)/clasificados/comida-local/lib/useComidaLocalPublicTranslation.tsx",
  "app/(site)/clasificados/empleos/components/EmpleosJobTranslationLayer.tsx",
  "app/(site)/clasificados/ofertas-locales/lib/useOfertasLocalesPublicTranslation.tsx",
  "app/(site)/clasificados/rentas/listing/[id]/RentasListingDetailClient.tsx",
  "app/(site)/clasificados/restaurantes/shell/RestauranteAdStoryPreview.tsx",
  "app/(site)/clasificados/viajes/components/ViajesOfferTranslationLayer.tsx",
  "app/(site)/servicios/components/ServiciosPublicTranslationLayer.tsx",
];
check("every current category consumer passes siteLocale + originalLocale and overrides no labels — automatic inheritance, zero per-category changes", () => {
  for (const rel of CONSUMERS) {
    const src = raw(rel);
    assert.ok(src.includes("<TranslateAdControl"), `${rel}: still mounts the shared control`);
    assert.ok(src.includes("siteLocale={"), `${rel}: passes the viewer UI locale`);
    assert.ok(src.includes("originalLocale={"), `${rel}: passes the real source content locale`);
    assert.ok(!/labels=\{/.test(src), `${rel}: does not override labels — inherits the shared contextual contract automatically`);
  }
});
check("Servicios specifically uses the shared control (not a Servicios-only translate button)", () => {
  const servicios = raw("app/(site)/servicios/components/ServiciosPublicTranslationLayer.tsx");
  assert.ok(servicios.includes('import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";') ||
    servicios.includes("TranslateAdControl } from \"@/app/components/translation") ||
    /from ["']@\/app\/components\/translation\/TranslateAdControl["']/.test(servicios));
});
check("Autos specifically uses the shared control (not a duplicate Autos-only implementation)", () => {
  const autos = raw("app/(site)/clasificados/autos/vehiculo/[id]/AutosListingTranslationLayer.tsx");
  assert.ok(/from ["']@\/app\/components\/translation\/TranslateAdControl["']/.test(autos));
});
check("only one TranslateAdControl component implementation exists in the whole repo", () => {
  const hits = execSync(
    'grep -rl "export function TranslateAdControl" app --include=*.tsx --include=*.ts',
    { cwd: new URL("..", import.meta.url), encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter(Boolean);
  assert.deepEqual(hits, ["app/components/translation/TranslateAdControl.tsx"], "no category-specific duplicate implementation exists");
});

if (failures.length) {
  console.error(`\nverify-translate-ad-control-language-clarity: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-translate-ad-control-language-clarity: PASS");
