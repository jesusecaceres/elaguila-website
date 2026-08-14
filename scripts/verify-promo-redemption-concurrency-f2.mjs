// Package F Build F2, promo concurrency closure — focused static contract verifier.
// Proves the shape of the fix (migration SQL, server wiring, response mapping) without executing
// against any database — this program's established "authored, not applied" migration discipline
// means no live RPC call is available to test in this environment. Live concurrency proof is
// deferred to scripts/certify-promo-redemption-concurrency-f3.mjs, to be run against a real
// non-Production Supabase project once the migration is applied as its own authorized step.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

const checks = [];
function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

const MIGRATION = "supabase/migrations/20260812150000_promo_customer_redemption_slot_reservation_rpc.sql";
const MODULE = "app/lib/listingPlans/revenuePromoRedemptions.ts";
const CHECKOUT_ROUTE = "app/api/revenue-os/checkout/route.ts";

// ---------------------------------------------------------------------------------------
// A. Sequential same customer: limit enforced (unchanged pre-condition, still real).
// ---------------------------------------------------------------------------------------
assert("Migration file exists", exists(MIGRATION), "Expected the new RPC migration.");
const mig = exists(MIGRATION) ? read(MIGRATION) : "";
assert(
  "A. RPC counts pending/validated/redeemed (not just terminal redeemed) for the same identity",
  /status in \('pending', 'validated', 'redeemed'\)/.test(mig),
  "Expected the count to include in-flight reservations, not just terminal ones.",
);
assert(
  "A. RPC mirrors promoCodeRules.ts's exact null-defaults-to-1 semantics",
  /coalesce\(p_per_customer_limit, 1\)/.test(mig) && /v_limit >= 1 and v_count >= v_limit/.test(mig),
  "Expected v_limit := coalesce(p_per_customer_limit, 1); if v_limit >= 1 and v_count >= v_limit.",
);

// ---------------------------------------------------------------------------------------
// B. Concurrent same customer: two simultaneous attempts cannot both exceed the limit.
// ---------------------------------------------------------------------------------------
assert(
  "B. RPC takes a transaction-scoped advisory lock before counting/inserting",
  /pg_advisory_xact_lock\(871003, hashtext\(p_promo_code_id::text \|\| ':' \|\| v_identity_key\)\)/.test(mig),
  "Expected a lock keyed on (promo_code_id, customer identity), taken before the count.",
);
assert(
  "B. Lock namespace (871003) does not collide with the existing capacity RPCs (871001/871002)",
  !mig.includes("871001") && !mig.includes("871002"),
  "Expected a fresh, non-colliding advisory lock namespace.",
);
assert(
  "B. Count-then-insert happens inside the same function body after the lock (single transaction)",
  (() => {
    const lockIdx = mig.indexOf("pg_advisory_xact_lock(871003");
    const insertIdx = mig.indexOf("insert into public.leonix_promo_code_redemptions");
    return lockIdx > -1 && insertIdx > lockIdx;
  })(),
  "Expected the INSERT to occur after the advisory lock is taken, within the same plpgsql function (implicit single transaction).",
);
assert(
  "B. RPC is SECURITY DEFINER, service_role only",
  /security definer/.test(mig) &&
    /grant execute on function public\.reserve_promo_customer_redemption_slot[\s\S]{0,200}to service_role/.test(mig),
  "Expected SECURITY DEFINER + service_role-only execute grant, matching the capacity RPC precedent.",
);

// ---------------------------------------------------------------------------------------
// C. Different customers: both may redeem if otherwise eligible.
// ---------------------------------------------------------------------------------------
assert(
  "C. Lock key and count filter are both scoped to the exact resolved customer identity",
  /v_identity_key := coalesce\(p_owner_user_id::text, v_email_norm\)/.test(mig) &&
    /\(p_owner_user_id is not null and r\.owner_user_id = p_owner_user_id\)/.test(mig) &&
    /\(v_email_norm is not null and lower\(r\.email\) = v_email_norm\)/.test(mig),
  "Expected different customers to never share a lock key or count scope.",
);

// ---------------------------------------------------------------------------------------
// Server wiring — RPC replaces the plain insert; limit is server-derived, never client-supplied.
// ---------------------------------------------------------------------------------------
const mod = read(MODULE);
assert(
  "createPendingPromoRedemption calls the RPC instead of a plain insert",
  /supabase\.rpc\("reserve_promo_customer_redemption_slot"/.test(mod),
  "Expected the plain .insert() to be replaced by the atomic RPC call.",
);
assert(
  "perCustomerLimit is a required, server-sourced input (not optional/client-trusted)",
  /perCustomerLimit: number \| null;\s*\}\): Promise/.test(mod),
  "Expected perCustomerLimit as a required field on createPendingPromoRedemption's input.",
);
assert(
  "PromoCheckoutResolution exposes perCustomerLimit from the promo row (server-read, not client input)",
  (mod.match(/perCustomerLimit: row\.per_customer_limit,/g) || []).length >= 2,
  "Expected both success variants of resolvePromoForCheckout to carry row.per_customer_limit.",
);
assert(
  "Blocked reservation maps to the existing truthful promo_ineligible code, not a fabricated success",
  /blockedReason === "per_customer_limit_reached" \? "promo_ineligible"/.test(mod),
  "Expected the limit-reached case to reuse the existing eligibility-rejection code.",
);

const route = read(CHECKOUT_ROUTE);
assert(
  "Checkout route threads perCustomerLimit from resolvePromoForCheckout into createPendingPromoRedemption",
  /promoPerCustomerLimitForRecord = promoResult\.perCustomerLimit/.test(route) &&
    /perCustomerLimit: promoPerCustomerLimitForRecord \?\? null/.test(route),
  "Expected the server-read limit to flow end-to-end without a client-supplied override.",
);
assert(
  "A concurrency-race loss returns the existing truthful 400 promo_ineligible response, not a fabricated 200",
  /redemptionInsert\.code === "promo_ineligible" \? 400 : 500/.test(route),
  "Expected the same status/shape this route already uses for every other eligibility rejection.",
);

// ---------------------------------------------------------------------------------------
// D-G. Preserved, unrelated existing behavior — confirmed untouched by this change.
// ---------------------------------------------------------------------------------------
assert(
  "D. Migration defines exactly one new function (the reservation RPC), nothing else",
  (mig.match(/^create or replace function/gm) || []).length === 1 &&
    /^create or replace function public\.reserve_promo_customer_redemption_slot/m.test(mig),
  "Expected the migration to add only the new reservation function, never touch the redeemed-finalization path.",
);
assert(
  "D. markPromoRedemptionRedeemed's own source code is unmodified by this recovery pass",
  /if \(row\.status === "redeemed"\)/.test(mod),
  "Expected the existing idempotency short-circuit to remain exactly as before.",
);
assert(
  "E. Global max_redemptions check remains in resolvePromoForCheckout, untouched",
  /const max = input\.maxRedemptions;/.test(read("app/lib/listingPlans/promoCodeRules.ts")),
  "Expected the pure validator's global-max logic to be unchanged.",
);
assert(
  "F. Expiration check remains in resolvePromoForCheckout, untouched",
  /Promo code expired/.test(read("app/lib/listingPlans/promoCodeRules.ts")),
  "Expected the pure validator's expiration logic to be unchanged.",
);
assert(
  "G. Category/package/placement scope checks remain in resolvePromoForCheckout, untouched",
  /scopeMatches\(input\.categoryScope, input\.category\)/.test(read("app/lib/listingPlans/promoCodeRules.ts")) &&
    /scopeMatches\(input\.packageScope, input\.packageKey\)/.test(read("app/lib/listingPlans/promoCodeRules.ts")),
  "Expected the pure validator's scope-matching logic to be unchanged.",
);

// ---------------------------------------------------------------------------------------
// Deferred runtime certification — required by this gate when live DB/RPC execution is
// unavailable in the current environment (no migration has been applied anywhere).
// ---------------------------------------------------------------------------------------
assert(
  "F3 runtime certification script exists (deferred live proof for a non-Production Supabase project)",
  exists("scripts/certify-promo-redemption-concurrency-f3.mjs"),
  "Expected a runtime certification script for F3 Preview.",
);

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(c.ok ? `✓ ${c.name}` : `✗ ${c.name}: ${c.detail}`);
}
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);
if (failed.length > 0) process.exit(1);
