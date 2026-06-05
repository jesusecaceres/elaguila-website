/**
 * Runtime reads/writes for Clasificados saves (Guardar).
 * Prefers canonical `saved_listings`; falls back to legacy `user_saved_listings` when the
 * canonical table is missing in an environment (migration not yet applied).
 */
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

const PRIMARY = "saved_listings" as const;
const LEGACY = "user_saved_listings" as const;

function isMissingSavedTableError(err: PostgrestError | null | undefined): boolean {
  if (!err) return false;
  const code = err.code ?? "";
  const msg = (err.message ?? "").toLowerCase();
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    code === "PGRST204" ||
    msg.includes("saved_listings") && (msg.includes("does not exist") || msg.includes("could not find"))
  );
}

export async function readSavedListingForUser(
  sb: SupabaseClient,
  userId: string,
  listingId: string,
): Promise<{ saved: boolean; table: typeof PRIMARY | typeof LEGACY | null }> {
  const id = listingId.trim();
  if (!id) return { saved: false, table: null };

  const primary = await sb.from(PRIMARY).select("listing_id").eq("user_id", userId).eq("listing_id", id).maybeSingle();
  if (!primary.error) return { saved: Boolean(primary.data), table: PRIMARY };
  if (!isMissingSavedTableError(primary.error)) return { saved: false, table: PRIMARY };

  const legacy = await sb.from(LEGACY).select("listing_id").eq("user_id", userId).eq("listing_id", id).maybeSingle();
  if (legacy.error) return { saved: false, table: LEGACY };
  return { saved: Boolean(legacy.data), table: LEGACY };
}

export async function upsertSavedListingForUser(
  sb: SupabaseClient,
  userId: string,
  listingId: string,
): Promise<{ error: PostgrestError | null; table: typeof PRIMARY | typeof LEGACY }> {
  const id = listingId.trim();
  const row = { user_id: userId, listing_id: id };

  const primary = await sb.from(PRIMARY).upsert(row, { onConflict: "user_id,listing_id" });
  if (!primary.error) return { error: null, table: PRIMARY };
  if (!isMissingSavedTableError(primary.error)) return { error: primary.error, table: PRIMARY };

  const legacy = await sb.from(LEGACY).upsert(row, { onConflict: "user_id,listing_id" });
  return { error: legacy.error, table: LEGACY };
}

/** All saved listing ids for dashboard Guardados (canonical + legacy, deduped). */
export async function listSavedListingIdsForUser(sb: SupabaseClient, userId: string): Promise<string[]> {
  const ids = new Set<string>();

  const primary = await sb
    .from(PRIMARY)
    .select("listing_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (!primary.error) {
    for (const row of primary.data ?? []) {
      const lid = String((row as { listing_id?: string }).listing_id ?? "").trim();
      if (lid) ids.add(lid);
    }
    return [...ids];
  }
  if (!isMissingSavedTableError(primary.error)) return [...ids];

  const legacy = await sb
    .from(LEGACY)
    .select("listing_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (legacy.error) return [...ids];
  for (const row of legacy.data ?? []) {
    const lid = String((row as { listing_id?: string }).listing_id ?? "").trim();
    if (lid) ids.add(lid);
  }
  return [...ids];
}

export async function deleteSavedListingForUser(
  sb: SupabaseClient,
  userId: string,
  listingId: string,
): Promise<{ error: PostgrestError | null; table: typeof PRIMARY | typeof LEGACY }> {
  const id = listingId.trim();

  const primary = await sb.from(PRIMARY).delete().eq("user_id", userId).eq("listing_id", id);
  if (!primary.error) return { error: null, table: PRIMARY };
  if (!isMissingSavedTableError(primary.error)) return { error: primary.error, table: PRIMARY };

  const legacy = await sb.from(LEGACY).delete().eq("user_id", userId).eq("listing_id", id);
  return { error: legacy.error, table: LEGACY };
}
