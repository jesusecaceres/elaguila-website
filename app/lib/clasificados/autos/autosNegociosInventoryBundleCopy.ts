import type { AutosClassifiedsLang } from "./autosClassifiedsTypes";

export function autosAddInventoryDrawerTitle(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Agregar vehículo al inventario" : "Add vehicle to inventory";
}

export function autosAddInventoryDrawerHelper(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Este vehículo se guardará como parte de esta solicitud. No se publicará todavía. Aparecerá en la vista previa del inventario y se publicará junto con el anuncio principal cuando completes la solicitud."
    : "This vehicle will be saved as part of this application. It will not publish yet. It will appear in the inventory preview and publish with the main listing when you complete the application.";
}

export function autosAddInventorySaveCta(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Guardar en inventario" : "Save to inventory";
}

export function autosAddInventorySaveAndAnotherCta(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Guardar y agregar otro" : "Save and add another";
}

export function autosAddInventoryCancelCta(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Cancelar" : "Cancel";
}

export function autosAddInventoryCountLabel(lang: AutosClassifiedsLang, used: number, limit: number): string {
  return lang === "es"
    ? `Inventario en esta solicitud: ${used} de ${limit}`
    : `Inventory in this application: ${used} of ${limit}`;
}

export function autosAddInventoryAtLimitHelper(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Alcanzaste los 10 vehículos incluidos. Usa Inventory Boost para preparar más espacios."
    : "You reached the 10 included vehicles. Use Inventory Boost to prepare more slots.";
}

export function autosAddInventorySaveRequiresFields(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Indica al menos año, marca o modelo para guardar este vehículo en el inventario."
    : "Enter at least year, make, or model to save this vehicle to inventory.";
}

export function autosAddInventorySectionComingSoon(lang: AutosClassifiedsLang, section: string): string {
  return lang === "es"
    ? `${section} — próximamente en este formulario`
    : `${section} — coming next in this form`;
}

export function autosInventoryBundleSectionTitle(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Inventario incluido en esta solicitud" : "Inventory included in this application";
}

export function autosInventoryBundleMainLabel(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Vehículo principal" : "Main vehicle";
}

export function autosInventoryBundleAdditionalLabel(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Vehículo adicional" : "Additional vehicle";
}

export function autosInventoryBundleEmptyState(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Agrega vehículos adicionales para preparar el inventario del dealer antes de publicar."
    : "Add additional vehicles to prepare the dealer inventory before publishing.";
}

export function autosInventoryBundleStatusDraft(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Borrador" : "Draft";
}

export function autosInventoryBundleStatusReady(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Listo para vista previa" : "Ready for preview";
}

export function autosResultsCardPreviewTitle(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Así se verá en resultados" : "How this will look in results";
}

export function autosResultsCardDealerBadge(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Negocio" : "Dealer";
}

export function autosResultsCardInventoryHint(lang: AutosClassifiedsLang, used: number, limit: number): string {
  return lang === "es"
    ? `Inventario del dealer · ${used}/${limit} incluidos`
    : `Dealer inventory · ${used}/${limit} included`;
}

export function autosResultsCardViewDetails(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Ver detalles" : "View details";
}

export function autosResultsCardLeonixIdNote(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "ID Leonix se generará al publicar" : "Leonix ID generated on publish";
}

export function autosInventoryBoostStripeReturnNote(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Inventory Boost agrega 10 espacios adicionales por $129/mes. Después del pago, regresarás a esta misma solicitud para seguir agregando vehículos sin perder tu información."
    : "Inventory Boost adds 10 more slots for $129/month. After payment, you will return to this same application so you can keep adding vehicles without losing your information.";
}
