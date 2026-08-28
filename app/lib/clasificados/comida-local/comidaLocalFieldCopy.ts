/**
 * Bilingual labels, helpers, and placeholders for the Comida Local application shell.
 * `es`/`en` pairs are both authored explicitly — never a Spanish-only fallback presented as
 * English.
 */

export type ComidaLocalFieldCopy = {
  labelEs: string;
  labelEn: string;
  helperEs: string;
  helperEn: string;
  placeholderEs?: string;
  placeholderEn?: string;
  optional?: boolean;
};

/** Resolves one field's copy into the caller's chosen language. */
export function resolveComidaLocalFieldCopy(
  copy: ComidaLocalFieldCopy,
  es: boolean,
): { label: string; helper: string; placeholder?: string; optional?: boolean } {
  return {
    label: es ? copy.labelEs : copy.labelEn,
    helper: es ? copy.helperEs : copy.helperEn,
    placeholder: es ? copy.placeholderEs : copy.placeholderEn,
    optional: copy.optional,
  };
}

export const COMIDA_LOCAL_SHELL_COPY = {
  es: {
    pageTitle: "Publicar Comida Local",
    pageSubtitle:
      "Ficha simple para puestos, pop-ups y vendedores locales. Completa el formulario, revisa la vista previa y publica cuando estés listo.",
    scaffoldNotice:
      "Tu borrador se guarda automáticamente en este navegador. Revisa la vista previa antes de continuar al pago ($129/mes).",
    previewSoon: "Próximo paso: vista previa",
    viewPreview: "Ver vista previa",
    publishSoonPreview: "Publicar próximamente",
    draftSaved: "Borrador guardado en este dispositivo",
    resetDraft: "Empezar de nuevo",
    validationPreviewTitle: "Para vista previa",
    validationPublishTitle: "Lista para publicar",
    publishFicha: "Publicar ficha",
    publishing: "Publicando…",
    publishSuccessTitle: "Ficha publicada",
    publishSuccessBody:
      "Tu ficha ya está en Comida Local. Puedes verla en resultados o abrir la ficha pública.",
    publishSuccessViewResults: "Ver resultados",
    publishSuccessViewListing: "Ver ficha publicada",
    publishErrorGeneric: "No se pudo publicar. Revisa los campos e intenta de nuevo.",
    photosDeferredNote:
      "Sube una foto principal (obligatoria para publicar). Logo y galería son opcionales.",
  },
  en: {
    pageTitle: "Publish Local Food",
    pageSubtitle:
      "A simple listing for stands, pop-ups, and local vendors. Fill out the form, review the preview, and publish when you're ready.",
    scaffoldNotice:
      "Your draft is saved automatically in this browser. Review the preview before continuing to payment ($129/mo).",
    previewSoon: "Next step: preview",
    viewPreview: "View preview",
    publishSoonPreview: "Publish coming soon",
    draftSaved: "Draft saved on this device",
    resetDraft: "Start over",
    validationPreviewTitle: "For preview",
    validationPublishTitle: "Ready to publish",
    publishFicha: "Publish listing",
    publishing: "Publishing…",
    publishSuccessTitle: "Listing published",
    publishSuccessBody:
      "Your listing is now live on Local Food. You can view it in results or open the public listing.",
    publishSuccessViewResults: "View results",
    publishSuccessViewListing: "View published listing",
    publishErrorGeneric: "Couldn't publish. Check the fields and try again.",
    photosDeferredNote:
      "Upload a main photo (required to publish). Logo and gallery are optional.",
  },
} as const;

/** Gate C-066 — vegetarian/vegan/gluten-free/halal/kosher highlight options are real, but
 * self-declared by the seller, never independently certified. Shown as a small disclaimer next
 * to the highlights chip group so no fake-certification claim is ever implied. */
export const COMIDA_LOCAL_HIGHLIGHTS_DISCLAIMER = {
  es: "Vegetariano, vegano, sin gluten, halal y kosher son declarados por el vendedor — no están certificados de forma independiente.",
  en: "Vegetarian, vegan, gluten-free, halal, and kosher are self-reported by the seller — not independently certified.",
} as const;

export const COMIDA_LOCAL_FIELD_COPY: Record<string, ComidaLocalFieldCopy> = {
  businessName: {
    labelEs: "Nombre del puesto / negocio",
    labelEn: "Stand / business name",
    helperEs: "Así te verán en resultados y en la ficha pública.",
    helperEn: "This is how you'll appear in results and on the public listing.",
    placeholderEs: "Ej. Tacos Don Pepe",
    placeholderEn: "e.g. Don Pepe's Tacos",
  },
  foodType: {
    labelEs: "Tipo de comida",
    labelEn: "Food type",
    helperEs: "Ayuda a que te encuentren cuando buscan tacos, tamales y más.",
    helperEn: "Helps people find you when searching for tacos, tamales, and more.",
    placeholderEs: "Elige una opción",
    placeholderEn: "Choose an option",
  },
  foodTypeCustom: {
    labelEs: "Otro tipo de comida",
    labelEn: "Other food type",
    helperEs: "Solo si elegiste Otro. Aparece como etiqueta en tu ficha.",
    helperEn: "Only if you chose Other. Appears as a tag on your listing.",
    placeholderEs: "Ej. pupusas salvadoreñas",
    placeholderEn: "e.g. Salvadoran pupusas",
    optional: true,
  },
  businessType: {
    labelEs: "Formato de tu negocio",
    labelEn: "Business format",
    helperEs: "Food truck, puesto, cocina en casa, catering… ayuda a mostrar los campos correctos.",
    helperEn: "Food truck, stand, home kitchen, catering… helps show the right fields.",
    placeholderEs: "Elige una opción",
    placeholderEn: "Choose an option",
    optional: true,
  },
  businessTypeCustom: {
    labelEs: "Otro formato",
    labelEn: "Other format",
    helperEs: "Solo si elegiste Otro en formato de negocio. Agrega uno o más y quítalos si te equivocas.",
    helperEn: "Only if you chose Other for business format. Add one or more, and remove any by mistake.",
    placeholderEs: "Ej. cooperativa de vendedores",
    placeholderEn: "e.g. vendor cooperative",
    optional: true,
  },
  cityDisplay: {
    labelEs: "Ciudad / zona principal",
    labelEn: "City / main area",
    helperEs: "Elige una ciudad NorCal de la lista. Aparece en resultados y en la ficha.",
    helperEn: "Choose a NorCal city from the list. Appears in results and on the listing.",
    placeholderEs: "Busca tu ciudad",
    placeholderEn: "Search for your city",
  },
  zoneNote: {
    labelEs: "Nota de zona (opcional)",
    labelEn: "Area note (optional)",
    helperEs: "Barrio o zona extra. No reemplaza la ciudad.",
    helperEn: "Extra neighborhood or area note. Doesn't replace the city.",
    placeholderEs: "Ej. East San José",
    placeholderEn: "e.g. East San Jose",
    optional: true,
  },
  queVendes: {
    labelEs: "Qué vendes",
    labelEn: "What you sell",
    helperEs: "Cuéntales qué ofreces hoy o esta semana. Aparece en la ficha principal.",
    helperEn: "Tell people what you're offering today or this week. Appears on the main listing.",
    placeholderEs: "Tacos, burritos, aguas frescas…",
    placeholderEn: "Tacos, burritos, aguas frescas…",
  },
  phone: {
    labelEs: "Teléfono",
    labelEn: "Phone",
    helperEs: "Opcional si ya pusiste WhatsApp. Formato automático al escribir.",
    helperEn: "Optional if you already entered WhatsApp. Formats automatically as you type.",
    placeholderEs: "(408) 555-1234",
    placeholderEn: "(408) 555-1234",
    optional: true,
  },
  whatsapp: {
    labelEs: "WhatsApp",
    labelEn: "WhatsApp",
    helperEs: "Para pedidos o preguntas rápidas. Solo se muestra si lo llenas.",
    helperEn: "For orders or quick questions. Only shows if you fill it in.",
    placeholderEs: "(408) 555-1234",
    placeholderEn: "(408) 555-1234",
    optional: true,
  },
  email: {
    labelEs: "Correo (opcional)",
    labelEn: "Email (optional)",
    helperEs: "Habilita el botón de Correo en tu ficha pública. Solo se muestra si lo llenas.",
    helperEn: "Enables the Email button on your public listing. Only shows if you fill it in.",
    placeholderEs: "tunegocio@correo.com",
    placeholderEn: "yourbusiness@email.com",
    optional: true,
  },
  instagramUrl: {
    labelEs: "Instagram",
    labelEn: "Instagram",
    helperEs: "Enlace o usuario. Solo se muestra si es válido.",
    helperEn: "Link or handle. Only shows if it's valid.",
    placeholderEs: "@tu_cuenta o https://instagram.com/…",
    placeholderEn: "@your_handle or https://instagram.com/…",
    optional: true,
  },
  facebookUrl: {
    labelEs: "Facebook",
    labelEn: "Facebook",
    helperEs: "Página o perfil. Solo se muestra si es válido.",
    helperEn: "Page or profile. Only shows if it's valid.",
    placeholderEs: "https://facebook.com/…",
    placeholderEn: "https://facebook.com/…",
    optional: true,
  },
  tiktokUrl: {
    labelEs: "TikTok",
    labelEn: "TikTok",
    helperEs: "Perfil de TikTok. Solo se muestra si es válido.",
    helperEn: "TikTok profile. Only shows if it's valid.",
    placeholderEs: "@tu_cuenta o https://tiktok.com/…",
    placeholderEn: "@your_handle or https://tiktok.com/…",
    optional: true,
  },
  locationNote: {
    labelEs: "Encuéntrame hoy",
    labelEn: "Find me today",
    helperEs: "Dónde estás hoy o esta semana. Útil para puestos móviles — no es tu dirección fija.",
    helperEn: "Where you are today or this week. Useful for mobile stands — not your fixed address.",
    placeholderEs: "Hoy en mercado en…",
    placeholderEn: "Today at the market on…",
    optional: true,
  },
  locationUrl: {
    labelEs: "Enlace a dónde estás hoy",
    labelEn: "Link to where you are today",
    helperEs: "Pin de Maps, publicación o link con tu ubicación de hoy. Opcional.",
    helperEn: "Maps pin, post, or link with today's location. Optional.",
    placeholderEs: "https://maps.google.com/…",
    placeholderEn: "https://maps.google.com/…",
    optional: true,
  },
  mobileOrderLinkUrl: {
    labelEs: "Enlace de pedidos o contacto",
    labelEn: "Order or contact link",
    helperEs: "¿Dónde pueden hacer un pedido o contactarte ahora mismo? Instagram, formulario, WhatsApp Business, etc.",
    helperEn: "Where can people place an order or reach you right now? Instagram, a form, WhatsApp Business, etc.",
    placeholderEs: "https://…",
    placeholderEn: "https://…",
    optional: true,
  },
  eventScheduleNote: {
    labelEs: "Próximo evento (fecha/lugar)",
    labelEn: "Next event (date/location)",
    helperEs: "Texto corto y libre. No reemplaza «Encuéntrame hoy».",
    helperEn: "Short freeform text. Doesn't replace “Find me today.”",
    placeholderEs: "Sáb. 14 de sept. · Feria de Union City",
    placeholderEn: "Sat. Sept 14 · Union City Feria",
    optional: true,
  },
  cateringServiceRadiusNote: {
    labelEs: "¿Hasta dónde viajas para catering?",
    labelEn: "How far will you travel for catering?",
    helperEs: "Distinto de la zona general. Ej. 20 millas desde San José, o todo el Área de la Bahía.",
    helperEn: "Different from the general area note. e.g. 20 miles from San Jose, or the whole Bay Area.",
    placeholderEs: "Ej. 20 millas desde San José",
    placeholderEn: "e.g. 20 miles from San Jose",
    optional: true,
  },
  cateringEventInfoNote: {
    labelEs: "Información de eventos",
    labelEn: "Event information",
    helperEs: "Tamaños de evento, mínimos de pedido y con cuánta anticipación reservar.",
    helperEn: "Typical event sizes, order minimums, and how much lead time you need.",
    placeholderEs: "Ej. Mínimo 20 personas, reservar con 1 semana de anticipación",
    placeholderEn: "e.g. 20-person minimum, book 1 week ahead",
    optional: true,
  },
  mealPrepScheduleNote: {
    labelEs: "Frecuencia del meal prep",
    labelEn: "Meal prep schedule",
    helperEs: "Con qué frecuencia ofreces meal prep, ej. cada domingo.",
    helperEn: "How often you offer meal prep, e.g. weekly Sunday pickup.",
    placeholderEs: "Ej. Pickup todos los domingos",
    placeholderEn: "e.g. Weekly Sunday pickup",
    optional: true,
  },
  mealPrepOrderUrl: {
    labelEs: "Enlace de pedidos de meal prep",
    labelEn: "Meal prep order link",
    helperEs: "Formulario o enlace donde pueden ordenar tu menú semanal.",
    helperEn: "Form or link where people can order your weekly menu.",
    placeholderEs: "https://…",
    placeholderEn: "https://…",
    optional: true,
  },
  availabilityNote: {
    labelEs: "Disponibilidad / horario simple",
    labelEn: "Availability / simple schedule",
    helperEs: "Texto corto, sin tabla semanal. Ej. Viernes a domingo · 5 PM–9 PM.",
    helperEn: "Short text, no weekly table. e.g. Friday to Sunday · 5 PM–9 PM.",
    placeholderEs: "Sábados en San José · después de las 5 PM",
    placeholderEn: "Saturdays in San Jose · after 5 PM",
    optional: true,
  },
  serviceOptions: {
    labelEs: "Opciones de servicio",
    labelEn: "Service options",
    helperEs: "Cómo pueden recibir la comida. Aparecen como etiquetas en la ficha.",
    helperEn: "How people can get the food. Appear as tags on the listing.",
    optional: true,
  },
  serviceOptionOtherCustom: {
    labelEs: "Otra opción de servicio",
    labelEn: "Other service option",
    helperEs: "Solo si marcaste Otro en opciones de servicio. Agrega una o más y quítalas si te equivocas.",
    helperEn: "Only if you checked Other for service options. Add one or more, and remove any by mistake.",
    placeholderEs: "Ej. solo por encargo especial",
    placeholderEn: "e.g. special order only",
    optional: true,
  },
  businessAddressLine: {
    labelEs: "Dirección del negocio (opcional)",
    labelEn: "Business address (optional)",
    helperEs: "Dirección fija, si tienes una. Privada por defecto — actívala abajo para mostrarla en la ficha pública.",
    helperEn: "Fixed address, if you have one. Private by default — turn it on below to show it on the public listing.",
    placeholderEs: "Calle, ciudad",
    placeholderEn: "Street, city",
    optional: true,
  },
  showAddressPublicly: {
    labelEs: "Mostrar dirección en la ficha pública",
    labelEn: "Show address on public listing",
    helperEs: "Si no la activas, tu dirección queda privada y solo se muestra tu ciudad/zona.",
    helperEn: "If you don't turn this on, your address stays private and only your city/area shows.",
    optional: true,
  },
  highlights: {
    labelEs: "Detalles destacados",
    labelEn: "Highlights",
    helperEs: "Lo que te distingue: hecho en casa, vegano, porciones limitadas, etc.",
    helperEn: "What sets you apart: homemade, vegan, limited portions, etc.",
    optional: true,
  },
  highlightsOtherCustom: {
    labelEs: "Otro detalle destacado",
    labelEn: "Other highlight",
    helperEs: "Solo si marcaste Otro en detalles destacados. Agrega uno o más y quítalos si te equivocas.",
    helperEn: "Only if you checked Other for highlights. Add one or more, and remove any by mistake.",
    placeholderEs: "Ej. receta de tres generaciones",
    placeholderEn: "e.g. three-generation family recipe",
    optional: true,
  },
  additionalWebsites: {
    labelEs: "Enlaces adicionales",
    labelEn: "Additional links",
    helperEs: "Menú, formulario de pedidos, catering, socio de entrega, etc. Opcional.",
    helperEn: "Menu, order form, catering, delivery partner, etc. Optional.",
    optional: true,
  },
  paymentMethods: {
    labelEs: "Métodos de pago",
    labelEn: "Payment methods",
    helperEs: "Solo informativo en la ficha. No procesamos pagos aquí.",
    helperEn: "For information on the listing only. We don't process payments here.",
    optional: true,
  },
  paymentOtherNote: {
    labelEs: "Otro método (opcional)",
    labelEn: "Other method (optional)",
    helperEs: "Solo si marcaste Otro en métodos de pago.",
    helperEn: "Only if you checked Other for payment methods.",
    placeholderEs: "Ej. PayPal",
    placeholderEn: "e.g. PayPal",
    optional: true,
  },
  priceLevel: {
    labelEs: "Rango de precio",
    labelEn: "Price range",
    helperEs: "Referencia rápida para compradores. Opcional.",
    helperEn: "Quick reference for buyers. Optional.",
    optional: true,
  },
  languages: {
    labelEs: "Idiomas",
    labelEn: "Languages",
    helperEs: "En qué idiomas atiendes. Opcional.",
    helperEn: "What languages you serve customers in. Optional.",
    optional: true,
  },
  mainPhoto: {
    labelEs: "Foto principal",
    labelEn: "Main photo",
    helperEs: "Obligatoria para publicar. Muestra tu comida o puesto (JPEG, PNG o WebP).",
    helperEn: "Required to publish. Show your food or stand (JPEG, PNG, or WebP).",
  },
  logoImage: {
    labelEs: "Logo (opcional)",
    labelEn: "Logo (optional)",
    helperEs: "Pequeño logo si tienes uno. Opcional.",
    helperEn: "A small logo if you have one. Optional.",
    optional: true,
  },
  galleryImages: {
    labelEs: "Galería limitada",
    labelEn: "Limited gallery",
    helperEs: "Hasta 2 fotos extra por ahora. Más fotos con plan Plus (próximamente).",
    helperEn: "Up to 2 extra photos for now. More photos with the Plus plan (coming soon).",
    optional: true,
  },
};
