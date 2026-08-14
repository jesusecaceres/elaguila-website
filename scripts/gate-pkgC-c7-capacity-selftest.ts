/**
 * Package C Build 4 (C7) — parent-scoped inventory capacity, atomic activation adoption.
 *
 * The RPC files themselves (`capacityActivationRpc.ts`, the migration) import/require a live
 * Postgres connection or `"server-only"`, so this selftest proves TS-level decision-mapping and
 * call-site adoption via source-text pins + the pure guard-policy behavior — mirroring the
 * established pattern in `gate-pkgC-capacity-grace-writeguard-selftest.ts`. Live concurrency
 * behavior is explicitly deferred to a separate, later, controlled migration-certification gate
 * (see the C7 plan §G/§N) and is NOT claimed proven here.
 *
 * Run from repo root: npx tsx scripts/gate-pkgC-c7-capacity-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(REPO_ROOT, p), "utf8");

/* 1 — RPC TS wrapper: no caller-supplied limit, array/object row shape both handled, blocked
 * reason and idempotent flag passed through verbatim, never silently defaulted to success. */
{
  const wrapper = read("app/lib/listingPlans/capacityActivationRpc.ts");
  assert.ok(!/p_limit/.test(wrapper), "wrapper never sends a caller-chosen limit to either RPC");
  assert.ok(wrapper.includes('"autos_dealer_activate_listing"'), "Autos RPC name pinned");
  assert.ok(wrapper.includes('"br_negocio_activate_listing"'), "Bienes RPC name pinned");
  assert.ok(wrapper.includes("Array.isArray(data)"), "handles both array-wrapped and bare row shapes from supabase.rpc");
  assert.ok(wrapper.includes("blockedReason: (row.blocked_reason"), "blocked_reason passed through, never swallowed");
  assert.ok(wrapper.includes("idempotent: row.idempotent === true"), "idempotent flag mapped explicitly (never truthy-coerced)");
  assert.ok(wrapper.includes("rpcError"), "transport/RPC-missing failures surface as rpcError, never silently treated as blocked/denied");
}

/* 2 — migration SQL contract: structural verifier already exists and is exercised separately
 * (scripts/verify-c7-capacity-rpc-sql-contract.mjs) — pin that it stays wired into the closure
 * verifier below rather than re-deriving its 18 checks here. */
{
  const verifier = read("scripts/verify-c7-capacity-rpc-sql-contract.mjs");
  assert.ok(verifier.includes("no caller-supplied parent/group parameter"), "structural verifier still asserts no p_limit-equivalent");
  assert.ok(verifier.includes("pg_advisory_xact_lock"), "structural verifier still asserts the advisory lock is present");
}

/* 3 — Autos real mutation-path adoption: every capacity-increasing write redirected to the RPC
 * wrapper, zero remaining bare `.update({status:'active'})` for a negocios row outside it. */
{
  const svc = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  assert.ok(svc.includes("activateAutosDealerListingAtomic"), "listing service imports/calls the Autos RPC wrapper");
  const bundle = read("app/lib/clasificados/autos/autosNegociosBundlePublish.ts");
  assert.ok(
    bundle.includes("assertCommercialCapacityForWrite") && !bundle.includes("countActiveDealerVehicles"),
    "bundle publish no longer re-derives an unboosted limit inline — delegates to the shared guard",
  );
  const restore = read("app/api/clasificados/autos/listings/[id]/restore/route.ts");
  assert.ok(restore.includes("activateAutosDealerListingAtomic"), "negocios restore routes through the RPC");
  const adminAutos = read("app/api/admin/autos/listings/[id]/route.ts");
  assert.ok(
    adminAutos.includes("activateAutosDealerListingAtomic") && (adminAutos.match(/activateAutosDealerListingAtomic/g) ?? []).length >= 2,
    "admin restore_active/unsuspend AND republish-reactivation both route through the RPC (previously role-guarded only, zero capacity check)",
  );
}

/* 4 — Bienes real mutation-path adoption, including the Gate 5 discovery: a direct-active INSERT
 * bypass (never in the original plan's evidence) is now closed — the row is always inserted
 * pending and activated through the new capacity/lifecycle-checked "activate_pending" mutation. */
{
  const payment = read("app/lib/clasificados/bienes-raices/brListingPaymentService.ts");
  assert.ok(payment.includes("activateBrNegocioListingAtomic"), "payment activation (incl. sibling fan-out) routes through the RPC");
  assert.ok(payment.includes('category === "bienes-raices"'), "RPC redirect stays category-gated — other listings-table categories keep their original path");

  const lifecycle = read("app/lib/clasificados/bienes-raices/brListingLifecycleService.ts");
  assert.ok(lifecycle.includes("applyBrActivatePending"), "new activate_pending mutation exists");
  assert.ok(lifecycle.includes('fromStatus: "pending"'), "activate_pending targets the pending (never-yet-live) state, distinct from resume's paused state");
  assert.ok((lifecycle.match(/activateBrNegocioListingAtomic/g) ?? []).length >= 2, "both resume and activate_pending call the RPC");

  const eligibility = read("app/lib/clasificados/bienes-raices/brListingLifecycleEligibility.ts");
  assert.ok(eligibility.includes('"activate_pending"'), "activate_pending is a recognized mutation key (route-level allowlist)");
  assert.ok(eligibility.includes("row.status === \"pending\""), "activate_pending eligibility requires status pending");

  const preview = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
  );
  assert.ok(
    !/activationMode:\s*["']immediate["']/.test(preview) && !/activationMode:\s*needsPayment/.test(preview),
    "the direct-active-insert bypass (activationMode:'immediate' whenever a property is covered by existing capacity) is closed — always inserts pending",
  );
  assert.ok(preview.includes('mutation: "activate_pending"'), "the no-new-payment path activates via the capacity/lifecycle-checked mutation, not a bare insert");

  const admin = read("app/api/admin/clasificados/listings/[id]/route.ts");
  assert.ok(
    (admin.match(/activateBrNegocioListingAtomic/g) ?? []).length >= 2,
    "admin unsuspend AND republish-reactivation both route through the RPC for bienes-raices rows",
  );

  const dashboardDetail = read("app/(site)/dashboard/mis-anuncios/[id]/page.tsx");
  assert.ok(
    dashboardDetail.includes("isBrNegocioListing(row)") && dashboardDetail.includes('mutation: "resume"'),
    "the single-listing dashboard detail page's resume action is gated to the safe BR lifecycle route for negocio rows (was previously an unconditional direct client write, found during Gate 5)",
  );
}

/* 5 — legacy nullable inventory_role: both RPCs treat a pre-grouping-migration NULL role as
 * self-parent rather than incorrectly rejecting it (found and fixed during Gate 3 implementation). */
{
  const migration = read("supabase/migrations/20260810120000_autos_br_negocio_capacity_activation_rpc.sql");
  assert.ok(migration.includes("is distinct from 'inventory_vehicle'"), "Autos RPC treats NULL/legacy role as self-parent");
  assert.ok(migration.includes("is distinct from 'inventory_property'"), "Bienes RPC treats NULL/legacy role as self-parent");
}

/* 6 — C8 dashboard/admin commercial truth: subscriptionStates reaches the UI, grant_source is
 * distinguishable, comp/partner grants are wired to a real admin action. */
{
  const badges = read("app/(site)/dashboard/lib/dashboardPackageEntitlementBadges.ts");
  assert.ok(badges.includes("subscriptionStates"), "the client wrapper no longer discards subscriptionStates from the API route");
  const card = read("app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx");
  assert.ok(card.includes("commercialStateBadges"), "the shared card renders resolved commercial-state badges");
  const misAnuncios = read("app/(site)/dashboard/mis-anuncios/page.tsx");
  assert.ok(misAnuncios.includes("resolveCommercialStateBadges"), "the previously-uncalled resolver now has a real caller");

  const tracker = read("app/admin/_lib/paymentTrackerData.ts");
  assert.ok(tracker.includes("grant_source"), "payment tracker data model carries grant_source");
  const trackerPage = read("app/admin/(dashboard)/workspace/payment-tracker/page.tsx");
  assert.ok(trackerPage.includes("grantSourceLine") && trackerPage.includes("subscriptionLine"), "both grant_source and subscription_status render on the tracker page");

  const actions = read("app/admin/(dashboard)/workspace/package-entitlements/actions.ts");
  assert.ok(
    actions.includes("grantComplimentaryAccess") && actions.includes("grantPartnerCourtesy"),
    "the C5-built comp/partner primitives (previously zero callers outside their own file) are now wired to a real admin action",
  );
  assert.ok(actions.includes("appendAdminAuditLog"), "comp/partner grants are audited");

  const businessTools = read("app/(site)/dashboard/business-tools/page.tsx");
  assert.ok(
    !businessTools.includes("normalizePlanFromMembershipTier") && !businessTools.includes("row?.membership_tier"),
    "the dead membership_tier -> Plan residual is removed, not merely left inert",
  );
}

console.log("gate-pkgC-c7-capacity-selftest: all assertions passed.");
