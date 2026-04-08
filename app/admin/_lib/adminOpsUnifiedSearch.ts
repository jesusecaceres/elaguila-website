import { fetchProfilesForAdminList } from "./adminProfilesQuery";
import { searchListingsForAdminOps } from "./adminListingsOpsSearch";
import { searchListingReportsForOps } from "./adminOpsReportsSearch";
import { fetchAdminSupportContextForProfile, type AdminSupportContext } from "./adminOpsSupportContext";
import { listTiendaOrdersForAdmin } from "./tiendaOrdersData";

export type AdminUnifiedSearchBundle = {
  q: string;
  profiles: Awaited<ReturnType<typeof fetchProfilesForAdminList>>;
  listings: Awaited<ReturnType<typeof searchListingsForAdminOps>>;
  orders: Awaited<ReturnType<typeof listTiendaOrdersForAdmin>>;
  reports: Awaited<ReturnType<typeof searchListingReportsForOps>>;
  /** Present when exactly one profile row matched — read-only operational summary. */
  supportContext: AdminSupportContext | null;
};

/** Parallel cross-entity search for customer operations (no fake persistence). */
export async function runAdminUnifiedSearch(q: string): Promise<AdminUnifiedSearchBundle> {
  const trimmed = q.trim();
  const [profiles, listings, orders, reports] = await Promise.all([
    fetchProfilesForAdminList({ q: trimmed, searchLimit: 40, recentLimit: 200 }),
    searchListingsForAdminOps(trimmed, 25),
    listTiendaOrdersForAdmin({ search: trimmed, limit: 25 }),
    searchListingReportsForOps(trimmed, 20),
  ]);

  let supportContext: AdminSupportContext | null = null;
  if (profiles.rows.length === 1 && !profiles.error) {
    const id = String((profiles.rows[0] as { id?: string }).id ?? "");
    if (id) {
      supportContext = await fetchAdminSupportContextForProfile(id);
    }
  }

  return { q: trimmed, profiles, listings, orders, reports, supportContext };
}
