import { put } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";
import { SERVICIOS_DRAFT_MEDIA_MAX_BYTES } from "@/app/(site)/clasificados/publicar/servicios/lib/serviciosVideoDraftGate";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { anonUploadPathSegment, applyAnonUploadSessionCookie, resolveAnonUploadSessionId } from "@/app/api/clasificados/_lib/anonUploadSession";

export const runtime = "nodejs";

function ownerPathSegment(ownerUserId: string | null, anonSessionId: string): string {
  if (ownerUserId) return ownerUserId.replace(/[^a-zA-Z0-9-]+/g, "").slice(0, 36);
  return anonUploadPathSegment(anonSessionId);
}

const SLOTS = new Set([
  "logo",
  "cover",
  "gallery",
  "video",
  "promoImage",
  "promoPdf",
  "licenseDoc",
  "insuranceDoc",
  "couponImage",
  "couponFlyer",
]);

// Package F Build F2, Gate 8 (P1 security fix) — this route previously had no MIME check at all
// for any slot. Types below match each slot's real use: image slots take JPEG/PNG/WebP, "video"
// keeps this route's existing (Mux-preferred, Blob-fallback) permissive video/octet-stream check,
// "promoPdf" is a PDF flyer, and license/insurance documents are commonly a PDF or a scanned image.
const IMAGE_SLOTS = new Set(["logo", "cover", "gallery", "promoImage", "couponImage", "couponFlyer"]);
const DOC_SLOTS = new Set(["licenseDoc", "insuranceDoc"]);
const ACCEPTED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ACCEPTED_DOC_MIME = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

/**
 * Upload one browser-held file (typically from a data URL fetched as Blob) to public Blob storage.
 * Returns HTTPS `publicUrl` for safe inclusion in `POST .../servicios/publish`.
 */
export async function POST(req: NextRequest) {
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

  const draftListingId = String(form.get("draftListingId") ?? "").trim();
  const slot = String(form.get("slot") ?? "").trim();
  const indexRaw = form.get("index");
  const index = indexRaw != null && String(indexRaw) !== "" ? Number(indexRaw) : NaN;

  if (!draftListingId || !SLOTS.has(slot)) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof Blob) || file.size < 1) {
    return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
  }

  const ct = (file.type || "").toLowerCase();
  if (IMAGE_SLOTS.has(slot) && !ACCEPTED_IMAGE_MIME.has(ct || "image/jpeg")) {
    return NextResponse.json(
      { ok: false, error: "unsupported_type", detail: "Use JPEG, PNG, or WebP." },
      { status: 400 },
    );
  }
  if (slot === "promoPdf" && ct && ct !== "application/pdf") {
    return NextResponse.json(
      { ok: false, error: "unsupported_type", detail: "Use a PDF file." },
      { status: 400 },
    );
  }
  if (DOC_SLOTS.has(slot) && ct && !ACCEPTED_DOC_MIME.has(ct)) {
    return NextResponse.json(
      { ok: false, error: "unsupported_type", detail: "Use a PDF, JPEG, PNG, or WebP file." },
      { status: 400 },
    );
  }
  if (slot === "video") {
    const okType =
      ct.startsWith("video/") ||
      ct === "application/octet-stream" ||
      ct === "binary/octet-stream" ||
      ct === "";
    if (!okType) {
      return NextResponse.json({ ok: false, error: "unsupported_video_type", detail: ct || "empty" }, { status: 400 });
    }
  }

  if (file.size > SERVICIOS_DRAFT_MEDIA_MAX_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: "file_too_large",
        detail: "Maximum upload size is 4 MB. Use a smaller image or compress before uploading.",
      },
      { status: 413 },
    );
  }

  const safeId = draftListingId.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 80) || "draft";
  const ix = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;

  const ownerUserId = await getBearerUserId(req);
  const anonSession = ownerUserId ? null : resolveAnonUploadSessionId(req);
  const ownerSeg = ownerPathSegment(ownerUserId, anonSession?.id ?? "");
  const pathname = `clasificados/servicios/drafts/${ownerSeg}/${safeId}/${slot}-${ix}-${Date.now()}`;

  const uploaded = await put(pathname, file, {
    access: "public",
    token,
    addRandomSuffix: true,
    contentType: file.type || "image/jpeg",
  });

  const res = NextResponse.json({ ok: true, publicUrl: uploaded.url });
  if (anonSession?.isNew) applyAnonUploadSessionCookie(res, anonSession.id);
  return res;
}
