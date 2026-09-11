/**
 * Gate SERVICIOS-P7-BLOCKER-REPAIR-01 — Repair A (B2). Server-only.
 *
 * Gathers the two canonical facts `decideServiciosReactivationAuthority` needs. It adds no state
 * of its own: the plan comes from the shared `resolveCategoryListingPlan` (the same resolver the
 * dashboard entitlement API and `resolveBusinessToolsAccess` use), and the subscription status is
 * the newest `leonix_subscription_records` row for the listing — the same read shape that
 * resolver already uses for its grace/suspended overlay.
 *
 * Fails closed: any read failure yields "not allowed", so an outage can never re-publish a
 * listing for free.
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { resolveCategoryListingPlan } from "@/app/lib/listingPlans/categoryCommercialPlan";
import {
  decideServiciosReactivationAuthority,
  type ServiciosReactivationAuthorityDecision,
} from "./serviciosOwnerMutationPolicy";

async function readLatestSubscriptionStatus(listingId: string): Promise<string | null> {
  const { data, error } = await getAdminSupabase()
    .from("leonix_subscription_records")
    .select("status")
    .eq("listing_id", listingId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? String((data as { status?: unknown }).status ?? "") : null;
}

export async function resolveServiciosReactivationAuthority(
  listingId: string | null | undefined,
): Promise<ServiciosReactivationAuthorityDecision> {
  const id = String(listingId ?? "").trim();
  if (!id || !isSupabaseAdminConfigured()) {
    return { allowed: false, reason: "no_base_commercial_right" };
  }
  try {
    const [plan, latestSubscriptionStatus] = await Promise.all([
      resolveCategoryListingPlan({
        category: "servicios",
        listingSource: "servicios_public_listings",
        listingId: id,
      }),
      readLatestSubscriptionStatus(id),
    ]);
    return decideServiciosReactivationAuthority({
      planStatus: plan.status,
      capabilitySource: plan.capabilitySource,
      latestSubscriptionStatus,
    });
  } catch {
    return { allowed: false, reason: "no_base_commercial_right" };
  }
}
