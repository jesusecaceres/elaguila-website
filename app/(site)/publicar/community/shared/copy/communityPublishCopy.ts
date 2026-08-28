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
    paidClassPublishBlocked:
      "Las clases con costo requieren la tarifa de anuncio Leonix de $24.99 por 30 días. Esa activación de pago aún no está disponible aquí, así que la publicación está bloqueada por ahora.",
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
    paidClassPublishBlocked:
      "Paid classes require the Leonix listing fee of $24.99 per 30 days. That paid activation isn't available here yet, so publishing is blocked for now.",
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
      stateLabel: "Estado / Región",
      countryLabel: "País",
      zipLabel: "Código postal / ZIP",
      venue: "Nombre del lugar",
      addressLine1: "Dirección (línea 1)",
      addressLine1Helper: "Número y calle",
      addressLine1Placeholder: "Número y calle",
      addressLine2: "Dirección (línea 2)",
      audience: "¿Para quién es la clase?",
      skillLevel: "Nivel",
      registrationRequired: "¿Requiere registro?",
      bringNote: "Qué llevar",
      bringNoteHelper: "Ej. ropa cómoda, botella de agua, tapete propio.",
      materialsNote: "Materiales / equipo",
      materialsNoteHelper: "Ej. lo que la clase proporciona vs. lo que el estudiante debe traer.",
      requirementsNote: "Requisitos / antes de asistir",
      requirementsNoteHelper: "Ej. nivel mínimo, edad mínima, condición física, vacunas, forma médica.",
      categoriesMulti: "Tipos de clase (elige hasta 4)",
      categoriesHelper: "Ej. Boxeo + Yoga + Pilates, si ofreces varias disciplinas.",
      audiencesHelper: "Elige hasta 3, ej. Jóvenes + Adultos, o Niños + Familias.",
      paymentMethods: "Pagos aceptados (cómo te paga el estudiante)",
      paymentMethodsHelper:
        "Opcional. Distinto de la tarifa de anuncio de Leonix — esto es cómo cobras tú la clase.",
      paymentMethodOther: "Describe el otro método de pago",
      scheduleMode: "Tipo de horario",
      scheduleModeHelper: "Indica cómo funciona el horario de tu clase — así los estudiantes lo entienden claramente.",
      scheduleModeRecurring: "Recurrente (semanal)",
      scheduleModeOneTime: "Clase única (una sola fecha)",
      oneTimeDate: "Fecha de la clase",
      oneTimeStart: "Hora de inicio",
      oneTimeEnd: "Hora de fin",
      startDate: "Fecha de inicio del curso",
      endDate: "Fecha de fin del curso",
      dateRangeHelper: "Tu clase tiene fecha de término — se mostrará como un rango de fechas.",
      ongoingHelper: "Sin fecha de fin: tu clase se mostrará como continua (\"Todos los sábados\", por ejemplo).",
    },
    priceSummary: {
      title: "Resumen de precios",
      leonixFeeFree: "Tarifa de anuncio Leonix: gratis",
      leonixFeePaid: "Tarifa de anuncio Leonix: $24.99 por 30 días",
      classPriceLabel: "Precio de la clase (lo que cobra el instructor)",
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
      stateLabel: "State / Region",
      countryLabel: "Country",
      zipLabel: "ZIP / Postal code",
      venue: "Venue name",
      addressLine1: "Address line 1",
      addressLine1Helper: "Street number and street name",
      addressLine1Placeholder: "Street number and name",
      addressLine2: "Address line 2",
      audience: "Who is this class for?",
      skillLevel: "Level",
      registrationRequired: "Registration required?",
      bringNote: "What to bring",
      bringNoteHelper: "E.g. comfortable clothes, water bottle, your own mat.",
      materialsNote: "Materials / equipment",
      materialsNoteHelper: "E.g. what the class provides vs. what the student must bring.",
      requirementsNote: "Requirements / before you attend",
      requirementsNoteHelper: "E.g. minimum level, minimum age, physical condition, vaccines, medical form.",
      categoriesMulti: "Class types (choose up to 4)",
      categoriesHelper: "E.g. Boxing + Yoga + Pilates, if you offer several disciplines.",
      audiencesHelper: "Choose up to 3, e.g. Teens + Adults, or Children + Families.",
      paymentMethods: "Accepted payments (how the student pays you)",
      paymentMethodsHelper:
        "Optional. Separate from the Leonix listing fee — this is how you get paid for the class itself.",
      paymentMethodOther: "Describe the other payment method",
      scheduleMode: "Schedule type",
      scheduleModeHelper: "Tell students how your class schedule works — clearly, not left to guesswork.",
      scheduleModeRecurring: "Recurring (weekly)",
      scheduleModeOneTime: "One-time class (single date)",
      oneTimeDate: "Class date",
      oneTimeStart: "Start time",
      oneTimeEnd: "End time",
      startDate: "Course start date",
      endDate: "Course end date",
      dateRangeHelper: "Your class has an end date — it will show as a date range.",
      ongoingHelper: "No end date: your class will show as ongoing (e.g. \"Every Saturday\").",
    },
    priceSummary: {
      title: "Price summary",
      leonixFeeFree: "Leonix listing fee: free",
      leonixFeePaid: "Leonix listing fee: $24.99 per 30 days",
      classPriceLabel: "Class price (what the instructor charges)",
    },
    primaryCtaHint:
      "We highlight one primary action first; any other contact details you add stay visible.",
  },
} as const;

export const COMUNIDAD_QUICK_COPY = {
  es: {
    pageTitle: "Evento comunitario rápido",
    pageSubtitle:
      "Completa cada sección. Publicar en Comunidad y Eventos es gratis. La vista previa y la publicación están al final.",
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
      stateLabel: "Estado / Región",
      countryLabel: "País",
      zipLabel: "Código postal / ZIP",
      venue: "Nombre del lugar",
      addressLine1: "Dirección (línea 1)",
      addressLine1Helper: "Número y calle",
      addressLine1Placeholder: "Número y calle",
      addressLine2: "Dirección (línea 2)",
      audience: "¿Para quién es el evento?",
      registrationRequired: "¿Requiere registro?",
      accessibility: "Acceso",
      bringNote: "Qué deben llevar o saber",
      bringNoteHelper:
        "Ej. qué traer, dónde estacionar, identificación requerida, clima/vestimenta, cómo prepararse, notas de accesibilidad, instrucciones de llegada.",
      restrictionsNote: "Qué NO llevar / restricciones",
      restrictionsNoteHelper:
        "Ej. artículos prohibidos, restricciones de bolsas, armas, comida externa, alcohol, mascotas, reglas propias del lugar.",
    },
    primaryCtaHint:
      "La acción principal es la que destacamos primero; el resto de datos seguirá visible.",
    freePostingNotice:
      "Publicar en Comunidad y Eventos es siempre gratis. El evento puede ser gratis, pagado o con donación.",
    finalStepIntro:
      "Publicar en Comunidad y Eventos es gratis. Revisa la vista previa de tu evento y publícalo cuando esté listo.",
  },
  en: {
    pageTitle: "Quick community event",
    pageSubtitle:
      "Complete each section. Posting in Community & Events is free. Preview and publish are at the bottom.",
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
      stateLabel: "State / Region",
      countryLabel: "Country",
      zipLabel: "ZIP / Postal code",
      venue: "Venue name",
      addressLine1: "Address line 1",
      addressLine1Helper: "Street number and street name",
      addressLine1Placeholder: "Street number and name",
      addressLine2: "Address line 2",
      audience: "Who is this event for?",
      registrationRequired: "Registration required?",
      accessibility: "Access",
      bringNote: "What to bring or know",
      bringNoteHelper:
        "E.g. what to bring, parking, ID requirements, weather/clothing, how to prepare, accessibility notes, arrival instructions.",
      restrictionsNote: "What NOT to bring / restrictions",
      restrictionsNoteHelper:
        "E.g. prohibited items, bag restrictions, weapons, outside food, alcohol, pets, venue-specific rules.",
    },
    primaryCtaHint:
      "We highlight one primary action first; any other contact details you add stay visible.",
    freePostingNotice:
      "Posting in Community & Events is always free. The event itself may be free, paid, or by donation.",
    finalStepIntro:
      "Posting in Community & Events is free. Review your event preview, then publish when it's ready.",
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
