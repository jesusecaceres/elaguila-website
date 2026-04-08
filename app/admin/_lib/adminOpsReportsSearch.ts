/**
 * listing_reports lookup for unified customer ops (support traces a listing UUID).
 */
import { getAdminSupabase } from "@/app/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AdminOpsReportRow = {
  id: string;
  listing_id: string;
  reporter_id: string | null;
  reason: string;
  created_at: string | null;
  status: string | null;
};

function sanitizeIlike(s: string): string {
  return s.replace(/[%_,]/g, " ").trim();
}

export async function searchListingReportsForOps(
  q: string,
  limit = 20
): Promise<{ rows: AdminOpsReportRow[]; error: string | null }> {
  const trimmed = q.trim();
  if (!trimmed) return { rows: [], error: null };

  const supabase = getAdminSupabase();
  const safe = sanitizeIlike(trimmed);
  const parts: string[] = [];

  if (UUID_REGEX.test(trimmed)) {
    parts.push(`id.eq.${trimmed}`);
    parts.push(`listing_id.eq.${trimmed}`);
    parts.push(`reporter_id.eq.${trimmed}`);
  }

  if (safe.length >= 2) {
    const term = `%${safe}%`;
    parts.push(`reason.ilike.${term}`);
    parts.push(`listing_id.ilike.${term}`);
  }

  if (parts.length === 0) return { rows: [], error: null };

  const { data, error } = await supabase
    .from("listing_reports")
    .select("id,listing_id,reporter_id,reason,created_at,status")
    .or(parts.join(","))
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 40));

  if (error) return { rows: [], error: error.message };
  return { rows: (data as AdminOpsReportRow[]) ?? [], error: null };
}
