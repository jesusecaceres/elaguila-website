import "server-only";

/**
 * Recursos Spanish Bridge (Gate ES-2F) — narrow server-only access to
 * community_resources.spanish_status / spanish_source_type. Deliberately NOT a generic
 * column-update function: these are the only two columns this module ever touches, and no
 * server action calling this exists yet — that lands in Gate ES-4 ("Marcar español revisado").
 * This module exists now so later gates have a single, already-reviewed write path instead of
 * inventing one under time pressure. No client component may import this (server-only guard).
 */
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

const TABLE = "community_resources";

export type SpanishStatus = "official_spanish" | "official_english_only" | "verified_translation" | "needs_translation_review" | "not_available";
export type SpanishSourceType = "official_spanish_source" | "official_bilingual_source" | "ai_translation_reviewed" | "staff_written" | "none";

export type ResourceSpanishStatusRow = {
  id: string;
  spanishStatus: SpanishStatus;
  spanishSourceType: SpanishSourceType | null;
};

export async function dbGetCommunityResourceSpanishStatus(resourceId: string): Promise<ResourceSpanishStatusRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from(TABLE).select("id, spanish_status, spanish_source_type").eq("id", resourceId).maybeSingle();
    if (error || !data) return null;
    return {
      id: String((data as { id: string }).id),
      spanishStatus: (data as { spanish_status: SpanishStatus }).spanish_status,
      spanishSourceType: (data as { spanish_source_type: SpanishSourceType | null }).spanish_source_type ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Spanish Bridge (Gate ES-6A/B) — bulk read for the reconciliation queue and command-center
 * counts. community_resources.spanish_status/spanish_source_type are not exposed on
 * ResourceRecord (see rowToResourceRecord in communityResourcesDb.ts) precisely so this module
 * stays the single place that reads/writes them; a bulk queue needs all 65+ rows in one query
 * rather than one dbGetCommunityResourceSpanishStatus() call per resource. Read-only, no join —
 * callers cross-reference by `id` against their own dbListCommunityResources() result.
 */
export async function dbListAllCommunityResourceSpanishStatuses(): Promise<{ rows: ResourceSpanishStatusRow[]; unavailable: boolean }> {
  if (!isSupabaseAdminConfigured()) return { rows: [], unavailable: true };
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from(TABLE).select("id, spanish_status, spanish_source_type");
    if (error) return { rows: [], unavailable: true };
    return {
      rows: (data ?? []).map((row) => ({
        id: String((row as { id: string }).id),
        spanishStatus: (row as { spanish_status: SpanishStatus }).spanish_status,
        spanishSourceType: (row as { spanish_source_type: SpanishSourceType | null }).spanish_source_type ?? null,
      })),
      unavailable: false,
    };
  } catch {
    return { rows: [], unavailable: true };
  }
}

export type SetSpanishStatusResult = { ok: true } | { ok: false; error: string };

/**
 * Writes ONLY spanish_status/spanish_source_type — never any other column. `actorEmail` is
 * accepted for future audit-write call sites (Gate ES-4) but this function itself does not audit
 * or emit a verification_event; the caller (a future server action) owns that, matching the
 * existing pattern where DB adapters stay thin and actions own audit/event side effects.
 */
export async function dbSetCommunityResourceSpanishStatus(
  resourceId: string,
  status: SpanishStatus,
  sourceType: SpanishSourceType | null,
): Promise<SetSpanishStatusResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "Supabase is not configured." };
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase
      .from(TABLE)
      .update({ spanish_status: status, spanish_source_type: sourceType, updated_at: new Date().toISOString() })
      .eq("id", resourceId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Spanish status update failed." };
  }
}
