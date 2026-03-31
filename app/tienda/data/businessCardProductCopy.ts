import type { Lang } from "../types/tienda";
import type { BusinessCardTemplateId } from "../product-configurators/business-cards/templates";

export const businessCardProductCopy = {
  standardIntro: {
    es: "Tarjetas premium estándar 3.5″×2″ — autogestión para stock y acabado profesional habitual. Opciones especiales (foil, terciopelo, cantos pintados, etc.) son por cotización.",
    en: "Standard premium 3.5″×2″ cards — self‑serve for typical professional stock and finish. Specialty options (foil, velvet, painted edges, etc.) are quote‑only.",
  },
  pathDesignTitle: { es: "Diseñar en línea", en: "Design online" },
  pathDesignBody: {
    es: "Constructor guiado con plantillas profesionales, tipografía y colocación libre dentro de zonas seguras.",
    en: "Guided builder with professional templates, typography, and free placement within safe print zones.",
  },
  pathDesignCta: { es: "Abrir constructor", en: "Open builder" },
  pathUploadTitle: { es: "Subir diseño listo", en: "Upload existing design" },
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
  templateLabels: {
    "modern-centered": { es: "Moderno centrado", en: "Modern centered" },
    "classic-left": { es: "Clásico alineado a la izquierda", en: "Classic left‑aligned" },
    "bold-logo-top": { es: "Logo destacado arriba", en: "Bold logo top" },
    "minimal-contact": { es: "Contacto mínimo", en: "Minimal contact" },
  } satisfies Record<BusinessCardTemplateId, { es: string; en: string }>,
  templateDescriptions: {
    "modern-centered": {
      es: "Jerarquía limpia al centro; ideal para marcas contemporáneas.",
      en: "Clean centered hierarchy; great for contemporary brands.",
    },
    "classic-left": {
      es: "Lectura tradicional; nombre y datos alineados a la izquierda.",
      en: "Traditional reading flow; name and details left‑aligned.",
    },
    "bold-logo-top": {
      es: "Marca arriba, contacto abajo; buen impacto visual.",
      en: "Brand up top, contact below; strong visual balance.",
    },
    "minimal-contact": {
      es: "Solo lo esencial; mucho espacio en blanco.",
      en: "Essentials only; generous negative space.",
    },
  } satisfies Record<BusinessCardTemplateId, { es: string; en: string }>,
  templatesHeading: { es: "Plantilla de partida", en: "Starter template" },
  backgroundHeading: { es: "Fondo de la tarjeta", en: "Card background" },
  designBlocksHeading: { es: "Bloques en el lienzo", en: "Canvas blocks" },
  selectBlockHint: {
    es: "Toca un bloque en la vista previa o elige uno aquí.",
    en: "Tap a block in the preview or choose one here.",
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
} as const;

export function bcpPick<T>(v: { es: T; en: T }, lang: Lang): T {
  return lang === "en" ? v.en : v.es;
}
