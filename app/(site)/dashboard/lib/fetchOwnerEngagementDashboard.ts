import type { SupabaseClient } from "@supabase/supabase-js";
import type { OwnerAnalyticsTotals } from "./dashboardAnalyticsSummary";

export type ServiciosListingEngagementMetricsClient = {
  slug: string;
  views: number;
  likes: number;
  saves: number;
  shares: number;
  ctaClicks: number;
};

export type OwnerEngagementDashboardPayload = {
  ok: boolean;
  totals: OwnerAnalyticsTotals;
  listingCount: number;
  listingAnalyticsUnavailable: boolean;
  serviciosBySlug: Record<string, ServiciosListingEngagementMetricsClient>;
};

export async function fetchOwnerEngagementDashboard(
  sb: SupabaseClient,
): Promise<OwnerEngagementDashboardPayload | null> {
  const { data: sess } = await sb.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) return null;
  try {
    const res = await fetch("/api/dashboard/owner-engagement", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as OwnerEngagementDashboardPayload;
  } catch {
    return null;
  }
}
