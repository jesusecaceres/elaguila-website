import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getBusinessTypePreset } from "@/app/clasificados/publicar/servicios/lib/businessTypePresets";
import { normalizeClasificadosServiciosApplicationState } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize";
import { mapClasificadosServiciosApplicationToServiciosDraft } from "@/app/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft";
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
  SERVICIOS_LISTING_STATUS_PENDING_REVIEW,
  SERVICIOS_LISTING_STATUS_PUBLISHED,
} from "@/app/clasificados/servicios/lib/serviciosListingLifecycle";
import { mapServiciosApplicationDraftToBusinessProfile } from "@/app/servicios/lib/mapServiciosApplicationDraftToBusinessProfile";
import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { buildServiciosDiscoveryFacet } from "@/app/clasificados/servicios/lib/serviciosPublishDiscovery";
import { insertServiciosAnalyticsEvent } from "@/app/clasificados/servicios/lib/serviciosOpsTablesServer";
import { isServiciosStrictPublishEnvironment, serviciosOwnerIdFromBearer } from "../lib/serviciosPublishServerAuth";

export const runtime = "nodejs";

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

/**
 * Clasificados publish never maps `contact.isFeatured` from the advertiser form (ops / billing only).
 * When a listing is republished, merge prior wire so paid/amplified placement is not wiped.
 */
function mergeOpsControlledServiciosProfileFields(
  nextWire: ServiciosBusinessProfile,
  previous: ServiciosBusinessProfile | null | undefined,
): ServiciosBusinessProfile {
  if (!previous?.contact?.isFeatured) return nextWire;
  return {
    ...nextWire,
    contact: { ...nextWire.contact, isFeatured: true },
  };
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
  wire = stripAdvertiserVerificationFlags(wire);
  const opsMeta = { ...wire.opsMeta };
  if (state.leonixVerifiedInterest === true) {
    opsMeta.leonixVerifiedInterest = true;
  }
  opsMeta.discovery = buildServiciosDiscoveryFacet(state, wire);
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
  const listingStatus = initialListingStatus();

  let persistedToDatabase = false;
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
        const { error } = await supabase
          .from("servicios_public_listings")
          .update({
            business_name: businessName,
            city,
            profile_json: wire,
            internal_group: internalGroup,
            listing_status: listingStatus,
            updated_at: now,
            ...(ownerUserId ? { owner_user_id: ownerUserId } : {}),
          })
          .eq("slug", slug);
        if (!error) persistedToDatabase = true;
      } else {
        const insertRow: Record<string, unknown> = {
          slug,
          business_name: businessName,
          city,
          profile_json: wire,
          internal_group: internalGroup,
          listing_status: listingStatus,
          leonix_verified: false,
          published_at: now,
          updated_at: now,
        };
        if (ownerUserId) insertRow.owner_user_id = ownerUserId;
        const { error } = await supabase.from("servicios_public_listings").insert(insertRow);
        if (!error) persistedToDatabase = true;
      }
    } catch {
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
    await insertServiciosAnalyticsEvent({
      listingSlug: slug,
      eventType: "publish_failure",
      meta: { reason: "persist_failed", persistence, strict: true },
    });
    return NextResponse.json(
      {
        ok: false,
        error: "persist_failed",
        persistence,
        persistedToDatabase,
        persistedToDevWorkspace,
      },
      { status: 503 },
    );
  }

  if (!strict && persistence === "none") {
    await insertServiciosAnalyticsEvent({
      listingSlug: slug,
      eventType: "publish_failure",
      meta: { reason: "persist_failed", persistence, strict: false },
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

  if (persistedToDatabase || persistedToDevWorkspace) {
    await insertServiciosAnalyticsEvent({
      listingSlug: slug,
      eventType: "publish_success",
      meta: { persistence, listingStatus },
    });
  }

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
  });
}
