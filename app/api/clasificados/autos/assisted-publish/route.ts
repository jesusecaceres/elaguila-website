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
  isListingLinkedToBusiness,
  linkAssistedListingToBusiness,
} from "@/app/lib/business/assistedListingCustody";
import { refuseUnlessAuthoritativePayment } from "@/app/lib/listingPlans/listingPackagePaymentAuthorityServer";
import {
  createAutosClassifiedsListing,
  createAutosClassifiedsListingWithInventoryParent,
  isAutosClassifiedsDbConfigured,
  updateAutosClassifiedsListingDraft,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import {
  assertAssistedIdentity,
  resolveAssistedRowBinding,
  resolveAssistedSessionConflict,
} from "@/app/lib/sales/assistedSameRowBinding";
import { isClientAuthorizedForBusiness } from "@/app/lib/sales/assistedClientAuthorization";
import { recordSalesWorkspaceAudit } from "@/app/lib/sales/salesWorkspaceAudit";
import { customerUserIdFromBearer } from "@/app/lib/auth/customerBearerUserId";
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
  if (!assistedContext) {
    return NextResponse.json({ ok: false, error: "assisted_context_required" }, { status: 403 });
  }
  const identityRefusal = assertAssistedIdentity({
    contextCategory: assistedContext.category,
    expectedCategory: "autos",
    contextBusinessId: assistedContext.businessId,
  });
  if (identityRefusal) {
    return NextResponse.json({ ok: false, error: identityRefusal.error }, { status: identityRefusal.status });
  }

  // QUICK SALES ENTRY CONSOLIDATION — this route never read a bearer, so a staff tab that also
  // held a customer/site session was invisible to it. An assisted request may carry NO site
  // session, or exactly the client this custody was established for; anything else is two
  // identities disagreeing about whose ad this is, and is refused rather than resolved.
  const sessionConflict = resolveAssistedSessionConflict({
    assistedActive: true,
    contextClientUserId: assistedContext.clientUserId ?? null,
    customerUserId: await customerUserIdFromBearer(request),
  });
  if (sessionConflict) {
    await recordSalesWorkspaceAudit({
      action: "quick_sales_save_for_client",
      actorRosterId: assistedContext.rosterId,
      businessId: assistedContext.businessId,
      category: "autos",
      listingSource: "autos_classifieds_listings",
      outcome: sessionConflict.error,
    });
    return NextResponse.json({ ok: false, error: sessionConflict.error }, { status: sessionConflict.status });
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

  // REQUIRED REPAIR 5 — clientUserId is NOT trusted for having arrived alongside a valid staff
  // cookie. Authenticating the staff actor proves who is asking; it says nothing about whether
  // this user id belongs to the business the assisted context is bound to. It is written into
  // `owner_user_id`, which every later authorization check reads, so it is proven server-side
  // against the canonical membership table before a single column is written.
  const clientUserId = typeof body.clientUserId === "string" ? body.clientUserId.trim() : "";
  if (!clientUserId) {
    return NextResponse.json({ ok: false, error: "client_user_id_required" }, { status: 400 });
  }
  // When custody was established for a specific customer, the body may only agree with it. This
  // is the stronger half of repair 5: membership proves the id COULD own a listing here; the bound
  // id proves it is the customer this staff session was actually authorized for.
  if (typeof assistedContext.clientUserId === "string" && assistedContext.clientUserId !== clientUserId) {
    await recordSalesWorkspaceAudit({
      action: "quick_sales_save_for_client",
      actorRosterId: assistedContext.rosterId,
      businessId: assistedContext.businessId,
      clientUserId,
      category: "autos",
      listingSource: "autos_classifieds_listings",
      outcome: "assisted_client_mismatch",
    });
    return NextResponse.json({ ok: false, error: "assisted_client_mismatch" }, { status: 409 });
  }
  const clientAuthorized = await isClientAuthorizedForBusiness({
    businessId: assistedContext.businessId,
    clientUserId,
  });
  if (!clientAuthorized) {
    await recordSalesWorkspaceAudit({
      action: "quick_sales_save_for_client",
      actorRosterId: assistedContext.rosterId,
      businessId: assistedContext.businessId,
      clientUserId,
      category: "autos",
      listingSource: "autos_classifieds_listings",
      outcome: "client_not_authorized_for_business",
    });
    return NextResponse.json({ ok: false, error: "client_not_authorized_for_business" }, { status: 403 });
  }

  const dealerListing = body.dealerListing as AutoDealerListing | null | undefined;
  if (!dealerListing || typeof dealerListing !== "object") {
    return NextResponse.json({ ok: false, error: "dealer_listing_required" }, { status: 400 });
  }

  const lang = body.lang === "en" ? "en" as const : "es" as const;

  // REQUIRED REPAIR 4 — the row this request may write is decided by the SERVER-ISSUED context,
  // not by whatever `existingMainListingId` the tab still had in memory. Once the draft exists the
  // context carries its id and a body id may only agree with it; disagreement is a refusal, never
  // a second listing.
  const binding = resolveAssistedRowBinding({
    contextListingId: assistedContext.listingId,
    contextAssistedAction: assistedContext.assistedAction,
    requestedAction: assistedActionRaw,
    bodyListingId: typeof body.existingMainListingId === "string" ? body.existingMainListingId : null,
  });
  if (!binding.ok) {
    await recordSalesWorkspaceAudit({
      action: "quick_sales_save_for_client",
      actorRosterId: assistedContext.rosterId,
      businessId: assistedContext.businessId,
      clientUserId,
      category: "autos",
      listingSource: "autos_classifieds_listings",
      outcome: binding.error,
    });
    return NextResponse.json({ ok: false, error: binding.error }, { status: binding.status });
  }
  const existingMainListingId = binding.listingId;

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


  // Custody is re-proven at every write, including for a server-bound id: a signature minted
  // earlier cannot prove the relationship it describes still holds.
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

  // Create the dealer main row, or UPDATE the canonical one.
  //
  // A REPEAT SAVE THAT WRITES NOTHING IS NOT A SAVE. This branch previously reused the existing id
  // and skipped straight past it, so the second and every subsequent "save for client" returned
  // `{ ok: true, mainListingId }` having persisted not one edited field. Staff corrected a phone
  // number, saw success, reopened the draft and found the old number.
  let mainListingId = existingMainListingId;
  if (mainListingId) {
    const updated = await updateAutosClassifiedsListingDraft(mainListingId, clientUserId, {
      listing: dealerListing,
      lang,
    });
    if (!updated.row) {
      await recordSalesWorkspaceAudit({
        action: "quick_sales_save_for_client",
        actorRosterId: assistedContext.rosterId,
        businessId: assistedContext.businessId,
        clientUserId,
        category: "autos",
        listingSource: "autos_classifieds_listings",
        listingId: mainListingId,
        outcome: updated.errorCode ?? "main_listing_update_failed",
      });
      return NextResponse.json(
        { ok: false, error: "main_listing_update_failed", detail: updated.errorCode ?? null },
        { status: updated.errorCode === "AUTOS_LISTING_NOT_FOUND_OR_FORBIDDEN" ? 409 : 500 },
      );
    }
  }
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
    // ONE VEHICLE CHILD PER ASSISTED DRAFT, NOT ONE PER SAVE.
    //
    // This insert was unconditional. Every repeat save that carried `vehicleListing` — which the
    // staff tool sends on every save — created ANOTHER inventory child under the same dealer
    // parent, so a draft revised four times published four copies of the same car. The existing
    // child is now found first and UPDATED through the owner-scoped draft updater; only a parent
    // with no child yet inserts one.
    const existingChildId = await findExistingAssistedVehicleChildId(mainListingId);
    if (existingChildId) {
      const updatedChild = await updateAutosClassifiedsListingDraft(existingChildId, clientUserId, {
        listing: vehicleListing,
        lang,
      });
      if (!updatedChild.row) {
        return NextResponse.json(
          { ok: false, error: "vehicle_listing_update_failed", detail: updatedChild.errorCode ?? null },
          { status: 500 },
        );
      }
      vehicleListingId = existingChildId;
    } else {
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
    }
  } else if (isAssistedPublish) {
    return NextResponse.json({ ok: false, error: "vehicle_listing_required_for_publish" }, { status: 400 });
  }

  // publish_for_client: verify cleared manual payment before activating
  if (isAssistedPublish) {
    const paid = await refuseUnlessAuthoritativePayment({
      listingSource: "autos_classifieds_listings",
      listingId: mainListingId,
      packageKey: assistedContext.packageKey ?? "",
      category: "autos",
    });
    if (!paid.ok) {
      await recordSalesWorkspaceAudit({
        action: "quick_sales_publish_attempted",
        actorRosterId: assistedContext.rosterId,
        businessId: assistedContext.businessId,
        clientUserId,
        category: "autos",
        listingSource: "autos_classifieds_listings",
        listingId: mainListingId,
        paymentState: paid.paymentState,
        outcome: paid.error,
      });
      return NextResponse.json(
        { ok: false, error: paid.error, message: "Record and clear the payment in the Payment Tracker first." },
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

  await recordSalesWorkspaceAudit({
    action: isAssistedPublish ? "quick_sales_publish_completed" : "quick_sales_save_for_client",
    actorRosterId: assistedContext.rosterId,
    businessId: assistedContext.businessId,
    clientUserId,
    category: "autos",
    listingSource: "autos_classifieds_listings",
    listingId: mainListingId,
    paymentState: isAssistedPublish ? "manual_payment_cleared" : "unpaid_draft",
    outcome: "ok",
    detail: { vehicle_listing_id: vehicleListingId, server_bound_row: binding.serverBound },
  });

  return NextResponse.json({
    ok: true,
    action: assistedActionRaw,
    mainListingId,
    vehicleListingId,
    businessId: assistedContext.businessId,
  });
}

/**
 * The inventory child already prepared under this dealer parent, if any. Ordered oldest-first so
 * a draft that somehow acquired more than one child (from before this repair) keeps converging on
 * the same row rather than walking through them.
 */
async function findExistingAssistedVehicleChildId(parentListingId: string): Promise<string | null> {
  if (!parentListingId) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("autos_classifieds_listings")
      .select("id")
      .eq("dealer_inventory_parent_listing_id", parentListingId)
      .eq("inventory_role", "inventory_vehicle")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    const id = (data as { id?: string } | null)?.id;
    return id ? String(id) : null;
  } catch {
    return null;
  }
}
