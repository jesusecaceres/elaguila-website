/**
 * Gate QB-LIFECYCLE-01 — Quick Business canonical listing resolution.
 *
 * GET ?category=servicios|restaurantes|autos-dealer|bienes-negocio
 *
 * Returns the authenticated user's listing for the requested category, resolved
 * server-side by owner_user_id. Never trusts a browser-supplied listing ID.
 * The response is used by QuickBusinessMyBusinessClient to wire live Pause /
 * Reactivate / Billing actions without shipping a second listing-truth system.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ListingResolveResult =
  | { ok: true; listing: { id: string; status: string; slug?: string } }
  | { ok: false; error: string };

async function resolveServiciosListing(ownerUserId: string): Promise<ListingResolveResult> {
  const db = getAdminSupabase();
  const { data, error } = await db
    .from("servicios_public_listings")
    .select("id, slug, listing_status")
    .eq("owner_user_id", ownerUserId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, error: "lookup_failed" };
  if (!data) return { ok: false, error: "not_found" };
  return { ok: true, listing: { id: String(data.id), status: String(data.listing_status ?? ""), slug: String(data.slug ?? "") } };
}

async function resolveRestaurantesListing(ownerUserId: string): Promise<ListingResolveResult> {
  const db = getAdminSupabase();
  const { data, error } = await db
    .from("restaurantes_public_listings")
    .select("id, slug, status")
    .eq("owner_user_id", ownerUserId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, error: "lookup_failed" };
  if (!data) return { ok: false, error: "not_found" };
  return { ok: true, listing: { id: String(data.id), status: String(data.status ?? ""), slug: String(data.slug ?? "") } };
}

async function resolveAutosDealerListing(ownerUserId: string): Promise<ListingResolveResult> {
  const db = getAdminSupabase();
  // Dealer "main" row is the identity — vehicle children are managed separately.
  const { data, error } = await db
    .from("autos_classifieds_listings")
    .select("id, status")
    .eq("owner_user_id", ownerUserId)
    .eq("lane", "negocios")
    .eq("inventory_role", "main")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, error: "lookup_failed" };
  if (!data) return { ok: false, error: "not_found" };
  return { ok: true, listing: { id: String(data.id), status: String(data.status ?? "") } };
}

async function resolveBienesNegocioListing(ownerUserId: string): Promise<ListingResolveResult> {
  const db = getAdminSupabase();
  // Bienes Negocio: the agent/business parent row is inventory_role = "main" in the listings table.
  const { data, error } = await db
    .from("listings")
    .select("id, listing_status")
    .eq("owner_id", ownerUserId)
    .eq("inventory_role", "main")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, error: "lookup_failed" };
  if (!data) return { ok: false, error: "not_found" };
  return { ok: true, listing: { id: String(data.id), status: String(data.listing_status ?? "") } };
}

export async function GET(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }

  const ownerUserId = await getBearerUserId(request);
  if (!ownerUserId) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  const category = (request.nextUrl.searchParams.get("category") ?? "").trim().toLowerCase();

  let result: ListingResolveResult;
  switch (category) {
    case "servicios":
      result = await resolveServiciosListing(ownerUserId);
      break;
    case "restaurantes":
      result = await resolveRestaurantesListing(ownerUserId);
      break;
    case "autos-dealer":
      result = await resolveAutosDealerListing(ownerUserId);
      break;
    case "bienes-negocio":
      result = await resolveBienesNegocioListing(ownerUserId);
      break;
    default:
      return NextResponse.json({ ok: false, error: "unknown_category" }, { status: 400 });
  }

  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : 500;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }
  return NextResponse.json({ ok: true, listing: result.listing });
}
