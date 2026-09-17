/**
 * Gate RESTAURANTES-2 — Restaurantes category resolver for the shared delivery engine. Reuses the
 * exact same eligibility gate and canonical URL contract as the Restaurantes match orchestrator.
 *
 * Site-origin note: `getBrSiteOrigin()` is a plain, category-agnostic env-driven resolver
 * (`NEXT_PUBLIC_SITE_URL` -> `VERCEL_URL` -> `http://localhost:3000`) with no Bienes-Raíces-specific
 * logic in its implementation — reused here exactly as the Rentas and Servicios resolvers already
 * do, rather than adding a fifth identical implementation.
 *
 * ASYNC `buildDetailUrl`: the shared ledger addresses listings by id, but the Restaurantes canonical
 * public URL is slug-addressed (`/clasificados/restaurantes/[slug]` — the same value the detail page
 * declares as `alternates.canonical` and that Gate RESTAURANTES-1 made absolute in its JSON-LD), so
 * the slug must be read from the row. The shared contract's `buildDetailUrl` already returns
 * `string | Promise<string>` (widened in Gate SERVICIOS-2 for exactly this shape). Falls back to the
 * category hub if the row has vanished between revalidation and URL building — never a fabricated
 * slug.
 */
import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getBrSiteOrigin } from "@/app/lib/clasificados/bienes-raices/stripeBrConfig";
import { certifyRestaurantesPublicEligibleListing } from "./restaurantesPublicEligibleListing";
import type { RestaurantesPublicListingDbRow } from "@/app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingsServer";
import type { SavedSearchDeliveryCategoryResolver } from "../delivery/savedSearchDeliveryCategoryResolver";

/** The category hub — the same path already registered in `LEONIX_SITEMAP_CATEGORY_HUBS`. */
const RESTAURANTES_HUB_PATH = "/clasificados/restaurantes";

/**
 * Minimal by-id read. `restaurantesPublicListingsServer` exposes no published-only single-row
 * by-id reader (its `getRestaurantePublicListingBySlugFromDb` is slug-keyed), so this reads the two
 * columns the resolver needs and hands them to the SAME certification function the orchestrator
 * uses — rather than duplicating the eligibility rule or widening a public reader for delivery.
 */
async function readRestauranteRowById(
  listingId: string,
): Promise<Pick<RestaurantesPublicListingDbRow, "id" | "slug" | "status"> | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const id = listingId.trim();
  if (!id) return null;
  try {
    const { data, error } = await getAdminSupabase()
      .from("restaurantes_public_listings")
      .select("id, slug, status")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as Pick<RestaurantesPublicListingDbRow, "id" | "slug" | "status">;
  } catch {
    return null;
  }
}

export const restaurantesSavedSearchDeliveryResolver: SavedSearchDeliveryCategoryResolver = {
  async revalidateListingStillEligible(listingId: string): Promise<boolean> {
    const row = await readRestauranteRowById(listingId);
    return certifyRestaurantesPublicEligibleListing(row as RestaurantesPublicListingDbRow | null) !== null;
  },
  async buildDetailUrl(listingId: string): Promise<string> {
    const origin = getBrSiteOrigin();
    const row = await readRestauranteRowById(listingId);
    const slug = row?.slug?.trim();
    if (!slug) return `${origin}${RESTAURANTES_HUB_PATH}?lang=es`;
    return `${origin}/clasificados/restaurantes/${encodeURIComponent(slug)}?lang=es`;
  },
};
