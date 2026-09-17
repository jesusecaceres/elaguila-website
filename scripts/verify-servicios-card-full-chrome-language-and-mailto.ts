/**
 * SERVICIOS ABSOLUTE FINAL GOLDEN CLOSEOUT — Gate 1/2/3 (unified display language, full card
 * chrome translation) + Gate 11/13 (mailto RFC 6068 encoding repair) proof (2026-09-17).
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-card-full-chrome-language-and-mailto.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { buildMailtoHref } from "../app/lib/digitalContact/humanConnection/nativeChannelHrefs";

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

const TRADE_CARD = "app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard.tsx";
const PRO_CARD = "app/(site)/clasificados/servicios/ServiciosProfessionalResultCard.tsx";

/* ── Gate 1/2/3: results-card UI_CHROME follows displayLang, never the static site lang ── */
check("trade card: chrome dictionary (L) is built from displayLang, not the static site lang", () => {
  const src = raw(TRADE_CARD);
  assert.ok(src.includes("const L = getServiciosProfileLabels(displayLang);"));
  assert.ok(!/const L = getServiciosProfileLabels\(lang\);/.test(src));
});
check("professional card: primary/secondary/services chrome labels are built from displayLang", () => {
  const src = raw(PRO_CARD);
  assert.ok(src.includes("const primaryLabel = getPrimaryCtaLabel(template, displayLang);"));
  assert.ok(src.includes("const secondaryLabel = getProfileCtaSecondary(template, displayLang);"));
  assert.ok(src.includes("const servicesLabel = getServicesTitle(template, displayLang);"));
});
check("both cards: Comunidad Leonix trust-strip text follows displayLang (not lang)", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    const idx = src.indexOf('data-servicios-card-trust-strip="1"');
    assert.ok(idx > 0, `${rel}: trust strip present`);
    const block = src.slice(idx, idx + 700);
    assert.ok(block.includes('displayLang === "en" ? "Leonix Community" : "Comunidad Leonix"'), `${rel}: brand label follows displayLang`);
    assert.ok(!/\blang === "en" \? "Leonix Community"/.test(block), `${rel}: no stale lang-keyed brand label left behind`);
  }
});
check("both cards: Directions / Ver perfil / engagement-strip chrome all follow displayLang", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(/displayLang === "en" \? "Directions" : "Cómo llegar"/.test(src), `${rel}: Directions label follows displayLang`);
    assert.ok(/lang=\{displayLang\}/.test(src), `${rel}: at least one subcomponent (chips row / engagement strip / like badge / star row) receives displayLang`);
  }
});
check("trade card: Ver perfil label + services section label + card aria-label all follow displayLang", () => {
  const src = raw(TRADE_CARD);
  assert.ok(src.includes('(displayLang === "en" ? "View profile" : "Ver perfil")'));
  assert.ok(src.includes('const servicesLabel = displayLang === "en" ? "Services" : "Servicios";'));
  assert.ok(src.includes("displayLang === \"en\"\n      ? `View profile for"));
});
check("navigation URL (?lang=) intentionally stays the SITE locale, not the card's ephemeral display language", () => {
  // The detail page manages its own independent translate state on arrival — the query param must
  // reflect the site's actual UI locale, not whatever a viewer toggled on this one card.
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(src.includes("?lang=${lang}"), `${rel}: href query param still uses the site lang, by design`);
  }
});

/* ── Gate 4: adaptive contact CTAs (no assumed WhatsApp) — already-correct architecture, re-verified ── */
check("both cards gate every contact CTA on a REAL resolved destination — no hardcoded assumption", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(/\{(?:tel|wa|waHrefNormalized) \? \(/.test(src), `${rel}: call/WhatsApp CTA gated on a real truthy destination`);
    assert.ok(/\{showDirections \? \(/.test(src), `${rel}: Directions CTA gated on a real resolved maps destination`);
  }
});

/* ── Gate 11/13: mailto RFC 6068 fix — spaces are %20, never URLSearchParams's form-encoded + ── */
check("buildMailtoHref no longer uses URLSearchParams (which serializes spaces as '+', not RFC 6068 '%20')", () => {
  const src = raw("app/lib/digitalContact/humanConnection/nativeChannelHrefs.ts");
  const fnStart = src.indexOf("export function buildMailtoHref");
  const fnEnd = src.indexOf("\n}\n", fnStart);
  const body = src.slice(fnStart, fnEnd);
  assert.ok(!body.includes("URLSearchParams"), "no longer builds the query via form-urlencoded serialization");
  assert.ok(body.includes("encodeURIComponent(sub)") && body.includes("encodeURIComponent(bod)"));
});
check("REAL encoded output: a space in subject/body becomes %20, never a literal '+'", () => {
  const href = buildMailtoHref("owner@leonixmedia.com", "Leonix Media", "Hello there, thanks!");
  assert.ok(href, "a valid email must produce a real href");
  assert.ok(href!.includes("%20"), "spaces are percent-encoded");
  assert.ok(!/subject=[^&]*\+/.test(href!) && !/body=.*\+/.test(href!) || !href!.replace(/%2B/gi, "").includes("+"), "no raw '+' standing in for a space in the query");
});
check("Unicode business name / accented subject survives round-trip (owner's exact test case)", () => {
  const href = buildMailtoHref("owner@leonixmedia.com", "Leonix · Plomería León del Valle QA", "Línea 1\nLínea 2 con acentos: ñ, á, é");
  assert.ok(href);
  const qs = href!.split("?")[1] ?? "";
  const params = new URLSearchParams(qs);
  assert.equal(params.get("subject"), "Leonix · Plomería León del Valle QA");
  assert.equal(params.get("body"), "Línea 1\nLínea 2 con acentos: ñ, á, é");
});
check("invalid/unsafe email still safely rejected (no regression on the existing security gate)", () => {
  assert.equal(buildMailtoHref("not-an-email", "x", "y"), null);
  assert.equal(buildMailtoHref("javascript:alert(1)@x.com", "x", "y"), null);
  assert.equal(buildMailtoHref('"><script>@x.com', "x", "y"), null);
});
check("openMailto's composer-only fallback (no recipient) uses the same %20 encoding, not URLSearchParams", () => {
  const src = raw("app/components/cta/ctaLaunchers.ts");
  const fnStart = src.indexOf("export function openMailto");
  const fnEnd = src.indexOf("\nexport function openExternalUrl", fnStart);
  const body = src.slice(fnStart, fnEnd);
  assert.ok(!body.includes("new URLSearchParams"), "no longer instantiates the form-urlencoded serializer");
  assert.ok(body.includes("encodeURIComponent(sub)") && body.includes("encodeURIComponent(bod)"));
});

/* ── Gate 14: native share reused, not duplicated ── */
check("CtaActionSheet's email 'Share with other apps' action reuses the one global tryWebShare helper", () => {
  const sheet = raw("app/components/cta/CtaActionSheet.tsx");
  assert.ok(sheet.includes("tryWebShare({"));
  const launchers = raw("app/components/cta/ctaLaunchers.ts");
  assert.ok(launchers.includes("export async function tryWebShare"));
  const hits = [...sheet.matchAll(/navigator\.share/g)].length;
  assert.equal(hits, 0, "CtaActionSheet never calls navigator.share directly — only through the shared wrapper");
});
check("Servicios False-Gates-Only Final Completion Pass (2026-09-17, Gate 14): LeonixShareButton's directNativeShare path — the one used by every Servicios results card, hero, and profile Share control — also reuses tryWebShare/copyToClipboard instead of duplicating navigator.share/navigator.clipboard.writeText", () => {
  const btn = raw("app/components/clasificados/analytics/LeonixShareButton.tsx");
  assert.ok(btn.includes('import { copyToClipboard, tryWebShare } from "@/app/components/cta/ctaLaunchers";'));
  const fnStart = btn.indexOf("const triggerNativeShare = useCallback(");
  const fnEnd = btn.indexOf("\n  }, [listingTitle, shareText, publicUrl, lang, trackShare, allowTrack]);", fnStart);
  assert.ok(fnStart > 0 && fnEnd > fnStart, "triggerNativeShare function located");
  const body = btn.slice(fnStart, fnEnd);
  assert.ok(body.includes("await tryWebShare("), "calls the shared tryWebShare wrapper");
  assert.ok(body.includes("await copyToClipboard("), "clipboard fallback calls the shared copyToClipboard wrapper");
  assert.equal([...body.matchAll(/navigator\.share\(/g)].length, 0, "no direct navigator.share call left in triggerNativeShare");
  assert.equal([...body.matchAll(/navigator\.clipboard\.writeText\(/g)].length, 0, "no direct navigator.clipboard.writeText call left in triggerNativeShare");
});

if (failures.length) {
  console.error(`\nverify-servicios-card-full-chrome-language-and-mailto: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-card-full-chrome-language-and-mailto: PASS");
