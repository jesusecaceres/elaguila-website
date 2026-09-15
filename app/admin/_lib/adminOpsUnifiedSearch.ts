import { fetchProfilesForAdminList } from "./adminProfilesQuery";
import { searchListingsForAdminOps } from "./adminListingsOpsSearch";
import { searchListingReportsForOps } from "./adminOpsReportsSearch";
import { fetchAdminSupportContextForProfile, type AdminSupportContext } from "./adminOpsSupportContext";
import { listTiendaOrdersForAdmin } from "./tiendaOrdersData";
import { searchDedicatedCategoryListingsForAdminOps } from "./adminDedicatedCategorySearch";
import { listBusinessesForWorkspace } from "./businessWorkspaceData";
import { searchExtendedAdminSources, type AdminExtendedSearchViewer } from "./adminExtendedGlobalSearch";

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

/**
 * Gate 1 (SYS-004) — a single flaky/slow source (network blip, connection-pool exhaustion,
 * transient Supabase timeout) previously took down the *entire* `/admin/ops` request: the
 * fan-out below used `Promise.all`, and four of these seven source functions
 * (`fetchProfilesForAdminList`, `searchListingsForAdminOps`, `searchListingReportsForOps`,
 * `listBusinessesForWorkspace`) have no internal try/catch, so any thrown error propagated
 * uncaught through `Promise.all` and crashed the whole page rather than degrading just that one
 * source — the reproducible mechanism behind the live 503 captured on 2026-09-13. Each source is
 * now isolated: a rejection degrades only that source to its own honest empty/error state (never
 * fabricated data), matching the graceful-degradation pattern already used elsewhere in Company
 * Search (`searchExtendedAdminSources`, `searchDedicatedCategoryListingsForAdminOps`).
 */
function settledOr<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

function sourceErrorMessage(result: PromiseSettledResult<unknown>): string | null {
  if (result.status !== "rejected") return null;
  const reason = result.reason as { message?: unknown } | undefined;
  return typeof reason?.message === "string" ? reason.message : "Search source unavailable — try again in a moment.";
}

/**
 * Parallel cross-entity search for customer operations (no fake persistence). `viewer` is
 * optional and, today, only consumed by the Executive Hub / staff-contact-profile source inside
 * `searchExtendedAdminSources` — every other source's destination is already role-agnostic.
 */
export async function runAdminUnifiedSearch(q: string, viewer?: AdminExtendedSearchViewer): Promise<AdminUnifiedSearchBundle> {
  const trimmed = q.trim();
  const settled = await Promise.allSettled([
    fetchProfilesForAdminList({ q: trimmed, searchLimit: 40, recentLimit: 200 }),
    searchListingsForAdminOps(trimmed, 25),
    listTiendaOrdersForAdmin({ search: trimmed, limit: 25 }),
    searchListingReportsForOps(trimmed, 20),
    searchDedicatedCategoryListingsForAdminOps(trimmed),
    trimmed ? listBusinessesForWorkspace({ keyword: trimmed, limit: 8 }) : Promise.resolve({ items: [], total: 0 }),
    searchExtendedAdminSources(trimmed, viewer),
  ]);
  const [profilesR, listingsR, ordersR, reportsR, dedicatedCategoriesR, businessesR, extendedR] = settled;

  const profiles = settledOr(profilesR, { rows: [], error: sourceErrorMessage(profilesR), strategy: "recent" as const });
  const listings = settledOr(listingsR, { rows: [], error: sourceErrorMessage(listingsR) });
  const orders = settledOr(ordersR, { rows: [], total: 0, error: sourceErrorMessage(ordersR) });
  const reports = settledOr(reportsR, { rows: [], error: sourceErrorMessage(reportsR) });
  const dedicatedCategories = settledOr(dedicatedCategoriesR, {
    rows: [],
    errors: sourceErrorMessage(dedicatedCategoriesR) ? [sourceErrorMessage(dedicatedCategoriesR) as string] : [],
  });
  const businesses = settledOr(businessesR, { items: [], total: 0 });
  const extended = settledOr(extendedR, {
    rows: [],
    errors: sourceErrorMessage(extendedR) ? [sourceErrorMessage(extendedR) as string] : [],
    unsupportedSources: [],
  });

  let supportContext: AdminSupportContext | null = null;
  if (profiles.rows.length === 1 && !profiles.error) {
    const id = String((profiles.rows[0] as { id?: string }).id ?? "");
    if (id) {
      supportContext = await fetchAdminSupportContextForProfile(id);
    }
  }

  return { q: trimmed, profiles, listings, orders, reports, dedicatedCategories, businesses, extended, supportContext };
}
