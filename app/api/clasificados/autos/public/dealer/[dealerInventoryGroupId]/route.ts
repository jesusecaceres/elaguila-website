import { NextResponse } from "next/server";
import {
  isAutosClassifiedsDbConfigured,
  listActiveDealerInventoryByGroupId,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { autosClassifiedsRowToPublicListing } from "@/app/lib/clasificados/autos/mapAutosClassifiedsToPublic";
import type { AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import type { AutosPublicListing } from "@/app/clasificados/autos/data/autosPublicSampleTypes";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ dealerInventoryGroupId: string }> };

export async function GET(request: Request, { params }: Props) {
  if (!isAutosClassifiedsDbConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  const { dealerInventoryGroupId } = await params;
  const groupId = dealerInventoryGroupId?.trim();
  if (!groupId) {
    return NextResponse.json({ ok: false, error: "invalid_group" }, { status: 400 });
  }
  const url = new URL(request.url);
  const lang: AutosClassifiedsLang = url.searchParams.get("lang") === "en" ? "en" : "es";
  const rows = await listActiveDealerInventoryByGroupId(groupId);
  if (!rows.length) {
    return NextResponse.json({ ok: true, dealerName: null, city: null, listings: [] as AutosPublicListing[] });
  }
  const listings = rows.map((r) => autosClassifiedsRowToPublicListing(r));
  const main = rows.find((r) => r.inventory_role === "main") ?? rows[0]!;
  const payload = main.listing_payload;
  return NextResponse.json({
    ok: true,
    dealerInventoryGroupId: groupId,
    dealerName: (payload.dealerName ?? "").trim() || null,
    city: (payload.city ?? "").trim() || null,
    state: (payload.state ?? "").trim() || null,
    listings,
    lang,
  });
}
