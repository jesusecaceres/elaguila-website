/**
 * Gate SERVICIOS-2 — Servicios category resolver for the shared delivery engine. Reuses the exact
 * same eligibility gate and canonical URL contract as the Servicios match orchestrator.
 *
 * Site-origin note: `getBrSiteOrigin()` is a plain, category-agnostic env-driven resolver
 * (`NEXT_PUBLIC_SITE_URL` -> `VERCEL_URL` -> `http://localhost:3000`) with no Bienes-Raíces-specific
 * logic in its implementation — reused here exactly as the Rentas resolver already does, rather
 * than adding a fourth identical implementation.
 *
 * ASYNC `buildDetailUrl`: the shared ledger addresses listings by id, but Servicios' canonical
 * public URL is slug-addressed (`/clasificados/servicios/[slug]` — the exact value the detail
 * page declares as its `alternates.canonical`), so the slug must be read from the row. The shared
 * contract's `buildDetailUrl` return type was widened to `string | Promise<string>` for this;
 * Autos/Bienes Raíces/Rentas still return a plain string and are untouched. Falls back to the
 * category hub if the row has vanished between revalidation and URL building — never a fabricated
 * slug, never the legacy `/servicios/perfil/[slug]` redirect shim.
 */
import "server-only";
import { getServiciosPublicListingByIdFromDb } from "@/app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer";
import { getBrSiteOrigin } from "@/app/lib/clasificados/bienes-raices/stripeBrConfig";
import { certifyServiciosPublicEligibleListing } from "./serviciosPublicEligibleListing";
import type { SavedSearchDeliveryCategoryResolver } from "../delivery/savedSearchDeliveryCategoryResolver";

/** The category hub — the same path already registered in `LEONIX_SITEMAP_CATEGORY_HUBS`. */
const SERVICIOS_HUB_PATH = "/clasificados/servicios";

export const serviciosSavedSearchDeliveryResolver: SavedSearchDeliveryCategoryResolver = {
  async revalidateListingStillEligible(listingId: string): Promise<boolean> {
    const row = await getServiciosPublicListingByIdFromDb(listingId, { visibility: "all" });
    return certifyServiciosPublicEligibleListing(row) !== null;
  },
  async buildDetailUrl(listingId: string): Promise<string> {
    const origin = getBrSiteOrigin();
    const row = await getServiciosPublicListingByIdFromDb(listingId, { visibility: "all" });
    const slug = row?.slug?.trim();
    if (!slug) return `${origin}${SERVICIOS_HUB_PATH}?lang=es`;
    return `${origin}/clasificados/servicios/${encodeURIComponent(slug)}?lang=es`;
  },
};
