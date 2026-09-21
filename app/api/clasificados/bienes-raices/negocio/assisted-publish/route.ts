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
import { readActiveAssistedPublishingContext } from "@/app/lib/auth/assistedPublishingSession";
import {
  hasClearedManualPaymentForListing,
  isListingLinkedToBusiness,
  linkAssistedListingToBusiness,
} from "@/app/lib/business/assistedListingCustody";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  enforceQuickBusinessPublishMedia,
  extractSemanticMediaItems,
} from "@/app/lib/quickBusiness/quickBusinessMediaSemantics";

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
  // Gate QB-STAFF-03 — the roster is re-checked HERE, at redemption, not only at mint time. A
  // staff member deactivated or removed after their token was issued can no longer publish on a
  // customer's behalf with it. Fails closed on an unreachable database.
  const assistedContext = await readActiveAssistedPublishingContext(request.cookies);
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

  // Gate QB-MEDIA-02 — a property listing must carry at least one real PROPERTY photo. An agent
  // headshot and a brokerage logo are identity assets and can never satisfy that slot. Checked on
  // publish only: a save_for_client draft is allowed to be incomplete.
  if (isAssistedPublish) {
    // Gate QB-MEDIA-03 — the SAME canonical entry point the four self-service seams call, so the
    // assisted and self-service paths cannot drift into two different contracts.
    const semanticMedia = enforceQuickBusinessPublishMedia({
      category: "bienes-negocio",
      items: extractSemanticMediaItems(listingRowRaw),
    });
    if (semanticMedia && !semanticMedia.ok) {
      return NextResponse.json(semanticMedia.body, { status: semanticMedia.status });
    }
  }

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
  // THE ROW IS NEVER WRITTEN LIVE BEFORE THE PAYMENT IS VERIFIED.
  //
  // `publish_for_client` used to insert with `status: "active"`, `is_published: true` and a
  // `published_at`, and only THEN check for a cleared manual payment — returning 402 with the
  // listing already public and no rollback. `is_published = true AND status = 'active'` is
  // exactly the public read predicate, so staff saw "record and clear the payment first" while
  // the unpaid listing was live to the world.
  //
  // Every write below lands as PENDING. Activation is a separate step that happens only after
  // `hasClearedManualPaymentForListing` says the money is in, which is the same order the Autos
  // assisted route already used.
  const insertRow: Record<string, unknown> = {
    ...filteredRow,
    owner_id: clientUserId,
    status: "pending",
    is_published: false,
    updated_at: nowIso,
  };
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
    // NEVER DEMOTE AN EXISTING ROW FROM HERE.
    //
    // Forcing `pending` / `is_published: false` onto every write is right for an INSERT — an
    // unpaid listing must not be born live — but on an UPDATE it took a listing that was ALREADY
    // live DARK. `hasClearedManualPaymentForListing` is true only for a cleared MANUAL payment,
    // so a Stripe-paid listing fails it: staff opening the assisted tool to fix a typo on a live,
    // fully-paid listing unpublished it and got a 402 with no rollback. That hit Full agents as
    // well as Quick.
    //
    // Lifecycle is not this route's to change on an existing row. A pending row stays pending, a
    // live row stays live, and the ONLY transition to live remains the post-payment activation
    // below — which is exactly the guarantee the pending-insert change was made to establish.
    delete patch.status;
    delete patch.is_published;
    delete patch.published_at;
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

  // publish_for_client: verify cleared manual payment, and ONLY THEN activate.
  if (isAssistedPublish) {
    const cleared = await hasClearedManualPaymentForListing({
      listingSource: "listings",
      listingId,
    });
    if (!cleared) {
      // The row exists but is PENDING and unpublished, so nothing is public. Staff can clear the
      // payment and re-run this action, which will find the same row and activate it.
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

    const activatedAt = new Date().toISOString();
    const { error: activateError } = await db
      .from("listings")
      .update({ status: "active", is_published: true, published_at: activatedAt, updated_at: activatedAt })
      .eq("id", listingId)
      .eq("owner_id", clientUserId);
    if (activateError) {
      return NextResponse.json(
        { ok: false, error: "listing_activate_failed", listingId },
        { status: 500 },
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
