/** Bienes agente individual — application pricing checkpoint copy (EN/ES). */

export type BrAgentePricingLang = "en" | "es";

export function brAgenteApplicationPricingCopy(lang: BrAgentePricingLang) {
  if (lang === "es") {
    return {
      startProKicker: "Profesional",
      startProTitle: "Negocio",
      startShowcaseTitle: "Vitrina de agente",
      startShowcasePrice: "$399/mes",
      startShowcaseBody:
        "Para agentes, equipos, oficinas y desarrolladores. Incluye 1 propiedad principal/destacada, centro de contacto profesional, fotos, enlaces de video, tour/folleto, página pública, visibilidad en búsquedas/resultados y acciones de contacto para compradores.",
      startInventoryOptional: "Opcional: agrega Paquete de inventario por +$99/mes",
      startInventoryOptionalDetail: "Agrega hasta 4 propiedades activas adicionales.",
      startPublishCta: "Publicar como agente",
      startSeeMore: "Ver más",
      drawerTitle: "Vitrina de agente + Paquete de inventario",
      drawerBaseTitle: "Vitrina de agente — $399/mes",
      drawerBaseIncludes: [
        "1 propiedad principal/destacada",
        "perfil profesional de agente/negocio",
        "centro de contacto: teléfono, correo, sitio web, WhatsApp/mapa/redes cuando los proporciones",
        "fotos, enlaces de video, tour y folleto",
        "página pública del anuncio",
        "visibilidad en búsquedas y resultados",
        "acciones de contacto para compradores",
      ],
      drawerPackTitle: "Paquete de inventario — +$99/mes",
      drawerPackIncludes: [
        "hasta 4 propiedades activas adicionales",
        "cada propiedad adicional con título, precio, fotos, ubicación, detalles y enlaces de video/tour",
        "el plan total es $498/mes cuando se selecciona",
      ],
      drawerPaymentNote: "El pago se completa después de la vista previa.",
      inventoryCheckpointTitle: "Paquete de inventario",
      inventoryCheckpointLead: "Agrega hasta 4 propiedades adicionales por +$99/mes.",
      currentPlan: "Tu plan actual",
      currentPlanLine: "Vitrina de agente — $399/mes",
      currentPlanDetail: "Incluye 1 propiedad principal/destacada.",
      optionalUpgrade: "Mejora opcional",
      optionalUpgradeLine: "Paquete de inventario — +$99/mes",
      optionalUpgradeDetail: "Incluye hasta 4 propiedades activas adicionales.",
      totalIfSelected: "Total si lo seleccionas",
      total498: "$498/mes",
      acceptPack: "Agregar Paquete de inventario — +$99/mes",
      continueMainOnly: "Continuar solo con la propiedad principal",
      packSelected: "Paquete de inventario seleccionado",
      packSelectedLine: "+$99/mes · Hasta 4 propiedades adicionales",
      additionalCount: (n: number) => `Propiedades adicionales agregadas: ${n} de 4`,
      totalMonthly: "Total mensual",
      addAnother: "Agregar otra propiedad",
      cancelPack: "Quitar Paquete de inventario",
      cancelPackConfirmTitle: "¿Quitar Paquete de inventario?",
      cancelPackConfirmBody:
        "Esto eliminará los borradores de propiedades adicionales de esta solicitud. Tu propiedad principal se mantendrá.",
      cancelPackConfirmBtn: "Quitar paquete",
      cancel: "Cancelar",
      fifthChildBlock:
        "Ya tienes 4 propiedades adicionales en este Paquete de inventario. Elimina una propiedad o contacta a Leonix para un plan de oficina más grande.",
      pricingSummaryTitle: "Precio mensual",
      baseLine: "Vitrina de agente",
      baseDetail: "Incluye 1 propiedad principal/destacada",
      packLine: "Paquete de inventario",
      packDetail: "Hasta 4 propiedades activas adicionales",
      totalLabel: "Total mensual",
      paymentAfterPreview: "El pago se completa después de la vista previa.",
      confirmIntro: "Marca estas casillas antes de continuar a la vista previa.",
      confirmAccurate:
        "Confirmo que la información de bienes raíces es verdadera y está actualizada.",
      confirmPhotos:
        "Confirmo que las fotos, precio, ubicación, detalles de la propiedad y datos de contacto representan correctamente este anuncio.",
      confirmRules:
        "Confirmo que este anuncio sigue las reglas de Leonix y que soy responsable por la información publicada.",
      confirmPayment:
        "Entiendo que el pago es requerido después de la vista previa antes de que este anuncio quede activo.",
      confirmInventory:
        "Entiendo que el Paquete de inventario agrega +$99/mes por hasta 4 propiedades adicionales.",
      continueToPreview: "Continuar a vista previa",
      draftDeviceNote:
        "Borrador guardado en este dispositivo. Al actualizar esta pestaña, tu progreso debe mantenerse.",
    };
  }
  return {
    startProKicker: "Professional",
    startProTitle: "Business",
    startShowcaseTitle: "Agent Showcase",
    startShowcasePrice: "$399/month",
    startShowcaseBody:
      "For agents, teams, offices, and developers. Includes 1 main/featured property, professional contact hub, photos, video links, tour/brochure links, public detail page, search/results visibility, and buyer contact actions.",
    startInventoryOptional: "Optional: add Inventory Pack for +$99/month",
    startInventoryOptionalDetail: "Add up to 4 additional active properties.",
    startPublishCta: "Publish as agent",
    startSeeMore: "See more",
    drawerTitle: "Agent Showcase + Inventory Pack",
    drawerBaseTitle: "Agent Showcase — $399/month",
    drawerBaseIncludes: [
      "1 main/featured property",
      "professional agent/business profile",
      "contact hub: phone, email, website, WhatsApp/map/socials when provided",
      "photos, video links, tour and brochure links",
      "public listing detail page",
      "search/results visibility",
      "buyer contact actions",
    ],
    drawerPackTitle: "Inventory Pack — +$99/month",
    drawerPackIncludes: [
      "up to 4 additional active properties",
      "each additional property with its own title, price, photos, location, details, and video/tour links",
      "total plan becomes $498/month when selected",
    ],
    drawerPaymentNote: "Payment is completed after preview.",
    inventoryCheckpointTitle: "Inventory Pack",
    inventoryCheckpointLead: "Add up to 4 additional properties for +$99/month.",
    currentPlan: "Your current plan",
    currentPlanLine: "Agent Showcase — $399/month",
    currentPlanDetail: "Includes 1 main/featured property.",
    optionalUpgrade: "Optional upgrade",
    optionalUpgradeLine: "Inventory Pack — +$99/month",
    optionalUpgradeDetail: "Includes up to 4 additional active properties.",
    totalIfSelected: "Total if selected",
    total498: "$498/month",
    acceptPack: "Add Inventory Pack — +$99/month",
    continueMainOnly: "Continue with main property only",
    packSelected: "Inventory Pack selected",
    packSelectedLine: "+$99/month · Up to 4 additional properties",
    additionalCount: (n: number) => `Additional properties added: ${n} of 4`,
    totalMonthly: "Total monthly",
    addAnother: "Add another property",
    cancelPack: "Remove inventory pack",
    cancelPackConfirmTitle: "Remove Inventory Pack?",
    cancelPackConfirmBody:
      "This will remove the additional property drafts from this application. Your main property will remain.",
    cancelPackConfirmBtn: "Remove inventory pack",
    cancel: "Cancel",
    fifthChildBlock:
      "You already have 4 additional properties in this Inventory Pack. Remove one property or contact Leonix for a larger office plan.",
    pricingSummaryTitle: "Monthly pricing",
    baseLine: "Agent Showcase",
    baseDetail: "Includes 1 main/featured property",
    packLine: "Inventory Pack",
    packDetail: "Up to 4 additional active properties",
    totalLabel: "Total monthly",
    paymentAfterPreview: "Payment is completed after preview.",
    confirmIntro: "Check these boxes before continuing to preview.",
    confirmAccurate: "I confirm the real estate information is truthful and up to date.",
    confirmPhotos:
      "I confirm the photos, price, location, property details, and contact information represent this listing correctly.",
    confirmRules:
      "I confirm this listing follows Leonix rules and that I am responsible for the published information.",
    confirmPayment:
      "I understand payment is required after preview before this listing becomes active.",
    confirmInventory: "I understand the Inventory Pack adds +$99/month for up to 4 additional properties.",
    continueToPreview: "Continue to preview",
    draftDeviceNote: "Draft saved on this device. Refreshing this tab should keep your progress.",
  };
}
