import { NextResponse, type NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import { fetchActiveListingPackageEntitlementsForRows } from "@/app/lib/listingPlans/listingPackageEntitlementsServer";
import {
  packageEntitlementGrantsDestacado,
  packageEntitlementGrantsResultsPriority,
  packageEntitlementIncludesNuestrosNegocios,
  resolveListingPlacementEntitlement,
} from "@/app/lib/listingPlans/listingPackageEntitlementPlacement";

type RequestItem = {
  category: string;
  listingSource: string;
  listingId?: string | null;
  slug?: string | null;
  leonixAdId?: string | null;
};

export async function POST(req: NextRequest) {
  const userId = await getBearerUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { items?: RequestItem[] };
  try {
    body = (await req.json()) as { items?: RequestItem[] };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items.slice(0, 120) : [];
  if (items.length === 0) {
    return NextResponse.json({ badges: {} });
  }

  const byCategorySource = new Map<string, RequestItem[]>();
  for (const item of items) {
    const category = String(item.category ?? "").trim().toLowerCase();
    const listingSource = String(item.listingSource ?? "").trim();
    const listingId = String(item.listingId ?? item.slug ?? item.leonixAdId ?? "").trim();
    if (!category || !listingSource || !listingId) continue;
    const key = `${category}\0${listingSource}`;
    const list = byCategorySource.get(key) ?? [];
    list.push(item);
    byCategorySource.set(key, list);
  }

  const badges: Record<
    string,
    {
      grantsDestacado: boolean;
      grantsResultsPriority: boolean;
      includesNuestrosNegocios: boolean;
      tier: string;
    }
  > = {};

  for (const [key, group] of byCategorySource) {
    const [category, listingSource] = key.split("\0");
    const rows = group.map((g) => ({
      id: g.listingId ?? null,
      slug: g.slug ?? g.listingId ?? null,
      leonix_ad_id: g.leonixAdId ?? null,
    }));
    const lookup = await fetchActiveListingPackageEntitlementsForRows(rows, {
      category,
      listingSource,
    });
    for (const g of group) {
      const row = {
        id: g.listingId ?? null,
        slug: g.slug ?? null,
        leonix_ad_id: g.leonixAdId ?? null,
        package_entitlement_tier: null as string | null,
        starts_at: null as string | null,
        ends_at: null as string | null,
      };
      const id = String(g.listingId ?? g.slug ?? g.leonixAdId ?? "").trim();
      const ent =
        (g.listingId && lookup.byListingId.get(g.listingId)) ||
        (g.slug && lookup.byListingId.get(g.slug)) ||
        (g.leonixAdId && lookup.byListingId.get(g.leonixAdId)) ||
        null;
      if (ent) {
        row.package_entitlement_tier = ent.tier;
        row.starts_at = ent.startsAt;
        row.ends_at = ent.endsAt;
      }
      const summary = resolveListingPlacementEntitlement({
        category,
        listing: row as Record<string, unknown>,
      });
      badges[id] = {
        tier: summary.tier,
        grantsDestacado: packageEntitlementGrantsDestacado(summary),
        grantsResultsPriority: packageEntitlementGrantsResultsPriority(summary),
        includesNuestrosNegocios: packageEntitlementIncludesNuestrosNegocios(summary),
      };
    }
  }

  return NextResponse.json({ badges });
}
