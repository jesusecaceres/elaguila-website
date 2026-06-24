/**
 * Gate REST-ANALYTICS1 — Restaurante seller metrics helpers (read-side only).
 * Parses category-scoped totals from GET /api/dashboard/analytics/summary `by_category`.
 */
import type { ListingMetrics } from "@/app/lib/clasificadosAnalytics";

export const RESTAURANTES_SELLER_ANALYTICS_CATEGORY = "restaurantes" as const;

type SummaryTotalsRow = {
  views?: number;
  unique_views_estimate?: number;
  likes?: number;
  saves?: number;
  shares?: number;
  messages?: number;
  contact_clicks?: number;
  leads?: number;
  applications?: number;
  profile_views?: number;
  listing_opens?: number;
};

export function restaurantesTotalsToListingMetrics(
  totals: SummaryTotalsRow | null | undefined,
): ListingMetrics | null {
  if (!totals) return null;
  return {
    views: totals.views ?? 0,
    uniqueViews: totals.unique_views_estimate ?? 0,
    likes: totals.likes ?? 0,
    saves: totals.saves ?? 0,
    shares: totals.shares ?? 0,
    messages: totals.messages ?? 0,
    ctaClicks: totals.contact_clicks ?? 0,
    leads: totals.leads ?? 0,
    applications: totals.applications ?? 0,
    profileViews: totals.profile_views ?? 0,
    listingOpens: totals.listing_opens ?? 0,
  };
}

/** Extract restaurante-only totals — avoids mixing En Venta / other categories. */
export function restaurantesMetricsFromSummaryByCategory(
  byCategory: Record<string, SummaryTotalsRow> | null | undefined,
): ListingMetrics | null {
  if (!byCategory) return null;
  return restaurantesTotalsToListingMetrics(byCategory[RESTAURANTES_SELLER_ANALYTICS_CATEGORY]);
}
