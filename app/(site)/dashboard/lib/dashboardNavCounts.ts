/**
 * Sidebar badge counts — uses real columns only; degrades per dashboardDataContract.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type DashboardNavCounts = {
  /** Unread inbox when `messages.read_at` exists; else total received; null if unknown */
  messageInbox: number | null;
  drafts: number | null;
  /** Active listings with boost/visibility ending within 7d OR expires_at in window when present */
  expiringSoon: number | null;
};

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function inSoonWindow(iso: string | null | undefined, now: Date, soon: Date): boolean {
  if (iso == null) return false;
  const t = new Date(typeof iso === "string" ? iso : String(iso)).getTime();
  if (!Number.isFinite(t)) return false;
  return t > now.getTime() && t <= soon.getTime();
}

export async function fetchDashboardNavCounts(sb: SupabaseClient, userId: string): Promise<DashboardNavCounts> {
  const out: DashboardNavCounts = { messageInbox: null, drafts: null, expiringSoon: null };
  const now = new Date();
  const soon = addDays(now, 7);

  try {
    const unread = await sb
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .is("read_at", null);
    if (!unread.error && typeof unread.count === "number") {
      out.messageInbox = unread.count;
    } else {
      const total = await sb
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", userId);
      if (!total.error && typeof total.count === "number") {
        out.messageInbox = total.count;
      }
    }
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

  const countExpiring = (rows: Array<{ boost_expires?: string | null; expires_at?: string | null }>) => {
    let n = 0;
    for (const row of rows) {
      if (inSoonWindow(row.boost_expires ?? null, now, soon)) n++;
      else if (inSoonWindow(row.expires_at ?? null, now, soon)) n++;
    }
    return n;
  };

  try {
    const withExp = await sb
      .from("listings")
      .select("id, status, boost_expires, expires_at")
      .eq("owner_id", userId)
      .eq("status", "active");
    if (!withExp.error && withExp.data) {
      out.expiringSoon = countExpiring(withExp.data as Array<{ boost_expires?: string | null; expires_at?: string | null }>);
    } else {
      const boostOnly = await sb
        .from("listings")
        .select("id, status, boost_expires")
        .eq("owner_id", userId)
        .eq("status", "active");
      if (!boostOnly.error && boostOnly.data) {
        out.expiringSoon = countExpiring(boostOnly.data as Array<{ boost_expires?: string | null; expires_at?: string | null }>);
      }
    }
  } catch {
    out.expiringSoon = null;
  }

  return out;
}
