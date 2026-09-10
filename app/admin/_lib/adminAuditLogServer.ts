import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";

export type AdminAuditLogRow = {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  /** Master Operating Book §8/§22 — present only for rows written after 20260909140000 AND only
   * when the acting operator was resolvable at write time. NULL never means "unknown staff
   * member did something bad" — it means attribution wasn't available for this write. */
  actor_roster_id?: string | null;
  actor_auth_user_id?: string | null;
  actor_email?: string | null;
  actor_role?: string | null;
};

/**
 * Best-effort actor resolution for admin_audit_log writes. Deliberately duplicated (not imported)
 * from adminRosterAudit.ts's resolveActingRosterIdentity(): importing that module here would
 * create a dependency cycle risk (adminRosterAudit.ts itself calls appendAdminAuditLog as its
 * legacy-fallback write), and this needs to degrade to `null` on any failure — including when
 * admin_team_members or the cookie session is unavailable — without ever throwing and without
 * ever blocking the audit write itself.
 */
async function resolveActorForAuditWrite(): Promise<{
  actor_roster_id: string | null;
  actor_auth_user_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
}> {
  const empty = { actor_roster_id: null, actor_auth_user_id: null, actor_email: null, actor_role: null };
  try {
    const { cookies } = await import("next/headers");
    const { getAdminAuthUserIdFromCookies, getAdminOperatorEmailFromCookies } = await import(
      "@/app/lib/supabase/adminSession"
    );
    const jar = await cookies();
    const email = getAdminOperatorEmailFromCookies(jar);
    const authUserId = getAdminAuthUserIdFromCookies(jar);
    if (!email || !authUserId) return empty;

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("admin_team_members")
      .select("id, role, is_active")
      .eq("email", email)
      .maybeSingle();
    if (error || !data || !(data as { is_active: boolean }).is_active) return empty;

    return {
      actor_roster_id: String((data as { id: string }).id),
      actor_auth_user_id: authUserId,
      actor_email: email,
      actor_role: String((data as { role: string }).role ?? ""),
    };
  } catch {
    return empty;
  }
}

export async function appendAdminAuditLog(entry: {
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  meta?: Record<string, unknown>;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = getAdminSupabase();
    const actor = await resolveActorForAuditWrite();
    const { error } = await supabase.from("admin_audit_log").insert({
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      meta: entry.meta ?? {},
      ...actor,
    });
    if (error) {
      // The actor columns only exist once 20260909140000 is applied. Until then, retry once
      // without them so every existing caller keeps working exactly as before this change.
      if (isMissingActorColumnError(error.message)) {
        const retry = await supabase.from("admin_audit_log").insert({
          action: entry.action,
          target_type: entry.targetType ?? null,
          target_id: entry.targetId ?? null,
          meta: entry.meta ?? {},
        });
        if (retry.error) return { ok: false, error: retry.error.message };
        return { ok: true };
      }
      return { ok: false, error: error.message };
    }
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
 * and reader used by fetchAdminAuditLogRecent (no second log, no new table). This does not filter
 * by actor (no reliable index-worthy actor equality filter is exposed here yet); it filters only
 * on the fields every row has always carried.
 *
 * Actor columns (20260909140000_admin_audit_log_actor_attribution.sql, not yet applied remotely)
 * are requested with a graceful fallback: if the migration isn't applied yet, the initial select
 * fails with an unknown-column error and this retries without those columns, so this function
 * behaves identically to before the migration exists. Once applied, actor data appears with zero
 * further code changes.
 */
export type AdminAuditLogFilters = {
  action?: string;
  targetType?: string;
  targetId?: string;
  /** ISO date (inclusive lower bound on created_at). */
  since?: string;
  limit?: number;
};

const AUDIT_LOG_BASE_COLUMNS = "id, action, target_type, target_id, meta, created_at";
const AUDIT_LOG_WITH_ACTOR_COLUMNS = `${AUDIT_LOG_BASE_COLUMNS}, actor_roster_id, actor_auth_user_id, actor_email, actor_role`;

/** True only when the error names one of the (not-yet-migrated) actor columns specifically —
 * distinct from a genuinely missing `admin_audit_log` table, which callers still detect separately. */
function isMissingActorColumnError(message: string | undefined): boolean {
  return /actor_(roster_id|auth_user_id|email|role)/i.test(message ?? "");
}

export async function fetchAdminAuditLogFiltered(filters: AdminAuditLogFilters): Promise<{
  rows: AdminAuditLogRow[];
  mode: "live" | "empty" | "unavailable";
  detail?: string;
}> {
  try {
    const supabase = getAdminSupabase();
    let query = supabase
      .from("admin_audit_log")
      .select(AUDIT_LOG_WITH_ACTOR_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(filters.limit ?? 80);

    if (filters.action?.trim()) query = query.eq("action", filters.action.trim());
    if (filters.targetType?.trim()) query = query.eq("target_type", filters.targetType.trim());
    if (filters.targetId?.trim()) query = query.eq("target_id", filters.targetId.trim());
    if (filters.since?.trim()) query = query.gte("created_at", filters.since.trim());

    let { data, error } = await query;

    if (error && isMissingActorColumnError(error.message)) {
      // Pre-migration environment: retry with only the columns every admin_audit_log row has
      // always had, so this behaves exactly as it did before actor columns were added.
      let retryQuery = supabase
        .from("admin_audit_log")
        .select(AUDIT_LOG_BASE_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(filters.limit ?? 80);
      if (filters.action?.trim()) retryQuery = retryQuery.eq("action", filters.action.trim());
      if (filters.targetType?.trim()) retryQuery = retryQuery.eq("target_type", filters.targetType.trim());
      if (filters.targetId?.trim()) retryQuery = retryQuery.eq("target_id", filters.targetId.trim());
      if (filters.since?.trim()) retryQuery = retryQuery.gte("created_at", filters.since.trim());
      ({ data, error } = await retryQuery);
    }

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
    let { data, error } = await supabase
      .from("admin_audit_log")
      .select(AUDIT_LOG_WITH_ACTOR_COLUMNS)
      .in("target_id", ids)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error && isMissingActorColumnError(error.message)) {
      ({ data, error } = await supabase
        .from("admin_audit_log")
        .select(AUDIT_LOG_BASE_COLUMNS)
        .in("target_id", ids)
        .order("created_at", { ascending: false })
        .limit(limit));
    }

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
