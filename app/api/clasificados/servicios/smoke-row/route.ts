import { NextResponse, type NextRequest } from "next/server";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getServiciosPublicListingBySlugForDiscovery } from "@/app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer";

export const runtime = "nodejs";

/**
 * Dev/smoke only: verifies `getServiciosPublicListingBySlugForDiscovery` in the same runtime as publish.
 * Gated so it never ships as a public introspection surface in production.
 */
export async function GET(req: NextRequest) {
  if (process.env.SERVICIOS_DEV_PUBLISH !== "1") {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 404 });
  }
  const slug = req.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ ok: false, error: "missing_slug" }, { status: 400 });
  }
  const configured = isSupabaseAdminConfigured();
  let row: Awaited<ReturnType<typeof getServiciosPublicListingBySlugForDiscovery>> = null;
  let err: string | null = null;
  try {
    row = await getServiciosPublicListingBySlugForDiscovery(slug);
  } catch (e) {
    err = e instanceof Error ? e.message : String(e);
  }

  let rawSelect: { data: unknown; error: string | null } | null = null;
  if (configured) {
    try {
      const supabase = getAdminSupabase();
      const { data, error } = await supabase.from("servicios_public_listings").select("slug,listing_status").eq("slug", slug).maybeSingle();
      rawSelect = { data: data ?? null, error: error?.message ?? null };
    } catch (e) {
      rawSelect = { data: null, error: e instanceof Error ? e.message : String(e) };
    }
  }

  return NextResponse.json({
    ok: true,
    configured,
    found: !!row,
    listing_status: row?.listing_status ?? null,
    err,
    rawSelect,
  });
}
