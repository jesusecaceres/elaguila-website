import type { AutosClassifiedsLang } from "./autosClassifiedsTypes";

export function autosAddInventoryDrawerTitle(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Agregar vehículo al inventario" : "Add vehicle to inventory";
}

export function autosAddInventoryDrawerHelper(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Este vehículo se guardará como parte de esta solicitud. No se publicará todavía. Usará la información del negocio ya capturada y aparecerá en la vista previa del inventario."
    : "This vehicle will be saved as part of this application. It will not publish yet. It will use the business information already captured and appear in the inventory preview.";
}

export function autosInventoryInheritedBusinessNotice(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "La información del negocio, contacto, ubicación, redes, reseñas, horarios y financiamiento se tomará de la solicitud principal."
    : "Business, contact, location, social, review, hours, and financing information will be inherited from the main application.";
}

export function autosInventoryDrawerSectionMain(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Información principal del vehículo" : "Vehicle main information";
}

export function autosInventoryDrawerSectionSpecs(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Especificaciones" : "Specifications";
}

export function autosInventoryDrawerSectionHighlights(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Destacados y equipamiento" : "Highlights and equipment";
}

export function autosInventoryDrawerSectionMedia(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Fotos y medios" : "Photos and media";
}

export function autosInventoryDrawerSectionDescription(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Descripción" : "Description";
}

export function autosInventoryDrawerSectionReview(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Resumen antes de guardar" : "Review before saving";
}

export function autosPreviewInventorySectionTitle(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Vista previa del inventario del dealer" : "Dealer inventory preview";
}

export function autosPreviewInventorySectionHelper(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Estos vehículos se publicarán junto con el anuncio principal cuando completes la solicitud."
    : "These vehicles will publish with the main listing when you complete the application.";
}

export function autosInventoryBundleEdit(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Editar" : "Edit";
}

export function autosInventoryBundleRemove(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Quitar" : "Remove";
}

export function autosInventoryRemoveConfirm(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "¿Quitar este vehículo adicional del inventario de esta solicitud?"
    : "Remove this additional vehicle from this application inventory?";
}

export function autosInventoryBundlePhotoCount(lang: AutosClassifiedsLang, n: number): string {
  return lang === "es" ? `${n} foto${n === 1 ? "" : "s"}` : `${n} photo${n === 1 ? "" : "s"}`;
}

export function autosInventoryDrawerLocationInheritHint(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Opcional. Si lo dejas vacío, se usará la ubicación del anuncio principal."
    : "Optional. If left empty, the main listing location will be used.";
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

export function autosPreviewCaptureBannerTitle(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Vista del anuncio para captura" : "Ad preview for capture";
}

export function autosPreviewCaptureBannerHelper(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Esta vista usa los datos reales del borrador. Los IDs y enlaces públicos finales se generarán al publicar."
    : "This view uses the real draft data. Final public IDs and links are generated when published.";
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

export function autosQaPaymentBypassLabel(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Modo QA: pago omitido" : "QA mode: payment skipped";
}

export function autosQaPublishSuccessLabel(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Publicado en modo QA — pago omitido" : "Published in QA mode — payment skipped";
}

export function autosBundlePublishSuccessIntro(lang: AutosClassifiedsLang, published: number, limit: number): string {
  return lang === "es"
    ? `Se publicaron ${published} vehículo${published === 1 ? "" : "s"} (${published}/${limit} incluidos en este inventario).`
    : `${published} vehicle${published === 1 ? "" : "s"} published (${published}/${limit} included in this inventory).`;
}

export function autosInventoryBoostStripeReturnNote(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Inventory Boost agrega 10 espacios adicionales por $129/mes. Después del pago, regresarás a esta misma solicitud para seguir agregando vehículos sin perder tu información."
    : "Inventory Boost adds 10 more slots for $129/month. After payment, you will return to this same application so you can keep adding vehicles without losing your information.";
}

export function autosInventoryBundlePreviewCta(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Ver vista previa" : "Preview";
}

export function autosChildInventoryPreviewTitle(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Vista previa del vehículo adicional" : "Additional vehicle preview";
}

export function autosChildInventoryPreviewHelper(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Este vehículo se publicará como una ficha propia cuando publiques la solicitud completa."
    : "This vehicle will publish as its own listing when you publish the full application.";
}

export function autosInventoryDrawerUnsavedCloseConfirm(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Tienes cambios sin guardar en este vehículo. ¿Quieres cerrar sin guardar?"
    : "You have unsaved changes in this vehicle. Close without saving?";
}

export function autosInventoryUnsavedModalTitle(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Cambios sin guardar" : "Unsaved changes";
}

export function autosInventoryUnsavedModalBody(lang: AutosClassifiedsLang): string {
  return autosInventoryDrawerUnsavedCloseConfirm(lang);
}

export function autosInventoryUnsavedModalKeepEditing(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Seguir editando" : "Keep editing";
}

export function autosInventoryUnsavedModalCloseWithoutSaving(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Cerrar sin guardar" : "Close without saving";
}

export function autosInventoryChildStep5Intro(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Esta información se toma de la solicitud principal del concesionario. Se usará para este vehículo cuando se guarde en inventario."
    : "This information comes from the main dealership application. It will be used for this vehicle when saved to inventory.";
}

export function autosInventoryChildEditInMainApplication(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Editar en solicitud principal" : "Edit in main application";
}

export function autosInventoryChildStep5SectionTitle(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Negocio / contacto (heredado)" : "Business / contact (inherited)";
}

export function autosInventoryChildReviewPreviewCta(lang: AutosClassifiedsLang): string {
  return lang === "es" ? "Ver vista previa del vehículo" : "Preview this vehicle";
}

export function autosRelatedInventoryDraftNote(lang: AutosClassifiedsLang): string {
  return lang === "es"
    ? "Vista previa — los enlaces finales se generan al publicar."
    : "Preview — final links are generated when published.";
}
