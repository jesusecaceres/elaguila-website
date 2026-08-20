import "server-only";

/**
 * Recursos Intake OS — Gate 3 access to `public.source_documents`. Gate 3 only ever writes
 * source_type='url' rows with no storage bucket/path (that is Gate 4's PDF pipeline). Service-role
 * only.
 */
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

const TABLE = "source_documents";

export type CreateSourceDocumentInput = {
  title: string;
  sourceUrl: string;
  createdBy: string | null;
};

export type SourceDocumentDbResult = { ok: true; id: string } | { ok: false; error: string };

export async function dbCreateUrlSourceDocument(input: CreateSourceDocumentInput): Promise<SourceDocumentDbResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "Supabase is not configured." };
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        title: input.title,
        source_type: "url",
        source_url: input.sourceUrl,
        source_date: new Date().toISOString().slice(0, 10),
        created_by: input.createdBy,
      })
      .select("id")
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Source document creation failed — no row returned." };
    return { ok: true, id: String((data as { id: string }).id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Source document creation failed." };
  }
}
