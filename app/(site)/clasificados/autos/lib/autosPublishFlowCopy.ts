import type { AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";

export type AutosPublishFlowLang = AutosClassifiedsLang;

export type AutosPublishConfirmMode = "stripe" | "test_bypass" | "internal_bypass";

export function getAutosPublishFlowCopy(
  lang: AutosPublishFlowLang,
  lane: AutosClassifiedsLane,
  confirmMode: AutosPublishConfirmMode = "stripe",
  inventoryAdd = false,
) {
  const isEs = lang === "es";
  const laneLabel =
    lane === "negocios"
      ? isEs
        ? "Concesionario (Negocios)"
        : "Dealership (Business)"
      : isEs
        ? "Particular (Privado)"
        : "Private seller";
  const base = {
    metaTitle: isEs ? "Confirmar publicación — Autos" : "Confirm listing — Autos",
    loginRequiredTitle: isEs ? "Inicia sesión para publicar" : "Sign in to publish",
    loginRequiredBody: isEs
      ? "Necesitas una cuenta Leonix para guardar el anuncio y pagar la publicación."
      : "You need a Leonix account to save your listing and complete payment.",
    loginCta: isEs ? "Iniciar sesión" : "Sign in",
    preparing: isEs ? "Preparando tu anuncio…" : "Preparing your listing…",
    preparingDetailStripe: isEs
      ? "Estamos guardando tu borrador en Leonix y sincronizando fotos o video opcional."
      : "Saving your draft on Leonix and syncing optional photos or video.",
    preparingDetailBypass: isEs
      ? "Sin pago en este entorno: al confirmar se activará el anuncio de inmediato."
      : "No payment in this environment: confirming will activate the listing immediately.",
    title: isEs ? "Confirmar antes de pagar" : "Confirm before payment",
    subtitle: isEs
      ? "Revisa el resumen. Debes marcar las tres casillas para continuar al pago con Stripe."
      : "Review the summary. You must check all three boxes to continue to Stripe checkout.",
    laneLine: isEs ? "Tipo de anuncio" : "Listing type",
    laneValue: laneLabel,
    summaryVehicle: isEs ? "Vehículo" : "Vehicle",
    summaryPrice: isEs ? "Precio" : "Price",
    summaryLocation: isEs ? "Ubicación" : "Location",
    summaryMonthly: isEs ? "Mensual (est.)" : "Monthly (est.)",
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
    checkoutErrorGeneric: isEs ? "No pudimos iniciar el pago. Revisa la consola de red o inténtalo de nuevo." : "We could not start checkout. Check the network response or try again.",
    checkoutErrorStripe: isEs
      ? "Stripe está en pausa para Autos en esta fase. Para publicar de prueba sin Stripe (solo dev/staging), define AUTOS_ALLOW_TEST_PUBLISH_BYPASS=true fuera de producción. Para el bypass interno histórico, usa AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS=1."
      : "Stripe is paused for Autos in this phase. To test-publish without Stripe (dev/staging only), set AUTOS_ALLOW_TEST_PUBLISH_BYPASS=true outside production. For the legacy internal bypass, use AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS=1.",
    checkoutErrorPrice: isEs
      ? "Falta el precio de Stripe para esta vía (STRIPE_PRICE_AUTOS_PRIVADO o STRIPE_PRICE_AUTOS_NEGOCIOS)."
      : "Missing Stripe price for this lane (STRIPE_PRICE_AUTOS_PRIVADO or STRIPE_PRICE_AUTOS_NEGOCIOS).",
    successTitleInternal: isEs ? "¡Anuncio activado!" : "Listing activated!",
    successBodyInternal: isEs
      ? "Modo interno: publicación sin pago. Tu anuncio ya está activo en Clasificados Autos."
      : "Internal mode: published without payment. Your listing is now live on Autos classifieds.",
    successTitleTest: isEs ? "¡Anuncio activado (prueba)!" : "Listing activated (test)",
    successBodyTest: isEs
      ? "Modo de prueba Autos: publicación sin Stripe. El anuncio quedó activo como cualquier listado en vivo para revisar vitrina y detalle."
      : "Autos test mode: published without Stripe. The listing is active like any live row so you can verify browse surfaces.",
  };

  if (inventoryAdd && lane === "negocios") {
    return {
      ...base,
      metaTitle: isEs ? "Confirmar vehículo del inventario" : "Confirm inventory vehicle",
      preparing: isEs ? "Agregando al inventario…" : "Adding to inventory…",
      title: isEs ? "Confirmar vehículo del inventario" : "Confirm inventory vehicle",
      subtitle: isEs
        ? "Revisa el resumen del vehículo. Marca las tres casillas para continuar al pago o activación."
        : "Review the vehicle summary. Check all three boxes to continue to payment or activation.",
      payCta: isEs ? "Agregar al inventario" : "Add to inventory",
      payBusy: isEs ? "Agregando al inventario…" : "Adding to inventory…",
      continueToPublish: isEs ? "Agregar al inventario" : "Add to inventory",
    };
  }

  if (confirmMode === "test_bypass") {
    return {
      ...base,
      preparing: isEs ? "Guardando tu anuncio (modo prueba)…" : "Saving your listing (test mode)…",
      title: isEs ? "Confirmar publicación de prueba" : "Confirm test publish",
      subtitle: isEs
        ? "Revisa el resumen. Marca las tres casillas para publicar sin Stripe; el anuncio quedará activo de inmediato."
        : "Review the summary. Check all three boxes to publish without Stripe; your listing activates immediately.",
      checks: {
        ...base.checks,
        paid: isEs
          ? "Entiendo que en modo de prueba no se cobrará con Stripe y el anuncio se activará de inmediato."
          : "I understand test mode skips Stripe charges and activates the listing immediately.",
      },
      payCta: isEs ? "Publicar anuncio de prueba" : "Publish test listing",
      payBusy: isEs ? "Publicando anuncio de prueba…" : "Publishing test listing…",
    };
  }

  if (confirmMode === "internal_bypass") {
    return {
      ...base,
      preparing: isEs ? "Guardando tu anuncio (bypass interno)…" : "Saving your listing (internal bypass)…",
      title: isEs ? "Confirmar publicación (bypass interno)" : "Confirm publish (internal bypass)",
      subtitle: isEs
        ? "Revisa el resumen. Marca las tres casillas para activar sin pasar por Stripe en este entorno."
        : "Review the summary. Check all three boxes to activate without Stripe in this environment.",
      checks: {
        ...base.checks,
        paid: isEs
          ? "Entiendo que el bypass interno omite el cobro con Stripe y el anuncio se activará de inmediato."
          : "I understand the internal bypass skips Stripe and activates the listing immediately.",
      },
      payCta: isEs ? "Activar anuncio (interno)" : "Activate listing (internal)",
      payBusy: isEs ? "Activando anuncio…" : "Activating listing…",
    };
  }

  return base;
}
