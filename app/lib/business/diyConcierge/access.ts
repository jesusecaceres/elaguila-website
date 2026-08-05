/**
 * TODAY-2 — shared exact-business-access resolver for every owner-facing DIY Concierge route.
 * Implements the locked "Exact Business Access Rule": never grants personalized access from
 * owner_user_id alone. Requires an authenticated user, an exact active membership for the exact
 * businessId supplied, and a server-resolved entitlement state — failing closed with
 * `pending_entitlement_linkage` (never a guess) when package linkage cannot be proven.
 */
import "server-only";

import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";
import { findActiveMembershipForBusinessAndUser } from "@/app/lib/business/repositories/membershipsRepo";
import { getBusinessByIdForCurrentUser } from "@/app/lib/business/repositories/businessesRepo";
import { resolveDiyConciergeFlagTier } from "./featureFlag";
import { resolveConciergeEntitlement, type ResolvedConciergeEntitlement } from "./entitlement";
import type { Business } from "../types";
import type { BusinessMembership } from "../types";

export type DiyAccessResult =
  | { ok: true; userId: string; email: string; business: Business; membership: BusinessMembership; entitlement: ResolvedConciergeEntitlement }
  | { ok: false; status: 401 | 403 | 404; error: "unauthorized" | "missing_business_id" | "business_not_found" | "cross_business_denied" };

/**
 * Resolves and verifies exact business access for the current request. `businessId` MUST come
 * from the caller-supplied query/body value the way every other route in this package expects,
 * but access is only ever granted after verifying a real, active membership row for that exact
 * (businessId, authUserId) pair — never inferred from any other business the user happens to own.
 */
export async function resolveDiyAccess(req: { headers: { get(name: string): string | null } }, businessId: string | null): Promise<DiyAccessResult> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return { ok: false, status: 401, error: "unauthorized" };
  const userId = await resolveAuthenticatedUserId(token);
  if (!userId) return { ok: false, status: 401, error: "unauthorized" };

  if (!businessId) return { ok: false, status: 404, error: "missing_business_id" };

  const userClient = getServerSupabaseForBearerToken(token);
  const membership = await findActiveMembershipForBusinessAndUser(userClient, businessId, userId);
  if (!membership) return { ok: false, status: 403, error: "cross_business_denied" };

  const business = await getBusinessByIdForCurrentUser(userClient, businessId);
  if (!business) return { ok: false, status: 404, error: "business_not_found" };

  const { data: authData } = await userClient.auth.getUser();
  const email = authData?.user?.email ?? "";

  const flagTier = await resolveDiyConciergeFlagTier(userId);
  const flagAvailable = flagTier === "global" || flagTier === "pilot";
  const entitlement = await resolveConciergeEntitlement({ businessId, diyConciergeFlagAvailable: flagAvailable });

  return { ok: true, userId, email, business, membership, entitlement };
}
