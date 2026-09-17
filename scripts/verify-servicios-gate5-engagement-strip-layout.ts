/**
 * Servicios False-Gates-Only Final Completion Pass — Gate 5 verifier (2026-09-17).
 *
 * Owner-approved desktop structure for the results-card engagement strip:
 *
 *   [ Comunidad Leonix ]            [ Like + Share ]
 *
 * ONE horizontal row, Community left, Like+Share right, same row — not Like on one row and Share
 * underneath, no fragmented preview/save block. Proves the exact structural contract for BOTH the
 * trade and professional templates, at desktop and at the 390px mobile contract, plus the disabled
 * "Vista previa" audit fix (the inert Save button is hidden in non-persisting/preview contexts
 * instead of rendering as a dead control) and that "View profile" remains a standalone full-width
 * control below the strip, not squeezed into it.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-gate5-engagement-strip-layout.ts
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
const SAVE_BUTTON = "app/components/clasificados/analytics/LeonixSaveButton.tsx";

check("DESKTOP STRUCTURE: both templates place the Comunidad Leonix badge and the engagement strip as two children of ONE flex row with justify-between (community left, like+share right, same row)", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    const idx = src.indexOf('data-servicios-card-trust-strip="1"');
    assert.ok(idx > 0, `${rel}: trust-strip row marker present`);
    // The marker is the OUTER container's own attribute; that same opening tag must declare a
    // single-row flex layout (no flex-col at this element) with justify-between for the L/R split.
    const tagStart = src.lastIndexOf("<div", idx);
    const tagEnd = src.indexOf(">", idx);
    const openingTag = src.slice(tagStart, tagEnd);
    assert.ok(openingTag.includes("flex"), `${rel}: trust-strip row must be a flex container`);
    assert.ok(openingTag.includes("justify-between"), `${rel}: trust-strip row must split children left/right via justify-between`);
    assert.ok(!openingTag.includes("flex-col"), `${rel}: trust-strip row must not be a column layout`);
    // Community badge (first child, left) then the engagement strip component (second child, right).
    const block = src.slice(tagStart, idx + 900);
    const badgeIdx = block.indexOf("Comunidad Leonix");
    const stripComponentIdx = block.indexOf("ServiciosResultCardEngagementStrip");
    assert.ok(badgeIdx > 0 && stripComponentIdx > badgeIdx, `${rel}: Comunidad Leonix badge must precede the engagement strip in source order (renders left in a row)`);
  }
});

check("ENGAGEMENT STRIP: Like, (optional) Save, Share render in one row via a single flex container, not stacked rows", () => {
  const src = raw(STRIP);
  const rowStart = src.indexOf('data-servicios-result-card-engagement="1"');
  assert.ok(rowStart > 0);
  const tagStart = src.lastIndexOf("<div", rowStart);
  const tagEnd = src.indexOf(">", rowStart);
  const openingTag = src.slice(tagStart, tagEnd);
  assert.ok(openingTag.includes("flex") && !openingTag.includes("flex-col"), "engagement strip must be a single flex row, not a stacked column");
  assert.ok(src.includes('data-servicios-action-order="like,save,share"'), "action-order marker documents Like -> Save -> Share");
});

check("VISTA PREVIA AUDIT: the inert/disabled Save control is hidden (not rendered as a dead button) whenever the card is non-persisting", () => {
  const strip = raw(STRIP);
  assert.ok(/\{persistEngagement \? \(\s*<LeonixSaveButton/.test(strip), "LeonixSaveButton must be conditionally rendered on persistEngagement, not always mounted");
  assert.ok(strip.includes("Gate 5"), "fix should be documented in place for future maintainers");
});
check("VISTA PREVIA AUDIT: the underlying inert-state copy this fix avoids showing still exists and is correctly labelled (confirms WHY hiding was the right call, not a guess)", () => {
  const saveBtn = raw(SAVE_BUTTON);
  assert.ok(saveBtn.includes('preview: "Vista previa"'));
  assert.ok(saveBtn.includes('preview: "Preview"'));
  assert.ok(saveBtn.includes("const inert = !allowEngage || !dbListingId;"));
  assert.ok(saveBtn.includes("disabled={isSaving || !hydrated || inert}"), "confirms the button truly does nothing on click while inert");
});

check("Like and Share remain visible and unconditional even when Save is hidden (strip never collapses to empty)", () => {
  const strip = raw(STRIP);
  assert.ok(/<ServiciosLikeEngagementCluster/.test(strip));
  const shareIdx = strip.indexOf("<LeonixShareButton");
  assert.ok(shareIdx > 0);
  // Share must not be inside the same conditional block as Save.
  const saveConditionalEnd = strip.indexOf(") : null}", strip.indexOf("persistEngagement ? (")) ;
  assert.ok(shareIdx > saveConditionalEnd, "LeonixShareButton must render outside the Save conditional, always present");
});

check("390PX CONTRACT: the trust-strip row allows wrapping (flex-wrap) rather than clipping/overflowing at narrow widths", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    const idx = src.indexOf('data-servicios-card-trust-strip="1"');
    const tagStart = src.lastIndexOf("<div", idx);
    const tagEnd = src.indexOf(">", idx);
    const openingTag = src.slice(tagStart, tagEnd);
    assert.ok(openingTag.includes("flex-wrap"), `${rel}: trust-strip row must allow wrapping at narrow viewport widths instead of clipping`);
  }
  const strip = raw(STRIP);
  const rowStart = strip.indexOf('data-servicios-result-card-engagement="1"');
  const tagStart = strip.lastIndexOf("<div", rowStart);
  const tagEnd = strip.indexOf(">", rowStart);
  assert.ok(strip.slice(tagStart, tagEnd).includes("flex-wrap"), "engagement strip itself must also allow wrapping at narrow widths");
});

check("VIEW PROFILE remains a standalone full-width control below the strip (never merged into the engagement row)", () => {
  for (const rel of [TRADE_CARD, PRO_CARD]) {
    const src = raw(rel);
    assert.ok(src.includes('data-servicios-card-profile-nav="1"'), `${rel}: View profile/Ver perfil control marker present`);
    const stripIdx = src.indexOf("ServiciosResultCardEngagementStrip");
    const navIdx = src.indexOf('data-servicios-card-profile-nav="1"');
    assert.ok(navIdx > stripIdx, `${rel}: View profile control must come after (below) the engagement strip in source/render order`);
  }
});

if (failures.length) {
  console.error(`\nverify-servicios-gate5-engagement-strip-layout: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-gate5-engagement-strip-layout: PASS (desktop + 390px, trade + professional)");
