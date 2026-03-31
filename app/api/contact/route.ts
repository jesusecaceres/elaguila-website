import { NextResponse } from "next/server";
import { LEONIX_GLOBAL_EMAIL } from "@/app/data/leonixGlobalContact";
import { escapeHtml } from "@/app/lib/email/escapeHtml";
import { sendLeonixResendEmail } from "@/app/lib/email/sendLeonixResendEmail";

export const runtime = "nodejs";

const MAX_MESSAGE = 12_000;

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON", code: "BAD_JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid body", code: "BAD_BODY" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;

  const name = String(o.name ?? "").trim();
  const email = String(o.email ?? "").trim();
  const phone = o.phone != null ? String(o.phone).trim() : "";
  const message = String(o.message ?? "").trim();
  const lang = o.lang === "en" ? "en" : "es";

  if (!name || name.length > 200) {
    return NextResponse.json(
      { ok: false, error: lang === "en" ? "Name is required." : "El nombre es obligatorio.", code: "VALIDATION" },
      { status: 400 }
    );
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: lang === "en" ? "Valid email is required." : "Se requiere un correo válido.", code: "VALIDATION" },
      { status: 400 }
    );
  }
  if (!message || message.length > MAX_MESSAGE) {
    return NextResponse.json(
      {
        ok: false,
        error: lang === "en" ? "Message is required (max length exceeded)." : "El mensaje es obligatorio (límite excedido).",
        code: "VALIDATION",
      },
      { status: 400 }
    );
  }

  const submittedAt = new Date().toISOString();
  const subject = `[Leonix — contacto general] ${name} · ${submittedAt.slice(0, 16).replace("T", " ")}`;

  const text = [
    "Source: Global website contact form (/contacto)",
    `Submitted (UTC): ${submittedAt}`,
    `Language: ${lang}`,
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : "Phone: (not provided)",
    "",
    "Message:",
    message,
  ].join("\n");

  const html = `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#222;">
  <h2 style="margin:0 0 12px;">Global contact — Leonix Media</h2>
  <p style="margin:0 0 8px;color:#555;"><strong>Source:</strong> Website contact form (<code>/contacto</code>)</p>
  <p style="margin:0 0 8px;"><strong>Submitted (UTC):</strong> ${escapeHtml(submittedAt)}</p>
  <p style="margin:0 0 8px;"><strong>Language:</strong> ${escapeHtml(lang)}</p>
  <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;" />
  <p><strong>Name:</strong> ${escapeHtml(name)}</p>
  <p><strong>Email:</strong> ${escapeHtml(email)}</p>
  <p><strong>Phone:</strong> ${phone ? escapeHtml(phone) : "<em>not provided</em>"}</p>
  <h3 style="margin:20px 0 8px;">Message</h3>
  <pre style="white-space:pre-wrap;font-family:inherit;background:#f7f7f7;padding:12px;border-radius:8px;">${escapeHtml(message)}</pre>
</body></html>`;

  const sent = await sendLeonixResendEmail({
    to: LEONIX_GLOBAL_EMAIL,
    subject,
    text,
    html,
    replyTo: email,
  });

  if (!sent.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          lang === "en"
            ? "We could not send your message right now. Please try again later or email us directly."
            : "No pudimos enviar tu mensaje ahora. Intenta más tarde o escríbenos directamente.",
        code: "EMAIL_UNAVAILABLE",
        detail: process.env.NODE_ENV === "development" ? sent.message : undefined,
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, submittedAt });
}
