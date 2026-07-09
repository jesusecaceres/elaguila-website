import { put } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";

import {
  OFERTAS_LOCALES_SERVER_UPLOAD_MAX_BYTES,
} from "@/app/lib/ofertas-locales/ofertasLocalesConstants";
import { ofertasLocalesOwnerIdFromBearer } from "@/app/lib/ofertas-locales/ofertasLocalesUploadServerAuth";
import {
  validateOfertaLocalClientAssetFile,
  type OfertaLocalClientAssetKind,
} from "@/app/lib/ofertas-locales/ofertasLocalesClientUploadValidation";
import { createOfertaLocalAssetStoragePath } from "@/app/lib/ofertas-locales/ofertasLocalesStoragePaths";
import type { OfertaLocalUploadedAssetResult } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";

export const runtime = "nodejs";

function isAssetKind(v: string): v is OfertaLocalClientAssetKind {
  return v === "flyer" || v === "coupon" || v === "logo";
}

function fail(
  status: number,
  error: string,
  detail?: string,
  errors?: string[]
): NextResponse<OfertaLocalUploadedAssetResult> {
  return NextResponse.json({ ok: false, error, detail, errors }, { status });
}

/**
 * Upload one Ofertas Locales draft flyer/coupon file to Vercel Blob (small files ≤ 4.5 MB).
 * Larger files use client-direct upload via /api/ofertas-locales/assets/client-upload.
 */
export async function POST(req: NextRequest) {
  const ownerUserId = await ofertasLocalesOwnerIdFromBearer(req);
  if (!ownerUserId) {
    return fail(401, "unauthorized", "Sign in to upload assets.");
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return fail(503, "blob_unconfigured", "BLOB_READ_WRITE_TOKEN is not set on the server.");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, "bad_form");
  }

  const assetKindRaw = String(form.get("assetKind") ?? "").trim().toLowerCase();
  const assetId = String(form.get("assetId") ?? "").trim();

  if (!isAssetKind(assetKindRaw) || !assetId) {
    return fail(400, "bad_request", "assetKind (flyer|coupon|logo) and assetId are required.");
  }

  const file = form.get("file");
  if (!(file instanceof Blob) || file.size < 1) {
    return fail(400, "missing_file");
  }

  if (file.size > OFERTAS_LOCALES_SERVER_UPLOAD_MAX_BYTES) {
    return fail(
      413,
      "file_too_large_for_server",
      "Este archivo debe subirse con carga directa. Intenta de nuevo desde el botón Subir archivo."
    );
  }

  const fileName = file instanceof File && file.name ? file.name : "upload.bin";
  const mimeType = (file.type || "").toLowerCase();

  const fileForValidation =
    file instanceof File ? file : new File([file], fileName, { type: mimeType || "application/octet-stream" });

  const validation = validateOfertaLocalClientAssetFile(fileForValidation, assetKindRaw);

  if (!validation.ok) {
    return fail(400, "validation_failed", validation.errors.join(" "), validation.errors);
  }

  const pathname = createOfertaLocalAssetStoragePath({
    ownerUserId,
    assetKind: assetKindRaw,
    assetId,
    fileName,
    mimeType,
  });

  if (!pathname) {
    return fail(400, "unsafe_filename", "File extension or type is not allowed.");
  }

  const uploaded = await put(pathname, file, {
    access: "public",
    token,
    addRandomSuffix: false,
    contentType: mimeType || undefined,
  });

  const result: OfertaLocalUploadedAssetResult = {
    ok: true,
    storagePath: uploaded.pathname ?? pathname,
    publicUrl: uploaded.url,
    fileName,
    mimeType,
    sizeBytes: file.size,
    assetType: validation.assetType,
  };

  return NextResponse.json(result);
}
