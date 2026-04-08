import { fetchProfilesForAdminList } from "./adminProfilesQuery";
import { searchListingsForAdminOps } from "./adminListingsOpsSearch";
import { listTiendaOrdersForAdmin } from "./tiendaOrdersData";

export type AdminUnifiedSearchBundle = {
  q: string;
  profiles: Awaited<ReturnType<typeof fetchProfilesForAdminList>>;
  listings: Awaited<ReturnType<typeof searchListingsForAdminOps>>;
  orders: Awaited<ReturnType<typeof listTiendaOrdersForAdmin>>;
};

/** Parallel cross-entity search for customer operations (no fake persistence). */
export async function runAdminUnifiedSearch(q: string): Promise<AdminUnifiedSearchBundle> {
  const trimmed = q.trim();
  const [profiles, listings, orders] = await Promise.all([
    fetchProfilesForAdminList({ q: trimmed, searchLimit: 40, recentLimit: 200 }),
    searchListingsForAdminOps(trimmed, 25),
    listTiendaOrdersForAdmin({ search: trimmed, limit: 25 }),
  ]);
  return { q: trimmed, profiles, listings, orders };
}
