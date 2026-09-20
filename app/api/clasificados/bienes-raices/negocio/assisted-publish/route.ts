/**
 * Gate QB-STAFF-BR-01 — Bienes Negocio staff-assisted publish endpoint.
 *
 * POST { assistedAction, clientUserId, listingRow, existingListingId? }
 *
 * Allows a Leonix staff actor with a valid assisted-publishing cookie to create
 * a Bienes Raíces Negocio listing (main row + optional property) attributed to
 * the CLIENT's user account. The clientUserId is accepted from the request body
 * and trusted only because the staff actor has already authenticated through the
 * HMAC-signed assisted-publishing cookie.
 *
 * Actions:
 *  - save_for_client: creates/updates the listing row as pending, links to business
 *  - publish_for_client: creates row as active, links to business, requires cleared
 *    manual payment before going live
 *
 * Image uploads happen out-of-band through the existing listing-images storage
 * pipeline. This route creates the row skeleton; the staff actor uploads photos
 * separately via the existing listing-edit endpoints.
 */
import { NextResponse, type NextRequest } from "next/server";
import { readAssistedPublishingContext } from "@/app/lib/auth/assistedPublishingSession";
import {
  hasClearedManualPaymentForListing,
  isListingLinkedToBusiness,
  linkAssistedListingToBusiness,
} from "@/app/lib/business/assistedListingCustody";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Columns staff may supply in listingRow. owner_id is always overwritten server-side. */
const ALLOWED_LISTING_COLUMNS = new Set([
  "title",
  "description",
  "city",
  "state",
  "zip",
  "price",
  "is_free",
  "category",
  "seller_type",
  "business_name",
  "business_meta",
  "detail_pairs",
  "listing_json",
  "profile_json",
  "contact_json",
  "contact_phone",
  "contact_email",
  "inventory_role",
  "br_inventory_group_id",
  "br_inventory_parent_listing_id",
]);

export async function POST(request: NextRequest) {
  const assistedContext = readAssistedPublishingContext(request.cookies);
  if (!assistedContext || assistedContext.category !== "bienes-raices") {
    return NextResponse.json({ ok: false, error: "assisted_context_required" }, { status: 403 });
  }

  if (!isSupabaseAdminConfigured()) {
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

  const clientUserId = typeof body.clientUserId === "string" ? body.clientUserId.trim() : "";
  if (!clientUserId) {
    return NextResponse.json({ ok: false, error: "client_user_id_required" }, { status: 400 });
  }

  const listingRowRaw = body.listingRow as Record<string, unknown> | null | undefined;
  if (!listingRowRaw || typeof listingRowRaw !== "object") {
    return NextResponse.json({ ok: false, error: "listing_row_required" }, { status: 400 });
  }

  const existingListingId = typeof body.existingListingId === "string" ? body.existingListingId.trim() : "";

  // If updating an existing listing, verify it is linked to the business
  if (existingListingId) {
    const linked = await isListingLinkedToBusiness({
      businessId: assistedContext.businessId,
      listingSource: "listings",
      listingId: existingListingId,
    });
    if (!linked) {
      return NextResponse.json({ ok: false, error: "listing_not_linked_to_business" }, { status: 403 });
    }
  }

  // Filter to only allowed columns; always overwrite owner_id server-side
  const filteredRow: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(listingRowRaw)) {
    if (ALLOWED_LISTING_COLUMNS.has(key)) {
      filteredRow[key] = value;
    }
  }

  const nowIso = new Date().toISOString();
  const insertRow: Record<string, unknown> = {
    ...filteredRow,
    owner_id: clientUserId,
    status: isAssistedPublish ? "active" : "pending",
    is_published: isAssistedPublish,
    updated_at: nowIso,
  };
  if (isAssistedPublish) {
    insertRow.published_at = nowIso;
  }
  // Ensure category is bienes-raices for this route
  if (!insertRow.category) {
    insertRow.category = "bienes-raices";
  }
  // BR negocio listings are business seller_type
  if (!insertRow.seller_type) {
    insertRow.seller_type = "business";
  }
  // Default inventory_role to "main" for the primary listing
  if (!insertRow.inventory_role) {
    insertRow.inventory_role = "main";
  }

  const db = getAdminSupabase();
  let listingId = existingListingId;

  if (listingId) {
    // Update existing listing (idempotent re-save)
    const patch = { ...insertRow };
    delete patch.owner_id; // never overwrite ownership on update
    const { error: updateError } = await db
      .from("listings")
      .update(patch)
      .eq("id", listingId)
      .eq("owner_id", clientUserId);
    if (updateError) {
      return NextResponse.json({ ok: false, error: "listing_update_failed" }, { status: 500 });
    }
  } else {
    // Insert new listing
    const { data: inserted, error: insertError } = await db
      .from("listings")
      .insert(insertRow)
      .select("id")
      .single();
    if (insertError || !inserted?.id) {
      return NextResponse.json({ ok: false, error: "listing_create_failed" }, { status: 500 });
    }
    listingId = String(inserted.id);

    // Patch br_inventory_group_id to self for main role (mirrors mainListingInventoryPatchAfterInsert)
    if (insertRow.inventory_role === "main" && !insertRow.br_inventory_group_id) {
      await db
        .from("listings")
        .update({ br_inventory_group_id: listingId })
        .eq("id", listingId);
    }

    // Link to business
    await linkAssistedListingToBusiness({
      businessId: assistedContext.businessId,
      listingSource: "listings",
      listingId,
      linkedByAuthUserId: assistedContext.authUserId,
    });
  }

  // publish_for_client: verify cleared manual payment before activating
  if (isAssistedPublish) {
    const cleared = await hasClearedManualPaymentForListing({
      listingSource: "listings",
      listingId,
    });
    if (!cleared) {
      return NextResponse.json(
        {
          ok: false,
          error: "manual_payment_not_cleared",
          message: "Record and clear the manual payment in the Payment Tracker first.",
          listingId,
        },
        { status: 402 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    action: assistedActionRaw,
    listingId,
    businessId: assistedContext.businessId,
  });
}
