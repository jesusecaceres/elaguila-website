import "server-only";

import type { ListingAnalyticsEventType } from "@/app/lib/listingAnalyticsEventTypes";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { serviciosCanonicalListingAnalyticsId } from "@/app/(site)/servicios/lib/serviciosAnalyticsIdentity";
import { getServiciosPublicListingBySlugFromDb } from "./serviciosPublicListingsServer";

const OPS_TO_LISTING: Record<string, ListingAnalyticsEventType> = {
  profile_view: "profile_view",
  cta_call_click: "phone_click",
  cta_whatsapp_click: "whatsapp_click",
  cta_email_click: "email_click",
  cta_website_click: "website_click",
  cta_maps_click: "directions_click",
  cta_quote_sms_click: "message_click",
  cta_review_click: "cta_click",
  cta_primary_click: "cta_click",
  cta_secondary_click: "cta_click",
  lead_created: "lead_created",
};

/** Ops-only events that must never mirror (no listing / discovery UX). */
const SKIP_MIRROR = new Set(["search_results_view", "filter_change", "provider_manage", "review_submit_pending"]);

/**
 * Mirror a `servicios_analytics_events` row into `listing_analytics` (seller/global source of truth).
 * Skips when `meta.clientListingAnalytics === true` (client already wrote listing_analytics).
 */
export async function mirrorServiciosOpsEventToListingAnalytics(args: {
  listingSlug: string | null;
  eventType: string;
  meta?: Record<string, unknown>;
}): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const eventType = args.eventType.trim();
  if (SKIP_MIRROR.has(eventType)) return false;
  if (args.meta?.clientListingAnalytics === true) return false;

  const mapped = OPS_TO_LISTING[eventType];
  if (!mapped) return false;

  const slug = (args.listingSlug ?? "").trim();
  if (!slug) return false;

  const row = await getServiciosPublicListingBySlugFromDb(slug, { visibility: "slug_page" });
  if (!row) return false;

  const listingId = serviciosCanonicalListingAnalyticsId(row);
  const sourceId = (row.id ?? "").trim();
  if (!listingId || !sourceId) return false;
  const eventSource =
    eventType === "lead_created"
      ? "lead_form"
      : typeof args.meta?.source === "string" && args.meta.source.trim()
        ? args.meta.source.trim()
        : "unknown";

  const supabase = getAdminSupabase();
  const { error } = await supabase.from("listing_analytics").insert({
    listing_id: listingId,
    canonical_ad_id: listingId,
    source_table: "servicios_public_listings",
    source_id: sourceId,
    event_type: mapped,
    event_source: eventSource,
    user_id: null,
    owner_user_id: row.owner_user_id ?? null,
    anonymous_session_id: null,
    category: "servicios",
    metadata: {
      slug,
      serviciosOpsEventType: eventType,
      opsMirror: true,
      ...(args.meta ?? {}),
    },
  });
  return !error;
}
