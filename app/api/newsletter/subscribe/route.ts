import { NextResponse } from "next/server";
import { LEONIX_GLOBAL_EMAIL } from "@/app/data/leonixGlobalContact";
import { buildLaunchSignupEmail } from "@/app/lib/email/contactInquiryEmail";
import { resolveLeonixResendConfig } from "@/app/lib/email/leonixResendConfig";
import { sendLeonixResendEmail } from "@/app/lib/email/sendLeonixResendEmail";
import { saveNewsletterSubscriber } from "@/app/lib/leonix/leadCaptureServer";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 8_192;

function isTruthyConsent(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

export async function POST(req: Request) {
  const dbConfigured = isSupabaseAdminConfigured();
  const emailConfigured = resolveLeonixResendConfig().ok;

  if (!dbConfigured && !emailConfigured) {
    return NextResponse.json(
      {
        ok: false,
        code: "NOT_CONFIGURED",
        error: "Launch signup is not configured. Set Supabase and/or RESEND_API_KEY.",
      },
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
  const lang = o.lang === "en" ? "en" : "es";
  const consent =
    isTruthyConsent(o.consentToContact) ||
    isTruthyConsent(o.consentToReceiveUpdates) ||
    isTruthyConsent(o.consent);

  if (!consent) {
    return NextResponse.json(
      {
        ok: false,
        code: "VALIDATION",
        error:
          lang === "en"
            ? "Consent to receive launch updates is required."
            : "Se requiere consentimiento para recibir actualizaciones del lanzamiento.",
      },
      { status: 400 }
    );
  }

  const consentTimestamp = new Date().toISOString();
  const email = String(o.email ?? "");
  const name = o.name != null ? String(o.name) : o.fullName != null ? String(o.fullName) : undefined;
  const businessName = o.businessName != null ? String(o.businessName) : o.business != null ? String(o.business) : undefined;
  const city = o.city != null ? String(o.city) : o.cityArea != null ? String(o.cityArea) : undefined;
  const source = o.source;
  const audienceType = o.audienceType ?? o.audience_type;
  const wantsLaunchUpdates = o.wantsLaunchUpdates !== false && o.wants_launch_updates !== false;

  let saved = false;
  let savedId: string | null = null;
  let updated = false;

  if (dbConfigured) {
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
      email,
      name,
      city,
      zipCode: o.zipCode != null ? String(o.zipCode) : o.zip_code != null ? String(o.zip_code) : undefined,
      audienceType,
      preferredLanguage: o.preferredLanguage ?? o.preferred_language,
      interests: o.interests != null ? String(o.interests) : undefined,
      source,
      lang,
      consentTimestamp,
    });

    if (!result.ok) {
      const status = result.error === "invalid_email" || result.error === "email_required" ? 400 : 500;
      if (!emailConfigured || status === 400) {
        return NextResponse.json({ ok: false, code: "VALIDATION", error: result.error }, { status });
      }
    } else {
      saved = true;
      savedId = result.id;
      updated = result.updated;
    }
  }

  let emailSent = false;

  if (emailConfigured && email.trim()) {
    const mail = buildLaunchSignupEmail({
      email: email.trim(),
      name: String(name ?? "").trim(),
      businessName: String(businessName ?? "").trim(),
      city: String(city ?? "").trim(),
      audienceType: String(audienceType ?? "").trim(),
      source: String(source ?? "newsletter_page"),
      lang,
      wantsLaunchUpdates,
      submittedAt: consentTimestamp,
    });

    const sent = await sendLeonixResendEmail({
      to: LEONIX_GLOBAL_EMAIL,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: email.trim(),
    });

    emailSent = sent.ok;
    if (!sent.ok) {
      console.warn("[newsletter] subscriber saved without team email notification", { email: email.trim() });
    }
  } else if (saved) {
    console.warn("[newsletter] RESEND_API_KEY not configured — subscriber saved without team email notification.");
  }

  if (!saved && !emailSent) {
    return NextResponse.json(
      { ok: false, code: "SUBMIT_FAILED", error: "submit_failed" },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    id: savedId,
    updated,
    saved,
    emailSent,
    consentTimestamp,
  });
}
