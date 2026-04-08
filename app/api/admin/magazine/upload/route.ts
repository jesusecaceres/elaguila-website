import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_KINDS = ["cover", "pdf"] as const;

function sanitizeSegment(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 32) || "issue";
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

  const year = sanitizeSegment(String(form.get("year") ?? ""));
  const monthSlug = sanitizeSegment(String(form.get("monthSlug") ?? "").toLowerCase());
  const kindRaw = String(form.get("kind") ?? "").trim();
  if (!year || !monthSlug || !(ALLOWED_KINDS as readonly string[]).includes(kindRaw)) {
    return NextResponse.json({ ok: false, error: "Bad year, monthSlug, or kind", code: "BAD_PARAMS" }, { status: 400 });
  }
  const kind = kindRaw as (typeof ALLOWED_KINDS)[number];

  const file = form.get("file");
  if (!(file instanceof Blob) || file.size < 1) {
    return NextResponse.json({ ok: false, error: "Missing file", code: "MISSING_FILE" }, { status: 400 });
  }

  const orig = String(form.get("originalFilename") ?? "upload").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
  const ext = kind === "pdf" ? "pdf" : orig.match(/\.(png|jpg|jpeg|webp)$/i)?.[1]?.toLowerCase() || "jpg";
  const pathname = `magazine/issues/${year}/${monthSlug}/${kind}.${ext === "jpeg" ? "jpg" : ext}`;

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
