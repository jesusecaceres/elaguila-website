import { fetchProfilesForAdminList } from "./adminProfilesQuery";
import { searchListingsForAdminOps } from "./adminListingsOpsSearch";
import { searchListingReportsForOps } from "./adminOpsReportsSearch";
import { fetchAdminSupportContextForProfile, type AdminSupportContext } from "./adminOpsSupportContext";
import { listTiendaOrdersForAdmin } from "./tiendaOrdersData";
import { searchDedicatedCategoryListingsForAdminOps } from "./adminDedicatedCategorySearch";
import { listBusinessesForWorkspace } from "./businessWorkspaceData";
import { searchExtendedAdminSources } from "./adminExtendedGlobalSearch";

export type AdminUnifiedSearchBundle = {
  q: string;
  profiles: Awaited<ReturnType<typeof fetchProfilesForAdminList>>;
  listings: Awaited<ReturnType<typeof searchListingsForAdminOps>>;
  orders: Awaited<ReturnType<typeof listTiendaOrdersForAdmin>>;
  reports: Awaited<ReturnType<typeof searchListingReportsForOps>>;
  /**
   * ADMIN-OS-01 — the 7 dedicated-table marketplace categories (Servicios,
   * Restaurantes, Comida Local, Ofertas Locales, Empleos, Viajes, Autos),
   * previously invisible to this search entirely.
   */
  dedicatedCategories: Awaited<ReturnType<typeof searchDedicatedCategoryListingsForAdminOps>>;
  /**
   * Master Operating Book §17 Global Search Contract / §9 Canonical Entity Relationships —
   * `businesses` previously had zero presence anywhere in this search, despite Business 360
   * being the explicit "one business context can connect all records" system (cable map: "the
   * single most important finding in the entire cable-mapping pass"). Reuses the same
   * keyword-filtered read the businesses workspace list already uses — no new query logic.
   */
  businesses: Awaited<ReturnType<typeof listBusinessesForWorkspace>>;
  /**
   * Master Operating Book §17 — team roster, leads, payments/entitlements, Recursos, and Revista,
   * plus a standalone support-ticket keyword match. `unsupportedSources` documents entities named
   * in the contract that have no canonical searchable record today (currently: Noticias), so they
   * are explicitly disclosed rather than silently absent.
   */
  extended: Awaited<ReturnType<typeof searchExtendedAdminSources>>;
  /** Present when exactly one profile row matched — read-only operational summary. */
  supportContext: AdminSupportContext | null;
};

/** Parallel cross-entity search for customer operations (no fake persistence). */
export async function runAdminUnifiedSearch(q: string): Promise<AdminUnifiedSearchBundle> {
  const trimmed = q.trim();
  const [profiles, listings, orders, reports, dedicatedCategories, businesses, extended] = await Promise.all([
    fetchProfilesForAdminList({ q: trimmed, searchLimit: 40, recentLimit: 200 }),
    searchListingsForAdminOps(trimmed, 25),
    listTiendaOrdersForAdmin({ search: trimmed, limit: 25 }),
    searchListingReportsForOps(trimmed, 20),
    searchDedicatedCategoryListingsForAdminOps(trimmed),
    trimmed ? listBusinessesForWorkspace({ keyword: trimmed, limit: 8 }) : Promise.resolve({ items: [], total: 0 }),
    searchExtendedAdminSources(trimmed),
  ]);

  let supportContext: AdminSupportContext | null = null;
  if (profiles.rows.length === 1 && !profiles.error) {
    const id = String((profiles.rows[0] as { id?: string }).id ?? "");
    if (id) {
      supportContext = await fetchAdminSupportContextForProfile(id);
    }
  }

  return { q: trimmed, profiles, listings, orders, reports, dedicatedCategories, businesses, extended, supportContext };
}
