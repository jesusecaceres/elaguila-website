import { NextResponse, type NextRequest } from "next/server";

import {
  validateOfertaLocalClientAssetUploadMeta,
  type OfertaLocalClientAssetKind,
} from "@/app/lib/ofertas-locales/ofertasLocalesClientUploadValidation";
import { createOfertaLocalAssetStoragePath } from "@/app/lib/ofertas-locales/ofertasLocalesStoragePaths";
import { ofertasLocalesOwnerIdFromBearer } from "@/app/lib/ofertas-locales/ofertasLocalesUploadServerAuth";

export const runtime = "nodejs";

function isAssetKind(v: string): v is OfertaLocalClientAssetKind {
  return v === "flyer" || v === "coupon" || v === "logo";
}

/**
 * Reserve an authorized Vercel Blob pathname before client-direct upload.
 * Validates MIME/size without receiving the file body (avoids 4.5 MB function limit).
 */
export async function POST(req: NextRequest) {
  const ownerUserId = await ofertasLocalesOwnerIdFromBearer(req);
  if (!ownerUserId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const assetKindRaw = String(o.assetKind ?? "").trim().toLowerCase();
  const assetId = String(o.assetId ?? "").trim();
  const fileName = String(o.fileName ?? "").trim() || "upload.bin";
  const mimeType = String(o.mimeType ?? "").trim().toLowerCase();
  const sizeBytes = typeof o.sizeBytes === "number" ? o.sizeBytes : Number(o.sizeBytes);

  if (!isAssetKind(assetKindRaw) || !assetId || !Number.isFinite(sizeBytes)) {
    return NextResponse.json(
      { ok: false, error: "bad_request", detail: "assetKind, assetId, mimeType, and sizeBytes are required." },
      { status: 400 }
    );
  }

  const validation = validateOfertaLocalClientAssetUploadMeta({
    assetKind: assetKindRaw,
    mimeType,
    sizeBytes,
  });

  if (!validation.ok || !validation.assetType) {
    return NextResponse.json(
      { ok: false, error: "validation_failed", errors: validation.errors },
      { status: 400 }
    );
  }

  const pathname = createOfertaLocalAssetStoragePath({
    ownerUserId,
    assetKind: assetKindRaw,
    assetId,
    fileName,
    mimeType,
  });

  if (!pathname) {
    return NextResponse.json(
      { ok: false, error: "unsafe_filename", detail: "File extension or type is not allowed." },
      { status: 400 }
    );
  }

  const clientPayload = JSON.stringify({
    ownerUserId,
    assetKind: assetKindRaw,
    assetId,
    assetType: validation.assetType,
    mimeType,
    sizeBytes,
  });

  return NextResponse.json({
    ok: true,
    pathname,
    clientPayload,
    assetType: validation.assetType,
  });
}
