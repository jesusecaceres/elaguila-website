// Package C Build 3 (C5/C6) — pure-policy behavioral selftest. Imports only pure modules (no
// "server-only" imports) so it runs under tsx without a Supabase/Stripe runtime.
// Run: npx tsx scripts/gate-pkgC-c5-c6-selftest.ts
import {
  decideCategoryListingPlan,
  decideBusinessToolsAccess,
  type EntitlementRowFacts,
} from "../app/lib/listingPlans/categoryCommercialPlanPolicy";
import { getRevenuePackageDefinition, isStripeEligiblePackageKey, isPromoEligiblePackageKey } from "../app/lib/listingPlans/revenuePricingMatrix";

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (ok) console.log(`PASS  ${label}`);
  else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
};

const NOW = Date.parse("2026-08-10T00:00:00.000Z");
const future = (days: number) => new Date(NOW + days * 86400000).toISOString();
const past = (days: number) => new Date(NOW - days * 86400000).toISOString();

function row(partial: Partial<EntitlementRowFacts>): EntitlementRowFacts {
  return {
    id: "row-" + Math.random().toString(36).slice(2),
    packageKey: null,
    grantSource: null,
    packageTier: null,
    status: "active",
    startsAt: past(1),
    endsAt: future(30),
    ...partial,
  };
}

// ── Gate 1: package catalog ──────────────────────────────────────────────────────────────────
check(getRevenuePackageDefinition("restaurantes_base_monthly")?.priceCents === 39900, "Restaurante base is 39900");
check(getRevenuePackageDefinition("servicios_base_monthly")?.priceCents === 39900, "Servicios base is 39900");
check(
  (getRevenuePackageDefinition("restaurantes_base_monthly")?.capabilities ?? []).includes("coupons_offers"),
  "Restaurante base includes coupons_offers",
);
check(
  (getRevenuePackageDefinition("servicios_base_monthly")?.capabilities ?? []).includes("coupons_offers"),
  "Servicios base includes coupons_offers",
);
check(getRevenuePackageDefinition("restaurantes_offers_addon") != null, "old Restaurante addon still resolves historically");
check(isStripeEligiblePackageKey("restaurantes_offers_addon") === false, "old Restaurante addon is stripeEligible false");
check(isPromoEligiblePackageKey("restaurantes_offers_addon") === false, "old Restaurante addon is promoEligible false");
check(getRevenuePackageDefinition("restaurantes_offers_addon")?.newSalesRetired === true, "old Restaurante addon is newSalesRetired true");
check(isStripeEligiblePackageKey("servicios_offers_addon") === false, "old Servicios addon is stripeEligible false");
check(isPromoEligiblePackageKey("servicios_offers_addon") === false, "old Servicios addon is promoEligible false");

// ── Gate 3 required tests A-F (Restaurantes) ─────────────────────────────────────────────────

// A. package_key=null, grant_source=print_included, package_tier=full_page, category=restaurantes
{
  const plan = decideCategoryListingPlan({
    category: "restaurantes",
    rows: [row({ packageKey: null, grantSource: "print_included", packageTier: "full_page" })],
    nowMs: NOW,
  });
  const access = decideBusinessToolsAccess({ plan, capability: "coupons_offers" });
  check(access.allowed === true && access.reasonCode === "active_grant", "Test A: qualifying print-included fallback -> coupons_offers true, active_grant");
}

// B. package_key=null, grant_source=admin_manual, category=restaurantes
{
  const plan = decideCategoryListingPlan({
    category: "restaurantes",
    rows: [row({ packageKey: null, grantSource: "admin_manual", packageTier: "digital_only" })],
    nowMs: NOW,
  });
  const access = decideBusinessToolsAccess({ plan, capability: "coupons_offers" });
  check(access.allowed === false, "Test B: admin_manual + null package_key -> coupons_offers false");
}

// C. package_key=null, category=restaurantes alone (no grant_source/tier signal)
{
  const plan = decideCategoryListingPlan({
    category: "restaurantes",
    rows: [row({ packageKey: null, grantSource: null, packageTier: null })],
    nowMs: NOW,
  });
  const access = decideBusinessToolsAccess({ plan, capability: "coupons_offers" });
  check(access.allowed === false, "Test C: category alone is insufficient -> false");
}

// D. active restaurantes_base_monthly + active historical restaurantes_offers_addon
{
  const plan = decideCategoryListingPlan({
    category: "restaurantes",
    rows: [
      row({ packageKey: "restaurantes_base_monthly", grantSource: "stripe_webhook" }),
      row({ packageKey: "restaurantes_offers_addon", grantSource: "stripe_webhook" }),
    ],
    nowMs: NOW,
  });
  const access = decideBusinessToolsAccess({ plan, capability: "coupons_offers" });
  check(
    plan.packageKey === "restaurantes_base_monthly" && access.allowed === true && access.reasonCode === "active_package",
    "Test D: canonical base wins over active legacy addon; no ambiguity",
  );
}

// E. active base package + an unrelated third active entitlement row
{
  const plan = decideCategoryListingPlan({
    category: "restaurantes",
    rows: [
      row({ packageKey: "restaurantes_base_monthly", grantSource: "stripe_webhook" }),
      row({ packageKey: "some_unrelated_future_package", grantSource: "admin_manual" }),
    ],
    nowMs: NOW,
  });
  check(plan.packageKey === "restaurantes_base_monthly", "Test E: base package remains canonical despite an unrelated active row");
}

// F. only the historical addon is active (no base package, no qualifying print row)
{
  const plan = decideCategoryListingPlan({
    category: "restaurantes",
    rows: [row({ packageKey: "restaurantes_offers_addon", grantSource: "stripe_webhook" })],
    nowMs: NOW,
  });
  const access = decideBusinessToolsAccess({ plan, capability: "coupons_offers" });
  check(
    access.allowed === true &&
      access.reasonCode === "legacy_addon_entitlement" &&
      plan.packageKey === "restaurantes_offers_addon",
    "Test F: legacy-addon-only listing gets capability, but is never mislabeled as the base package",
  );
}

// Servicios equivalents (D/F, same shared policy)
{
  const planD = decideCategoryListingPlan({
    category: "servicios",
    rows: [
      row({ packageKey: "servicios_base_monthly", grantSource: "stripe_webhook" }),
      row({ packageKey: "servicios_offers_addon", grantSource: "stripe_webhook" }),
    ],
    nowMs: NOW,
  });
  check(planD.packageKey === "servicios_base_monthly", "Servicios Test D equivalent: canonical base wins");

  const planF = decideCategoryListingPlan({
    category: "servicios",
    rows: [row({ packageKey: "servicios_offers_addon", grantSource: "stripe_webhook" })],
    nowMs: NOW,
  });
  const accessF = decideBusinessToolsAccess({ plan: planF, capability: "coupons_offers" });
  check(accessF.allowed === true && accessF.reasonCode === "legacy_addon_entitlement", "Servicios Test F equivalent");
}

// ── Additional coverage: liveness/expiry, grace/suspended, comp/partner, other categories ────

// A stale 'active' row past its own ends_at is not treated as live (matches the real DB row
// found in Gate 0: restaurantes_offers_addon status='active' but ends_at already in the past).
{
  const plan = decideCategoryListingPlan({
    category: "restaurantes",
    rows: [row({ packageKey: "restaurantes_offers_addon", grantSource: "stripe_webhook", status: "active", endsAt: past(4) })],
    nowMs: NOW,
  });
  check(plan.status === "expired", "stale active-status row past ends_at resolves to expired, not active");
}

// grace preserves capability; suspended removes it (locked Build 1/C3 doctrine).
{
  const rows = [row({ packageKey: "restaurantes_base_monthly", grantSource: "stripe_webhook" })];
  const planGrace = decideCategoryListingPlan({ category: "restaurantes", rows, nowMs: NOW, subscriptionOverride: "grace" });
  const planSuspended = decideCategoryListingPlan({ category: "restaurantes", rows, nowMs: NOW, subscriptionOverride: "suspended" });
  check(decideBusinessToolsAccess({ plan: planGrace, capability: "coupons_offers" }).allowed === true, "grace preserves coupons_offers capability");
  check(decideBusinessToolsAccess({ plan: planSuspended, capability: "coupons_offers" }).allowed === false, "suspended removes coupons_offers capability");
}

// A new comp/partner grant always carries a real package_key -> resolves via the exact same
// canonical path as a real payment, with reasonCode active_grant (not active_package).
{
  const plan = decideCategoryListingPlan({
    category: "restaurantes",
    rows: [row({ packageKey: "restaurantes_base_monthly", grantSource: "comp" })],
    nowMs: NOW,
  });
  const access = decideBusinessToolsAccess({ plan, capability: "coupons_offers" });
  check(access.allowed === true && access.reasonCode === "active_grant", "comp grant with real package_key resolves as canonical, active_grant");
}
{
  const plan = decideCategoryListingPlan({
    category: "servicios",
    rows: [row({ packageKey: "servicios_base_monthly", grantSource: "partner" })],
    nowMs: NOW,
  });
  const access = decideBusinessToolsAccess({ plan, capability: "coupons_offers" });
  check(access.allowed === true && access.reasonCode === "active_grant", "partner grant with real package_key resolves as canonical, active_grant");
}

// Print fallback is category-scoped: the same package_key-null/print_included/qualifying-tier
// facts do NOT grant capability for an unrelated category (e.g. autos has no base-package
// capability model in this build).
{
  const plan = decideCategoryListingPlan({
    category: "autos",
    rows: [row({ packageKey: null, grantSource: "print_included", packageTier: "full_page" })],
    nowMs: NOW,
  });
  check(plan.capabilities.length === 0, "print-included fallback does not apply outside restaurantes/servicios");
}

// No qualifying package at all.
{
  const plan = decideCategoryListingPlan({ category: "restaurantes", rows: [], nowMs: NOW });
  const access = decideBusinessToolsAccess({ plan, capability: "coupons_offers" });
  check(access.allowed === false && access.reasonCode === "no_qualifying_package", "no rows at all -> no_qualifying_package");
}

console.log(
  failures === 0
    ? "gate-pkgC-c5-c6-selftest: all checks passed."
    : `gate-pkgC-c5-c6-selftest: ${failures} FAILURE(S).`,
);
process.exit(failures === 0 ? 0 : 1);
