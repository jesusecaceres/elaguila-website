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
 * GALLERY. The staff application's photos are uploaded to durable storage by the browser (the
 * same Blob upload endpoint the Rentas customer path uses) BEFORE the save, and the resulting
 * https URLs arrive here as `listingRow.images` (URL strings, or `{url, role}` when a role was
 * declared). This route validates every URL with the shared media contract (`isPersistableMediaUrl`:
 * data:/blob: never persist), writes `listings.images`, and records the DECLARED roles in
 * `listing_json.br_media_roles` so the cockpit readiness can re-read them. It never fabricates an
 * image and never invents a role. A request with no `images` leaves the stored gallery untouched.
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
  type SemanticMediaItem,
} from "@/app/lib/quickBusiness/quickBusinessMediaSemantics";
import {
  parseAssistedBienesGallery,
  storedBienesMediaFacts,
  withStoredBienesMediaRoles,
} from "@/app/lib/clasificados/bienes-raices/assistedBienesGallery";
import { resolveQuickBusinessPublishIdentity } from "@/app/lib/listingPlans/quickBusinessProductIdentityServer";
import {
  forceQuickBienesMainInventoryRow,
  quickBienesNetNewExternalVideoCount,
  quickFullOnlyBoundaryApplies,
  stripQuickBienesFullOnlyFields,
} from "@/app/lib/clasificados/bienes-raices/stripQuickBienesFullOnlyFields";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Columns staff may supply in listingRow. owner_id is always overwritten server-side.
 * `images` is allowed ONLY through `parseAssistedBienesGallery` below: the raw value never reaches
 * the row (it is replaced by the validated durable URLs, or removed).
 */
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
  "images",
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
  // The product this custody sells, resolved ONCE from server-owned records (signed assisted package,
  // live entitlement, checkout ledger) for BOTH actions: the Quick Full-only boundary below applies to a
  // save as well as a publish.
  const assistedProduct = await resolveQuickBusinessPublishIdentity({
    category: "bienes-raices",
    ownerUserId: clientUserId || "",
    listingId: existingListingId || null,
    assistedPackageKey: assistedContext.packageKey ?? null,
  });

  // THE GALLERY THE STAFF APPLICATION ACTUALLY HAS. Durable URLs only (shared media contract): a
  // data:/blob:/relative entry is refused here rather than dropped, because a dropped photo would
  // come back later as a misleading "no property photo" refusal. `null` = the request carries no
  // gallery, and the stored one is left exactly as it is.
  const galleryParse = parseAssistedBienesGallery(listingRowRaw.images);
  if (!galleryParse.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: galleryParse.error,
        message:
          galleryParse.error === "images_too_many"
            ? "Too many photos for this listing."
            : "Photos must be uploaded to durable storage before saving (no data: or blob: URLs).",
        messageEs:
          galleryParse.error === "images_too_many"
            ? "Demasiadas fotos para este anuncio."
            : "Las fotos deben subirse al almacenamiento antes de guardar (sin URLs data: ni blob:).",
      },
      { status: 422 },
    );
  }
  const gallery = galleryParse.gallery;
  // The role-bearing media set, read by the SAME canonical extractor the customer seams use.
  const requestMediaItems: SemanticMediaItem[] = extractSemanticMediaItems({ images: gallery?.entries ?? [] });
  if (isAssistedPublish && gallery) {
    // Gate QB-MEDIA-03 — the SAME canonical entry point the four self-service seams call, so the
    // assisted and self-service paths cannot drift into two different contracts.
    const semanticMedia = assistedProduct.enforceQuickContract
      ? enforceQuickBusinessPublishMedia({
          category: "bienes-negocio",
          items: requestMediaItems,
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

  // The STORED gallery + role map of the bound row, read only when this request needs it: a Quick
  // publish that carries no gallery is judged on what is stored, and a save that declares photo
  // roles must merge them into (never replace) the stored `listing_json`. Read AFTER the custody
  // link check above. A failed read refuses; it is never treated as "no photos".
  let storedGallery: { images: unknown; listing_json: unknown } | null = null;
  const needsStoredGallery =
    Boolean(existingListingId) &&
    ((isAssistedPublish && !gallery && assistedProduct.enforceQuickContract) ||
      (Boolean(gallery) && Object.keys(gallery?.roles ?? {}).length > 0 && listingRowRaw.listing_json == null));
  if (needsStoredGallery) {
    const { data: storedRow, error: storedError } = await getAdminSupabase()
      .from("listings")
      .select("images, listing_json")
      .eq("id", existingListingId as string)
      .eq("category", "bienes-raices")
      .maybeSingle();
    if (storedError) {
      return NextResponse.json({ ok: false, error: "listing_read_failed" }, { status: 500 });
    }
    storedGallery = storedRow ? (storedRow as unknown as { images: unknown; listing_json: unknown }) : null;
  }
  if (isAssistedPublish && !gallery && assistedProduct.enforceQuickContract) {
    // Same canonical entry point, judged on the STORED row (what the cockpit readiness also reads).
    const storedMedia = enforceQuickBusinessPublishMedia({
      category: "bienes-negocio",
      items: storedGallery ? storedBienesMediaFacts(storedGallery).items : [],
    });
    if (storedMedia && !storedMedia.ok) {
      return NextResponse.json(storedMedia.body, { status: storedMedia.status });
    }
  }

  // Filter to only allowed columns; always overwrite owner_id server-side
  let filteredRow: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(listingRowRaw)) {
    if (ALLOWED_LISTING_COLUMNS.has(key)) {
      filteredRow[key] = value;
    }
  }
  // `images` NEVER passes through raw: it is the validated durable-URL list, or it is absent and the
  // stored gallery is untouched. The DECLARED roles ride in `listing_json.br_media_roles` (merged into
  // the request's own listing_json, or the stored one when the request carried none).
  delete filteredRow.images;
  if (gallery) {
    filteredRow.images = gallery.urls;
    if (Object.keys(gallery.roles).length > 0 || filteredRow.listing_json != null) {
      filteredRow.listing_json = withStoredBienesMediaRoles(
        filteredRow.listing_json ?? storedGallery?.listing_json ?? null,
        gallery.roles,
      );
    }
  }

  // QUICK FULL-ONLY BOUNDARY (proven Quick only — never `unverified`, which may be a Full customer).
  // Extra socials, Google/Yelp links, extra business links and video are RESTORED from the stored row
  // (reopen) or emptied (first save); the staff/browser value never wins. Gated on the PROVEN product,
  // not on the enforce flag.
  const quickProven = quickFullOnlyBoundaryApplies(assistedProduct);
  if (quickProven) {
    let storedForBoundary: Record<string, unknown> | null = null;
    if (existingListingId) {
      const { data: stored } = await getAdminSupabase()
        .from("listings")
        .select("business_meta, detail_pairs, profile_json, contact_json")
        .eq("id", existingListingId)
        .eq("category", "bienes-raices")
        .maybeSingle();
      storedForBoundary = stored ? (stored as Record<string, unknown>) : null;
    }
    filteredRow = stripQuickBienesFullOnlyFields({ row: filteredRow, existingRow: storedForBoundary }).row;
    // ONE property, no inventory: a proven Quick row is ALWAYS main and never arrives grouped/parented
    // (the request may not name a child role or a parent). Applied to the filtered row BEFORE the insert
    // row is built, so the insert path stays born-pending exactly as pinned. Full/PRO and unverified are untouched.
    filteredRow = forceQuickBienesMainInventoryRow(filteredRow);
    // QUICK PHOTO CAP (bienes-negocio = quickImageMaxForBusinessCategory): a proven Quick gallery may not
    // be stored past the cap. Only the count rule is applied on a save (a draft may still be missing its
    // property photo); publish runs the whole contract above / in the cockpit readiness.
    if (gallery) {
      const capCheck = enforceQuickBusinessPublishMedia({ category: "bienes-negocio", items: requestMediaItems });
      if (capCheck && !capCheck.ok && capCheck.issues.some((i) => i.code === "too_many_images")) {
        const tooMany = capCheck.issues.find((i) => i.code === "too_many_images")!;
        return NextResponse.json(
          {
            ok: false,
            error: "media_contract_violation",
            issues: ["too_many_images"],
            message: tooMany.messageEn,
            messageEs: tooMany.messageEs,
          },
          { status: 422 },
        );
      }
    }
    // Defence in depth ("Quick includes no video"): external video links this write would ADD. 0 after
    // the boundary; a real count would mean it failed, and the canonical contract then refuses.
    const netNewVideos = quickBienesNetNewExternalVideoCount({ row: filteredRow, existingRow: storedForBoundary });
    if (isAssistedPublish && netNewVideos > 0) {
      const videoRefusal = enforceQuickBusinessPublishMedia({
        category: "bienes-negocio",
        items: requestMediaItems,
        externalVideoCount: netNewVideos,
      });
      if (videoRefusal && !videoRefusal.ok) {
        return NextResponse.json(videoRefusal.body, { status: videoRefusal.status });
      }
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
    // PARENT/CHILD INVARIANTS ARE STRUCTURE, NOT FORM DATA. The row's inventory role and group/parent
    // links were fixed when it was created (main -> group id = its own id); an update built from a
    // reopened draft must never rewrite them, or re-saving could demote a main row or detach a child.
    delete patch.inventory_role;
    delete patch.br_inventory_group_id;
    delete patch.br_inventory_parent_listing_id;
    // REOPEN — the bound row is targeted BY ID under proven custody (ledger link checked above, signed
    // context, category re-read here). Custody, not `owner_id`, is the authority for a Leonix-prepared
    // row: it may be owner-null (Leonix-managed) or owned by a client that changed since the first
    // save, and demanding an owner match 409'd every such reopen. Ownership and lifecycle are never
    // written here.
    const { data: existingRow, error: existingError } = await db
      .from("listings")
      .select("id, category, owner_id")
      .eq("id", listingId)
      .maybeSingle();
    if (existingError) {
      return NextResponse.json({ ok: false, error: "listing_update_failed" }, { status: 500 });
    }
    if (!existingRow?.id) {
      return NextResponse.json({ ok: false, error: "listing_not_found" }, { status: 404 });
    }
    if (String(existingRow.category ?? "") !== "bienes-raices") {
      return NextResponse.json({ ok: false, error: "listing_category_mismatch" }, { status: 422 });
    }
    // ZERO ROWS IS NOT SUCCESS.
    //
    // `.update(...)` with no `.select()` returns a null error when it matches NOTHING, which used to
    // produce `{ ok: true, listingId }` having written not one column. The row count is the answer.
    const { data: updatedRow, error: updateError } = await db
      .from("listings")
      .update(patch)
      .eq("id", listingId)
      .eq("category", "bienes-raices")
      .select("id")
      .maybeSingle();
    if (updateError) {
      return NextResponse.json({ ok: false, error: "listing_update_failed" }, { status: 500 });
    }
    if (!updatedRow?.id) {
      return NextResponse.json({ ok: false, error: "listing_update_failed" }, { status: 409 });
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
    // The row is either the one just inserted or the custody-proven bound row, so it is targeted by id
    // (an owner filter here rejected owner-null / owner-changed Leonix-managed rows the same way).
    const { data: activatedRow, error: activateError } = await db
      .from("listings")
      .update({ status: "active", is_published: true, published_at: activatedAt, updated_at: activatedAt })
      .eq("id", listingId)
      .eq("category", "bienes-raices")
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
        { ok: false, error: "listing_activate_failed", listingId },
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
