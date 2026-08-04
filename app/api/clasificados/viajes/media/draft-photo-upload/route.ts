import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

import { viajesGetUserIdFromBearer } from "../../_lib/viajesOwnerBearer";

export const runtime = "nodejs";

const SLOTS = new Set(["hero", "gallery", "logo", "module"]);
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);

function sanitizeSegment(raw: string, max: number, fallback: string): string {
  const s = raw.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, max);
  return s || fallback;
}

/**
 * Authenticated Viajes draft image upload → public HTTPS Vercel Blob URL.
 */
export async function POST(req: NextRequest) {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "blob_unconfigured", detail: "BLOB_READ_WRITE_TOKEN is not set on the server." },
      { status: 503 }
    );
  }

  const ownerUserId = await viajesGetUserIdFromBearer(req);
  if (!ownerUserId) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_form" }, { status: 400 });
  }

  const draftId = String(form.get("draftId") ?? "").trim();
  const slot = String(form.get("slot") ?? "").trim();
  const indexRaw = form.get("index");
  const index = indexRaw != null && String(indexRaw) !== "" ? Number(indexRaw) : NaN;

  if (!draftId || !SLOTS.has(slot)) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof Blob) || file.size < 1) {
    return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 413 });
  }

  const ct = (file.type || "").toLowerCase();
  if (!ALLOWED_MIME.has(ct)) {
    return NextResponse.json(
      { ok: false, error: "unsupported_image_type", detail: ct || "empty" },
      { status: 400 }
    );
  }

  const safeDraft = sanitizeSegment(draftId, 80, "draft");
  const safeUser = sanitizeSegment(ownerUserId, 48, "user");
  const ix = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  const pathname = `clasificados/viajes/drafts/${safeUser}/${safeDraft}/${slot}-${ix}-${Date.now()}`;

  try {
    const uploaded = await put(pathname, file, {
      access: "public",
      token,
      addRandomSuffix: true,
      contentType: ct || "image/jpeg",
    });
    return NextResponse.json({
      ok: true,
      publicUrl: uploaded.url,
      pathname: uploaded.pathname || pathname,
      mimeType: ct,
      byteSize: file.size,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "upload_failed" }, { status: 500 });
  }
}
