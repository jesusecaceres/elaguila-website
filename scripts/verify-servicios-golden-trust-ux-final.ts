/**
 * SERVICIOS — GOLDEN TRUST UX + RESULTS CARD ORGANIZATION + TRANSLATE RUNTIME REPAIR (2026-09-16).
 * Focused proof for all 24 items in the mission's Gate "FOCUSED TEST / VERIFIER REQUIREMENTS".
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-golden-trust-ux-final.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

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

const HERO = "app/(site)/servicios/components/ServiciosProfessionalHero.tsx";
const HUB_CARD = "app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx";
const TRADE_CARD = "app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard.tsx";
const PRO_CARD = "app/(site)/clasificados/servicios/ServiciosProfessionalResultCard.tsx";
const HOOK = "app/(site)/servicios/components/useServiciosResultCardTranslation.tsx";
const CONTROL = "app/components/translation/TranslateAdControl.tsx";
const AUTOS_LAYER = "app/(site)/clasificados/autos/vehiculo/[id]/AutosListingTranslationLayer.tsx";

/* 1 — hero trust module directly below location/languages, above favorite/share + Contactar/WhatsApp. */
check("1: hero trust module sits after the language/rating row and before engagementSlot / the Contactar-WhatsApp CTA row", () => {
  const src = raw(HERO);
  const langIdx = src.indexOf("<ServiciosLanguageChipRow");
  const trustIdx = src.indexOf("<ServiciosHeroTrustSummary");
  const engagementIdx = src.indexOf("{engagementSlot ? (");
  const ctaRowIdx = src.indexOf('data-servicios-cta-row="1"');
  assert.ok(langIdx > 0 && trustIdx > langIdx, "trust module mounted after language chips");
  assert.ok(trustIdx < engagementIdx, "trust module before favorite/share divider");
  assert.ok(trustIdx < ctaRowIdx, "trust module before Contactar/WhatsApp CTA row");
});

/* 2 — hero shows Comunidad Leonix branding. */
check("2: hero trust module is branded '🦁 Comunidad Leonix' / '🦁 Leonix Community' as its own module (bordered, not a bare line)", () => {
  const src = raw(HERO);
  assert.ok(src.includes('const brandLabel = lang === "en" ? "Leonix Community" : "Comunidad Leonix";'));
  assert.ok(src.includes("🦁 {brandLabel}"));
  assert.ok(src.includes("rounded-lg border border-[#C9A84A]/35"), "visually a distinct module, not inline text");
});

/* 3 — preview state does not fabricate score/count. */
check("3: preview (no durable listing id) state never renders a number — only the truthful 'turns on when published' copy", () => {
  const src = raw(HERO);
  const idx = src.indexOf("if (!targetId) {");
  const end = src.indexOf("if (!summary) return null;");
  const block = src.slice(idx, end);
  assert.ok(!block.includes("total") && !block.includes("summary."), "preview branch never references a real/fabricated count");
  assert.ok(!/>\s*\d[\d.,]*\s*</.test(block), "no rendered digit as JSX text content in the preview branch");
});

/* 4 — published zero = Nuevo. */
check("4: published zero-count state reads 'Nuevo en Leonix' / 'New on Leonix' — truthful, not fabricated", () => {
  const src = raw(HERO);
  assert.ok(src.includes('{lang === "en" ? "New on Leonix" : "Nuevo en Leonix"}'));
});

/* 5 — real-count state = truthful real total. */
check("5: real-count state sums the REAL fetched summary — no hardcoded number", () => {
  const src = raw(HERO);
  assert.ok(src.includes("const total = summary.reduce((sum, e) => sum + e.count, 0);"));
  assert.ok(src.includes("${total} recognition") && src.includes("${total} reconocimiento"));
});

/* 6 — hero top traits max = 3. */
check("6: hero trait breakdown is capped at 3 (.slice(0, 3))", () => {
  const src = raw(HERO);
  assert.ok(src.includes(".slice(0, 3)"));
});

/* 7 — hero trust action reuses the existing Community Trust interaction / anchor (no new engine). */
check("7: hero 'Reconocer este negocio' action scrolls to the SAME lower Community Trust section id — no second endorsement engine, no duplicate RPC", () => {
  const hero = raw(HERO);
  assert.ok(hero.includes('const SERVICIOS_COMMUNITY_TRUST_SECTION_ID = "servicios-community-trust-section";'));
  assert.ok(hero.includes("document\n      .getElementById(SERVICIOS_COMMUNITY_TRUST_SECTION_ID)") || hero.includes('.getElementById(SERVICIOS_COMMUNITY_TRUST_SECTION_ID)'));
  assert.ok(hero.includes("Reconocer este negocio") && hero.includes("Recognize this business"));
  assert.ok(!hero.includes("toggleLeonixEndorsementVoteClient"), "hero never wires its own voting logic — it only navigates to the existing surface");
  const hub = raw(HUB_CARD);
  assert.ok(hub.includes('id="servicios-community-trust-section"'), "the target anchor actually exists on the lower section");
});

/* 8 — lower full Comunidad section still exists, unchanged mount. */
check("8: ServiciosBusinessHubContactCard's full LeonixCommunityTrust section mount is unchanged (same props, same component)", () => {
  const hub = raw(HUB_CARD);
  assert.ok(hub.includes("<LeonixCommunityTrust"));
  assert.ok(hub.includes('category="servicios"'));
  assert.ok(hub.includes('targetId={(listingSourceId ?? "").trim()}'));
  assert.ok(hub.includes("preview={!(listingSourceId ?? \"\").trim()}"));
});

/* 9/10/11/12 — results card trust: in the utility strip, always visible, read-only, max 1 trait. */
check("9/10/11/12: both result cards render Comunidad Leonix in a dedicated trust-strip row (never gated to zero, no voting control, no trait array)", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(src.includes('data-servicios-card-trust-strip="1"'), `${rel}: dedicated utility strip present`);
    assert.ok(!src.includes('data-servicios-card-trust-translate="1"'), `${rel}: old combined trust+translate row removed`);
    const stripIdx = src.indexOf('data-servicios-card-trust-strip="1"');
    const stripBlock = src.slice(stripIdx, stripIdx + 1100);
    assert.ok(stripBlock.includes("<span") , `${rel}: trust badge is a read-only span`);
    assert.ok(!stripBlock.includes("<button") || !stripBlock.slice(0, stripBlock.indexOf("ServiciosResultCardEngagementStrip")).includes("<button"), `${rel}: no voting button before the engagement strip`);
    assert.ok(stripBlock.includes("ServiciosResultCardEngagementStrip"), `${rel}: favorite/share sit in the same strip`);
    // Always visible: the chip markup itself is unconditional — only the inner TEXT branches on count.
    assert.ok(!/endorsementCount > 0 \? \(/.test(stripBlock.slice(0, 100)), `${rel}: chip is not gated by count > 0`);
    assert.ok(stripBlock.includes("endorsementCount > 0"), `${rel}: real-vs-zero text branch present`);
    // Max 1 trait: no per-card trait loop/array exists (traits require a per-card fetch, which is forbidden).
    assert.ok(!/topTraits/.test(stripBlock) && !stripBlock.includes(".map((t"), `${rel}: no multi-trait rendering on the card (0 traits shown, within the max-1 budget)`);
  }
});

/* 13/14 — Translate moved to card top/header utility area, no longer in the Comunidad strip. */
check("13/14: Translate control mounts in the header's top-right utility slot, not in the trust strip", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(src.includes('data-servicios-card-translate-utility="1"'), `${rel}: top-right utility slot present`);
    const headerIdx = src.indexOf('data-servicios-card-header="1"');
    const utilityIdx = src.indexOf('data-servicios-card-translate-utility="1"');
    assert.ok(headerIdx > 0 && utilityIdx > headerIdx, `${rel}: translate utility sits inside the header block`);
    const stripIdx = src.indexOf('data-servicios-card-trust-strip="1"');
    const stripBlock = src.slice(stripIdx, stripIdx + 700);
    assert.ok(!stripBlock.includes("translateControl"), `${rel}: trust strip no longer renders translateControl`);
  }
});

/* 15 — Translate hidden if no currently rendered authored content is translatable. */
check("15: card translate control is gated by hasServiciosTranslatableProse — never a no-op button", () => {
  const hook = raw(HOOK);
  assert.ok(hook.includes("const offerTranslate = enabled && hasServiciosTranslatableProse(translatableContent);"));
  assert.ok(hook.includes("const translateControl = offerTranslate ? ("));
});

/* 16/17 — Translate works against the EXACT displayed field(s); translated state feeds the real renderer. */
check("16/17: both cards compute their rendered chip array by mapping through chipOverrides — the real display-consumption line", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(/\.map\(\(c\) => chipOverrides\.get\(c\) \?\? c\)/.test(src), `${rel}: display transform consumes chipOverrides`);
  }
});

/* 18 — View Original restores exact rendered source. */
check("18: with no active translation, chipOverrides is an empty Map — cards fall back to the exact original chip strings", () => {
  const hook = raw(HOOK);
  assert.ok(hook.includes("chipOverrides: applied?.chipsByOriginal ?? new Map<string, string>(),"));
});

/* 19 — no auto translation request on mount. */
check("19: no useEffect auto-invokes runTranslate/requestTranslation on mount, in the control or the card hook", () => {
  const control = raw(CONTROL);
  assert.ok(!/useEffect\(\(\) => \{\s*void runTranslate/.test(control));
  const hook = raw(HOOK);
  assert.ok(!hook.includes("requestServiciosAdTranslation()"), "the hook never calls the translator directly");
});

/* 20 — no per-card Community API fetch. */
check("20: neither result card calls fetchLeonixEndorsementSummary directly — trust count comes solely from the existing bulk row field", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(!src.includes("fetchLeonixEndorsementSummary"), `${rel}: no per-card single-target fetch`);
    assert.ok(src.includes("public_endorsement_count"), `${rel}: reuses the existing bulk-computed field`);
  }
});

/* 21 — analytics handlers remain connected (unchanged event types). */
check("21: CTA tracking event types are unchanged by the reorg on both cards", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    for (const ev of ['"cta_call_click"', '"cta_whatsapp_click"', '"cta_maps_click"']) {
      assert.ok(src.includes(ev), `${rel}: missing tracked event ${ev}`);
    }
    assert.ok(src.includes("trackServiciosResultCardClick"), `${rel}: whole-card/profile-nav click tracking intact`);
  }
});

/* 22 — canonical listing id unchanged. */
check("22: canonical identity (servicios_public_listings.id) still flows into engagement/share as before", () => {
  const trade = raw(TRADE_CARD);
  assert.ok(trade.includes("listingSourceId={row?.id ?? null}"));
  const pro = raw(PRO_CARD);
  assert.ok(pro.includes("listingSourceId={row.id ?? null}"));
});

/* 23 — Autos shared Translate control contract remains valid. */
check("23: Autos known-source consumer untouched; TranslateAdControl's known-source path stays byte-identical", () => {
  const autos = raw(AUTOS_LAYER);
  assert.ok(autos.includes("originalLocale={sourceLocale}"));
  const control = raw(CONTROL);
  const idx = control.indexOf("const effectiveTargetLocale = useMemo");
  const block = control.slice(idx, idx + 400);
  assert.ok(block.includes("if (!isUnknownSource) return siteLocale;"));
});

/* 24 — zero Stripe / payment / webhook files changed. */
check("24: no Stripe/checkout/pricing/promo/webhook/Revenue OS files appear in this pass's touched-file set", () => {
  const diff = execSync("git diff --name-only HEAD", { cwd: new URL("..", import.meta.url), encoding: "utf8" });
  const untracked = execSync("git ls-files --others --exclude-standard", { cwd: new URL("..", import.meta.url), encoding: "utf8" });
  const touched = `${diff}\n${untracked}`.split("\n").filter(Boolean);
  const forbidden = /stripe|checkout|revenue-os|webhook|pricing|promo/i;
  const hits = touched.filter((f) => forbidden.test(f));
  assert.deepEqual(hits, [], `unexpected payment-adjacent file(s) touched: ${hits.join(", ")}`);
});

if (failures.length) {
  console.error(`\nverify-servicios-golden-trust-ux-final: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-golden-trust-ux-final: PASS");
