import { put } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { anonUploadPathSegment, applyAnonUploadSessionCookie, resolveAnonUploadSessionId } from "@/app/api/clasificados/_lib/anonUploadSession";

export const runtime = "nodejs";

const SLOTS = new Set(["hero", "gallery", "food", "interior", "exterior", "featured", "logo", "coupon", "coupon_flyer"]);

function ownerPathSegment(ownerUserId: string | null, anonSessionId: string): string {
  if (ownerUserId) return ownerUserId.replace(/[^a-zA-Z0-9-]+/g, "").slice(0, 36);
  return anonUploadPathSegment(anonSessionId);
}

/**
 * Upload one browser-held image (typically from a data URL fetched as Blob) to public Blob storage.
 * Returns HTTPS `publicUrl` for safe inclusion in `POST .../restaurantes/publish`.
 * Path is scoped by the real authenticated owner when present, else by a server-issued anonymous
 * session id (never the client-supplied draftListingId, which is not proof of anything).
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

  if (file.size > 12 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 413 });
  }

  const safeId = draftListingId.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 80) || "draft";
  const ix = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;

  const ownerUserId = await getBearerUserId(req);
  const anonSession = ownerUserId ? null : resolveAnonUploadSessionId(req);
  const ownerSeg = ownerPathSegment(ownerUserId, anonSession?.id ?? "");
  const pathname = `clasificados/restaurantes/drafts/${ownerSeg}/${safeId}/${slot}-${ix}-${Date.now()}`;

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
