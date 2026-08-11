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
  emailModalOpen: string;
  emailModalShare: string;
  emailModalClose: string;
  linkCopiedToast: string;
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
  /** Executive identity mission line — fixed Leonix brand statement, shown in both languages at once (like `footerTagline`), independent of the active toggle. */
  missionEn: string;
  missionEs: string;
  whatWeDoKicker: string;
  whatWeDoTitle: string;
  whatWeDoBody: string;
  whatWeDoClosing1: string;
  whatWeDoClosing2: string;
  aboutTitlePrefix: string;
  focusTitle: string;
  socialTitle: string;
  socialSubtitle: string;
  comingSoonLabel: string;
  businessHubKicker: string;
  businessHubTitle: string;
  businessHubBody: string;
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
  emailModalOpen: "Abrir Correo",
  emailModalShare: "Compartir",
  emailModalClose: "Cerrar",
  linkCopiedToast: "Enlace copiado.",
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
  missionEn: "Building Better Businesses. Creating Better Lives.",
  missionEs: "Construyendo Mejores Negocios. Creando Mejores Vidas.",
  whatWeDoKicker: "Leonix Media",
  whatWeDoTitle: "Qué Hacemos",
  whatWeDoBody:
    "Leonix ayuda a los emprendedores a construir mejores negocios mediante desarrollo empresarial, tecnología, inteligencia artificial, marca, automatización, sitios web, marketing y acompañamiento estratégico.",
  whatWeDoClosing1: "No solamente publicitamos negocios.",
  whatWeDoClosing2: "Ayudamos a construirlos.",
  aboutTitlePrefix: "Conoce a",
  focusTitle: "Enfoque Profesional",
  socialTitle: "Mantente Conectado",
  socialSubtitle: "Síguenos para novedades, ideas y lo próximo en Leonix Media.",
  comingSoonLabel: "Próximamente",
  businessHubKicker: "Lo que viene",
  businessHubTitle: "Business Hub",
  businessHubBody:
    "Tu Business Hub se convertirá en el único lugar donde tus clientes podrán descubrir tu negocio, servicios, reseñas, información de contacto, productos, redes sociales, promociones y el futuro AI Business Concierge.",
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
  emailModalOpen: "Open Email",
  emailModalShare: "Share",
  emailModalClose: "Close",
  linkCopiedToast: "Link copied.",
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
  missionEn: "Building Better Businesses. Creating Better Lives.",
  missionEs: "Construyendo Mejores Negocios. Creando Mejores Vidas.",
  whatWeDoKicker: "Leonix Media",
  whatWeDoTitle: "What We Do",
  whatWeDoBody:
    "Leonix helps entrepreneurs build better businesses through business development, technology, artificial intelligence, branding, automation, websites, marketing, and long-term strategic guidance.",
  whatWeDoClosing1: "We don't simply advertise businesses.",
  whatWeDoClosing2: "We help build them.",
  aboutTitlePrefix: "Meet",
  focusTitle: "Professional Focus",
  socialTitle: "Stay Connected",
  socialSubtitle: "Follow along for updates, insights, and what's next from Leonix Media.",
  comingSoonLabel: "Coming Soon",
  businessHubKicker: "What's Coming Next",
  businessHubTitle: "Business Hub",
  businessHubBody:
    "Your Business Hub will become the single place where customers can discover your business, services, reviews, contact information, products, social media, promotions, and future AI Business Concierge.",
};

export function getDigitalContactCopy(lang: DigitalContactLang): DigitalContactCopy {
  return lang === "en" ? EN : ES;
}
