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
  isListingLinkedToBusiness,
  linkAssistedListingToBusiness,
} from "@/app/lib/business/assistedListingCustody";
import { refuseUnlessAuthoritativePayment } from "@/app/lib/listingPlans/listingPackagePaymentAuthorityServer";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  assertAssistedIdentity,
  resolveAssistedRowBinding,
  resolveAssistedSessionConflict,
} from "@/app/lib/sales/assistedSameRowBinding";
import { isClientAuthorizedForBusiness } from "@/app/lib/sales/assistedClientAuthorization";
import { recordSalesWorkspaceAudit } from "@/app/lib/sales/salesWorkspaceAudit";
import { customerUserIdFromBearer } from "@/app/lib/auth/customerBearerUserId";
import {
  enforceQuickBusinessPublishMedia,
  extractSemanticMediaItems,
} from "@/app/lib/quickBusiness/quickBusinessMediaSemantics";
import { resolveQuickBusinessPublishIdentity } from "@/app/lib/listingPlans/quickBusinessProductIdentityServer";

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
  if (!assistedContext) {
    return NextResponse.json({ ok: false, error: "assisted_context_required" }, { status: 403 });
  }
  const identityRefusal = assertAssistedIdentity({
    contextCategory: assistedContext.category,
    expectedCategory: "bienes-raices",
    contextBusinessId: assistedContext.businessId,
  });
  if (identityRefusal) {
    return NextResponse.json({ ok: false, error: identityRefusal.error }, { status: identityRefusal.status });
  }

  // QUICK SALES ENTRY CONSOLIDATION — see the Autos route: an assisted request may carry NO site
  // session, or exactly the client this custody names. Two disagreeing identities are refused.
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
      category: "bienes-raices",
      listingSource: "listings",
      outcome: sessionConflict.error,
    });
    return NextResponse.json({ ok: false, error: sessionConflict.error }, { status: sessionConflict.status });
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

  // The server-issued assisted context is the primary customer-identity authority. A body id may
  // only agree with it; callers are not required to repeat an id that is already signed into the
  // custody token. Legacy Leonix-managed drafts may still have no client id.
  const bodyClientUserId = typeof body.clientUserId === "string" ? body.clientUserId.trim() : "";
  const contextClientUserId =
    typeof assistedContext.clientUserId === "string" ? assistedContext.clientUserId.trim() : "";
  const clientUserId = bodyClientUserId || contextClientUserId;
  if (clientUserId) {
    if (bodyClientUserId && contextClientUserId && contextClientUserId !== bodyClientUserId) {
      await recordSalesWorkspaceAudit({
        action: "quick_sales_save_for_client",
        actorRosterId: assistedContext.rosterId,
        businessId: assistedContext.businessId,
        clientUserId,
        category: "bienes-raices",
        listingSource: "listings",
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
        category: "bienes-raices",
        listingSource: "listings",
        outcome: "client_not_authorized_for_business",
      });
      return NextResponse.json({ ok: false, error: "client_not_authorized_for_business" }, { status: 403 });
    }
  }

  const listingRowRaw = body.listingRow as Record<string, unknown> | null | undefined;
  if (!listingRowRaw || typeof listingRowRaw !== "object") {
    return NextResponse.json({ ok: false, error: "listing_row_required" }, { status: 400 });
  }

  // REQUIRED REPAIR 4 — the canonical row comes from the server-issued context once it exists; a
  // body id may only agree with it. Reopening a draft therefore recovers the same row even when
  // the browser has forgotten which one it was.
  const binding = resolveAssistedRowBinding({
    contextListingId: assistedContext.listingId,
    contextAssistedAction: assistedContext.assistedAction,
    requestedAction: assistedActionRaw,
    bodyListingId: typeof body.existingListingId === "string" ? body.existingListingId : null,
  });
  if (!binding.ok) {
    await recordSalesWorkspaceAudit({
      action: "quick_sales_save_for_client",
      actorRosterId: assistedContext.rosterId,
      businessId: assistedContext.businessId,
      clientUserId,
      category: "bienes-raices",
      listingSource: "listings",
      outcome: binding.error,
    });
    return NextResponse.json({ ok: false, error: binding.error }, { status: binding.status });
  }
  const existingListingId = binding.listingId;

  // Gate QB-MEDIA-02 — a property listing must carry at least one real PROPERTY photo. An agent
  // headshot and a brokerage logo are identity assets and can never satisfy that slot. Checked on
  // publish only: a save_for_client draft is allowed to be incomplete.
  if (isAssistedPublish) {
    // Gate QB-MEDIA-03 — the SAME canonical entry point the four self-service seams call, so the
    // assisted and self-service paths cannot drift into two different contracts.
    const assistedProduct = await resolveQuickBusinessPublishIdentity({
      category: "bienes-raices",
      ownerUserId: clientUserId || "",
      listingId: existingListingId || null,
      assistedPackageKey: assistedContext.packageKey ?? null,
    });
    const semanticMedia = assistedProduct.enforceQuickContract
      ? enforceQuickBusinessPublishMedia({
          category: "bienes-negocio",
          items: extractSemanticMediaItems(listingRowRaw),
        })
      : null;
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
  // `refuseUnlessAuthoritativePayment` says this listing has matching package payment.
  const insertRow: Record<string, unknown> = {
    ...filteredRow,
    status: "pending",
    is_published: false,
    updated_at: nowIso,
  };
  if (clientUserId) insertRow.owner_id = clientUserId;
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
    // live DARK. Listing-only manual clearance used to fail Stripe-paid live rows. The canonical
    // helper now accepts webhook-backed paid/succeeded truth for the SAME package, so a Full
    // Stripe payment cannot be unpublished by a later staff typo-fix — and a Quick payment still
    // cannot activate Full.
    //
    // Lifecycle is not this route's to change on an existing row. A pending row stays pending, a
    // live row stays live, and the ONLY transition to live remains the post-payment activation
    // below — which is exactly the guarantee the pending-insert change was made to establish.
    delete patch.status;
    delete patch.is_published;
    delete patch.published_at;
    // ZERO ROWS IS NOT SUCCESS.
    //
    // `.update(...).eq(...).eq("owner_id", clientUserId)` with no `.select()` returns a null error
    // when it matches NOTHING, so a `clientUserId` that does not match the stored owner produced
    // `{ ok: true, listingId }` having written not one column. Staff were told the client's ad had
    // been saved; nothing had been. The row count is now the answer.
    const updateQuery = clientUserId
      ? db.from("listings").update(patch).eq("id", listingId).eq("owner_id", clientUserId)
      : db.from("listings").update(patch).eq("id", listingId);
    const { data: updatedRow, error: updateError } = await updateQuery
      .select("id")
      .maybeSingle();
    if (updateError) {
      return NextResponse.json({ ok: false, error: "listing_update_failed" }, { status: 500 });
    }
    if (!updatedRow?.id) {
      return NextResponse.json({ ok: false, error: "listing_owner_mismatch" }, { status: 409 });
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
    const paid = await refuseUnlessAuthoritativePayment({
      listingSource: "listings",
      listingId,
      packageKey: assistedContext.packageKey ?? "",
      category: "bienes-raices",
    });
    if (!paid.ok) {
      await recordSalesWorkspaceAudit({
        action: "quick_sales_publish_attempted",
        actorRosterId: assistedContext.rosterId,
        businessId: assistedContext.businessId,
        clientUserId,
        category: "bienes-raices",
        listingSource: "listings",
        listingId,
        paymentState: paid.paymentState,
        outcome: paid.error,
      });
      return NextResponse.json(
        {
          ok: false,
          error: paid.error,
          message: "Record and clear the payment in the Payment Tracker first.",
          listingId,
        },
        { status: 402 },
      );
    }

    const activatedAt = new Date().toISOString();
    // Same rule on the one write that makes a listing PUBLIC: a zero-row activation reported as
    // success is a listing staff believe is live and a customer cannot find.
    const activateQuery = clientUserId
      ? db
          .from("listings")
          .update({ status: "active", is_published: true, published_at: activatedAt, updated_at: activatedAt })
          .eq("id", listingId)
          .eq("owner_id", clientUserId)
      : db
          .from("listings")
          .update({ status: "active", is_published: true, published_at: activatedAt, updated_at: activatedAt })
          .eq("id", listingId);
    const { data: activatedRow, error: activateError } = await activateQuery
      .select("id")
      .maybeSingle();
    if (activateError) {
      return NextResponse.json(
        { ok: false, error: "listing_activate_failed", listingId },
        { status: 500 },
      );
    }
    if (!activatedRow?.id) {
      return NextResponse.json(
        { ok: false, error: "listing_owner_mismatch", listingId },
        { status: 409 },
      );
    }
  }

  await recordSalesWorkspaceAudit({
    action: isAssistedPublish ? "quick_sales_publish_completed" : "quick_sales_save_for_client",
    actorRosterId: assistedContext.rosterId,
    businessId: assistedContext.businessId,
    clientUserId,
    category: "bienes-raices",
    listingSource: "listings",
    listingId,
    paymentState: isAssistedPublish ? "manual_payment_cleared" : "unpaid_draft",
    outcome: "ok",
    detail: { server_bound_row: binding.serverBound },
  });

  return NextResponse.json({
    ok: true,
    action: assistedActionRaw,
    listingId,
    businessId: assistedContext.businessId,
  });
}
