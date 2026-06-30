import { NextResponse } from "next/server";
import { autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import { getAutosSiteOrigin } from "@/app/lib/clasificados/autos/autosSiteOrigin";
import { getAutosPublishUserFromRequest } from "@/app/lib/clasificados/autos/autosListingBearerAuth";
import {
  assertAutosListingOwner,
  isAutosClassifiedsDbConfigured,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { isAutosInternalPublishPaymentBypassEnabled } from "@/app/lib/clasificados/autos/autosInternalPublishConfig";
import { isAutosAllowTestPublishBypassEnabled } from "@/app/lib/clasificados/autos/autosTestPublishBypass";
import type { AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import { isAutosNegociosQaPublishAllowlisted } from "@/app/lib/clasificados/autos/autosNegociosQaPublishAllowlist";

export const dynamic = "force-dynamic";

/**
 * Confirms an internally, test-bypass, or Negocios QA-allowlist activated listing for the success page.
 * This never creates fake Stripe payment state; it only verifies that the owner row is already active.
 */
export async function GET(request: Request) {
  if (!isAutosClassifiedsDbConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  const user = await getAutosPublishUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const userId = user.id;
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
  const allowlistedNegociosQa =
    row.lane === "negocios" && isAutosNegociosQaPublishAllowlisted(user.id, user.email);
  if (!isAutosInternalPublishPaymentBypassEnabled() && !isAutosAllowTestPublishBypassEnabled() && !allowlistedNegociosQa) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 404 });
  }
  if (row.status !== "active") {
    return NextResponse.json({ ok: false, error: "not_active" }, { status: 409 });
  }
  const q = lang === "en" ? "lang=en" : "lang=es";
  const livePath = `${autosLiveVehiclePath(listingId)}?${q}`;
  const liveUrl = `${getAutosSiteOrigin()}${livePath}`;
  return NextResponse.json({ ok: true, liveUrl, listingId, lang, lane: row.lane });
}
