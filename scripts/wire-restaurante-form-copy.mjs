import fs from "fs";

const path =
  "C:/projects/elaguila-website/app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx";
let s = fs.readFileSync(path, "utf8");

function rep(oldStr, newStr, label) {
  if (!s.includes(oldStr)) {
    console.warn("MISSING:", label);
    return;
  }
  s = s.replaceAll(oldStr, newStr);
  console.log("OK:", label);
}

// Import + fc
if (!s.includes("restauranteApplicationFormCopy")) {
  s = s.replace(
    '} from "./restauranteApplicationUiCopy";',
    '} from "./restauranteApplicationUiCopy";\nimport {\n  restauranteApplicationFormCopy,\n  restauranteSectionHeading,\n} from "./restauranteApplicationFormCopy";',
  );
}
if (!s.includes("const fc = useMemo")) {
  s = s.replace(
    "const previewGate = useMemo(() => restaurantePreviewGateCopy(lang), [lang]);",
    "const previewGate = useMemo(() => restaurantePreviewGateCopy(lang), [lang]);\n  const fc = useMemo(() => restauranteApplicationFormCopy(lang), [lang]);",
  );
}

// Dashboard callbacks
rep(
  `setDashboardContextErr(
        lang === "es"
          ? "Falta el identificador del anuncio. Vuelve al panel e intenta de nuevo."
          : "Listing id is missing. Return to the dashboard and try again.",
      );`,
  "setDashboardContextErr(fc.dashboard.missingListingId);",
  "dashboard missingListingId",
);
rep(
  `setDashboardContextErr(
        lang === "es"
          ? "No pudimos iniciar el pago del módulo de cupones."
          : "We could not start coupon module checkout.",
      );`,
  "setDashboardContextErr(fc.dashboard.couponCheckoutFailed);",
  "dashboard couponCheckoutFailed",
);
rep(
  `setDashboardContextErr(
        lang === "es"
          ? "Activa el módulo de ofertas antes de guardar."
          : "Enable the offers module before saving.",
      );`,
  "setDashboardContextErr(fc.dashboard.enableOffersBeforeSave);",
  "dashboard enableOffersBeforeSave",
);
rep(
  `setDashboardContextErr(
          lang === "es" ? "Inicia sesión para guardar los cambios." : "Sign in to save changes.",
        );`,
  "setDashboardContextErr(fc.dashboard.signInToSave);",
  "dashboard signInToSave",
);
rep(
  `setDashboardContextErr(
          lang === "es"
            ? "No se pudieron preparar las imágenes. Comprueba la conexión e intenta de nuevo."
            : "We could not prepare images. Check your connection and try again.",
        );`,
  "setDashboardContextErr(fc.dashboard.imagesPrepareFailed);",
  "dashboard imagesPrepareFailed",
);
rep(
  `setDashboardContextErr(
        lang === "es"
          ? "No se pudieron guardar los cambios. Intenta de nuevo."
          : "Could not save changes. Please try again.",
      );`,
  "setDashboardContextErr(fc.dashboard.saveChangesFailedRetry);",
  "dashboard saveChangesFailedRetry",
);
rep(
  `setDashboardContextErr(
        lang === "es" ? "No se pudieron guardar los cambios." : "Could not save changes.",
      );`,
  "setDashboardContextErr(fc.dashboard.saveChangesFailed);",
  "dashboard saveChangesFailed",
);

s = s.replace(
  "}, [dashboardListingId, dashboardLeonixAdId, lang, dashboardCouponCheckoutReturnPath]);",
  "}, [dashboardListingId, dashboardLeonixAdId, lang, dashboardCouponCheckoutReturnPath, fc]);",
);
s = s.replace(
  "    dashboardReturnHref,\n  ]);",
  "    dashboardReturnHref,\n    fc,\n  ]);",
);

// Header / chrome ternaries (include outer JSX braces in pattern)
rep('{lang === "en" ? "Loading draft…" : "Cargando borrador…"}', "{fc.header.loadingDraft}", "loadingDraft");
rep('{lang === "en" ? "Leonix Classifieds" : "Leonix Clasificados"}', "{fc.header.brand}", "brand");
rep('{lang === "en" ? "Publish restaurant" : "Publicar restaurante"}', "{fc.header.title}", "title");
rep(
  `{lang === "en"
            ? "Completed fields will appear in the preview. Empty fields will not be shown to the buyer."
            : "Los campos completados aparecerán en la vista previa. Los campos vacíos no se mostrarán al comprador."}`,
  "{fc.header.intro}",
  "header intro",
);
rep(
  `{lang === "en"
            ? "Draft in this browser session: persists when navigating to preview, returning, and refreshing in the same tab; discarded when closing the tab or browser. Key "
            : "Borrador en esta sesión del navegador: se mantiene al ir a vista previa, volver y actualizar la página en la misma pestaña; al cerrar la pestaña o el navegador se descarta. Clave "}`,
  "{fc.header.draftNote}",
  "header draftNote",
);
rep('{lang === "en" ? " (session storage)." : " (almacenamiento de sesión)."}', "{fc.header.draftNoteSuffix}", "draftNoteSuffix");

rep(
  `{lang === "en"
              ? "You are enabling coupons for an existing listing. Only the coupon module will be charged: $99/mo."
              : "Estás activando cupones para un anuncio existente. Solo se cobrará el módulo de cupones: $99/mes."}`,
  "{fc.dashboard.addonModeMessage}",
  "addonModeMessage",
);
rep(
  `{lang === "en"
              ? "You are editing coupons for an existing listing."
              : "Estás editando cupones para un anuncio existente."}`,
  "{fc.dashboard.couponEditModeMessage}",
  "couponEditModeMessage",
);
rep(
  `{lang === "en"
              ? "You are editing your published restaurant listing. Save changes here — the base plan will not be charged again."
              : "Estás editando tu anuncio publicado. Guarda los cambios aquí — no se volverá a cobrar el plan base."}`,
  "{fc.dashboard.listingEditModeMessage}",
  "listingEditModeMessage",
);
rep(
  `{lang === "en"
            ? "This dashboard coupon flow requires a listing id. Open it from Dashboard → My listings."
            : "Este flujo de cupones requiere un identificador de anuncio. Ábrelo desde Panel → Mis anuncios."}`,
  "{fc.dashboard.focusCouponMissingListingId}",
  "focusCouponMissingListingId",
);

rep(
  '{lang === "en" ? "Want to attract more customers with coupons?" : "¿Quieres atraer más clientes con cupones?"}',
  "{fc.couponUpsell.title}",
  "couponUpsell title",
);
rep(
  `{lang === "en"
              ? "$99/month to show featured offers inside your restaurant ad. You can publish up to 4 main coupons and add a flyer or external link for more promotions."
              : "$99/mes para mostrar ofertas destacadas dentro de tu anuncio. Puedes publicar hasta 4 cupones principales y agregar un flyer o enlace externo para más promociones."}`,
  "{fc.couponUpsell.body}",
  "couponUpsell body",
);
rep('{lang === "en" ? "Add coupons" : "Agregar cupones"}', "{fc.couponUpsell.addCoupons}", "couponUpsell addCoupons");
rep(
  '{lang === "en" ? "Continue without coupons" : "Continuar sin cupones"}',
  "{fc.couponUpsell.continueWithoutCoupons}",
  "continueWithoutCoupons",
);

// Common (full JSX expression replacements)
const common = [
  ['{lang === "en" ? "Starting checkout…" : "Iniciando pago…"}', "{fc.common.startingCheckout}"],
  ['{lang === "en" ? "Back to dashboard" : "Volver al panel"}', "{fc.common.backToDashboard}"],
  ['{lang === "en" ? "Closed" : "Cerrado"}', "{fc.common.closed}"],
  ['{lang === "en" ? "See more" : "Ver más"}', "{fc.common.seeMore}"],
  ['{lang === "en" ? "Remove" : "Quitar"}', "{fc.common.remove}"],
  ['{lang === "en" ? "Remove" : "Eliminar"}', "{fc.common.delete}"],
  ['{lang === "en" ? "Or drag and drop an image" : "O arrastra y suelta una imagen"}', "{fc.common.dragDropImage}"],
  ['{lang === "en" ? "Or paste image URL" : "O pega URL de imagen"}', "{fc.common.pasteImageUrl}"],
  ['{lang === "en" ? "Saving…" : "Guardando…"}', "{fc.common.saving}"],
  ['{lang === "en" ? "Preview" : "Vista previa"}', "{fc.sectionFinal.preview}"],
  ['{lang === "en" ? "Delete request" : "Eliminar solicitud"}', "{fc.sectionFinal.deleteRequest}"],
  ['{lang === "en" ? "Continue to preview" : "Continuar a vista previa"}', "{fc.sectionFinal.continueToPreview}"],
  ['{lang === "en" ? "Close" : "Cerrar"}', "{fc.common.close}"],
];
for (const [a, b] of common) rep(a, b, b);

// Section G
rep(
  `{lang === "en"
                      ? "Add up to 4 featured offers/coupons to your listing to attract more customers. Activate the module for $99/mo, then you can save your offers."
                      : "Agrega hasta 4 ofertas/cupones destacados a tu anuncio para atraer más clientes. Activa el módulo por $99/mes y luego podrás guardar tus ofertas."}`,
  "{fc.sectionG.dashboardAddonBody}",
  "sectionG dashboardAddonBody",
);
rep(
  '{lang === "en" ? "Do you want to add featured coupons to your profile?" : "¿Quieres agregar cupones destacados a tu perfil?"}',
  "{fc.sectionG.upsellQuestion}",
  "upsellQuestion",
);
rep('+$${lang === "en" ? "99/month" : "99/mes"}', '+$${fc.sectionG.upsellPrice}', "upsellPriceLine");
rep(
  '{lang === "en" ? "Special price for restaurants. Previously $199/month as a standalone product." : "Precio especial para restaurantes. Antes era $199/mes como producto independiente."}',
  "{fc.sectionG.upsellPriceNote}",
  "upsellPriceNote",
);
rep(
  `{lang === "en"
                      ? "Add up to 4 featured coupons within your profile. You can promote combos, seasonal discounts, lunch specials, catering, or events. Customers will be able to share the coupon by link, message, email, or compatible apps."
                      : "Agrega hasta 4 cupones destacados dentro de tu perfil. Puedes promocionar combos, descuentos de temporada, especiales de almuerzo, catering o eventos. Los clientes podrán compartir el cupón por enlace, mensaje, email o apps compatibles."}`,
  "{fc.sectionG.upsellBody}",
  "upsellBody",
);
rep(
  '{lang === "en" ? "Add coupons for $99/month" : "Agregar cupones por $99/mes"}',
  "{fc.sectionG.addCouponsForPrice}",
  "addCouponsForPrice",
);
rep(
  '{lang === "en" ? "Coupons enabled — +$99/month" : "Cupones activados — +$99/mes"}',
  "{fc.sectionG.couponsEnabled}",
  "couponsEnabled",
);

rep(
  `{dashboardSaveBusy
                  ? lang === "en"
                    ? "Saving…"
                    : "Guardando…"
                  : lang === "en"
                    ? "Save offers"
                    : "Guardar ofertas"}`,
  "{dashboardSaveBusy ? fc.common.saving : fc.dashboard.saveOffers}",
  "save offers btn",
);
rep(
  `{dashboardSaveBusy
                    ? lang === "en"
                      ? "Saving…"
                      : "Guardando…"
                    : lang === "en"
                      ? "Save restaurant changes"
                      : "Guardar cambios del restaurante"}`,
  "{dashboardSaveBusy ? fc.common.saving : fc.dashboard.saveRestaurantChanges}",
  "save restaurant btn",
);

// Section final
rep(
  `{isExistingDashboardListingMode
              ? lang === "en"
                ? "Save your restaurant changes here. The base plan will not be charged again. Use section G for offers if your module is active."
                : "Guarda los cambios de tu restaurante aquí. No se volverá a cobrar el plan base. Usa la sección G para ofertas si tu módulo está activo."
              : lang === "en"
                ? "Check these boxes before reviewing your ad. Payment is completed after the preview."
                : "Marca estas casillas antes de revisar tu anuncio. El pago se completa después de la vista previa."}`,
  "{isExistingDashboardListingMode ? fc.sectionFinal.introDashboard : fc.sectionFinal.introNew}",
  "sectionFinal intro",
);
rep(
  `{lang === "en"
                  ? "I confirm that the restaurant information is truthful and up to date."
                  : "Confirmo que la información del restaurante es veraz y actualizada."}`,
  "{fc.sectionFinal.confirmBusinessInfo}",
  "confirmBusinessInfo",
);
rep(
  `{lang === "en"
                  ? "I confirm that the photos, dishes, hours, offers, and contact details represent my business correctly."
                  : "Confirmo que las fotos, platillos, horarios, ofertas y datos de contacto representan mi negocio correctamente."}`,
  "{fc.sectionFinal.confirmPhotosRepresent}",
  "confirmPhotosRepresent",
);
rep(
  `{lang === "en"
                  ? "I confirm that my ad complies with Leonix rules and that I am responsible for the published information."
                  : "Confirmo que mi anuncio cumple con las reglas de Leonix y que soy responsable por la información publicada."}`,
  "{fc.sectionFinal.confirmCommunityRules}",
  "confirmCommunityRules",
);
rep(
  `{lang === "en"
                    ? "I confirm that the coupons and promotions are valid, with correct expiration dates and clear terms."
                    : "Confirmo que los cupones y promociones son válidos, con fechas de expiración correctas y términos claros."}`,
  "{fc.sectionFinal.confirmCouponTerms}",
  "confirmCouponTerms",
);
rep(
  '{lang === "en" ? "To enable Preview, complete the following:" : "Para habilitar Vista previa, completa lo siguiente:"}',
  "{fc.sectionFinal.previewGateTitle}",
  "previewGateTitle",
);
rep(
  '{lang === "en" ? "Complete minimum required fields" : "Completa los campos mínimos requeridos"}',
  "{fc.sectionFinal.previewGateMinFields}",
  "previewGateMinFields",
);
rep(
  '{lang === "en" ? "Confirm restaurant information is correct" : "Confirma que la información del restaurante es correcta"}',
  "{fc.sectionFinal.previewGateConfirmInfo}",
  "previewGateConfirmInfo",
);
rep(
  '{lang === "en" ? "Confirm photos and data represent your business" : "Confirma que las fotos y datos representan tu negocio"}',
  "{fc.sectionFinal.previewGateConfirmPhotos}",
  "previewGateConfirmPhotos",
);
rep(
  '{lang === "en" ? "Confirm you comply with Leonix rules" : "Confirma que cumples las reglas de Leonix"}',
  "{fc.sectionFinal.previewGateConfirmRules}",
  "previewGateConfirmRules",
);
rep(
  '{lang === "en" ? "Confirm promotions are valid" : "Confirma que las promociones son válidas"}',
  "{fc.sectionFinal.previewGateConfirmPromos}",
  "previewGateConfirmPromos",
);

// Drawer
rep(
  `{lang === "en" ? "What's included with Featured Coupons" : "Qué incluye Cupones Destacados"}`,
  "{fc.sectionG.drawerTitle}",
  "drawerTitle",
);
const drawerKeys = ["drawerItem1", "drawerItem2", "drawerItem3", "drawerItem4", "drawerItem5", "drawerItem6", "drawerItem7", "drawerItem8"];
const drawerEs = [
  "Hasta 4 cupones principales dentro del perfil del restaurante",
  "Campos para título, descripción, código, vencimiento y nota de canje",
  "Opción para agregar flyer/imagen del cupón o promoción",
  "Opción para agregar URL externa de cupón, menú, landing page o promoción",
  "El cliente puede compartir el cupón por enlace, SMS/email/app share cuando esté disponible",
  'Los cupones aparecen debajo de "Especialidades de la Casa" en la ficha pública',
  'Los cupones llevan marca Leonix / "Publicado en Leonix" donde corresponda',
  "Revisión final antes de publicación",
];
const drawerEn = [
  "Up to 4 main coupons within the restaurant profile",
  "Fields for title, description, code, expiration, and redemption note",
  "Option to add coupon flyer/image or promotion image",
  "Option to add external URL for coupon, menu, landing page, or promotion",
  "Customer can share coupon by link, SMS/email/app share when supported",
  'Coupons appear below "House Specialties" on the public profile',
  'Coupons carry Leonix branding / "Published on Leonix" where appropriate',
  "Final review before publication",
];
drawerKeys.forEach((key, i) => {
  rep(`{lang === "en" ? "${drawerEn[i]}" : "${drawerEs[i]}"}`, `{fc.sectionG.${key}}`, key);
});

// Section K event sizes
rep("{labelForCuisine(o.key, lang)}", "{restauranteEventSizeLabel(o.key, o.labelEs, lang)}", "sectionK event sizes");

// CityAutocomplete + video lang
rep('lang="es"', "lang={lang}", "CityAutocomplete lang");
rep(
  "<RestauranteExternalVideoUrlsSection draft={draft} setDraftPatch={setDraftPatch} />",
  "<RestauranteExternalVideoUrlsSection draft={draft} setDraftPatch={setDraftPatch} lang={lang} />",
  "video section lang",
);

// Nav
rep("\n            Atrás\n", "\n            {fc.common.back}\n", "nav back");
rep("\n            Siguiente\n", "\n            {fc.common.next}\n", "nav next");

// Section titles
const titles = [
  ["A · Identidad del negocio", 'restauranteSectionHeading("A", "a", lang)'],
  ["B · Modelo de operación", 'restauranteSectionHeading("B", "b", lang)'],
  ["C · Horarios", 'restauranteSectionHeading("C", "c", lang)'],
  ["D · Contacto y CTAs", 'restauranteSectionHeading("D", "d", lang)'],
  ["E · Ubicación del establecimiento", 'restauranteSectionHeading("E", "e", lang)'],
  ["F · Platos destacados (máx. 4)", "fc.sectionF.title"],
  ["G · Cupones y ofertas", 'restauranteSectionHeading("G", "g", lang)'],
  ["H · Galería y medios", 'restauranteSectionHeading("H", "h", lang)'],
  ["I · Destacados del lugar", 'restauranteSectionHeading("I", "i", lang)'],
  ["J · Amenidades y más", 'restauranteSectionHeading("J", "j", lang)'],
  ["K · Catering y eventos", 'restauranteSectionHeading("K", "k", lang)'],
  ["Final · Confirmación antes de la vista previa", "fc.sectionFinal.title"],
];
for (const [old, neu] of titles) {
  rep(`<SectionTitle>${old}</SectionTitle>`, `<SectionTitle>{${neu}}</SectionTitle>`, `title ${old.slice(0, 12)}`);
}

// --- Section A content ---
rep(
  `<HelperText>
            Esta sección define cómo te reconocen en resultados y en la ficha: nombre, cocinas y ciudad canónica son la base
            del anuncio.
          </HelperText>`,
  "<HelperText>{fc.sectionA.intro}</HelperText>",
  "sectionA intro",
);
rep("<FieldLabel required>Nombre del negocio</FieldLabel>", '<FieldLabel required lang={lang}>{fc.sectionA.businessNameLabel}</FieldLabel>', "businessNameLabel");
rep("<HelperText>Título principal del listado y de la tarjeta abierta.</HelperText>", "<HelperText>{fc.sectionA.businessNameHelper}</HelperText>", "businessNameHelper");
rep("<FieldLabel required>Tipo de negocio</FieldLabel>", '<FieldLabel required lang={lang}>{fc.sectionA.businessTypeLabel}</FieldLabel>', "businessTypeLabel");
rep("<HelperText>Clasificación del negocio; ayuda a filtros y contexto en la ficha.</HelperText>", "<HelperText>{fc.sectionA.businessTypeHelper}</HelperText>", "businessTypeHelper");
rep('<option value="">Seleccionar…</option>', '<option value="">{fc.common.selectPlaceholder}</option>', "selectPlaceholder");
rep("<FieldLabel>Especifica el tipo (Otro)</FieldLabel>", "<FieldLabel>{fc.sectionA.businessTypeOtherLabel}</FieldLabel>", "businessTypeOtherLabel");
rep('placeholder="Ej. cocina oculta especializada"', 'placeholder={fc.sectionA.businessTypeOtherPlaceholder}', "businessTypeOtherPlaceholder");
rep("<FieldLabel required>Cocina principal</FieldLabel>", '<FieldLabel required lang={lang}>{fc.sectionA.primaryCuisineLabel}</FieldLabel>', "primaryCuisineLabel");
rep(
  `<HelperText>
                  Identidad culinaria principal: en la ficha aparece en la <strong className="text-[color:var(--lx-text-2)]">línea de cocina bajo el título</strong> del héroe y alimenta datos estructurados para filtros. Una sola elección.
                </HelperText>`,
  "<HelperText>{fc.sectionA.primaryCuisineHelper}</HelperText>",
  "primaryCuisineHelper",
);
rep("<FieldLabel optional>Cocina secundaria</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionA.secondaryCuisineLabel}</FieldLabel>', "secondaryCuisineLabel");
rep(
  `<HelperText>
                  Segunda identidad culinaria opcional: se une a la principal en la <strong className="text-[color:var(--lx-text-2)]">misma línea bajo el título</strong>. No sustituye la principal. Una sola elección.
                </HelperText>`,
  "<HelperText>{fc.sectionA.secondaryCuisineHelper}</HelperText>",
  "secondaryCuisineHelper",
);
rep('<option value="">—</option>', '<option value="">{fc.common.dashPlaceholder}</option>', "dashPlaceholder");
rep("<FieldLabel>Especifica la cocina principal (Otra)</FieldLabel>", "<FieldLabel>{fc.sectionA.primaryCuisineOtherLabel}</FieldLabel>", "primaryCuisineOtherLabel");
rep("<HelperText>Texto corto que verá el comprador donde corresponda «Otra» en cocina principal.</HelperText>", "<HelperText>{fc.sectionA.primaryCuisineOtherHelper}</HelperText>", "primaryCuisineOtherHelper");
rep('placeholder="Ej. Sichuan, Oaxaca, fusión indo-mexicana…"', 'placeholder={fc.sectionA.primaryCuisineOtherPlaceholder}', "primaryCuisineOtherPlaceholder");
rep("<FieldLabel>Especifica la cocina secundaria (Otra)</FieldLabel>", "<FieldLabel>{fc.sectionA.secondaryCuisineOtherLabel}</FieldLabel>", "secondaryCuisineOtherLabel");
rep("<HelperText>Complementa la etiqueta cuando la secundaria es «Otra».</HelperText>", "<HelperText>{fc.sectionA.secondaryCuisineOtherHelper}</HelperText>", "secondaryCuisineOtherHelper");
rep('placeholder="Breve descripción"', 'placeholder={fc.sectionA.secondaryCuisineOtherPlaceholder}', "secondaryCuisineOtherPlaceholder");
rep("<FieldLabel optional>Cocinas adicionales</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionA.additionalCuisinesLabel}</FieldLabel>', "additionalCuisinesLabel");
rep(
  `<HelperText>
                Etiquetas de apoyo para descubrimiento: en la ficha salen como <strong className="text-[color:var(--lx-text-2)]">chips «Descub.»</strong> bajo la línea principal/secundaria, no en esa línea. Por eso existen las tres: identidad clara + etiquetas selectivas. Elige hasta{" "}
                <strong className="font-semibold text-[color:var(--lx-text-2)]">{MAX_ADDITIONAL_CUISINES}</strong>. La ciudad
                canónica y la cocina principal siguen anclando filtros y resultados.
              </HelperText>`,
  "<HelperText>{fc.sectionA.additionalCuisinesHelper}</HelperText>",
  "additionalCuisinesHelper",
);
rep(
  "{(draft.additionalCuisines ?? []).length}/{MAX_ADDITIONAL_CUISINES} seleccionadas",
  "{(draft.additionalCuisines ?? []).length}/{MAX_ADDITIONAL_CUISINES} {fc.sectionA.additionalCuisinesCountSuffix}",
  "additionalCuisinesCountSuffix",
);
rep(
  `<span className="ml-1 text-amber-800">
                    — Tienes más etiquetas de las recomendadas; desmarca hasta {MAX_ADDITIONAL_CUISINES} para un listado más
                    limpio.
                  </span>`,
  '<span className="ml-1 text-amber-800">{fc.sectionA.additionalCuisinesOverCapWarning}</span>',
  "additionalCuisinesOverCapWarning",
);
rep("<FieldLabel optional>Especifica “Otra” en cocinas adicionales</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionA.additionalCuisineOtherLabel}</FieldLabel>', "additionalCuisineOtherLabel");
rep("<HelperText>Una línea clara; se muestra donde aplique la etiqueta «Otra».</HelperText>", "<HelperText>{fc.sectionA.additionalCuisineOtherHelper}</HelperText>", "additionalCuisineOtherHelper");
rep('placeholder="Una línea, p. ej. comida nikkei"', 'placeholder={fc.sectionA.additionalCuisineOtherPlaceholder}', "additionalCuisineOtherPlaceholder");
rep(
  `<FieldLabel optional>
                Sobre nosotros <span className="font-normal text-[color:var(--lx-muted)]">(recomendado)</span>
              </FieldLabel>`,
  `<FieldLabel optional lang={lang}>
                {fc.sectionA.aboutUsLabel}{" "}
                <span className="font-normal text-[color:var(--lx-muted)]">({fc.common.recommended})</span>
              </FieldLabel>`,
  "aboutUsLabel",
);
rep(
  `<HelperText>
                Cuéntales a los clientes la historia, ambiente, especialidades o experiencia del restaurante. Aparece más abajo
                en la ficha, no en la cabecera.
              </HelperText>`,
  "<HelperText>{fc.sectionA.aboutUsHelper}</HelperText>",
  "aboutUsHelper",
);
rep("<FieldLabel optional>Zona del restaurante</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionA.neighborhoodLabel}</FieldLabel>', "neighborhoodLabel");
rep(
  `<HelperText>
                Texto libre de zona o distrito: aparece en la tarjeta <strong className="text-[color:var(--lx-text-2)]">«Zona»</strong> de la franja de información rápida, junto a la ciudad canónica. No sustituye la ciudad estructurada ni los filtros NorCal.
              </HelperText>`,
  "<HelperText>{fc.sectionA.neighborhoodHelper}</HelperText>",
  "neighborhoodHelper",
);
rep("<FieldLabel optional>Nivel de precio</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionA.priceLevelLabel}</FieldLabel>', "priceLevelLabel");
rep("<HelperText>Referencia rápida en la ficha cuando la completes.</HelperText>", "<HelperText>{fc.sectionA.priceLevelHelper}</HelperText>", "priceLevelHelper");
rep("<FieldLabel optional>Idiomas</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionA.languagesLabel}</FieldLabel>', "languagesLabel");
rep(
  `<HelperText>
                Idiomas en los que el equipo puede atender al cliente en persona, por teléfono o mensaje — no es una lista
                decorativa. Aparecen en la franja de información rápida como una línea compacta. Si seleccionas <strong className="text-[color:var(--lx-text-2)]">Otro</strong>, especifica el idioma concreto.
              </HelperText>`,
  "<HelperText>{fc.sectionA.languagesHelper}</HelperText>",
  "languagesHelper",
);
rep('aria-label={`Quitar ${lang}`}', 'aria-label={`${fc.common.removeLanguageAria} ${lang}`}', "removeLanguageAria");
rep("<FieldLabel optional>Especifica el idioma (Otro)</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionA.languageOtherLabel}</FieldLabel>', "languageOtherLabel");
rep(
  `<HelperText>
                        Escribe el idioma concreto y pulsa Añadir. Máximo {RESTAURANTE_MAX_CUSTOM_LANGUAGES} idiomas
                        personalizados.
                      </HelperText>`,
  "<HelperText>{fc.sectionA.languageOtherHelper}</HelperText>",
  "languageOtherHelper",
);
rep('placeholder="Ej. portugués, ASL…"', 'placeholder={fc.sectionA.languageOtherPlaceholder}', "languageOtherPlaceholder");
rep("\n                          Añadir\n", "\n                          {fc.common.add}\n", "add language btn");

fs.writeFileSync(path, s);
console.log("Phase A + chrome done");
