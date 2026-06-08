/** BR-INV-E-FAST — post-publish inventory queue bridge copy. */

export function brNegocioInventoryPublishBridgeCopy(lang: "es" | "en") {
  if (lang === "es") {
    return {
      mainPublishedTitle: "Propiedad principal publicada",
      mainPublishedBody: "Tu anuncio principal ya está publicado.",
      mainNextHint:
        "Ahora publica las propiedades adicionales para que aparezcan como inventario real del mismo agente o negocio.",
      childPublishedTitle: "Propiedad adicional publicada",
      childPublishedBody: "Esta propiedad ya es un anuncio real en Leonix.",
      remainingLabel: (n: number) =>
        n === 1 ? "Queda 1 propiedad adicional por publicar." : `Quedan ${n} propiedades adicionales por publicar.`,
      publishNext: "Publicar siguiente propiedad",
      viewMainListing: "Ver anuncio principal",
      viewChildListing: "Ver anuncio publicado",
      queueComplete: "Inventario adicional completado. Todas las propiedades del borrador fueron publicadas.",
    };
  }
  return {
    mainPublishedTitle: "Main property published",
    mainPublishedBody: "Your main listing is now published.",
    mainNextHint:
      "Now publish the additional properties so they appear as real inventory for the same agent or business.",
    childPublishedTitle: "Additional property published",
    childPublishedBody: "This property is now a live listing on Leonix.",
    remainingLabel: (n: number) =>
      n === 1 ? "1 additional property left to publish." : `${n} additional properties left to publish.`,
    publishNext: "Publish next property",
    viewMainListing: "View main listing",
    viewChildListing: "View published listing",
    queueComplete: "Additional inventory complete. All draft properties have been published.",
  };
}
