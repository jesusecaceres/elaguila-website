/**
 * READ-ONLY: `suspended_reason` for the suspended rows of a Servicios / Restaurantes admin page.
 *
 * The admin list selects deliberately do not carry `suspended_reason` (a missing column must never
 * turn the whole queue "unavailable"). Only the SUSPENDED rows on the current page need it, so it is
 * read here in one bounded, tolerant query. Never throws; on any failure `loaded` is false and the
 * page states that the reason was not loaded instead of guessing "staff" or "payment".
 */
import { getAdminSupabase } from "@/app/lib/supabase/server";

export type AdminLaneSuspendedReasonTable = "servicios_public_listings" | "restaurantes_public_listings";

export type AdminLaneSuspendedReasons = {
  loaded: boolean;
  /** listing id → stored reason (null = the column was read and holds no reason). Only suspended ids are present. */
  byId: Record<string, string | null>;
};

const IDS_PER_QUERY = 100;

export async function loadAdminLaneSuspendedReasons(
  table: AdminLaneSuspendedReasonTable,
  suspendedIds: readonly string[],
): Promise<AdminLaneSuspendedReasons> {
  const ids = [...new Set(suspendedIds.map((i) => String(i ?? "").trim()).filter(Boolean))];
  if (ids.length === 0) return { loaded: true, byId: {} };
  const byId: Record<string, string | null> = {};
  try {
    const supabase = getAdminSupabase();
    for (let i = 0; i < ids.length; i += IDS_PER_QUERY) {
      const { data, error } = await supabase
        .from(table)
        .select("id, suspended_reason")
        .in("id", ids.slice(i, i + IDS_PER_QUERY));
      if (error) return { loaded: false, byId: {} };
      for (const r of (data ?? []) as { id: string; suspended_reason: string | null }[]) {
        const v = typeof r.suspended_reason === "string" && r.suspended_reason.trim() ? r.suspended_reason.trim() : null;
        byId[String(r.id)] = v;
      }
    }
    return { loaded: true, byId };
  } catch {
    return { loaded: false, byId: {} };
  }
}
