import { NextResponse } from "next/server";
import { saveNewsletterSubscriber } from "@/app/lib/leonix/leadCaptureServer";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 8_192;

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
  const consentTimestamp = new Date().toISOString();

  let supabase;
  try {
    supabase = getAdminSupabase();
  } catch {
    return NextResponse.json(
      { ok: false, code: "DB_NOT_CONFIGURED", error: "supabase_not_configured" },
      { status: 503 }
    );
  }

  const result = await saveNewsletterSubscriber(supabase, {
    email: String(o.email ?? ""),
    name: o.name != null ? String(o.name) : undefined,
    city: o.city != null ? String(o.city) : undefined,
    zipCode: o.zipCode != null ? String(o.zipCode) : o.zip_code != null ? String(o.zip_code) : undefined,
    preferredLanguage: o.preferredLanguage ?? o.preferred_language,
    interests: o.interests != null ? String(o.interests) : undefined,
    source: o.source,
    lang: o.lang,
    consentTimestamp,
  });

  if (!result.ok) {
    const status = result.error === "invalid_email" || result.error === "email_required" ? 400 : 500;
    return NextResponse.json({ ok: false, code: "VALIDATION", error: result.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    id: result.id,
    updated: result.updated,
    consentTimestamp,
  });
}
