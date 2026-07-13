import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getBusinessTypePreset } from "@/app/clasificados/publicar/servicios/lib/businessTypePresets";
import { normalizeClasificadosServiciosApplicationState } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize";
import { mapClasificadosServiciosApplicationToServiciosDraft, applyClasificadosCouponsToServiciosWireProfile } from "@/app/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft";
import { evaluateServiciosPublishReadiness } from "@/app/clasificados/publicar/servicios/lib/serviciosPublishReadiness";
import { slugifyServiciosBusinessName } from "@/app/clasificados/publicar/servicios/lib/serviciosSlug";
import type { ClasificadosServiciosApplicationState } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import {
  buildServiciosPublicRowForPersistence,
  getServiciosDevPublishRowBySlug,
  isServiciosDevPublishPersistenceEnabled,
  upsertServiciosDevPublishRow,
} from "@/app/clasificados/servicios/lib/serviciosDevPublishPersistence";
import { getServiciosPublicListingBySlugFromDb } from "@/app/clasificados/servicios/lib/serviciosPublicListingsServer";
import {
  SERVICIOS_LISTING_STATUS_PENDING_PAYMENT,
  SERVICIOS_LISTING_STATUS_PENDING_REVIEW,
  SERVICIOS_LISTING_STATUS_PUBLISHED,
} from "@/app/clasificados/servicios/lib/serviciosListingLifecycle";
import { mapServiciosApplicationDraftToBusinessProfile } from "@/app/servicios/lib/mapServiciosApplicationDraftToBusinessProfile";
import type { ServiciosBusinessProfile, ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { mergeOpsControlledServiciosProfileFields } from "@/app/(site)/clasificados/servicios/lib/serviciosPublishOpsProfileMerge";
import { buildServiciosDiscoveryFacet } from "@/app/clasificados/servicios/lib/serviciosPublishDiscovery";
import { insertServiciosAnalyticsEvent } from "@/app/clasificados/servicios/lib/serviciosOpsTablesServer";
import { isServiciosStrictPublishEnvironment, serviciosOwnerIdFromBearer } from "../lib/serviciosPublishServerAuth";

export const runtime = "nodejs";

const MAX_PUBLISH_BODY_BYTES = 1024 * 1024;

type ServiciosPublishPersistOperation =
  | "lookup"
  | "update"
  | "insert"
  | "identity-return"
  | "exception";

type ServiciosPublishPersistenceDiagnostic = {
  diagnosticId: string;
  operation: ServiciosPublishPersistOperation;
  requestedListingStatus: string;
  slug: string;
  existingFound?: boolean;
  supabase?: {
    code?: string | null;
    message?: string | null;
    details?: string | null;
    hint?: string | null;
  };
};

function sanitizeSupabaseError(error: unknown): ServiciosPublishPersistenceDiagnostic["supabase"] {
  if (!error || typeof error !== "object") return undefined;
  const e = error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown };
  return {
    code: typeof e.code === "string" ? e.code.slice(0, 80) : null,
    message: typeof e.message === "string" ? e.message.slice(0, 500) : null,
    details: typeof e.details === "string" ? e.details.slice(0, 500) : null,
    hint: typeof e.hint === "string" ? e.hint.slice(0, 500) : null,
  };
}

function buildPersistenceDiagnostic(input: Omit<ServiciosPublishPersistenceDiagnostic, "diagnosticId">): ServiciosPublishPersistenceDiagnostic {
  return {
    diagnosticId: randomUUID(),
    ...input,
  };
}

function logPersistenceDiagnostic(diag: ServiciosPublishPersistenceDiagnostic): void {
  console.error("[servicios publish api] persistence failure", diag);
}

/** Reject transport payloads that still contain local-only media (defense in depth). */
function detectServiciosHeavyTransport(value: unknown, path = ""): string[] {
  const out: string[] = [];
  if (value instanceof File || (typeof Blob !== "undefined" && value instanceof Blob)) {
    out.push(`file_blob:${path}`);
    return out;
  }
  if (typeof value === "string") {
    const t = value;
    if (t.startsWith("data:image/") || t.startsWith("data:video/") || /^data:application\//i.test(t)) {
      out.push(`data_url:${path}`);
    }
    if (t.startsWith("blob:")) out.push(`blob_url:${path}`);
    if (t.includes("__LX_SV_IDB__")) out.push(`idb_placeholder:${path}`);
    if (t.length > 600_000) out.push(`string_too_large:${path}:${t.length}`);
    return out;
  }
  if (Array.isArray(value)) {
    const cap = Math.min(value.length, 100);
    for (let i = 0; i < cap; i++) {
      out.push(...detectServiciosHeavyTransport(value[i], `${path}[${i}]`));
    }
    return out;
  }
  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value as object);
    const cap = Math.min(keys.length, 150);
    for (let i = 0; i < cap; i++) {
      const k = keys[i]!;
      out.push(...detectServiciosHeavyTransport((value as Record<string, unknown>)[k], path ? `${path}.${k}` : k));
    }
  }
  return out;
}

async function allocateSlug(base: string): Promise<string> {
  if (!isSupabaseAdminConfigured()) return base;
  const supabase = getAdminSupabase();
  let candidate = base;
  for (let i = 0; i < 50; i++) {
    const { data } = await supabase.from("servicios_public_listings").select("slug").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = i === 0 ? `${base}-2` : `${base}-${i + 2}`;
  }
  return `${base}-${Date.now()}`;
}

function stripAdvertiserVerificationFlags(wire: ServiciosBusinessProfile): ServiciosBusinessProfile {
  const next: ServiciosBusinessProfile = {
    ...wire,
    identity: { ...wire.identity },
  };
  delete next.identity.leonixVerified;
  return next;
}

function initialListingStatus(): typeof SERVICIOS_LISTING_STATUS_PUBLISHED | typeof SERVICIOS_LISTING_STATUS_PENDING_REVIEW {
  return process.env.SERVICIOS_MODERATION_MODE === "1" ? SERVICIOS_LISTING_STATUS_PENDING_REVIEW : SERVICIOS_LISTING_STATUS_PUBLISHED;
}

export type ServiciosPublishPersistence = "database" | "dev_workspace" | "none";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const bodyStr = JSON.stringify(body);
  const bodySize = new Blob([bodyStr]).size;
  if (process.env.NODE_ENV === "development") {
    const b0 = body as Record<string, unknown>;
    console.log("[servicios publish api] incoming", {
      kb: (bodySize / 1024).toFixed(1),
      topLevelKeys: Object.keys(b0),
    });
  }

  if (bodySize > MAX_PUBLISH_BODY_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: "payload_too_large",
        message: `Request payload too large. Maximum is 1 MB; received ${(bodySize / 1024).toFixed(1)} KB.`,
      },
      { status: 413 },
    );
  }

  const heavy = detectServiciosHeavyTransport(body);
  if (heavy.length) {
    return NextResponse.json(
      {
        ok: false,
        error: "heavy_media_detected",
        message: "Publish body must not contain data: URLs, blob: URLs, or draft media placeholders. Upload images first.",
        detail: heavy.slice(0, 12).join("; "),
      },
      { status: 400 },
    );
  }

  const b = body as Record<string, unknown>;
  if (!b.state || typeof b.state !== "object") {
    return NextResponse.json({ ok: false, error: "missing_state" }, { status: 400 });
  }

  const strict = isServiciosStrictPublishEnvironment();
  const ownerUserId = await serviciosOwnerIdFromBearer(req);

  if (strict && !ownerUserId) {
    await insertServiciosAnalyticsEvent({
      listingSlug: null,
      eventType: "publish_failure",
      meta: { reason: "auth_required" },
    });
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  const state = normalizeClasificadosServiciosApplicationState(b.state as ClasificadosServiciosApplicationState);
  const lang: ServiciosLang = b.lang === "en" ? "en" : "es";

  const readiness = evaluateServiciosPublishReadiness(state, lang);
  if (!readiness.ok) {
    await insertServiciosAnalyticsEvent({
      listingSlug: null,
      eventType: "publish_validation_failed",
      meta: { missing: readiness.missing },
    });
    return NextResponse.json({ ok: false, error: "not_ready", missing: readiness.missing }, { status: 422 });
  }

  const baseSlug = slugifyServiciosBusinessName(state.businessName || "borrador");
  const existingSlugRaw = typeof b.existingPublicSlug === "string" ? b.existingPublicSlug.trim() : "";

  let slug = await allocateSlug(baseSlug);
  if (existingSlugRaw && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(existingSlugRaw) && isSupabaseAdminConfigured()) {
    const row = await getServiciosPublicListingBySlugFromDb(existingSlugRaw, { visibility: "all" });
    if (row && ownerUserId) {
      const owner = row.owner_user_id;
      if (!owner || owner === ownerUserId) {
        slug = existingSlugRaw;
      }
    }
  }

  const draft = mapClasificadosServiciosApplicationToServiciosDraft(state, lang);
  draft.identity.slug = slug;
  let wire = mapServiciosApplicationDraftToBusinessProfile(draft);
  wire = applyClasificadosCouponsToServiciosWireProfile(wire, draft);
  wire = stripAdvertiserVerificationFlags(wire);
  const opsMeta = { ...wire.opsMeta };
  if (state.leonixVerifiedInterest === true) {
    opsMeta.leonixVerifiedInterest = true;
  }
  opsMeta.discovery = buildServiciosDiscoveryFacet(state, wire);
  const publishedBusinessTypeId = state.businessTypeId.trim();
  if (publishedBusinessTypeId) {
    opsMeta.businessTypeId = publishedBusinessTypeId;
  }
  const diagRaw = b.videoPublishDiagnostics;
  if (Array.isArray(diagRaw) && diagRaw.length) {
    const notes: { videoId: string; reason: string }[] = [];
    for (const row of diagRaw.slice(0, 6)) {
      if (!row || typeof row !== "object") continue;
      const o = row as Record<string, unknown>;
      const videoId = typeof o.videoId === "string" ? o.videoId.trim().slice(0, 80) : "";
      const reason = typeof o.reason === "string" ? o.reason.trim().slice(0, 400) : "";
      if (videoId && reason) notes.push({ videoId, reason });
    }
    if (notes.length) opsMeta.serviciosVideoPublishNotes = notes;
  }
  wire = { ...wire, opsMeta };

  let previousWire: ServiciosBusinessProfile | null = null;
  if (isSupabaseAdminConfigured()) {
    const prevRow = await getServiciosPublicListingBySlugFromDb(slug, { visibility: "all" });
    previousWire = prevRow?.profile_json ?? null;
  }
  if (!previousWire?.contact?.isFeatured && isServiciosDevPublishPersistenceEnabled()) {
    previousWire = getServiciosDevPublishRowBySlug(slug)?.profile_json ?? previousWire;
  }
  wire = mergeOpsControlledServiciosProfileFields(wire, previousWire);

  const preset = getBusinessTypePreset(state.businessTypeId);
  const internalGroup = preset?.internalGroup ?? null;

  const businessName = wire.identity.businessName.trim() || slug;
  const city = state.city.trim();
  const now = new Date().toISOString();
  /**
   * When the client requests a pending-payment save (Revenue OS global checkout standard),
   * the listing is stored hidden as `pending_payment` and stays non-public until the Stripe
   * webhook activates it. Otherwise use the standard immediate publish status.
   * Gate SERVICIOS-GLOBAL-CHECKOUT-STANDARD-PARITY-01
   */
  const pendingPayment =
    (body as Record<string, unknown>).activationMode === "pending_payment" ||
    (body as Record<string, unknown>).activation_mode === "pending_payment";

  /** Production: first publication requires Revenue OS checkout (pending_payment save or paid webhook). */
  if (strict && isSupabaseAdminConfigured() && !pendingPayment) {
    const existingForGuard = await getServiciosPublicListingBySlugFromDb(slug, { visibility: "all" });
    const ownerOk =
      existingForGuard &&
      ownerUserId &&
      (!existingForGuard.owner_user_id || existingForGuard.owner_user_id === ownerUserId);
    const allowedOwnerRepublish =
      ownerOk &&
      existingForGuard &&
      (existingForGuard.listing_status === SERVICIOS_LISTING_STATUS_PUBLISHED ||
        existingForGuard.listing_status === "paused_unpublished" ||
        existingForGuard.listing_status === SERVICIOS_LISTING_STATUS_PENDING_REVIEW);
    if (!allowedOwnerRepublish) {
      await insertServiciosAnalyticsEvent({
        listingSlug: slug,
        eventType: "publish_failure",
        meta: { reason: "payment_required", strict: true },
      });
      return NextResponse.json(
        {
          ok: false,
          error: "payment_required",
          message:
            "Servicios is a paid category. Save your listing for secure checkout before it can go live.",
        },
        { status: 402 },
      );
    }
  }

  const listingStatus = pendingPayment ? SERVICIOS_LISTING_STATUS_PENDING_PAYMENT : initialListingStatus();

  let persistedToDatabase = false;
  let persistedListingId: string | null = null;
  let persistedLeonixAdId: string | null = null;
  let persistenceDiagnostic: ServiciosPublishPersistenceDiagnostic | null = null;
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getAdminSupabase();
      const existing = await getServiciosPublicListingBySlugFromDb(slug, { visibility: "all" });

      if (existing) {
        if (ownerUserId && existing.owner_user_id && existing.owner_user_id !== ownerUserId) {
          await insertServiciosAnalyticsEvent({
            listingSlug: slug,
            eventType: "publish_failure",
            meta: { reason: "slug_conflict" },
          });
          return NextResponse.json({ ok: false, error: "slug_conflict" }, { status: 409 });
        }
        // Never downgrade an already-published listing back to pending on re-save.
        const nextStatus =
          pendingPayment && existing.listing_status === SERVICIOS_LISTING_STATUS_PUBLISHED
            ? SERVICIOS_LISTING_STATUS_PUBLISHED
            : listingStatus;
        const { data: updated, error } = await supabase
          .from("servicios_public_listings")
          .update({
            business_name: businessName,
            city,
            profile_json: wire,
            internal_group: internalGroup,
            listing_status: nextStatus,
            updated_at: now,
            ...(ownerUserId ? { owner_user_id: ownerUserId } : {}),
          })
          .eq("slug", slug)
          .select("id, leonix_ad_id")
          .maybeSingle();
        if (!error) {
          persistedListingId = updated?.id ? String(updated.id) : null;
          persistedLeonixAdId = updated?.leonix_ad_id ? String(updated.leonix_ad_id) : null;
          if (persistedListingId) {
            persistedToDatabase = true;
          } else {
            persistenceDiagnostic = buildPersistenceDiagnostic({
              operation: "identity-return",
              requestedListingStatus: nextStatus,
              slug,
              existingFound: true,
            });
          }
        } else {
          persistenceDiagnostic = buildPersistenceDiagnostic({
            operation: "update",
            requestedListingStatus: nextStatus,
            slug,
            existingFound: true,
            supabase: sanitizeSupabaseError(error),
          });
        }
      } else {
        const insertRow: Record<string, unknown> = {
          slug,
          business_name: businessName,
          city,
          profile_json: wire,
          internal_group: internalGroup,
          listing_status: listingStatus,
          leonix_verified: false,
          published_at: pendingPayment ? null : now,
          updated_at: now,
        };
        if (ownerUserId) insertRow.owner_user_id = ownerUserId;
        const { data: inserted, error } = await supabase
          .from("servicios_public_listings")
          .insert(insertRow)
          .select("id, leonix_ad_id")
          .maybeSingle();
        if (!error) {
          persistedListingId = inserted?.id ? String(inserted.id) : null;
          persistedLeonixAdId = inserted?.leonix_ad_id ? String(inserted.leonix_ad_id) : null;
          if (persistedListingId) {
            persistedToDatabase = true;
          } else {
            persistenceDiagnostic = buildPersistenceDiagnostic({
              operation: "identity-return",
              requestedListingStatus: listingStatus,
              slug,
              existingFound: false,
            });
          }
        } else {
          persistenceDiagnostic = buildPersistenceDiagnostic({
            operation: "insert",
            requestedListingStatus: listingStatus,
            slug,
            existingFound: false,
            supabase: sanitizeSupabaseError(error),
          });
        }
      }
    } catch (error) {
      persistenceDiagnostic = buildPersistenceDiagnostic({
        operation: "exception",
        requestedListingStatus: listingStatus,
        slug,
        supabase:
          error instanceof Error
            ? {
                code: error.name.slice(0, 80),
                message: error.message.slice(0, 500),
                details: null,
                hint: null,
              }
            : undefined,
      });
      persistedToDatabase = false;
    }
  }

  let persistedToDevWorkspace = false;
  if (!persistedToDatabase && isServiciosDevPublishPersistenceEnabled()) {
    const row = buildServiciosPublicRowForPersistence({
      slug,
      businessName,
      city,
      profileJson: wire,
      internalGroup,
      publishedAt: now,
    });
    persistedToDevWorkspace = upsertServiciosDevPublishRow(row);
  }

  const persistence: ServiciosPublishPersistence = persistedToDatabase
    ? "database"
    : persistedToDevWorkspace
      ? "dev_workspace"
      : "none";

  if (strict && !persistedToDatabase) {
    if (persistenceDiagnostic) logPersistenceDiagnostic(persistenceDiagnostic);
    await insertServiciosAnalyticsEvent({
      listingSlug: slug,
      eventType: "publish_failure",
      meta: {
        reason: "persist_failed",
        persistence,
        strict: true,
        diagnostic_id: persistenceDiagnostic?.diagnosticId ?? null,
        operation: persistenceDiagnostic?.operation ?? null,
        requested_listing_status: listingStatus,
        supabase_code: persistenceDiagnostic?.supabase?.code ?? null,
        supabase_message: persistenceDiagnostic?.supabase?.message ?? null,
        supabase_details: persistenceDiagnostic?.supabase?.details ?? null,
        supabase_hint: persistenceDiagnostic?.supabase?.hint ?? null,
      },
    });
    return NextResponse.json(
      {
        ok: false,
        error: "persist_failed",
        persistence,
        persistedToDatabase,
        persistedToDevWorkspace,
        diagnosticId: persistenceDiagnostic?.diagnosticId ?? null,
      },
      { status: 503 },
    );
  }

  if (!strict && persistence === "none") {
    if (persistenceDiagnostic) logPersistenceDiagnostic(persistenceDiagnostic);
    await insertServiciosAnalyticsEvent({
      listingSlug: slug,
      eventType: "publish_failure",
      meta: {
        reason: "persist_failed",
        persistence,
        strict: false,
        diagnostic_id: persistenceDiagnostic?.diagnosticId ?? null,
        operation: persistenceDiagnostic?.operation ?? null,
        requested_listing_status: listingStatus,
        supabase_code: persistenceDiagnostic?.supabase?.code ?? null,
        supabase_message: persistenceDiagnostic?.supabase?.message ?? null,
        supabase_details: persistenceDiagnostic?.supabase?.details ?? null,
        supabase_hint: persistenceDiagnostic?.supabase?.hint ?? null,
      },
    });
    return NextResponse.json(
      {
        ok: false,
        error: "persist_failed",
        message:
          "Configure Supabase (service role) or enable dev persistence (next dev / SERVICIOS_DEV_PUBLISH=1).",
        persistence,
      },
      { status: 503 },
    );
  }

  // Revenue OS pending-payment save: require a real DB row so we can hand a listingId to checkout.
  if (pendingPayment) {
    if (!persistedToDatabase || !persistedListingId) {
      if (persistenceDiagnostic) logPersistenceDiagnostic(persistenceDiagnostic);
      await insertServiciosAnalyticsEvent({
        listingSlug: slug,
        eventType: "publish_failure",
        meta: {
          reason: "pending_payment_persist_failed",
          persistence,
          diagnostic_id: persistenceDiagnostic?.diagnosticId ?? null,
          operation: persistenceDiagnostic?.operation ?? null,
          requested_listing_status: listingStatus,
          supabase_code: persistenceDiagnostic?.supabase?.code ?? null,
          supabase_message: persistenceDiagnostic?.supabase?.message ?? null,
          supabase_details: persistenceDiagnostic?.supabase?.details ?? null,
          supabase_hint: persistenceDiagnostic?.supabase?.hint ?? null,
        },
      });
      return NextResponse.json(
        {
          ok: false,
          error: "pending_persist_failed",
          message:
            "Could not save your service listing before checkout. Please try again or contact Leonix.",
          persistence,
          diagnosticId: persistenceDiagnostic?.diagnosticId ?? null,
        },
        { status: 503 },
      );
    }
    await insertServiciosAnalyticsEvent({
      listingSlug: slug,
      eventType: "publish_pending_payment",
      meta: { persistence, listingStatus },
    });
    return NextResponse.json({
      ok: true,
      pendingPayment: true,
      persisted: true,
      persistedToDatabase: true,
      listingId: persistedListingId,
      leonixAdId: persistedLeonixAdId,
      slug,
      listingStatus,
    });
  }

  if (persistedToDatabase || persistedToDevWorkspace) {
    await insertServiciosAnalyticsEvent({
      listingSlug: slug,
      eventType: "publish_success",
      meta: { persistence, listingStatus },
    });
  }

  const detailPath = `/clasificados/servicios/${encodeURIComponent(slug)}`;
  const resultsPath = `/clasificados/servicios/resultados?lang=${lang}`;

  return NextResponse.json({
    ok: true,
    slug,
    listingStatus: persistedToDatabase ? listingStatus : SERVICIOS_LISTING_STATUS_PUBLISHED,
    persistence,
    persistedToDatabase,
    persistedToDevWorkspace,
    /** @deprecated use persistedToDatabase */
    persisted: persistedToDatabase,
    profile: wire,
    publicUrl: detailPath,
    detailUrl: detailPath,
    resultsUrl: resultsPath,
  });
}
