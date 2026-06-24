import { NextResponse } from "next/server";
import { buildMediaKitLeadEmail } from "@/app/lib/email/contactInquiryEmail";
import { resolveLeonixResendConfig } from "@/app/lib/email/leonixResendConfig";
import { resolveLeonixNotificationEmail } from "@/app/lib/email/leonixNotificationRecipient";
import { sendLeonixResendEmail } from "@/app/lib/email/sendLeonixResendEmail";
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

  const submittedAt = new Date().toISOString();
  const name = String(o.name ?? "");
  const email = String(o.email ?? "");
  const phone = o.phone != null ? String(o.phone) : "";
  const business = o.business != null ? String(o.business) : "";
  const message = o.message != null ? String(o.message) : "";
  const lang = o.lang === "en" ? "en" : "es";
  const source = String(o.source ?? "media_kit_page");

  const result = await saveMediaKitLead(supabase, {
    name,
    email,
    phone: phone || undefined,
    business: business || undefined,
    message: message || undefined,
    lang,
    source,
  });

  if (!result.ok) {
    const status =
      result.error === "invalid_email" || result.error === "email_required" || result.error === "name_required"
        ? 400
        : 500;
    return NextResponse.json({ ok: false, code: "VALIDATION", error: result.error }, { status });
  }

  const emailConfigured = resolveLeonixResendConfig().ok;
  const notificationTo = resolveLeonixNotificationEmail();
  let emailSent = false;

  if (emailConfigured && email.trim()) {
    const mail = buildMediaKitLeadEmail({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      business: business.trim(),
      message: message.trim(),
      source,
      lang,
      submittedAt,
      leadId: result.id,
    });

    const sent = await sendLeonixResendEmail({
      to: notificationTo,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: email.trim(),
    });

    emailSent = sent.ok;
    if (sent.ok) {
      console.info("[media-kit] email notification accepted by provider", {
        leadId: result.id,
        to: notificationTo,
        source,
      });
    } else {
      console.warn("[media-kit] lead saved without team email notification", {
        code: sent.code,
        leadId: result.id,
        to: notificationTo,
        hint:
          sent.code === "NOT_CONFIGURED"
            ? "Set RESEND_API_KEY and LEONIX_EMAIL_FROM in Vercel Production"
            : "Verify Resend domain/sender for LEONIX_EMAIL_FROM or LEONIX_RESEND_FROM",
      });
    }
  } else if (!emailConfigured) {
    const config = resolveLeonixResendConfig();
    console.warn("[media-kit] email not configured — lead saved without team notification", {
      leadId: result.id,
      to: notificationTo,
      missing: config.ok ? [] : config.missing,
      hint: "Set RESEND_API_KEY and LEONIX_EMAIL_FROM in Vercel Production, then redeploy",
    });
  }

  return NextResponse.json({ ok: true, id: result.id, saved: true, emailSent });
}
