import { NextResponse } from "next/server";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { getAutosPublishUserIdFromRequest } from "@/app/lib/clasificados/autos/autosListingBearerAuth";
import {
  assertAutosListingOwner,
  isAutosClassifiedsDbConfigured,
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
  return NextResponse.json(
    buildAutosListingApiSuccessPayload({
      id: result.row.id,
      leonixAdId: result.row.leonix_ad_id ?? null,
      lane: result.row.lane,
      status: result.row.status,
      persistWarnings: result.persistWarnings,
    }),
  );
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
  });
}
