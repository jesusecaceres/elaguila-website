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
    es: "Toca un bloque o el logo en la tarjeta para seleccionarlo. Arrastra para mover; ajusta con precisión en el panel.",
    en: "Tap a text block or the logo on the card to select it. Drag to move; fine-tune in the panel.",
  },
  editingBanner: { es: "Editando", en: "Editing" },
  saveContinue: { es: "Guardar diseño y continuar", en: "Save design & continue" },
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
