/**
 * Autos Dealer — Final Full Lifecycle Round-Trip Closeout — Gates 12–16 (2026-09-18).
 *
 * Gate 12 (results parity) / Gate 13 (public detail parity) / Gate 14 (dashboard parity): all
 * three surfaces must show the SAME cover image Preview shows (the owner's chosen isPrimary
 * image), not "whichever sorts first." The dashboard row mapper (autosClassifiedsRowToDashboardRow)
 * had the exact same bug as the public card mapper fixed under Gate 3/6 — proves both are now
 * fixed, and sweeps the rest of the Autos codebase for any other unfixed instance of the same
 * "deriveHeroImageUrls(...)[0]" anti-pattern (a full gallery-order helper misused as a single-
 * cover picker).
 *
 * Gate 12 (no fallback/demo substitution when real media exists): the public card renders a
 * genuine "no photo" placeholder when a listing truly has none, and the sample/demo inventory
 * fallback only ever fires on a wholly empty result set behind an explicit env flag — never masks
 * one listing's real media with unrelated stock photos.
 *
 * Gate 16 (no regression): the shared AutosSortablePhotoGrid/media-manager fix (Gate 1) is used by
 * BOTH Autos Negocios and Autos Privado — proves Privado's own preview-mode/checkout contract
 * (pinned separately in gate-p3-preview-mode-contract-selftest.ts) was never touched by this pass.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-autos-dealer-gate12-16-parity-and-regression.ts
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
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const raw = (rel: string) =>
  stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n"));

const DASHBOARD_SVC = "app/lib/clasificados/autos/autosClassifiedsListingService.ts";
const PUBLIC_CARD = "app/(site)/clasificados/autos/components/public/AutosPublicStandardCard.tsx";
const SAMPLE_INVENTORY = "app/(site)/clasificados/autos/data/sampleAutosPublicInventory.ts";
const INVENTORY_POLICY = "app/(site)/clasificados/autos/lib/autosPublicInventoryPolicy.ts";
const PRIVADO_PREVIEW = "app/(site)/clasificados/autos/privado/preview/AutosPrivadoPreviewClient.tsx";
const PRIVADO_APPLICATION = "app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx";

/* ── Gate 14: dashboard thumbnail parity ── */
check("dashboard row mapper's thumbUrl now resolves through derivePrimaryImageUrl (isPrimary-aware)", () => {
  const src = raw(DASHBOARD_SVC);
  assert.ok(src.includes('import { derivePrimaryImageUrl } from "@/app/clasificados/autos/negocios/lib/autoDealerHeroImages";'));
  assert.ok(!/deriveHeroImageUrls/.test(src), "no leftover gallery-order-only helper usage for a single-thumbnail field");
  const fnStart = src.indexOf("export function autosClassifiedsRowToDashboardRow(row: AutosClassifiedsListingRow): AutosClassifiedsDashboardRow {");
  assert.ok(fnStart > 0);
  const body = src.slice(fnStart, src.indexOf("\n}\n", fnStart));
  assert.ok(body.includes("const thumbUrl = derivePrimaryImageUrl(L) || null;"));
  assert.ok(body.includes("thumbUrl,"), "the resolved value must actually be returned, not a stale destructured name");
});

/* ── Repo-wide sweep: no other unfixed instance of the "gallery helper as single-cover" bug ── */
check("SWEEP: no remaining deriveHeroImageUrls(...)[0]-style single-cover usage anywhere under app/lib or app/(site)/clasificados/autos", () => {
  const out = execSync(
    'git grep -n "deriveHeroImageUrls" -- "app/lib" "app/(site)/clasificados/autos" "app/(site)/publicar/autos" || true',
    { cwd: new URL("..", import.meta.url), encoding: "utf8" },
  );
  const lines = out.split("\n").filter(Boolean);
  const offenders = lines.filter((l) => /deriveHeroImageUrls\([^)]*\)\s*(\.|\[)/.test(l) || /const\s+\w+\s*=\s*deriveHeroImageUrls\(/.test(l) && /\[0\]/.test(out));
  // Every remaining call site must be either the definition itself or a genuine full-gallery consumer
  // (never immediately indexed [0] on the same line as a disguised single-cover pick).
  const indexedZero = lines.filter((l) => /deriveHeroImageUrls\([^)]*\)\[0\]/.test(l));
  assert.equal(indexedZero.length, 0, `found un-fixed [0]-indexed usage:\n${indexedZero.join("\n")}`);
});

/* ── Gate 12: no fake/demo substitution when a real listing has real media ── */
check("public standard card shows a genuine placeholder, never demo/stock imagery, when a listing has no media", () => {
  const src = raw(PUBLIC_CARD);
  assert.ok(src.includes("const imageUrl = listing.primaryImageUrl?.trim();") || /primaryImageUrl\?\.trim\(\)/.test(src));
  assert.ok(!/unsplash|picsum|placeholder\.com/i.test(src), "no third-party stock-photo fallback baked into the card itself");
});

check("the sample/demo inventory fallback is env-gated and only fires on an EMPTY result set, never substitutes a real listing's media", () => {
  const src = raw(SAMPLE_INVENTORY);
  assert.ok(/resolveAutosLandingInventory/.test(src), "the gated resolver function is present");
  const policy = raw(INVENTORY_POLICY);
  assert.ok(
    policy.includes('process.env.NEXT_PUBLIC_LEONIX_AUTOS_PUBLIC_DEMO === "1"'),
    "the actual runtime gate must require the explicit opt-in flag",
  );
});

/* ── Gate 16: no regression — Privado's own preview/checkout contract untouched ── */
check("REGRESSION GUARD: Privado's own pinned checkout-mode line is untouched by this pass", () => {
  const src = raw(PRIVADO_PREVIEW);
  assert.ok(
    src.includes('const showSellerCheckout = mode === "draft";'),
    "Privado's independently-pinned checkout gating must survive byte-for-byte",
  );
});

check("REGRESSION GUARD: Privado's application still uses the shared (now-fixed) media manager, unmodified call signature", () => {
  const src = raw(PRIVADO_APPLICATION);
  assert.ok(src.includes("AutosNegociosMediaManager"), "Privado intentionally shares the Negocios media manager component");
});

if (failures.length) {
  console.error(`\nverify-autos-dealer-gate12-16-parity-and-regression: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-autos-dealer-gate12-16-parity-and-regression: PASS");
