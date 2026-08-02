/**
 * Hotfix H.1 — ES/EN-only production launch gateway proof.
 *
 * Covers: (1) ADDITIONAL_LANGUAGES is empty (the real, imported constant, not a string check);
 * (2) the gateway's "Languages" dropdown trigger is conditionally rendered, not unconditional;
 * (3) the gateway grid collapses to 2 columns when there are no additional languages; (4) Español
 * remains selectable; (5) English remains selectable; (6) "Entrar a Leonix" remains present;
 * (7) no broader Globalization i18n architecture (OFFICIAL_LAUNCH_LANGUAGES, locale resolvers,
 * MAGAZINE_ROUTE_LANGUAGES changes, etc.) was pulled into this hotfix.
 *
 * Run from repo root:
 *   npx tsx scripts/hotfix-h1-es-en-gateway-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

import { ADDITIONAL_LANGUAGES, PRIMARY_LANGUAGES } from "../app/lib/language";
import { ROOT_INTRO_COPY } from "../app/lib/rootIntroCopy";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

/* ================================================================================================
 * 1. ADDITIONAL_LANGUAGES is empty — the real, imported constant.
 * ============================================================================================== */
assert.equal(ADDITIONAL_LANGUAGES.length, 0, "ADDITIONAL_LANGUAGES must be empty for the ES/EN-only launch");

/* ================================================================================================
 * 4/5. Español and English remain the only primary, always-offered languages.
 * ============================================================================================== */
assert.deepEqual([...PRIMARY_LANGUAGES], ["es", "en"], "PRIMARY_LANGUAGES must remain exactly [es, en]");
assert.equal(ROOT_INTRO_COPY.es.selectedLabel, "Español");
assert.equal(ROOT_INTRO_COPY.en.selectedLabel, "English");

/* ================================================================================================
 * 6. "Entrar a Leonix" remains present in the Spanish gateway copy.
 * ============================================================================================== */
assert.equal(ROOT_INTRO_COPY.es.enter, "Entrar a Leonix");

/* ================================================================================================
 * 2/3. Source-level proof: the dropdown trigger and the grid column count are both conditioned on
 * ADDITIONAL_LANGUAGES.length > 0 — not unconditional as they were before this hotfix.
 * ============================================================================================== */
{
  const src = readSource("app/components/RootIntroLanguagePanel.tsx");
  assert.ok(
    /ADDITIONAL_LANGUAGES\.length > 0\s*\?\s*"mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3"\s*:\s*"mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2"/.test(src),
    "the gateway grid must use 2 columns when ADDITIONAL_LANGUAGES is empty, 3 when populated",
  );
  const dropdownIdx = src.indexOf('aria-label={UNIVERSAL_LANGUAGES_DROPDOWN_TRIGGER}');
  assert.ok(dropdownIdx > -1, "the dropdown listbox must still exist in source (not deleted)");
  // The dropdown-block conditional (with an opening paren) is distinct from the earlier grid-class
  // ternary already asserted above — find the block conditional specifically.
  const blockConditionalIdx = src.lastIndexOf("ADDITIONAL_LANGUAGES.length > 0 ? (", dropdownIdx);
  assert.ok(blockConditionalIdx > -1 && blockConditionalIdx < dropdownIdx, "the dropdown block must be wrapped in an ADDITIONAL_LANGUAGES.length > 0 conditional");

  // Regression: PRIMARY_LANGUAGES rendering, the Enter link, and existing selection/navigation
  // behavior must all remain untouched by this hotfix.
  assert.ok(src.includes("PRIMARY_LANGUAGES.map((code) =>"), "the primary Español/English pills must still render from PRIMARY_LANGUAGES");
  assert.ok(src.includes("{copy.enter}"), "the Enter CTA must still render the real localized copy");
  assert.ok(src.includes('router.replace(`/?lang=${target}`'), "language selection must still update the URL the same way as before");
  assert.ok(src.includes("writePersistedLangPreference"), "language selection must still persist the same way as before");
}

/* ================================================================================================
 * 1 (continued), source-level: ADDITIONAL_LANGUAGES is the real, empty array in source, not just
 * an import-time coincidence.
 * ============================================================================================== */
{
  const src = readSource("app/lib/language.ts");
  assert.ok(
    /export const ADDITIONAL_LANGUAGES: readonly SupportedLang\[\] = \[\];/.test(src),
    "ADDITIONAL_LANGUAGES must be declared empty in source, with a wide readonly SupportedLang[] type (not `as const`, which would narrow map() callbacks to `never`)",
  );
}

/* ================================================================================================
 * 7. No unrelated Globalization i18n architecture was pulled into this hotfix — the diff must be
 * exactly the 2 allowed source files plus this test, nothing else, and neither allowed file may
 * introduce a new translation framework, Google Translate, or DeepL wiring.
 * ============================================================================================== */
{
  const gatewaySrc = readSource("app/components/RootIntroLanguagePanel.tsx");
  const langSrc = readSource("app/lib/language.ts");
  for (const forbidden of ["google.translate", "translate.google", "DeepL", "GoogleTranslate", "next-intl"]) {
    assert.ok(!gatewaySrc.toLowerCase().includes(forbidden.toLowerCase()), `gateway must not reference ${forbidden}`);
    assert.ok(!langSrc.toLowerCase().includes(forbidden.toLowerCase()), `language.ts must not reference ${forbidden}`);
  }

  let changedFiles = "";
  try {
    changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
  } catch {
    changedFiles = "";
  }
  const changed = changedFiles.split("\n").map((l) => l.trim()).filter(Boolean);
  const allowed = new Set([
    "app/lib/language.ts",
    "app/components/RootIntroLanguagePanel.tsx",
  ]);
  for (const f of changed) {
    assert.ok(allowed.has(f), `hotfix diff must contain only the 2 approved source files, not: ${f}`);
  }
}

console.log("hotfix-h1-es-en-gateway-selftest: OK");
