import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";

import { actorHasCapability, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { getFieldDiscoveryAssetStorageFolder, sanitizeFieldDiscoveryStorageSegment } from "@/app/lib/business/fieldDiscovery/storagePaths";
import { validateFieldDiscoveryUploadMeta } from "@/app/lib/business/fieldDiscovery/uploadValidation";
import { FIELD_DISCOVERY_UPLOAD_MIME_TYPES } from "@/app/lib/business/fieldDiscovery/constants";

export const runtime = "nodejs";

type UploadClientPayload = { businessId?: string; fileKind?: string; mimeType?: string; sizeBytes?: number };

function parseClientPayload(raw: string | null): UploadClientPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as UploadClientPayload;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function isPathAuthorized(pathname: string, businessId: string): boolean {
  const expectedFolder = getFieldDiscoveryAssetStorageFolder(sanitizeFieldDiscoveryStorageSegment(businessId, 36));
  return pathname.startsWith(`${expectedFolder}/`);
}

/** Client-direct Vercel Blob upload token handler (supports files above the server-form threshold). */
export async function POST(req: NextRequest) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: 401 });
  if (!actorHasCapability(access.actor, "upload_discovery_files")) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "blob_unconfigured", detail: "BLOB_READ_WRITE_TOKEN is not set on the server." }, { status: 503 });
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
        if (!payload?.businessId || !payload.fileKind || !payload.mimeType || !Number.isFinite(payload.sizeBytes)) {
          throw new Error("Invalid upload payload.");
        }
        if (!isPathAuthorized(pathname, payload.businessId)) {
          throw new Error("Upload path is not authorized for this business.");
        }
        const validation = validateFieldDiscoveryUploadMeta({ mimeType: payload.mimeType, sizeBytes: payload.sizeBytes as number });
        if (!validation.ok) {
          throw new Error(validation.detail);
        }
        return {
          allowedContentTypes: [...FIELD_DISCOVERY_UPLOAD_MIME_TYPES],
          maximumSizeInBytes: payload.sizeBytes as number,
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
