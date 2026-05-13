import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SLOTS = new Set(["gallery", "logo", "video"]);

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_BYTES = 90 * 1024 * 1024;

/**
 * Upload one browser-held image (data URL → Blob or file) to public Blob storage.
 * Returns HTTPS `publicUrl` for Rentas publish (`leonixPublishRealEstateListingCore` then mirrors to Supabase).
 */
export async function POST(req: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "blob_unconfigured", detail: "BLOB_READ_WRITE_TOKEN is not set on the server." },
      { status: 503 },
    );
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

  const maxBytes = slot === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 413 });
  }

  if (slot === "video") {
    const ct = (file.type || "").toLowerCase();
    const okType =
      ct.startsWith("video/") ||
      ct === "application/octet-stream" ||
      ct === "binary/octet-stream" ||
      ct === "";
    if (!okType) {
      return NextResponse.json({ ok: false, error: "unsupported_video_type", detail: ct || "empty" }, { status: 400 });
    }
  }

  const safeId = draftId.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 80) || "draft";
  const ix = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  const pathname = `clasificados/rentas/drafts/${safeId}/${slot}-${ix}-${Date.now()}`;

  const contentType =
    file.type ||
    (slot === "video" ? "video/mp4" : "image/jpeg");

  const uploaded = await put(pathname, file, {
    access: "public",
    token,
    addRandomSuffix: true,
    contentType,
  });

  return NextResponse.json({ ok: true, publicUrl: uploaded.url });
}
