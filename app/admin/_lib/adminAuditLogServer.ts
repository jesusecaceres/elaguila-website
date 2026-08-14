import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";

export type AdminAuditLogRow = {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
};

export async function appendAdminAuditLog(entry: {
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  meta?: Record<string, unknown>;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.from("admin_audit_log").insert({
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      meta: entry.meta ?? {},
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

export async function fetchAdminAuditLogRecent(limit: number): Promise<{
  rows: AdminAuditLogRow[];
  mode: "live" | "empty" | "unavailable";
  detail?: string;
}> {
  return fetchAdminAuditLogFiltered({ limit });
}

/**
 * Package E Build E3, Gate 3 — narrow, truthful filtering over the SAME `admin_audit_log` table
 * and reader used by fetchAdminAuditLogRecent (no second log, no new table). `admin_audit_log`
 * has no actor/operator column at all (confirmed by tracing every write call site — every
 * mutation writes only action/target_type/target_id/meta/created_at), so this cannot filter by
 * actor; it filters only on fields the schema truthfully carries.
 */
export type AdminAuditLogFilters = {
  action?: string;
  targetType?: string;
  targetId?: string;
  /** ISO date (inclusive lower bound on created_at). */
  since?: string;
  limit?: number;
};

export async function fetchAdminAuditLogFiltered(filters: AdminAuditLogFilters): Promise<{
  rows: AdminAuditLogRow[];
  mode: "live" | "empty" | "unavailable";
  detail?: string;
}> {
  try {
    const supabase = getAdminSupabase();
    let query = supabase
      .from("admin_audit_log")
      .select("id, action, target_type, target_id, meta, created_at")
      .order("created_at", { ascending: false })
      .limit(filters.limit ?? 80);

    if (filters.action?.trim()) query = query.eq("action", filters.action.trim());
    if (filters.targetType?.trim()) query = query.eq("target_type", filters.targetType.trim());
    if (filters.targetId?.trim()) query = query.eq("target_id", filters.targetId.trim());
    if (filters.since?.trim()) query = query.gte("created_at", filters.since.trim());

    const { data, error } = await query;

    if (error) {
      const msg = error.message ?? "";
      if (/relation|does not exist|schema cache/i.test(msg)) {
        return { rows: [], mode: "unavailable", detail: "admin_audit_log table missing — apply migrations." };
      }
      return { rows: [], mode: "unavailable", detail: msg };
    }
    const rows = (data ?? []) as AdminAuditLogRow[];
    return { rows, mode: rows.length ? "live" : "empty" };
  } catch (e) {
    return {
      rows: [],
      mode: "unavailable",
      detail: e instanceof Error ? e.message : "unknown",
    };
  }
}

/**
 * Package E Build E3, Gate 3 — audit history truthfully linked to one customer's identity and
 * owned listings. `target_id` is matched EXACTLY against the profile id or one of the owner's
 * real listing ids — never a fuzzy match on name/email/business name. Because `target_type` is
 * free text set per call site (not a fixed enum), this does not filter by target_type: a row is
 * included whenever its target_id exactly equals one of the given ids, regardless of what entity
 * label the writer used, since a UUID collision across unrelated entities is not a real risk.
 */
export async function fetchAdminAuditLogForTarget(
  targetIds: string[],
  limit = 20,
): Promise<{ rows: AdminAuditLogRow[]; mode: "live" | "empty" | "unavailable"; detail?: string }> {
  const ids = [...new Set(targetIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) return { rows: [], mode: "empty" };
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("admin_audit_log")
      .select("id, action, target_type, target_id, meta, created_at")
      .in("target_id", ids)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      const msg = error.message ?? "";
      if (/relation|does not exist|schema cache/i.test(msg)) {
        return { rows: [], mode: "unavailable", detail: "admin_audit_log table missing — apply migrations." };
      }
      return { rows: [], mode: "unavailable", detail: msg };
    }
    const rows = (data ?? []) as AdminAuditLogRow[];
    return { rows, mode: rows.length ? "live" : "empty" };
  } catch (e) {
    return { rows: [], mode: "unavailable", detail: e instanceof Error ? e.message : "unknown" };
  }
}
