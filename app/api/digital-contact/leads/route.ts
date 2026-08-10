import { NextResponse } from "next/server";
import { getDigitalContactProfile } from "@/app/lib/digitalContact/digitalContactRegistry";
import { isValidDigitalContactHowMetId } from "@/app/lib/digitalContact/digitalContactHowMet";
import { insertDigitalContactLead, insertDigitalContactAnalyticsEvent } from "@/app/lib/digitalContact/digitalContactOpsTablesServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { sendLeonixResendEmail } from "@/app/lib/email/sendLeonixResendEmail";

export const runtime = "nodejs";

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const profileSlug = String(b.profileSlug ?? "").trim().toLowerCase();
  const senderName = String(b.senderName ?? "").trim();
  const senderEmail = String(b.senderEmail ?? "").trim();
  const businessName = String(b.businessName ?? "").trim().slice(0, 200);
  const senderPhoneRaw = String(b.senderPhone ?? "").trim();
  const senderPhone = senderPhoneRaw.slice(0, 48);
  const message = String(b.message ?? "").trim();
  const howMet = String(b.howMet ?? "").trim();
  const consent = Boolean(b.consent);
  /** Honeypot — legitimate visitors never fill this hidden field. */
  const honeypot = String(b.website ?? "").trim();

  if (honeypot.length > 0) {
    return NextResponse.json({ ok: true, accepted: false }, { status: 200 });
  }

  const profile = await getDigitalContactProfile(profileSlug);
  if (!profile) {
    return NextResponse.json({ ok: false, error: "profile_not_found" }, { status: 404 });
  }
  if (senderName.length < 2 || senderName.length > 200) {
    return NextResponse.json({ ok: false, error: "invalid_name" }, { status: 400 });
  }
  if (!isEmail(senderEmail)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ ok: false, error: "invalid_message" }, { status: 400 });
  }
  if (senderPhone.length > 0 && senderPhone.replace(/\D/g, "").length < 7) {
    return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }
  if (!isValidDigitalContactHowMetId(howMet)) {
    return NextResponse.json({ ok: false, error: "invalid_how_met" }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ ok: false, error: "consent_required" }, { status: 400 });
  }

  /**
   * Persistence is best-effort: a misconfigured or momentarily unavailable Supabase
   * backend must never drop a legitimate lead. Email notification (below) is the
   * durable fallback channel, so we still validate hard but never 503 on storage.
   */
  let leadId: string | null = null;
  let stored = false;
  if (!isSupabaseAdminConfigured()) {
    console.error(`[digital-contact-leads] persistence skipped profile=${profileSlug} reason=supabase_not_configured`);
  } else {
    const ins = await insertDigitalContactLead({
      profileSlug,
      senderName,
      senderEmail,
      businessName: businessName || null,
      senderPhone: senderPhone || null,
      message: message || null,
      howMet: howMet || null,
      consent,
    });
    if (ins.ok) {
      leadId = ins.id;
      stored = true;
      await insertDigitalContactAnalyticsEvent({
        profileSlug,
        eventType: "lead_created",
        meta: { leadId: ins.id, howMet: howMet || null, hasBusinessName: Boolean(businessName) },
      });
    } else {
      console.error(`[digital-contact-leads] persistence failed profile=${profileSlug} reason=${ins.error}`);
    }
  }

  let emailNotified = false;
  const sent = await sendLeonixResendEmail({
    to: profile.email,
    subject: `Leonix Digital Contact — new lead (${profile.fullName})`,
    replyTo: senderEmail,
    text: [
      `New Digital Contact lead for ${profile.fullName}`,
      `Name: ${senderName}`,
      businessName ? `Business: ${businessName}` : null,
      `Email: ${senderEmail}`,
      senderPhone ? `Phone: ${senderPhone}` : null,
      howMet ? `How we met: ${howMet}` : null,
      "",
      message ? `Message:\n${message}` : "(No message)",
    ]
      .filter(Boolean)
      .join("\n"),
    html: `<p><strong>New Digital Contact lead</strong> for ${escapeHtml(profile.fullName)}</p>
<p><strong>Name:</strong> ${escapeHtml(senderName)}<br/>
${businessName ? `<strong>Business:</strong> ${escapeHtml(businessName)}<br/>` : ""}
<strong>Email:</strong> ${escapeHtml(senderEmail)}<br/>
${senderPhone ? `<strong>Phone:</strong> ${escapeHtml(senderPhone)}<br/>` : ""}
${howMet ? `<strong>How we met:</strong> ${escapeHtml(howMet)}<br/>` : ""}</p>
${message ? `<p><strong>Message</strong></p><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(message)}</pre>` : ""}`,
  });
  emailNotified = sent.ok;
  if (!sent.ok) {
    console.error(`[digital-contact-leads] email failed profile=${profileSlug} reason=${sent.message}`);
  }

  return NextResponse.json({ ok: true, id: leadId, stored, emailNotified }, { status: stored ? 201 : 200 });
}
