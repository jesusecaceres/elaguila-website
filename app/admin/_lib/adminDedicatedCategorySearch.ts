/**
 * ADMIN-OS-01 — global-search coverage for the 7 marketplace categories that
 * live on their own dedicated table instead of the shared `listings` table
 * (Servicios, Autos, Restaurantes, Empleos, Viajes, Comida Local, Ofertas
 * Locales). Confirmed gap: `searchListingsForAdminOps()` only ever queried
 * `public.listings`, so an operator searching /admin/ops for anything in one
 * of these 7 categories got zero results — indistinguishable from "doesn't
 * exist." See docs/admin-os/ADMIN_OS_CABLE_MAP.md, MARKETPLACE OPS domain.
 *
 * Reuses each category's own existing, already-correct admin-list function
 * (the same one its dedicated ops page already calls) rather than hand-rolling
 * a second set of queries against schemas already owned elsewhere.
 */
import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { listServiciosPublicListingsAdminQueueFromDb } from "@/app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer";
import { listRestaurantesPublicListingsAdminFromDb } from "@/app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingsServer";
import { fetchAllEmpleosListingsForAdmin } from "@/app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer";
import { fetchViajesStagedAdminQueue } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer";
import { listAllAutosClassifiedsRowsForAdmin } from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { listAdminComidaLocalListings } from "@/app/lib/clasificados/comida-local/comidaLocalAdminQueries";
import { listOfertasLocalesAdminRows } from "@/app/lib/ofertas-locales/ofertasLocalesAdminHelpers";

export type AdminDedicatedCategorySearchRow = {
  id: string;
  title: string | null;
  category: string;
  status: string | null;
  ownerId: string | null;
  adminHref: string;
};

const PER_CATEGORY_LIMIT = 8;
/** Bounded scan window for categories whose read function has no server-side `q` filter. */
const SCAN_WINDOW = 300;

function matches(haystack: Array<string | null | undefined>, needle: string): boolean {
  const n = needle.toLowerCase();
  return haystack.some((h) => h && h.toLowerCase().includes(n));
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export async function searchDedicatedCategoryListingsForAdminOps(
  q: string,
): Promise<{ rows: AdminDedicatedCategorySearchRow[]; errors: string[] }> {
  const trimmed = q.trim();
  if (!trimmed) return { rows: [], errors: [] };
  const errors: string[] = [];
  const rows: AdminDedicatedCategorySearchRow[] = [];

  // --- Servicios (server-side q supported) ---
  try {
    const { rows: r, readError } = await listServiciosPublicListingsAdminQueueFromDb({
      q: trimmed,
      limit: PER_CATEGORY_LIMIT,
    });
    if (readError) errors.push(`Servicios: ${readError}`);
    for (const row of r.slice(0, PER_CATEGORY_LIMIT)) {
      rows.push({
        id: row.id,
        title: row.business_name ?? null,
        category: "servicios",
        status: row.listing_status,
        ownerId: row.owner_user_id,
        adminHref: `/admin/workspace/clasificados/servicios?q=${encodeURIComponent(trimmed)}`,
      });
    }
  } catch (e) {
    errors.push(`Servicios: ${e instanceof Error ? e.message : "search failed"}`);
  }

  // --- Restaurantes (server-side q supported) ---
  try {
    const r = await listRestaurantesPublicListingsAdminFromDb({ q: trimmed, limit: PER_CATEGORY_LIMIT });
    for (const row of r.slice(0, PER_CATEGORY_LIMIT)) {
      rows.push({
        id: row.id,
        title: row.business_name ?? null,
        category: "restaurantes",
        status: row.status,
        ownerId: row.owner_user_id,
        adminHref: `/admin/workspace/clasificados/restaurantes?q=${encodeURIComponent(trimmed)}`,
      });
    }
  } catch (e) {
    errors.push(`Restaurantes: ${e instanceof Error ? e.message : "search failed"}`);
  }

  // --- Comida Local (server-side q supported, explicit client param) ---
  if (isSupabaseAdminConfigured()) {
    try {
      const sb = getAdminSupabase();
      const r = await listAdminComidaLocalListings(sb, { q: trimmed, limit: PER_CATEGORY_LIMIT });
      for (const row of r.slice(0, PER_CATEGORY_LIMIT)) {
        rows.push({
          id: row.id,
          title: row.business_name ?? null,
          category: "comida-local",
          status: row.status,
          ownerId: row.owner_user_id,
          adminHref: `/admin/workspace/clasificados/comida-local?q=${encodeURIComponent(trimmed)}`,
        });
      }
    } catch (e) {
      errors.push(`Comida Local: ${e instanceof Error ? e.message : "search failed"}`);
    }

    // --- Ofertas Locales (server-side q supported, explicit client param) ---
    try {
      const sb = getAdminSupabase();
      const r = await listOfertasLocalesAdminRows(sb, { q: trimmed, limit: PER_CATEGORY_LIMIT });
      for (const row of r.slice(0, PER_CATEGORY_LIMIT)) {
        rows.push({
          id: row.id,
          title: row.title ?? row.business_name ?? null,
          category: "ofertas-locales",
          status: row.status,
          ownerId: row.owner_id,
          adminHref: `/admin/workspace/clasificados/ofertas-locales?q=${encodeURIComponent(trimmed)}`,
        });
      }
    } catch (e) {
      errors.push(`Ofertas Locales: ${e instanceof Error ? e.message : "search failed"}`);
    }
  }

  // --- Empleos (no server-side q — bounded scan + in-memory match) ---
  try {
    const all = await fetchAllEmpleosListingsForAdmin({ limit: SCAN_WINDOW });
    const found = all
      .filter((row) =>
        isUuid(trimmed)
          ? row.id === trimmed || row.owner_user_id === trimmed
          : matches([row.title, row.company_name, row.slug, row.leonix_ad_id], trimmed),
      )
      .slice(0, PER_CATEGORY_LIMIT);
    for (const row of found) {
      rows.push({
        id: row.id,
        title: row.title ?? row.company_name ?? null,
        category: "empleos",
        status: row.lifecycle_status,
        ownerId: row.owner_user_id,
        adminHref: `/admin/workspace/clasificados/empleos?q=${encodeURIComponent(row.leonix_ad_id ?? row.id)}`,
      });
    }
  } catch (e) {
    errors.push(`Empleos: ${e instanceof Error ? e.message : "search failed"}`);
  }

  // --- Viajes (no server-side q — bounded scan + in-memory match) ---
  try {
    const all = await fetchViajesStagedAdminQueue({ limit: SCAN_WINDOW });
    const found = all
      .filter((row) =>
        isUuid(trimmed)
          ? row.id === trimmed || row.owner_user_id === trimmed
          : matches([row.title, row.slug, row.leonix_ad_id], trimmed),
      )
      .slice(0, PER_CATEGORY_LIMIT);
    for (const row of found) {
      rows.push({
        id: row.id,
        title: row.title ?? null,
        category: "viajes",
        status: row.lifecycle_status,
        ownerId: row.owner_user_id,
        // Canonical admin route per the cable map (not the orphaned /admin/workspace/clasificados/travel duplicate).
        adminHref: `/admin/clasificados/viajes/business-offers?q=${encodeURIComponent(row.leonix_ad_id ?? row.id)}`,
      });
    }
  } catch (e) {
    errors.push(`Viajes: ${e instanceof Error ? e.message : "search failed"}`);
  }

  // --- Autos (no server-side q, listing detail lives in a JSON payload —
  // bounded scan + exact id/owner/leonix_ad_id match only, to avoid guessing
  // at the listing_payload JSON shape). ---
  try {
    const all = await listAllAutosClassifiedsRowsForAdmin(SCAN_WINDOW);
    const found = all
      .filter((row) =>
        isUuid(trimmed)
          ? row.id === trimmed || row.owner_user_id === trimmed
          : matches([row.leonix_ad_id], trimmed),
      )
      .slice(0, PER_CATEGORY_LIMIT);
    for (const row of found) {
      rows.push({
        id: row.id,
        title: row.leonix_ad_id ?? null,
        category: "autos",
        status: row.status,
        ownerId: row.owner_user_id,
        adminHref: `/admin/workspace/clasificados/autos?q=${encodeURIComponent(row.leonix_ad_id ?? row.id)}`,
      });
    }
  } catch (e) {
    errors.push(`Autos: ${e instanceof Error ? e.message : "search failed"}`);
  }

  return { rows, errors };
}
