import {
  buildCallIntent,
  buildSendEmailIntent,
  buildSendMessageIntent,
  buildSocialLinkIntent,
  buildWebsiteIntent,
  buildWhatsAppMessageIntent,
  type CtaContactShareExtras,
  type CtaSheetIntent,
} from "@/app/components/cta";

/** Hrefs that should open CtaActionSheet first (not dial/mail/WhatsApp directly). */
export function isAutosContactHref(href: string): boolean {
  const h = href.trim();
  if (!h) return false;
  if (/^tel:/i.test(h)) return true;
  if (/^mailto:/i.test(h)) return true;
  if (/^sms:/i.test(h)) return true;
  if (/wa\.me|api\.whatsapp\.com/i.test(h)) return true;
  return false;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

function parseMailto(href: string): { email?: string; subject: string; body: string } {
  const raw = href.replace(/^mailto:/i, "");
  const [emailPart, query = ""] = raw.split("?");
  const params = new URLSearchParams(query);
  return {
    email: safeDecode(emailPart),
    subject: safeDecode(params.get("subject") ?? ""),
    body: safeDecode(params.get("body") ?? ""),
  };
}

export function parseWhatsAppHref(href: string): { digits: string; message: string } {
  try {
    const url = new URL(href);
    return {
      digits: url.pathname.replace(/\D/g, ""),
      message: url.searchParams.get("text") ?? "",
    };
  } catch {
    return { digits: href.replace(/\D/g, ""), message: "" };
  }
}

export function buildAutosIntentFromHref(
  href: string,
  options?: { headline?: string; contactShareExtras?: CtaContactShareExtras | null },
): CtaSheetIntent | null {
  const h = href.trim();
  if (!h) return null;

  if (/^tel:/i.test(h)) {
    return buildCallIntent({ phone: h.replace(/^tel:/i, ""), contactShareExtras: options?.contactShareExtras ?? null });
  }
  if (/^mailto:/i.test(h)) {
    const parsed = parseMailto(h);
    return buildSendEmailIntent({
      email: parsed.email,
      subject: parsed.subject || "Consulta sobre vehículo — Leonix Autos",
      body: parsed.body,
      contactShareExtras: options?.contactShareExtras ?? null,
    });
  }
  if (/wa\.me|api\.whatsapp\.com/i.test(h)) {
    const { digits, message } = parseWhatsAppHref(h);
    return buildWhatsAppMessageIntent({ whatsappDigits: digits, message, contactShareExtras: options?.contactShareExtras ?? null });
  }
  if (/^sms:/i.test(h)) {
    const phone = h.replace(/^sms:/i, "").split("?")[0] ?? "";
    const params = new URLSearchParams(h.split("?")[1] ?? "");
    return buildSendMessageIntent({
      phone,
      message: safeDecode(params.get("body") ?? ""),
      contactShareExtras: options?.contactShareExtras ?? null,
    });
  }
  if (h.startsWith("http://") || h.startsWith("https://")) {
    return buildWebsiteIntent({ url: h, headline: options?.headline ?? undefined, kind: "website" });
  }
  return null;
}

export function buildAutosSocialIntent(href: string, label: string): CtaSheetIntent | null {
  return buildSocialLinkIntent({ url: href, headline: label });
}
