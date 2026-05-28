import { NextResponse } from "next/server";
import { saveMediaKitLead } from "@/app/lib/leonix/leadCaptureServer";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 12_288;

export async function POST(req: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, code: "DB_NOT_CONFIGURED", error: "supabase_not_configured" },
      { status: 503 }
    );
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, code: "PAYLOAD_TOO_LARGE", error: "payload_too_large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "BAD_JSON", error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, code: "BAD_BODY", error: "invalid_body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;

  let supabase;
  try {
    supabase = getAdminSupabase();
  } catch {
    return NextResponse.json(
      { ok: false, code: "DB_NOT_CONFIGURED", error: "supabase_not_configured" },
      { status: 503 }
    );
  }

  const result = await saveMediaKitLead(supabase, {
    name: String(o.name ?? ""),
    email: String(o.email ?? ""),
    phone: o.phone != null ? String(o.phone) : undefined,
    business: o.business != null ? String(o.business) : undefined,
    message: o.message != null ? String(o.message) : undefined,
    lang: o.lang,
    source: o.source,
  });

  if (!result.ok) {
    const status =
      result.error === "invalid_email" || result.error === "email_required" || result.error === "name_required"
        ? 400
        : 500;
    return NextResponse.json({ ok: false, code: "VALIDATION", error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, id: result.id });
}
