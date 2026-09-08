/**
 * Program 4, Gate 4D — shared exact-business-access resolver for the owner-facing research
 * status route. Mirrors app/lib/business/stewardship/access.ts exactly: never grants
 * personalized access from a bare user id alone — requires an authenticated user AND an exact
 * active membership for the exact businessId supplied.
 */
import "server-only";

import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";
import { findActiveMembershipForBusinessAndUser } from "@/app/lib/business/repositories/membershipsRepo";
import { getBusinessByIdForCurrentUser } from "@/app/lib/business/repositories/businessesRepo";
import type { Business, BusinessMembership } from "../types";

export type FieldDiscoveryOwnerAccessResult =
  | { ok: true; userId: string; email: string; business: Business; membership: BusinessMembership }
  | { ok: false; status: 401 | 403 | 404; error: "unauthorized" | "missing_business_id" | "business_not_found" | "cross_business_denied" };

export async function resolveFieldDiscoveryOwnerAccess(
  req: { headers: { get(name: string): string | null } },
  businessId: string | null,
): Promise<FieldDiscoveryOwnerAccessResult> {
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

  return { ok: true, userId, email, business, membership };
}
