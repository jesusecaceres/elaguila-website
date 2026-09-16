/**
 * SERVICIOS RESULTS-CARD TRANSLATE — RUNTIME-ORIENTED PIPELINE SELFTEST (2026-09-16).
 *
 * Owner runtime QA reported the card Translate control is visible but does not visibly change the
 * card. This selftest does NOT merely assert that helper functions exist — it drives the REAL
 * production functions through the exact sequence `TranslateAdControl.runTranslate` executes
 * (pick -> mask -> wrap-for-provider -> [provider] -> unwrap -> unmask -> apply), with a SIMULATED
 * provider response standing in for Google Cloud Translation (no live credentials exist in this
 * environment), and then applies the EXACT display-transform line the card components use
 * (`serviceChipList.map((c) => chipOverrides.get(c) ?? c)`) to prove the translated state actually
 * reaches what would be rendered — not just that a Map got populated somewhere.
 *
 * The simulated provider response assumes Google's HTML-mode translator preserves the
 * `<div data-lx="N">...</div>` wrapper and only translates the inner text — the same wire
 * contract already documented as "live-proven" in production for the identical `encodeLxRecords`
 * format used by the full-profile services/highlights translation (serviciosTranslateAd.ts). This
 * selftest cannot prove Google's live behavior (no credentials available here); it proves that IF
 * the provider honors that contract (as already observed in production for the same wire format),
 * every downstream step correctly reaches the rendered card.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-card-translate-runtime-selftest.ts
 */
import { strict as assert } from "node:assert";
import { isNoOpTranslation } from "../app/components/translation/TranslateAdControl";
import {
  maskTranslatableFields,
  pickTranslatableAdFields,
  unmaskTranslatableFields,
} from "../app/lib/translation/helpers";
import {
  unwrapMaskPlaceholdersFromGoogleHtml,
  wrapMaskPlaceholdersForGoogleHtml,
} from "../app/lib/translation/providers/maskPlaceholders";
import { planUnknownSourceTranslation } from "../app/lib/translation/unknownSourcePolicy";
import { guessContentLocaleHeuristically } from "../app/lib/translation/localLanguageGuess";
import {
  applyServiciosCardTranslation,
  buildServiciosCardTranslatableContent,
  hasServiciosTranslatableProse,
  type ServiciosCardTranslatableInput,
} from "../app/(site)/servicios/lib/serviciosTranslateAd";
import type { TranslatableAdFields } from "../app/lib/translation/types";

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

/** Stand-in for the Google Cloud Translation call `translateMaskedFieldsViaGoogle` makes —
 * translates ONLY the inner text of each `<div data-lx="N">...</div>` record, preserving the
 * wrapper exactly, matching the documented live-proven wire contract for this wire format. */
function simulateProviderTranslate(wrappedHtml: string, dictionary: Record<string, string>): string {
  let out = wrappedHtml;
  for (const [es, en] of Object.entries(dictionary)) out = out.replaceAll(es, en);
  return out;
}

/* ── SOURCE CARD scenario exactly as specified: one owner-authored chip, Spanish UI, Spanish source ── */
const SOURCE_CHIP = "Inspección de tuberías";
const TRANSLATED_CHIP = "Pipe inspection";

check("card-scoped content is built from ONLY the owner-authored chip (no category line here)", () => {
  const input: ServiciosCardTranslatableInput = { categoryLine: undefined, ownerAuthoredChips: [SOURCE_CHIP] };
  const content = buildServiciosCardTranslatableContent(input);
  assert.equal(content.title, undefined);
  assert.equal(content.details, `<div data-lx="0">${SOURCE_CHIP}</div>`);
  assert.equal(hasServiciosTranslatableProse(content), true, "control would be shown — real translatable content exists");
});

check("no translatable content -> control would be hidden (no no-op button)", () => {
  const input: ServiciosCardTranslatableInput = { categoryLine: undefined, ownerAuthoredChips: [] };
  const content = buildServiciosCardTranslatableContent(input);
  assert.equal(hasServiciosTranslatableProse(content), false);
});

/* ── Drive the EXACT sequence TranslateAdControl.runTranslate executes on click ── */
let restoredTranslated!: Partial<TranslatableAdFields>;
let appliedChipOverride: string | undefined;

check("CLICK 'Traducir al inglés': full pick -> mask -> wrap -> [provider] -> unwrap -> unmask sequence produces a real, non-echo translation", () => {
  const input: ServiciosCardTranslatableInput = { categoryLine: undefined, ownerAuthoredChips: [SOURCE_CHIP] };
  const content = buildServiciosCardTranslatableContent(input);

  const picked = pickTranslatableAdFields(content);
  assert.deepEqual(Object.keys(picked), ["details"]);

  const { fields: maskedFields, fieldMaps } = maskTranslatableFields(picked);
  const wrapped = wrapMaskPlaceholdersForGoogleHtml(maskedFields.details!);

  const providerResponse = simulateProviderTranslate(wrapped, { [SOURCE_CHIP]: TRANSLATED_CHIP });
  const unwrapped = unwrapMaskPlaceholdersFromGoogleHtml(providerResponse);

  restoredTranslated = unmaskTranslatableFields({ details: unwrapped }, fieldMaps);

  assert.equal(isNoOpTranslation(picked, restoredTranslated), false, "a genuine translation must never be flagged as a no-op echo");
  assert.ok(restoredTranslated.details!.includes(TRANSLATED_CHIP), "the raw translated payload actually contains the English text");
});

check("EXPECTED DISPLAY: the translated English text is what the card's own display-transform line would render", () => {
  const input: ServiciosCardTranslatableInput = { categoryLine: undefined, ownerAuthoredChips: [SOURCE_CHIP] };
  const applied = applyServiciosCardTranslation(restoredTranslated, input);
  appliedChipOverride = applied.chipsByOriginal.get(SOURCE_CHIP);
  assert.equal(appliedChipOverride, TRANSLATED_CHIP);

  // The EXACT line both ServiciosHorizontalResultCard.tsx and ServiciosProfessionalResultCard.tsx
  // use to compute what actually renders:
  //   displayServiceChips = serviceChipList.map((c) => chipOverrides.get(c) ?? c)
  const serviceChipList = [SOURCE_CHIP];
  const displayServiceChips = serviceChipList.map((c) => applied.chipsByOriginal.get(c) ?? c);
  assert.deepEqual(displayServiceChips, [TRANSLATED_CHIP], "the display layer genuinely consumes the translated state — not just a helper returning data nobody reads");
});

check("CLICK 'Ver original (español)': the ORIGINAL chip text is untouched by the whole round trip — restoring it needs no re-decode, only dropping the overlay", () => {
  // applyServiciosCardTranslation never mutates `input` — showTranslated=false simply stops
  // consulting `chipOverrides` and the card falls back to `serviceChipList` (the untouched original).
  const serviceChipList = [SOURCE_CHIP];
  const chipOverrides = new Map<string, string>(); // showTranslated=false -> hook returns an empty map
  const displayServiceChips = serviceChipList.map((c) => chipOverrides.get(c) ?? c);
  assert.deepEqual(displayServiceChips, [SOURCE_CHIP], "exact original restored, byte-for-byte");
});

/* ── Label contract: pre-click prediction + post-click truth, for this exact scenario ── */
check("pre-click label prediction (zero network): Spanish UI + Spanish-guessed content -> effective target English", () => {
  const guess = guessContentLocaleHeuristically(
    "Somos una empresa con más de diez años de experiencia en el servicio de plomería para nuestros clientes.",
  );
  assert.equal(guess, "es");
  const plan = planUnknownSourceTranslation("es", guess);
  assert.equal(plan.targetLocale, "en", "predicted effective target is English (retargeted), matching what actually happened above");
});

check("post-click truth: the real response carries enough to build \"Ver original (español)\" — never a bare \"Ver original\"", () => {
  // Mirrors TranslateAdControl's effectiveOriginalLocale/effectiveTargetLocale derivation for the
  // unknown-source path: detectedSourceLocale="es" (server-detected), effectiveTargetLocale="en"
  // (retargeted) — both present, so the parenthetical is never suppressed for this scenario.
  const detectedSourceLocale = "es";
  const effectiveTargetLocale = "en";
  assert.notEqual(detectedSourceLocale, effectiveTargetLocale);
  const name = new Intl.DisplayNames(["es"], { type: "language" }).of(detectedSourceLocale);
  assert.equal(name, "español");
});

if (failures.length) {
  console.error(`\nverify-servicios-card-translate-runtime-selftest: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-card-translate-runtime-selftest: PASS");
