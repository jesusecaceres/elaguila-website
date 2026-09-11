/**
 * Gate SERVICIOS-P7-BLOCKER-REPAIR-01 — Repair A (SERVICIOS-PUBLISH-AUTHORITY-1) regression proof.
 *
 * Closes B1 (ownership), B2 (paid reactivation), B3 (Leonix authority).
 *
 * Execution-first: the decision functions the routes call are imported and run directly, and the
 * B2 authority is composed with the REAL shared `decideCategoryListingPlan` (fed fabricated
 * entitlement rows), so the chain entitlement → plan → reactivation decision is executed, not
 * re-implemented. Source assertions then prove both routes actually call those functions at the
 * right points. Comments are stripped before every source assertion.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-publish-authority.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  decideServiciosOwnerSaveStatus,
  decideServiciosReactivationAuthority,
  isServiciosListingOwner,
  SERVICIOS_LEONIX_LOCKED_STATUSES,
} from "../app/(site)/clasificados/servicios/lib/serviciosOwnerMutationPolicy";
import {
  decideCategoryListingPlan,
  type EntitlementRowFacts,
} from "../app/lib/listingPlans/categoryCommercialPlanPolicy";

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
const src = (rel: string) => stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8"));

const PUBLISH = src("app/api/clasificados/servicios/publish/route.ts");
const MANAGE = src("app/api/clasificados/servicios/manage/route.ts");
const RESOLVER = src("app/(site)/clasificados/servicios/lib/serviciosReactivationAuthorityServer.ts");
const FULFILL = src("app/lib/listingPlans/revenueServiciosFulfillment.ts");

const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";

// =====================================================================================
// B1 — OWNERSHIP
// =====================================================================================

check("B1: the owner may mutate their own listing", () => {
  assert.equal(isServiciosListingOwner(A, A), true);
});
check("B1: account B cannot mutate account A's listing", () => {
  assert.equal(isServiciosListingOwner(A, B), false);
});
check("B1: account B cannot mutate a NULL-owner listing (no implicit claim)", () => {
  for (const unowned of [null, undefined, "", "   "]) {
    assert.equal(isServiciosListingOwner(unowned, B), false, `owner ${JSON.stringify(unowned)} must not be claimable`);
  }
});
check("B1: an unauthenticated actor owns nothing — not even an unowned row", () => {
  assert.equal(isServiciosListingOwner(A, null), false);
  assert.equal(isServiciosListingOwner(null, null), false);
  assert.equal(isServiciosListingOwner("", ""), false);
});

check("B1: the listingId (canonical) path uses the strict rule — no `!owner ||` claim", () => {
  const block = PUBLISH.slice(PUBLISH.indexOf("if (existingListingIdRaw &&"), PUBLISH.indexOf("if (!canonicalListingId && existingSlugRaw"));
  assert.match(block, /isServiciosListingOwner\(row\.owner_user_id, ownerUserId\)/);
  assert.ok(!/!owner\s*\|\|/.test(block), "canonical path must not treat a missing owner as permission");
  assert.match(block, /listing_owner_mismatch/, "a non-owned listingId must be refused, not silently re-targeted");
});
check("B1: the slug fallback path uses the strict rule — cannot claim a NULL-owner row", () => {
  const start = PUBLISH.indexOf("if (!canonicalListingId && existingSlugRaw");
  const block = PUBLISH.slice(start, PUBLISH.indexOf("const draft = mapClasificadosServiciosApplicationToServiciosDraft", start));
  assert.match(block, /isServiciosListingOwner\(row\.owner_user_id, ownerUserId\)/);
  assert.ok(!/!owner\s*\|\|/.test(block), "slug fallback must not treat a missing owner as permission");
});
check("B1: the strict payment guard uses the strict rule", () => {
  assert.ok(!/!existingForGuard\.owner_user_id\s*\|\|/.test(PUBLISH), "the old NULL-owner guard clause must be gone");
  assert.match(PUBLISH, /isServiciosListingOwner\(existingForGuard\?\.owner_user_id, ownerUserId\)/);
});
check("B1: the write itself re-checks ownership and can never re-assign owner_user_id", () => {
  const start = PUBLISH.indexOf("if (existing) {");
  const block = PUBLISH.slice(start, PUBLISH.indexOf("} else {", start));
  assert.match(block, /if \(!isServiciosListingOwner\(existing\.owner_user_id, ownerUserId\)\)/);
  assert.ok(!/owner_user_id:\s*ownerUserId/.test(block), "an update of an existing row must not write owner_user_id");
});
check("B1: allocateSlug returns an UNUSED slug, so a refused claim can only create its own new row", () => {
  const fn = PUBLISH.slice(PUBLISH.indexOf("async function allocateSlug"), PUBLISH.indexOf("function stripAdvertiserVerificationFlags"));
  assert.match(fn, /if \(!data\) return candidate;/);
});
check("B1: the manage route uses the same strict rule", () => {
  assert.match(MANAGE, /if \(!isServiciosListingOwner\(row\.owner_user_id, ownerUserId\)\)/);
});

// =====================================================================================
// B2 — PAID REACTIVATION (real shared plan policy → reactivation decision)
// =====================================================================================

const NOW = Date.parse("2026-09-10T12:00:00Z");
const FUTURE = "2026-10-10T12:00:00Z";
const PAST = "2026-08-01T12:00:00Z";
const row = (over: Partial<EntitlementRowFacts>): EntitlementRowFacts => ({
  id: "ent-1",
  packageKey: "servicios_base_monthly",
  grantSource: "stripe_webhook",
  packageTier: null,
  status: "active",
  startsAt: "2026-08-10T12:00:00Z",
  endsAt: FUTURE,
  ...over,
});
function authority(rows: EntitlementRowFacts[], opts: { override?: "grace" | "suspended" | null; sub?: string | null } = {}) {
  const plan = decideCategoryListingPlan({ category: "servicios", rows, nowMs: NOW, subscriptionOverride: opts.override ?? null });
  return decideServiciosReactivationAuthority({
    planStatus: plan.status,
    capabilitySource: plan.capabilitySource,
    latestSubscriptionStatus: opts.sub ?? null,
  });
}

check("B2: paused + active base entitlement → Resume allowed", () => {
  assert.deepEqual(authority([row({})], { sub: "active" }), { allowed: true });
});
check("B2: paused + subscription in GRACE → Resume allowed (grace honoured)", () => {
  assert.deepEqual(authority([row({})], { override: "grace", sub: "grace" }), { allowed: true });
});
check("B2: paused + subscription CANCELLED (entitlement still inside ends_at) → Resume refused", () => {
  const d = authority([row({})], { sub: "canceled" });
  assert.equal(d.allowed, false);
  if (!d.allowed) assert.equal(d.reason, "subscription_inactive");
});
check("B2: paused + subscription SUSPENDED (payment / chargeback) → Resume refused", () => {
  assert.equal(authority([row({})], { override: "suspended", sub: "suspended" }).allowed, false);
});
check("B2: paused + base entitlement LAPSED (ends_at passed) → Resume refused", () => {
  const d = authority([row({ endsAt: PAST })]);
  assert.equal(d.allowed, false);
  if (!d.allowed) assert.equal(d.reason, "no_base_commercial_right");
});
check("B2: paused + NO entitlement at all (never paid) → Resume refused", () => {
  assert.equal(authority([]).allowed, false);
});
check("B2: a legacy offers add-on alone is NOT a base right", () => {
  assert.equal(authority([row({ packageKey: "servicios_offers_addon" })]).allowed, false);
});
check("B2: a scheduled (not yet started) base entitlement does not reactivate", () => {
  assert.equal(authority([row({ status: "scheduled", startsAt: FUTURE })]).allowed, false);
});

check("B2: an ordinary edit of a PAUSED listing keeps it paused (visibility only via Resume)", () => {
  for (const baseAuthorityValid of [true, false, null]) {
    const d = decideServiciosOwnerSaveStatus({
      existingStatus: "paused_unpublished",
      pendingPaymentRequested: false,
      baseAuthorityValid,
      initialStatus: "published",
    });
    assert.deepEqual(d, { kind: "write", status: "paused_unpublished", checkoutRequired: false });
  }
});
check("B2: a pending-payment save of a paused listing with a VALID plan stays paused, no checkout", () => {
  assert.deepEqual(
    decideServiciosOwnerSaveStatus({ existingStatus: "paused_unpublished", pendingPaymentRequested: true, baseAuthorityValid: true, initialStatus: "published" }),
    { kind: "write", status: "paused_unpublished", checkoutRequired: false },
  );
});
check("B2: a pending-payment save of a paused LAPSED listing → pending_payment (real re-purchase)", () => {
  for (const baseAuthorityValid of [false, null]) {
    assert.deepEqual(
      decideServiciosOwnerSaveStatus({ existingStatus: "paused_unpublished", pendingPaymentRequested: true, baseAuthorityValid, initialStatus: "published" }),
      { kind: "write", status: "pending_payment", checkoutRequired: true },
    );
  }
});
check("B2: no save path of a paused listing ever writes `published`", () => {
  for (const pendingPaymentRequested of [true, false]) {
    for (const baseAuthorityValid of [true, false, null]) {
      const d = decideServiciosOwnerSaveStatus({ existingStatus: "paused_unpublished", pendingPaymentRequested, baseAuthorityValid, initialStatus: "published" });
      assert.ok(d.kind === "write" && d.status !== "published");
    }
  }
});
check("NO-RECHARGE: an ordinary or pending save of an ACTIVE published listing stays published, no checkout", () => {
  for (const pendingPaymentRequested of [true, false]) {
    assert.deepEqual(
      decideServiciosOwnerSaveStatus({ existingStatus: "published", pendingPaymentRequested, baseAuthorityValid: null, initialStatus: "published" }),
      { kind: "write", status: "published", checkoutRequired: false },
    );
  }
});

check("B2: Resume calls the canonical authority BEFORE the status update, and refuses with 402", () => {
  const idxAuthority = MANAGE.indexOf("await resolveServiciosReactivationAuthority(row.id)");
  const idxUpdate = MANAGE.indexOf(".update({ listing_status: nextStatus");
  assert.ok(idxAuthority > 0, "Resume must consult the canonical authority");
  assert.ok(idxUpdate > idxAuthority, "the authority check must run before the listing is published");
  const guard = MANAGE.slice(idxAuthority, idxUpdate);
  assert.match(guard, /if \(!authority\.allowed\)/);
  assert.match(guard, /status: 402/);
});
check("B2: the publish write site consults the authority only for a paused pending save", () => {
  assert.match(PUBLISH, /existingStatus\.trim\(\)\.toLowerCase\(\) === "paused_unpublished"/);
  assert.match(PUBLISH, /await resolveServiciosReactivationAuthority\(existing\.id\)/);
  assert.match(PUBLISH, /decideServiciosOwnerSaveStatus\(\{/);
});
check("B2: the old unconditional paused → published write is gone", () => {
  assert.ok(
    !/pendingPayment && existing\.listing_status === SERVICIOS_LISTING_STATUS_PUBLISHED\s*\?\s*SERVICIOS_LISTING_STATUS_PUBLISHED\s*:\s*listingStatus/.test(PUBLISH),
    "the previous nextStatus expression (which published paused rows) must be replaced",
  );
});
check("B2: the reactivation resolver reads only canonical truth and fails CLOSED", () => {
  assert.match(RESOLVER, /resolveCategoryListingPlan\(\{/);
  assert.match(RESOLVER, /from\("leonix_subscription_records"\)/);
  assert.match(RESOLVER, /catch \{\s*return \{ allowed: false/);
  assert.match(RESOLVER, /if \(!id \|\| !isSupabaseAdminConfigured\(\)\)/);
});

// =====================================================================================
// B3 — LEONIX AUTHORITY
// =====================================================================================

check("B3: suspended and rejected are the Leonix-locked statuses", () => {
  assert.deepEqual([...SERVICIOS_LEONIX_LOCKED_STATUSES].sort(), ["rejected", "suspended"]);
});
check("B3: a suspended row cannot be owner-reactivated by ANY save (incl. pending-payment)", () => {
  for (const pendingPaymentRequested of [true, false]) {
    for (const baseAuthorityValid of [true, false, null]) {
      assert.deepEqual(
        decideServiciosOwnerSaveStatus({ existingStatus: "suspended", pendingPaymentRequested, baseAuthorityValid, initialStatus: "published" }),
        { kind: "refuse", reason: "listing_locked_by_leonix" },
      );
    }
  }
});
check("B3: a rejected row cannot be owner-reactivated by ANY save", () => {
  for (const pendingPaymentRequested of [true, false]) {
    assert.deepEqual(
      decideServiciosOwnerSaveStatus({ existingStatus: "REJECTED", pendingPaymentRequested, baseAuthorityValid: true, initialStatus: "published" }),
      { kind: "refuse", reason: "listing_locked_by_leonix" },
    );
  }
});
check("B3: a pending-payment save can no longer erase an admin/moderation state", () => {
  const d = decideServiciosOwnerSaveStatus({ existingStatus: "suspended", pendingPaymentRequested: true, baseAuthorityValid: false, initialStatus: "published" });
  assert.ok(d.kind === "refuse", "suspended → pending_payment was the webhook bypass; it must be refused");
});
check("B3: pending_review is preserved — an owner cannot self-approve", () => {
  for (const pendingPaymentRequested of [true, false]) {
    assert.deepEqual(
      decideServiciosOwnerSaveStatus({ existingStatus: "pending_review", pendingPaymentRequested, baseAuthorityValid: null, initialStatus: "published" }),
      { kind: "write", status: "pending_review", checkoutRequired: false },
    );
  }
});
check("B3: an unknown status fails CLOSED", () => {
  assert.deepEqual(
    decideServiciosOwnerSaveStatus({ existingStatus: "archived", pendingPaymentRequested: false, baseAuthorityValid: null, initialStatus: "published" }),
    { kind: "refuse", reason: "unknown_listing_status" },
  );
});
check("B3: the publish route refuses locked rows on BOTH the guard and the write site", () => {
  const guard = PUBLISH.slice(PUBLISH.indexOf("if (strict && isSupabaseAdminConfigured() && !pendingPayment)"), PUBLISH.indexOf("const listingStatus = pendingPayment"));
  assert.match(guard, /SERVICIOS_LEONIX_LOCKED_STATUSES\.has\(/);
  assert.match(guard, /serviciosListingLockedResponse\(slug, lang\)/);
  const write = PUBLISH.slice(PUBLISH.indexOf("if (existing) {"));
  assert.match(write, /saveDecision\.reason === "listing_locked_by_leonix"/);
});
check("B3: payment-suspension recovery stays with the Revenue OS lifecycle (webhook still refuses locked rows)", () => {
  assert.match(FULFILL, /status === "suspended" \|\| status === "rejected"/);
  assert.match(FULFILL, /\.in\("listing_status", \[\.\.\.SERVICIOS_ACTIVATABLE_PRE_PUBLISH_STATUSES\]\)/);
});

// =====================================================================================
// Honest client messaging for the new refusals
// =====================================================================================

check("UX: a checkout request that needed no checkout returns an honest message (not a fake failure)", () => {
  assert.match(PUBLISH, /noCheckoutRequired: true, message: checkoutNotNeededMessage/);
});
check("UX: both dashboards surface a refused Resume instead of failing silently", () => {
  const svc = src("app/(site)/dashboard/servicios/page.tsx");
  const mis = src("app/(site)/dashboard/mis-anuncios/page.tsx");
  assert.match(svc, /setManageNotice\(/);
  assert.match(svc, /role="alert"/);
  assert.match(mis, /res\.status === 402 && data\?\.message/);
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-servicios-publish-authority: PASS");
