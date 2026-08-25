import "server-only";

/**
 * Recursos Intake OS — Gate 5 single-field resource update. Mirrors the isolated-column-update
 * pattern already proven by `dbSetCommunityResourceActive`/`dbSetCommunityResourceVerificationStatus`
 * in communityResourcesDb.ts (never the full `recordToRow` path, which would clobber unrelated
 * columns) — kept in this module rather than added to that file since the field allow-list and
 * type coercion here are Intake-OS-specific, not core Data OS concerns.
 *
 * The field name -> column mapping comes exclusively from WRITABLE_FIELD_COLUMNS
 * (resourceChangeDetection.ts) — this function refuses any field not in that allow-list. No
 * caller may pass an arbitrary client-supplied column name.
 */
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { WRITABLE_FIELD_COLUMNS } from "@/app/lib/recursos/intake/resourceChangeDetection";

const TABLE = "community_resources";

export type UpdateSingleFieldResult = { ok: true } | { ok: false; error: string };

function coerceValueForColumn(fieldName: string, column: string, rawValue: string): unknown {
  if (fieldName === "is24Hours") return rawValue.trim().toLowerCase() === "true";
  if (fieldName === "languages") return rawValue.split(";").map((s) => s.trim()).filter(Boolean);
  return rawValue;
}

/**
 * Updates exactly ONE column on ONE resource. `fieldName` must be a key of
 * WRITABLE_FIELD_COLUMNS — anything else is refused before any query runs.
 */
export async function dbUpdateSingleResourceField(resourceId: string, fieldName: string, rawProposedValue: string, actorEmail: string | null): Promise<UpdateSingleFieldResult> {
  const column = WRITABLE_FIELD_COLUMNS[fieldName];
  if (!column) return { ok: false, error: `Field "${fieldName}" is not in the writable allow-list.` };
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "Supabase is not configured." };

  try {
    const supabase = getAdminSupabase();
    const row: Record<string, unknown> = {
      [column]: coerceValueForColumn(fieldName, column, rawProposedValue),
      updated_at: new Date().toISOString(),
      updated_by: actorEmail ?? null,
    };
    const { error } = await supabase.from(TABLE).update(row).eq("id", resourceId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Field update failed." };
  }
}
