/**
 * Package C Build 1 — Gate 1: canonical Revenue OS contract pins.
 *
 * Behavioral where pure logic exists; source pins for wiring. Pins the truths that must
 * survive every later Package C gate: server-owned price/package, client amounts ignored,
 * free lanes rejected, success pages read-only, webhook-only fulfillment, cross-endpoint
 * webhook source guards, commercial-state separation.
 *
 * Run from repo root: npx tsx scripts/gate-pkgC-canonical-contract-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  getRevenuePackageDefinition,
  getRevenuePackagePriceCents,
  isStripeEligiblePackageKey,
} from "../app/lib/listingPlans/revenuePricingMatrix";

const REPO_ROOT = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(REPO_ROOT, p), "utf8");

/* 1 — server price truth: matrix-only, locked values. */
{
  assert.equal(getRevenuePackageDefinition("autos_dealer_monthly")?.priceCents, 39900);
  assert.equal(getRevenuePackageDefinition("autos_dealer_inventory_pack_monthly")?.priceCents, 12900);
  assert.equal(getRevenuePackageDefinition("br_agent_monthly")?.priceCents, 39900);
  assert.equal(getRevenuePackageDefinition("br_inventory_pack_monthly")?.priceCents, 9900);
  assert.equal(getRevenuePackageDefinition("br_fsbo_45d")?.priceCents, 4999);
  assert.equal(getRevenuePackageDefinition("rentas_30d")?.priceCents, 2499);
  assert.equal(getRevenuePackageDefinition("restaurantes_base_monthly")?.priceCents, 39900);
  // Owner-locked Build 1 price corrections: offers add-ons are $79/mo, not $99.
  assert.equal(getRevenuePackageDefinition("restaurantes_offers_addon")?.priceCents, 7900);
  assert.equal(getRevenuePackageDefinition("servicios_offers_addon")?.priceCents, 7900);
  assert.equal(getRevenuePackageDefinition("empleos_job_post_paid")?.priceCents, 2499);
  // Free lanes are never Stripe-eligible; the fair is hard-ineligible.
  assert.equal(isStripeEligiblePackageKey("empleos_job_fair_free"), false);
  assert.equal(isStripeEligiblePackageKey("en_venta_free_v1"), false);
  assert.equal(isStripeEligiblePackageKey("comunidad_free"), false);
  // Price resolution never trusts a client amount — the API takes no amount input at all.
  const priced = getRevenuePackagePriceCents({ category: "rentas", packageKey: "rentas_30d" });
  assert.equal(priced.priceCents, 2499);
}

/* 2 — checkout route: server-side validation chain + attempt identity + consent enforcement. */
{
  const route = read("app/api/revenue-os/checkout/route.ts");
  assert.ok(route.includes("validateRevenueCheckoutRequest"), "server-side request validation");
  assert.ok(route.includes("computeCheckoutAttemptKey"), "P0 purchase-attempt identity computed server-side");
  assert.ok(route.includes("findOpenCheckoutAttempt"), "unresolved-attempt lookup before creating a new one");
  assert.ok(route.includes("reusedSession: true"), "open Stripe session is REUSED, never duplicated");
  assert.ok(route.includes("open_attempt_exists"), "concurrent double-click resolves to the winner's session");
  assert.ok(route.includes("packageRequiresRecurringConsent"), "subscription packages gate on consent");
  assert.ok(route.includes("createRecurringConsentRecord"), "consent recorded BEFORE session creation");
}

/* 3 — success pages remain read-only (no write verbs). */
{
  for (const p of [
    "app/(site)/revenue-os/pago/exito/page.tsx",
    "app/(site)/revenue-os/pago/cancelado/page.tsx",
  ]) {
    const src = read(p);
    for (const verb of [".insert(", ".update(", ".upsert(", ".delete("]) {
      assert.ok(!src.includes(verb), `${p} must not contain ${verb}`);
    }
  }
  // BR success client: the legacy internal=1 mutation POST is gone (read-only summary only).
  const brExito = read("app/(site)/clasificados/bienes-raices/pago/exito/BrPagoExitoClient.tsx");
  assert.ok(
    !brExito.includes('fetch("/api/clasificados/leonix/stripe/checkout"'),
    "BR success page must never POST to the legacy checkout route",
  );
  assert.ok(brExito.includes("READ-ONLY"), "read-only doctrine documented at the removal site");
}

/* 4 — webhook is the sole paid truth; ledger claims wrap dispatch. */
{
  const route = read("app/api/revenue-os/webhook/route.ts");
  assert.ok(route.includes("verifyStripeWebhookEvent"), "official signature verification preserved");
  assert.ok(route.includes("claimStripeEvent"), "event-ledger claim before any fulfillment");
  assert.ok(route.includes("settleStripeEvent"), "every outcome settles the ledger row");
  assert.ok(route.includes('"ignored"'), "unhandled events are recorded, not silently dropped");
}

/* 5 — cross-endpoint webhook source guards (six safety pins). */
{
  const autosLegacy = read("app/api/clasificados/autos/stripe/webhook/route.ts");
  assert.ok(
    autosLegacy.includes('k.startsWith("leonix_")') && autosLegacy.includes("canonical_revenue_os_session"),
    "autos legacy webhook must IGNORE canonical Revenue OS sessions (leonix_* namespace)",
  );
  const brLegacy = read("app/api/clasificados/leonix/stripe/webhook/route.ts");
  assert.ok(
    brLegacy.includes('k.startsWith("leonix_")') && brLegacy.includes("canonical_revenue_os_session"),
    "BR legacy webhook must IGNORE canonical Revenue OS sessions",
  );
  assert.ok(
    brLegacy.includes('metadata?.category !== "bienes-raices"'),
    "BR legacy webhook keeps its category guard for legacy sessions",
  );
  // Canonical sessions carry the explicit source namespace; legacy handlers key on the
  // UNPREFIXED metadata that canonical sessions never set.
  const stripeHelper = read("app/lib/listingPlans/revenueStripe.ts");
  assert.ok(stripeHelper.includes('leonix_source: "revenue_os"'), "canonical sessions stamp their source");
  // The canonical webhook fulfills only Revenue OS sessions (payment-record linkage), so a
  // legacy session (no leonix_* metadata) can never be fulfilled by it.
  const fulfillment = read("app/lib/listingPlans/revenueFulfillment.ts");
  assert.ok(fulfillment.includes("isRevenueOsCheckoutSession"), "canonical fulfillment requires Revenue OS session identity");
}

/* 6 — commercial-state separation stays intact (account tier never confers listing plan). */
{
  const shell = read("app/(site)/dashboard/components/LeonixDashboardShell.tsx");
  assert.ok(shell.includes("void plan;"), "the dashboard shell still discards the account-plan prop");
  const monetization = read("app/lib/listingPlans/categoryListingMonetization.ts");
  assert.ok(monetization.includes("accountTierIgnored: true"), "monetization summary still ignores account tier");
}

console.log("gate-pkgC-canonical-contract-selftest: all assertions passed.");
