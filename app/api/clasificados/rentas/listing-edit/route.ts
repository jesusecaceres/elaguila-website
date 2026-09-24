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
import { applyAssistedPublishingCookie } from "@/app/lib/auth/assistedPublishingSession";
import { isListingLinkedToBusiness, linkAssistedListingToBusiness } from "@/app/lib/business/assistedListingCustody";
import { recordSalesWorkspaceAudit } from "@/app/lib/sales/salesWorkspaceAudit";
import { resolveStaffAssistedCategorySave, isStaffAssistedSaveRefusal } from "@/app/lib/sales/staffAssistedCategorySave";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  listingId?: string | null;
  leonixAdId?: string | null;
  lane?: "privado" | "negocio" | null;
  lang?: "es" | "en" | null;
  draft?: unknown;
  assistedAction?: string | null;
  clientUserId?: string | null;
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

function buildPatchFromParams(
  built: Extract<ReturnType<typeof buildRentasPrivadoListingParams>, { ok: true }>,
  existingDetailPairs: unknown,
  existingImages: unknown,
): Record<string, unknown> {
  const nextImages = built.params.imageSources.length ? built.params.imageSources : existingImages;
  return {
    title: built.params.title,
    description: built.params.description,
    city: built.params.city,
    state: built.params.state ?? null,
    zip: built.params.zip ?? null,
    price: built.params.price,
    seller_type: built.params.sellerType,
    business_name: built.params.businessName ?? null,
    business_meta: built.params.businessMetaJson ?? null,
    detail_pairs: mergeDetailPairs(existingDetailPairs, built.params.detailPairs),
    contact_phone: built.params.contactPhoneDigits,
    contact_email: built.params.contactEmail,
    images: nextImages,
    updated_at: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, code: "supabase_not_configured" }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, code: "invalid_json", message: "Invalid JSON body." }, { status: 400 });
  }

  const assisted = await resolveStaffAssistedCategorySave({
    request,
    expectedCategory: "rentas",
    assistedActionRaw: typeof body.assistedAction === "string" ? body.assistedAction : "",
    bodyListingId: body.listingId,
    bodyClientUserId: body.clientUserId,
  });
  if (isStaffAssistedSaveRefusal(assisted)) {
    return NextResponse.json({ ok: false, error: assisted.error }, { status: assisted.status });
  }

  if (assisted.assisted) {
    if (assisted.isPublish) {
      return NextResponse.json({ ok: false, error: "publish_via_cockpit_only" }, { status: 403 });
    }
    const lane = body.lane === "negocio" ? "negocio" : "privado";
    if (lane !== "privado") {
      return NextResponse.json({ ok: false, error: "staff_rentas_privado_only" }, { status: 422 });
    }
    if (!body.draft || typeof body.draft !== "object") {
      return NextResponse.json({ ok: false, code: "invalid_request", message: "draft is required." }, { status: 400 });
    }
    const built = buildRentasPrivadoListingParams(
      body.draft as RentasPrivadoFormState,
      body.lang === "en" ? "en" : "es",
      null,
      { allowEmptyGallery: true },
    );
    if (!built.ok) {
      return NextResponse.json({ ok: false, code: "invalid_draft", message: built.error }, { status: 422 });
    }
    const mediaError = rejectUnsafeMedia(built.params.imageSources);
    if (mediaError) {
      return NextResponse.json({ ok: false, code: "unsafe_media", message: mediaError }, { status: 422 });
    }

    const supabase = getAdminSupabase();
    let listingId = assisted.listingId;
    if (listingId) {
      const { data: existing, error: readError } = await supabase
        .from("listings")
        .select("id, owner_id, category, seller_type, status, is_published, detail_pairs, images")
        .eq("id", listingId)
        .maybeSingle();
      if (readError || !existing?.id) {
        return NextResponse.json({ ok: false, code: "listing_not_found" }, { status: 404 });
      }
      if (trim(existing.category).toLowerCase() !== "rentas") {
        return NextResponse.json({ ok: false, code: "wrong_category" }, { status: 422 });
      }
      // REOPEN custody re-proof: an existing row is writable only while the custody ledger still
      // links it to THIS business (never on the strength of the cookie or a body id alone).
      const linked = await isListingLinkedToBusiness({
        businessId: assisted.ctx.businessId,
        listingSource: "listings",
        listingId,
      });
      if (!linked) {
        return NextResponse.json({ ok: false, error: "listing_not_linked_to_business" }, { status: 403 });
      }
      const existingOwner = trim(existing.owner_id) || null;
      if (existingOwner && assisted.clientUserId && existingOwner !== assisted.clientUserId) {
        return NextResponse.json({ ok: false, error: "listing_owner_mismatch" }, { status: 409 });
      }
      const patch = buildPatchFromParams(built, existing.detail_pairs, existing.images);
      delete (patch as { status?: unknown }).status;
      const updateQuery = existingOwner
        ? supabase.from("listings").update(patch).eq("id", listingId).eq("owner_id", existingOwner)
        : supabase.from("listings").update(patch).eq("id", listingId);
      const { data: updated, error: updateError } = await updateQuery
        .select("id, leonix_ad_id, status, is_published")
        .maybeSingle();
      if (updateError || !updated?.id) {
        return NextResponse.json({ ok: false, code: "update_failed" }, { status: 500 });
      }
      await recordSalesWorkspaceAudit({
        action: "quick_sales_save_for_client",
        actorRosterId: assisted.ctx.rosterId,
        businessId: assisted.ctx.businessId,
        category: "rentas",
        listingSource: "listings",
        listingId,
        outcome: "ok",
      });
      return NextResponse.json({ ok: true, listing: updated, listingId });
    }

    const insertRow: Record<string, unknown> = {
      ...buildPatchFromParams(built, [], []),
      category: "rentas",
      status: "pending",
      is_published: false,
    };
    if (assisted.clientUserId) insertRow.owner_id = assisted.clientUserId;
    const { data: inserted, error: insertError } = await supabase
      .from("listings")
      .insert(insertRow)
      .select("id, leonix_ad_id, status, is_published")
      .single();
    if (insertError || !inserted?.id) {
      return NextResponse.json({ ok: false, error: "listing_create_failed", detail: insertError?.message }, { status: 500 });
    }
    listingId = String(inserted.id);
    await linkAssistedListingToBusiness({
      businessId: assisted.ctx.businessId,
      listingSource: "listings",
      listingId,
      linkedByAuthUserId: assisted.ctx.authUserId,
    });
    const res = NextResponse.json({ ok: true, listing: inserted, listingId });
    applyAssistedPublishingCookie(res, {
      businessId: assisted.ctx.businessId,
      category: "rentas",
      rosterId: assisted.ctx.rosterId,
      authUserId: assisted.ctx.authUserId,
      listingId,
      clientUserId: assisted.clientUserId,
      assistedAction: "save_for_client",
      packageKey: assisted.ctx.packageKey ?? null,
    });
    await recordSalesWorkspaceAudit({
      action: "quick_sales_save_for_client",
      actorRosterId: assisted.ctx.rosterId,
      businessId: assisted.ctx.businessId,
      category: "rentas",
      listingSource: "listings",
      listingId,
      outcome: "ok",
    });
    return res;
  }

  const bearerUserId = await getBearerUserId(request);
  if (!bearerUserId) {
    return NextResponse.json({ ok: false, code: "auth_required", message: "Authentication required." }, { status: 401 });
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

  const patch = buildPatchFromParams(built, existing.detail_pairs, existing.images);

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
