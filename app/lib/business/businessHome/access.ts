/**
 * Gate 2 (Owner-Safe Bridge Reconciliation) — shared exact-business-access resolver for the
 * single owner-facing Business Home composition endpoint. Mirrors every existing domain's own
 * ownerAccess.ts / access.ts (diyConcierge/access.ts, stewardship/access.ts,
 * advisor/ownerAccess.ts, outcomes/ownerAccess.ts, assistant/ownerAccess.ts) byte-for-byte on the
 * "Exact Business Access Rule": never grants access from owner_user_id alone — requires an
 * authenticated user AND a real, active `business_memberships` row for the EXACT businessId the
 * caller supplied, resolved through the RLS-scoped user client (never the service-role client).
 *
 * Deliberately does NOT resolve the DIY Concierge package entitlement here — that is a
 * DIY-Concierge-specific commercial concept, not a general "does this person have Business
 * Concierge access" gate. The composition route below resolves entitlement/flag state per
 * section, exactly the way each section's own dedicated route already does, so this resolver
 * stays a pure identity/membership primitive reusable by any future owner-facing composition.
 */
import "server-only";

import { extractBearerToken, getServerSupabaseForBearerToken, resolveAuthenticatedUserId } from "@/app/lib/business/supabaseUserClient";
import { findActiveMembershipForBusinessAndUser } from "@/app/lib/business/repositories/membershipsRepo";
import { getBusinessByIdForCurrentUser } from "@/app/lib/business/repositories/businessesRepo";
import type { Business, BusinessMembership } from "../types";

export type BusinessHomeAccessResult =
  | { ok: true; userId: string; email: string; business: Business; membership: BusinessMembership }
  | { ok: false; status: 401 | 403 | 404; error: "unauthorized" | "missing_business_id" | "business_not_found" | "cross_business_denied" };

export async function resolveBusinessHomeAccess(
  req: { headers: { get(name: string): string | null } },
  businessId: string | null,
): Promise<BusinessHomeAccessResult> {
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
