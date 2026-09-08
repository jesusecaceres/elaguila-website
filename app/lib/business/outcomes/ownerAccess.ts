/**
 * Program 7, Gate 7C — Owner-safe access resolver for Business Outcomes owner-facing routes.
 * Mirrors the Creative Studio / Meeting Studio ownerAccess pattern exactly: never grants
 * personalized access from owner_user_id alone. Requires authenticated user, exact active
 * membership, feature flag.
 */
import "server-only";

import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";
import { findActiveMembershipForBusinessAndUser } from "@/app/lib/business/repositories/membershipsRepo";
import { getBusinessByIdForCurrentUser } from "@/app/lib/business/repositories/businessesRepo";
import { resolveOutcomesFlagTier } from "./featureFlag";
import type { Business, BusinessMembership } from "../types";

export type OutcomesOwnerAccessResult =
  | { ok: true; userId: string; email: string; business: Business; membership: BusinessMembership; outcomesFlagAvailable: boolean }
  | { ok: false; status: 401 | 403 | 404; error: "unauthorized" | "missing_business_id" | "business_not_found" | "cross_business_denied" };

export async function resolveOutcomesOwnerAccess(
  req: { headers: { get(name: string): string | null } },
  businessId: string | null,
): Promise<OutcomesOwnerAccessResult> {
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

  const flagTier = await resolveOutcomesFlagTier(userId);
  const outcomesFlagAvailable = flagTier === "global" || flagTier === "pilot";

  return { ok: true, userId, email, business, membership, outcomesFlagAvailable };
}
