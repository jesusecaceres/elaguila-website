import { NextResponse } from "next/server";
import { autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import { getAutosSiteOrigin } from "@/app/lib/clasificados/autos/autosSiteOrigin";
import { getAutosPublishUserIdFromRequest } from "@/app/lib/clasificados/autos/autosListingBearerAuth";
import {
  assertAutosListingOwner,
  isAutosClassifiedsDbConfigured,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { isAutosInternalPublishPaymentBypassEnabled } from "@/app/lib/clasificados/autos/autosInternalPublishConfig";
import type { AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";

export const dynamic = "force-dynamic";

/**
 * Confirms an internally activated listing for the success page (no Stripe session).
 * Only available when internal payment bypass is enabled; requires owner Bearer auth.
 */
export async function GET(request: Request) {
  if (!isAutosInternalPublishPaymentBypassEnabled()) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 404 });
  }
  if (!isAutosClassifiedsDbConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  const userId = await getAutosPublishUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const u = new URL(request.url);
  const listingId = u.searchParams.get("listing_id")?.trim();
  const lang: AutosClassifiedsLang = u.searchParams.get("lang") === "en" ? "en" : "es";
  if (!listingId) {
    return NextResponse.json({ ok: false, error: "missing_listing_id" }, { status: 400 });
  }
  const row = await assertAutosListingOwner(listingId, userId);
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (row.status !== "active") {
    return NextResponse.json({ ok: false, error: "not_active" }, { status: 409 });
  }
  const q = lang === "en" ? "lang=en" : "lang=es";
  const livePath = `${autosLiveVehiclePath(listingId)}?${q}`;
  const liveUrl = `${getAutosSiteOrigin()}${livePath}`;
  return NextResponse.json({ ok: true, liveUrl, listingId, lang, lane: row.lane });
}
