/**
 * Program 6, Gate 6Z — Owner-safe access resolver for Creative Studio owner-facing routes.
 * Mirrors the Meeting Studio ownerAccess pattern exactly: never grants personalized access
 * from owner_user_id alone. Requires authenticated user, exact active membership, feature flag.
 */
import "server-only";

import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";
import { findActiveMembershipForBusinessAndUser } from "@/app/lib/business/repositories/membershipsRepo";
import { getBusinessByIdForCurrentUser } from "@/app/lib/business/repositories/businessesRepo";
import { resolveCreativeStudioFlagTier } from "./featureFlag";
import type { Business, BusinessMembership } from "../types";

export type CreativeStudioOwnerAccessResult =
  | { ok: true; userId: string; email: string; business: Business; membership: BusinessMembership; creativeStudioFlagAvailable: boolean }
  | { ok: false; status: 401 | 403 | 404; error: "unauthorized" | "missing_business_id" | "business_not_found" | "cross_business_denied" };

export async function resolveCreativeStudioOwnerAccess(
  req: { headers: { get(name: string): string | null } },
  businessId: string | null,
): Promise<CreativeStudioOwnerAccessResult> {
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

  const flagTier = await resolveCreativeStudioFlagTier(userId);
  const creativeStudioFlagAvailable = flagTier === "global" || flagTier === "pilot";

  return { ok: true, userId, email, business, membership, creativeStudioFlagAvailable };
}

export { OWNER_SAFE_VISIBLE_FIELDS, OWNER_SAFE_HIDDEN_FIELDS } from "./constants";
