import { NextResponse, type NextRequest } from "next/server";

import {
  mapOfertaLocalItemReviewPatchToDbUpdate,
  mapOfertaLocalItemReviewRowToViewModel,
  validateOfertaLocalItemReviewPatch,
} from "@/app/lib/ofertas-locales/ofertasLocalesItemReviewMapper";
import { resolveOfertasLocalesOwnerOrAdminAuth } from "@/app/lib/ofertas-locales/ofertasLocalesReviewAuth";
import type {
  OfertaLocalItemDbRow,
  OfertaLocalItemPatchApiResponse,
  OfertaLocalPublishStatus,
} from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ itemId: string }> };

function isDbTableMissingError(message: string | undefined): boolean {
  const m = (message ?? "").toLowerCase();
  return m.includes("does not exist") || m.includes("could not find the table");
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await resolveOfertasLocalesOwnerOrAdminAuth(req);
  if (!auth) {
    return NextResponse.json<OfertaLocalItemPatchApiResponse>(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json<OfertaLocalItemPatchApiResponse>(
      { ok: false, error: "supabase_admin_unconfigured" },
      { status: 503 }
    );
  }

  const { itemId } = await context.params;
  if (!itemId?.trim()) {
    return NextResponse.json<OfertaLocalItemPatchApiResponse>(
      { ok: false, error: "missing_item_id" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<OfertaLocalItemPatchApiResponse>(
      { ok: false, error: "invalid_json" },
      { status: 400 }
    );
  }

  const validated = validateOfertaLocalItemReviewPatch(body);
  if (!validated.ok) {
    return NextResponse.json<OfertaLocalItemPatchApiResponse>(
      { ok: false, error: validated.error },
      { status: 422 }
    );
  }

  const supabase = getAdminSupabase();

  const { data: existing, error: fetchError } = await supabase
    .from("oferta_local_items")
    .select("*")
    .eq("id", itemId)
    .maybeSingle();

  if (fetchError) {
    if (isDbTableMissingError(fetchError.message)) {
      return NextResponse.json<OfertaLocalItemPatchApiResponse>(
        { ok: false, error: "items_table_unavailable" },
        { status: 503 }
      );
    }
    return NextResponse.json<OfertaLocalItemPatchApiResponse>(
      { ok: false, error: "item_lookup_failed", detail: fetchError.message },
      { status: 500 }
    );
  }

  if (!existing) {
    return NextResponse.json<OfertaLocalItemPatchApiResponse>(
      { ok: false, error: "not_found" },
      { status: 404 }
    );
  }

  if (!auth.isAdmin && existing.owner_id !== auth.actorUserId) {
    return NextResponse.json<OfertaLocalItemPatchApiResponse>(
      { ok: false, error: "not_found" },
      { status: 404 }
    );
  }

  const { data: parentOffer, error: parentError } = await supabase
    .from("ofertas_locales")
    .select("id, status")
    .eq("id", existing.oferta_local_id)
    .maybeSingle();

  if (parentError || !parentOffer) {
    return NextResponse.json<OfertaLocalItemPatchApiResponse>(
      { ok: false, error: "parent_lookup_failed", detail: parentError?.message },
      { status: 500 }
    );
  }

  const parentStatus = parentOffer.status as OfertaLocalPublishStatus;
  const updatePayload = mapOfertaLocalItemReviewPatchToDbUpdate(
    validated.patch,
    existing as OfertaLocalItemDbRow,
    parentStatus
  );

  let updateQuery = supabase.from("oferta_local_items").update(updatePayload).eq("id", itemId);
  if (!auth.isAdmin) {
    updateQuery = updateQuery.eq("owner_id", auth.actorUserId);
  }

  const { data: updated, error: updateError } = await updateQuery.select("*").single();

  if (updateError || !updated) {
    return NextResponse.json<OfertaLocalItemPatchApiResponse>(
      { ok: false, error: "update_failed", detail: updateError?.message ?? "unknown" },
      { status: 500 }
    );
  }

  return NextResponse.json<OfertaLocalItemPatchApiResponse>({
    ok: true,
    item: mapOfertaLocalItemReviewRowToViewModel(updated as OfertaLocalItemDbRow),
  });
}
