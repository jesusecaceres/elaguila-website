import { NextResponse } from "next/server";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";
import { mergeRestauranteDraft } from "@/app/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import { satisfiesRestauranteMinimumValidPreview } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import { draftToRestaurantePublicListingInsert } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingMapper";
import {
  buildRestaurantesResultsHref,
  restaurantesDiscoveryParamsForRowDeepLink,
  type RestaurantesDiscoveryLang,
} from "@/app/clasificados/restaurantes/lib/restaurantesDiscoveryContract";
import { slugifyRestauranteBusinessName } from "@/app/clasificados/restaurantes/lib/restaurantesSlug";

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
  if (!b.draft) {
    return NextResponse.json({ ok: false, error: "missing_draft" }, { status: 400 });
  }

  const draft = mergeRestauranteDraft(b.draft) as RestauranteListingDraft;

  if (!satisfiesRestauranteMinimumValidPreview(draft)) {
    return NextResponse.json({ ok: false, error: "not_ready" }, { status: 422 });
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

  const ownerUserId = typeof b.owner_user_id === "string" ? b.owner_user_id : null;
  const packageTier = typeof b.package_tier === "string" ? b.package_tier : null;
  const promotedFromBody = typeof b.promoted === "boolean" ? b.promoted : undefined;
  const lang: RestaurantesDiscoveryLang = b.lang === "en" ? "en" : "es";

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const { data: existingByDraft, error: exErr } = await supabase
    .from("restaurantes_public_listings")
    .select("slug, leonix_verified, status, promoted, package_tier, owner_user_id")
    .eq("draft_listing_id", draft.draftListingId)
    .maybeSingle();

  if (exErr) {
    return NextResponse.json({ ok: false, error: "db_read_failed", detail: exErr.message }, { status: 500 });
  }

  let slugOut = slugifyRestauranteBusinessName(draft.businessName);

  try {
    if (existingByDraft?.slug) {
      slugOut = existingByDraft.slug;
      const baseRow = draftToRestaurantePublicListingInsert(draft, slugOut, {
        ownerUserId,
        promoted: promotedFromBody === true,
        packageTier,
      }) as Record<string, unknown>;

      const ex = existingByDraft as { leonix_verified?: boolean; status?: string; promoted?: boolean; package_tier?: string | null; owner_user_id?: string | null };
      baseRow.leonix_verified = ex.leonix_verified ?? false;
      baseRow.status = ex.status ?? "published";
      baseRow.promoted = promotedFromBody !== undefined ? promotedFromBody : (ex.promoted ?? false);
      baseRow.package_tier = packageTier ?? ex.package_tier ?? null;
      baseRow.owner_user_id = ownerUserId ?? ex.owner_user_id ?? null;

      const { error } = await supabase
        .from("restaurantes_public_listings")
        .update({
          ...baseRow,
          updated_at: now,
        })
        .eq("draft_listing_id", draft.draftListingId);

      if (error) {
        return NextResponse.json({ ok: false, error: "update_failed", detail: error.message }, { status: 500 });
      }
    } else {
      const requested = typeof b.slug === "string" ? b.slug.trim() : "";
      const base = requested || slugifyRestauranteBusinessName(draft.businessName);
      slugOut = await allocateSlug(base);
      const row = draftToRestaurantePublicListingInsert(draft, slugOut, {
        ownerUserId,
        promoted: promotedFromBody === true,
        packageTier,
      });
      const { error } = await supabase.from("restaurantes_public_listings").insert({
        ...row,
        published_at: now,
        updated_at: now,
      });
      if (error) {
        return NextResponse.json({ ok: false, error: "insert_failed", detail: error.message }, { status: 500 });
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

  return NextResponse.json({
    ok: true,
    persisted: true,
    slug: slugOut,
    publicUrl: publicPath,
    resultsUrl,
    dashboardUrl: "/dashboard/restaurantes?lang=" + lang,
  });
}
