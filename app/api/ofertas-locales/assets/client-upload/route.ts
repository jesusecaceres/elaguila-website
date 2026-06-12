import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";

import {
  OFERTAS_LOCALES_CLIENT_UPLOAD_COUPON_MIME_TYPES,
  OFERTAS_LOCALES_CLIENT_UPLOAD_FLYER_MIME_TYPES,
} from "@/app/lib/ofertas-locales/ofertasLocalesConstants";
import {
  getOfertaLocalClientUploadMaxBytes,
  validateOfertaLocalClientAssetUploadMeta,
  type OfertaLocalClientAssetKind,
} from "@/app/lib/ofertas-locales/ofertasLocalesClientUploadValidation";
import {
  getOfertaLocalAssetStorageFolder,
  sanitizeOfertaLocalStorageSegment,
} from "@/app/lib/ofertas-locales/ofertasLocalesStoragePaths";
import { ofertasLocalesOwnerIdFromBearer } from "@/app/lib/ofertas-locales/ofertasLocalesUploadServerAuth";
import type { OfertaLocalDraftAssetType } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";

export const runtime = "nodejs";

type UploadClientPayload = {
  ownerUserId?: string;
  assetKind?: OfertaLocalClientAssetKind;
  assetId?: string;
  assetType?: OfertaLocalDraftAssetType;
  mimeType?: string;
  sizeBytes?: number;
};

function parseClientPayload(raw: string | null): UploadClientPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as UploadClientPayload;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function allowedMimesForKind(kind: OfertaLocalClientAssetKind): string[] {
  return kind === "flyer"
    ? [...OFERTAS_LOCALES_CLIENT_UPLOAD_FLYER_MIME_TYPES]
    : [...OFERTAS_LOCALES_CLIENT_UPLOAD_COUPON_MIME_TYPES];
}

function isPathAuthorized(pathname: string, ownerUserId: string, payload: UploadClientPayload): boolean {
  const owner = sanitizeOfertaLocalStorageSegment(ownerUserId, 36);
  const assetKind = payload.assetKind;
  const assetId = payload.assetId;
  if (!assetKind || !assetId) return false;
  const expectedFolder = getOfertaLocalAssetStorageFolder({
    ownerUserId,
    assetKind,
    assetId,
  });
  return pathname.startsWith(`${expectedFolder}/`);
}

/**
 * Client-direct Vercel Blob upload token handler (supports files > 4.5 MB via multipart).
 */
export async function POST(req: NextRequest) {
  const ownerUserId = await ofertasLocalesOwnerIdFromBearer(req);
  if (!ownerUserId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "blob_unconfigured", detail: "BLOB_READ_WRITE_TOKEN is not set on the server." },
      { status: 503 }
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      token,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = parseClientPayload(clientPayload);
        if (!payload?.assetKind || !payload.assetType || !payload.mimeType || !payload.sizeBytes) {
          throw new Error("Invalid upload payload.");
        }
        if (payload.ownerUserId !== ownerUserId) {
          throw new Error("Unauthorized upload path.");
        }
        if (!isPathAuthorized(pathname, ownerUserId, payload)) {
          throw new Error("Upload path is not authorized.");
        }

        const validation = validateOfertaLocalClientAssetUploadMeta({
          assetKind: payload.assetKind,
          mimeType: payload.mimeType,
          sizeBytes: payload.sizeBytes,
        });

        if (!validation.ok || validation.assetType !== payload.assetType) {
          throw new Error(validation.errors.join(" ") || "File validation failed.");
        }

        const maxBytes = getOfertaLocalClientUploadMaxBytes(payload.assetType);

        return {
          allowedContentTypes: allowedMimesForKind(payload.assetKind),
          maximumSizeInBytes: maxBytes,
          addRandomSuffix: false,
          tokenPayload: clientPayload,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload token failed.";
    return NextResponse.json({ ok: false, error: "upload_token_failed", detail: message }, { status: 400 });
  }
}
