import type { Lang } from "../types/tienda";

export const businessCardProductCopy = {
  standardIntro: {
    es: "Tarjetas premium estándar 3.5″×2″ — autogestión para stock y acabado profesional habitual. Opciones especiales (foil, terciopelo, cantos pintados, etc.) son por cotización.",
    en: "Standard premium 3.5″×2″ cards — self‑serve for typical professional stock and finish. Specialty options (foil, velvet, painted edges, etc.) are quote‑only.",
  },
  pathTemplateBadge: { es: "Recomendado", en: "Recommended" },
  pathTemplateTitle: { es: "Plantilla Leonix", en: "Leonix template" },
  pathTemplateBody: {
    es: "El camino más rápido: elige un estilo premium, añade texto y logo, y revisa en móvil sin complicar el editor.",
    en: "Fastest path: pick a premium layout, add your logo and text, and review on mobile without fighting the editor.",
  },
  pathTemplateCta: { es: "Empezar con plantilla", en: "Start with a template" },
  pathCustomTitle: { es: "Diseño personalizado", en: "Custom design" },
  pathCustomBody: {
    es: "Control total sobre texto y posición en el constructor avanzado. Ideal si quieres ajustar cada detalle.",
    en: "Full control over typography and placement in the advanced builder. Best when you want to tune every detail.",
  },
  pathCustomCta: { es: "Abrir constructor avanzado", en: "Open advanced builder" },
  pathUploadTitle: { es: "Subir tu diseño", en: "Upload your design" },
  pathUploadBody: {
    es: "Ya tienes PDF o imagen lista en 3.5×2″. Conservamos tu archivo original para producción.",
    en: "You already have print‑ready PDF or image at 3.5×2″. We keep your original file for production.",
  },
  pathUploadCta: { es: "Subir archivos", en: "Upload artwork" },
  specialtyTitle: { es: "Tarjetas especiales y de lujo", en: "Specialty & luxury cards" },
  specialtyBody: {
    es: "Acabados como foil, UV relieve, cantos pintados, cartulina extra gruesa, formas especiales o materiales distintos requieren coordinación con Leonix.",
    en: "Finishes like foil, raised UV, painted edges, extra‑thick stock, specialty shapes, or unusual materials require Leonix coordination.",
  },
  specialtyExamples: {
    es: "Ejemplos: ante / terciopelo, foil, barnices especiales, cantos de color, gramajes de lujo, plástico o imanes.",
    en: "Examples: suede/velvet, foil, specialty coatings, painted edges, luxury thicknesses, plastic or magnets.",
  },
  specialtyContactCta: { es: "Contactar a Leonix", en: "Contact Leonix" },
  specialtyOfficeHint: {
    es: "También puedes visitar nuestra oficina con muestras y referencias.",
    en: "You can also visit our office with samples and references.",
  },
  templatesHeading: { es: "Biblioteca de plantillas Leonix", en: "Leonix template library" },
  templatesSubheading: {
    es: "Cada estilo reorganiza el texto y el logo al instante. Tu información se mantiene donde ya la escribiste.",
    en: "Each style rearranges text and logo instantly. Details you already typed are kept.",
  },
  backgroundHeading: { es: "Color y fondo de la tarjeta", en: "Card color & background" },
  backgroundHelp: {
    es: "Se aplica a la cara visible de la tarjeta (mismo fondo en frente y reverso). El marco oscuro es solo referencia de corte.",
    en: "Applies to both sides of the card. The dark frame around the card is only a trim reference.",
  },
  designBlocksHeading: { es: "Texto en la tarjeta", en: "Text on the card" },
  selectBlockHint: {
    es: "Toca una línea en la vista previa o elígela aquí para moverla o cambiar tamaño.",
    en: "Tap a line on the preview or pick it here to move or resize it.",
  },
  noBlockSelectedHint: {
    es: "Selecciona una línea de texto en la vista previa o en los botones de arriba para ver sus controles.",
    en: "Select a text line on the preview or use the chips above to edit position and type.",
  },
  adjustLogoHint: { es: "Arrastra el logo en la vista previa o usa los controles.", en: "Drag the logo in the preview or use the sliders." },
  removeCustomBlock: { es: "Eliminar línea personalizada", en: "Remove custom line" },
  addCustomLine: { es: "Añadir línea de texto", en: "Add text line" },
  linkedFieldHint: {
    es: "Este texto está ligado al campo de información arriba.",
    en: "This line is linked to the business details field above.",
  },
  duplicateCustomBlock: { es: "Duplicar línea", en: "Duplicate line" },
  fineNudge: { es: "Ajuste fino (±1%)", en: "Fine nudge (±1%)" },
  logoOnCanvasTitle: { es: "Logo en la tarjeta", en: "Logo on card" },
  uploadStepFiles: { es: "Archivos", en: "Files" },
  uploadStepReview: { es: "Revisión", en: "Review" },
  uploadStepOrder: { es: "Pedido", en: "Order" },
  uploadDropHint: {
    es: "Suelta el archivo aquí o pulsa para elegir",
    en: "Drop a file here or tap to browse",
  },
  uploadPreferDesign: {
    es: "¿Prefieres diseñar en línea?",
    en: "Prefer to design online instead?",
  },
  uploadOpenBuilder: { es: "Abrir constructor", en: "Open builder" },
  designIntakeCustomHint: {
    es: "Estás en modo control total. Las plantillas siguen disponibles abajo si quieres reordenar el diseño.",
    en: "You’re in full control mode. Templates below still apply a fresh layout when selected.",
  },
  designIntakeTemplateHint: {
    es: "Modo plantilla: toca una tarjeta para aplicar estilo, color y posición al instante.",
    en: "Template mode: tap a card to apply layout, colors, and positions instantly.",
  },
  switchToCustomCta: { es: "Cambiar a control total (custom)", en: "Switch to full custom control" },
} as const;

export function bcpPick<T>(v: { es: T; en: T }, lang: Lang): T {
  return lang === "en" ? v.en : v.es;
}
