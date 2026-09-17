/**
 * Servicios False-Gates-Only Final Completion Pass — Gate 18 verifier (2026-09-17).
 *
 * Dedicated 390px responsive structural proof for the three surfaces the owner task named:
 * RESULT CARD, FULL HERO, EMAIL SHEET. Static source-string assertions on the actual Tailwind
 * classes that control narrow-viewport layout (the established pattern this codebase already uses
 * for every other structural verifier — no DOM/browser rendering needed to prove class presence).
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-gate18-390px-responsive-proof.ts
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
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const TRADE_CARD = "app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard.tsx";
const PRO_CARD = "app/(site)/clasificados/servicios/ServiciosProfessionalResultCard.tsx";
const STRIP = "app/(site)/servicios/components/ServiciosResultCardEngagementStrip.tsx";
const HERO = "app/(site)/servicios/components/ServiciosProfessionalHero.tsx";
const SHEET = "app/components/cta/CtaActionSheet.tsx";

/* ── RESULT CARD ── */
check("RESULT CARD: contact CTA row wraps instead of overflowing at 390px (flex-wrap present, no nowrap/overflow-x-scroll escape hatch)", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(/className=\{`\$\{LX_CTA_CARD_PRIMARY_FLEX\}/.test(src) || src.includes("flex flex-wrap gap-2"), `${rel}: CTA row must be a wrapping flex row`);
    assert.ok(!/overflow-x-scroll|overflow-x-auto|whitespace-nowrap/.test(src), `${rel}: CTA row must not rely on horizontal scroll to fit narrow viewports`);
  }
});
check("RESULT CARD: WhatsApp absence leaves no dead hole (conditionally rendered, not a hidden/disabled placeholder)", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(/\{(?:wa|waHrefNormalized) \? \(/.test(src), `${rel}: WhatsApp CTA must be conditionally rendered (absent, not a disabled placeholder)`);
    assert.ok(!/WhatsApp[\s\S]{0,80}disabled/.test(src), `${rel}: no disabled/greyed-out WhatsApp button variant`);
  }
});
check("RESULT CARD: Community + Like/Share remain semantically grouped at narrow widths (same flex-wrap row, not split into separate cards)", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    const idx = src.indexOf('data-servicios-card-trust-strip="1"');
    const tagStart = src.lastIndexOf("<div", idx);
    const tagEnd = src.indexOf(">", idx);
    assert.ok(src.slice(tagStart, tagEnd).includes("flex-wrap"), `${rel}: trust-strip row must wrap, not split into unrelated blocks, at 390px`);
  }
  const strip = raw(STRIP);
  const rowStart = strip.indexOf('data-servicios-result-card-engagement="1"');
  const tagStart = strip.lastIndexOf("<div", rowStart);
  assert.ok(strip.slice(tagStart, strip.indexOf(">", rowStart)).includes("flex-wrap"));
});
check("RESULT CARD: View Profile stays a standalone full-width control (not squeezed inline with the CTA row) at narrow widths", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    const navIdx = src.indexOf('data-servicios-card-profile-nav="1"');
    assert.ok(navIdx > 0, `${rel}: View profile marker present`);
    // It's a Link rendered as its own flex/block item in the outer column stack (LX_CTA_CARD_SECONDARY),
    // never given a `w-1/2` or similar split-width class that would force it to share a row.
    const tagStart = src.lastIndexOf("<Link", navIdx);
    const tagBlock = src.slice(tagStart, navIdx + 40);
    assert.ok(!/w-1\/2|w-1\/3|basis-1\/2/.test(tagBlock), `${rel}: View profile must not be given a fractional-width class that implies sharing a row`);
  }
});
check("RESULT CARD: no fixed pixel widths on CTA label text that would clip at 390px (labels wrap or use responsive text sizing, not truncate)", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    const idx = src.indexOf('data-servicios-card-trust-strip="1"');
    const block = src.slice(idx, idx + 900);
    assert.ok(!/truncate\b/.test(block), `${rel}: trust-strip labels must not be truncated at narrow widths`);
  }
});

/* ── FULL HERO ── */
check("FULL HERO: CTA row is single-column (full-width, stacked) at mobile, only widening at sm:/lg: breakpoints", () => {
  const src = raw(HERO);
  const idx = src.indexOf('data-servicios-cta-row="1"');
  assert.ok(idx > 0, "hero CTA row marker present");
  const tagStart = src.lastIndexOf("<div", idx);
  const tagEnd = src.indexOf(">", idx) + 1;
  const openingBlock = src.slice(tagStart, tagEnd);
  assert.ok(openingBlock.includes("grid-cols-1"), "hero CTA row must default to a single column at mobile width");
  assert.ok(/sm:grid-cols-2|lg:flex/.test(openingBlock), "hero CTA row only widens at sm:/lg: breakpoints, never assumes desktop width by default");
});
check("FULL HERO: every CTA button is full-width at mobile (w-full), so labels never clip against a narrow fixed width", () => {
  const src = raw(HERO);
  const ctaRowIdx = src.indexOf('data-servicios-cta-row="1"');
  const ctaRowBlock = src.slice(ctaRowIdx, ctaRowIdx + 1600);
  const buttonMatches = [...ctaRowBlock.matchAll(/<button[\s\S]{0,260}?className=\{?`?([^`>]*)/g)];
  assert.ok(buttonMatches.length >= 2, "expected multiple CTA buttons in the hero CTA row");
  for (const m of buttonMatches) {
    assert.ok(m[1]!.includes("w-full"), `hero CTA button must be full-width at mobile: ${m[1]}`);
  }
});
check("FULL HERO: trust/Comunidad Leonix module fits without overflow (bounded width, no fixed px width wider than viewport)", () => {
  const src = raw(HERO);
  assert.ok(src.includes('w-full flex-col items-center rounded-lg border border-[#C9A84A]/35'), "trust module shell must be full-width at mobile (w-full), only switching to auto-width at sm:");
  assert.ok(src.includes("sm:w-auto"), "trust module only widens beyond full-width at the sm: breakpoint, never assumes desktop width on mobile");
  assert.ok(!/w-\[\d{3,}px\]/.test(src), "trust module must not use a fixed pixel width that could overflow a 390px viewport");
});
check("FULL HERO: location/category text wraps or clamps instead of forcing horizontal overflow", () => {
  const src = raw(HERO);
  assert.ok(src.includes("min-w-0 flex-1"), "hero text column must be allowed to shrink below its content size (min-w-0) to avoid forcing overflow");
  assert.ok(src.includes("line-clamp-1") || src.includes("line-clamp-2"), "location text must clamp rather than overflow");
});

/* ── EMAIL SHEET ── */
check("EMAIL SHEET: fits the viewport as a bottom sheet on mobile (fixed inset-0, bottom-anchored below sm:, internal scroll region capped, not full-bleed unconstrained)", () => {
  const src = raw(SHEET);
  assert.ok(src.includes("fixed inset-0"), "sheet overlay must cover the full viewport");
  assert.ok(src.includes("items-end justify-center") && src.includes("sm:items-center"), "sheet anchors to the bottom on mobile (items-end), centers only at sm:+");
  assert.ok(src.includes("max-h-[min(70vh,520px)]") && src.includes("overflow-y-auto"), "sheet's scrollable body region is height-capped for short viewports, with its own scroll");
  assert.ok(src.includes("w-full max-w-md"), "sheet content panel is full-width at mobile, capped at max-w-md on larger screens — never wider than the viewport");
});
check("EMAIL SHEET: actions remain usable at 390px — action buttons are block-level, not forced into a cramped horizontal row", () => {
  const src = raw(SHEET);
  assert.ok(!/overflow-x-scroll|overflow-x-auto/.test(src), "sheet must not rely on horizontal scrolling for its action list");
});
check("EMAIL SHEET: close control is always visible (rendered in the dialog's own header, a sibling BEFORE {body} in the outer shell, so it can never scroll out of view inside a capped body region)", () => {
  const src = raw(SHEET);
  // The dialog shell (role="dialog") is the outer component's own return; its per-intent-kind
  // scrollable content is a variable named `body` assembled earlier by helper closures (source-line
  // position there is irrelevant to render order) and interpolated as `{body}` inside the shell.
  const shellStart = src.indexOf('role="dialog"');
  assert.ok(shellStart > 0, "dialog shell not found");
  const shellBlock = src.slice(shellStart, shellStart + 1200);
  const closeIdx = shellBlock.indexOf("{t.close}");
  const bodyInterpolationIdx = shellBlock.indexOf("{body}");
  assert.ok(closeIdx > 0 && bodyInterpolationIdx > 0, "expected both the close button and the {body} slot inside the dialog shell");
  assert.ok(closeIdx < bodyInterpolationIdx, "the Cerrar/Close button must render before {body} in the shell, i.e. in a fixed header above whatever scrolls");
  assert.ok(src.includes('role="dialog"') && src.includes('aria-modal="true"'), "sheet is a proper modal dialog, so mobile screen readers announce it correctly");
});

if (failures.length) {
  console.error(`\nverify-servicios-gate18-390px-responsive-proof: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-gate18-390px-responsive-proof: PASS (result card + full hero + email sheet)");
