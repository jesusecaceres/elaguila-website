"use client";

/**
 * Program 4, Gate 4A — client-side upload helper for canvassing/discovery files. Mirrors the
 * proven two-tier pattern from app/lib/ofertas-locales/ofertasLocalesAssetUpload.ts exactly:
 * server-form upload for files <= FIELD_DISCOVERY_SERVER_UPLOAD_MAX_BYTES, client-direct Vercel
 * Blob upload (via an upload-intent + client-upload token handshake) above that threshold. Uses
 * the existing staff admin cookie session (credentials: "include") — this is a staff-only admin
 * surface, not a bearer-token owner surface.
 */
import { upload } from "@vercel/blob/client";
import { FIELD_DISCOVERY_SERVER_UPLOAD_MAX_BYTES } from "./constants";
import type { SourceFileKind } from "./types";

export type FieldDiscoveryUploadResult =
  | { ok: true; sourceFileId: string; storagePath: string; publicUrl: string }
  | { ok: false; error: string; detail?: string };

type UploadIntentResponse = {
  ok: boolean;
  pathname?: string;
  clientPayload?: string;
  error?: string;
  detail?: string;
};

async function uploadViaClientBlob(input: {
  file: File;
  businessId: string;
  fileKind: SourceFileKind;
  relatedDiscoverySessionId: string | null;
}): Promise<FieldDiscoveryUploadResult> {
  const intentRes = await fetch("/api/admin/field-discovery/assets/upload-intent", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businessId: input.businessId,
      fileKind: input.fileKind,
      fileName: input.file.name || "upload.bin",
      mimeType: input.file.type || "",
      sizeBytes: input.file.size,
    }),
  });
  let intent: UploadIntentResponse;
  try {
    intent = (await intentRes.json()) as UploadIntentResponse;
  } catch {
    return { ok: false, error: "bad_response", detail: `HTTP ${intentRes.status}` };
  }
  if (!intentRes.ok || !intent.ok || !intent.pathname || !intent.clientPayload) {
    return { ok: false, error: intent.error ?? "upload_intent_failed", detail: intent.detail };
  }

  const uploaded = await upload(intent.pathname, input.file, {
    access: "public",
    handleUploadUrl: "/api/admin/field-discovery/assets/client-upload",
    clientPayload: intent.clientPayload,
    contentType: input.file.type || undefined,
  });

  const finalizeRes = await fetch("/api/admin/field-discovery/assets/upload-intent", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businessId: input.businessId,
      fileKind: input.fileKind,
      relatedDiscoverySessionId: input.relatedDiscoverySessionId,
      storagePath: uploaded.pathname ?? intent.pathname,
      publicUrl: uploaded.url,
      mimeType: input.file.type || "",
      originalFilename: input.file.name || "upload.bin",
      sizeBytes: input.file.size,
    }),
  });
  const finalizeBody = (await finalizeRes.json().catch(() => null)) as { ok?: boolean; id?: string; error?: string } | null;
  if (!finalizeRes.ok || !finalizeBody?.ok || !finalizeBody.id) {
    return { ok: false, error: finalizeBody?.error ?? "finalize_failed" };
  }
  return { ok: true, sourceFileId: finalizeBody.id, storagePath: uploaded.pathname ?? intent.pathname, publicUrl: uploaded.url };
}

async function uploadViaServerForm(input: {
  file: File;
  businessId: string;
  fileKind: SourceFileKind;
  relatedDiscoverySessionId: string | null;
}): Promise<FieldDiscoveryUploadResult> {
  const form = new FormData();
  form.set("businessId", input.businessId);
  form.set("fileKind", input.fileKind);
  if (input.relatedDiscoverySessionId) form.set("relatedDiscoverySessionId", input.relatedDiscoverySessionId);
  form.set("file", input.file, input.file.name || "upload");

  const res = await fetch("/api/admin/field-discovery/assets/upload", {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const body = (await res.json().catch(() => null)) as { ok?: boolean; id?: string; storagePath?: string; publicUrl?: string; error?: string } | null;
  if (!res.ok || !body?.ok || !body.id || !body.storagePath || !body.publicUrl) {
    return { ok: false, error: body?.error ?? "upload_failed" };
  }
  return { ok: true, sourceFileId: body.id, storagePath: body.storagePath, publicUrl: body.publicUrl };
}

export async function uploadFieldDiscoveryFile(input: {
  file: File;
  businessId: string;
  fileKind: SourceFileKind;
  relatedDiscoverySessionId?: string | null;
}): Promise<FieldDiscoveryUploadResult> {
  const relatedDiscoverySessionId = input.relatedDiscoverySessionId ?? null;
  if (input.file.size <= 0) return { ok: false, error: "empty_file" };
  return input.file.size > FIELD_DISCOVERY_SERVER_UPLOAD_MAX_BYTES
    ? uploadViaClientBlob({ ...input, relatedDiscoverySessionId })
    : uploadViaServerForm({ ...input, relatedDiscoverySessionId });
}
