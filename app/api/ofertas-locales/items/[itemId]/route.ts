import { NextResponse, type NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import {
  mapOfertaLocalItemReviewPatchToDbUpdate,
  mapOfertaLocalItemReviewRowToViewModel,
  validateOfertaLocalItemReviewPatch,
} from "@/app/lib/ofertas-locales/ofertasLocalesItemReviewMapper";
import type {
  OfertaLocalItemDbRow,
  OfertaLocalItemPatchApiResponse,
} from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ itemId: string }> };

function isDbTableMissingError(message: string | undefined): boolean {
  const m = (message ?? "").toLowerCase();
  return m.includes("does not exist") || m.includes("could not find the table");
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const ownerId = await getBearerUserId(req);
  if (!ownerId) {
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

  if (!existing || existing.owner_id !== ownerId) {
    return NextResponse.json<OfertaLocalItemPatchApiResponse>(
      { ok: false, error: "not_found" },
      { status: 404 }
    );
  }

  const updatePayload = mapOfertaLocalItemReviewPatchToDbUpdate(
    validated.patch,
    existing as OfertaLocalItemDbRow
  );

  const { data: updated, error: updateError } = await supabase
    .from("oferta_local_items")
    .update(updatePayload)
    .eq("id", itemId)
    .eq("owner_id", ownerId)
    .select("*")
    .single();

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
