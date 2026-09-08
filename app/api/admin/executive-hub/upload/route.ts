import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** Mirrors `app/api/admin/magazine/upload/route.ts` — same Vercel Blob upload architecture, new asset kinds. */
const ALLOWED_KINDS = ["headshot", "logo", "cover"] as const;

function sanitizeSegment(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 60) || "executive";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (req.cookies.get("leonix_admin")?.value !== "1") {
    return NextResponse.json({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Blob storage is not configured", code: "BLOB_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form data", code: "BAD_FORM" }, { status: 400 });
  }

  const slug = sanitizeSegment(String(form.get("slug") ?? "").toLowerCase());
  const kindRaw = String(form.get("kind") ?? "").trim();
  if (!slug || !(ALLOWED_KINDS as readonly string[]).includes(kindRaw)) {
    return NextResponse.json({ ok: false, error: "Bad slug or kind", code: "BAD_PARAMS" }, { status: 400 });
  }
  const kind = kindRaw as (typeof ALLOWED_KINDS)[number];

  const file = form.get("file");
  if (!(file instanceof Blob) || file.size < 1) {
    return NextResponse.json({ ok: false, error: "Missing file", code: "MISSING_FILE" }, { status: 400 });
  }

  const orig = String(form.get("originalFilename") ?? "upload").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
  const ext = orig.match(/\.(png|jpg|jpeg|webp)$/i)?.[1]?.toLowerCase() || "jpg";
  const pathname = `executive-hub/${slug}/${kind}.${ext === "jpeg" ? "jpg" : ext}`;

  const uploaded = await put(pathname, file, {
    access: "public",
    token,
    addRandomSuffix: true,
    contentType: file.type || undefined,
  });

  return NextResponse.json({
    ok: true,
    publicUrl: uploaded.url,
    pathname: uploaded.pathname,
  });
}
