import "server-only";

/**
 * Recursos Intake OS — access to `public.source_documents`. Gate 3 writes source_type='url' rows
 * with no storage metadata; Gate 4 adds source_type='pdf' rows with storage/hash metadata.
 * Service-role only.
 */
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

const TABLE = "source_documents";

export type CreateSourceDocumentInput = {
  title: string;
  sourceUrl: string;
  createdBy: string | null;
};

export type SourceDocumentDbResult = { ok: true; id: string } | { ok: false; error: string };

export type CreatePdfSourceDocumentInput = {
  title: string;
  storageBucket: string;
  storagePath: string;
  fileSha256: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  sourceDate?: string | null;
  supersedesDocumentId?: string | null;
  createdBy: string | null;
};

export type SourceDocumentRow = {
  id: string;
  title: string;
  sourceType: string;
  storageBucket: string | null;
  storagePath: string | null;
  fileSha256: string | null;
  originalFilename: string | null;
  supersedesDocumentId: string | null;
  createdAt: string;
};

function rowFromDb(row: Record<string, unknown>): SourceDocumentRow {
  return {
    id: String(row.id),
    title: String(row.title),
    sourceType: String(row.source_type),
    storageBucket: (row.storage_bucket as string | null) ?? null,
    storagePath: (row.storage_path as string | null) ?? null,
    fileSha256: (row.file_sha256 as string | null) ?? null,
    originalFilename: (row.original_filename as string | null) ?? null,
    supersedesDocumentId: (row.supersedes_document_id as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

export async function dbCreatePdfSourceDocument(input: CreatePdfSourceDocumentInput): Promise<SourceDocumentDbResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "Supabase is not configured." };
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        title: input.title,
        source_type: "pdf",
        storage_bucket: input.storageBucket,
        storage_path: input.storagePath,
        file_sha256: input.fileSha256,
        original_filename: input.originalFilename,
        mime_type: input.mimeType,
        file_size_bytes: input.fileSizeBytes,
        source_date: input.sourceDate ?? null,
        supersedes_document_id: input.supersedesDocumentId ?? null,
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

/** Patches storage_path after upload — the path embeds the document's own id, so it can only be known post-insert. */
export async function dbSetSourceDocumentStoragePath(id: string, storagePath: string): Promise<SourceDocumentDbResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "Supabase is not configured." };
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.from(TABLE).update({ storage_path: storagePath }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed." };
  }
}

/** Duplicate-upload guard: returns the existing document row for this exact file hash, if any. */
export async function dbFindSourceDocumentByHash(fileSha256: string): Promise<SourceDocumentRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, title, source_type, storage_bucket, storage_path, file_sha256, original_filename, supersedes_document_id, created_at")
      .eq("file_sha256", fileSha256)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return rowFromDb(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function dbGetSourceDocument(id: string): Promise<SourceDocumentRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, title, source_type, storage_bucket, storage_path, file_sha256, original_filename, supersedes_document_id, created_at")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return rowFromDb(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

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
