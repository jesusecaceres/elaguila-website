import { parseInquiryType, type InquiryType } from "@/app/lib/leonix/inquiryTypes";

export const LEONIX_MEDIA_KIT_PDF_URL =
  "https://leonixmedia.com/media-kit/leonix-media-kit-es.pdf";

export const LEONIX_MAGAZINE_PREVIEW_URL =
  "https://leonixmedia.com/magazine/2026/june/read?lang=es";

export type LeadReplyKind =
  | "mediaKit"
  | "magazine"
  | "advertising"
  | "promoPrint"
  | "newsletter"
  | "general";

export type LeadReplyInput = {
  full_name: string;
  email: string;
  phone: string;
  business_name: string;
  inquiry_type: string;
  message: string;
  source_page: string;
  source_cta: string;
  lang: string;
  preferred_contact_method: string;
};

export type NewsletterReplyInput = {
  name: string;
  email: string;
  lang: string;
  interests: string;
};

export type MediaKitReplyInput = {
  name: string;
  email: string;
  business: string;
  message: string;
  lang: string;
};

function firstName(fullName: string): string {
  const t = fullName.trim();
  if (!t) return "there";
  return t.split(/\s+/)[0] ?? t;
}

function isSpanish(lang: string): boolean {
  return lang.trim().toLowerCase() !== "en";
}

export function detectLeadReplyKind(row: LeadReplyInput): LeadReplyKind {
  const inquiry = parseInquiryType(row.inquiry_type) as InquiryType;
  if (inquiry === "mediaKit") return "mediaKit";
  if (inquiry === "advertising") return "advertising";
  if (inquiry === "promotionalProducts" || row.source_cta === "promo_quote") return "promoPrint";
  const hay = `${row.message} ${row.source_page} ${row.source_cta}`.toLowerCase();
  if (inquiry === "launch" || /magazine|revista|magazin/.test(hay)) return "magazine";
  return "general";
}

export function leadReplyKindLabel(kind: LeadReplyKind): string {
  switch (kind) {
    case "mediaKit":
      return "Media kit reply";
    case "magazine":
      return "Magazine reply";
    case "advertising":
      return "Advertising reply";
    case "promoPrint":
      return "Promo / print quote reply";
    case "newsletter":
      return "Newsletter reply";
    default:
      return "General reply";
  }
}

export function buildLeadReplyContent(row: LeadReplyInput): {
  kind: LeadReplyKind;
  subject: string;
  body: string;
} {
  const kind = detectLeadReplyKind(row);
  const es = isSpanish(row.lang);
  const name = firstName(row.full_name);
  const business = row.business_name.trim();

  let subject: string;
  let body: string;

  switch (kind) {
    case "mediaKit":
      subject = es
        ? `Leonix Media — media kit para ${business || name}`
        : `Leonix Media — media kit for ${business || name}`;
      body = es
        ? `Hola ${name},

Gracias por contactar a Leonix Media. Aquí está nuestro media kit:
${LEONIX_MEDIA_KIT_PDF_URL}

¿Le gustaría agendar una llamada breve? Cuéntenos sobre su negocio, categoría y timeline para empezar.

Saludos,
Equipo Leonix Media`
        : `Hi ${name},

Thank you for reaching out to Leonix Media. Here is our media kit:
${LEONIX_MEDIA_KIT_PDF_URL}

Would you like to schedule a quick call? Tell us about your business, category, and timeline to get started.

Best,
Leonix Media Team`;
      break;

    case "magazine":
      subject = es
        ? "Leonix Media — vista previa de la revista"
        : "Leonix Media — magazine preview";
      body = es
        ? `Hola ${name},

Gracias por su interés en Leonix Media. Leonix conecta negocios locales con la comunidad hispana.

Vea la revista de junio aquí:
${LEONIX_MAGAZINE_PREVIEW_URL}

¿Le gustaría información sobre anuncios o paquetes publicitarios?

Saludos,
Equipo Leonix Media`
        : `Hi ${name},

Thank you for your interest in Leonix Media. Leonix connects local businesses with the Hispanic community.

View the June magazine preview here:
${LEONIX_MAGAZINE_PREVIEW_URL}

Would you like information about ads or advertising packages?

Best,
Leonix Media Team`;
      break;

    case "advertising":
      subject = es
        ? `Leonix Media — publicidad para ${business || name}`
        : `Leonix Media — advertising for ${business || name}`;
      body = es
        ? `Hola ${name},

Gracias por contactar a Leonix Media sobre publicidad.

Media kit: ${LEONIX_MEDIA_KIT_PDF_URL}

¿Qué negocio desea promover y cuándo le gustaría empezar? Con gusto agendamos una llamada.

Saludos,
Equipo Leonix Media`
        : `Hi ${name},

Thank you for contacting Leonix Media about advertising.

Media kit: ${LEONIX_MEDIA_KIT_PDF_URL}

What business would you like to promote, and when would you like to start? Happy to schedule a call.

Best,
Leonix Media Team`;
      break;

    case "promoPrint":
      subject = es
        ? "Leonix — cotización de productos promocionales / impresión"
        : "Leonix — promotional products / print quote";
      body = es
        ? `Hola ${name},

Gracias por su solicitud de cotización promocional / impresión.

Para avanzar, comparta por favor:
• Tipo de producto
• Cantidad
• Fecha límite
• Si ya tiene logo o artwork

Nuestro equipo de promo/impresión dará seguimiento pronto. También puede responder a este correo o llamarnos.

Saludos,
Equipo Leonix`
        : `Hi ${name},

Thank you for your promotional / print quote request.

To move forward, please share:
• Product type
• Quantity
• Deadline
• Whether you already have logo or artwork

Our promo/print team will follow up soon. You can also reply to this email or call us.

Best,
Leonix Team`;
      break;

    default:
      subject = es ? "Leonix Media — gracias por contactarnos" : "Leonix Media — thank you for contacting us";
      body = es
        ? `Hola ${name},

Gracias por contactar a Leonix Media. Recibimos su mensaje y le responderemos pronto.

Saludos,
Equipo Leonix Media`
        : `Hi ${name},

Thank you for contacting Leonix Media. We received your message and will reply soon.

Best,
Leonix Media Team`;
  }

  return { kind, subject, body };
}

export function buildLeadPhoneScript(row: LeadReplyInput): string {
  const es = isSpanish(row.lang);
  const name = firstName(row.full_name);
  const kind = detectLeadReplyKind(row);

  if (es) {
    return [
      `Script — ${name} (${row.phone || "sin teléfono"})`,
      `Tipo: ${kind}`,
      "",
      `Hola ${name}, le habla [su nombre] de Leonix Media.`,
      kind === "mediaKit" || kind === "advertising"
        ? `Le envié nuestro media kit: ${LEONIX_MEDIA_KIT_PDF_URL}`
        : kind === "magazine"
          ? `Le comparto la revista: ${LEONIX_MAGAZINE_PREVIEW_URL}`
          : kind === "promoPrint"
            ? "Quería confirmar tipo de producto, cantidad, fecha límite y si tiene artwork."
            : "Quería dar seguimiento a su solicitud.",
      "¿Tiene un minuto para platicar?",
    ].join("\n");
  }

  return [
    `Script — ${name} (${row.phone || "no phone"})`,
    `Type: ${kind}`,
    "",
    `Hi ${name}, this is [your name] from Leonix Media.`,
    kind === "mediaKit" || kind === "advertising"
      ? `I sent our media kit: ${LEONIX_MEDIA_KIT_PDF_URL}`
      : kind === "magazine"
        ? `Sharing the magazine preview: ${LEONIX_MAGAZINE_PREVIEW_URL}`
        : kind === "promoPrint"
          ? "Confirming product type, quantity, deadline, and artwork availability."
          : "Following up on your inquiry.",
    "Do you have a minute to talk?",
  ].join("\n");
}

export function buildLeadMailtoUrl(row: LeadReplyInput): string {
  const { subject, body } = buildLeadReplyContent(row);
  const params = new URLSearchParams();
  params.set("subject", subject);
  params.set("body", body);
  return `mailto:${encodeURIComponent(row.email.trim())}?${params.toString()}`;
}

export function buildNewsletterReplyContent(row: NewsletterReplyInput): {
  subject: string;
  body: string;
} {
  const es = isSpanish(row.lang);
  const name = firstName(row.name);

  return es
    ? {
        subject: "Tu código Leonix Launch 25",
        body: `Hola ${name},

Gracias por unirte a Leonix Media.

Tu código Leonix Launch 25 es para productos web elegibles en checkout (anuncios y paquetes web). No aplica a paquetes impresos de revista, combos impresos+digital ni contratos manuales — esos son productos separados.

Si necesitas ayuda para usar tu código o publicar, contáctanos y con gusto te orientamos.

Saludos,
Equipo Leonix Media`,
      }
    : {
        subject: "Your Leonix Launch 25 code",
        body: `Hi ${name},

Thank you for joining Leonix Media.

Your Leonix Launch 25 code applies to eligible website checkout products (website ads and packages). It does not apply to printed magazine packages, print+digital combos, or manual contracts — those are separate products.

If you need help using your code or publishing, contact us and we'll be happy to guide you.

Best,
Leonix Media Team`,
      };
}

export function buildNewsletterMailtoUrl(row: NewsletterReplyInput): string {
  const { subject, body } = buildNewsletterReplyContent(row);
  const params = new URLSearchParams();
  params.set("subject", subject);
  params.set("body", body);
  return `mailto:${encodeURIComponent(row.email.trim())}?${params.toString()}`;
}

export function buildMediaKitReplyContent(row: MediaKitReplyInput): {
  subject: string;
  body: string;
} {
  const es = isSpanish(row.lang);
  const name = firstName(row.name);
  const business = row.business.trim();

  return es
    ? {
        subject: `Leonix Media — media kit para ${business || name}`,
        body: `Hola ${name},

Gracias por solicitar el media kit de Leonix Media:
${LEONIX_MEDIA_KIT_PDF_URL}

¿Le gustaría agendar una llamada? Cuéntenos sobre su negocio, categoría y timeline.

Saludos,
Equipo Leonix Media`,
      }
    : {
        subject: `Leonix Media — media kit for ${business || name}`,
        body: `Hi ${name},

Thank you for requesting the Leonix Media kit:
${LEONIX_MEDIA_KIT_PDF_URL}

Would you like to schedule a call? Tell us about your business, category, and timeline.

Best,
Leonix Media Team`,
      };
}

export function buildMediaKitMailtoUrl(row: MediaKitReplyInput): string {
  const { subject, body } = buildMediaKitReplyContent(row);
  const params = new URLSearchParams();
  params.set("subject", subject);
  params.set("body", body);
  return `mailto:${encodeURIComponent(row.email.trim())}?${params.toString()}`;
}

export type LeadNextActionInput = LeadReplyInput & {
  status: string;
  follow_up_at: string | null;
  last_contacted_at: string | null;
};

export function leadNextActionLabel(row: LeadNextActionInput): string {
  if (row.follow_up_at) {
    try {
      const fu = new Date(row.follow_up_at);
      if (Number.isFinite(fu.getTime())) {
        const overdue = fu.getTime() < Date.now();
        const label = fu.toLocaleDateString("es-MX", { month: "short", day: "numeric" });
        return overdue ? `Follow up overdue (${label})` : `Follow up ${label}`;
      }
    } catch {
      /* fall through */
    }
  }

  const status = row.status.trim().toLowerCase();
  if (status === "new" || status === "needs_reply") {
    return leadReplyKindLabel(detectLeadReplyKind(row));
  }
  if (status === "waiting_on_client") return "Waiting on client";
  if (status === "contacted") return "Check for response";
  if (status === "qualified") return "Close / qualify";
  if (status === "won") return "Won — archive when done";
  if (status === "lost") return "Lost — archive";
  if (status === "archived") return "Archived";

  return "Review lead";
}
