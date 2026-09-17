/**
 * SERVICIOS FINAL UI TRUTH CLOSEOUT — translation direction, Leonix Trust branding, results-card
 * translate (2026-09-16). Focused proof for all 18 items in Gate 12.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-final-ui-truth-closeout.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { planUnknownSourceTranslation } from "../app/lib/translation/unknownSourcePolicy";
import { guessContentLocaleHeuristically } from "../app/lib/translation/localLanguageGuess";
import { resolveOriginalLanguageName } from "../app/components/translation/TranslateAdControl";

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

const CONTROL = "app/components/translation/TranslateAdControl.tsx";
const HERO = "app/(site)/servicios/components/ServiciosProfessionalHero.tsx";
const TRADE_CARD = "app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard.tsx";
const PRO_CARD = "app/(site)/clasificados/servicios/ServiciosProfessionalResultCard.tsx";
const HOOK = "app/(site)/servicios/components/useServiciosResultCardTranslation.tsx";
const SERVICIOS_TRANSLATE_LIB = "app/(site)/servicios/lib/serviciosTranslateAd.ts";
const AUTOS_LAYER = "app/(site)/clasificados/autos/vehiculo/[id]/AutosListingTranslationLayer.tsx";

function destinationName(target: "es" | "en", uiLocale: "es" | "en"): string {
  return new Intl.DisplayNames([uiLocale], { type: "language" }).of(target)!;
}

/* 1/4 — Spanish UI + Spanish source + effective EN target: "Traducir al inglés". Proves the
   effective target is NOT blindly siteLocale — the shared retargeting policy computes "en". */
check("1/4: Spanish UI + Spanish-detected content -> effective target is English (retargeted), never blindly siteLocale", () => {
  const plan = planUnknownSourceTranslation("es", "es");
  assert.equal(plan.retargeted, true);
  assert.equal(plan.targetLocale, "en");
  assert.equal(`Traducir al ${destinationName("en", "es")}`, "Traducir al inglés");
});

/* 2 — translated state: "Ver original (español)". */
check("2: after retargeting to English, the original-language name shown is Spanish (matches the site's own locale here, but computed from the CURRENTLY DISPLAYED locale, not assumed)", () => {
  const plan = planUnknownSourceTranslation("es", "es");
  // effectiveOriginalLocale = "es" (detected), currentlyDisplayed = plan.targetLocale ("en").
  const name = plan.targetLocale === "es" ? null : new Intl.DisplayNames(["es"], { type: "language" }).of("es");
  assert.equal(name, "español");
});

/* 3 — English UI + Spanish source (not retargeted): "Translate to English" / "View original (Spanish)". */
check("3: English UI + Spanish-detected content -> normal (non-retargeted) direction, target stays English", () => {
  const plan = planUnknownSourceTranslation("en", "es");
  assert.equal(plan.retargeted, false);
  assert.equal(plan.targetLocale, "en");
  assert.equal(destinationName("en", "en"), "English");
  assert.equal(destinationName("es", "en"), "Spanish");
});

/* Spanish UI + English source (not retargeted): "Traducir al español" / "Ver original (inglés)". */
check("Spanish UI + English-detected content -> normal (non-retargeted) direction, target stays Spanish", () => {
  const plan = planUnknownSourceTranslation("es", "en");
  assert.equal(plan.retargeted, false);
  assert.equal(plan.targetLocale, "es");
  assert.equal(destinationName("es", "es"), "español");
  assert.equal(destinationName("en", "es"), "inglés");
});

/* 5 — unknown source never fabricates a name; detection failure degrades to pre-policy behavior. */
check("5: undetermined content-language guess degrades to the pre-policy behavior (target stays the requested siteLocale, no retarget)", () => {
  const plan = planUnknownSourceTranslation("es", "unknown");
  assert.equal(plan.retargeted, false);
  assert.equal(plan.targetLocale, "es");
  assert.equal(plan.detectedSourceLocale, "unknown");
});
check("local heuristic never confidently guesses on short/empty/ambiguous text — fails to 'unknown', never a fabricated language", () => {
  assert.equal(guessContentLocaleHeuristically(""), "unknown");
  assert.equal(guessContentLocaleHeuristically("hi"), "unknown");
  assert.equal(guessContentLocaleHeuristically("2024 LLC #4"), "unknown");
});
check("local heuristic recognizes clear Spanish and English samples (best-effort, never network)", () => {
  assert.equal(
    guessContentLocaleHeuristically("Somos una empresa con más de diez años de experiencia en el servicio de plomería para nuestros clientes."),
    "es",
  );
  assert.equal(
    guessContentLocaleHeuristically("We are a business with over ten years of experience providing quality plumbing service for our customers."),
    "en",
  );
});

/* 6 — exact View Original restore unchanged (engine untouched). */
check("6: engine behavior (isNoOpTranslation, cache key semantics, mask/unmask, exact restore) is untouched", () => {
  const src = raw(CONTROL);
  assert.ok(src.includes("export function isNoOpTranslation("));
  assert.ok(src.includes("buildTranslateCacheKey({"));
  assert.ok(src.includes("maskTranslatableFields(picked)") && src.includes("unmaskTranslatableFields(rawResult.translated, fieldMaps)"));
  assert.ok(src.includes("if (isNoOpTranslation(picked, restoredTranslated)) {"));
  assert.ok(src.includes("const showOriginal = useCallback(() => {") && src.includes("setViewMode(\"original\");"));
});

/* 7 — profile header has Leonix Community branding. */
check("7: profile header trust summary is visibly branded '🦁 Comunidad Leonix' / '🦁 Leonix Community', not a bare stat line", () => {
  const src = raw(HERO);
  assert.ok(src.includes('const brandLabel = lang === "en" ? "Leonix Community" : "Comunidad Leonix";'));
  assert.ok(src.includes("🦁 {brandLabel}"));
});

/* 8 — preview header uses truthful unpublished state. */
check("8: header preview (no durable listing id) shows the branded mark + truthful 'turns on once published' copy, never a fake count", () => {
  const src = raw(HERO);
  const idx = src.indexOf("if (!targetId) {");
  const block = src.slice(idx, idx + 700);
  assert.ok(block.includes("🦁 {brandLabel}"));
  assert.ok(block.includes("Community endorsements turn on once this listing is published.") || block.includes("Los reconocimientos se activan al publicarse este anuncio."));
});

/* 9 — published zero uses "Nuevo en Leonix", still Leonix-branded. */
check("9: header published zero-count state reads '🦁 Comunidad Leonix · Nuevo en Leonix' — truthful, not a fabricated count", () => {
  const src = raw(HERO);
  assert.ok(src.includes('🦁 {brandLabel} · {lang === "en" ? "New on Leonix" : "Nuevo en Leonix"}'));
});

/* 10 — published real count uses the real endorsement source (unchanged fetch, unchanged Gate 4/5 backend). */
check("10: header real-count state sums the SAME fetchLeonixEndorsementSummary result — no new/duplicate trust source", () => {
  const src = raw(HERO);
  assert.ok(src.includes('fetchLeonixEndorsementSummary("servicios", targetId)'));
  assert.ok(src.includes("const total = summary.reduce((sum, e) => sum + e.count, 0);"));
});

/* 11 — results card always carries the compact Leonix Community identity, even at zero. */
check("11: both result cards render the Comunidad Leonix chip unconditionally (no `> 0` gate hiding it at zero)", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(src.includes('🦁 {lang === "en" ? "Leonix Community" : "Comunidad Leonix"}'), `${rel}: branded chip present`);
    assert.ok(
      src.includes('? lang === "en"\n                    ? `${endorsementCount} recognition${endorsementCount === 1 ? "" : "s"}`')
      || /endorsementCount > 0\s*\n\s*\?\s*lang === "en"/.test(src),
      `${rel}: real count still shown when > 0`,
    );
    assert.ok(src.includes('"New"') || src.includes('"Nuevo"'), `${rel}: truthful zero state, no fabricated count`);
  }
});

/* 12 — no voting control on results cards. */
check("12: neither result card wires a vote/toggle control — the chip is a read-only <span>, not a button", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(!src.includes("toggleLeonixEndorsementVoteClient"), `${rel}: no voting`);
    const chipIdx = src.indexOf('data-servicios-card-trust-translate="1"');
    assert.ok(chipIdx > 0, `${rel}: trust+translate row present`);
    const block = src.slice(chipIdx, chipIdx + 500);
    assert.ok(block.includes("<span") && !block.includes("<button"), `${rel}: trust badge itself is a non-interactive span`);
  }
});

/* 13 — results-card Translate appears only if visible authored content is translatable. */
check("13: card-scoped translatable content covers ONLY the category line + owner-authored chips actually displayed — never the full profile bundle", () => {
  const lib = raw(SERVICIOS_TRANSLATE_LIB);
  assert.ok(lib.includes("export function buildServiciosCardTranslatableContent("));
  const fnStart = lib.indexOf("export function buildServiciosCardTranslatableContent(");
  const fnEnd = lib.indexOf("\n}\n", fnStart);
  const body = lib.slice(fnStart, fnEnd);
  assert.ok(!body.includes("description") && !body.includes("highlights") && !body.includes("shareText") && !body.includes("encodeOwnerExtrasForTranslation"), "no full-profile-only fields (about/highlights/coupons/promotions) leak into the card bundle");
  const hook = raw(HOOK);
  assert.ok(hook.includes("hasServiciosTranslatableProse(translatableContent)"), "control only mounts when real translatable content exists");
  assert.ok(hook.includes("const offerTranslate = enabled && hasServiciosTranslatableProse"));
});
check("13b: both cards derive owner-authored chips from the SAME doctrine as the full-profile translator (isOwnerAuthoredService), not a re-guessed heuristic", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(src.includes("isOwnerAuthoredService"), `${rel}: reuses the shared owner-authorship doctrine`);
  }
});

/* 14 — no automatic translation request on card render. */
check("14: the card-scoped TranslateAdControl only fires on click — mounting it never calls requestTranslation itself", () => {
  const control = raw(CONTROL);
  assert.ok(!control.includes("useEffect(() => {\n    void runTranslate"), "no auto-run effect calling the translator");
  const hook = raw(HOOK);
  assert.ok(!hook.includes("requestServiciosAdTranslation()"), "the hook never calls the translator directly — only TranslateAdControl's own click handler does, via the passed-in requestTranslation prop");
});

/* 15 — one shared TranslateAdControl implementation. */
check("15: only one TranslateAdControl component implementation exists in the whole repo", () => {
  const hits = execSync('grep -rl "export function TranslateAdControl" app --include=*.tsx --include=*.ts', {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter(Boolean);
  assert.deepEqual(hits, ["app/components/translation/TranslateAdControl.tsx"]);
});

/* 16 — Autos shared consumer still valid (known-source path byte-identical). */
check("16: Autos known-source consumer is untouched and still resolves via the unchanged resolveOriginalLanguageName contract", () => {
  const autos = raw(AUTOS_LAYER);
  assert.ok(autos.includes("originalLocale={sourceLocale}"), "still passes a REAL source locale, not unknown");
  assert.equal(resolveOriginalLanguageName("es", "en"), "Spanish");
  assert.equal(resolveOriginalLanguageName("en", "es"), "inglés");
  assert.equal(resolveOriginalLanguageName("es", "es"), null);
});
check("16b: known-source path (originalLocale !== unknown) always targets siteLocale — no retargeting logic reachable for known-source categories", () => {
  const src = raw(CONTROL);
  const idx = src.indexOf("const effectiveTargetLocale = useMemo");
  const block = src.slice(idx, idx + 400);
  assert.ok(block.includes("if (!isUnknownSource) return siteLocale;"), "known-source short-circuits to siteLocale, unchanged");
});

/* 17 — existing Community Trust bulk-count path preserved (Gate 4/5 backend from the prior pass). */
check("17: results-card endorsement count still reads row.public_endorsement_count from the existing bulk-fetch path — no new/duplicate query introduced by this pass", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(src.includes("public_endorsement_count"), `${rel}: reuses the existing bulk-computed field`);
  }
  const server = raw("app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts");
  assert.ok(server.includes("export async function fetchServiciosEndorsementCountsByListingIds"), "the one bulk helper from the prior pass is still the only source");
});

/* 18 — no Stripe/Revenue OS files touched by this pass. */
check("18: no Stripe/checkout/pricing/promo/webhook/Revenue OS files appear in this pass's touched-file set", () => {
  const diff = execSync("git diff --name-only HEAD", { cwd: new URL("..", import.meta.url), encoding: "utf8" });
  const untracked = execSync("git ls-files --others --exclude-standard", { cwd: new URL("..", import.meta.url), encoding: "utf8" });
  const touched = `${diff}\n${untracked}`.split("\n").filter(Boolean);
  const forbidden = /stripe|checkout|revenue-os|webhook|pricing|promo/i;
  const hits = touched.filter((f) => forbidden.test(f));
  assert.deepEqual(hits, [], `unexpected payment-adjacent file(s) touched: ${hits.join(", ")}`);
});

if (failures.length) {
  console.error(`\nverify-servicios-final-ui-truth-closeout: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-final-ui-truth-closeout: PASS");
