"use client";

import { upload } from "@vercel/blob/client";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import {
  OFERTAS_LOCALES_SERVER_UPLOAD_MAX_BYTES,
} from "@/app/lib/ofertas-locales/ofertasLocalesConstants";
import type { OfertaLocalUploadedAssetResult } from "./ofertasLocalesTypes";
import {
  validateOfertaLocalClientAssetFile,
  type OfertaLocalClientAssetKind,
} from "./ofertasLocalesClientUploadValidation";

type UploadIntentResponse = {
  ok: boolean;
  pathname?: string;
  clientPayload?: string;
  assetType?: OfertaLocalUploadedAssetResult["assetType"];
  error?: string;
  errors?: string[];
  detail?: string;
};

async function uploadViaClientBlob(input: {
  file: File;
  assetKind: OfertaLocalClientAssetKind;
  assetId: string;
  accessToken: string;
}): Promise<OfertaLocalUploadedAssetResult> {
  const intentRes = await fetch("/api/ofertas-locales/assets/upload-intent", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assetKind: input.assetKind,
      assetId: input.assetId,
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
    return {
      ok: false,
      error: intent.error ?? "upload_intent_failed",
      detail: intent.detail,
      errors: intent.errors,
    };
  }

  const uploaded = await upload(intent.pathname, input.file, {
    access: "public",
    handleUploadUrl: "/api/ofertas-locales/assets/client-upload",
    clientPayload: intent.clientPayload,
    multipart: input.file.size > OFERTAS_LOCALES_SERVER_UPLOAD_MAX_BYTES,
    headers: { Authorization: `Bearer ${input.accessToken}` },
    contentType: input.file.type || undefined,
  });

  return {
    ok: true,
    storagePath: uploaded.pathname ?? intent.pathname,
    publicUrl: uploaded.url,
    fileName: input.file.name || "upload.bin",
    mimeType: input.file.type || "",
    sizeBytes: input.file.size,
    assetType: intent.assetType,
  };
}

async function uploadViaServerForm(input: {
  file: File;
  assetKind: OfertaLocalClientAssetKind;
  assetId: string;
  accessToken: string;
}): Promise<OfertaLocalUploadedAssetResult> {
  const form = new FormData();
  form.set("assetKind", input.assetKind);
  form.set("assetId", input.assetId);
  form.set("file", input.file, input.file.name || "upload");

  const res = await fetch("/api/ofertas-locales/assets/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${input.accessToken}` },
    body: form,
  });

  let body: OfertaLocalUploadedAssetResult;
  try {
    body = (await res.json()) as OfertaLocalUploadedAssetResult;
  } catch {
    return { ok: false, error: "bad_response", detail: `HTTP ${res.status}` };
  }

  if (!res.ok || !body.ok) {
    return {
      ok: false,
      error: body.error ?? "upload_failed",
      detail: body.detail,
      errors: body.errors,
    };
  }

  return body;
}

export async function uploadOfertaLocalDraftAsset(input: {
  file: File;
  assetKind: OfertaLocalClientAssetKind;
  assetId: string;
}): Promise<OfertaLocalUploadedAssetResult> {
  const clientCheck = validateOfertaLocalClientAssetFile(input.file, input.assetKind);
  if (!clientCheck.ok) {
    return { ok: false, error: "validation_failed", errors: clientCheck.errors };
  }

  const sb = createSupabaseBrowserClient();
  const { data } = await sb.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    return { ok: false, error: "unauthorized", detail: "Sign in to upload assets." };
  }

  const useClientBlob = input.file.size > OFERTAS_LOCALES_SERVER_UPLOAD_MAX_BYTES;
  const body = useClientBlob
    ? await uploadViaClientBlob({ ...input, accessToken })
    : await uploadViaServerForm({ ...input, accessToken });

  if (!body.ok) {
    return body;
  }

  if (!body.publicUrl || !/^https?:\/\//i.test(body.publicUrl)) {
    return { ok: false, error: "missing_url" };
  }

  return body;
}
