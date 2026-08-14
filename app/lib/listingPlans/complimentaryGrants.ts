/**
 * Package C Build 3 (C5) — comp / partner / support commercial grants. Server-only.
 *
 * Calls ONLY activatePackageEntitlement()/revokePackageEntitlement() — never
 * activateEntitlementsForPayment(), never activatePlacementForRealPayment(). A comp or partner
 * grant creates exactly one listing_package_entitlements row, zero leonix_placement_entitlements
 * rows, and zero leonix_payment_records rows, always carrying a real Revenue OS package_key so it
 * resolves through the exact same canonical path as a real payment (categoryCommercialPlanPolicy).
 *
 * Idempotency is not a pre-check SELECT — it rides the same M4 live-uniqueness index
 * (listing_source, listing_id, package_key) that activatePackageEntitlement's insert already
 * relies on (23505 -> re-select-and-return-idempotent). Revocation is a conditional CAS UPDATE.
 */

import "server-only";
import {
  activatePackageEntitlement,
  revokePackageEntitlement,
  type EntitlementFulfillmentResult,
} from "./revenueEntitlementFulfillment";
import { getRevenuePackageDefinition } from "./revenuePricingMatrix";

const DEFAULT_GRANT_DURATION_DAYS = 30;

function resolveGrantWindow(durationDays?: number | null): { startsAt: Date; endsAt: Date } {
  const startsAt = new Date();
  const endsAt = new Date(startsAt);
  endsAt.setUTCDate(endsAt.getUTCDate() + (durationDays ?? DEFAULT_GRANT_DURATION_DAYS));
  return { startsAt, endsAt };
}

export type ComplimentaryGrantInput = {
  category: string;
  listingId: string;
  /** Real Revenue OS package key — the grant is issued "as if" this real package. */
  packageKey: string;
  actorAdminUserId: string;
  reason: string;
  customerName?: string | null;
  businessName?: string | null;
  /** Defaults to 30 days; pass a real contracted length when known. */
  durationDays?: number | null;
};

export async function grantComplimentaryAccess(
  input: ComplimentaryGrantInput,
): Promise<EntitlementFulfillmentResult> {
  const packageDef = getRevenuePackageDefinition(input.packageKey);
  if (!packageDef) {
    return { ok: false, code: "unknown_package_key", message: `Unknown package_key: ${input.packageKey}` };
  }
  const { startsAt, endsAt } = resolveGrantWindow(input.durationDays);
  return activatePackageEntitlement({
    packageDef,
    category: input.category,
    listingId: input.listingId,
    grantSource: "comp",
    startsAt,
    endsAt,
    sourceDescriptor: `comp:${input.actorAdminUserId}:${startsAt.toISOString()}`,
    actorAdminUserId: input.actorAdminUserId,
    reason: input.reason,
    customerName: input.customerName ?? null,
    businessName: input.businessName ?? null,
  });
}

export async function grantPartnerCourtesy(
  input: ComplimentaryGrantInput,
): Promise<EntitlementFulfillmentResult> {
  const packageDef = getRevenuePackageDefinition(input.packageKey);
  if (!packageDef) {
    return { ok: false, code: "unknown_package_key", message: `Unknown package_key: ${input.packageKey}` };
  }
  const { startsAt, endsAt } = resolveGrantWindow(input.durationDays);
  return activatePackageEntitlement({
    packageDef,
    category: input.category,
    listingId: input.listingId,
    grantSource: "partner",
    startsAt,
    endsAt,
    sourceDescriptor: `partner:${input.actorAdminUserId}:${startsAt.toISOString()}`,
    actorAdminUserId: input.actorAdminUserId,
    reason: input.reason,
    customerName: input.customerName ?? null,
    businessName: input.businessName ?? null,
  });
}

export async function revokeComplimentaryGrant(input: {
  packageEntitlementId: string;
  actorAdminUserId: string;
  reason?: string | null;
}): Promise<{ ok: boolean; idempotent?: boolean; code?: string; message?: string }> {
  return revokePackageEntitlement({
    packageEntitlementId: input.packageEntitlementId,
    revokedBy: input.actorAdminUserId,
    reason: input.reason ?? null,
  });
}
