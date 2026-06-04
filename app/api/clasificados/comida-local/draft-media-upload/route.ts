import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";

import { comidaLocalOwnerIdFromBearer } from "@/app/lib/clasificados/comida-local/comidaLocalPublishServerAuth";
import {
  COMIDA_LOCAL_ACCEPTED_IMAGE_MIME,
  COMIDA_LOCAL_IMAGE_MAX_BYTES,
  validateComidaLocalImageRole,
} from "@/app/lib/clasificados/comida-local/comidaLocalImageValidation";
import type { ComidaLocalImageRole, ComidaLocalUploadedImage } from "@/app/lib/clasificados/comida-local/comidaLocalTypes";

export const runtime = "nodejs";

function sanitizeFilename(name: string): string {
  const base = String(name ?? "")
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "")
    .slice(0, 80);
  return base || "upload.jpg";
}

function ownerPathSegment(ownerUserId: string | null, draftListingId: string): string {
  if (ownerUserId) {
    return ownerUserId.replace(/[^a-zA-Z0-9-]+/g, "").slice(0, 36);
  }
  const safeDraft = draftListingId.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 80) || "anon";
  return `anon-${safeDraft}`;
}

/**
 * Upload one Comida Local draft image to Vercel Blob (public HTTPS).
 * No DB write, publish, analytics, or payment.
 */
export async function POST(req: NextRequest) {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error: "blob_unconfigured",
        detail: "BLOB_READ_WRITE_TOKEN is not set on the server.",
      },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_form" }, { status: 400 });
  }

  const draftListingId = String(form.get("draftListingId") ?? "").trim();
  const roleRaw = String(form.get("role") ?? "").trim().toLowerCase();

  if (!draftListingId || !validateComidaLocalImageRole(roleRaw)) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof Blob) || file.size < 1) {
    return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
  }

  const contentType = (file.type || "image/jpeg").toLowerCase();
  if (!(COMIDA_LOCAL_ACCEPTED_IMAGE_MIME as readonly string[]).includes(contentType)) {
    return NextResponse.json(
      { ok: false, error: "unsupported_type", detail: "Use JPEG, PNG, or WebP." },
      { status: 400 }
    );
  }

  if (file.size > COMIDA_LOCAL_IMAGE_MAX_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: "file_too_large",
        detail: `Maximum size is ${Math.round(COMIDA_LOCAL_IMAGE_MAX_BYTES / (1024 * 1024))} MB.`,
      },
      { status: 413 }
    );
  }

  const ownerUserId = await comidaLocalOwnerIdFromBearer(req);
  const ownerSeg = ownerPathSegment(ownerUserId, draftListingId);
  const role = roleRaw as ComidaLocalImageRole;
  const originalName =
    file instanceof File && file.name ? sanitizeFilename(file.name) : "upload.jpg";
  const pathname = `clasificados/comida-local/drafts/${ownerSeg}/${role}/${randomUUID()}-${originalName}`;

  const uploaded = await put(pathname, file, {
    access: "public",
    token,
    addRandomSuffix: true,
    contentType,
  });

  const image: ComidaLocalUploadedImage = {
    id: randomUUID(),
    role,
    url: uploaded.url,
    storagePath: uploaded.pathname ?? pathname,
    fileName: originalName,
    contentType,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
  };

  return NextResponse.json({ ok: true, image });
}
