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
  selectionToolsSubtitle: {
    es: "Lo que elijas en la vista previa define estas herramientas. El panel de abajo sigue teniendo información, logo y refinamientos.",
    en: "What you select on the preview drives these tools. The panel below still holds your details, logo, and refinements.",
  },
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
  textInspectorSectionContent: { es: "Contenido", en: "Content" },
  textInspectorSectionTypography: { es: "Tipografía", en: "Typography" },
  textInspectorSectionColor: { es: "Color", en: "Color" },
  textInspectorSectionLayout: { es: "Posición y tamaño", en: "Position & size" },
  textFontFamilyLabel: { es: "Familia tipográfica", en: "Font family" },
  textHexLabel: { es: "Hex", en: "Hex" },
  textColorLabel: { es: "Color del texto", en: "Text color" },
  textColorHelp: {
    es: "Muestrario + hex. Si la plantilla usa un color translúcido, al elegir un sólido se reemplaza por ese tono (sin transparencia).",
    en: "Swatch + hex. If the template used a translucent color, choosing a solid replaces it with that tone (no transparency).",
  },
  textColorTranslucentNote: {
    es: "Esta línea usa color con transparencia. El valor hex es una aproximación para el selector.",
    en: "This line uses a translucent color. Hex is an approximation for the picker.",
  },
  logoInspectorIntro: {
    es: "Arrastra el logo en la vista previa o ajusta posición, tamaño y capa aquí. El ajuste fino mueve el logo unos puntos sin cambiar la cuadrícula principal.",
    en: "Drag the logo on the preview, or adjust placement, size, and stacking here. Fine nudge shifts it slightly without changing the main grid.",
  },
  logoInspectorPlacementSection: { es: "Colocación", en: "Placement" },
  logoInspectorStackSection: { es: "Capa", en: "Stacking" },
  logoInspectorNudgeSection: { es: "Ajuste fino del logo", en: "Logo fine nudge" },
  logoInspectorNudgeExplain: {
    es: "Desplazamiento fino sobre X/Y (igual que en el panel de diseño).",
    en: "Sub-pixel shift applied on top of X/Y (same as the layout panel).",
  },
  logoInspectorZIndexLabel: { es: "Orden z (encima de texto más alto)", en: "Z-order (higher draws on top)" },
  logoInspectorUploadHint: {
    es: "Subir, reemplazar o quitar el archivo en la columna de diseño (abajo).",
    en: "Upload, replace, or remove the file in the layout column below.",
  },
  logoShowOnSide: { es: "Mostrar logo en esta cara", en: "Show logo on this side" },
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
    es: "Misma columna que texto y logo del layout: vista previa a la izquierda, herramientas aquí. Adelante/atrás solo entre capas añadidas en Refinamientos.",
    en: "Same column as layout text and logo: preview on the left, tools here. Forward/back only among layers you add under Refinements.",
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
