import { NextResponse, type NextRequest } from "next/server";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { getAutosPublishUserIdFromRequest } from "@/app/lib/clasificados/autos/autosListingBearerAuth";
import {
  autosClassifiedsRowToDashboardRow,
  createAutosClassifiedsListing,
  createAutosClassifiedsListingWithInventoryParent,
  isAutosClassifiedsDbConfigured,
  listAutosClassifiedsListingsForOwner,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { countActiveDealerVehicles, summarizeDealerInventory, isDealerInventoryMainListing } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import { AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY, AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT } from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { isListingPackageEntitlementRowActive } from "@/app/lib/listingPlans/listingPackageEntitlementPlacement";
import { assertCommercialCapacityForWrite } from "@/app/lib/listingPlans/commercialWriteGuard";
import { linkSelfServiceListingToBusiness } from "@/app/lib/business/canonicalListingLink";
import { linkAssistedListingToBusiness } from "@/app/lib/business/assistedListingCustody";
import { applyAssistedPublishingCookie } from "@/app/lib/auth/assistedPublishingSession";
import { resolveStaffAssistedCategorySave } from "@/app/lib/sales/staffAssistedCategorySave";
import { recordSalesWorkspaceAudit } from "@/app/lib/sales/salesWorkspaceAudit";
import { enforceQuickBusinessPublishMedia } from "@/app/lib/quickBusiness/quickBusinessMediaSemantics";
import { resolveQuickBusinessPublishIdentity } from "@/app/lib/listingPlans/quickBusinessProductIdentityServer";
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
  /**
   * Gate QB-BOUNDARY-01 — the base package the caller believes it is publishing under. This is
   * the caller's WORD, not authority: `resolveQuickBusinessPublishIdentity` reads it only when it
   * names the category's SIMPLE key, and any server-owned record (entitlement row, checkout
   * ledger, assisted context) overrides it in either direction. Declaring the Full key, or
   * omitting it, can never lift a Quick customer out of the Quick contract.
   */
  basePackageKey?: string;
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

async function ownerHasActiveDealerInventoryPack(
  ownerUserId: string,
  rows: Awaited<ReturnType<typeof listAutosClassifiedsListingsForOwner>>,
): Promise<boolean> {
  const { getAdminSupabase, isSupabaseAdminConfigured } = await import("@/app/lib/supabase/server");
  if (!isSupabaseAdminConfigured()) return false;
  const mainIds = rows
    .filter((r) => isDealerInventoryMainListing(r) && r.status === "active")
    .map((r) => r.id)
    .filter(Boolean);
  if (!mainIds.length) return false;
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("listing_package_entitlements")
    .select("id, listing_id, package_key, status, ends_at")
    .in("listing_id", mainIds)
    .eq("package_key", AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY);
  return (data ?? []).some((row) => {
    const status = String(row.status ?? "").trim().toLowerCase();
    if (status !== "active") return false;
    return isListingPackageEntitlementRowActive({
      status: row.status as string,
      ends_at: row.ends_at as string | null,
    });
  });
}

async function resolveDealerActiveVehicleLimitForOwner(
  ownerUserId: string,
  rows: Awaited<ReturnType<typeof listAutosClassifiedsListingsForOwner>>,
): Promise<number> {
  const { STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT } = await import(
    "@/app/lib/clasificados/autos/autosDealerInventoryPolicy"
  );
  const hasPack = await ownerHasActiveDealerInventoryPack(ownerUserId, rows);
  return hasPack ? AUTOS_DEALER_TOTAL_WITH_INVENTORY_PACK_LIMIT : STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT;
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
  const limit = await resolveDealerActiveVehicleLimitForOwner(userId, rows);
  const dealerInventory = summarizeDealerInventory(countActiveDealerVehicles(rows), limit);
  return NextResponse.json({
    ok: true,
    listings: rows.map(autosClassifiedsRowToDashboardRow),
    dealerInventory,
  });
}

export async function POST(request: NextRequest) {
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
  const assistedProbe = rawBody && typeof rawBody === "object" ? (rawBody as Record<string, unknown>) : {};
  const assisted = await resolveStaffAssistedCategorySave({
    request,
    expectedCategory: "autos-privado",
    assistedActionRaw: typeof assistedProbe.assistedAction === "string" ? assistedProbe.assistedAction : "",
    bodyListingId: typeof assistedProbe.listingId === "string" ? assistedProbe.listingId : null,
    bodyClientUserId: typeof assistedProbe.clientUserId === "string" ? assistedProbe.clientUserId : null,
  });
  if ("ok" in assisted && assisted.ok === false) {
    return NextResponse.json({ ok: false, error: assisted.error }, { status: assisted.status });
  }
  if (!userId && !assisted.assisted) {
    return NextResponse.json(
      buildAutosListingApiErrorPayload({
        errorCode: "AUTH_REQUIRED",
        message: "Sign in required.",
        legacyError: "unauthorized",
      }),
      { status: 401 },
    );
  }
  if (assisted.assisted && assisted.isPublish) {
    return NextResponse.json({ ok: false, error: "publish_via_cockpit_only" }, { status: 403 });
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
  if (assisted.assisted && body.lane !== "privado") {
    return NextResponse.json({ ok: false, error: "staff_autos_privado_only" }, { status: 422 });
  }
  const resolvedOwnerUserId = assisted.assisted ? assisted.clientUserId : userId;

  // Package C Build 1 (decision 11) — server-side commercial write guard for dealer child
  // creation. Verifies the client-supplied parent is REAL, OWNED by the caller, and the dealer
  // main (closing the trusted-parent-id gap), and enforces capacity (10 base / 20 with boost)
  // + grace/suspension state: no new inventory during an unresolved payment issue. Existing
  // children stay editable through the PATCH route (delta-0 semantics).
  if (body.lane === "negocios" && parentListingId && userId) {
    const guard = await assertCommercialCapacityForWrite({
      category: "autos",
      parentListingId,
      ownerUserId: userId,
      operation: "child_create",
      capacityDelta: 1,
    });
    if (!guard.allowed) {
      return NextResponse.json(
        buildAutosListingApiErrorPayload({
          errorCode: "COMMERCIAL_WRITE_BLOCKED",
          message: lang === "es" ? guard.messageEs : guard.message,
          legacyError: guard.code,
        }),
        { status: guard.code === "parent_not_owned" ? 403 : 409 },
      );
    }
  }

  // Gate QB-BOUNDARY-01 — the Quick Business semantic media contract, run on the SERVER for a
  // dealer listing the CUSTOMER created for themselves, and ONLY for a VERIFIED QUICK dealer.
  //
  // WHAT THIS REPLACES: the previous revision ran the contract for `body.lane === "negocios"`.
  // That lane is the dealer lane, which BOTH the $99 Quick dealer package and the $399 Full
  // dealer package publish through — so a FULL dealer was being held to a Quick product's rule,
  // from a browser-supplied field. `lane` is not a product and never was.
  //
  // The product now comes from `resolveQuickBusinessPublishIdentity`: a verified staff assisted
  // context, a live `listing_package_entitlements` row, the server-minted `leonix_payment_records`
  // checkout ledger, or — only in the restricting direction, and only when nothing server-owned
  // contradicts it — a declared SIMPLE package key. A `full` or `unverified` answer leaves the
  // Full dealer's existing image / video / inventory behavior completely untouched.
  //
  // The privado (private-seller) lane is a different product with no Simple/Full split at all, so
  // it cannot reach this branch and stays deliberately untouched.
  //
  // Counts are NOT imposed here — the Autos lane is uncapped by design — only the semantic
  // requirement: at least one image DECLARED to depict the vehicle. An unroled Quick dealer
  // gallery is answered with `role_declaration_required`, a correction, not a bare rejection.
  if (body.lane === "negocios" && userId) {
    const identity = await resolveQuickBusinessPublishIdentity({
      category: "autos",
      ownerUserId: userId,
      listingId: parentListingId || null,
      declaredPackageKey: typeof body.basePackageKey === "string" ? body.basePackageKey : null,
    });
    // External video links live in `videoUrls`, never in the image gallery, so they carry no
    // `video/*` MIME and the contract could not see them. "Quick includes no video" was therefore
    // unenforced on this seam: a Quick dealer could attach four YouTube links.
    const dealerVideoUrls = (body.listing as { videoUrls?: unknown } | null)?.videoUrls;
    const dealerExternalVideoCount = Array.isArray(dealerVideoUrls)
      ? dealerVideoUrls.filter((v) => typeof v === "string" && v.trim().length > 0).length
      : 0;
    const semanticMedia = identity.enforceQuickContract
      ? enforceQuickBusinessPublishMedia({
          category: "autos-dealer",
          payload: body.listing as unknown,
          externalVideoCount: dealerExternalVideoCount,
        })
      : null;
    if (semanticMedia && !semanticMedia.ok) {
      return NextResponse.json(
        {
          ...buildAutosListingApiErrorPayload({
            errorCode: "MEDIA_CONTRACT_VIOLATION",
            message: lang === "es" ? semanticMedia.body.messageEs : semanticMedia.body.message,
            details: semanticMedia.body.issues.join("; "),
            legacyError: "media_contract_violation",
          }),
          ...semanticMedia.body,
        },
        { status: semanticMedia.status },
      );
    }
  }

  const createInput = {
    ownerUserId: resolvedOwnerUserId,
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

  // Gate QB-IDENTITY-01 — record the canonical business↔listing relationship for a dealer
  // identity row the customer created themselves, matching what the staff-assisted route writes.
  // Only the dealer MAIN row is linked: an inventory vehicle is a child of that identity, not a
  // second business listing. Idempotent, ownership re-proven server-side, never fails the create.
  if (result.row.lane === "negocios" && !parentListingId && createInput.ownerUserId) {
    await linkSelfServiceListingToBusiness({
      userId: createInput.ownerUserId,
      listingSource: "autos_classifieds_listings",
      listingId: result.row.id,
    }).catch(() => undefined);
  }

  if (assisted.assisted) {
    await linkAssistedListingToBusiness({
      businessId: assisted.ctx.businessId,
      listingSource: "autos_classifieds_listings",
      listingId: result.row.id,
      linkedByAuthUserId: assisted.ctx.authUserId,
    });
    await recordSalesWorkspaceAudit({
      action: "quick_sales_save_for_client",
      actorRosterId: assisted.ctx.rosterId,
      businessId: assisted.ctx.businessId,
      category: "autos-privado",
      listingSource: "autos_classifieds_listings",
      listingId: result.row.id,
      outcome: "ok",
    });
    const created = NextResponse.json(
      buildAutosListingApiSuccessPayload({
        id: result.row.id,
        leonixAdId: result.row.leonix_ad_id ?? null,
        lane: result.row.lane,
        status: result.row.status,
        persistWarnings: result.persistWarnings,
      }),
    );
    applyAssistedPublishingCookie(created, {
      businessId: assisted.ctx.businessId,
      category: "autos-privado",
      rosterId: assisted.ctx.rosterId,
      authUserId: assisted.ctx.authUserId,
      listingId: result.row.id,
      clientUserId: assisted.clientUserId,
      assistedAction: "save_for_client",
      packageKey: assisted.ctx.packageKey ?? null,
    });
    return created;
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
