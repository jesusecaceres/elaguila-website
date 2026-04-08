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
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("admin_audit_log")
      .select("id, action, target_type, target_id, meta, created_at")
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
    return {
      rows: [],
      mode: "unavailable",
      detail: e instanceof Error ? e.message : "unknown",
    };
  }
}
