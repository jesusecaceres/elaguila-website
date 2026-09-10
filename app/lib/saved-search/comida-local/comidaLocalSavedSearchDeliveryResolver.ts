/**
 * Gate COMIDA-LOCAL-2 — Comida Local category resolver for the shared delivery engine. Reuses the
 * exact same eligibility gate and canonical URL contract as the Comida Local match orchestrator.
 *
 * Site-origin note: `getBrSiteOrigin()` is a plain, category-agnostic env-driven resolver
 * (`NEXT_PUBLIC_SITE_URL` -> `VERCEL_URL` -> `http://localhost:3000`) with no Bienes-Raíces-specific
 * logic in its implementation — reused here exactly as the Rentas, Servicios and Restaurantes
 * resolvers already do, rather than adding a sixth identical implementation.
 *
 * ASYNC `buildDetailUrl`: the shared ledger addresses listings by id, but the Comida Local canonical
 * public URL is slug-addressed (`/clasificados/comida-local/[slug]` — the same value the detail page
 * declares as `alternates.canonical` and that this gate's JSON-LD emits absolutely). Falls back to
 * the category hub if the row has vanished between revalidation and URL building — never a
 * fabricated slug.
 */
import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getBrSiteOrigin } from "@/app/lib/clasificados/bienes-raices/stripeBrConfig";
import { COMIDA_LOCAL_RESULTS_PATH } from "@/app/lib/clasificados/comida-local/comidaLocalResultsUrl";
import type { ComidaLocalPublicListingRow } from "@/app/lib/clasificados/comida-local/comidaLocalPublicTypes";
import { certifyComidaLocalPublicEligibleListing } from "./comidaLocalPublicEligibleListing";
import type { SavedSearchDeliveryCategoryResolver } from "../delivery/savedSearchDeliveryCategoryResolver";

/**
 * Minimal by-id read. `comidaLocalPublicQueries` exposes no published-only single-row by-id reader
 * (`getPublishedComidaLocalListingBySlug` is slug-keyed), so this reads the three columns the
 * resolver needs and hands them to the SAME certification function the orchestrator uses — rather
 * than duplicating the eligibility rule or widening a public reader for delivery.
 */
async function readComidaLocalRowById(
  listingId: string,
): Promise<Pick<ComidaLocalPublicListingRow, "id" | "slug" | "status"> | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const id = listingId.trim();
  if (!id) return null;
  try {
    const { data, error } = await getAdminSupabase()
      .from("comida_local_public_listings")
      .select("id, slug, status")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as Pick<ComidaLocalPublicListingRow, "id" | "slug" | "status">;
  } catch {
    return null;
  }
}

export const comidaLocalSavedSearchDeliveryResolver: SavedSearchDeliveryCategoryResolver = {
  async revalidateListingStillEligible(listingId: string): Promise<boolean> {
    const row = await readComidaLocalRowById(listingId);
    return certifyComidaLocalPublicEligibleListing(row as ComidaLocalPublicListingRow | null) !== null;
  },
  async buildDetailUrl(listingId: string): Promise<string> {
    const origin = getBrSiteOrigin();
    const row = await readComidaLocalRowById(listingId);
    const slug = row?.slug?.trim();
    if (!slug) return `${origin}${COMIDA_LOCAL_RESULTS_PATH}?lang=es`;
    return `${origin}${COMIDA_LOCAL_RESULTS_PATH}/${encodeURIComponent(slug)}?lang=es`;
  },
};
