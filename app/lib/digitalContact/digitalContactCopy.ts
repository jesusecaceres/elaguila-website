import type { DigitalContactLang } from "./digitalContactTypes";

export function resolveDigitalContactLang(searchParams: URLSearchParams | Record<string, string | string[] | undefined> | undefined): DigitalContactLang {
  if (!searchParams) return "es";
  const raw =
    searchParams instanceof URLSearchParams
      ? searchParams.get("lang")
      : Array.isArray(searchParams.lang)
        ? searchParams.lang[0]
        : searchParams.lang;
  return raw === "en" ? "en" : "es";
}

export type DigitalContactCopy = {
  langToggle: { es: string; en: string };
  heroKicker: string;
  savePrompt: string;
  executiveCardTitle: string;
  officeLabel: string;
  phoneLabel: string;
  emailLabel: string;
  websiteLabel: string;
  quickActionsTitle: string;
  actionCall: string;
  actionText: string;
  actionWhatsapp: string;
  actionEmail: string;
  actionDirections: string;
  actionWebsite: string;
  actionCopyEmail: string;
  actionCopyPhone: string;
  copiedEmail: string;
  copiedPhone: string;
  saveTitle: string;
  saveBody: string;
  saveButton: string;
  saveCompat: string;
  qrTitle: string;
  qrBody: string;
  qrDownload: string;
  qrCopyLink: string;
  qrLinkCopied: string;
  showcaseTitle: string;
  showcaseSubtitle: string;
  leadTitle: string;
  leadSubtitle: string;
  leadName: string;
  leadBusiness: string;
  leadPhone: string;
  leadEmail: string;
  leadMessage: string;
  leadMessagePlaceholder: string;
  leadHowMet: string;
  leadHowMetPlaceholder: string;
  leadConsent: string;
  leadSubmit: string;
  leadSubmitting: string;
  leadSuccess: string;
  leadError: string;
  closingTitle: string;
  closingBody: string;
  closingCta: string;
  footerTagline: string;
  footerRights: string;
};

const ES: DigitalContactCopy = {
  langToggle: { es: "Español", en: "English" },
  heroKicker: "Contacto Ejecutivo",
  savePrompt: "Guarda mi contacto o escanea el código QR.",
  executiveCardTitle: "Información de Contacto",
  officeLabel: "Oficina",
  phoneLabel: "Teléfono",
  emailLabel: "Correo",
  websiteLabel: "Sitio web",
  quickActionsTitle: "Acciones Rápidas",
  actionCall: "Llamar",
  actionText: "Mensaje",
  actionWhatsapp: "WhatsApp",
  actionEmail: "Correo",
  actionDirections: "Direcciones",
  actionWebsite: "Sitio Web",
  actionCopyEmail: "Copiar Correo",
  actionCopyPhone: "Copiar Teléfono",
  copiedEmail: "Correo copiado.",
  copiedPhone: "Teléfono copiado.",
  saveTitle: "Guardar Contacto",
  saveBody: "Agrega este contacto directamente a tu teléfono o computadora.",
  saveButton: "Guardar en Contactos",
  saveCompat: "Compatible con iPhone, Android y escritorio.",
  qrTitle: "Código QR",
  qrBody: "Escanea para abrir esta tarjeta de contacto al instante.",
  qrDownload: "Descargar QR",
  qrCopyLink: "Copiar enlace",
  qrLinkCopied: "Enlace copiado.",
  showcaseTitle: "Leonix Media",
  showcaseSubtitle: "Un vistazo a lo que construimos para negocios como el tuyo.",
  leadTitle: "Conectemos",
  leadSubtitle: "Comparte tus datos y te contactaremos personalmente.",
  leadName: "Nombre completo",
  leadBusiness: "Negocio (opcional)",
  leadPhone: "Teléfono (opcional)",
  leadEmail: "Correo electrónico",
  leadMessage: "Mensaje (opcional)",
  leadMessagePlaceholder: "¿En qué podemos ayudarte?",
  leadHowMet: "¿Cómo nos conocimos? (opcional)",
  leadHowMetPlaceholder: "Selecciona una opción",
  leadConsent: "Acepto que Leonix Media se comunique conmigo sobre esta solicitud.",
  leadSubmit: "Enviar",
  leadSubmitting: "Enviando…",
  leadSuccess: "Gracias — recibimos tu información y te contactaremos pronto.",
  leadError: "No pudimos enviar tu información. Intenta de nuevo o contáctanos directamente.",
  closingTitle: "¿Listo para dar el siguiente paso?",
  closingBody: "Agenda una consulta y descubre cómo Leonix Media puede ayudar a tu negocio.",
  closingCta: "Solicitar Consulta",
  footerTagline: "Que Ruja El León — Let The Lion Roar",
  footerRights: "Todos los derechos reservados.",
};

const EN: DigitalContactCopy = {
  langToggle: { es: "Español", en: "English" },
  heroKicker: "Executive Contact",
  savePrompt: "Save my contact or scan the QR code.",
  executiveCardTitle: "Contact Information",
  officeLabel: "Office",
  phoneLabel: "Phone",
  emailLabel: "Email",
  websiteLabel: "Website",
  quickActionsTitle: "Quick Actions",
  actionCall: "Call",
  actionText: "Text",
  actionWhatsapp: "WhatsApp",
  actionEmail: "Email",
  actionDirections: "Directions",
  actionWebsite: "Website",
  actionCopyEmail: "Copy Email",
  actionCopyPhone: "Copy Phone",
  copiedEmail: "Email copied.",
  copiedPhone: "Phone copied.",
  saveTitle: "Save Contact",
  saveBody: "Add this contact directly to your phone or computer.",
  saveButton: "Save to Contacts",
  saveCompat: "Works on iPhone, Android, and desktop.",
  qrTitle: "QR Code",
  qrBody: "Scan to open this contact card instantly.",
  qrDownload: "Download QR",
  qrCopyLink: "Copy link",
  qrLinkCopied: "Link copied.",
  showcaseTitle: "Leonix Media",
  showcaseSubtitle: "A glimpse of what we build for businesses like yours.",
  leadTitle: "Let's Connect",
  leadSubtitle: "Share your details and we'll reach out personally.",
  leadName: "Full name",
  leadBusiness: "Business (optional)",
  leadPhone: "Phone (optional)",
  leadEmail: "Email address",
  leadMessage: "Message (optional)",
  leadMessagePlaceholder: "How can we help?",
  leadHowMet: "How did we meet? (optional)",
  leadHowMetPlaceholder: "Select an option",
  leadConsent: "I agree that Leonix Media may contact me about this request.",
  leadSubmit: "Send",
  leadSubmitting: "Sending…",
  leadSuccess: "Thank you — we received your information and will reach out soon.",
  leadError: "We couldn't send your information. Please try again or contact us directly.",
  closingTitle: "Ready to take the next step?",
  closingBody: "Book a consultation and discover how Leonix Media can help your business.",
  closingCta: "Request Consultation",
  footerTagline: "Que Ruja El León — Let The Lion Roar",
  footerRights: "All rights reserved.",
};

export function getDigitalContactCopy(lang: DigitalContactLang): DigitalContactCopy {
  return lang === "en" ? EN : ES;
}
