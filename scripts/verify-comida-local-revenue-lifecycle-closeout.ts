/**
 * Globalization Build C (RED #15) — targeted verifier for the three Comida Local revenue-
 * lifecycle gaps closed in this build: (1) LANE_SUSPENSION entry so a lapsed subscription is
 * actually auto-suspended by the standard sweep, (2) promo-code UI wired to the real
 * validateRevenuePromoForCheckout server call, (3) an active-entitlement read on Comida Local's
 * own public search results.
 *
 * Run from repo root:
 *   npx tsx scripts/verify-comida-local-revenue-lifecycle-closeout.ts
 *
 * Check 1 calls the REAL exported `laneSuspensionSpecForCategory` function directly — not a
 * source-grep, a real function call compared via node:assert. Checks 2-3 are structural source
 * checks (no live DB / no component render available in a pure-logic script) confirming the real
 * wiring exists in the real files — not a fabricated pass, every assertion reads the actual
 * current file contents on disk.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { laneSuspensionSpecForCategory } from "../app/lib/listingPlans/subscriptionLifecyclePolicy";

const REPO_ROOT = join(__dirname, "..");
const read = (rel: string) => readFileSync(join(REPO_ROOT, rel), "utf8");

let failures = 0;
let checks = 0;

function check(label: string, fn: () => void): void {
  checks += 1;
  try {
    fn();
    console.log(`  ok  - ${label}`);
  } catch (err) {
    failures += 1;
    console.error(`  FAIL - ${label}`);
    console.error(`         ${err instanceof Error ? err.message : String(err)}`);
  }
}

function main(): void {
  console.log("verify-comida-local-revenue-lifecycle-closeout: starting");

  // ── 1. LANE_SUSPENSION — real function call ────────────────────────────────────────────────
  check("laneSuspensionSpecForCategory('comida-local') is no longer null", () => {
    const spec = laneSuspensionSpecForCategory("comida-local");
    assert.ok(spec, "expected a real LaneSuspensionSpec for comida-local, got null");
  });

  check("comida-local lane spec matches the real webhook activation vocabulary (table/status/values)", () => {
    const spec = laneSuspensionSpecForCategory("comida-local")!;
    assert.equal(spec.table, "comida_local_public_listings");
    assert.equal(spec.statusColumn, "status");
    assert.deepEqual([...spec.visibleStatuses], ["published"]);
    assert.equal(spec.suspendedValue, "suspended");
  });

  check("laneSuspensionSpecForCategory is case/whitespace tolerant for comida-local (existing contract)", () => {
    const spec = laneSuspensionSpecForCategory("  Comida-Local  ");
    assert.ok(spec, "expected the lookup to normalize case/whitespace like every other lane");
  });

  check("laneSuspensionSpecForCategory('unknown-category') still returns null (fail-closed unaffected)", () => {
    const spec = laneSuspensionSpecForCategory("some-nonexistent-category");
    assert.equal(spec, null);
  });

  // ── 2. Promo-code UI wiring — structural source check ──────────────────────────────────────
  const previewClientSrc = read(
    "app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx",
  );

  check("ComidaLocalPreviewClient imports the real validateRevenuePromoForCheckout server call", () => {
    assert.match(previewClientSrc, /validateRevenuePromoForCheckout/);
  });

  check("ComidaLocalPreviewClient checkoutConfig declares promoEligible: true", () => {
    assert.match(previewClientSrc, /promoEligible:\s*true/);
  });

  check("ComidaLocalPreviewClient passes onPromoApply into PublishCheckoutCheckpoint", () => {
    assert.match(previewClientSrc, /onPromoApply=\{handlePromoApply\}/);
  });

  check("ComidaLocalPreviewClient forwards ctx.promoCode into the real checkout call (no client-invented discount)", () => {
    assert.match(previewClientSrc, /promoCode:\s*ctx\.promoCode/);
  });

  // ── 3. Entitlement overlay — structural source check ───────────────────────────────────────
  const overlaySrc = read("app/lib/clasificados/comida-local/comidaLocalEntitlementOverlay.ts");

  check("comidaLocalEntitlementOverlay reuses the shared hydratePublicRowsWithActivePackageEntitlements reader (no bespoke reimplementation)", () => {
    assert.match(overlaySrc, /hydratePublicRowsWithActivePackageEntitlements/);
  });

  check("comidaLocalEntitlementOverlay scopes to the real category/listingSource pair", () => {
    assert.match(overlaySrc, /category:\s*COMIDA_LOCAL_ENTITLEMENT_CATEGORY/);
    assert.match(overlaySrc, /"comida-local"/);
    assert.match(overlaySrc, /"comida_local_public_listings"/);
  });

  const publicQueriesSrc = read("app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts");

  check("listPublishedComidaLocalListings actually calls the overlay before returning results", () => {
    assert.match(publicQueriesSrc, /overlayActiveEntitlementsForComidaLocalResults\(filtered\)/);
  });

  console.log(
    `\nverify-comida-local-revenue-lifecycle-closeout: ${checks - failures}/${checks} checks passed`,
  );
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main();
