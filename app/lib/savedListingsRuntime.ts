/**
 * Runtime reads/writes for Clasificados saves (Guardar).
 * Uses `saved_listings` only; legacy `user_saved_listings` is touched only when the canonical table is missing.
 *
 * Gate A2-SAVE-GLOBAL: select-then-insert (no PostgREST upsert / on_conflict).
 * Default payload: `{ user_id, listing_id }` only — optional G2A columns when explicitly provided.
 */
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { isLeonixDisplayAdId } from "@/app/lib/listingSaveDbKey";

const PRIMARY = "saved_listings" as const;
const LEGACY = "user_saved_listings" as const;

export type SavedListingWriteRow = {
  user_id: string;
  listing_id: string;
  category?: string | null;
  source_table?: string | null;
  source_id?: string | null;
  canonical_ad_id?: string | null;
};

function isMissingSavedTableError(err: PostgrestError | null | undefined): boolean {
  if (!err) return false;
  const code = err.code ?? "";
  const msg = (err.message ?? "").toLowerCase();
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    code === "PGRST204" ||
    (msg.includes("saved_listings") && (msg.includes("does not exist") || msg.includes("could not find")))
  );
}

function isLegacyTableUnavailable(err: PostgrestError | null | undefined): boolean {
  if (!err) return false;
  const code = err.code ?? "";
  const msg = (err.message ?? "").toLowerCase();
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    code === "PGRST204" ||
    code === "22P02" ||
    (msg.includes("user_saved_listings") &&
      (msg.includes("does not exist") || msg.includes("could not find") || msg.includes("invalid input syntax")))
  );
}

function isUniqueViolation(err: PostgrestError | null | undefined): boolean {
  return err?.code === "23505";
}

function buildSavedRow(userId: string, listingId: string, extras?: Partial<SavedListingWriteRow>): SavedListingWriteRow {
  const id = listingId.trim();
  const row: SavedListingWriteRow = {
    user_id: userId,
    listing_id: id,
  };
  if (!extras) return row;

  const category = extras.category?.trim();
  const sourceTable = extras.source_table?.trim();
  const sourceId = extras.source_id?.trim();
  const canonical = extras.canonical_ad_id?.trim();
  if (category) row.category = category;
  if (sourceTable) row.source_table = sourceTable;
  if (sourceId) row.source_id = sourceId;
  if (canonical) row.canonical_ad_id = canonical;
  return row;
}

/** Idempotent save — select then insert (no PostgREST upsert / on_conflict). */
async function insertSavedListingIfAbsent(
  sb: SupabaseClient,
  table: typeof PRIMARY | typeof LEGACY,
  row: SavedListingWriteRow,
): Promise<{ error: PostgrestError | null }> {
  const listingId = row.listing_id.trim();
  const userId = row.user_id;

  const existing = await sb
    .from(table)
    .select("listing_id")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .maybeSingle();
  if (existing.error) return { error: existing.error };
  if (existing.data) return { error: null };

  const inserted = await sb.from(table).insert(row);
  if (!inserted.error) return { error: null };
  if (isUniqueViolation(inserted.error)) return { error: null };
  return { error: inserted.error };
}

async function readSavedFromTable(
  sb: SupabaseClient,
  table: typeof PRIMARY | typeof LEGACY,
  userId: string,
  listingId: string,
): Promise<{ saved: boolean; error: PostgrestError | null }> {
  const { data, error } = await sb
    .from(table)
    .select("listing_id")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .maybeSingle();
  if (error) return { saved: false, error };
  return { saved: Boolean(data), error: null };
}

export async function readSavedListingForUser(
  sb: SupabaseClient,
  userId: string,
  listingId: string,
): Promise<{ saved: boolean; table: typeof PRIMARY | typeof LEGACY | null }> {
  const id = listingId.trim();
  if (!id) return { saved: false, table: null };

  const primary = await readSavedFromTable(sb, PRIMARY, userId, id);
  if (!primary.error) {
    return { saved: primary.saved, table: PRIMARY };
  }
  if (!isMissingSavedTableError(primary.error)) {
    return { saved: false, table: PRIMARY };
  }

  const legacyOnly = await readSavedFromTable(sb, LEGACY, userId, id);
  if (legacyOnly.error) return { saved: false, table: LEGACY };
  return { saved: legacyOnly.saved, table: LEGACY };
}

export async function upsertSavedListingForUser(
  sb: SupabaseClient,
  userId: string,
  listingId: string,
  extras?: Partial<SavedListingWriteRow>,
): Promise<{ error: PostgrestError | null; table: typeof PRIMARY | typeof LEGACY }> {
  const id = listingId.trim();
  if (!extras?.source_table && isLeonixDisplayAdId(id)) {
    return {
      error: {
        message: "Leonix display id cannot be used as saved_listings.listing_id",
        details: "",
        hint: "",
        code: "PGRST116",
      } as PostgrestError,
      table: PRIMARY,
    };
  }

  const row = buildSavedRow(userId, id, extras);

  const primary = await insertSavedListingIfAbsent(sb, PRIMARY, row);
  if (!primary.error) return { error: null, table: PRIMARY };
  if (!isMissingSavedTableError(primary.error)) return { error: primary.error, table: PRIMARY };

  const legacy = await insertSavedListingIfAbsent(sb, LEGACY, row);
  return { error: legacy.error, table: LEGACY };
}

/** All saved listing ids for dashboard Guardados (canonical table only when available). */
export async function listSavedListingIdsForUser(sb: SupabaseClient, userId: string): Promise<string[]> {
  const ids = new Set<string>();

  const mergeRows = (rows: Array<{ listing_id?: string }> | null) => {
    for (const row of rows ?? []) {
      const lid = String(row.listing_id ?? "").trim();
      if (lid) ids.add(lid);
    }
  };

  const primary = await sb
    .from(PRIMARY)
    .select("listing_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!primary.error) {
    mergeRows(primary.data as Array<{ listing_id?: string }>);
    return [...ids];
  }
  if (!isMissingSavedTableError(primary.error)) return [...ids];

  const legacy = await sb
    .from(LEGACY)
    .select("listing_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (!legacy.error) mergeRows(legacy.data as Array<{ listing_id?: string }>);

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
  if (legacy.error && isLegacyTableUnavailable(legacy.error)) {
    return { error: primary.error, table: PRIMARY };
  }
  return { error: legacy.error, table: LEGACY };
}
