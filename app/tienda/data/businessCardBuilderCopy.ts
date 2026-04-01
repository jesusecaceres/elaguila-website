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
    es: "Guardamos el diseño en este navegador y pasas a confirmar datos de contacto, entrega y envío del pedido a Leonix.",
    en: "We save your design in this browser, then you confirm contact details, fulfillment, and submit the order to Leonix.",
  },
  previewHelp: {
    es: "Toca una línea de texto o el logo. Mantén pulsado y arrastra para mover. Ajuste fino en el panel derecho.",
    en: "Tap a line of text or the logo. Press and drag to move. Use the right panel for precise placement.",
  },
  editingBanner: { es: "Editando", en: "Editing" },
  saveContinue: { es: "Guardar diseño y continuar", en: "Save design & continue" },
  tryAnotherLook: {
    es: "Probar otro estilo (misma información)",
    en: "Try another look (same details)",
  },
  savedToast: { es: "Diseño guardado en este dispositivo.", en: "Design saved on this device." },
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
