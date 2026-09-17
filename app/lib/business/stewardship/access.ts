/**
 * TODAY-3 — shared exact-business-access resolver for every owner-facing Next Right Move route.
 * Mirrors diyConcierge/access.ts exactly: never grants personalized access from owner_user_id
 * alone. Requires an authenticated user, an exact active membership for the exact businessId
 * supplied, and the same server-resolved personalizedBusinessTools entitlement DIY Concierge
 * already certifies — TODAY-3 never re-implements entitlement resolution, it reuses it.
 */
import "server-only";

import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";
import { findActiveMembershipForBusinessAndUser } from "@/app/lib/business/repositories/membershipsRepo";
import { getBusinessByIdForCurrentUser } from "@/app/lib/business/repositories/businessesRepo";
import { resolveDiyConciergeFlagTier } from "../diyConcierge/featureFlag";
import { resolveConciergeEntitlement, type ResolvedConciergeEntitlement } from "../diyConcierge/entitlement";
import { resolveStewardshipFlagTier } from "./featureFlag";
import type { Business, BusinessMembership } from "../types";

export type StewardshipAccessResult =
  | { ok: true; userId: string; email: string; business: Business; membership: BusinessMembership; entitlement: ResolvedConciergeEntitlement; stewardshipFlagAvailable: boolean }
  | { ok: false; status: 401 | 403 | 404; error: "unauthorized" | "missing_business_id" | "business_not_found" | "cross_business_denied" };

export async function resolveStewardshipAccess(req: { headers: { get(name: string): string | null } }, businessId: string | null): Promise<StewardshipAccessResult> {
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

  const diyFlagTier = await resolveDiyConciergeFlagTier(userId);
  const diyFlagAvailable = diyFlagTier === "global" || diyFlagTier === "pilot";
  const entitlement = await resolveConciergeEntitlement({ businessId, diyConciergeFlagAvailable: diyFlagAvailable });

  const stewardshipFlagTier = await resolveStewardshipFlagTier(userId);
  const stewardshipFlagAvailable = stewardshipFlagTier === "global" || stewardshipFlagTier === "pilot";

  return { ok: true, userId, email, business, membership, entitlement, stewardshipFlagAvailable };
}
