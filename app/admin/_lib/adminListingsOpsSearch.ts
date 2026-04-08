/**
 * Lightweight listing lookup for admin ops (unified search, user detail cross-links).
 */
import { getAdminSupabase } from "@/app/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AdminListingOpsRow = {
  id: string;
  title: string | null;
  category: string | null;
  status: string | null;
  owner_id: string | null;
  city: string | null;
  created_at: string | null;
};

function sanitizeIlike(s: string): string {
  return s.replace(/[%_,]/g, " ").trim();
}

export async function searchListingsForAdminOps(
  q: string,
  limit = 25
): Promise<{ rows: AdminListingOpsRow[]; error: string | null }> {
  const trimmed = q.trim();
  if (!trimmed) {
    return { rows: [], error: null };
  }

  const supabase = getAdminSupabase();
  const safe = sanitizeIlike(trimmed);
  const parts: string[] = [];

  if (UUID_REGEX.test(trimmed)) {
    parts.push(`id.eq.${trimmed}`);
    parts.push(`owner_id.eq.${trimmed}`);
  }

  if (safe.length >= 1) {
    const term = `%${safe}%`;
    parts.push(`title.ilike.${term}`);
    parts.push(`city.ilike.${term}`);
  }

  const compact = trimmed.replace(/-/g, "").toLowerCase();
  if (compact.length >= 6 && compact.length <= 32 && /^[0-9a-f]+$/.test(compact)) {
    parts.push(`id.ilike.%${compact}%`);
  }

  if (parts.length === 0) {
    return { rows: [], error: null };
  }

  const { data, error } = await supabase
    .from("listings")
    .select("id,title,category,status,owner_id,city,created_at")
    .or(parts.join(","))
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 50));

  if (error) {
    return { rows: [], error: error.message };
  }

  return { rows: (data as AdminListingOpsRow[]) ?? [], error: null };
}
