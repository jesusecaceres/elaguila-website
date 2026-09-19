/**
 * Servicios Final Consolidated Lifecycle Execution — Gate 12 (checkout server trust, 2026-09-18).
 *
 * The shared Revenue OS checkout route's default branch (which the Servicios
 * `servicios_base_monthly` checkout falls into — it is not one of the special early-exit
 * categories) let a client-submitted `body.ownerUserId` take priority over the server-verified
 * authenticated bearer user whenever a bearer session existed
 * (`body.ownerUserId?.trim() || bearerUserId || null`). The real client never sends
 * `ownerUserId` at all (confirmed: no caller in `revenueCategoryCheckoutClient.ts` /
 * `revenueCategoryCheckoutPayload.ts` sets it), so this had no effect on the golden path — but a
 * crafted request with a valid bearer token for one user and a different `ownerUserId` in the body
 * could borrow another user's identity for the owner-scoped verified-intro-discount phone-identity
 * lookup (`leonix_verified_phone_identities` `.eq("owner_user_id", ownerUserId)`) or the
 * existing-row lookup — real identity confusion, not merely defensive hardening.
 *
 * Fix: the authenticated bearer now always wins when present in that branch;
 * `body.ownerUserId` remains only as a fallback for the (bearer-absent) case. The special
 * early-exit categories (Restaurantes/Autos Dealer/Bienes/Rentas renewal/etc.) already only ever
 * used `serverVerifiedOwnerUserId ?? bearerUserId` — untouched.
 *
 * Separately confirmed (no fix needed): `listingId` is already the sole payment/activation
 * authority in `activatePaidServiciosListingFromRevenueOs` (fail-closed `.eq("id",
 * listingId).in("listing_status", [...])` lookup+patch) — `leonixAdId` is accepted into that
 * function's input type but never read/used for any decision, i.e. already additive/observational
 * only, matching the owner's requirement without any change needed there. $399/month pricing,
 * verified-intro 15% first-payment-only/no-stacking, newsletter behavior, and payment methods were
 * not touched by this gate.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-exec-gate12-checkout-server-trust.ts
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
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const raw = (rel: string) =>
  stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n"));

const ROUTE = "app/api/revenue-os/checkout/route.ts";
const FULFILLMENT = "app/lib/listingPlans/revenueServiciosFulfillment.ts";
const CHECKOUT_CLIENT_PAYLOAD = "app/lib/listingPlans/revenueCategoryCheckoutPayload.ts";

check("the default checkout branch now trusts the authenticated bearer over a client-submitted ownerUserId", () => {
  const src = raw(ROUTE);
  assert.ok(src.includes("const ownerUserId = isRestauranteAddonOnlyEarly"));
  const idx = src.indexOf("const ownerUserId = isRestauranteAddonOnlyEarly");
  const block = src.slice(idx, idx + 500);
  assert.ok(block.includes("bearerUserId || body.ownerUserId?.trim() || null;"), "bearer must win over a client-supplied ownerUserId");
  assert.ok(!/:\s*body\.ownerUserId\?\.trim\(\)\s*\|\|\s*bearerUserId/.test(block), "the old, client-first priority order must be gone");
});

check("REGRESSION GUARD: the special early-exit categories still only ever use server-verified owner identity", () => {
  const src = raw(ROUTE);
  const idx = src.indexOf("const ownerUserId = isRestauranteAddonOnlyEarly");
  const block = src.slice(idx, idx + 500);
  assert.ok(block.includes("? serverVerifiedOwnerUserId ?? bearerUserId"));
});

check("FIXTURE: a crafted body.ownerUserId can no longer override an authenticated bearer identity", () => {
  // Simulates the exact resolution the fixed route now performs.
  function resolveOwnerUserId(bearerUserId: string | null, bodyOwnerUserId: string | null): string | null {
    return bearerUserId || bodyOwnerUserId?.trim() || null;
  }
  const attackerBearer = "attacker-uuid";
  const victimClaimedInBody = "victim-uuid";
  assert.equal(
    resolveOwnerUserId(attackerBearer, victimClaimedInBody),
    attackerBearer,
    "an authenticated attacker must never be able to claim a victim's identity via the request body",
  );
  // The legitimate bearer-absent fallback (e.g. a genuinely unauthenticated/edge case) is preserved.
  assert.equal(resolveOwnerUserId(null, victimClaimedInBody), victimClaimedInBody);
});

check("the real Servicios checkout client never sends ownerUserId at all (golden path was never relying on the vulnerable priority)", () => {
  const src = raw(CHECKOUT_CLIENT_PAYLOAD);
  assert.ok(!/ownerUserId/.test(src), "the checkout payload builder must not construct an ownerUserId field");
});

check("listingId remains the sole payment/activation authority in Servicios fulfillment — leonixAdId is accepted but never used for any decision", () => {
  const src = raw(FULFILLMENT);
  const idx = src.indexOf("export async function activatePaidServiciosListingFromRevenueOs(input: {");
  assert.ok(idx > 0);
  const bodyStart = src.indexOf("): Promise<ServiciosRevenueActivationResult> {", idx);
  const bodyEnd = src.indexOf("\nexport ", bodyStart + 10);
  const body = src.slice(bodyStart, bodyEnd > 0 ? bodyEnd : bodyStart + 2500);
  assert.ok(body.includes('.eq("id", listingId)'), "activation must look up the row strictly by the canonical listing id");
  assert.ok(!/input\.leonixAdId/.test(body), "leonixAdId must never gate or drive any activation decision");
});

if (failures.length) {
  console.error(`\nverify-servicios-exec-gate12-checkout-server-trust: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-exec-gate12-checkout-server-trust: PASS");
