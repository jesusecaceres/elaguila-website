import type { Lang } from "../types/tienda";

export const businessCardBuilderCopy = {
  pageTitle: { es: "Constructor de tarjetas", en: "Business card builder" },
  backToProduct: { es: "← Volver al producto", en: "← Back to product" },
  previewTitle: { es: "Vista previa", en: "Live preview" },
  guidesToggle: { es: "Guías de impresión", en: "Print guides" },
  sideFront: { es: "Frente", en: "Front" },
  sideBack: { es: "Reverso", en: "Back" },
  fieldsTitle: { es: "Información", en: "Business details" },
  layoutTitle: { es: "Disposición", en: "Layout" },
  layoutBlockModeIntro: {
    es: "Las plantillas usan líneas libres: mueve cada línea en la vista previa o ajusta X/Y y tamaño en el inspector. Escala global y ajuste fino aplican a todas las líneas.",
    en: "Templates use freeform lines: drag each line on the preview, or use X/Y and size in the inspector. Global scale and nudges apply to all lines.",
  },
  layoutLegacyIntro: {
    es: "Diseño clásico apilado: ancla el bloque de texto y el logo en la cuadrícula.",
    en: "Classic stacked layout: anchor the text stack and logo on the grid.",
  },
  layoutTextAnchorUnavailable: {
    es: "La cuadrícula de ancla del texto no aplica cuando hay líneas por plantilla. Usa el inspector o arrastra cada línea.",
    en: "The text stack anchor grid does not apply when using template lines. Use the inspector or drag each line.",
  },
  textGroupPos: { es: "Bloque de texto", en: "Text block" },
  logoPos: { es: "Logo", en: "Logo" },
  textScale: { es: "Tamaño del texto", en: "Text size" },
  logoScale: { es: "Tamaño del logo", en: "Logo size" },
  nudgeText: { es: "Ajuste fino del texto", en: "Text fine tune" },
  nudgeLogo: { es: "Ajuste fino del logo", en: "Logo fine tune" },
  showLine: { es: "Mostrar línea", en: "Show line" },
  uploadLogo: { es: "Subir logo", en: "Upload logo" },
  removeLogo: { es: "Quitar logo", en: "Remove logo" },
  validationTitle: { es: "Revise antes de aprobar", en: "Review before you approve" },
  hardLabel: { es: "Debe corregirse", en: "Must fix" },
  softLabel: { es: "Advertencias", en: "Warnings" },
  approvalTitle: { es: "Aprobación del diseño", en: "Design approval" },
  approvalIntro: {
    es: "Leonix imprimirá el diseño que apruebes. Tómate un momento para verificar todo.",
    en: "Leonix will print the design you approve. Take a moment to verify everything.",
  },
  approvalItems: {
    spelling: {
      es: "Revisé la ortografía y los datos de contacto.",
      en: "I reviewed spelling and business information.",
    },
    layout: {
      es: "Revisé la colocación y el diseño en la tarjeta.",
      en: "I reviewed layout and design placement.",
    },
    printAsSubmitted: {
      es: "Entiendo que Leonix imprimirá este pedido tal como lo aprobé.",
      en: "I understand Leonix will print this order as I approved it.",
    },
    noRedesign: {
      es: "Entiendo que los pedidos en línea no incluyen rediseño manual por Leonix.",
      en: "I understand self‑serve orders are not manually redesigned by Leonix.",
    },
  },
  nextTitle: { es: "Siguiente paso", en: "Next step" },
  nextBody: {
    es: "Guardamos el borrador en este navegador; después confirmas datos, entrega y envío a Leonix.",
    en: "We save your draft in this browser; next you confirm details, fulfillment, and submit the order to Leonix.",
  },
  previewHelp: {
    es: "Toca una línea, el logo o una capa en Refinamientos. Las herramientas de la selección están arriba a la derecha.",
    en: "Tap a line, the logo, or a layer in Refinements. Selection tools are at the top of the right column.",
  },
  /** Right column: object-first tools for the current canvas selection */
  selectionToolsTitle: { es: "Herramientas de selección", en: "Selection tools" },
  contextualEmptyTitle: {
    es: "Elige algo en la tarjeta",
    en: "Select something on the card",
  },
  contextualEmptyBody: {
    es: "Toca una línea de texto, el logo, o una imagen o forma añadida en Refinamientos. Las herramientas aparecen aquí.",
    en: "Tap a text line, the logo, or an added image or shape from Refinements. Tools for that object appear here.",
  },
  foundationSectionTitle: { es: "Base del diseño", en: "Design setup" },
  textInspectorTitle: { es: "Texto seleccionado", en: "Selected text" },
  textColorLabel: { es: "Color del texto", en: "Text color" },
  textColorHelp: {
    es: "Elige un color sólido para esta línea.",
    en: "Pick a solid color for this line.",
  },
  editingBanner: { es: "Editando", en: "Editing" },
  saveContinue: { es: "Guardar borrador y continuar", en: "Save draft & continue" },
  tryAnotherLook: {
    es: "Probar otro look Leonix (misma información)",
    en: "Try another Leonix look (same details)",
  },
  savedToast: { es: "Diseño guardado en este dispositivo.", en: "Design saved on this device." },
  /** Panel: native layers + shapes/images (below the light editor card) */
  refinementsSectionTitle: { es: "Refinamientos", en: "Refinements" },
  refinementsSectionHint: {
    es: "Una sola pila con la vista previa; el orden z coincide. Reordenar solo mueve lo que añades aquí.",
    en: "One stack with the preview—z-order matches. Reorder only affects what you add here.",
  },
  refinementsTemplateGroup: { es: "Texto y logo del layout", en: "Layout text & logo" },
  refinementsTemplateHelp: {
    es: "Toca una capa o edita en la vista. Para el logo, selecciónalo en la vista: las herramientas aparecen arriba.",
    en: "Tap a layer or edit on the preview. For the logo, select it on the preview — tools appear at the top.",
  },
  refinementsAddedGroup: { es: "Lo que añades", en: "What you add" },
  refinementsEmpty: {
    es: "Aún no hay imágenes ni formas añadidas — usa los botones de arriba.",
    en: "No images or shapes yet—use the buttons above.",
  },
  refinementsAddImage: { es: "+ Imagen", en: "+ Image" },
  refinementsAddRect: { es: "+ Rectángulo", en: "+ Rectangle" },
  refinementsAddEllipse: { es: "+ Elipse", en: "+ Ellipse" },
  nativeInspectorTitle: { es: "Objeto añadido", en: "Added object" },
  nativeInspectorHelp: {
    es: "El texto y logo del layout se editan arriba. Adelante/atrás solo afecta a imágenes y formas de esta sección.",
    en: "Layout text and logo are edited above. Forward/back only moves this added layer among other images and shapes here.",
  },
  nativeReorderTooltip: {
    es: "Solo entre capas añadidas (texto y logo del layout: secciones de arriba).",
    en: "Among added layers only (layout text and logo stay in the sections above).",
  },
  layerBadgeLayout: { es: "Layout", en: "Layout" },
  layerBadgeAdded: { es: "Añadido", en: "Added" },
  fieldLabels: {
    personName: { es: "Nombre", en: "Name" },
    title: { es: "Puesto / título", en: "Title" },
    company: { es: "Empresa / negocio", en: "Business name" },
    phone: { es: "Teléfono", en: "Phone" },
    email: { es: "Correo", en: "Email" },
    website: { es: "Sitio web", en: "Website" },
    address: { es: "Dirección", en: "Address" },
    tagline: { es: "Eslogan", en: "Tagline" },
  },
} as const;

export function bcPick<T>(v: { es: T; en: T }, lang: Lang): T {
  return lang === "en" ? v.en : v.es;
}
