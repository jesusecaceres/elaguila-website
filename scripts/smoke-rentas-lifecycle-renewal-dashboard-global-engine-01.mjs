#!/usr/bin/env node
import { execFileSync } from "node:child_process";

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: "inherit", env: process.env });
}

run("node", ["scripts/verify-leonix-paid-listing-lifecycle-engine-01.mjs"]);
run("node", ["scripts/verify-rentas-lifecycle-renewal-dashboard-global-engine-01.mjs"]);

const { resolveListingLifecycle, computeFixedDayRenewalExpiresAt } = await import("../app/lib/listingLifecycle/resolveListingLifecycle.ts");
const { RENTAS_LISTING_LIFECYCLE_CONFIG } = await import("../app/lib/listingLifecycle/listingLifecycleConfig.ts");

const baseNow = "2026-07-14T12:00:00.000Z";
function isoPlusDays(days) {
  return new Date(new Date(baseNow).getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}
function check(name, condition) {
  if (!condition) throw new Error(`smoke failed: ${name}`);
  console.log(`OK: ${name}`);
}
function lifecycle(expiresAt, status = "active", isPublished = true) {
  return resolveListingLifecycle(
    { category: "rentas", packageKey: "rentas_30d", status, isPublished, expiresAt, nowIso: baseNow },
    RENTAS_LISTING_LIFECYCLE_CONFIG,
  );
}

check("active 20 days no renewal", lifecycle(isoPlusDays(20)).lifecycleState === "active" && !lifecycle(isoPlusDays(20)).isRenewalEligible);
check("active 7 days expiring soon", lifecycle(isoPlusDays(7)).lifecycleState === "expiring_soon" && lifecycle(isoPlusDays(7)).isRenewalEligible);
check("expired hidden and renewal eligible", !lifecycle(isoPlusDays(-1)).isPubliclyVisible && lifecycle(isoPlusDays(-1)).isRenewalEligible);
check(
  "early renewal preserves remaining paid time",
  computeFixedDayRenewalExpiresAt({ currentExpiresAtIso: isoPlusDays(7), paymentCompletedAtIso: baseNow, durationDays: 30 }) === isoPlusDays(37),
);
check(
  "expired renewal starts from payment",
  computeFixedDayRenewalExpiresAt({ currentExpiresAtIso: isoPlusDays(-1), paymentCompletedAtIso: baseNow, durationDays: 30 }) === isoPlusDays(30),
);
check("suspended renewal blocked", !lifecycle(isoPlusDays(1), "suspended", true).isRenewalEligible);
check("pending payment hidden", lifecycle(isoPlusDays(30), "pending", false).lifecycleState === "pending_payment");
check("missing expires unknown", lifecycle(null).lifecycleState === "unknown");

console.log("smoke-rentas-lifecycle-renewal-dashboard-global-engine-01: PASS");
