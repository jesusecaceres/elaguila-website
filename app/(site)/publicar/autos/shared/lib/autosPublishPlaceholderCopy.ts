import type { AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";

export function getAutosPublishPlaceholderCopy(lang: AutosClassifiedsLang, lane: AutosClassifiedsLane) {
  const isEs = lang === "es";
  const laneLabel =
    lane === "negocios"
      ? isEs
        ? "Negocios"
        : "Business"
      : isEs
        ? "Privado"
        : "Private";
  return {
    overlayClose: isEs ? "Cerrar" : "Close",
    title: isEs ? "Antes de publicar" : "Before publishing",
    subtitle: isEs
      ? `Estás en el flujo ${laneLabel}. Marca las confirmaciones y continúa a la pantalla de confirmación y pago con Stripe.`
      : `You're in the ${laneLabel} flow. Check the confirmations, then continue to the confirmation and Stripe payment step.`,
    phaseNote: isEs
      ? "Tu borrador se guarda en este dispositivo hasta que confirmes y pagues. Tras el pago, el anuncio aparece en resultados y en la ficha pública."
      : "Your draft stays on this device until you confirm and pay. After payment, your listing appears in search and on the public vehicle page.",
    checks: {
      accurate: isEs
        ? "Confirmo que la información del vehículo y del anuncio es veraz y puedo respaldarla."
        : "I confirm the vehicle and listing information is truthful and I can stand behind it.",
      rules: isEs
        ? "Acepto las reglas de Clasificados Leonix para anuncios de autos y el uso del canal correspondiente."
        : "I accept Leonix Clasificados rules for vehicle listings and use of this channel.",
      paidPlaceholder: isEs
        ? "Entiendo el costo del paquete y que el pago es vía Stripe antes de la activación pública."
        : "I understand the package cost and that payment is processed via Stripe before public activation.",
    },
    mustCheck: isEs ? "Marca las tres casillas para continuar." : "Check all three boxes to continue.",
    backEdit: isEs ? "Volver al formulario" : "Back to form",
    continueToConfirm: isEs ? "Ir a confirmar y pagar" : "Go to confirm and pay",
  };
}
