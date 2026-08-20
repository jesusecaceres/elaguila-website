import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";
import {
  extensionForIglesiasLogoMime,
  IGLESIAS_LOGO_ACCEPTED_MIME,
  IGLESIAS_LOGO_MAX_BYTES,
} from "@/app/lib/iglesias/logoUpload";
import { anonUploadPathSegment, applyAnonUploadSessionCookie, resolveAnonUploadSessionId } from "@/app/api/clasificados/_lib/anonUploadSession";

export const runtime = "nodejs";

function sanitizeDraftId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 80) || "draft";
}

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

  const draftSessionId = sanitizeDraftId(String(form.get("draftSessionId") ?? ""));
  const file = form.get("file");
  if (!(file instanceof Blob) || file.size < 1) {
    return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
  }

  const contentType = (file.type || "").toLowerCase();
  if (!IGLESIAS_LOGO_ACCEPTED_MIME.includes(contentType as (typeof IGLESIAS_LOGO_ACCEPTED_MIME)[number])) {
    return NextResponse.json(
      { ok: false, error: "unsupported_type", detail: "Use JPEG, PNG, or WebP." },
      { status: 400 },
    );
  }

  if (file.size > IGLESIAS_LOGO_MAX_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: "file_too_large",
        detail: "Maximum logo size is 5 MB.",
      },
      { status: 413 },
    );
  }

  const anonSession = resolveAnonUploadSessionId(req);
  const ownerSeg = anonUploadPathSegment(anonSession.id);
  const ext = extensionForIglesiasLogoMime(contentType);
  const pathname = `iglesias/churches/${ownerSeg}/${draftSessionId}/logo/${randomUUID()}.${ext}`;

  const uploaded = await put(pathname, file, {
    access: "public",
    token,
    addRandomSuffix: true,
    contentType,
  });

  const res = NextResponse.json({ ok: true, publicUrl: uploaded.url });
  if (anonSession.isNew) applyAnonUploadSessionCookie(res, anonSession.id);
  return res;
}
