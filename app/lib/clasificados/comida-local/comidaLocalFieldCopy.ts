/**
 * Spanish labels, helpers, and placeholders for Comida Local application shell.
 */

export type ComidaLocalFieldCopy = {
  label: string;
  helper: string;
  placeholder?: string;
  optional?: boolean;
};

export const COMIDA_LOCAL_SHELL_COPY = {
  pageTitle: "Publicar Comida Local",
  pageSubtitle:
    "Ficha simple para puestos, pop-ups y vendedores locales. Completa el formulario, revisa la vista previa y publica cuando estés listo.",
  scaffoldNotice:
    "Tu borrador se guarda automáticamente en este navegador. La publicación es gratuita en esta fase (sin Stripe).",
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
} as const;

export const COMIDA_LOCAL_FIELD_COPY: Record<string, ComidaLocalFieldCopy> = {
  businessName: {
    label: "Nombre del puesto / negocio",
    helper: "Así te verán en resultados y en la ficha pública.",
    placeholder: "Ej. Tacos Don Pepe",
  },
  foodType: {
    label: "Tipo de comida",
    helper: "Ayuda a que te encuentren cuando buscan tacos, tamales y más.",
    placeholder: "Elige una opción",
  },
  foodTypeCustom: {
    label: "Otro tipo de comida",
    helper: "Solo si elegiste Otro. Aparece como etiqueta en tu ficha.",
    placeholder: "Ej. pupusas salvadoreñas",
    optional: true,
  },
  cityDisplay: {
    label: "Ciudad / zona principal",
    helper: "Elige una ciudad NorCal de la lista. Aparece en resultados y en la ficha.",
    placeholder: "Busca tu ciudad",
  },
  zoneNote: {
    label: "Nota de zona (opcional)",
    helper: "Barrio o zona extra. No reemplaza la ciudad.",
    placeholder: "Ej. East San José",
    optional: true,
  },
  queVendes: {
    label: "Qué vendes",
    helper: "Cuéntales qué ofreces hoy o esta semana. Aparece en la ficha principal.",
    placeholder: "Tacos, burritos, aguas frescas…",
  },
  phone: {
    label: "Teléfono",
    helper: "Opcional si ya pusiste WhatsApp. Formato automático al escribir.",
    placeholder: "(408) 555-1234",
    optional: true,
  },
  whatsapp: {
    label: "WhatsApp",
    helper: "Para pedidos o preguntas rápidas. Solo se muestra si lo llenas.",
    placeholder: "(408) 555-1234",
    optional: true,
  },
  instagramUrl: {
    label: "Instagram",
    helper: "Enlace o usuario. Solo se muestra si es válido.",
    placeholder: "@tu_cuenta o https://instagram.com/…",
    optional: true,
  },
  facebookUrl: {
    label: "Facebook",
    helper: "Página o perfil. Solo se muestra si es válido.",
    placeholder: "https://facebook.com/…",
    optional: true,
  },
  tiktokUrl: {
    label: "TikTok",
    helper: "Perfil de TikTok. Solo se muestra si es válido.",
    placeholder: "@tu_cuenta o https://tiktok.com/…",
    optional: true,
  },
  locationNote: {
    label: "Ubicación actual / nota de ubicación",
    helper: "Útil para puestos móviles. No es una dirección fija de restaurante.",
    placeholder: "Hoy en mercado en…",
    optional: true,
  },
  locationUrl: {
    label: "URL de ubicación actual",
    helper: "Pin de Maps, publicación o link con dónde estás hoy. Opcional.",
    placeholder: "https://maps.google.com/…",
    optional: true,
  },
  availabilityNote: {
    label: "Disponibilidad / horario simple",
    helper: "Texto corto, sin tabla semanal. Ej. Viernes a domingo · 5 PM–9 PM.",
    placeholder: "Sábados en San José · después de las 5 PM",
    optional: true,
  },
  serviceOptions: {
    label: "Opciones de servicio",
    helper: "Cómo pueden recibir la comida. Aparecen como etiquetas en la ficha.",
    optional: true,
  },
  paymentMethods: {
    label: "Métodos de pago",
    helper: "Solo informativo en la ficha. No procesamos pagos aquí.",
    optional: true,
  },
  paymentOtherNote: {
    label: "Otro método (opcional)",
    helper: "Solo si marcaste Otro en métodos de pago.",
    placeholder: "Ej. PayPal",
    optional: true,
  },
  priceLevel: {
    label: "Rango de precio",
    helper: "Referencia rápida para compradores. Opcional.",
    optional: true,
  },
  languages: {
    label: "Idiomas",
    helper: "En qué idiomas atiendes. Opcional.",
    optional: true,
  },
  mainPhoto: {
    label: "Foto principal",
    helper: "Obligatoria para publicar. Muestra tu comida o puesto (JPEG, PNG o WebP).",
  },
  logoImage: {
    label: "Logo (opcional)",
    helper: "Pequeño logo si tienes uno. Opcional.",
    optional: true,
  },
  galleryImages: {
    label: "Galería limitada",
    helper: "Hasta 2 fotos extra por ahora. Más fotos con plan Plus (próximamente).",
    optional: true,
  },
};
