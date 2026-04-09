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
      ? `Estás en el flujo ${laneLabel}. Revisa estas confirmaciones; el pago en línea y la activación automática llegarán en la siguiente fase del sistema.`
      : `You're in the ${laneLabel} flow. Review these confirmations—online payment and automatic activation are coming in the next system phase.`,
    phaseNote: isEs
      ? "Por ahora puedes seguir editando y usando la vista previa. Tu borrador se guarda en este dispositivo."
      : "You can keep editing and using preview for now. Your draft saves on this device.",
    checks: {
      accurate: isEs
        ? "Confirmo que la información del vehículo y del anuncio es veraz y puedo respaldarla."
        : "I confirm the vehicle and listing information is truthful and I can stand behind it.",
      rules: isEs
        ? "Acepto las reglas de Clasificados Leonix para anuncios de autos y el uso del canal correspondiente."
        : "I accept Leonix Clasificados rules for vehicle listings and use of this channel.",
      paidPlaceholder: isEs
        ? "Entiendo que el pago en línea y la activación publicada aún no están conectados en esta versión."
        : "I understand online payment and published activation are not connected in this version yet.",
    },
    mustCheck: isEs ? "Marca las tres casillas para continuar." : "Check all three boxes to continue.",
    backEdit: isEs ? "Volver al formulario" : "Back to form",
    acknowledge: isEs ? "Entendido" : "Got it",
  };
}
