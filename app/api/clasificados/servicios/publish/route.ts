import { NextResponse } from "next/server";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getBusinessTypePreset } from "@/app/clasificados/publicar/servicios/lib/businessTypePresets";
import { normalizeClasificadosServiciosApplicationState } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize";
import { mapClasificadosServiciosApplicationToServiciosDraft } from "@/app/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft";
import { evaluateServiciosPublishReadiness } from "@/app/clasificados/publicar/servicios/lib/serviciosPublishReadiness";
import { slugifyServiciosBusinessName } from "@/app/clasificados/publicar/servicios/lib/serviciosSlug";
import type { ClasificadosServiciosApplicationState } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import {
  buildServiciosPublicRowForPersistence,
  isServiciosDevPublishPersistenceEnabled,
  upsertServiciosDevPublishRow,
} from "@/app/clasificados/servicios/lib/serviciosDevPublishPersistence";
import { getServiciosPublicListingBySlugFromDb } from "@/app/clasificados/servicios/lib/serviciosPublicListingsServer";
import { SERVICIOS_LISTING_STATUS_PUBLISHED } from "@/app/clasificados/servicios/lib/serviciosListingLifecycle";
import { mapServiciosApplicationDraftToBusinessProfile } from "@/app/servicios/lib/mapServiciosApplicationDraftToBusinessProfile";
import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";

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

export type ServiciosPublishPersistence = "database" | "dev_workspace" | "none";

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
  if (!b.state || typeof b.state !== "object") {
    return NextResponse.json({ ok: false, error: "missing_state" }, { status: 400 });
  }

  const state = normalizeClasificadosServiciosApplicationState(b.state as ClasificadosServiciosApplicationState);
  const lang: ServiciosLang = b.lang === "en" ? "en" : "es";

  const readiness = evaluateServiciosPublishReadiness(state, lang);
  if (!readiness.ok) {
    return NextResponse.json({ ok: false, error: "not_ready", missing: readiness.missing }, { status: 422 });
  }

  const baseSlug = slugifyServiciosBusinessName(state.businessName || "borrador");
  const slug = await allocateSlug(baseSlug);
  const draft = mapClasificadosServiciosApplicationToServiciosDraft(state, lang);
  draft.identity.slug = slug;
  let wire = mapServiciosApplicationDraftToBusinessProfile(draft);
  wire = stripAdvertiserVerificationFlags(wire);

  const preset = getBusinessTypePreset(state.businessTypeId);
  const internalGroup = preset?.internalGroup ?? null;

  const businessName = wire.identity.businessName.trim() || slug;
  const city = state.city.trim();
  const now = new Date().toISOString();

  let persistedToDatabase = false;
  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getAdminSupabase();
      const existing = await getServiciosPublicListingBySlugFromDb(slug);

      if (existing) {
        const { error } = await supabase
          .from("servicios_public_listings")
          .update({
            business_name: businessName,
            city,
            profile_json: wire,
            internal_group: internalGroup,
            listing_status: SERVICIOS_LISTING_STATUS_PUBLISHED,
            updated_at: now,
          })
          .eq("slug", slug);
        if (!error) persistedToDatabase = true;
      } else {
        const { error } = await supabase.from("servicios_public_listings").insert({
          slug,
          business_name: businessName,
          city,
          profile_json: wire,
          internal_group: internalGroup,
          listing_status: SERVICIOS_LISTING_STATUS_PUBLISHED,
          leonix_verified: false,
          published_at: now,
          updated_at: now,
        });
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

  return NextResponse.json({
    ok: true,
    slug,
    persistence,
    persistedToDatabase,
    persistedToDevWorkspace,
    /** @deprecated use persistedToDatabase */
    persisted: persistedToDatabase,
    profile: wire,
  });
}
