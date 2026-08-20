import "server-only";

/**
 * Recursos Intake OS — Gate 4 private PDF storage. Bucket `recursos-source-documents` is
 * private (public=false, no anon/authenticated RLS policy on storage.objects) — every access
 * goes through the service-role admin client. No permanent public URL is ever generated;
 * `getSignedPdfUrl` produces short-lived links only, and only for admin viewing.
 */
import crypto from "node:crypto";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const RECURSOS_SOURCE_DOCUMENTS_BUCKET = "recursos-source-documents";
const SIGNED_URL_TTL_SECONDS = 300; // 5 minutes — admin viewing only, never a permanent link

export function sha256Hex(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function storagePathFor(sourceDocumentId: string): string {
  return `${sourceDocumentId}/original.pdf`;
}

export type UploadPdfResult = { ok: true; path: string } | { ok: false; error: string };

export async function uploadPdfToPrivateStorage(sourceDocumentId: string, buffer: Buffer): Promise<UploadPdfResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "Supabase is not configured." };
  try {
    const supabase = getAdminSupabase();
    const path = storagePathFor(sourceDocumentId);
    const { error } = await supabase.storage.from(RECURSOS_SOURCE_DOCUMENTS_BUCKET).upload(path, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, path };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
  }
}

export async function downloadPdfFromPrivateStorage(path: string): Promise<Buffer | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.storage.from(RECURSOS_SOURCE_DOCUMENTS_BUCKET).download(path);
    if (error || !data) return null;
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

/** Short-lived signed URL for admin-only viewing — never a permanent/public link. */
export async function getSignedPdfUrl(path: string): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.storage.from(RECURSOS_SOURCE_DOCUMENTS_BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    if (error || !data) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
