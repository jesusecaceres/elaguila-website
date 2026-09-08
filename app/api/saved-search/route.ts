import { NextResponse, type NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { createOrReactivateSavedSearch, listSavedSearchesForOwner } from "@/app/lib/saved-search/savedSearchServerCrud";
import type { SavedSearchNormalizedInput } from "@/app/lib/saved-search/savedSearchTypes";

export const runtime = "nodejs";

/** Owner's own saved searches (RLS-equivalent scoping enforced explicitly — see savedSearchServerCrud.ts). */
export async function GET(req: NextRequest) {
  const ownerId = await getBearerUserId(req);
  if (!ownerId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }

  const category = req.nextUrl.searchParams.get("category")?.trim() || undefined;
  const activeOnly = req.nextUrl.searchParams.get("activeOnly") === "true";

  const savedSearches = await listSavedSearchesForOwner(getAdminSupabase(), ownerId, { category, activeOnly });
  return NextResponse.json({ ok: true, savedSearches });
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

/**
 * Save (or dedup-reactivate) the caller's current search. Ownership always comes from the
 * verified bearer token, never from the request body — a caller cannot save a search under
 * another user's id.
 */
export async function POST(req: NextRequest) {
  const ownerId = await getBearerUserId(req);
  if (!ownerId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_admin_unconfigured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const input = parseNormalizedInput(body);
  if (!input) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const result = await createOrReactivateSavedSearch(getAdminSupabase(), ownerId, input);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    savedSearch: result.row,
    created: result.created,
    reactivated: result.reactivated,
  });
}
