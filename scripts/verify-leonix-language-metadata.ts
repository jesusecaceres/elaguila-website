/**
 * LEONIX-LAUNCH-LANGUAGE-SCOPE-AND-GOOGLE-TRANSLATE-FALLBACK1 — lightweight language metadata validation.
 * Run: npx tsx scripts/verify-leonix-language-metadata.ts
 */
import assert from "node:assert/strict";

import {
  ACTIVE_PUBLIC_LANGS,
  HELD_RTL_LANGUAGE_CODES,
  HIDDEN_FUTURE_LANGUAGE_CODES,
  LANGUAGE_LABELS,
  OFFICIAL_LAUNCH_LANGUAGES,
  isHiddenFutureLang,
  isOfficialLaunchLang,
  isSupportedLang,
  normalizeLang,
} from "../app/lib/language";
import {
  LEONIX_ACTIVE_LANGUAGE_METADATA,
  LEONIX_FUTURE_LANGUAGE_METADATA,
  LEONIX_HELD_LANGUAGE_METADATA,
  LEONIX_LANGUAGE_METADATA,
  assertLeonixLanguageMetadataInvariants,
  mapRouteLangToGoogleTarget,
} from "../app/lib/leonix/languageMetadata";

const EXPECTED_OFFICIAL = ["es", "en", "pt", "tl"] as const;

const EXPECTED_HIDDEN = [
  "vi",
  "zh",
  "km",
  "ja",
  "ko",
  "hi",
  "hy",
  "ru",
  "pa",
] as const;

function run() {
  assertLeonixLanguageMetadataInvariants();

  assert.deepEqual(
    [...OFFICIAL_LAUNCH_LANGUAGES],
    [...EXPECTED_OFFICIAL],
    "OFFICIAL_LAUNCH_LANGUAGES must match launch scope",
  );

  assert.deepEqual(
    [...ACTIVE_PUBLIC_LANGS],
    [...EXPECTED_OFFICIAL],
    "ACTIVE_PUBLIC_LANGS must match official launch scope",
  );

  assert.deepEqual(
    [...HIDDEN_FUTURE_LANGUAGE_CODES],
    [...EXPECTED_HIDDEN],
    "HIDDEN_FUTURE_LANGUAGE_CODES must match hidden registry",
  );

  assert.equal(LEONIX_ACTIVE_LANGUAGE_METADATA.length, 4);
  assert.equal(LEONIX_FUTURE_LANGUAGE_METADATA.length, 9);
  assert.equal(LEONIX_HELD_LANGUAGE_METADATA.length, 2);

  for (const code of EXPECTED_OFFICIAL) {
    const meta = LEONIX_LANGUAGE_METADATA[code];
    assert.ok(meta, `Missing metadata for ${code}`);
    assert.equal(meta.status, "production");
    assert.equal(meta.isActive, true);
    assert.equal(meta.isRtl, false);
    assert.ok(meta.googleTargetCode.length > 0);
    assert.equal(meta.label, LANGUAGE_LABELS[code]);
    assert.equal(isOfficialLaunchLang(code), true);
    assert.equal(isSupportedLang(code), true);
    assert.equal(normalizeLang(code), code);
  }

  for (const code of EXPECTED_HIDDEN) {
    const meta = LEONIX_LANGUAGE_METADATA[code];
    assert.equal(meta.status, "future");
    assert.equal(meta.isActive, false);
    assert.equal(isHiddenFutureLang(code), true);
    assert.equal(isSupportedLang(code), false);
    assert.equal(normalizeLang(code), "es");
  }

  assert.equal(normalizeLang("vi"), "es");
  assert.equal(normalizeLang("ar"), "es");
  assert.equal(normalizeLang("zh-Hans"), "es");
  assert.equal(normalizeLang("fil"), "tl");

  assert.equal(mapRouteLangToGoogleTarget("tl"), "fil");
  assert.equal(mapRouteLangToGoogleTarget("fil"), "fil");
  assert.equal(mapRouteLangToGoogleTarget("zh"), "zh-CN");
  assert.equal(mapRouteLangToGoogleTarget("zh-CN"), "zh-CN");

  for (const code of HELD_RTL_LANGUAGE_CODES) {
    const meta = LEONIX_LANGUAGE_METADATA[code];
    assert.equal(meta.status, "held");
    assert.equal(meta.isActive, false);
    assert.equal(meta.canUseMachineTranslation, false);
    assert.equal(normalizeLang(code), "es");
  }

  console.log("verify-leonix-language-metadata: OK");
}

run();
