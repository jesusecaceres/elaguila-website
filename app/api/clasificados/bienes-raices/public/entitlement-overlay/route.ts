import { NextResponse, type NextRequest } from "next/server";
import { fetchActiveListingPackageEntitlementsForRows } from "@/app/lib/listingPlans/listingPackageEntitlementsServer";
import {
  packageEntitlementGrantsDestacado,
  packageEntitlementGrantsResultsPriority,
  resolveListingPlacementEntitlement,
} from "@/app/lib/listingPlans/listingPackageEntitlementPlacement";

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

    const byListingId: Record<string, OverlayBadge> = {};
    for (const id of listingIds) {
      const ent = lookup.byListingId.get(id) ?? null;
      if (!ent) continue;
      const summary = resolveListingPlacementEntitlement({
        category: BR_CATEGORY,
        listing: {
          id,
          package_entitlement_tier: ent.tier,
          starts_at: ent.startsAt,
          ends_at: ent.endsAt,
        },
      });
      byListingId[id] = {
        tier: ent.tier,
        startsAt: ent.startsAt,
        endsAt: ent.endsAt,
        grantsDestacado: packageEntitlementGrantsDestacado(summary),
        grantsResultsPriority: packageEntitlementGrantsResultsPriority(summary),
        digitalPlacementPriority:
          typeof ent.digitalPlacementPriority === "number" ? ent.digitalPlacementPriority : null,
        printPlacementType: ent.printPlacementType ?? null,
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
