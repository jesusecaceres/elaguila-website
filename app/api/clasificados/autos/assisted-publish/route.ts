/**
 * Gate QB-STAFF-AUTOS-01 — Autos Dealer staff-assisted publish endpoint.
 *
 * POST { assistedAction, clientUserId, dealerListing, vehicleListing? }
 *
 * Allows a Leonix staff actor with a valid assisted-publishing cookie to create
 * an Autos Dealer listing (main row + optional first vehicle) attributed to the
 * CLIENT's user account. The clientUserId is accepted from the request body and
 * trusted only because the staff actor has already authenticated through the
 * HMAC-signed assisted-publishing cookie.
 *
 * Actions:
 *  - save_for_client: creates the dealer main row as "draft", links to business
 *  - publish_for_client: creates main row + vehicle as "pending_payment", links
 *    to business, then requires a cleared manual payment before going live
 */
import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { readActiveAssistedPublishingContext } from "@/app/lib/auth/assistedPublishingSession";
import {
  hasClearedManualPaymentForListing,
  isListingLinkedToBusiness,
  linkAssistedListingToBusiness,
} from "@/app/lib/business/assistedListingCustody";
import {
  createAutosClassifiedsListing,
  createAutosClassifiedsListingWithInventoryParent,
  isAutosClassifiedsDbConfigured,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import {
  enforceQuickBusinessPublishMedia,
  extractSemanticMediaItems,
} from "@/app/lib/quickBusiness/quickBusinessMediaSemantics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Gate QB-STAFF-03 — the roster is re-checked HERE, at redemption, not only at mint time. A
  // staff member deactivated or removed after their token was issued can no longer publish on a
  // customer's behalf with it. Fails closed on an unreachable database.
  const assistedContext = await readActiveAssistedPublishingContext(request.cookies);
  if (!assistedContext || assistedContext.category !== "autos") {
    return NextResponse.json({ ok: false, error: "assisted_context_required" }, { status: 403 });
  }

  if (!isAutosClassifiedsDbConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const assistedActionRaw = typeof body.assistedAction === "string" ? body.assistedAction.trim() : "";
  const isAssistedSave = assistedActionRaw === "save_for_client";
  const isAssistedPublish = assistedActionRaw === "publish_for_client";
  if (!isAssistedSave && !isAssistedPublish) {
    return NextResponse.json({ ok: false, error: "invalid_assisted_action" }, { status: 400 });
  }

  // clientUserId is trusted: it comes from the staff actor who authenticated via the cookie.
  // The staff actor is responsible for providing the correct client user ID.
  const clientUserId = typeof body.clientUserId === "string" ? body.clientUserId.trim() : "";
  if (!clientUserId) {
    return NextResponse.json({ ok: false, error: "client_user_id_required" }, { status: 400 });
  }

  const dealerListing = body.dealerListing as AutoDealerListing | null | undefined;
  if (!dealerListing || typeof dealerListing !== "object") {
    return NextResponse.json({ ok: false, error: "dealer_listing_required" }, { status: 400 });
  }

  // Gate QB-MEDIA-02 — a dealer listing must carry at least one real VEHICLE photo. A dealership
  // logo is an identity asset and can never satisfy that slot. Enforced here on the server so the
  // rule holds regardless of what the client sent; the media set is read from the vehicle listing
  // because the vehicle, not the business, is what this listing is about.
  if (isAssistedPublish) {
    // Gate QB-MEDIA-03 — the SAME canonical entry point the four self-service seams call, so the
    // assisted and self-service paths cannot drift into two different contracts. The previous
    // per-route `validateQuickBusinessMediaForCategory` call is still exercised directly by the
    // behavioral verifier; here the canonical function owns extraction and the refusal shape.
    const vehicleMedia = extractSemanticMediaItems(body.vehicleListing);
    const semanticMedia = enforceQuickBusinessPublishMedia({ category: "autos-dealer", items: vehicleMedia });
    if (semanticMedia && !semanticMedia.ok) {
      return NextResponse.json(semanticMedia.body, { status: semanticMedia.status });
    }
  }

  const lang = body.lang === "en" ? "en" as const : "es" as const;
  const existingMainListingId = typeof body.existingMainListingId === "string" ? body.existingMainListingId.trim() : "";

  // If this is an existing listing, verify it is linked to the business (idempotent re-save)
  if (existingMainListingId) {
    const linked = await isListingLinkedToBusiness({
      businessId: assistedContext.businessId,
      listingSource: "autos_classifieds_listings",
      listingId: existingMainListingId,
    });
    if (!linked) {
      return NextResponse.json({ ok: false, error: "listing_not_linked_to_business" }, { status: 403 });
    }
  }

  // Create or confirm the dealer main row
  let mainListingId = existingMainListingId;
  if (!mainListingId) {
    const mainResult = await createAutosClassifiedsListing({
      ownerUserId: clientUserId,
      lane: "negocios",
      lang,
      listing: dealerListing,
      inventoryRole: "main",
    });
    if (!mainResult.row) {
      return NextResponse.json({ ok: false, error: "main_listing_create_failed" }, { status: 500 });
    }
    mainListingId = mainResult.row.id;
    // Link main row to business
    await linkAssistedListingToBusiness({
      businessId: assistedContext.businessId,
      listingSource: "autos_classifieds_listings",
      listingId: mainListingId,
      linkedByAuthUserId: assistedContext.authUserId,
    });
  }

  // Optionally create the first vehicle row (required for publish_for_client)
  const vehicleListing = body.vehicleListing as AutoDealerListing | null | undefined;
  let vehicleListingId: string | null = null;

  if (vehicleListing && typeof vehicleListing === "object") {
    const vehicleResult = await createAutosClassifiedsListingWithInventoryParent({
      ownerUserId: clientUserId,
      lane: "negocios",
      lang,
      listing: vehicleListing,
      parentListingId: mainListingId,
    });
    if (!vehicleResult.row) {
      return NextResponse.json({ ok: false, error: "vehicle_listing_create_failed" }, { status: 500 });
    }
    vehicleListingId = vehicleResult.row.id;
    await linkAssistedListingToBusiness({
      businessId: assistedContext.businessId,
      listingSource: "autos_classifieds_listings",
      listingId: vehicleListingId,
      linkedByAuthUserId: assistedContext.authUserId,
    });
  } else if (isAssistedPublish) {
    return NextResponse.json({ ok: false, error: "vehicle_listing_required_for_publish" }, { status: 400 });
  }

  // publish_for_client: verify cleared manual payment before activating
  if (isAssistedPublish) {
    const cleared = await hasClearedManualPaymentForListing({
      listingSource: "autos_classifieds_listings",
      listingId: mainListingId,
    });
    if (!cleared) {
      return NextResponse.json(
        { ok: false, error: "manual_payment_not_cleared", message: "Record and clear the manual payment in the Payment Tracker first." },
        { status: 402 },
      );
    }

    // A GATE THAT PASSES AND CHANGES NOTHING IS NOT A PUBLICATION.
    //
    // The cleared-payment check above returned 402 when unpaid and then fell straight through to
    // `{ ok: true }` when paid: the row stayed `draft`, nothing became public, and staff were told
    // the listing had been published for their client. `publish_for_client` was a lifecycle no-op.
    // The activation is a compare-and-set from the pre-publish state, so a concurrent moderation
    // or webhook write is never overwritten, and a zero-row result is reported rather than
    // swallowed.
    const supabase = getAdminSupabase();
    const nowIso = new Date().toISOString();
    const { data: activated, error: activateError } = await supabase
      .from("autos_classifieds_listings")
      .update({ status: "active", published_at: nowIso, updated_at: nowIso })
      .eq("id", mainListingId)
      .in("status", ["draft", "pending_payment", "payment_failed"])
      .select("id")
      .maybeSingle();
    if (activateError) {
      return NextResponse.json({ ok: false, error: "autos_activate_failed" }, { status: 500 });
    }
    if (!activated?.id) {
      return NextResponse.json(
        { ok: false, error: "autos_status_transition_not_allowed" },
        { status: 409 },
      );
    }
    if (vehicleListingId) {
      await supabase
        .from("autos_classifieds_listings")
        .update({ status: "active", published_at: nowIso, updated_at: nowIso })
        .eq("id", vehicleListingId)
        .in("status", ["draft", "pending_payment", "payment_failed"]);
    }
  }

  return NextResponse.json({
    ok: true,
    action: assistedActionRaw,
    mainListingId,
    vehicleListingId,
    businessId: assistedContext.businessId,
  });
}
