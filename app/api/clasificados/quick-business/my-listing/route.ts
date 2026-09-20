/**
 * Gate QB-IDENTITY-01 — Quick Business canonical listing resolution.
 *
 * GET ?category=servicios|restaurantes|autos-dealer|bienes-negocio
 * Requires `Authorization: Bearer <supabase access token>`.
 *
 * IDENTITY CONTRACT (changed in QB-IDENTITY-01):
 * Resolution is LINK-FIRST. The durable `business_listing_links` relationship is the primary
 * identity contract; the owner-column scan is only a guarded repair fallback for listings
 * published before link write-back existed.
 *
 * The previous implementation scanned the owner column directly and took
 * `.order(...).limit(1)` — which silently picked an ARBITRARY listing when a user had more than
 * one. Every downstream lifecycle control then acted on whichever row happened to sort first.
 * Ambiguity is now an explicit 409 rather than a guess: the doorway must never pause or archive
 * a listing the customer did not choose.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import {
  resolveCanonicalListingForUser,
  type CanonicalListingSource,
} from "@/app/lib/business/canonicalListingLink";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { QUICK_BUSINESS_LIFECYCLE_CAPABILITIES } from "@/app/lib/quickBusiness/quickBusinessLifecycleCapabilities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Per-family canonical wiring. `statusColumn` differs by family and is NOT guessable — reading
 * `listing_status` from `listings` (which uses `status`) was a real defect in the prior version.
 */
const CATEGORY_WIRING: Record<
  string,
  {
    source: CanonicalListingSource;
    statusColumn: string;
    hasSlug: boolean;
    hasIsPublished: boolean;
    fallbackFilters: Record<string, string>;
  }
> = {
  servicios: {
    source: "servicios_public_listings",
    statusColumn: "listing_status",
    hasSlug: true,
    hasIsPublished: false,
    fallbackFilters: {},
  },
  restaurantes: {
    source: "restaurantes_public_listings",
    statusColumn: "status",
    hasSlug: true,
    hasIsPublished: false,
    fallbackFilters: {},
  },
  "autos-dealer": {
    source: "autos_classifieds_listings",
    statusColumn: "status",
    hasSlug: false,
    hasIsPublished: false,
    // The dealer identity row, never an inventory vehicle child.
    fallbackFilters: { lane: "negocios", inventory_role: "main" },
  },
  "bienes-negocio": {
    source: "listings",
    statusColumn: "status",
    hasSlug: false,
    hasIsPublished: true,
    fallbackFilters: { category: "bienes-raices", seller_type: "business", inventory_role: "main" },
  },
};

export async function GET(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }

  const ownerUserId = await getBearerUserId(request);
  if (!ownerUserId) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  const category = (request.nextUrl.searchParams.get("category") ?? "").trim().toLowerCase();
  const wiring = CATEGORY_WIRING[category];
  if (!wiring) {
    return NextResponse.json({ ok: false, error: "unknown_category" }, { status: 400 });
  }

  const resolved = await resolveCanonicalListingForUser({
    userId: ownerUserId,
    listingSource: wiring.source,
    fallbackFilters: wiring.fallbackFilters,
  });

  if (!resolved.found) {
    if (resolved.reason === "ambiguous") {
      // Several candidate listings and no single canonical link to disambiguate. Refusing is the
      // whole point: acting on an arbitrary one is how the wrong listing gets paused.
      return NextResponse.json(
        {
          ok: false,
          error: "ambiguous_listing",
          message: "More than one listing matched. Open the full dashboard to choose which one to manage.",
        },
        { status: 409 },
      );
    }
    const status = resolved.reason === "db_not_configured" ? 503 : 404;
    return NextResponse.json({ ok: false, error: resolved.reason === "none" ? "not_found" : resolved.reason }, { status });
  }

  // Read the current state of the resolved row from its own canonical status column.
  const db = getAdminSupabase();
  const columns = ["id", wiring.statusColumn]
    .concat(wiring.hasSlug ? ["slug"] : [])
    .concat(wiring.hasIsPublished ? ["is_published"] : [])
    .join(", ");
  const { data, error } = await db
    .from(wiring.source)
    .select(columns)
    .eq("id", resolved.listingId)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: "lookup_failed" }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const row = data as unknown as Record<string, unknown>;
  const statusValue = row[wiring.statusColumn];

  return NextResponse.json({
    ok: true,
    listing: {
      id: String(row.id),
      status: typeof statusValue === "string" ? statusValue : "",
      ...(wiring.hasSlug ? { slug: typeof row.slug === "string" ? row.slug : "" } : {}),
      ...(wiring.hasIsPublished ? { isPublished: row.is_published !== false } : {}),
    },
    /** How identity was established. `owner_fallback` means this listing predates link write-back. */
    resolvedVia: resolved.via,
    businessId: resolved.businessId,
    /** What the doorway may honestly offer for this family — see the capability matrix. */
    capabilities: QUICK_BUSINESS_LIFECYCLE_CAPABILITIES[category] ?? null,
  });
}
