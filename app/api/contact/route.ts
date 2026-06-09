import { NextResponse } from "next/server";
import { LEONIX_GLOBAL_EMAIL } from "@/app/data/leonixGlobalContact";
import { buildContactInquiryEmail } from "@/app/lib/email/contactInquiryEmail";
import { resolveLeonixResendConfig } from "@/app/lib/email/leonixResendConfig";
import { sendLeonixResendEmail } from "@/app/lib/email/sendLeonixResendEmail";
import { parseInquiryType, type InquiryType } from "@/app/lib/leonix/inquiryTypes";
import {
  markContactInquiryEmailSent,
  saveContactInquiry,
  saveNewsletterSubscriber,
} from "@/app/lib/leonix/leadCaptureServer";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 24_576;

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
        error:
          "Lead capture is not configured. Set Supabase service role credentials and/or RESEND_API_KEY.",
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
  const consentToContact = isTruthyConsent(o.consentToContact ?? o.consent_to_contact);

  if (!consentToContact) {
    return NextResponse.json(
      {
        ok: false,
        code: "VALIDATION",
        error: lang === "en" ? "Consent to contact is required." : "Se requiere consentimiento para contactarte.",
      },
      { status: 400 }
    );
  }

  const inquiryType = parseInquiryType(o.inquiryType ?? o.inquiry_type ?? o.topic, "general");
  const submittedAt = new Date().toISOString();
  const payload = {
    fullName: String(o.fullName ?? o.name ?? ""),
    email: String(o.email ?? ""),
    phone: o.phone != null ? String(o.phone) : "",
    businessName: String(o.businessName ?? o.business ?? ""),
    inquiryType,
    preferredContactMethod: o.preferredContactMethod ?? o.preferred_contact_method,
    cityArea: String(o.cityArea ?? o.city ?? ""),
    websiteOrSocial: String(o.websiteOrSocial ?? o.website_or_social ?? ""),
    businessCategory: String(o.businessCategory ?? o.business_category ?? ""),
    message: String(o.message ?? ""),
    sourcePage: String(o.sourcePage ?? o.source_page ?? "/contacto"),
    sourceCta: String(o.sourceCta ?? o.source_cta ?? ""),
    lang,
    wantsLaunchUpdates: isTruthyConsent(o.wantsLaunchUpdates ?? o.wants_launch_updates),
    consentToContact: true,
    consentTimestamp: submittedAt,
  };

  let saved = false;
  let savedId: string | null = null;
  let saveError: string | null = null;

  if (dbConfigured) {
    try {
      const supabase = getAdminSupabase();
      const result = await saveContactInquiry(supabase, payload);
      if (result.ok) {
        saved = true;
        savedId = result.id;

        if (payload.wantsLaunchUpdates) {
          try {
            await saveNewsletterSubscriber(supabase, {
              email: payload.email,
              name: payload.fullName,
              city: payload.cityArea,
              businessName: payload.businessName,
              source: "contact_form",
              lang,
              consentTimestamp: submittedAt,
              wantsLaunchUpdates: true,
            });
          } catch {
            /* non-fatal — contact inquiry already saved */
          }
        }
      } else {
        const messages: Record<string, string> = {
          name_required: lang === "en" ? "Full name is required." : "El nombre completo es obligatorio.",
          email_required: lang === "en" ? "Email is required." : "El correo es obligatorio.",
          invalid_email: lang === "en" ? "Valid email is required." : "Se requiere un correo válido.",
          message_required: lang === "en" ? "Message is required." : "El mensaje es obligatorio.",
          consent_required:
            lang === "en" ? "Consent to contact is required." : "Se requiere consentimiento para contactarte.",
          save_failed: lang === "en" ? "Could not save inquiry." : "No se pudo guardar la consulta.",
        };
        if (result.error !== "save_failed") {
          return NextResponse.json(
            { ok: false, code: "VALIDATION", error: messages[result.error] ?? messages.save_failed },
            { status: 400 }
          );
        }
        saveError = messages.save_failed;
      }
    } catch {
      saveError = lang === "en" ? "Database storage unavailable." : "Almacenamiento en base de datos no disponible.";
    }
  }

  const emailFields = {
    fullName: payload.fullName.trim(),
    email: payload.email.trim(),
    phone: payload.phone.trim(),
    businessName: payload.businessName.trim(),
    inquiryType: inquiryType as InquiryType,
    preferredContactMethod: String(payload.preferredContactMethod ?? "email"),
    cityArea: payload.cityArea.trim(),
    websiteOrSocial: payload.websiteOrSocial.trim(),
    businessCategory: payload.businessCategory.trim(),
    message: payload.message.trim(),
    sourcePage: payload.sourcePage.trim() || "/contacto",
    sourceCta: payload.sourceCta.trim(),
    lang: lang as "es" | "en",
    wantsLaunchUpdates: payload.wantsLaunchUpdates,
    submittedAt,
  };

  let emailSent = false;
  let emailError: string | null = null;

  if (emailConfigured && emailFields.fullName && emailFields.email && emailFields.message) {
    const mail = buildContactInquiryEmail(emailFields);
    const sent = await sendLeonixResendEmail({
      to: LEONIX_GLOBAL_EMAIL,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: emailFields.email,
    });

    if (sent.ok) {
      emailSent = true;
      if (saved && savedId) {
        try {
          const supabase = getAdminSupabase();
          await markContactInquiryEmailSent(supabase, savedId, true);
        } catch {
          /* non-fatal */
        }
      }
    } else {
      emailError =
        sent.code === "NOT_CONFIGURED"
          ? lang === "en"
            ? "Email notification is not configured."
            : "La notificación por correo no está configurada."
          : lang === "en"
            ? "Email notification could not be sent."
            : "No se pudo enviar la notificación por correo.";
      if (saved && savedId) {
        try {
          const supabase = getAdminSupabase();
          await markContactInquiryEmailSent(supabase, savedId, false, sent.message);
        } catch {
          /* non-fatal */
        }
      }
    }
  } else if (!emailConfigured) {
    emailError =
      lang === "en"
        ? "Email notification is not configured (RESEND_API_KEY missing)."
        : "La notificación por correo no está configurada (falta RESEND_API_KEY).";
  }

  if (!saved && !emailSent) {
    return NextResponse.json(
      {
        ok: false,
        code: savedId ? "EMAIL_FAILED" : "SUBMIT_FAILED",
        error:
          lang === "en"
            ? "We could not submit your information. Please try again or email info@leonixmedia.com."
            : "No pudimos enviar tu información. Intenta de nuevo o escríbenos a info@leonixmedia.com.",
        saved: false,
        emailSent: false,
      },
      { status: 503 }
    );
  }

  const warnings: string[] = [];
  if (!saved && emailSent) {
    warnings.push(
      lang === "en"
        ? "Your message was emailed to our team, but list storage is pending (database not available)."
        : "Tu mensaje se envió por correo al equipo, pero el almacenamiento en lista está pendiente (base de datos no disponible)."
    );
  }
  if (saved && !emailSent && emailError) {
    warnings.push(emailError);
  }
  if (saveError && !saved) {
    warnings.push(saveError);
  }

  return NextResponse.json({
    ok: true,
    saved,
    emailSent,
    id: savedId,
    submittedAt,
    warning: warnings.length > 0 ? warnings.join(" ") : undefined,
  });
}
