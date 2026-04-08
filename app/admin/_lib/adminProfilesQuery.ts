/**
 * Admin profile listing — uses service role. When `q` is set, search runs in Postgres
 * (not limited to the N most recent accounts).
 */
import { getAdminSupabase } from "@/app/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ADMIN_PROFILE_LIST_SELECT =
  "id,created_at,display_name,email,phone,account_type,membership_tier,home_city,owned_city_slug,newsletter_opt_in,is_disabled";

function sanitizeIlikeFragment(s: string): string {
  return s.replace(/[%_,]/g, " ").trim();
}

export type AdminProfileListStrategy = "recent" | "server_search";

export async function fetchProfilesForAdminList(opts: {
  q: string;
  /** Max rows when q is empty (recent-first). */
  recentLimit?: number;
  /** Max rows for server search. */
  searchLimit?: number;
}): Promise<{
  rows: Record<string, unknown>[];
  error: string | null;
  strategy: AdminProfileListStrategy;
}> {
  const supabase = getAdminSupabase();
  const qRaw = opts.q.trim();
  const recentLimit = opts.recentLimit ?? 200;
  const searchLimit = opts.searchLimit ?? 80;

  if (!qRaw) {
    const { data, error } = await supabase
      .from("profiles")
      .select(ADMIN_PROFILE_LIST_SELECT)
      .order("created_at", { ascending: false })
      .limit(recentLimit);
    return {
      rows: (data as Record<string, unknown>[]) ?? [],
      error: error?.message ?? null,
      strategy: "recent",
    };
  }

  const parts: string[] = [];
  if (UUID_REGEX.test(qRaw)) {
    parts.push(`id.eq.${qRaw}`);
  }

  const safe = sanitizeIlikeFragment(qRaw);
  if (safe.length >= 1) {
    const term = `%${safe}%`;
    parts.push(`display_name.ilike.${term}`);
    parts.push(`email.ilike.${term}`);
    parts.push(`phone.ilike.${term}`);
  }

  const digitsOnly = qRaw.replace(/\D/g, "");
  if (digitsOnly.length >= 7) {
    parts.push(`phone.ilike.%${digitsOnly}%`);
  }

  const compact = qRaw.replace(/-/g, "").toLowerCase();
  if (compact.length >= 8 && compact.length <= 32 && /^[0-9a-f]+$/.test(compact)) {
    parts.push(`id.ilike.%${compact}%`);
  }

  if (parts.length === 0) {
    return { rows: [], error: null, strategy: "server_search" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(ADMIN_PROFILE_LIST_SELECT)
    .or(parts.join(","))
    .order("created_at", { ascending: false })
    .limit(searchLimit);

  return {
    rows: (data as Record<string, unknown>[]) ?? [],
    error: error?.message ?? null,
    strategy: "server_search",
  };
}
