import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";
import { mergeRestauranteDraft } from "@/app/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import {
  satisfiesRestauranteMinimumValidPreview,
  hasPrimaryContactPath,
  hasOperatingSignal,
  hasRestauranteMinimumPublishImage,
  auditRestaurantePublishMediaReadinessSafe,
} from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import { draftToRestaurantePublicListingInsert } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingMapper";
import {
  buildRestaurantesResultsHref,
  restaurantesDiscoveryParamsForRowDeepLink,
  type RestaurantesDiscoveryLang,
} from "@/app/clasificados/restaurantes/lib/restaurantesDiscoveryContract";
import { slugifyRestauranteBusinessName } from "@/app/clasificados/restaurantes/lib/restaurantesSlug";
import { buildRestaurantePublish422MediaAudit } from "@/app/clasificados/restaurantes/application/restaurantePublishMediaAudit";
import { allocateNextRestauranteLeonixAdId } from "@/app/clasificados/restaurantes/lib/restaurantesLeonixAdId";
import { RESTAURANTE_PENDING_CHECKOUT_STATUS } from "@/app/lib/listingPlans/revenueRestaurantFulfillment";
import { RESTAURANTES_COUPON_ADDON_PACKAGE_KEY } from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { fetchAddonEntitlementsForListings } from "@/app/lib/listingPlans/addonEntitlementReader";
import { resolveRestauranteOwnerEditTargetStatus } from "@/app/lib/clasificados/restaurantes/restauranteOwnerEditStatusAuthority";

function isUniqueViolation(err: { code?: string; message?: string } | null | undefined): boolean {
  return err?.code === "23505" || /duplicate key|unique constraint/i.test(err?.message ?? "");
}

/**
 * Production-style Restaurantes publish: real DB + authenticated provider only.
 * Preview / local dev stays lenient unless `RESTAURANTES_STRICT_PUBLISH=1`.
 * Mirrors the Servicios publish authentication doctrine
 * (app/api/clasificados/servicios/lib/serviciosPublishServerAuth.ts).
 */
function isRestaurantesStrictPublishEnvironment(): boolean {
  if (process.env.RESTAURANTES_STRICT_PUBLISH === "1") return true;
  return process.env.VERCEL_ENV === "production";
}

async function restauranteOwnerIdFromBearer(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

/** Gate E.2.1 — coupon content already durably stored on the existing row, trusted as-is. */
type TrustedRestauranteCouponContent = Pick<
  RestauranteListingDraft,
  "coupons" | "couponFlyer" | "couponMoreOffers" | "couponMonthlyPrice"
>;

/**
 * Coupon entitlement (`couponUpgradeEnabled` + coupon content) is server/payment truth only.
 * A client can never submit this listing_json flag or its content into an active state —
 * only an already-entitled row (real, live `listing_package_entitlements` truth as of Gate
 * E.2.1) may keep it active.
 *
 * Gate E.2.1 — when not entitled, this used to erase `coupons`/`couponFlyer`/`couponMoreOffers`/
 * `couponMonthlyPrice` outright on every save, which would permanently destroy a customer's
 * coupon content the next time they saved an unrelated base-listing field (name, hours, etc.)
 * after their entitlement lapsed or was revoked. It now falls back to `trustedExisting` — the
 * content already durably stored on this row — instead of either the incoming client draft
 * (never trusted while unentitled, whether or not `mergeRestauranteDraft` already zeroed it) or
 * a hard-coded erasure. The coupon module still stays off (`couponUpgradeEnabled: false`) and
 * therefore hidden/unpublishable while unentitled; only the underlying data survives for
 * reactivation.
 */
function enforceRestauranteCouponEntitlementServerTruth(
  draft: RestauranteListingDraft,
  entitled: boolean,
  trustedExisting: TrustedRestauranteCouponContent,
): RestauranteListingDraft {
  if (entitled) {
    return { ...draft, couponUpgradeEnabled: true };
  }
  return {
    ...draft,
    couponUpgradeEnabled: false,
    coupons: trustedExisting.coupons,
    couponFlyer: trustedExisting.couponFlyer,
    couponMoreOffers: trustedExisting.couponMoreOffers,
    couponMonthlyPrice: trustedExisting.couponMonthlyPrice,
  };
}

/**
 * Public publish may only select **free** or **standard (Pro)** from the UI body.
 * `featured` / `supporter` stay admin/billing-only and are preserved on update when already set.
 */
function normalizePublicPublishPackageTier(raw: unknown): "free" | "standard" {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (s === "pro" || s === "standard") return "standard";
  return "free";
}

function mergePackageTierForUpdate(existing: string | null | undefined, requested: "free" | "standard"): string {
  const ex = (existing ?? "").toLowerCase();
  if (ex === "featured" || ex === "supporter") return (existing ?? "free").trim();
  return requested;
}

async function allocateSlug(base: string): Promise<string> {
  const supabase = getAdminSupabase();
  let candidate = base;
  for (let i = 0; i < 50; i++) {
    const { data } = await supabase.from("restaurantes_public_listings").select("slug").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = i === 0 ? `${base}-2` : `${base}-${i + 2}`;
  }
  return `${base}-${Date.now()}`;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  // API side protection: reject heavy media payloads
  const bodyStr = JSON.stringify(body);
  const bodySize = new Blob([bodyStr]).size;
  
  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 API received publish payload:', {
      size: `${(bodySize / 1024).toFixed(1)} KB`,
      topLevelKeys: Object.keys(b)
    });
  }

  // Reject if payload is too large (conservative 1MB limit)
  if (bodySize > 1 * 1024 * 1024) {
    return NextResponse.json({ 
      ok: false, 
      error: "payload_too_large", 
      detail: `Request payload too large. Maximum size is 1MB, received ${(bodySize / 1024).toFixed(1)}KB` 
    }, { status: 413 });
  }

  // RECURSIVE HEAVY MEDIA DETECTION - SERVER SIDE DEFENSE
  const detectHeavyMedia = (value: any, path: string = ''): { found: boolean; details: string[] } => {
    const details: string[] = [];
    
    // Check File/Blob objects
    if (value instanceof File || value instanceof Blob) {
      details.push(`File/Blob object at ${path}`);
      return { found: true, details };
    }
    
    // Check strings for dangerous signatures
    if (typeof value === 'string') {
      if (value.startsWith('data:image/') || value.startsWith('data:video/') || value.startsWith('blob:')) {
        details.push(`Data/blob URL at ${path}: ${value.substring(0, 50)}...`);
        return { found: true, details };
      }
      // Check for oversized strings (>2KB likely contains base64)
      if (value.length > 2048) {
        details.push(`Oversized string at ${path}: ${value.length} chars`);
        return { found: true, details };
      }
      return { found: false, details };
    }
    
    // Recursively check arrays
    if (Array.isArray(value)) {
      for (let i = 0; i < Math.min(value.length, 50); i++) { // Limit check to first 50 items
        const result = detectHeavyMedia(value[i], `${path}[${i}]`);
        if (result.found) {
          details.push(...result.details);
        }
      }
      return { found: details.length > 0, details };
    }
    
    // Recursively check objects
    if (typeof value === 'object' && value !== null) {
      const keys = Object.keys(value);
      for (const key of keys.slice(0, 100)) { // Limit check to first 100 keys
        const result = detectHeavyMedia(value[key], path ? `${path}.${key}` : key);
        if (result.found) {
          details.push(...result.details);
        }
      }
      return { found: details.length > 0, details };
    }
    
    return { found: false, details };
  };

  const mediaCheck = detectHeavyMedia(body);
  if (mediaCheck.found) {
    console.error('🚫 SERVER: Heavy media detected in publish payload:', mediaCheck.details);
    return NextResponse.json({ 
      ok: false, 
      error: "heavy_media_detected", 
      detail: `Request contains heavy media: ${mediaCheck.details.join('; ')}. Only metadata and references should be sent.` 
    }, { status: 400 });
  }

  const strict = isRestaurantesStrictPublishEnvironment();
  const verifiedOwnerId = await restauranteOwnerIdFromBearer(req);

  if (strict && !verifiedOwnerId) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  // For new payload format, the draft data is now at the root level
  // But maintain backward compatibility with old format
  const draftData = b.draft || b;
  
  if (!draftData) {
    return NextResponse.json({ ok: false, error: "missing_draft" }, { status: 400 });
  }

  const draft = mergeRestauranteDraft(draftData) as RestauranteListingDraft;

  if (!satisfiesRestauranteMinimumValidPreview(draft)) {
    const mediaSafe = auditRestaurantePublishMediaReadinessSafe(draft);
    const mediaAudit = buildRestaurantePublish422MediaAudit(b, draft);

    // Identify which minimum fields are failing for better debugging
    const missingFields = [];
    if (!draft.businessName) missingFields.push("nombre");
    if (!draft.businessType) missingFields.push("tipo");
    if (!draft.primaryCuisine) missingFields.push("cocina");
    if (!draft.cityCanonical) missingFields.push("ciudad");
    if (!hasRestauranteMinimumPublishImage(draft, "transport")) missingFields.push("imagen principal o primera de galería");
    if (!hasPrimaryContactPath(draft)) missingFields.push("al menos un contacto");
    if (!hasOperatingSignal(draft)) missingFields.push("señal de horario");

    return NextResponse.json({ 
      ok: false, 
      error: "not_ready",
      detail: `Campos mínimos faltantes: ${missingFields.join(", ")}`,
      missingFields,
      mediaAudit,
      mediaDebug: mediaSafe,
    }, { status: 422 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "supabase_admin_unconfigured",
        detail: "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server to persist listings.",
      },
      { status: 503 },
    );
  }

  // Owner identity is server-verified only — the client-supplied owner_user_id is never trusted.
  const ownerUserId = verifiedOwnerId;
  const pendingPayment =
    b.activation_mode === "pending_payment" || b.activationMode === "pending_payment";
  const requestedLane = normalizePublicPublishPackageTier(
    typeof b.plan === "string" ? b.plan : typeof b.package_tier === "string" ? b.package_tier : "",
  );
  const lang: RestaurantesDiscoveryLang = b.lang === "en" ? "en" : "es";

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  let listingIdOut: string | null = null;
  let leonixAdIdOut: string | null = null;

  const { data: existingByDraft, error: exErr } = await supabase
    .from("restaurantes_public_listings")
    .select("id, slug, leonix_verified, status, promoted, package_tier, owner_user_id, leonix_ad_id, listing_json")
    .eq("draft_listing_id", draft.draftListingId)
    .maybeSingle();

  if (exErr) {
    return NextResponse.json({ ok: false, error: "db_read_failed", detail: exErr.message }, { status: 500 });
  }

  // Ownership: an authenticated request may never edit or republish another user's listing.
  const existingOwnerUserId =
    existingByDraft && typeof (existingByDraft as { owner_user_id?: unknown }).owner_user_id === "string"
      ? ((existingByDraft as { owner_user_id?: string | null }).owner_user_id ?? null)
      : null;

  if (existingOwnerUserId && verifiedOwnerId && existingOwnerUserId !== verifiedOwnerId) {
    return NextResponse.json({ ok: false, error: "ownership_mismatch" }, { status: 403 });
  }

  // Gate E.2.1 — paid coupon entitlement is server/payment truth only (live
  // `listing_package_entitlements` state), never a client-submitted flag, the old sticky
  // `listing_json.couponUpgradeEnabled` boolean, slug, or Leonix Ad ID.
  const existingListingJson =
    existingByDraft && typeof (existingByDraft as { listing_json?: unknown }).listing_json === "object"
      ? ((existingByDraft as { listing_json?: Record<string, unknown> | null }).listing_json ?? null)
      : null;
  const existingListingId = (existingByDraft as { id?: string } | null)?.id ?? null;

  // A brand-new listing (no canonical row UUID yet) can never have an entitlement — never
  // invent one; only an already-existing row can be looked up.
  let serverVerifiedCouponEntitlement = false;
  if (existingListingId) {
    const entitlements = await fetchAddonEntitlementsForListings({
      category: "restaurantes",
      packageKey: RESTAURANTES_COUPON_ADDON_PACKAGE_KEY,
      listingIds: [existingListingId],
    });
    serverVerifiedCouponEntitlement = entitlements.get(existingListingId)?.status === "active";
  }

  if (!serverVerifiedCouponEntitlement && draft.couponUpgradeEnabled === true) {
    console.warn("[restaurantes publish api] coupon activation attempted without server entitlement", {
      draftListingId: draft.draftListingId,
      existingListingId,
    });
  }

  // Gate E.2.1 — content already durably stored on the existing row (never the incoming client
  // draft) is the only trusted source to fall back to while unentitled; see
  // enforceRestauranteCouponEntitlementServerTruth for why.
  const trustedExistingCouponContent: TrustedRestauranteCouponContent = {
    coupons: Array.isArray(existingListingJson?.coupons)
      ? (existingListingJson.coupons as RestauranteListingDraft["coupons"])
      : [],
    couponFlyer:
      existingListingJson?.couponFlyer && typeof existingListingJson.couponFlyer === "object"
        ? (existingListingJson.couponFlyer as RestauranteListingDraft["couponFlyer"])
        : undefined,
    couponMoreOffers:
      existingListingJson?.couponMoreOffers && typeof existingListingJson.couponMoreOffers === "object"
        ? (existingListingJson.couponMoreOffers as RestauranteListingDraft["couponMoreOffers"])
        : undefined,
    couponMonthlyPrice:
      typeof existingListingJson?.couponMonthlyPrice === "number"
        ? existingListingJson.couponMonthlyPrice
        : undefined,
  };

  const sanitizedDraft = enforceRestauranteCouponEntitlementServerTruth(
    draft,
    serverVerifiedCouponEntitlement,
    trustedExistingCouponContent,
  );

  let slugOut = slugifyRestauranteBusinessName(draft.businessName);

  try {
    if (existingByDraft?.slug) {
      slugOut = existingByDraft.slug;
      const baseRow = draftToRestaurantePublicListingInsert(sanitizedDraft, slugOut, {
        ownerUserId,
        promoted: false,
        packageTier: requestedLane,
        status: "published",
      }) as Record<string, unknown>;

      const ex = existingByDraft as {
        id?: string;
        leonix_verified?: boolean;
        status?: string;
        promoted?: boolean;
        package_tier?: string | null;
        owner_user_id?: string | null;
        leonix_ad_id?: string | null;
      };
      baseRow.leonix_verified = ex.leonix_verified ?? false;
      // Gate G.3.1A — the confirmed critical fix: an ordinary owner edit of an EXISTING row must
      // never escalate a protected status (`pending_payment`, `archived`, `suspended`) to
      // `published`. The `activation_mode`/`pendingPayment` request flag is deliberately never
      // consulted for this decision — only the certified Revenue OS webhook
      // (`activatePaidRestauranteListingFromRevenueOs`) or an authorized staff admin action may
      // publish a protected row. See `restauranteOwnerEditStatusAuthority.ts` for the full rule.
      const statusDecision = resolveRestauranteOwnerEditTargetStatus(ex.status);
      if (!statusDecision.ok) {
        return NextResponse.json({ ok: false, error: statusDecision.error }, { status: 409 });
      }
      baseRow.status = statusDecision.targetStatus;
      /** Paid placement is admin-controlled only; republish/renew must not flip it from the client. */
      baseRow.promoted = ex.promoted ?? false;
      baseRow.package_tier = mergePackageTierForUpdate(ex.package_tier, requestedLane);
      baseRow.owner_user_id = ownerUserId ?? ex.owner_user_id ?? null;
      {
        const existingLeonix = typeof ex.leonix_ad_id === "string" && ex.leonix_ad_id.trim() ? ex.leonix_ad_id.trim() : null;
        if (existingLeonix) {
          baseRow.leonix_ad_id = existingLeonix;
        } else {
          try {
            baseRow.leonix_ad_id = await allocateNextRestauranteLeonixAdId(supabase);
          } catch (e) {
            return NextResponse.json(
              { ok: false, error: "leonix_ad_id_allocate_failed", detail: e instanceof Error ? e.message : "unknown" },
              { status: 500 },
            );
          }
        }
      }
      listingIdOut = ex.id ?? null;
      leonixAdIdOut = typeof baseRow.leonix_ad_id === "string" ? baseRow.leonix_ad_id : null;

      // Gate G.3.1A — compare-and-set on the status we just decided to preserve: if another
      // process (staff moderation, a Stripe webhook landing concurrently) changed the row's
      // status between our read above and this write, the update matches zero rows instead of
      // silently overwriting whatever that other process just set. Raw Postgres error detail is
      // logged server-side only, never returned in the response body.
      const { data: updatedRow, error } = await supabase
        .from("restaurantes_public_listings")
        .update({
          ...baseRow,
          updated_at: now,
        })
        .eq("draft_listing_id", draft.draftListingId)
        .eq("status", statusDecision.targetStatus)
        .select("id")
        .maybeSingle();

      if (error) {
        console.error("[restaurantes publish api] update failed", {
          draftListingId: draft.draftListingId,
          code: error.code,
          message: error.message,
        });
        return NextResponse.json({ ok: false, error: "restaurante_update_failed" }, { status: 500 });
      }
      if (!updatedRow?.id) {
        console.error("[restaurantes publish api] update matched no row (concurrent status change)", {
          draftListingId: draft.draftListingId,
          expectedStatus: statusDecision.targetStatus,
        });
        return NextResponse.json(
          { ok: false, error: "restaurante_status_transition_not_allowed" },
          { status: 409 },
        );
      }
    } else {
      const requested = typeof b.slug === "string" ? b.slug.trim() : "";
      const base = requested || slugifyRestauranteBusinessName(draft.businessName);
      slugOut = await allocateSlug(base);
      const row = {
        ...draftToRestaurantePublicListingInsert(sanitizedDraft, slugOut, {
          ownerUserId,
          promoted: false,
          packageTier: requestedLane,
          status: "published",
        }),
        status: pendingPayment ? RESTAURANTE_PENDING_CHECKOUT_STATUS : "published",
      };
      let insertError: { message: string; code?: string } | null = null;
      for (let attempt = 0; attempt < 8; attempt++) {
        let leonix_ad_id: string;
        try {
          leonix_ad_id = await allocateNextRestauranteLeonixAdId(supabase);
        } catch (e) {
          return NextResponse.json(
            { ok: false, error: "leonix_ad_id_allocate_failed", detail: e instanceof Error ? e.message : "unknown" },
            { status: 500 },
          );
        }
        const { data: inserted, error } = await supabase.from("restaurantes_public_listings").insert({
          ...row,
          leonix_ad_id,
          published_at: now,
          updated_at: now,
        }).select("id, leonix_ad_id").single();
        if (!error && inserted?.id) {
          insertError = null;
          listingIdOut = inserted.id;
          leonixAdIdOut = (inserted as { leonix_ad_id?: string | null }).leonix_ad_id ?? leonix_ad_id;
          break;
        }
        if (error) {
          insertError = error;
          if (isUniqueViolation(error)) continue;
          break;
        }
      }
      if (insertError) {
        return NextResponse.json({ ok: false, error: "insert_failed", detail: insertError.message }, { status: 500 });
      }
    }
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "publish_exception", detail: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }

  const deep = restaurantesDiscoveryParamsForRowDeepLink({
    name: draft.businessName.trim(),
    city: draft.cityCanonical.trim(),
    zip: draft.zipCode?.trim(),
    primaryCuisineKey: (draft.primaryCuisine ?? "").trim(),
    neighborhood: draft.neighborhood?.trim(),
  });
  const resultsUrl = buildRestaurantesResultsHref(lang, { ...deep, rx_pub: "1" });
  const publicPath = `/clasificados/restaurantes/${encodeURIComponent(slugOut)}`;

  if (pendingPayment) {
    if (!listingIdOut) {
      return NextResponse.json(
        { ok: false, error: "pending_listing_id_missing", detail: "Could not resolve listing id for pending checkout." },
        { status: 500 },
      );
    }
    return NextResponse.json({
      ok: true,
      pendingPayment: true,
      persisted: true,
      listingId: listingIdOut,
      leonixAdId: leonixAdIdOut,
      draftListingId: draft.draftListingId,
      slug: slugOut,
      lang,
    });
  }

  return NextResponse.json({
    ok: true,
    persisted: true,
    slug: slugOut,
    publicUrl: publicPath,
    resultsUrl,
    dashboardUrl: "/dashboard/restaurantes?lang=" + lang,
  });
}
