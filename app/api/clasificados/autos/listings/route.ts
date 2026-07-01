import { NextResponse } from "next/server";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { getAutosPublishUserIdFromRequest } from "@/app/lib/clasificados/autos/autosListingBearerAuth";
import {
  autosClassifiedsRowToDashboardRow,
  createAutosClassifiedsListing,
  createAutosClassifiedsListingWithInventoryParent,
  isAutosClassifiedsDbConfigured,
  listAutosClassifiedsListingsForOwner,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { countActiveDealerVehicles, summarizeDealerInventory } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import type { AutosClassifiedsLane, AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import {
  AUTOS_LISTING_API_MAX_BODY_BYTES,
  buildAutosListingApiErrorPayload,
  buildAutosListingApiSuccessPayload,
  detectAutosHeavyTransport,
  detectAutosLocalVideoTransport,
} from "@/app/lib/clasificados/autos/autosPublishApiContract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  listing?: AutoDealerListing;
  lane?: AutosClassifiedsLane;
  lang?: AutosClassifiedsLang;
  parentListingId?: string;
  dealerInventoryGroupId?: string;
};

function dbNotConfigured(lang: AutosClassifiedsLang) {
  return NextResponse.json(
    buildAutosListingApiErrorPayload({
      errorCode: "DB_NOT_CONFIGURED",
      message:
        lang === "es"
          ? "El sistema de Autos no está configurado todavía."
          : "Autos storage is not configured yet.",
      legacyError: "db_not_configured",
    }),
    { status: 503 },
  );
}

/** Owner's Autos classifieds rows (all statuses) for dashboard / publish flow. */
export async function GET(request: Request) {
  if (!isAutosClassifiedsDbConfigured()) {
    return dbNotConfigured("es");
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
  const rows = await listAutosClassifiedsListingsForOwner(userId);
  const dealerInventory = summarizeDealerInventory(countActiveDealerVehicles(rows));
  return NextResponse.json({
    ok: true,
    listings: rows.map(autosClassifiedsRowToDashboardRow),
    dealerInventory,
  });
}

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number.parseInt(contentLength, 10) > AUTOS_LISTING_API_MAX_BODY_BYTES) {
    return NextResponse.json(
      buildAutosListingApiErrorPayload({
        errorCode: "PAYLOAD_TOO_LARGE",
        message: "Request payload too large.",
        details: `max=${AUTOS_LISTING_API_MAX_BODY_BYTES}`,
        legacyError: "payload_too_large",
      }),
      { status: 413 },
    );
  }

  if (!isAutosClassifiedsDbConfigured()) {
    return dbNotConfigured("es");
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

  const bodySize = new Blob([JSON.stringify(rawBody)]).size;
  if (bodySize > AUTOS_LISTING_API_MAX_BODY_BYTES) {
    return NextResponse.json(
      buildAutosListingApiErrorPayload({
        errorCode: "PAYLOAD_TOO_LARGE",
        message: `Request payload too large (${(bodySize / 1024).toFixed(1)} KB).`,
        legacyError: "payload_too_large",
      }),
      { status: 413 },
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

  const body = rawBody as Body;
  if (!body.listing || (body.lane !== "negocios" && body.lane !== "privado")) {
    return NextResponse.json(
      buildAutosListingApiErrorPayload({
        errorCode: "INVALID_AUTOS_PAYLOAD",
        message: "Missing listing or lane.",
        legacyError: "invalid_body",
      }),
      { status: 400 },
    );
  }

  const lang: AutosClassifiedsLang = body.lang === "en" ? "en" : "es";
  const parentListingId = body.parentListingId?.trim();
  const createInput = {
    ownerUserId: userId,
    lane: body.lane,
    lang,
    listing: body.listing,
    dealerInventoryGroupId: body.dealerInventoryGroupId?.trim() || null,
  };

  const result =
    body.lane === "negocios" && parentListingId
      ? await createAutosClassifiedsListingWithInventoryParent({ ...createInput, parentListingId })
      : await createAutosClassifiedsListing(createInput);

  if (!result.row) {
    const errorCode =
      result.errorCode === "AUTOS_SUPABASE_INSERT_FAILED"
        ? "AUTOS_SUPABASE_INSERT_FAILED"
        : "CREATE_FAILED";
    return NextResponse.json(
      buildAutosListingApiErrorPayload({
        errorCode,
        message: "Could not create Autos listing draft.",
        details: result.errorDetails,
        legacyError: "create_failed",
      }),
      { status: errorCode === "AUTOS_SUPABASE_INSERT_FAILED" ? 500 : 500 },
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
