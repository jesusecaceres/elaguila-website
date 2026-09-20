/**
 * Gate 14 · Verifier 4 — server enforcement of FULL-only features.
 *
 * Catches: a Full-only feature protected by UI hiding alone, a gate that fails OPEN for Simple,
 * a gate that fails CLOSED for everyone else (which would silently strip analytics from
 * classifieds), and Full losing access it has today.
 *
 * Run: npx tsx scripts/verify-quick-full-gates-04.ts
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  decideBusinessAccessCapability,
  fullOnlyFeatureDeniedBody,
  type BusinessAccessCapability,
  type BusinessAccessLevel,
} from "../app/lib/listingPlans/businessAccessLevel";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const codeOf = (p: string): string =>
  read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

let failures = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS  ${name}`);
  } catch (err) {
    failures++;
    console.error(`FAIL  ${name}\n      ${err instanceof Error ? err.message : String(err)}`);
  }
}

const GATE = "app/lib/listingPlans/fullOnlyFeatureGate.ts";
const ANALYTICS_ROUTE = "app/api/dashboard/analytics/listing/route.ts";

// 1. THE GATE IS A SERVER GATE --------------------------------------------------------------
check("the Full-only gate is server-only and cannot be imported by a client component", () => {
  const src = read(GATE);
  assert.ok(src.includes('import "server-only"'), "the gate must be server-only");
  assert.ok(!src.includes('"use client"'), "the gate is never a client module");
});

check("the gate denies SIMPLE and only SIMPLE", () => {
  const code = codeOf(GATE);
  assert.ok(
    code.includes('if (level !== "simple") return'),
    "the gate must return open for every level except simple",
  );
  assert.ok(
    /catch\s*\{[\s\S]{0,200}return open;/.test(code),
    "an unreadable commercial state must not remove access the customer already had",
  );
  assert.ok(
    code.includes("isBusinessAccessCategory"),
    "a category outside the Simple/Full split must never be gated",
  );
});

check("the denial body tells the client what to buy instead of just refusing", () => {
  const body = fullOnlyFeatureDeniedBody({
    level: "simple",
    capability: "analytics",
    upgradePackageKey: "servicios_base_monthly",
  });
  assert.equal(body.error, "upgrade_required");
  assert.equal(body.required_level, "full");
  assert.equal(body.business_access_level, "simple");
  assert.equal(body.upgrade_package_key, "servicios_base_monthly");
});

// 2. THE ANALYTICS ROUTE IS ACTUALLY WIRED --------------------------------------------------
check("the per-listing analytics route enforces the gate on the server", () => {
  const code = codeOf(ANALYTICS_ROUTE);
  assert.ok(code.includes("resolveFullOnlyFeatureGate("), "the route must call the gate");
  assert.ok(code.includes('capability: "analytics"'), "it must gate on the analytics capability");
  assert.ok(
    code.includes("fullOnlyFeatureDeniedBody(gate)") && code.includes("status: 403"),
    "a denied request must be refused with 403, not merely hidden",
  );
});

check("the gate runs after ownership and before any analytics data is read", () => {
  const code = codeOf(ANALYTICS_ROUTE);
  const ownership = code.indexOf("resolved.identity.ownerUserId !== ownerId");
  const gate = code.indexOf("resolveFullOnlyFeatureGate(");
  const fetchData = code.indexOf("fetchListingDashboardAnalyticsServer(");
  assert.ok(ownership >= 0 && gate >= 0 && fetchData >= 0, "all three stages exist");
  assert.ok(ownership < gate, "ownership is checked first");
  assert.ok(gate < fetchData, "no analytics data may be read before the entitlement check");
});

check("the gate is given the real listing identity, not a client-supplied claim", () => {
  const code = codeOf(ANALYTICS_ROUTE);
  assert.ok(code.includes("category: resolved.identity.category"), "category from resolved identity");
  assert.ok(
    code.includes("listingSource: resolved.identity.sourceTable") &&
      code.includes("listingId: resolved.identity.sourceId"),
    "listing identity from the server-resolved record",
  );
});

// 3. THE DECISION ITSELF --------------------------------------------------------------------
check("every FULL-only capability is denied at SIMPLE and allowed at FULL", () => {
  const fullOnly: BusinessAccessCapability[] = [
    "business_hub",
    "analytics",
    "leads",
    "business_tools",
    "business_concierge",
    "inventory_expansion",
    "advanced_media",
  ];
  for (const capability of fullOnly) {
    const atSimple = decideBusinessAccessCapability({ level: "simple", capability });
    assert.equal(atSimple.allowed, false, `${capability} denied at simple`);
    assert.equal(atSimple.requiredLevel, "full", `${capability} requires full`);
    assert.equal(atSimple.upgradeUnlocks, true, `${capability} must offer an upgrade path`);

    const atFull = decideBusinessAccessCapability({ level: "full", capability });
    assert.equal(atFull.allowed, true, `${capability} allowed at full`);
    assert.equal(atFull.upgradeUnlocks, false, "full has nothing left to unlock");
  }
});

check("a Simple capability is allowed at Simple and never advertised as an upgrade", () => {
  for (const capability of ["public_listing", "contact_ctas", "simple_management"] as const) {
    const atSimple = decideBusinessAccessCapability({ level: "simple", capability });
    assert.equal(atSimple.allowed, true, `${capability} allowed at simple`);
    assert.equal(atSimple.requiredLevel, "simple");
    assert.equal(atSimple.upgradeUnlocks, false, `${capability} is not an upsell`);
  }
});

check("no access grants nothing, and the upgrade path is still offered", () => {
  const none: BusinessAccessLevel = "none";
  const decision = decideBusinessAccessCapability({ level: none, capability: "analytics" });
  assert.equal(decision.allowed, false);
  assert.equal(decision.upgradeUnlocks, true, "full would unlock it");
});

// 4. UI HIDING IS NOT THE ONLY CONTROL ------------------------------------------------------
check("the Simple doorway hides Full modules AND the server refuses them", () => {
  // Both halves must hold: the client omits the entry point, and the route refuses the request.
  const doorway = codeOf(
    "app/(site)/publicar/negocio-rapido/_components/QuickBusinessMyBusinessClient.tsx",
  );
  assert.ok(!doorway.includes("analytics"), "the doorway offers no analytics entry point");
  assert.ok(
    codeOf(ANALYTICS_ROUTE).includes("resolveFullOnlyFeatureGate("),
    "and the route refuses a direct request regardless of the UI",
  );
});

check("Full behaviour is unchanged: the route still serves a FULL customer", () => {
  const code = codeOf(ANALYTICS_ROUTE);
  // The gate's only early return is the denial; every other path falls through to the original
  // response, so a FULL customer's response shape is untouched.
  const denials = [...code.matchAll(/status: 403/g)].length;
  assert.equal(denials, 2, "exactly two 403s: the pre-existing ownership check and the new gate");
  assert.ok(code.includes("recent_events: recentEvents"), "the success response is unchanged");
});

console.log(failures === 0 ? "\nOK — Full-only server gates proven" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
