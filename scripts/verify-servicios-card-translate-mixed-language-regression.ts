/**
 * SERVICIOS RESULTS CARD — MIXED-LANGUAGE TRANSLATE REGRESSION (2026-09-17).
 *
 * Owner runtime QA proved that clicking "Traducir al inglés" on a results card left CANONICAL
 * preset chips in Spanish while only owner-authored custom chips flipped to English — an
 * incoherent, half-translated card. Root cause: the card translate hook only ever produced an
 * overlay for owner-authored text (`chipOverrides`); canonical chips were never re-relabeled for
 * the translated view.
 *
 * This test reproduces the OWNER'S EXACT scenario — real catalog plumbing services (5 canonical,
 * from businessTypePresets.ts's real `plom_*` ids) + 3 owner-authored custom services — and drives
 * the REAL production functions (`relabelServiciosCanonicalPresets`, `buildServiciosCardTranslatableContent`,
 * `applyServiciosCardTranslation`) through the exact transform sequence both card components use to
 * compute `displayServiceChips`, proving:
 *   1. Before translating: all 8 chips render in Spanish (both canonical and custom).
 *   2. After translating: ZERO Spanish chips remain — all 5 canonical chips use the real Leonix EN
 *      catalog label (never sent to a translation provider), all 3 custom chips use the translated
 *      text (from a simulated provider response, since this environment has no live Google Cloud
 *      Translation credentials).
 *   3. After "Ver original": the exact original 8 Spanish chips are restored, byte for byte.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-card-translate-mixed-language-regression.ts
 */
import { strict as assert } from "node:assert";
import {
  applyServiciosCardTranslation,
  buildServiciosCardTranslatableContent,
  isOwnerAuthoredService,
  relabelServiciosCanonicalPresets,
  type ServiciosCardTranslatableInput,
} from "../app/(site)/servicios/lib/serviciosTranslateAd";
import {
  cleanProfessionalChipLabel,
  isWeakProfessionalChipLabel,
} from "../app/(site)/servicios/components/serviciosLeonixBrand";
import {
  maskTranslatableFields,
  pickTranslatableAdFields,
  unmaskTranslatableFields,
} from "../app/lib/translation/helpers";
import {
  unwrapMaskPlaceholdersFromGoogleHtml,
  wrapMaskPlaceholdersForGoogleHtml,
} from "../app/lib/translation/providers/maskPlaceholders";
import type { ServiciosProfileResolved } from "../app/(site)/servicios/types/serviciosBusinessProfile";

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

/* ── Real catalog plumbing services (businessTypePresets.ts) — the owner's exact example. ── */
const CANONICAL_ES = [
  "Reparación de fugas",
  "Destape de drenaje",
  "Calentador de agua",
  "Instalación de grifería",
  "Plomería de emergencia",
];
const CANONICAL_EN = [
  "Leak repair",
  "Drain cleaning",
  "Water heater",
  "Fixture installation",
  "Emergency plumbing",
];
const CANONICAL_IDS = ["plom_fugas", "plom_destape", "plom_calentador", "plom_griferia", "plom_emergencia"];

const CUSTOM_ES = ["Inspección de tuberías", "Reemplazo de válvulas", "Mantenimiento preventivo"];
const CUSTOM_EN = ["Pipe inspection", "Valve replacement", "Preventive maintenance"];

function buildFixtureProfile(): ServiciosProfileResolved {
  const services = [
    ...CANONICAL_IDS.map((id, i) => ({
      id: `svc_${id}`,
      title: CANONICAL_ES[i]!,
      secondaryLine: "",
      imageAlt: CANONICAL_ES[i]!,
    })),
    ...CUSTOM_ES.map((title, i) => ({
      id: `custom_offer_${i}`,
      title,
      secondaryLine: "",
      imageAlt: title,
    })),
  ];
  return {
    hero: { categoryLine: "Plomería", badges: [] },
    services,
    trust: [],
    highlights: [],
    quickFacts: [],
  } as unknown as ServiciosProfileResolved;
}

/** Mirrors the card components' own `collectCleanServiceChips` — clean + de-dupe, byte-identical rules. */
function collectCleanServiceChips(services: ServiciosProfileResolved["services"]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of services) {
    const c = cleanProfessionalChipLabel(s.title);
    if (!c || isWeakProfessionalChipLabel(c)) continue;
    const key = c.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

function simulateProviderTranslate(wrappedHtml: string, dictionary: Record<string, string>): string {
  let out = wrappedHtml;
  for (const [es, en] of Object.entries(dictionary)) out = out.replaceAll(es, en);
  return out;
}

/* ── 1. Original (Spanish) render — sanity baseline. ── */
check("BEFORE translate: all 8 chips render in Spanish (5 canonical + 3 custom)", () => {
  const profile = relabelServiciosCanonicalPresets(buildFixtureProfile(), "es");
  const chips = collectCleanServiceChips(profile.services);
  assert.deepEqual(chips, [...CANONICAL_ES, ...CUSTOM_ES]);
});

check("owner-authorship classification is correct for this fixture (5 canonical, 3 custom)", () => {
  const profile = buildFixtureProfile();
  const ownerCount = profile.services.filter((s) => isOwnerAuthoredService(s)).length;
  assert.equal(ownerCount, 3);
  assert.equal(profile.services.length - ownerCount, 5);
});

/* ── 2. CLICK "Traducir al inglés" — drive the exact production pipeline both cards use. ── */
let displayServiceChips: string[] = [];

check('CLICK "Traducir al inglés": drives buildServiciosCardTranslatableContent -> [provider] -> applyServiciosCardTranslation for the 3 custom chips', () => {
  const lang: "es" | "en" = "es";
  const displayLang: "es" | "en" = "en";

  const profile = relabelServiciosCanonicalPresets(buildFixtureProfile(), lang);
  const ownerAuthoredChips = profile.services
    .filter((s) => isOwnerAuthoredService(s))
    .map((s) => cleanProfessionalChipLabel(s.title))
    .filter((c): c is string => Boolean(c) && !isWeakProfessionalChipLabel(c!));
  assert.deepEqual(ownerAuthoredChips, CUSTOM_ES);

  // Real translation request/response cycle for the 3 owner-authored chips only.
  const input: ServiciosCardTranslatableInput = { categoryLine: undefined, ownerAuthoredChips };
  const content = buildServiciosCardTranslatableContent(input);
  const picked = pickTranslatableAdFields(content);
  const { fields: maskedFields, fieldMaps } = maskTranslatableFields(picked);
  const wrapped = wrapMaskPlaceholdersForGoogleHtml(maskedFields.details!);
  const dictionary = Object.fromEntries(CUSTOM_ES.map((es, i) => [es, CUSTOM_EN[i]!]));
  const providerResponse = simulateProviderTranslate(wrapped, dictionary);
  const unwrapped = unwrapMaskPlaceholdersFromGoogleHtml(providerResponse);
  const restoredTranslated = unmaskTranslatableFields({ details: unwrapped }, fieldMaps);
  const applied = applyServiciosCardTranslation(restoredTranslated, input);
  for (const [i, es] of CUSTOM_ES.entries()) {
    assert.equal(applied.chipsByOriginal.get(es), CUSTOM_EN[i]);
  }

  // Canonical relabel for the SAME displayLang — the fix: this must run in lock-step with the
  // owner-authored overlay above, not be left behind at the original `lang`.
  const displayProfile = relabelServiciosCanonicalPresets(profile, displayLang);
  const displayServiceChipListCanonical = collectCleanServiceChips(displayProfile.services);

  // The exact display-transform line both card components use.
  displayServiceChips = displayServiceChipListCanonical.map((c) => applied.chipsByOriginal.get(c) ?? c);
});

check("EXPECTED DISPLAY: ZERO Spanish service-chip labels remain visible", () => {
  const spanishLeftover = displayServiceChips.filter((c) => [...CANONICAL_ES, ...CUSTOM_ES].includes(c));
  assert.deepEqual(spanishLeftover, [], `Spanish leftover chips found: ${spanishLeftover.join(", ")}`);
});

check("EXPECTED DISPLAY: all 5 canonical chips use the real Leonix EN catalog label", () => {
  for (const en of CANONICAL_EN) {
    assert.ok(displayServiceChips.includes(en), `missing canonical EN label: ${en}`);
  }
});

check("EXPECTED DISPLAY: all 3 custom chips use the translated (provider) result", () => {
  for (const en of CUSTOM_EN) {
    assert.ok(displayServiceChips.includes(en), `missing translated custom chip: ${en}`);
  }
  assert.equal(displayServiceChips.length, 8);
});

/* ── 3. CLICK "Ver original (español)" — every chip reverts, byte for byte. ── */
check('CLICK "Ver original (español)": exact original Spanish card is restored', () => {
  const lang: "es" | "en" = "es";
  const profile = relabelServiciosCanonicalPresets(buildFixtureProfile(), lang);
  const serviceChipList = collectCleanServiceChips(profile.services);
  // showTranslated=false -> displayLang=lang (no relabel needed) and chipOverrides is empty.
  const chipOverrides = new Map<string, string>();
  const restored = serviceChipList.map((c) => chipOverrides.get(c) ?? c);
  assert.deepEqual(restored, [...CANONICAL_ES, ...CUSTOM_ES]);
});

/* ── 4. Canonical-only card (zero owner-authored text) still offers Translate and still changes. ── */
check("canonical-only card (no owner-authored chips at all) still translates every chip on click", () => {
  const lang: "es" | "en" = "es";
  const displayLang: "es" | "en" = "en";
  const profile: ServiciosProfileResolved = {
    hero: { categoryLine: "Plomería", badges: [] },
    services: CANONICAL_IDS.map((id, i) => ({
      id: `svc_${id}`,
      title: CANONICAL_ES[i]!,
      secondaryLine: "",
      imageAlt: CANONICAL_ES[i]!,
    })),
    trust: [],
    highlights: [],
    quickFacts: [],
  } as unknown as ServiciosProfileResolved;

  const relabeled = relabelServiciosCanonicalPresets(profile, lang);
  const ownerAuthoredChips = relabeled.services.filter((s) => isOwnerAuthoredService(s));
  assert.equal(ownerAuthoredChips.length, 0, "fixture genuinely has zero owner-authored chips");

  const displayProfile = relabelServiciosCanonicalPresets(profile, displayLang);
  const displayChips = collectCleanServiceChips(displayProfile.services);
  assert.deepEqual(displayChips, CANONICAL_EN, "canonical-only card fully translates with zero provider calls");
});

if (failures.length) {
  console.error(`\nverify-servicios-card-translate-mixed-language-regression: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-card-translate-mixed-language-regression: PASS");
