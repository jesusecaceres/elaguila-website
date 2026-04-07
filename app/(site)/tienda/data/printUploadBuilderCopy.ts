import type { Lang } from "../types/tienda";
import type { PrintUploadProductSlug } from "../product-configurators/print-upload/types";

export const printUploadBuilderCopy = {
  pageTitle: { es: "Subir arte listo", en: "Upload print‑ready art" },
  backToProduct: { es: "← Volver al producto", en: "← Back to product" },
  productSummary: { es: "Resumen del producto", en: "Product summary" },
  specPanel: { es: "Opciones de pedido", en: "Order options" },
  uploadTitle: { es: "Archivos", en: "Files" },
  uploadFront: { es: "Archivo principal", en: "Primary file" },
  uploadBack: { es: "Archivo reverso", en: "Back file" },
  dropPrompt: { es: "Arrastra o elige un archivo", en: "Drag or choose a file" },
  dropTypes: { es: "PDF, PNG, JPG", en: "PDF, PNG, JPG" },
  clearFile: { es: "Quitar archivo", en: "Remove file" },
  fileDetails: { es: "Detalle del archivo", en: "File details" },
  specsSummary: { es: "Opciones seleccionadas", en: "Selected options" },
  sidedness: { es: "Lados", en: "Sides" },
  quantity: { es: "Cantidad", en: "Quantity" },
  size: { es: "Tamaño", en: "Size" },
  stock: { es: "Material / papel", en: "Stock" },
  fold: { es: "Plegado", en: "Fold" },
  material: { es: "Material", en: "Material" },
  finish: { es: "Acabado", en: "Finish" },
  shape: { es: "Forma", en: "Shape" },
  validationTitle: { es: "Revisiones de calidad", en: "Quality checks" },
  hardLabel: { es: "Debe corregirse", en: "Must fix" },
  softLabel: { es: "Advertencias", en: "Warnings" },
  approvalTitle: { es: "Aprobación", en: "Approval" },
  approvalIntro: {
    es: "Leonix imprimirá los archivos que apruebes. Verifica archivo y opciones con calma.",
    en: "Leonix will print the files you approve. Take time to verify file and options.",
  },
  approvalRows: {
    reviewed: {
      es: "Revisé mi archivo y las opciones del pedido.",
      en: "I reviewed my file and product specs.",
    },
    printAsSubmitted: {
      es: "Entiendo que Leonix imprimirá el pedido según lo aprobado.",
      en: "I understand Leonix prints the order as approved.",
    },
    liability: {
      es: "Entiendo que Leonix no corrige errores de diseño u ortografía en pedidos de subida en línea.",
      en: "I understand Leonix does not fix spelling, layout, or design mistakes in self‑serve uploads.",
    },
    help: {
      es: "Si necesito ayuda de diseño, contactaré a Leonix o visitaré la oficina.",
      en: "If I need design help, I will contact Leonix or visit the office.",
    },
  },
  nextTitle: { es: "Siguiente paso", en: "Next step" },
  nextBody: {
    es: "Checkout y pedido final llegan en la siguiente fase. Guarda tu borrador en este dispositivo cuando esté listo.",
    en: "Checkout comes next. Save a draft on this device when you’re ready.",
  },
  saveContinue: { es: "Guardar borrador y continuar", en: "Save draft & continue" },
  savedToast: { es: "Borrador guardado en este dispositivo.", en: "Draft saved on this device." },
  bleedMarginsNote: {
    es: "Si tu arte lleva sangrado, debe extenderse más allá del corte final. Leonix revisa antes de imprimir — esto no sustituye un preflight profesional completo.",
    en: "If your art includes bleed, it should extend past the final trim. Leonix reviews before print—this isn’t a full commercial preflight engine.",
  },
  resolutionProxyNote: {
    es: "Usamos una regla aproximada de píxeles por pulgada para avisar si la imagen podría quedar suave en el tamaño elegido. PDF: confirma el archivo final fuera del navegador.",
    en: "We use a simple pixels‑per‑inch rule to flag images that may print soft at the chosen size. PDF: verify the final file outside the browser.",
  },
  orderReviewReminder: {
    es: "En el siguiente paso verás un resumen con archivos y advertencias. Solo se envía el pedido cuando confirmas datos y aprobaciones.",
    en: "On the next step you’ll see a summary with files and warnings. The order is only submitted after you confirm details and approvals.",
  },
} as const;

const CATEGORY_GUIDANCE: Record<
  PrintUploadProductSlug,
  { es: string; en: string }
> = {
  "flyers-standard": {
    es: "Volantes: idealmente archivo por cara si es dos lados; revisa que el sangrado cubra el corte.",
    en: "Flyers: one file per side when two-sided; ensure bleed covers trim.",
  },
  "brochures-standard": {
    es: "Folletos: un solo PDF con maquetación de pliegues según la opción elegida (tríptico / díptico).",
    en: "Brochures: one PDF laid out for the fold style you selected (tri‑fold / bi‑fold).",
  },
  "retractable-banners": {
    es: "Banners retráctiles: área visible vs. enrollado — si tienes dudas, pide revisión antes de producción.",
    en: "Retractable banners: mind live vs. wrapped area—ask Leonix to review if unsure.",
  },
  "yard-signs": {
    es: "Señalética: archivos grandes en pulgadas; confirma escala y ojales/márgenes con la oficina si es especial.",
    en: "Signs: large‑format inches matter—confirm scale and grommet margins for specialty jobs.",
  },
  "stickers-standard": {
    es: "Stickers: respetar forma y márgenes; tal vez se necesite vector o alta resolución según tamaño.",
    en: "Stickers: respect shape and margins—vectors or high resolution may be needed depending on size.",
  },
};

export function printUploadCategoryGuidance(slug: PrintUploadProductSlug, lang: Lang): string {
  const g = CATEGORY_GUIDANCE[slug];
  return lang === "en" ? g.en : g.es;
}

export function puPick<T>(v: { es: T; en: T }, lang: Lang): T {
  return lang === "en" ? v.en : v.es;
}
