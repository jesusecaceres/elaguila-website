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
  /** Build 03 — executive routing context (human language only). */
  availWithinHours: string;
  availOutsideHours: string;
  availAvailable: string;
  availBusy: string;
  availAway: string;
  availAbsentFallback: string;
  availBackupCta: string;
  availContactHoursLabel: string;
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
  /** Accessible micro-cue on each Professional Focus card (sr-only + hint text). */
  focusTapHint: string;
  /** aria-label for the close affordance on an expanded Professional Focus card detail. */
  focusCloseLabel: string;
  socialTitle: string;
  socialSubtitle: string;
  comingSoonLabel: string;
  /** "Lo que viene" teaser — Business Concierge (NOT Business Hub; Business Hub is no longer presented as Chuy's coming-soon item). */
  businessConciergeKicker: string;
  businessConciergeTitle: string;
  businessConciergeLead: string;
  businessConciergeBody: string;
  /** Fixed bilingual badge, shown identically regardless of the active lang toggle (same pattern as `footerTagline`). */
  businessConciergeBadge: string;
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
  availWithinHours: "Dentro de su horario habitual de contacto.",
  availOutsideHours: "Fuera de su horario habitual de contacto.",
  availAvailable: "Disponible para contacto en este momento.",
  availBusy: "En este momento no está disponible.",
  availAway: "Está fuera temporalmente.",
  availAbsentFallback: "No está disponible por ahora.",
  availBackupCta: "También puedes comunicarte con",
  availContactHoursLabel: "Horario de contacto",
  missionEn: "Building Better Businesses. Creating Better Lives.",
  missionEs: "Construyendo Mejores Negocios. Creando Mejores Vidas.",
  whatWeDoKicker: "Leonix Media",
  whatWeDoTitle: "Qué Hacemos",
  whatWeDoBody:
    "Leonix ayuda a los emprendedores a construir mejores negocios mediante desarrollo empresarial, tecnología, inteligencia artificial, marca, automatización, sitios web, marketing y acompañamiento estratégico.",
  whatWeDoClosing1: "No solo publicitamos negocios.",
  whatWeDoClosing2: "Ayudamos a construirlos.",
  aboutTitlePrefix: "Conoce a",
  focusTitle: "Enfoque Profesional",
  focusTapHint: "Toca para más información",
  focusCloseLabel: "Cerrar",
  socialTitle: "Mantente Conectado",
  socialSubtitle: "Síguenos para novedades, ideas y lo próximo en Leonix Media.",
  comingSoonLabel: "Próximamente",
  businessConciergeKicker: "Lo que viene",
  businessConciergeTitle: "Business Concierge",
  businessConciergeLead: "Tu negocio. Mejor entendido. Mejor acompañado.",
  businessConciergeBody:
    "Business Concierge se está construyendo para ayudar a los dueños de negocios locales a organizar lo que importa, entender sus próximos pasos y conectarse con herramientas y recursos útiles de Leonix — todo en un solo lugar.",
  businessConciergeBadge: "PRÓXIMAMENTE / COMING SOON",
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
  availWithinHours: "Within normal contact hours.",
  availOutsideHours: "Outside normal contact hours.",
  availAvailable: "Available to connect right now.",
  availBusy: "Not available at the moment.",
  availAway: "Temporarily away.",
  availAbsentFallback: "Not available right now.",
  availBackupCta: "You can also reach",
  availContactHoursLabel: "Contact hours",
  missionEn: "Building Better Businesses. Creating Better Lives.",
  missionEs: "Construyendo Mejores Negocios. Creando Mejores Vidas.",
  whatWeDoKicker: "Leonix Media",
  whatWeDoTitle: "What We Do",
  whatWeDoBody:
    "Leonix helps entrepreneurs build better businesses through business development, technology, artificial intelligence, branding, automation, websites, marketing, and long-term strategic guidance.",
  whatWeDoClosing1: "We do more than advertise businesses.",
  whatWeDoClosing2: "We help build them.",
  aboutTitlePrefix: "Meet",
  focusTitle: "Professional Focus",
  focusTapHint: "Tap to learn more",
  focusCloseLabel: "Close",
  socialTitle: "Stay Connected",
  socialSubtitle: "Follow along for updates, insights, and what's next from Leonix Media.",
  comingSoonLabel: "Coming Soon",
  businessConciergeKicker: "What's Coming Next",
  businessConciergeTitle: "Business Concierge",
  businessConciergeLead: "Your business. Better understood. Better supported.",
  businessConciergeBody:
    "Business Concierge is being built to help local business owners organize what matters, understand their next steps, and connect with useful Leonix tools and resources — all in one place.",
  businessConciergeBadge: "PRÓXIMAMENTE / COMING SOON",
};

export function getDigitalContactCopy(lang: DigitalContactLang): DigitalContactCopy {
  return lang === "en" ? EN : ES;
}
