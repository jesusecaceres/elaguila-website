import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { computeAccessResolution } from "./accessLogic";
import { resolveNegocioEligibility } from "./eligibility";
import { resolveBusinessIdentityFlagTier } from "./featureFlag";
import { getBusinessByIdForCurrentUser } from "./repositories/businessesRepo";
import { listDraftsForCurrentUser } from "./repositories/draftsRepo";
import { findActiveMembershipForCurrentUser } from "./repositories/membershipsRepo";
import type { AccessResolution } from "./types";

export { computeAccessResolution };

/**
 * I/O wrapper (Phase 8). `userClient` must be the RLS-scoped client for this specific user
 * (see supabaseUserClient.ts) — membership/draft reads rely on RLS, not on an application-level
 * ownership check, so passing the admin client here would silently defeat the resolution order.
 * See accessLogic.ts for the actual decision logic and its unit tests.
 */
export async function resolveBusinessToolsAccess(userId: string | null, userClient: SupabaseClient | null): Promise<AccessResolution> {
  if (!userId || !userClient) {
    return { state: "signed_out" };
  }

  const tier = await resolveBusinessIdentityFlagTier(userId);
  const membership = await findActiveMembershipForCurrentUser(userClient, userId);
  const business = membership ? await getBusinessByIdForCurrentUser(userClient, membership.businessId) : null;

  // Preview tier with no membership never needs eligibility or drafts evaluated.
  if (tier === "unavailable" || (tier === "preview" && !membership)) {
    return computeAccessResolution({ tier, membership, business, drafts: [], eligibility: null });
  }

  const eligibility = membership ? null : await resolveNegocioEligibility(userId);
  const drafts = membership ? [] : await listDraftsForCurrentUser(userClient);

  return computeAccessResolution({ tier, membership, business, drafts, eligibility });
}
