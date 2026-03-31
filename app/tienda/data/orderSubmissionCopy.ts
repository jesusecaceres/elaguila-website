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
