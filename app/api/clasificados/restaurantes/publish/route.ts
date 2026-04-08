import { NextResponse } from "next/server";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";
import { mergeRestauranteDraft } from "@/app/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import { satisfiesRestauranteMinimumValidPreview } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import { draftToRestaurantePublicListingInsert } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingMapper";
import { slugifyRestauranteBusinessName } from "@/app/clasificados/restaurantes/lib/restaurantesSlug";

async function allocateSlug(base: string): Promise<string> {
  if (!isSupabaseAdminConfigured()) return base;
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

  const ownerUserId = typeof b.owner_user_id === "string" ? b.owner_user_id : null;
  const packageTier = typeof b.package_tier === "string" ? b.package_tier : null;
  const promoted = b.promoted === true;

  let persisted = false;
  let slugOut = slugifyRestauranteBusinessName(draft.businessName);

  if (isSupabaseAdminConfigured()) {
    try {
      const supabase = getAdminSupabase();
      const now = new Date().toISOString();

      const { data: existingByDraft } = await supabase
        .from("restaurantes_public_listings")
        .select("slug")
        .eq("draft_listing_id", draft.draftListingId)
        .maybeSingle();

      if (existingByDraft?.slug) {
        slugOut = existingByDraft.slug;
        const row = draftToRestaurantePublicListingInsert(draft, slugOut, {
          ownerUserId,
          promoted,
          packageTier,
        });
        const { error } = await supabase
          .from("restaurantes_public_listings")
          .update({
            ...row,
            updated_at: now,
          })
          .eq("slug", slugOut);
        if (!error) persisted = true;
      } else {
        const requested = typeof b.slug === "string" ? b.slug.trim() : "";
        const base = requested || slugifyRestauranteBusinessName(draft.businessName);
        slugOut = await allocateSlug(base);
        const row = draftToRestaurantePublicListingInsert(draft, slugOut, {
          ownerUserId,
          promoted,
          packageTier,
        });
        const { error } = await supabase.from("restaurantes_public_listings").insert({
          ...row,
          published_at: now,
          updated_at: now,
        });
        if (!error) persisted = true;
      }
    } catch {
      persisted = false;
    }
  } else {
    slugOut = slugifyRestauranteBusinessName(draft.businessName);
  }

  return NextResponse.json({
    ok: true,
    slug: slugOut,
    persisted,
    publicUrl: slugOut ? `/clasificados/restaurantes/${slugOut}` : null,
  });
}
