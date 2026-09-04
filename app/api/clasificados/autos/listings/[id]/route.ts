import { NextResponse } from "next/server";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { getAutosPublishUserIdFromRequest } from "@/app/lib/clasificados/autos/autosListingBearerAuth";
import {
  assertAutosListingOwner,
  isAutosClassifiedsDbConfigured,
  syncDealerInventoryChildRowsFromParentPayload,
  updateAutosClassifiedsListingDraft,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import type { AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import {
  AUTOS_LISTING_API_MAX_BODY_BYTES,
  buildAutosListingApiErrorPayload,
  buildAutosListingApiSuccessPayload,
  detectAutosHeavyTransport,
  detectAutosLocalVideoTransport,
} from "@/app/lib/clasificados/autos/autosPublishApiContract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

type PatchBody = { listing?: AutoDealerListing; lang?: AutosClassifiedsLang };

export async function PATCH(request: Request, { params }: Props) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number.parseInt(contentLength, 10) > AUTOS_LISTING_API_MAX_BODY_BYTES) {
    return NextResponse.json(
      buildAutosListingApiErrorPayload({
        errorCode: "PAYLOAD_TOO_LARGE",
        message: "Request payload too large.",
        legacyError: "payload_too_large",
      }),
      { status: 413 },
    );
  }

  if (!isAutosClassifiedsDbConfigured()) {
    return NextResponse.json(
      buildAutosListingApiErrorPayload({
        errorCode: "DB_NOT_CONFIGURED",
        message: "Autos storage is not configured.",
        legacyError: "db_not_configured",
      }),
      { status: 503 },
    );
  }
  const userId = await getAutosPublishUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json(
      buildAutosListingApiErrorPayload({
        errorCode: "AUTH_REQUIRED",
        message: "Sign in required.",
        legacyError: "unauthorized",
      }),
      { status: 401 },
    );
  }
  const { id } = await params;
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      buildAutosListingApiErrorPayload({
        errorCode: "INVALID_JSON",
        message: "Invalid JSON body.",
        legacyError: "invalid_json",
      }),
      { status: 400 },
    );
  }

  const localVideo = detectAutosLocalVideoTransport(rawBody);
  if (localVideo.length) {
    return NextResponse.json(
      buildAutosListingApiErrorPayload({
        errorCode: "LOCAL_VIDEO_URL_REQUIRED",
        message: "Publish body must not contain local video files or blob/data video URLs.",
        details: localVideo.slice(0, 12).join("; "),
        legacyError: "local_video_url_required",
      }),
      { status: 400 },
    );
  }

  const heavy = detectAutosHeavyTransport(rawBody);
  if (heavy.length) {
    return NextResponse.json(
      buildAutosListingApiErrorPayload({
        errorCode: "HEAVY_MEDIA_DETECTED",
        message: "Publish body must not contain unpublished local photos (data: URLs or blob: URLs).",
        details: heavy.slice(0, 12).join("; "),
        legacyError: "heavy_media_detected",
      }),
      { status: 400 },
    );
  }

  const body = rawBody as PatchBody;
  if (!body.listing) {
    return NextResponse.json(
      buildAutosListingApiErrorPayload({
        errorCode: "INVALID_AUTOS_PAYLOAD",
        message: "Missing listing.",
        legacyError: "invalid_body",
      }),
      { status: 400 },
    );
  }
  const lang: AutosClassifiedsLang | undefined = body.lang === "en" || body.lang === "es" ? body.lang : undefined;
  const result = await updateAutosClassifiedsListingDraft(id, userId, { listing: body.listing, lang });
  if (!result.row) {
    if (result.errorCode === "AUTOS_LISTING_NOT_FOUND_OR_FORBIDDEN") {
      return NextResponse.json(
        buildAutosListingApiErrorPayload({
          errorCode: "NOT_FOUND",
          message: "Listing not found or you do not have access to it.",
          legacyError: "not_found",
        }),
        { status: 404 },
      );
    }
    if (result.errorCode === "AUTOS_LISTING_STATUS_NOT_EDITABLE") {
      return NextResponse.json(
        buildAutosListingApiErrorPayload({
          errorCode: "UPDATE_FAILED",
          message: "This listing's current status does not allow edits right now.",
          legacyError: "status_not_editable",
        }),
        { status: 409 },
      );
    }
    if (result.errorCode === "AUTOS_LISTING_IDENTITY_SUBSTITUTION_BLOCKED") {
      // Globalization Build 2 — the existing row is left completely unchanged (the guard runs
      // before any write). No media deletion, no analytics mutation, no partial update.
      return NextResponse.json(
        buildAutosListingApiErrorPayload({
          errorCode: "UPDATE_FAILED",
          message:
            "This looks like a different vehicle than the one currently listed here. Create a new listing for a different vehicle instead of editing this one.",
          details: result.errorDetails,
          legacyError: "identity_substitution_blocked",
        }),
        { status: 409 },
      );
    }
    const errorCode =
      result.errorCode === "AUTOS_SUPABASE_UPDATE_FAILED"
        ? "AUTOS_SUPABASE_UPDATE_FAILED"
        : "UPDATE_FAILED";
    return NextResponse.json(
      buildAutosListingApiErrorPayload({
        errorCode,
        message: "Could not update Autos listing draft.",
        details: result.errorDetails,
        legacyError: "update_failed",
      }),
      { status: errorCode === "AUTOS_SUPABASE_UPDATE_FAILED" ? 500 : 400 },
    );
  }
  // Globalization Package B (Gate B5) — after a dealer PARENT save, propagate the embedded
  // inventory edits to each child vehicle's OWN row (ledger defect D4: drawer edits previously
  // updated only the parent's payload, so the child's public page kept rendering stale data
  // forever). Owner-verified per child; draft-only/foreign ids are never touched; partial
  // failures are surfaced, never silent.
  let childSync: { updatedChildIds: string[]; failedChildIds: string[] } | null = null;
  if (result.row.lane === "negocios" && result.row.inventory_role !== "inventory_vehicle") {
    childSync = await syncDealerInventoryChildRowsFromParentPayload(result.row.id, userId);
  }
  return NextResponse.json({
    ...buildAutosListingApiSuccessPayload({
      id: result.row.id,
      leonixAdId: result.row.leonix_ad_id ?? null,
      lane: result.row.lane,
      status: result.row.status,
      persistWarnings: result.persistWarnings,
    }),
    ...(childSync
      ? {
          childSyncUpdated: childSync.updatedChildIds,
          childSyncFailed: childSync.failedChildIds,
        }
      : {}),
  });
}

export async function GET(request: Request, { params }: Props) {
  if (!isAutosClassifiedsDbConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  const userId = await getAutosPublishUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const row = await assertAutosListingOwner(id, userId);
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    id: row.id,
    leonix_ad_id: row.leonix_ad_id,
    status: row.status,
    lane: row.lane,
    lang: row.lang,
    listing: row.listing_payload,
    stripe_checkout_session_id: row.stripe_checkout_session_id,
    // Parent/child identity — needed by listing-bound Preview to distinguish a dealer parent
    // from an inventory vehicle child and to preserve group/parent relationships (Gate C).
    inventory_role: row.inventory_role ?? null,
    dealer_inventory_group_id: row.dealer_inventory_group_id ?? null,
    dealer_inventory_parent_listing_id: row.dealer_inventory_parent_listing_id ?? null,
  });
}
