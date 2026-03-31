import type { Lang } from "../types/tienda";
import type { TiendaLocalizedLine } from "../types/orderHandoff";

export function subPick(row: TiendaLocalizedLine, lang: Lang): string {
  return lang === "en" ? row.en : row.es;
}

export const orderSubmissionCopy = {
  submitting: { es: "Enviando pedido…", en: "Submitting order…" } satisfies TiendaLocalizedLine,
  submitCta: { es: "Enviar pedido a Leonix", en: "Submit order to Leonix" } satisfies TiendaLocalizedLine,
  errorGeneric: {
    es: "No se pudo enviar el pedido. Intenta de nuevo o contacta a Leonix.",
    en: "We couldn’t submit your order. Try again or contact Leonix.",
  } satisfies TiendaLocalizedLine,
  errorEmailConfig: {
    es: "El servidor de correo no está configurado. Avisa a Leonix (entorno RESEND).",
    en: "Email is not configured on the server. Ask Leonix to set RESEND env vars.",
  } satisfies TiendaLocalizedLine,
  errorBlobConfig: {
    es: "El almacenamiento de archivos no está configurado en el servidor (BLOB_READ_WRITE_TOKEN). Contacta a Leonix.",
    en: "File storage isn’t configured on the server (BLOB_READ_WRITE_TOKEN). Contact Leonix.",
  } satisfies TiendaLocalizedLine,
  errorAssetUpload: {
    es: "No se pudieron guardar los archivos de producción. Revisa tu conexión e inténtalo de nuevo.",
    en: "We couldn’t save production files. Check your connection and try again.",
  } satisfies TiendaLocalizedLine,
  errorAssetsMissing: {
    es: "Faltan archivos durables para este pedido; vuelve al configurador, guarda y reintenta.",
    en: "Required durable files are missing for this order. Return to the configurator, save, and try again.",
  } satisfies TiendaLocalizedLine,
  uploadingAssets: {
    es: "Guardando archivos aprobados…",
    en: "Saving your approved files…",
  } satisfies TiendaLocalizedLine,
  staffDownloadsHeading: {
    es: "Archivos para producción (enlace directo)",
    en: "Production file links",
  } satisfies TiendaLocalizedLine,
  staffDownloadsHint: {
    es: "Leonix usa estos mismos enlaces en el correo del pedido; guárdalos si una descarga falla.",
    en: "Leonix staff get these same links in the order email; keep them if a download fails.",
  } satisfies TiendaLocalizedLine,
  alreadySubmittedTitle: {
    es: "Este pedido ya fue enviado",
    en: "This order was already submitted",
  } satisfies TiendaLocalizedLine,
  alreadySubmittedBody: {
    es: "Si necesitas cambios, contacta a Leonix con tu número de referencia.",
    en: "If you need changes, contact Leonix with your reference number.",
  } satisfies TiendaLocalizedLine,
  alreadySubmittedViewConfirm: { es: "Ver confirmación", en: "View confirmation" } satisfies TiendaLocalizedLine,

  successTitle: { es: "¡Gracias!", en: "Thank you!" } satisfies TiendaLocalizedLine,
  successHeadline: {
    es: "Leonix recibió tu solicitud de pedido.",
    en: "Leonix received your order request.",
  } satisfies TiendaLocalizedLine,
  successBody: {
    es: "Revisaremos los detalles y te contactaremos para siguiente pasos. No se procesó ningún pago en línea en esta fase.",
    en: "We’ll review the details and follow up with next steps. No online payment was processed in this phase.",
  } satisfies TiendaLocalizedLine,
  successRefLabel: { es: "Tu referencia", en: "Your reference" } satisfies TiendaLocalizedLine,
  successBackTienda: { es: "Volver a la tienda", en: "Back to Tienda" } satisfies TiendaLocalizedLine,
  successContact: { es: "Contactar Leonix", en: "Contact Leonix" } satisfies TiendaLocalizedLine,
  completeInvalidRef: {
    es: "Falta una referencia de pedido válida.",
    en: "A valid order reference is missing.",
  } satisfies TiendaLocalizedLine,
} as const;
