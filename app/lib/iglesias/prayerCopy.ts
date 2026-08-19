import type { IglesiasUiLang } from "./taxonomy";
import { PRAYER_CATEGORY_LABELS, PRAYER_CATEGORY_KEYS, type PrayerCategoryKey } from "./prayerTaxonomy";

export type PrayerUiCopy = {
  wallLiveEyebrow: string;
  submitTitle: string;
  submitSupport: string;
  bodyLabel: string;
  bodyHelp: string;
  visibilityLegend: string;
  visNamed: string;
  visNamedHelp: string;
  visAnonymous: string;
  visAnonymousHelp: string;
  visPrivate: string;
  visPrivateHelp: string;
  languageLabel: string;
  displayNameLabel: string;
  cityLabel: string;
  categoryLabel: string;
  categoryNone: string;
  privacyWarning: string;
  contactConsent: string;
  contactMethod: string;
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: string;
  submit: string;
  submitting: string;
  privacyNote: string;
  emptyWall: string;
  imPraying: string;
  imPrayingDone: string;
  prayingCount: (n: number) => string;
  report: string;
  reportTitle: string;
  reportSubmit: string;
  reportThanks: string;
  reportHate: string;
  reportThreat: string;
  reportPii: string;
  reportSpam: string;
  reportInappropriate: string;
  reportOther: string;
  updateStill: string;
  updateNote: string;
  updateThanks: string;
  updateClose: string;
  updateBodyLabel: string;
  updateSubmit: string;
  outcomePublished: string;
  outcomeReview: string;
  outcomePrivate: string;
  outcomePrivateSupport: string;
  outcomeCrisis: string;
  outcomeCrisisSupport: string;
  outcomeHold: string;
  errorBody: string;
  errorGeneric: string;
  errorRate: string;
  errorDuplicate: string;
  networkTitle: string;
  networkBody: string;
  latestUpdate: string;
  optional: string;
  methodEmail: string;
  methodPhone: string;
  methodWhatsapp: string;
};

const ES: PrayerUiCopy = {
  wallLiveEyebrow: "Muro de oración",
  submitTitle: "Comparte una petición",
  submitSupport: "Puedes pedir oración sin crear una cuenta. Elige cómo quieres que se vea tu petición.",
  bodyLabel: "Tu petición",
  bodyHelp: "Escribe con tus palabras. No hace falta que suene “correcto”.",
  visibilityLegend: "Cómo quieres compartirla",
  visNamed: "Pública, con mi nombre",
  visNamedHelp: "Otras personas verán el nombre que escribas y podrán orar contigo.",
  visAnonymous: "Pública, anónima",
  visAnonymousHelp: "Se publicará como Anónimo. No mostramos tu cuenta ni tu identidad.",
  visPrivate: "Privada, solo equipos de oración",
  visPrivateHelp: "No aparece en el muro público. La Red de Oración todavía se está preparando.",
  languageLabel: "Idioma de tu petición",
  displayNameLabel: "Nombre para mostrar",
  cityLabel: "Ciudad (opcional)",
  categoryLabel: "Tema (opcional)",
  categoryNone: "Sin tema",
  privacyWarning:
    "Por favor no incluyas información privada de otra persona, como su nombre completo, teléfono, dirección, número de expediente médico u otros datos que la identifiquen.",
  contactConsent: "Si es privado, puedes dejar un contacto solo para el equipo de Leonix (opcional).",
  contactMethod: "Cómo prefieres que te contacten",
  contactEmail: "Correo",
  contactPhone: "Teléfono",
  contactWhatsapp: "WhatsApp",
  submit: "Enviar petición",
  submitting: "Enviando…",
  privacyNote: "No publicamos teléfonos, correos ni datos de contacto en el muro.",
  emptyWall:
    "No hay peticiones públicas todavía. Si necesitas oración, puedes ser la primera persona en compartir una.",
  imPraying: "Estoy orando",
  imPrayingDone: "Estoy orando ✓",
  prayingCount: (n) => (n === 1 ? "1 persona está orando" : `${n} personas están orando`),
  report: "Reportar",
  reportTitle: "Reportar esta petición",
  reportSubmit: "Enviar reporte",
  reportThanks: "Gracias. Un moderador la revisará.",
  reportHate: "Odio o acoso",
  reportThreat: "Amenaza",
  reportPii: "Información privada",
  reportSpam: "Spam",
  reportInappropriate: "Inapropiado",
  reportOther: "Otro",
  updateStill: "Sigue necesitando oración",
  updateNote: "Actualización",
  updateThanks: "Gracias por sus oraciones",
  updateClose: "Cerrar petición",
  updateBodyLabel: "Mensaje de actualización (opcional)",
  updateSubmit: "Guardar",
  outcomePublished: "Tu petición ya está en el muro. Gracias por confiar en este espacio.",
  outcomeReview: "Tu petición fue recibida y está siendo revisada antes de publicarse.",
  outcomePrivate: "Tu petición privada fue recibida de forma segura.",
  outcomePrivateSupport: "Estamos preparando la Red de Oración para compartir solicitudes privadas con equipos participantes.",
  outcomeCrisis: "Recibimos tu mensaje y lo estamos cuidando con atención.",
  outcomeCrisisSupport:
    "Si tú u otra persona puede estar en peligro inmediato, contacta ahora a los servicios de emergencia locales.",
  outcomeHold: "Tu petición fue recibida y no se publicó. Un moderador la revisará.",
  errorBody: "Escribe un poco más para que podamos entender tu petición.",
  errorGeneric: "No pudimos enviar la petición. Inténtalo de nuevo.",
  errorRate: "Espera un momento antes de enviar otra petición.",
  errorDuplicate: "Ya recibimos una petición muy similar hace poco.",
  networkTitle: "Red de oración",
  networkBody: "Iglesias podrán unirse para orar con quienes lo pidan en privado. Esa red todavía no está abierta.",
  latestUpdate: "Actualización",
  optional: "opcional",
  methodEmail: "Correo",
  methodPhone: "Teléfono",
  methodWhatsapp: "WhatsApp",
};

const EN: PrayerUiCopy = {
  wallLiveEyebrow: "Prayer wall",
  submitTitle: "Share a request",
  submitSupport: "You can ask for prayer without creating an account. Choose how your request should appear.",
  bodyLabel: "Your request",
  bodyHelp: "Write in your own words. It does not have to sound “correct.”",
  visibilityLegend: "How you want to share it",
  visNamed: "Public, show my name",
  visNamedHelp: "Other people will see the name you enter and can pray with you.",
  visAnonymous: "Public, anonymous",
  visAnonymousHelp: "It will appear as Anonymous. We do not show your account or identity.",
  visPrivate: "Private, prayer teams only",
  visPrivateHelp: "It will not appear on the public wall. The Prayer Network is still being prepared.",
  languageLabel: "Language of your request",
  displayNameLabel: "Name to display",
  cityLabel: "City (optional)",
  categoryLabel: "Topic (optional)",
  categoryNone: "No topic",
  privacyWarning:
    "Please do not include private information about another person, such as their full name, phone number, address, medical record number, or other identifying details.",
  contactConsent: "For a private request, you may leave contact details for the Leonix team only (optional).",
  contactMethod: "How you prefer to be contacted",
  contactEmail: "Email",
  contactPhone: "Phone",
  contactWhatsapp: "WhatsApp",
  submit: "Send request",
  submitting: "Sending…",
  privacyNote: "We do not publish phone numbers, emails, or contact details on the wall.",
  emptyWall: "There are no public prayer requests yet. If you need prayer, you can be the first person to share one.",
  imPraying: "I’m praying",
  imPrayingDone: "I’m praying ✓",
  prayingCount: (n) => (n === 1 ? "1 person is praying" : `${n} people are praying`),
  report: "Report",
  reportTitle: "Report this request",
  reportSubmit: "Send report",
  reportThanks: "Thank you. A moderator will review it.",
  reportHate: "Hate or harassment",
  reportThreat: "Threat",
  reportPii: "Private information",
  reportSpam: "Spam",
  reportInappropriate: "Inappropriate",
  reportOther: "Other",
  updateStill: "Still needs prayer",
  updateNote: "Update",
  updateThanks: "Thank you for praying",
  updateClose: "Close request",
  updateBodyLabel: "Update message (optional)",
  updateSubmit: "Save",
  outcomePublished: "Your request is on the wall. Thank you for trusting this space.",
  outcomeReview: "Your request was received and is being reviewed before it is published.",
  outcomePrivate: "Your private request was received securely.",
  outcomePrivateSupport: "We are preparing the Prayer Network to share private requests with participating teams.",
  outcomeCrisis: "We received your message and are treating it with care.",
  outcomeCrisisSupport: "If you or someone else may be in immediate danger, contact local emergency services now.",
  outcomeHold: "Your request was received and was not published. A moderator will review it.",
  errorBody: "Please write a little more so we can understand your request.",
  errorGeneric: "We could not send the request. Please try again.",
  errorRate: "Please wait a moment before sending another request.",
  errorDuplicate: "We already received a very similar request a short time ago.",
  networkTitle: "Prayer network",
  networkBody: "Churches will be able to pray with people who ask privately. That network is not open yet.",
  latestUpdate: "Update",
  optional: "optional",
  methodEmail: "Email",
  methodPhone: "Phone",
  methodWhatsapp: "WhatsApp",
};

export function getPrayerUiCopy(lang: IglesiasUiLang): PrayerUiCopy {
  return lang === "en" ? EN : ES;
}

export function prayerCategoryOptions(lang: IglesiasUiLang): Array<{ value: PrayerCategoryKey; label: string }> {
  return PRAYER_CATEGORY_KEYS.map((key) => ({
    value: key,
    label: PRAYER_CATEGORY_LABELS[key][lang],
  }));
}
