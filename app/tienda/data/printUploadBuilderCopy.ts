import type { Lang } from "../types/tienda";

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
} as const;

export function puPick<T>(v: { es: T; en: T }, lang: Lang): T {
  return lang === "en" ? v.en : v.es;
}
