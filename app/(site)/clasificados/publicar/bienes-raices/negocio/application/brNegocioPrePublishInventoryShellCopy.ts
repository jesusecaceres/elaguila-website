/** BR-INV-B — pre-publish inventory drawer shell copy (Negocio application only). */

export type BrNegocioPrePublishInventoryLang = "es" | "en";

export function brNegocioPrePublishInventoryShellCopy(lang: BrNegocioPrePublishInventoryLang) {
  if (lang === "es") {
    return {
      cta: "Agregar propiedad al inventario",
      ctaAlt: "Agregar otra propiedad",
      hint: "Puedes preparar varias propiedades para este mismo agente o negocio antes de publicar.",
      countLabel: (n: number) => `Propiedades adicionales: ${n}`,
      ownerOnlyNote:
        "Solo en tu solicitud de publicación. No aparece en el anuncio público hasta que cada propiedad se publique por separado.",
      drawerTitle: "Agregar propiedad al inventario",
      drawerExplain:
        "Esta propiedad usará la misma información del agente, contacto y negocio. En el siguiente paso podrás capturar los detalles de la propiedad.",
      comingNext: "Los campos de la propiedad se activarán en el siguiente gate (BR-INV-C).",
      close: "Cerrar",
      saveProperty: "Guardar propiedad",
      saveDisabledHint: "Los campos de propiedad llegarán en el siguiente gate.",
      sectionKicker: "Inventario de propiedades",
    };
  }
  return {
    cta: "Add property to inventory",
    ctaAlt: "Add another property",
    hint: "You can prepare multiple properties for this same agent or business before publishing.",
    countLabel: (n: number) => `Additional properties: ${n}`,
    ownerOnlyNote:
      "Owner application only. Nothing appears on the public listing until each property is published separately.",
    drawerTitle: "Add property to inventory",
    drawerExplain:
      "This property will use the same agent, contact, and business information. In the next step you will be able to enter the property details.",
    comingNext: "Property fields will be enabled in the next gate (BR-INV-C).",
    close: "Close",
    saveProperty: "Save property",
    saveDisabledHint: "Property fields arrive in the next gate.",
    sectionKicker: "Property inventory",
  };
}
