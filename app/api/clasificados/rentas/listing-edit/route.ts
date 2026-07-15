import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  buildRentasNegocioListingParams,
  buildRentasPrivadoListingParams,
} from "@/app/clasificados/lib/leonixPublishRealEstateFromDraftState";
import type { RentasPrivadoFormState } from "@/app/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";
import type { RentasNegocioFormState } from "@/app/clasificados/publicar/rentas/negocio/schema/rentasNegocioFormState";
import { parseLeonixListingContract } from "@/app/clasificados/lib/leonixRealEstateListingContract";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  listingId?: string | null;
  leonixAdId?: string | null;
  lane?: "privado" | "negocio" | null;
  lang?: "es" | "en" | null;
  draft?: unknown;
};

function trim(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : raw == null ? "" : String(raw).trim();
}

function mergeDetailPairs(existing: unknown, next: Array<{ label: string; value: string }>): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = [];
  const nextByLabel = new Map(next.map((p) => [p.label, p]));
  const seen = new Set<string>();
  if (Array.isArray(existing)) {
    for (const item of existing) {
      if (!item || typeof item !== "object") continue;
      const label = trim((item as Record<string, unknown>).label);
      const value = trim((item as Record<string, unknown>).value);
      if (!label) continue;
      const replacement = nextByLabel.get(label);
      if (replacement) {
        out.push(replacement);
        seen.add(label);
      } else if (value) {
        out.push({ label, value });
      }
    }
  }
  for (const p of next) {
    if (!seen.has(p.label)) out.push(p);
  }
  return out;
}

function rejectUnsafeMedia(urls: string[]): string | null {
  for (const url of urls) {
    const u = trim(url);
    if (!u) continue;
    if (/^data:|^blob:/i.test(u)) return "Unsaved local media cannot be saved to a published listing. Upload/resolve media first.";
    if (!/^https?:\/\//i.test(u)) return "Only safe http(s) media URLs may be saved.";
  }
  return null;
}

export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, code: "supabase_not_configured" }, { status: 503 });
  }
  const bearerUserId = await getBearerUserId(request);
  if (!bearerUserId) {
    return NextResponse.json({ ok: false, code: "auth_required", message: "Authentication required." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, code: "invalid_json", message: "Invalid JSON body." }, { status: 400 });
  }

  const listingId = trim(body.listingId);
  const lane = body.lane === "negocio" ? "negocio" : body.lane === "privado" ? "privado" : null;
  if (!listingId || !lane || !body.draft || typeof body.draft !== "object") {
    return NextResponse.json({ ok: false, code: "invalid_request", message: "listingId, lane, and draft are required." }, { status: 400 });
  }

  const supabase = getAdminSupabase();
  const { data: existing, error: readError } = await supabase
    .from("listings")
    .select("id, owner_id, category, seller_type, status, is_published, published_at, expires_at, leonix_ad_id, detail_pairs, images")
    .eq("id", listingId)
    .maybeSingle();

  if (readError || !existing?.id) {
    return NextResponse.json({ ok: false, code: "listing_not_found", message: readError?.message ?? "Listing not found." }, { status: 404 });
  }
  if (trim(existing.owner_id) !== bearerUserId) {
    return NextResponse.json({ ok: false, code: "owner_mismatch", message: "Listing does not belong to authenticated user." }, { status: 403 });
  }
  if (trim(existing.category).toLowerCase() !== "rentas") {
    return NextResponse.json({ ok: false, code: "wrong_category", message: "Only Rentas listings can be edited here." }, { status: 422 });
  }
  const lx = parseLeonixListingContract(existing.detail_pairs);
  const actualLane = lx.branch === "rentas_negocio" || trim(existing.seller_type).toLowerCase() === "business" ? "negocio" : "privado";
  if (actualLane !== lane) {
    return NextResponse.json({ ok: false, code: "lane_mismatch", message: "Rentas lane mismatch." }, { status: 422 });
  }
  if (trim(body.leonixAdId) && trim(existing.leonix_ad_id) && trim(body.leonixAdId) !== trim(existing.leonix_ad_id)) {
    return NextResponse.json({ ok: false, code: "leonix_id_mismatch", message: "Leonix Ad ID mismatch." }, { status: 409 });
  }

  const built =
    lane === "negocio"
      ? buildRentasNegocioListingParams(body.draft as RentasNegocioFormState, body.lang === "en" ? "en" : "es")
      : buildRentasPrivadoListingParams(body.draft as RentasPrivadoFormState, body.lang === "en" ? "en" : "es");
  if (!built.ok) {
    return NextResponse.json({ ok: false, code: "invalid_draft", message: built.error }, { status: 422 });
  }

  const mediaError = rejectUnsafeMedia(built.params.imageSources);
  if (mediaError) {
    return NextResponse.json({ ok: false, code: "unsafe_media", message: mediaError }, { status: 422 });
  }

  const nextImages = built.params.imageSources.length ? built.params.imageSources : existing.images;
  const patch: Record<string, unknown> = {
    title: built.params.title,
    description: built.params.description,
    city: built.params.city,
    state: built.params.state ?? null,
    zip: built.params.zip ?? null,
    price: built.params.price,
    seller_type: built.params.sellerType,
    business_name: built.params.businessName ?? null,
    business_meta: built.params.businessMetaJson ?? null,
    detail_pairs: mergeDetailPairs(existing.detail_pairs, built.params.detailPairs),
    contact_phone: built.params.contactPhoneDigits,
    contact_email: built.params.contactEmail,
    images: nextImages,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error: updateError } = await supabase
    .from("listings")
    .update(patch)
    .eq("id", listingId)
    .eq("owner_id", bearerUserId)
    .eq("category", "rentas")
    .select("id, leonix_ad_id, status, is_published, published_at, expires_at")
    .maybeSingle();
  if (updateError || !updated?.id) {
    return NextResponse.json({ ok: false, code: "update_failed", message: updateError?.message ?? "Update did not apply." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, listing: updated });
}
