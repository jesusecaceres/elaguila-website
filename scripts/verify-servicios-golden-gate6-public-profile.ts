/**
 * Servicios Golden lifecycle closeout — Gate 6 (public business profile, 2026-09-18).
 *
 * A 14-item Explore-agent audit of /clasificados/servicios/[slug] against the professional
 * profile shell found 13 items already satisfied by current source (contact CTAs, rich email
 * action sheet, native Share, Community Leonix, shared gallery/lightbox with Todo/Fotos/Videos
 * tabs, fixed Cerrar header, real-entitlement-gated offers, hours, address-privacy-respecting
 * Maps, website/socials, pending_payment correctly 404s, a genuinely published row correctly
 * renders) and ONE confirmed real gap:
 *
 *   ServiciosProfessionalProfileShell.tsx passed the UNTRANSLATED `profile` (not `displayProfile`)
 *   into <ServiciosProfessionalHero>, so the hero region — including the category line, which
 *   serviciosTranslateAd.ts's own translatable-content bundle proves is meant to change under
 *   Translate — silently stayed in the original language on the PUBLISHED page after "Translate"
 *   was used, while the identical Hero component correctly received `displayProfile` in both the
 *   Preview shell (ServiciosProfessionalPreviewShell.tsx) and the alternate template
 *   (ServiciosProfileView.tsx).
 *
 * Fix: one-line change, `profile={profile}` -> `profile={displayProfile}` at the Hero call site.
 * `profile` (untranslated) is still correctly used for reviews (customer quotes, never
 * translated by design) and hours (no translatable prose) — those were confirmed intentional and
 * left alone.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-golden-gate6-public-profile.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

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
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const raw = (rel: string) =>
  stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n"));

const SHELL = "app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx";
const PREVIEW_SHELL = "app/(site)/clasificados/publicar/servicios/preview/ServiciosProfessionalPreviewShell.tsx";
const PROFILE_VIEW = "app/(site)/servicios/components/ServiciosProfileView.tsx";
const PUBLIC_PAGE = "app/(site)/clasificados/servicios/[slug]/page.tsx";
const TRANSLATE_AD = "app/(site)/servicios/lib/serviciosTranslateAd.ts";

check("the published profile's Hero now receives the TRANSLATED displayProfile, matching Preview", () => {
  const src = raw(SHELL);
  const idx = src.indexOf("<ServiciosProfessionalHero");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 150);
  assert.ok(block.includes("profile={displayProfile}"), "Hero must consume displayProfile, not the untranslated profile");
  assert.ok(!block.includes("profile={profile}\n"), "the old untranslated prop must be gone from this call site");
});

check("REGRESSION GUARD: the Preview shell's Hero already correctly used displayProfile — untouched", () => {
  const src = raw(PREVIEW_SHELL);
  const idx = src.indexOf("<ServiciosProfessionalHero");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 150);
  assert.ok(block.includes("profile={displayProfile}"));
});

check("REGRESSION GUARD: the alternate ServiciosProfileView template's Hero is untouched", () => {
  const src = raw(PROFILE_VIEW);
  const idx = src.indexOf("<ServiciosProfessionalHero");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 150);
  assert.ok(block.includes("profile={displayProfile}"));
});

check("REGRESSION GUARD: Reviews and Hours intentionally keep the untranslated profile (customer quotes / no translatable prose)", () => {
  const src = raw(SHELL);
  assert.ok(src.includes("<ServiciosReviews profile={profile} lang={displayLang} />"));
  assert.ok(src.includes("<ServiciosHours profile={profile} lang={displayLang} />"));
});

check("categoryLine is genuinely part of the translatable-content contract, confirming this was a real bug, not a stylistic no-op", () => {
  const src = raw(TRANSLATE_AD);
  assert.ok(/categoryLine/.test(src));
});

check("pending_payment remains excluded from the public slug page (never publicly visible)", () => {
  const src = raw("app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts");
  const idx = src.indexOf("SLUG_PAGE_STATUSES");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 200);
  assert.ok(!block.includes('"pending_payment"'));
  assert.ok(block.includes('"published"'));
});

check("REGRESSION GUARD: a genuinely published row still falls through to the normal render (no accidental notFound narrowing)", () => {
  const src = raw(PUBLIC_PAGE);
  assert.ok(src.includes("if (!row) notFound();"));
});

if (failures.length) {
  console.error(`\nverify-servicios-golden-gate6-public-profile: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-golden-gate6-public-profile: PASS");
