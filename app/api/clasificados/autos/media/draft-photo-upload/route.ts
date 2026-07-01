import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getAutosPublishUserIdFromRequest } from "@/app/lib/clasificados/autos/autosListingBearerAuth";

export const runtime = "nodejs";

const SLOTS = new Set(["gallery", "logo", "finance_image"]);
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

/**
 * Upload one browser-held Autos draft image to public Blob storage.
 * Returns HTTPS `publicUrl` for publish (Privado + Negocios gallery/logo/finance image).
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

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 413 });
  }

  const ct = (file.type || "").toLowerCase();
  const okType =
    ct.startsWith("image/") || ct === "application/octet-stream" || ct === "binary/octet-stream" || ct === "";
  if (!okType) {
    return NextResponse.json({ ok: false, error: "unsupported_image_type", detail: ct || "empty" }, { status: 400 });
  }

  const userId = await getAutosPublishUserIdFromRequest(req);
  const safeDraft = draftId.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 80) || "draft";
  const safeUser = userId?.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 48) || "anon";
  const ix = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  const pathname = `clasificados/autos/drafts/${safeUser}/${safeDraft}/${slot}-${ix}-${Date.now()}`;

  const uploaded = await put(pathname, file, {
    access: "public",
    token,
    addRandomSuffix: true,
    contentType: file.type || "image/jpeg",
  });

  return NextResponse.json({ ok: true, publicUrl: uploaded.url });
}
