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
import { readAssistedPublishingContext } from "@/app/lib/auth/assistedPublishingSession";
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
  extractSemanticMediaItems,
  validateQuickBusinessMediaForCategory,
} from "@/app/lib/quickBusiness/quickBusinessMediaSemantics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const assistedContext = readAssistedPublishingContext(request.cookies);
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
    const vehicleMedia = extractSemanticMediaItems(body.vehicleListing);
    const mediaIssues = validateQuickBusinessMediaForCategory("autos-dealer", vehicleMedia);
    if (mediaIssues && mediaIssues.length) {
      return NextResponse.json(
        { ok: false, error: "media_contract_violation", issues: mediaIssues.map((i) => i.code), message: mediaIssues[0]!.messageEn },
        { status: 422 },
      );
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
  }

  return NextResponse.json({
    ok: true,
    action: assistedActionRaw,
    mainListingId,
    vehicleListingId,
    businessId: assistedContext.businessId,
  });
}
