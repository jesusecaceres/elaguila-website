/**
 * Gate I.5.6 — self-test for ES/EN-only launch language controls.
 *
 * Confirmed architecture: `app/lib/language.ts` is the single source of truth. Every visible
 * "More Languages" picker in the app (`LeonixHeaderLanguageSelector.tsx` — reused globally in the
 * main header, mobile drawer, contact page, gate pages, and Coming Soon; `RootIntroLanguagePanel.tsx`
 * — the root `/` entry screen) renders its selectable options by mapping over `ADDITIONAL_LANGUAGES`.
 * No other component independently hardcodes a pt/tl option. The dashboard (`perfil` page) already
 * only offered es/en. Admin is already hardcoded English-only with no visible switcher at all.
 * No Google Translate floating widget exists anywhere in the codebase (confirmed by investigation);
 * the only Google Translate reference is an intentional, unchanged outbound "translate this page via
 * Google" link/gateway (`app/lib/googleTranslateWebsite.ts`, `/translate-site`), which is explicitly
 * out of this gate's removal scope (not an injected widget).
 *
 * Repair: emptied `ADDITIONAL_LANGUAGES` (the one array every picker renders from) rather than
 * narrowing the `OfficialLaunchLang` type itself, which would have cascaded into 7+ unrelated
 * dictionary files (`clasificadosUiChromeCopy.ts`, `publicFooterCopy.ts`, `languageMetadata.ts`,
 * `homePageCopy.ts`, etc.) for zero additional visible benefit, since none of those are reachable
 * through any visible control once the picker itself is emptied. `pt`/`tl` remain fully defined in
 * `OFFICIAL_LAUNCH_LANGUAGES`, the `REGISTRY`, and every dictionary — an intact, harmless, invisible
 * foundation, reactivatable by repopulating one array.
 *
 * No network, no React rendering. Run from repo root:
 *   npx tsx scripts/gate-i5-6-es-en-launch-language-controls-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

import {
  ADDITIONAL_LANGUAGES,
  OFFICIAL_LAUNCH_LANGUAGES,
  OFFICIAL_LAUNCH_LANGUAGE_FALLBACK_NOTE,
  PRIMARY_LANGUAGES,
  isOfficialLaunchLang,
} from "../app/lib/language";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

const LANGUAGE_FILE = "app/lib/language.ts";
const ROOT_INTRO_FILE = "app/components/RootIntroLanguagePanel.tsx";
const HEADER_SELECTOR_FILE = "app/(site)/magazine/components/LeonixHeaderLanguageSelector.tsx";
const NAVBAR_FILE = "app/components/Navbar.tsx";
const FOOTER_FILE = "app/components/Footer.tsx";
const DASHBOARD_PERFIL_FILE = "app/(site)/dashboard/perfil/page.tsx";
const ADMIN_I18N_FILE = "app/admin/_components/AdminI18nProvider.tsx";
const TRANSLATION_PROVIDER_FILE = "app/lib/translation/provider.ts";
const TRANSLATION_CONFIG_FILE = "app/lib/translation/config.ts";
const AUTOS_DEALER_LANG_FIELD_FILE = "app/(site)/publicar/autos/shared/components/AutosDealerLanguagesField.tsx";
const EMPLEOS_TYPES_FILE = "app/(site)/clasificados/empleos/data/empleosJobTypes.ts";
const SERVICIOS_PROFILE_TYPES_FILE = "app/(site)/servicios/types/serviciosBusinessProfile.ts";
const CATEGORY_ROUTE_REGISTRY_FILE = "app/lib/listingIdentity/categoryRouteRegistry.ts";

async function main() {
  /* ---------------------------------------------------------------------------------------- *
   * 1/2/3 — only es/en are visible; Portuguese and Tagalog/Filipino are not.
   * ---------------------------------------------------------------------------------------- */
  {
    assert.deepEqual([...PRIMARY_LANGUAGES], ["es", "en"], "primary launch languages must be exactly es/en");
    assert.equal(ADDITIONAL_LANGUAGES.length, 0, "no additional language may be visible in any picker");
    assert.ok(!(ADDITIONAL_LANGUAGES as readonly string[]).includes("pt"), "Portuguese must not be visible");
    assert.ok(!(ADDITIONAL_LANGUAGES as readonly string[]).includes("tl"), "Tagalog/Filipino must not be visible");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 4 — no generic "Languages" dropdown can expose an unsupported option, because both pickers
   * found in the investigation render strictly from ADDITIONAL_LANGUAGES.
   *
   * Gate I.5.6A — the header selector's dropdown TRIGGER itself must also be hidden when there
   * are no additional languages, not merely emptied of options. Owner runtime QA on I.5.6 found
   * the trigger (and its Google Translate help panel) still rendered unconditionally, appearing
   * as an unexplained third "Languages" control alongside Español/English on desktop and mobile
   * (same shared component, so both surfaces showed the defect identically).
   * ---------------------------------------------------------------------------------------- */
  {
    const headerSrc = readSource(HEADER_SELECTOR_FILE);
    assert.ok(headerSrc.includes("ADDITIONAL_LANGUAGES.map("), "header selector must still render options from the shared constant, not a hardcoded list");
    assert.ok(headerSrc.includes("ADDITIONAL_LANGUAGES.length > 0"), "header selector must hide its dropdown trigger (not just its options) when there is nothing to select");
    const rootIntroSrc = readSource(ROOT_INTRO_FILE);
    assert.ok(rootIntroSrc.includes("ADDITIONAL_LANGUAGES.map("), "root intro panel must still render options from the shared constant, not a hardcoded list");
    assert.ok(rootIntroSrc.includes("ADDITIONAL_LANGUAGES.length > 0"), "root intro panel must hide its dropdown trigger when there is nothing to select");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 5/6 — no Google Translate widget loads; the Google Cloud Translation provider is untouched.
   * ---------------------------------------------------------------------------------------- */
  {
    let changedFiles = "";
    try {
      changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      changedFiles = "";
    }
    const changed = changedFiles.split("\n").map((l) => l.trim()).filter(Boolean);
    assert.ok(!changed.includes(TRANSLATION_PROVIDER_FILE), "Google Cloud Translation provider must not be modified");
    assert.ok(!changed.includes(TRANSLATION_CONFIG_FILE), "translation config must not be modified");
    const providerSrc = readSource(TRANSLATION_PROVIDER_FILE);
    assert.ok(/translation\.googleapis\.com|GoogleAuth/i.test(providerSrc), "Google Cloud Translation API integration must remain intact");
    for (const f of [NAVBAR_FILE, FOOTER_FILE, HEADER_SELECTOR_FILE, ROOT_INTRO_FILE]) {
      const src = readSource(f);
      assert.ok(!/google_translate_element|googleTranslateElementInit|new google\.translate\.TranslateElement/.test(src), `${f} must never load an injected Google Translate widget`);
    }
  }

  /* ---------------------------------------------------------------------------------------- *
   * 7/8 — ?lang=es and ?lang=en continue to resolve, and route-preservation on language switch
   * is unchanged (router-based, not a full reload).
   * ---------------------------------------------------------------------------------------- */
  {
    assert.equal(isOfficialLaunchLang("es"), true);
    assert.equal(isOfficialLaunchLang("en"), true);
    const headerSrc = readSource(HEADER_SELECTOR_FILE);
    assert.ok(headerSrc.includes("router.replace(nextPath"), "language switch must remain router-based, preserving path/query/hash");
    assert.ok(!headerSrc.includes("window.location.reload"), "language switch must never force a full page reload");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 9 — pt/tl remain a preserved, invisible foundation: still defined in OFFICIAL_LAUNCH_LANGUAGES
   * and the fallback-note dictionary (untouched pt/tl entries), never deleted.
   * ---------------------------------------------------------------------------------------- */
  {
    assert.ok((OFFICIAL_LAUNCH_LANGUAGES as readonly string[]).includes("pt"), "pt must remain defined internally (preserved foundation, not deleted)");
    assert.ok((OFFICIAL_LAUNCH_LANGUAGES as readonly string[]).includes("tl"), "tl must remain defined internally (preserved foundation, not deleted)");
    assert.ok(Object.prototype.hasOwnProperty.call(OFFICIAL_LAUNCH_LANGUAGE_FALLBACK_NOTE, "pt"), "pt fallback-note entry must remain (not deleted)");
    assert.ok(Object.prototype.hasOwnProperty.call(OFFICIAL_LAUNCH_LANGUAGE_FALLBACK_NOTE, "tl"), "tl fallback-note entry must remain (not deleted)");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 10 — the visible es/en fallback-note copy no longer falsely claims Portuguese/Tagalog as
   * official launch languages.
   * ---------------------------------------------------------------------------------------- */
  {
    assert.ok(!/Português|Portuguese/i.test(OFFICIAL_LAUNCH_LANGUAGE_FALLBACK_NOTE.es), "Spanish fallback note must not claim Portuguese support");
    assert.ok(!/Tagalog/i.test(OFFICIAL_LAUNCH_LANGUAGE_FALLBACK_NOTE.es), "Spanish fallback note must not claim Tagalog support");
    assert.ok(!/Português|Portuguese/i.test(OFFICIAL_LAUNCH_LANGUAGE_FALLBACK_NOTE.en), "English fallback note must not claim Portuguese support");
    assert.ok(!/Tagalog/i.test(OFFICIAL_LAUNCH_LANGUAGE_FALLBACK_NOTE.en), "English fallback note must not claim Tagalog support");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 11/12 — dashboard and admin are already clean: dashboard's one visible picker (perfil page)
   * offers only es/en; admin has no visible language switcher at all (hardcoded English).
   * ---------------------------------------------------------------------------------------- */
  {
    const perfilSrc = readSource(DASHBOARD_PERFIL_FILE);
    assert.ok(perfilSrc.includes("?lang=es") && perfilSrc.includes("?lang=en"), "dashboard perfil language picker must offer es/en");
    assert.ok(!/\?lang=pt|\?lang=tl/.test(perfilSrc), "dashboard perfil language picker must not offer pt/tl");
    const adminI18nSrc = readSource(ADMIN_I18N_FILE);
    assert.ok(/value="en"|value={"en"}|value=\{"en"\}/.test(adminI18nSrc) || adminI18nSrc.includes('value="en"'), "admin language must remain fixed to English");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 13 — business-language content fields (what languages a business speaks/serves) are
   * untouched — these are customer data, not the Leonix interface language.
   * ---------------------------------------------------------------------------------------- */
  {
    let changedFiles = "";
    try {
      changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      changedFiles = "";
    }
    const changed = changedFiles.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const f of [AUTOS_DEALER_LANG_FIELD_FILE, EMPLEOS_TYPES_FILE, SERVICIOS_PROFILE_TYPES_FILE]) {
      assert.ok(!changed.includes(f), `${f} is customer business-language data and must not be touched by this gate`);
    }
  }

  /* ---------------------------------------------------------------------------------------- *
   * 14 — no category route registry, mapper, payment, lifecycle, or migration file changed.
   * ---------------------------------------------------------------------------------------- */
  {
    let changedFiles = "";
    let deletedFiles = "";
    try {
      changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
      deletedFiles = execFileSync("git", ["diff", "--name-only", "--diff-filter=D", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
    } catch {
      changedFiles = "";
      deletedFiles = "";
    }
    const changed = changedFiles.split("\n").map((l) => l.trim()).filter(Boolean);
    assert.equal(deletedFiles.trim(), "", "no file may be deleted by this gate");
    assert.ok(!changed.includes(CATEGORY_ROUTE_REGISTRY_FILE), "category route registry must not be modified");
    assert.ok(!changed.some((f) => f.startsWith("supabase/migrations/")), "no migration file may be part of this gate's changes");

    for (const f of [LANGUAGE_FILE, ROOT_INTRO_FILE]) {
      let diff = "";
      try {
        diff = execFileSync("git", ["diff", "--unified=0", "HEAD", "--", f], { cwd: REPO_ROOT, encoding: "utf8" });
      } catch {
        diff = "";
      }
      const addedLines = diff.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).join("\n");
      assert.ok(
        !/stripe|checkout|webhook|entitlement|lifecycle|migrations\//i.test(addedLines),
        `${f}: lines added by this gate must not reference any locked system`,
      );
    }
  }

  console.log("gate-i5-6-es-en-launch-language-controls-selftest: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
