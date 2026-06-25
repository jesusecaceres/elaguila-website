/**
 * GOOGLE-TRANSLATION-ARCH-LOCK1 — lightweight language metadata validation (no API, no DB).
 * Run: npx tsx scripts/verify-leonix-language-metadata.ts
 */
import assert from "node:assert/strict";

import {
  ACTIVE_PUBLIC_LANGS,
  HELD_RTL_LANGUAGE_CODES,
  LANGUAGE_LABELS,
} from "../app/lib/language";
import {
  LEONIX_ACTIVE_LANGUAGE_METADATA,
  LEONIX_HELD_LANGUAGE_METADATA,
  LEONIX_LANGUAGE_METADATA,
  assertLeonixLanguageMetadataInvariants,
  mapRouteLangToGoogleTarget,
} from "../app/lib/leonix/languageMetadata";

const EXPECTED_ACTIVE = [
  "es",
  "en",
  "vi",
  "pt",
  "tl",
  "km",
  "zh",
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
    [...ACTIVE_PUBLIC_LANGS],
    [...EXPECTED_ACTIVE],
    "ACTIVE_PUBLIC_LANGS must match production set",
  );

  assert.equal(LEONIX_ACTIVE_LANGUAGE_METADATA.length, 13);
  assert.equal(LEONIX_HELD_LANGUAGE_METADATA.length, 2);

  for (const code of EXPECTED_ACTIVE) {
    const meta = LEONIX_LANGUAGE_METADATA[code];
    assert.ok(meta, `Missing metadata for ${code}`);
    assert.equal(meta.status, "production");
    assert.equal(meta.isActive, true);
    assert.equal(meta.isRtl, false);
    assert.ok(meta.googleTargetCode.length > 0);
    assert.equal(meta.label, LANGUAGE_LABELS[code]);
  }

  assert.equal(mapRouteLangToGoogleTarget("tl"), "fil");
  assert.equal(mapRouteLangToGoogleTarget("fil"), "fil");
  assert.equal(mapRouteLangToGoogleTarget("zh"), "zh-CN");
  assert.equal(mapRouteLangToGoogleTarget("zh-CN"), "zh-CN");

  for (const code of HELD_RTL_LANGUAGE_CODES) {
    const meta = LEONIX_LANGUAGE_METADATA[code];
    assert.equal(meta.status, "held");
    assert.equal(meta.isActive, false);
    assert.equal(meta.canUseMachineTranslation, false);
  }

  console.log("verify-leonix-language-metadata: OK");
}

run();
