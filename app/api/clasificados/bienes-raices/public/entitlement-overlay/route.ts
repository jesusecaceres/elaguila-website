import { NextResponse, type NextRequest } from "next/server";
import { fetchActiveListingPackageEntitlementsForRows } from "@/app/lib/listingPlans/listingPackageEntitlementsServer";
import {
  packageEntitlementGrantsDestacado,
  packageEntitlementGrantsResultsPriority,
  resolveListingPlacementEntitlement,
} from "@/app/lib/listingPlans/listingPackageEntitlementPlacement";
import { resolveCanonicalPlacementRankWeights } from "@/app/lib/listingPlans/placementResultsOverlay";

export const dynamic = "force-dynamic";

const BR_CATEGORY = "bienes-raices";
/** Admin package entitlements for Bienes/Rentas attach to the generic `listings` table. */
const BR_LISTING_SOURCE = "listings";

type OverlayBadge = {
  tier: string;
  startsAt: string;
  endsAt: string;
  grantsDestacado: boolean;
  grantsResultsPriority: boolean;
  digitalPlacementPriority: number | null;
  printPlacementType: string | null;
  /** Package D Build D3, Gate 1 — canonical leonix_placement_entitlements weight, when active. */
  canonicalPlacementRankWeight?: number | null;
};

/**
 * Public-safe active package entitlement overlay for Bienes Raíces browse.
 * Client landing/results cannot use service-role; this endpoint hydrates entitlements.
 * Does not expose promo codes, sales-rep, payment, or customer PII.
 */
export async function POST(req: NextRequest) {
  let body: { listingIds?: unknown };
  try {
    body = (await req.json()) as { listingIds?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json", byListingId: {} }, { status: 400 });
  }

  const rawIds = Array.isArray(body.listingIds) ? body.listingIds : [];
  const listingIds = [
    ...new Set(
      rawIds
        .map((id) => String(id ?? "").trim())
        .filter(Boolean)
        .slice(0, 120),
    ),
  ];

  if (listingIds.length === 0) {
    return NextResponse.json({ ok: true, byListingId: {} as Record<string, OverlayBadge> });
  }

  try {
    const rows = listingIds.map((id) => ({ id, slug: null as string | null, leonix_ad_id: null as string | null }));
    const lookup = await fetchActiveListingPackageEntitlementsForRows(rows, {
      category: BR_CATEGORY,
      listingSource: BR_LISTING_SOURCE,
    });

    // Package D Build D3, Gate 1 — canonical leonix_placement_entitlements weight, batched.
    // Callers gate this to `negocio`-lane rows before use; this route itself does not know seller
    // lane, so it simply reports what's active for the exact listingId (a Privado listing_id would
    // never have a real row here anyway, since it's never written for a Privado listing).
    const canonicalWeights = await resolveCanonicalPlacementRankWeights(
      listingIds.map((id) => ({ id })),
      { category: BR_CATEGORY, surface: "category_results" },
    );

    const byListingId: Record<string, OverlayBadge> = {};
    for (const id of listingIds) {
      const ent = lookup.byListingId.get(id) ?? null;
      const canonicalWeight = canonicalWeights.get(id) ?? null;
      if (!ent && canonicalWeight == null) continue;

      const summary = ent
        ? resolveListingPlacementEntitlement({
            category: BR_CATEGORY,
            listing: {
              id,
              package_entitlement_tier: ent.tier,
              starts_at: ent.startsAt,
              ends_at: ent.endsAt,
            },
          })
        : null;

      byListingId[id] = {
        tier: ent?.tier ?? "none",
        startsAt: ent?.startsAt ?? "",
        endsAt: ent?.endsAt ?? "",
        grantsDestacado: summary ? packageEntitlementGrantsDestacado(summary) : false,
        grantsResultsPriority: summary ? packageEntitlementGrantsResultsPriority(summary) : false,
        digitalPlacementPriority:
          typeof ent?.digitalPlacementPriority === "number" ? ent.digitalPlacementPriority : null,
        printPlacementType: ent?.printPlacementType ?? null,
        canonicalPlacementRankWeight: canonicalWeight,
      };
    }

    return NextResponse.json({ ok: true, byListingId });
  } catch (err) {
    console.warn(
      "[br entitlement-overlay] failed; returning empty overlay",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json({ ok: true, byListingId: {}, degraded: true });
  }
}
