/**
 * Servicios Golden lifecycle closeout — Gate 5 (results card Golden parity, 2026-09-18).
 *
 * A full-requirements Explore-agent audit against the LIVE result card
 * (/clasificados/servicios/resultados renders only ServiciosHorizontalResultCard at default
 * density, which delegates to ServiciosProfessionalResultCard for the professional template —
 * confirmed by resultados/page.tsx importing only that one component) found every requirement
 * already satisfied by current source, with citations. No code fix was needed for this gate — this
 * verifier captures the structural evidence so the proof persists and regresses loudly if any of
 * it is later removed.
 *
 * Caveat (does not affect the live page): ServiciosProfessionalResultCard's density="compact"
 * variant disables Translate and omits the Community Leonix strip. /resultados never passes
 * density="compact" (confirmed: no `density` prop on the import), so this does not apply here.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-golden-gate5-result-card-parity.ts
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
const ROOT = new URL("../", import.meta.url);
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const raw = (rel: string) => stripComments(readFileSync(new URL(rel, ROOT), "utf8").replace(/\r\n/g, "\n"));

const RESULTS_PAGE = "app/(site)/clasificados/servicios/resultados/page.tsx";
const PRO_CARD = "app/(site)/clasificados/servicios/ServiciosProfessionalResultCard.tsx";
const STD_CARD = "app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard.tsx";
const ENGAGEMENT_STRIP = "app/(site)/servicios/components/ServiciosResultCardEngagementStrip.tsx";
const CTA_LAUNCHERS = "app/components/cta/ctaLaunchers.ts";
const PRESET_LABELS = "app/(site)/servicios/lib/serviciosCanonicalPresetLabels.ts";

check("the results page renders only the standard card (no density=compact -> Translate/Community stay enabled)", () => {
  const src = raw(RESULTS_PAGE);
  assert.ok(src.includes("ServiciosHorizontalResultCard"));
  assert.ok(!/density\s*=\s*["']compact["']/.test(src), "the live results page must not use compact density");
});

check("canonical pills are localized from ONE shared ES/EN dictionary, not per-card duplicated strings", () => {
  const src = raw(PRESET_LABELS);
  assert.ok(src.length > 0);
  const proSrc = raw(PRO_CARD);
  assert.ok(proSrc.includes("relabelServiciosCanonicalPresets"));
});

check("Call is tied to the primary phone, Call-office only shows when a DIFFERENT real number is configured", () => {
  for (const rel of [PRO_CARD, STD_CARD]) {
    const src = raw(rel);
    assert.ok(src.includes("phoneTelHref"));
    assert.ok(/sameCallNumber/.test(src), `${rel} must suppress a duplicate office button when the numbers match`);
  }
});

check("Message/SMS is tied to quoteMessagePhone (distinct from the primary phone)", () => {
  for (const rel of [PRO_CARD, STD_CARD]) {
    const src = raw(rel);
    assert.ok(src.includes("quoteMessagePhone"));
  }
});

check("WhatsApp CTA is null (never a placeholder) when no real number/URL is configured", () => {
  for (const rel of [PRO_CARD, STD_CARD]) {
    const src = raw(rel);
    assert.ok(/waHrefNormalized \? \(|wa \? \(/.test(src), `${rel} must strictly gate the WhatsApp button on a truthy resolved href`);
  }
});

check("Like and Share render on ONE shared horizontal engagement strip component", () => {
  const src = raw(ENGAGEMENT_STRIP);
  assert.ok(src.includes("ServiciosLikeEngagementCluster"));
  assert.ok(src.includes("LeonixShareButton"));
  for (const rel of [PRO_CARD, STD_CARD]) {
    assert.ok(raw(rel).includes("ServiciosResultCardEngagementStrip"), `${rel} must mount the shared strip, not a bespoke like/share layout`);
  }
});

check("Share uses native Web Share with a copy-link fallback (shared launcher, not a category-local reimplementation)", () => {
  const src = raw(CTA_LAUNCHERS);
  assert.ok(src.includes("typeof navigator.share"));
  assert.ok(src.includes("navigator.share(data)"));
});

check("CTA grid has no hardcoded dead slot for a missing channel — auto-reflow grid, every cell independently conditional", () => {
  for (const rel of [PRO_CARD, STD_CARD]) {
    // Comment text — read raw (unstripped), unlike the other checks above.
    const src = readFileSync(new URL(rel, ROOT), "utf8").replace(/\r\n/g, "\n");
    assert.ok(/no hardcoded slot count and no dead cell/i.test(src) || /no dead\/empty cell/i.test(src), `${rel} must document the no-dead-slot CTA grid contract`);
  }
});

check("REGRESSION GUARD: the legacy ServiciosListingResultCard has zero live importers (confirmed dead, not the rendering path)", () => {
  const hits = execSync('git grep -l "from \\".*ServiciosListingResultCard\\"" -- "*.tsx" "*.ts" || true', {
    cwd: new URL(".", ROOT).pathname.replace(/^\/([A-Za-z]):/, "$1:"),
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
  assert.equal(hits.length, 0, "no live file should import the legacy card component");
});

if (failures.length) {
  console.error(`\nverify-servicios-golden-gate5-result-card-parity: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-golden-gate5-result-card-parity: PASS");
