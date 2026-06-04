"use client";

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { OfertaLocalUploadedAssetResult } from "./ofertasLocalesTypes";
import {
  validateOfertaLocalClientAssetFile,
  type OfertaLocalClientAssetKind,
} from "./ofertasLocalesClientUploadValidation";

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

  const form = new FormData();
  form.set("assetKind", input.assetKind);
  form.set("assetId", input.assetId);
  form.set("file", input.file, input.file.name || "upload");

  const res = await fetch("/api/ofertas-locales/assets/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
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

  if (!body.publicUrl || !/^https?:\/\//i.test(body.publicUrl)) {
    return { ok: false, error: "missing_url" };
  }

  return body;
}
