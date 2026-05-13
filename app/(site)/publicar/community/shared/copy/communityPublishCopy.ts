import type {
  ClasesCostType,
  ClasesMode,
  ClasesPriceFrequency,
  ComunidadCostType,
} from "../types/communityQuickDraft";

type LangPair = { es: string; en: string };

export const COMMUNITY_PUBLISH_COPY = {
  es: {
    gateFail: "Completa los campos marcados con * antes de la vista previa:",
    publishBlocked: "Completa los requisitos de vista previa antes de publicar.",
    paidClassPublishBlocked: "Las clases pagadas requieren activación de publicación pagada.",
    finalStep: {
      title: "Revisión final",
      intro:
        "Con sesión iniciada, Publicar crea el anuncio en Leonix Clasificados (tabla listings), sube fotos al bucket listing-images en la ruta de tu usuario y te lleva al detalle público. Los PDF no se publican aún: quítalos del volante antes de publicar.",
      sessionDraftLine: "Tu borrador se guarda automáticamente en esta sesión del navegador.",
      previewCta: "Vista previa",
      publishCta: "Publicar anuncio",
      saveDraftCta: "Guardar en sesión",
      deleteRequest: "Eliminar borrador",
      deleteConfirm: "¿Eliminar este borrador? Se perderán los cambios no publicados.",
    },
    discoveryRegionLine: "Región de descubrimiento: NorCal",
    cityAutocompleteHint:
      "Elige una ciudad de la lista para que el anuncio aparezca en los filtros de NorCal.",
    publishModal: {
      title: "Confirmar publicación",
      intro:
        "Al continuar confirmas que revisaste el anuncio. Publicar guarda en Supabase y abre el detalle público cuando las fotos suben correctamente.",
      checks: [
        "Confirmo que la información es verídica y la puedo respaldar.",
        "Confirmo que las fotos representan la clase o evento anunciado.",
        "Acepto las reglas de la comunidad Leonix Clasificados.",
      ] as [string, string, string],
      confirmCta: "Continuar",
      cancelCta: "Cancelar",
      blockedHint: "Marca las tres casillas para continuar.",
      closeOverlayAria: "Cerrar",
    },
    previewNoDraft: {
      message: "No hay borrador de sesión para mostrar.",
      backLink: "Volver a editar",
    },
    saveDraftSessionNotice:
      "Borrador guardado en esta sesión (solo el navegador). Usa Publicar para crear el anuncio en Leonix.",
    stillNeededTitle: "Falta completar:",
    approvalPublishBlocked: "Marca las tres confirmaciones antes de publicar.",
  },
  en: {
    gateFail: "Complete required fields (*) before preview:",
    publishBlocked: "Complete preview requirements before publishing.",
    paidClassPublishBlocked: "Paid classes require paid publishing activation.",
    finalStep: {
      title: "Final review",
      intro:
        "When signed in, Publish creates the listing in Leonix Clasificados (listings table), uploads photos to the listing-images bucket under your user path, then opens the public detail page. PDFs are not published yet — remove PDF flyers before publishing.",
      sessionDraftLine: "Your draft is auto-saved in this browser session.",
      previewCta: "Preview",
      publishCta: "Publish listing",
      saveDraftCta: "Save to session",
      deleteRequest: "Delete draft",
      deleteConfirm: "Delete this draft? Unpublished changes will be lost.",
    },
    discoveryRegionLine: "Discovery region: NorCal",
    cityAutocompleteHint:
      "Choose a city from the list so the listing works with NorCal filters.",
    publishModal: {
      title: "Confirm publish",
      intro: "By continuing you confirm you reviewed the listing. Publish saves to Supabase and opens the public detail when photo uploads succeed.",
      checks: [
        "I confirm the information is truthful and I can stand behind it.",
        "I confirm photos represent the class or event.",
        "I accept Leonix Clasificados community rules.",
      ] as [string, string, string],
      confirmCta: "Continue",
      cancelCta: "Cancel",
      blockedHint: "Check all three boxes to continue.",
      closeOverlayAria: "Close",
    },
    previewNoDraft: {
      message: "No session draft to display.",
      backLink: "Back to edit",
    },
    saveDraftSessionNotice:
      "Draft saved in this session (browser only). Use Publish to create the listing on Leonix.",
    stillNeededTitle: "Still needed:",
    approvalPublishBlocked: "Check all three confirmations before publishing.",
  },
} as const;

export const CLASES_QUICK_COPY = {
  es: {
    pageTitle: "Clase rápida",
    pageSubtitle:
      "Completa cada sección. La vista previa y la publicación están al final, en el paso de revisión.",
    sections: {
      main: "1. Información principal",
      cost: "2. Costo de la clase",
      mode: "3. Modalidad y horario",
      media: "4. Imagen / flyer",
      cta: "5. Contacto / CTA",
      location: "6. Ubicación",
    },
    fields: {
      title: "Título de la clase",
      organizer: "Organizador, instructor o negocio",
      category: "Tipo / categoría de la clase",
      categoryOther: "Escribe el tipo de clase",
      classCostType: "Tipo de cobro",
      classCostFree: "Clase gratis",
      classCostPaid: "Clase pagada",
      priceAmount: "Precio",
      priceFrequency: "Precio por",
      priceNote: "Nota de precio",
      mode: "Modalidad",
      modePresencial: "Presencial",
      modeEnLinea: "En línea",
      modeHibrida: "Híbrida",
      weeklySchedule: "Horario semanal",
      weeklyHelper:
        "Selecciona los días y horarios en que se ofrece la clase.",
      weeklyClosed: "Sin clase",
      description: "Descripción corta",
      image: "Flyer / medios",
      imageHint:
        "Puedes subir imagen o PDF para la vista previa. La publicación en Leonix solo acepta imágenes (JPG/PNG/WebP); si hay PDF, quítalo antes de publicar.",
      publicCity: "Ciudad donde se ofrece la clase",
      stateLabel: "Estado",
      zipLabel: "Código postal",
      venue: "Nombre del lugar",
      addressLine1: "Dirección",
      addressLine1Helper: "Número y calle",
      addressLine1Placeholder: "Número y calle",
      audience: "¿Para quién es la clase?",
      skillLevel: "Nivel",
      registrationRequired: "¿Requiere registro?",
      bringNote: "Qué deben llevar o saber",
    },
    primaryCtaHint:
      "La acción principal es la que destacamos primero; el resto de datos seguirá visible.",
  },
  en: {
    pageTitle: "Quick class",
    pageSubtitle:
      "Complete each section. Preview and publish are at the bottom, in the final review step.",
    sections: {
      main: "1. Main details",
      cost: "2. Class cost",
      mode: "3. Mode & schedule",
      media: "4. Image / flyer",
      cta: "5. Contact / CTA",
      location: "6. Location",
    },
    fields: {
      title: "Class title",
      organizer: "Organizer, instructor, or business",
      category: "Class type / category",
      categoryOther: "Enter the class type",
      classCostType: "Cost type",
      classCostFree: "Free class",
      classCostPaid: "Paid class",
      priceAmount: "Price",
      priceFrequency: "Price per",
      priceNote: "Price note",
      mode: "Mode",
      modePresencial: "In person",
      modeEnLinea: "Online",
      modeHibrida: "Hybrid",
      weeklySchedule: "Weekly schedule",
      weeklyHelper: "Select the days and times when the class is offered.",
      weeklyClosed: "No class",
      description: "Short description",
      image: "Flyer / media",
      imageHint:
        "You can upload an image or PDF for preview. Leonix publish accepts images (JPG/PNG/WebP) only — remove PDFs before publishing.",
      publicCity: "City where the class is offered",
      stateLabel: "State",
      zipLabel: "ZIP",
      venue: "Venue name",
      addressLine1: "Street address",
      addressLine1Helper: "Street number and street name",
      addressLine1Placeholder: "Número y calle",
      audience: "Who is this class for?",
      skillLevel: "Level",
      registrationRequired: "Registration required?",
      bringNote: "What to bring or know",
    },
    primaryCtaHint:
      "We highlight one primary action first; any other contact details you add stay visible.",
  },
} as const;

export const COMUNIDAD_QUICK_COPY = {
  es: {
    pageTitle: "Evento comunitario rápido",
    pageSubtitle:
      "Completa cada sección. Publicar en Comunidad es gratis. La vista previa y la publicación están al final.",
    sections: {
      main: "1. Información principal",
      cost: "2. Costo del evento",
      schedule: "3. Fecha y hora",
      media: "4. Imagen / flyer",
      cta: "5. Contacto / CTA",
      location: "6. Ubicación",
    },
    fields: {
      title: "Título del evento",
      organizer: "Organizador",
      category: "Tipo / categoría del evento",
      categoryOther: "Describe el tipo de evento",
      eventCost: "Costo del evento",
      eventCostFree: "Gratis",
      eventCostPaid: "Pagado",
      eventCostDonation: "Donación sugerida",
      eventCostUnknown: "No estoy seguro",
      admissionNote: "Nota de admisión",
      date: "Fecha de inicio del evento",
      eventEndDate: "Fecha de fin",
      eventSessionStart: "Hora de inicio del evento",
      eventSessionEnd: "Hora de fin del evento",
      weeklySchedule: "Días y horarios del evento",
      weeklyHelper:
        "Activa días con horario semanal, o define hora de inicio y fin en una sola sesión (se requiere al menos una opción).",
      weeklyClosed: "No aplica",
      description: "Descripción corta",
      image: "Flyer / medios",
      imageHint:
        "Puedes subir imagen o PDF para la vista previa. La publicación en Leonix solo acepta imágenes (JPG/PNG/WebP); si hay PDF, quítalo antes de publicar.",
      publicCity: "Ciudad donde se realiza el evento",
      stateLabel: "Estado",
      zipLabel: "Código postal",
      venue: "Nombre del lugar",
      addressLine1: "Dirección",
      addressLine1Helper: "Número y calle",
      addressLine1Placeholder: "Número y calle",
      audience: "¿Para quién es el evento?",
      registrationRequired: "¿Requiere registro?",
      accessibility: "Acceso",
      bringNote: "Qué deben llevar o saber",
    },
    primaryCtaHint:
      "La acción principal es la que destacamos primero; el resto de datos seguirá visible.",
    freePostingNotice:
      "Publicar en Comunidad es siempre gratis. El evento puede ser gratis, pagado o con donación.",
  },
  en: {
    pageTitle: "Quick community event",
    pageSubtitle:
      "Complete each section. Posting in Community is free. Preview and publish are at the bottom.",
    sections: {
      main: "1. Main details",
      cost: "2. Event cost",
      schedule: "3. Date & time",
      media: "4. Image / flyer",
      cta: "5. Contact / CTA",
      location: "6. Location",
    },
    fields: {
      title: "Event title",
      organizer: "Organizer",
      category: "Event type / category",
      categoryOther: "Enter the event type",
      eventCost: "Event cost",
      eventCostFree: "Free",
      eventCostPaid: "Paid",
      eventCostDonation: "Suggested donation",
      eventCostUnknown: "Not sure",
      admissionNote: "Admission note",
      date: "Event start date",
      eventEndDate: "End date",
      eventSessionStart: "Event start time",
      eventSessionEnd: "Event end time",
      weeklySchedule: "Event days & times",
      weeklyHelper:
        "Enable weekdays with a weekly schedule, or set a single session start and end time (at least one option is required).",
      weeklyClosed: "Does not apply",
      description: "Short description",
      image: "Flyer / media",
      imageHint:
        "You can upload an image or PDF for preview. Leonix publish accepts images (JPG/PNG/WebP) only — remove PDFs before publishing.",
      publicCity: "City where the event takes place",
      stateLabel: "State",
      zipLabel: "ZIP",
      venue: "Venue name",
      addressLine1: "Street address",
      addressLine1Helper: "Street number and street name",
      addressLine1Placeholder: "Número y calle",
      audience: "Who is this event for?",
      registrationRequired: "Registration required?",
      accessibility: "Access",
      bringNote: "What to bring or know",
    },
    primaryCtaHint:
      "We highlight one primary action first; any other contact details you add stay visible.",
    freePostingNotice:
      "Posting in Community is always free. The event itself may be free, paid, or by donation.",
  },
} as const;

export function clasesCostLabel(t: ClasesCostType, lang: "es" | "en"): string {
  if (lang === "en") return t === "gratis" ? "Free class" : "Paid class";
  return t === "gratis" ? "Clase gratis" : "Clase pagada";
}

const CLASES_FREQ_LABELS_ES: Record<ClasesPriceFrequency, string> = {
  porClase: "por clase",
  porSesion: "por sesión",
  porMes: "por mes",
  porCursoCompleto: "por curso completo",
  otro: "otro",
};

const CLASES_FREQ_LABELS_EN: Record<ClasesPriceFrequency, string> = {
  porClase: "per class",
  porSesion: "per session",
  porMes: "per month",
  porCursoCompleto: "per full course",
  otro: "other",
};

export function clasesFrequencyLabel(f: ClasesPriceFrequency, lang: "es" | "en"): string {
  return lang === "en" ? CLASES_FREQ_LABELS_EN[f] : CLASES_FREQ_LABELS_ES[f];
}

const CLASES_MODE_LABELS_ES: Record<ClasesMode, string> = {
  presencial: "Presencial",
  enLinea: "En línea",
  hibrida: "Híbrida",
};

const CLASES_MODE_LABELS_EN: Record<ClasesMode, string> = {
  presencial: "In person",
  enLinea: "Online",
  hibrida: "Hybrid",
};

export function clasesModeLabel(m: ClasesMode, lang: "es" | "en"): string {
  return lang === "en" ? CLASES_MODE_LABELS_EN[m] : CLASES_MODE_LABELS_ES[m];
}

const COMUNIDAD_COST_LABELS_ES: Record<ComunidadCostType, string> = {
  gratis: "Gratis",
  pagado: "Entrada pagada",
  donacion: "Donación sugerida",
  noConfirmado: "Costo no confirmado",
};

const COMUNIDAD_COST_LABELS_EN: Record<ComunidadCostType, string> = {
  gratis: "Free",
  pagado: "Paid admission",
  donacion: "Suggested donation",
  noConfirmado: "Cost to be confirmed",
};

export function comunidadCostLabel(c: ComunidadCostType, lang: "es" | "en"): string {
  return lang === "en" ? COMUNIDAD_COST_LABELS_EN[c] : COMUNIDAD_COST_LABELS_ES[c];
}

export const CTA_LABELS: Record<"es" | "en", LangPair & { primary: string; whatsapp: string }> = {
  es: { es: "", en: "", primary: "Acción principal preferida *", whatsapp: "WhatsApp" },
  en: { es: "", en: "", primary: "Preferred primary action *", whatsapp: "WhatsApp" },
};
