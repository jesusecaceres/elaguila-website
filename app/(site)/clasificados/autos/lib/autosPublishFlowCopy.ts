import type { AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";

export type AutosPublishFlowLang = AutosClassifiedsLang;

export function getAutosPublishFlowCopy(lang: AutosPublishFlowLang, lane: AutosClassifiedsLane) {
  const isEs = lang === "es";
  const laneLabel =
    lane === "negocios"
      ? isEs
        ? "Concesionario (Negocios)"
        : "Dealership (Business)"
      : isEs
        ? "Particular (Private)"
        : "Private seller";
  return {
    metaTitle: isEs ? "Confirmar publicación — Autos" : "Confirm listing — Autos",
    loginRequiredTitle: isEs ? "Inicia sesión para publicar" : "Sign in to publish",
    loginRequiredBody: isEs
      ? "Necesitas una cuenta Leonix para guardar el anuncio y pagar la publicación."
      : "You need a Leonix account to save your listing and complete payment.",
    loginCta: isEs ? "Iniciar sesión" : "Sign in",
    preparing: isEs ? "Preparando tu anuncio…" : "Preparing your listing…",
    title: isEs ? "Confirmar antes de pagar" : "Confirm before payment",
    subtitle: isEs
      ? "Revisa el resumen. Debes marcar las tres casillas para continuar al pago con Stripe."
      : "Review the summary. You must check all three boxes to continue to Stripe checkout.",
    laneLine: isEs ? "Tipo de anuncio" : "Listing type",
    laneValue: laneLabel,
    checks: {
      accurate: isEs
        ? "Confirmo que la información del vehículo y del anuncio es veraz y puedo respaldarla."
        : "I confirm the vehicle and listing information is truthful and I can stand behind it.",
      rules: isEs
        ? "Acepto las reglas de Clasificados Leonix para anuncios de autos y el uso del canal correspondiente."
        : "I accept Leonix Clasificados rules for vehicle listings and use of this channel.",
      paid: isEs
        ? "Entiendo que la publicación es de pago y que el precio mostrado en checkout aplica a este paquete."
        : "I understand this is a paid listing and the checkout price applies to this package.",
    },
    backEdit: isEs ? "Volver a editar" : "Back to edit",
    payCta: isEs ? "Continuar al pago" : "Continue to payment",
    payBusy: isEs ? "Redirigiendo a Stripe…" : "Redirecting to Stripe…",
    mustCheck: isEs ? "Marca las tres confirmaciones para continuar." : "Check all three confirmations to continue.",
    createError: isEs ? "No pudimos guardar el anuncio. Intenta de nuevo." : "We could not save the listing. Try again.",
    successTitle: isEs ? "¡Pago recibido!" : "Payment received!",
    successBody: isEs
      ? "Tu anuncio ya está activo en Clasificados Autos."
      : "Your listing is now live on Autos classifieds.",
    viewLive: isEs ? "Ver anuncio publicado" : "View live listing",
    browseMore: isEs ? "Ver más autos" : "Browse more vehicles",
    cancelTitle: isEs ? "Pago cancelado" : "Payment cancelled",
    cancelBody: isEs
      ? "No se cobró nada. Puedes volver a editar o intentar de nuevo."
      : "You were not charged. You can go back to edit or try again.",
    retryPay: isEs ? "Volver a confirmar y pagar" : "Return to confirm and pay",
    errorTitle: isEs ? "No pudimos completar el pago" : "We could not complete payment",
    errorBody: isEs
      ? "El anuncio no se activó. Revisa tu método de pago o inténtalo más tarde."
      : "Your listing was not activated. Check your payment method or try again later.",
    continueToPublish: isEs ? "Publicar anuncio" : "Publish listing",
  };
}
