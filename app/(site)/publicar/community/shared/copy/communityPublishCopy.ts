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
        "Cuando hayas revisado el contenido, usa los botones de abajo para abrir la vista previa real o iniciar la publicación.",
      sessionDraftLine: "Tu borrador se guarda automáticamente en esta sesión del navegador.",
      previewCta: "Vista previa",
      publishCta: "Publicar",
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
        "La publicación final llegará en una fase posterior. Por ahora confirma que revisaste tu anuncio.",
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
    stagedSuccess:
      "Borrador guardado solo en esta sesión del navegador. No se creó anuncio en la base de datos, no hay URL pública ni redirección, y el anuncio no aparecerá en resultados ni en “Mis anuncios”. La publicación en Leonix Clasificados para esta categoría aún no está conectada.",
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
        "When the content is ready, use the buttons below to open the real preview or start publishing.",
      sessionDraftLine: "Your draft is auto-saved in this browser session.",
      previewCta: "Preview",
      publishCta: "Publish",
      saveDraftCta: "Save to session",
      deleteRequest: "Delete draft",
      deleteConfirm: "Delete this draft? Unpublished changes will be lost.",
    },
    discoveryRegionLine: "Discovery region: NorCal",
    cityAutocompleteHint:
      "Choose a city from the list so the listing works with NorCal filters.",
    publishModal: {
      title: "Confirm publish",
      intro: "Final publishing arrives in a later phase. For now confirm you reviewed the listing.",
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
    stagedSuccess:
      "Draft saved only in this browser session. No database listing was created, there is no public URL or redirect, and the listing will not appear in results or “My listings”. Publishing to Leonix Clasificados for this category is not wired yet.",
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
      categoryOther: "Describe la categoría",
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
      imageHint: "Sube imagen, PDF o archivo del volante, o pega una URL (imagen o PDF).",
      publicCity: "Ciudad donde se ofrece la clase",
      stateLabel: "Estado",
      zipLabel: "Código postal",
      venue: "Nombre del lugar",
      addressLine1: "Dirección",
      addressLine1Helper: "Número y calle, ejemplo: 87 N King Rd",
      addressLine1Placeholder: "87 N King Rd",
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
      categoryOther: "Describe the category",
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
      imageHint: "Upload an image, PDF, or flyer file, or paste a URL (image or PDF).",
      publicCity: "City where the class is offered",
      stateLabel: "State",
      zipLabel: "ZIP",
      venue: "Venue name",
      addressLine1: "Street address",
      addressLine1Helper: "Street number and street name, example: 87 N King Rd",
      addressLine1Placeholder: "87 N King Rd",
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
      categoryOther: "Describe la categoría",
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
      imageHint: "Sube imagen, PDF o archivo del volante, o pega una URL (imagen o PDF).",
      publicCity: "Ciudad donde se realiza el evento",
      stateLabel: "Estado",
      zipLabel: "Código postal",
      venue: "Nombre del lugar",
      addressLine1: "Dirección",
      addressLine1Helper: "Número y calle, ejemplo: 87 N King Rd",
      addressLine1Placeholder: "87 N King Rd",
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
      categoryOther: "Describe the category",
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
      imageHint: "Upload an image, PDF, or flyer file, or paste a URL (image or PDF).",
      publicCity: "City where the event takes place",
      stateLabel: "State",
      zipLabel: "ZIP",
      venue: "Venue name",
      addressLine1: "Street address",
      addressLine1Helper: "Street number and street name, example: 87 N King Rd",
      addressLine1Placeholder: "87 N King Rd",
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
