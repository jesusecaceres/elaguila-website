import { NextResponse, type NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  deactivateSavedSearchForOwner,
  deleteSavedSearchForOwner,
  getSavedSearchForOwner,
  reactivateSavedSearchForOwner,
  updateSavedSearchForOwner,
} from "@/app/lib/saved-search/savedSearchServerCrud";
import type { SavedSearchNormalizedInput } from "@/app/lib/saved-search/savedSearchTypes";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const ownerId = await getBearerUserId(req);
  if (!ownerId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }
  const { id } = await ctx.params;
  const row = await getSavedSearchForOwner(getAdminSupabase(), ownerId, id);
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, savedSearch: row });
}

type PatchBody = { action: "activate" | "deactivate" } | SavedSearchNormalizedInput;

function isActionBody(body: unknown): body is { action: "activate" | "deactivate" } {
  return (
    !!body &&
    typeof body === "object" &&
    "action" in body &&
    ((body as Record<string, unknown>).action === "activate" || (body as Record<string, unknown>).action === "deactivate")
  );
}

function parseNormalizedInput(body: unknown): SavedSearchNormalizedInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const category = typeof b.category === "string" ? b.category : "";
  if (!category.trim()) return null;
  const city = typeof b.city === "string" ? b.city : "";
  const minPrice = typeof b.minPrice === "number" && Number.isFinite(b.minPrice) ? b.minPrice : null;
  const maxPrice = typeof b.maxPrice === "number" && Number.isFinite(b.maxPrice) ? b.maxPrice : null;
  const filterPayload =
    b.filterPayload && typeof b.filterPayload === "object" ? (b.filterPayload as Record<string, unknown>) : {};
  return { category, city, minPrice, maxPrice, filterPayload };
}

/** `{ action: "activate" | "deactivate" }` to pause/resume, or a full normalized-search body to
 * replace this saved search's criteria (fingerprint recomputed; fails with "duplicate" rather
 * than silently merging into a different existing row this owner already has). */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const ownerId = await getBearerUserId(req);
  if (!ownerId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }
  const { id } = await ctx.params;

  let body: PatchBody | null;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const sb = getAdminSupabase();

  if (isActionBody(body)) {
    const ok =
      body.action === "activate"
        ? await reactivateSavedSearchForOwner(sb, ownerId, id)
        : await deactivateSavedSearchForOwner(sb, ownerId, id);
    if (!ok) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
    const row = await getSavedSearchForOwner(sb, ownerId, id);
    if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, savedSearch: row });
  }

  const input = parseNormalizedInput(body);
  if (!input) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  const result = await updateSavedSearchForOwner(sb, ownerId, id, input);
  if (!result.ok) {
    const status = result.error === "duplicate" ? 409 : result.error === "not_found" ? 404 : 500;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }
  return NextResponse.json({ ok: true, savedSearch: result.row });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const ownerId = await getBearerUserId(req);
  if (!ownerId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }
  const { id } = await ctx.params;
  const ok = await deleteSavedSearchForOwner(getAdminSupabase(), ownerId, id);
  if (!ok) return NextResponse.json({ ok: false, error: "delete_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
