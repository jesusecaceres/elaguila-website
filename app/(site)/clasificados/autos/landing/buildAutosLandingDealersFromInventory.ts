import type { AutosPublicListing } from "../data/autosPublicSampleTypes";
import type { AutosLandingDealerSample } from "./autosLandingDealerSamples";

const FALLBACK_LOGO =
  "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80";

/**
 * Build landing dealer band rows from live public inventory only.
 * Returns [] when no published dealer listings exist — callers must not render a fake dealer band.
 */
export function buildAutosLandingDealersFromInventory(
  listings: AutosPublicListing[],
  max = 4,
): AutosLandingDealerSample[] {
  const byName = new Map<string, AutosPublicListing[]>();
  for (const row of listings) {
    if (row.sellerType !== "dealer") continue;
    const name = (row.dealerName ?? "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const bucket = byName.get(key) ?? [];
    bucket.push(row);
    byName.set(key, bucket);
  }

  const ranked = [...byName.entries()].sort((a, b) => {
    const aFeat = a[1].some((r) => r.featured) ? 1 : 0;
    const bFeat = b[1].some((r) => r.featured) ? 1 : 0;
    if (bFeat !== aFeat) return bFeat - aFeat;
    return b[1].length - a[1].length;
  });

  const out: AutosLandingDealerSample[] = [];
  for (const [key, rows] of ranked) {
    const lead = rows.find((r) => r.featured) ?? rows[0]!;
    const name = (lead.dealerName ?? "").trim();
    if (!name) continue;
    out.push({
      id: `dlr-live-${key.replace(/[^a-z0-9]+/g, "-").slice(0, 48)}`,
      name,
      city: lead.city,
      state: lead.state,
      rating: lead.dealerRating ?? 0,
      logoUrl: lead.dealerLogoUrl || lead.primaryImageUrl || FALLBACK_LOGO,
      resultsHandoff: {
        seller: "dealer",
        city: lead.city,
        q: lead.make.trim() || undefined,
      },
    });
    if (out.length >= max) break;
  }
  return out;
}
