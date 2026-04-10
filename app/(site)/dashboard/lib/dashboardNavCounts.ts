/**
 * Lightweight counts for dashboard sidebar badges. Uses only columns known to exist;
 * degrades silently when optional fields are missing.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type DashboardNavCounts = {
  /** Inbox items to review (no `read` flag in schema yet → total received). */
  messageInbox: number | null;
  /** Unpublished / draft-like rows when `is_published` is available. */
  drafts: number | null;
  /** Active listings whose boost/visibility ends within 7 days. */
  expiringSoon: number | null;
};

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export async function fetchDashboardNavCounts(sb: SupabaseClient, userId: string): Promise<DashboardNavCounts> {
  const out: DashboardNavCounts = { messageInbox: null, drafts: null, expiringSoon: null };

  try {
    const { count, error } = await sb
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", userId);
    if (!error) out.messageInbox = typeof count === "number" ? count : 0;
  } catch {
    /* ignore */
  }

  try {
    const { count, error } = await sb
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .eq("is_published", false);
    if (!error) out.drafts = typeof count === "number" ? count : 0;
  } catch {
    /* is_published may be absent in some DBs */
    try {
      const { data } = await sb.from("listings").select("id, status, is_published").eq("owner_id", userId);
      const rows = (data ?? []) as Array<{ status?: string | null; is_published?: boolean | null }>;
      out.drafts = rows.filter(
        (r) => r.is_published === false || String(r.status ?? "").toLowerCase() === "draft"
      ).length;
    } catch {
      try {
        const { data } = await sb.from("listings").select("id, status").eq("owner_id", userId);
        const rows = (data ?? []) as Array<{ status?: string | null }>;
        out.drafts = rows.filter((r) => String(r.status ?? "").toLowerCase() === "draft").length;
      } catch {
        out.drafts = null;
      }
    }
  }

  const soon = addDays(new Date(), 7);
  const now = new Date();
  try {
    const { data, error } = await sb
      .from("listings")
      .select("id, status, boost_expires")
      .eq("owner_id", userId)
      .eq("status", "active");
    if (!error && data) {
      let n = 0;
      for (const row of data as Array<{ boost_expires?: string | null }>) {
        const raw = row.boost_expires;
        if (raw == null) continue;
        const t = new Date(typeof raw === "string" ? raw : String(raw)).getTime();
        if (!Number.isFinite(t)) continue;
        if (t > now.getTime() && t <= soon.getTime()) n++;
      }
      out.expiringSoon = n;
    }
  } catch {
    out.expiringSoon = null;
  }

  return out;
}
