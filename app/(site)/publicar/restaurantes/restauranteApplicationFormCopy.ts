import {
  restauranteSectionShortTitle,
  type RestauranteAppUiLang,
} from "./restauranteApplicationUiCopy";

export type { RestauranteAppUiLang };

export function tr(lang: RestauranteAppUiLang, es: string, en: string): string {
  return lang === "en" ? en : es;
}

export function restauranteSectionHeading(
  letter: string,
  sectionKey: string,
  lang: RestauranteAppUiLang,
): string {
  return `${letter} · ${restauranteSectionShortTitle(sectionKey, lang)}`;
}

const COPY = {
  es: {
    common: {
      selectPlaceholder: "Seleccionar…",
      dashPlaceholder: "—",
      recommended: "recomendado",
      add: "Añadir",
      remove: "Quitar",
      replace: "Reemplazar",
      uploadImage: "Subir imagen",
      uploadLogo: "Subir logo",
      uploadFile: "Subir archivo",
      uploading: "Subiendo...",
      processingImage: "Procesando imagen...",
      processingHeroImage: "Procesando imagen hero...",
      processingLogo: "Procesando logo...",
      savedInDraft: "✅ Imagen guardada en el borrador",
      logoSavedInDraft: "✅ Logo guardado en el borrador",
      fileSavedInDraft: "✅ Archivo guardado en el borrador",
      dragDropImage: "O arrastra y suelta una imagen",
      pasteImageUrl: "O pega URL de imagen",
      closed: "Cerrado",
      back: "Atrás",
      next: "Siguiente",
      close: "Cerrar",
      delete: "Eliminar",
      ready: "✅ Lista",
      fileAccepted: "✅ Archivo aceptado",
      removeFile: "Quitar archivo",
      removeImage: "Quitar imagen",
      removeLogo: "Quitar logo",
      seeMore: "Ver más",
      startingCheckout: "Iniciando pago…",
      saving: "Guardando…",
      backToDashboard: "Volver al panel",
      addDish: "+ Añadir plato",
      addCoupon: "+ Añadir cupón",
      dishNumber: "Plato",
      couponNumber: "Cupón",
      removeLanguageAria: "Quitar",
    },
    header: {
      loadingDraft: "Cargando borrador…",
      brand: "Leonix Clasificados",
      title: "Publicar restaurante",
      intro:
        "Los campos completados aparecerán en la vista previa. Los campos vacíos no se mostrarán al comprador.",
      draftNote:
        "Borrador en esta sesión del navegador: se mantiene al ir a vista previa, volver y actualizar la página en la misma pestaña; al cerrar la pestaña o el navegador se descarta. Clave ",
      draftNoteSuffix: " (almacenamiento de sesión).",
    },
    dashboard: {
      addonModeMessage:
        "Estás activando cupones para un anuncio existente. Solo se cobrará el módulo de cupones: $99/mes.",
      couponEditModeMessage: "Estás editando cupones para un anuncio existente.",
      listingEditModeMessage:
        "Estás editando tu anuncio publicado. Guarda los cambios aquí — no se volverá a cobrar el plan base.",
      focusCouponMissingListingId:
        "Este flujo de cupones requiere un identificador de anuncio. Ábrelo desde Panel → Mis anuncios.",
      saveOffers: "Guardar ofertas",
      saveRestaurantChanges: "Guardar cambios del restaurante",
      missingListingId: "Falta el identificador del anuncio. Vuelve al panel e intenta de nuevo.",
      couponCheckoutFailed: "No pudimos iniciar el pago del módulo de cupones.",
      enableOffersBeforeSave: "Activa el módulo de ofertas antes de guardar.",
      signInToSave: "Inicia sesión para guardar los cambios.",
      imagesPrepareFailed:
        "No se pudieron preparar las imágenes. Comprueba la conexión e intenta de nuevo.",
      saveChangesFailedRetry: "No se pudieron guardar los cambios. Intenta de nuevo.",
      saveChangesFailed: "No se pudieron guardar los cambios.",
    },
    couponUpsell: {
      title: "¿Quieres atraer más clientes con cupones?",
      body: "$99/mes para mostrar ofertas destacadas dentro de tu anuncio. Puedes publicar hasta 4 cupones principales y agregar un flyer o enlace externo para más promociones.",
      addCoupons: "Agregar cupones",
      continueWithoutCoupons: "Continuar sin cupones",
    },
    sectionA: {
      intro:
        "Esta sección define cómo te reconocen en resultados y en la ficha: nombre, cocinas y ciudad canónica son la base del anuncio.",
      businessNameLabel: "Nombre del negocio",
      businessNameHelper: "Título principal del listado y de la tarjeta abierta.",
      businessTypeLabel: "Tipo de negocio",
      businessTypeHelper: "Clasificación del negocio; ayuda a filtros y contexto en la ficha.",
      businessTypeOtherLabel: "Especifica el tipo (Otro)",
      businessTypeOtherPlaceholder: "Ej. cocina oculta especializada",
      primaryCuisineLabel: "Cocina principal",
      primaryCuisineHelper:
        "Identidad culinaria principal: en la ficha aparece en la línea de cocina bajo el título del héroe y alimenta datos estructurados para filtros. Una sola elección.",
      secondaryCuisineLabel: "Cocina secundaria",
      secondaryCuisineHelper:
        "Segunda identidad culinaria opcional: se une a la principal en la misma línea bajo el título. No sustituye la principal. Una sola elección.",
      primaryCuisineOtherLabel: "Especifica la cocina principal (Otra)",
      primaryCuisineOtherHelper:
        "Texto corto que verá el comprador donde corresponda «Otra» en cocina principal.",
      primaryCuisineOtherPlaceholder: "Ej. Sichuan, Oaxaca, fusión indo-mexicana…",
      secondaryCuisineOtherLabel: "Especifica la cocina secundaria (Otra)",
      secondaryCuisineOtherHelper: "Complementa la etiqueta cuando la secundaria es «Otra».",
      secondaryCuisineOtherPlaceholder: "Breve descripción",
      additionalCuisinesLabel: "Cocinas adicionales",
      additionalCuisinesHelper:
        "Etiquetas de apoyo para descubrimiento: en la ficha salen como chips «Descub.» bajo la línea principal/secundaria, no en esa línea. Por eso existen las tres: identidad clara + etiquetas selectivas. Elige hasta 3. La ciudad canónica y la cocina principal siguen anclando filtros y resultados.",
      additionalCuisinesCountSuffix: "seleccionadas",
      additionalCuisinesOverCapWarning:
        "— Tienes más etiquetas de las recomendadas; desmarca hasta 3 para un listado más limpio.",
      additionalCuisineOtherLabel: "Especifica “Otra” en cocinas adicionales",
      additionalCuisineOtherHelper: "Una línea clara; se muestra donde aplique la etiqueta «Otra».",
      additionalCuisineOtherPlaceholder: "Una línea, p. ej. comida nikkei",
      aboutUsLabel: "Sobre nosotros",
      aboutUsHelper:
        "Cuéntales a los clientes la historia, ambiente, especialidades o experiencia del restaurante. Aparece más abajo en la ficha, no en la cabecera.",
      neighborhoodLabel: "Zona del restaurante",
      neighborhoodHelper:
        "Texto libre de zona o distrito: aparece en la tarjeta «Zona» de la franja de información rápida, junto a la ciudad canónica. No sustituye la ciudad estructurada ni los filtros NorCal.",
      priceLevelLabel: "Nivel de precio",
      priceLevelHelper: "Referencia rápida en la ficha cuando la completes.",
      languagesLabel: "Idiomas",
      languagesHelper:
        "Idiomas en los que el equipo puede atender al cliente en persona, por teléfono o mensaje — no es una lista decorativa. Aparecen en la franja de información rápida como una línea compacta. Si seleccionas Otro, especifica el idioma concreto.",
      languageOtherLabel: "Especifica el idioma (Otro)",
      languageOtherHelper:
        "Escribe el idioma concreto y pulsa Añadir. Máximo 3 idiomas personalizados.",
      languageOtherPlaceholder: "Ej. portugués, ASL…",
    },
    sectionB: {
      serviceModesIntro:
        "Los modos de servicio son opcionales. Por defecto se asume restaurante físico/local. Usa esta sección si el negocio también ofrece catering/eventos, delivery, takeout, reservas, etc. La selección mejora el listado pero no se requiere para vista previa.",
      helper:
        "Marca Catering y eventos si necesitas la sección extra K. Usa Modos y servicios disponibles para la identidad de servicio en datos y vista previa.",
      cateringStackLabel: "Catering y eventos (stack K)",
      cateringCardTitle: "Catering y eventos",
      cateringCardBody: "Activa la configuración de catering y eventos.",
      cateringCheckbox: "Catering",
      eventFoodCheckbox: "Comida para eventos",
      cateringConfigTitle: "Configuración de catering y eventos",
      eventSizesLabel: "Tamaños de evento",
      eventSizesHelper: "Capacidad de eventos que puedes atender.",
      cateringInquiryUrlLabel: "URL de consulta de catering",
      cateringInquiryUrlHelper: "Enlace para que los clientes soliciten información de catering.",
      serviceModesTitle: "Modos y servicios disponibles",
      serviceModesBody:
        "Una sola lista para comer en local, para llevar, entrega, recogida, reservas, catering, eventos y más. Al menos una opción para la vista previa con validación.",
      serviceModeOtherLabel: "Especifica el modo de servicio (Otro)",
      serviceModeOtherHelper:
        "Texto corto que verá el cliente en la franja Servicio (información rápida) y como etiqueta «Modo: …» cuando aplique; forma parte de la identidad canónica igual que los demás modos marcados.",
      serviceModeOtherPlaceholder: "Ej. venta en ferias, solo suscripciones…",
      deliveryConfigTitle: "Configuración de entrega",
      deliveryRadiusLabel: "Radio de entrega (millas)",
      deliveryRadiusHelper:
        "Alcance aproximado cuando ofreces entrega. Déjalo vacío si no entregas o si prefieres no especificar radio.",
    },
    sectionC: {
      requiredNote:
        "Completa cada día (cerrado u horario) o indica la situación con las notas de abajo — necesario para la vista previa estructural.",
      helper:
        "La cuadrícula semanal es la base en la ficha. Las notas no sustituyen horarios salvo que así lo indiques; sirven para excepciones, feriados o cambios puntuales visibles junto al bloque de horas.",
      specialHoursLabel: "Nota de horario especial",
      specialHoursHelper:
        "Aviso recurrente o general (p. ej. «cerrado lunes festivos», «cocina cierra a las 9 pm»): no reemplaza la cuadrícula semanal. Se muestra en el resumen de horario cuando aplica y en el bloque «Horarios completos» bajo la lista de días.",
    },
    sectionD: {
      requiredNote:
        "Al menos una vía de contacto (sitio, teléfono, correo, redes, menú/archivo, etc.) para la vista previa mínima.",
      helper:
        "Los enlaces web se convierten en botones en la ficha. Menú URL abre la carta en el sitio del restaurante (vista previa: confirmación y luego pestaña nueva). Menú archivo se abre en un visor dentro de la vista previa (PDF/imagen). Si hay ambos, verás dos botones: menú en línea y carta en archivo; el bloque de contacto también puede repetir el archivo para descarga/visualización.",
      primaryContactHeader: "Contacto principal",
      websiteLabel: "Sitio web",
      websiteHelper: "Destino principal de tu marca; botón «Sitio web» en la fila de acciones.",
      phoneLabel: "Teléfono",
      phoneHelper: "Visible y usable para «Llamar»; se formateará automáticamente como (408) 555-1234.",
      whatsAppLabel: "WhatsApp (número)",
      whatsAppHelper: "Genera el botón de WhatsApp con el número en formato internacional.",
      emailLabel: "Correo",
      socialHeader: "Redes sociales",
      socialHelper: "Enlaces a perfiles; iconos de plataforma en la ficha solo cuando completes la URL.",
      instagramLabel: "Instagram (URL)",
      facebookLabel: "Facebook (URL)",
      tiktokLabel: "TikTok (URL)",
      youtubeLabel: "YouTube (URL)",
      snapchatLabel: "Snapchat (URL)",
      xTwitterLabel: "X / Twitter (URL)",
      reviewsHeader: "Opiniones / reputación",
      reviewsHelper: "Enlaces opcionales a reseñas públicas; solo aparecen en la ficha cuando los completes.",
      googleReviewsLabel: "Google reseñas o perfil",
      googleReviewsHelper:
        "Enlace a tu perfil de Google o reseñas públicas. Aparece como acceso de opiniones cuando lo completas.",
      yelpLabel: "Yelp",
      actionsHeader: "Acciones de restaurante",
      actionsHelper:
        "Enlaces de reservas, pedidos y menú. El archivo de menú se abre en visor dentro de la vista previa.",
      reservationLabel: "Reservas (URL)",
      reservationHelper: "Enlace directo a reservar. Botón «Reservar» si existe.",
      orderLabel: "Pedidos (URL)",
      orderHelper: "Donde el cliente ordena en línea. Botón «Ordenar» si existe.",
      menuUrlLabel: "Menú (URL)",
      menuUrlHelper: "Página pública donde está la carta en línea.",
      menuFileLabel: "Menú (archivo — vista previa local)",
      menuFileHelperPrefix: "PDF o imagen de la carta guardada en el borrador de sesión. Estado actual:",
      menuFileReady: "✅ Archivo aceptado y listo para vista previa",
      menuFileEmpty: "⭕ Sin archivo",
      menuFileUploadHelper: "PDF o imagen. Se guarda en el borrador de sesión.",
    },
    sectionE: {
      intro:
        "Esta dirección se usa para mostrar a los clientes dónde está tu restaurante y para generar el botón de mapa / direcciones en la ficha.",
      addressLine1Label: "Dirección / número y calle",
      addressLine1Helper: "Calle y número del local.",
      addressLine2Label: "Dirección línea 2",
      addressLine2Helper: "Suite, piso, edificio o indicaciones; opcional.",
      cityLabel: "Ciudad",
      cityHelper: "Sugerencias de ciudades de California cuando coinciden; puedes escribir cualquier ciudad.",
      cityPlaceholder: "Ej. San José, Portland, Austin…",
      stateLabel: "Estado / Región",
      stateHelper: "Estado, provincia o región donde opera el restaurante.",
      statePlaceholder: "Ej. California, Jalisco, Madrid…",
      zipLabel: "Código postal",
      zipHelper: "Código postal de 5 dígitos; se incluye en la dirección y en la búsqueda del mapa.",
      countryLabel: "País",
      countryHelper: "País donde opera el restaurante. Se usa para búsqueda y claridad para los clientes.",
      countryPlaceholder: "Ej. Estados Unidos, México, España…",
    },
    sectionF: {
      title: "F · Platos destacados (máx. 4)",
      titleSuffix: "(máx. 4)",
      intro:
        "Módulo propio en la ficha abierta (no es la galería G): vende el menú con foto + título + nota. En vista previa los dos primeros destacan; el resto se despliega con «Ver más platillos». El precio se muestra en formato USD limpio; el enlace es opcional por plato.",
      dishTitleLabel: "Título",
      dishTitleHelper: "Nombre del plato en el bloque «Platillos destacados».",
      dishNoteLabel: "Nota corta",
      dishNoteHelper: "Subtítulo bajo el título (ingredientes, estilo).",
      dishPriceLabel: "Precio / etiqueta",
      dishPriceHelper: "Número o texto; si es importe, la ficha lo formatea como USD (ej. 12 → $12.00).",
      dishMenuLinkLabel: "Enlace al menú",
      dishMenuLinkHelper: "Opcional: ancla a una sección del menú online si aplica.",
      dishImageLabel: "Imagen",
      dishImageHelper: "Foto del plato; sin foto el bloque igual muestra el título con marcador visual.",
      dishImageUploadHelper: "Foto del plato.",
    },
    sectionG: {
      disabledTitle: "Cupones y ofertas",
      dashboardAddonBody:
        "Agrega hasta 4 ofertas/cupones destacados a tu anuncio para atraer más clientes. Activa el módulo por $99/mes y luego podrás guardar tus ofertas.",
      upsellQuestion: "¿Quieres agregar cupones destacados a tu perfil?",
      upsellPrice: "$99/mes",
      upsellPriceNote:
        "Precio especial para restaurantes. Antes era $199/mes como producto independiente.",
      upsellBody:
        "Agrega hasta 4 cupones destacados dentro de tu perfil. Puedes promocionar combos, descuentos de temporada, especiales de almuerzo, catering o eventos. Los clientes podrán compartir el cupón por enlace, mensaje, email o apps compatibles.",
      addCouponsForPrice: "Agregar cupones por $99/mes",
      couponsEnabled: "Cupones activados — +$99/mes",
      enabledHelper:
        "Agrega hasta 4 ofertas para que los clientes tengan una razón clara para visitar, ordenar o compartir tu restaurante.",
      couponTitleLabel: "Título del cupón",
      couponTitleHelper: 'Ej. "2x1 en tacos", "10% de descuento", "Combo familiar"',
      couponDescriptionLabel: "Descripción",
      couponDescriptionHelper: "Describe la oferta, condiciones o restricciones.",
      couponCodeLabel: "Código de cupón",
      couponCodeHelper: "Código que el cliente debe mencionar o ingresar (si aplica).",
      couponCodePlaceholder: "Ej. LEONIX10",
      couponExpirationLabel: "Fecha de expiración",
      couponExpirationHelper: "Fecha límite de vigencia (si aplica).",
      couponRedemptionLabel: "Nota de canje",
      couponRedemptionHelper: "Ej. Menciona este cupón al ordenar.",
      couponImageLabel: "Imagen del cupón",
      couponImageHelper: "Sube una imagen del cupón o pega una URL.",
      flyerLabel: "Flyer de cupones o promociones",
      flyerHelper: "Sube o pega una imagen con más promociones. Se mostrará debajo de los cupones principales.",
      moreOffersUrlLabel: "Enlace para ver más ofertas",
      moreOffersUrlHelper: "URL externa donde los clientes pueden ver más cupones o promociones.",
      moreOffersUrlPlaceholder: "https://ejemplo.com/mas-cupones",
      moreOffersButtonLabel: "Texto del botón",
      moreOffersButtonHelper: 'Texto personalizado para el botón (por defecto: "Ver más cupones").',
      moreOffersButtonPlaceholder: "Ej. Ver menú con especiales",
      drawerTitle: "Qué incluye Cupones Destacados",
      drawerItem1: "Hasta 4 cupones principales dentro del perfil del restaurante",
      drawerItem2: "Campos para título, descripción, código, vencimiento y nota de canje",
      drawerItem3: "Opción para agregar flyer/imagen del cupón o promoción",
      drawerItem4: "Opción para agregar URL externa de cupón, menú, landing page o promoción",
      drawerItem5: "El cliente puede compartir el cupón por enlace, SMS/email/app share cuando esté disponible",
      drawerItem6: 'Los cupones aparecen debajo de "Especialidades de la Casa" en la ficha pública',
      drawerItem7: 'Los cupones llevan marca Leonix / "Publicado en Leonix" donde corresponda',
      drawerItem8: "Revisión final antes de publicación",
    },
    sectionH: {
      intro:
        "Hero = ancla visual superior de la ficha. Interiores / Comida / Exterior = grupos etiquetados en el detalle (no sustituyen a los platillos F). Usa Video opcional para hasta 4 enlaces externos (YouTube, TikTok, etc.).",
      heroLabel: "Foto principal (hero)",
      heroFallbackNote:
        "Si no subes hero, la primera imagen del orden en G (galería) actúa como portada en vista previa, resultados y publicación.",
      heroUploadHelper:
        "Clic o arrastra una imagen aquí. Miniatura en cuanto se guarde en el borrador de sesión.",
      logoLabel: "Logo del negocio",
      logoHelper:
        "Logo opcional que aparecerá como una pequeña insignia redonda sobre la imagen hero. Formato cuadrado recomendado. Se mostrará en la esquina superior izquierda de la imagen hero.",
      logoUploadHelper:
        "Clic o arrastra una imagen cuadrada aquí. El logo se mostrará como una insignia redonda.",
      logoAlt: "Logo del negocio",
    },
    sectionI: {
      intro:
        "Máximo 6 etiquetas en la ficha; aquí no puedes pasar de seis seleccionadas.",
    },
    sectionJ: {
      intro:
        "Opcional. No es obligatorio para publicar. Las opciones aparecen en la vista previa y en la ficha pública solo cuando marcas al menos una.",
    },
    sectionK: {
      intro:
        "Alcance de catering y comida para eventos. Aquí defines anticipación, dónde solicitar cotización y radio de servicio.",
      eventSizesLabel: "Tamaños de evento",
      eventSizesHelper: "Qué tamaños de grupo puedes atender.",
      bookingLeadTimeLabel: "Anticipación de reserva",
      bookingLeadTimeHelper: "Con cuánta anticipación deben contactarte (ej. «mín. 2 semanas»).",
      inquiryUrlLabel: "URL de solicitud",
      inquiryUrlHelper: "Formulario o página donde el cliente pide presupuesto.",
      cateringNoteLabel: "Nota",
      cateringNoteHelper:
        "Añade algo importante para eventos: mínimo de personas, montaje, cargos extra por distancia o condiciones especiales.",
      serviceRadiusLabel: "Radio de servicio (millas)",
      serviceRadiusHelper:
        "Distancia aproximada desde tu base de operación donde ofreces catering o servicio en sitio.",
    },
    sectionFinal: {
      title: "Final · Confirmación antes de la vista previa",
      titleSuffix: "antes de la vista previa",
      introNew:
        "Marca estas casillas antes de revisar tu anuncio. El pago se completa después de la vista previa.",
      introDashboard:
        "Guarda los cambios de tu restaurante aquí. No se volverá a cobrar el plan base. Usa la sección G para ofertas si tu módulo está activo.",
      confirmBusinessInfo:
        "Confirmo que la información del restaurante es veraz y actualizada.",
      confirmPhotosRepresent:
        "Confirmo que las fotos, platillos, horarios, ofertas y datos de contacto representan mi negocio correctamente.",
      confirmCommunityRules:
        "Confirmo que mi anuncio cumple con las reglas de Leonix y que soy responsable por la información publicada.",
      confirmCouponTerms:
        "Confirmo que los cupones y promociones son válidos, con fechas de expiración correctas y términos claros.",
      previewGateTitle: "Para habilitar Vista previa, completa lo siguiente:",
      previewGateMinFields: "Completa los campos mínimos requeridos",
      previewGateConfirmInfo: "Confirma que la información del restaurante es correcta",
      previewGateConfirmPhotos: "Confirma que las fotos y datos representan tu negocio",
      previewGateConfirmRules: "Confirma que cumples las reglas de Leonix",
      previewGateConfirmPromos: "Confirma que las promociones son válidas",
      preview: "Vista previa",
      continueToPreview: "Continuar a vista previa",
      deleteRequest: "Eliminar solicitud",
    },
  },
  en: {
    common: {
      selectPlaceholder: "Select…",
      dashPlaceholder: "—",
      recommended: "recommended",
      add: "Add",
      remove: "Remove",
      replace: "Replace",
      uploadImage: "Upload image",
      uploadLogo: "Upload logo",
      uploadFile: "Upload file",
      uploading: "Uploading...",
      processingImage: "Processing image...",
      processingHeroImage: "Processing hero image...",
      processingLogo: "Processing logo...",
      savedInDraft: "✅ Image saved in draft",
      logoSavedInDraft: "✅ Logo saved in draft",
      fileSavedInDraft: "✅ File saved in draft",
      dragDropImage: "Or drag and drop an image",
      pasteImageUrl: "Or paste image URL",
      closed: "Closed",
      back: "Back",
      next: "Next",
      close: "Close",
      delete: "Delete",
      ready: "✅ Ready",
      fileAccepted: "✅ File accepted",
      removeFile: "Remove file",
      removeImage: "Remove image",
      removeLogo: "Remove logo",
      seeMore: "See more",
      startingCheckout: "Starting checkout…",
      saving: "Saving…",
      backToDashboard: "Back to dashboard",
      addDish: "+ Add dish",
      addCoupon: "+ Add coupon",
      dishNumber: "Dish",
      couponNumber: "Coupon",
      removeLanguageAria: "Remove",
    },
    header: {
      loadingDraft: "Loading draft…",
      brand: "Leonix Classifieds",
      title: "Publish restaurant",
      intro:
        "Completed fields will appear in the preview. Empty fields will not be shown to the buyer.",
      draftNote:
        "Draft in this browser session: persists when navigating to preview, returning, and refreshing in the same tab; discarded when closing the tab or browser. Key ",
      draftNoteSuffix: " (session storage).",
    },
    dashboard: {
      addonModeMessage:
        "You are enabling coupons for an existing listing. Only the coupon module will be charged: $99/mo.",
      couponEditModeMessage: "You are editing coupons for an existing listing.",
      listingEditModeMessage:
        "You are editing your published restaurant listing. Save changes here — the base plan will not be charged again.",
      focusCouponMissingListingId:
        "This dashboard coupon flow requires a listing id. Open it from Dashboard → My listings.",
      saveOffers: "Save offers",
      saveRestaurantChanges: "Save restaurant changes",
      missingListingId: "Listing id is missing. Return to the dashboard and try again.",
      couponCheckoutFailed: "We could not start coupon module checkout.",
      enableOffersBeforeSave: "Enable the offers module before saving.",
      signInToSave: "Sign in to save changes.",
      imagesPrepareFailed: "We could not prepare images. Check your connection and try again.",
      saveChangesFailedRetry: "Could not save changes. Please try again.",
      saveChangesFailed: "Could not save changes.",
    },
    couponUpsell: {
      title: "Want to attract more customers with coupons?",
      body: "$99/month to show featured offers inside your restaurant ad. You can publish up to 4 main coupons and add a flyer or external link for more promotions.",
      addCoupons: "Add coupons",
      continueWithoutCoupons: "Continue without coupons",
    },
    sectionA: {
      intro:
        "This section defines how buyers recognize you in results and on the listing: name, cuisines, and canonical city anchor the ad.",
      businessNameLabel: "Business name",
      businessNameHelper: "Main title on the listing card and open listing page.",
      businessTypeLabel: "Business type",
      businessTypeHelper: "Business classification; helps filters and context on the listing.",
      businessTypeOtherLabel: "Specify type (Other)",
      businessTypeOtherPlaceholder: "e.g. specialized ghost kitchen",
      primaryCuisineLabel: "Primary cuisine",
      primaryCuisineHelper:
        "Main culinary identity: appears in the cuisine line under the hero title and feeds structured data for filters. One choice only.",
      secondaryCuisineLabel: "Secondary cuisine",
      secondaryCuisineHelper:
        "Optional second culinary identity: joins the primary on the same line under the title. Does not replace the primary. One choice only.",
      primaryCuisineOtherLabel: "Specify primary cuisine (Other)",
      primaryCuisineOtherHelper:
        "Short text buyers see where «Other» applies for primary cuisine.",
      primaryCuisineOtherPlaceholder: "e.g. Sichuan, Oaxaca, Indo-Mexican fusion…",
      secondaryCuisineOtherLabel: "Specify secondary cuisine (Other)",
      secondaryCuisineOtherHelper: "Complements the label when secondary is «Other».",
      secondaryCuisineOtherPlaceholder: "Brief description",
      additionalCuisinesLabel: "Additional cuisines",
      additionalCuisinesHelper:
        "Discovery support tags: on the listing they appear as «Disc.» chips below the primary/secondary line, not on that line. That is why all three exist: clear identity + selective tags. Choose up to 3. Canonical city and primary cuisine still anchor filters and results.",
      additionalCuisinesCountSuffix: "selected",
      additionalCuisinesOverCapWarning:
        "— You have more tags than recommended; uncheck down to 3 for a cleaner listing.",
      additionalCuisineOtherLabel: "Specify «Other» in additional cuisines",
      additionalCuisineOtherHelper: "One clear line; shown where the «Other» tag applies.",
      additionalCuisineOtherPlaceholder: "One line, e.g. Nikkei cuisine",
      aboutUsLabel: "About us",
      aboutUsHelper:
        "Tell customers about your story, atmosphere, specialties, or dining experience. Appears lower on the listing, not in the header.",
      neighborhoodLabel: "Restaurant area",
      neighborhoodHelper:
        "Free-text neighborhood or district: appears on the «Area» card in the quick-info strip, alongside the canonical city. Does not replace structured city or NorCal filters.",
      priceLevelLabel: "Price level",
      priceLevelHelper: "Quick reference on the listing when you complete it.",
      languagesLabel: "Languages",
      languagesHelper:
        "Languages your team can serve customers in person, by phone, or message — not a decorative list. Appears in the quick-info strip as a compact line. If you select Other, specify the language.",
      languageOtherLabel: "Specify language (Other)",
      languageOtherHelper: "Type the language and press Add. Up to 3 custom languages.",
      languageOtherPlaceholder: "e.g. Portuguese, ASL…",
    },
    sectionB: {
      serviceModesIntro:
        "Service modes are optional. A physical dine-in location is assumed by default. Use this section if you also offer catering/events, delivery, takeout, reservations, etc. Selection improves the listing but is not required for preview.",
      helper:
        "Check Catering & events if you need the extra section K. Use Available modes & services for service identity in data and preview.",
      cateringStackLabel: "Catering & events (stack K)",
      cateringCardTitle: "Catering & events",
      cateringCardBody: "Enable catering & events configuration.",
      cateringCheckbox: "Catering",
      eventFoodCheckbox: "Event food service",
      cateringConfigTitle: "Catering & events configuration",
      eventSizesLabel: "Event sizes",
      eventSizesHelper: "Event capacity you can serve.",
      cateringInquiryUrlLabel: "Catering inquiry URL",
      cateringInquiryUrlHelper: "Link for customers to request catering information.",
      serviceModesTitle: "Available modes & services",
      serviceModesBody:
        "One list for dine-in, takeout, delivery, pickup, reservations, catering, events, and more. At least one option for preview validation.",
      serviceModeOtherLabel: "Specify service mode (Other)",
      serviceModeOtherHelper:
        "Short text buyers see in the Service quick-info strip and as a «Mode: …» label when applicable; part of canonical identity like other selected modes.",
      serviceModeOtherPlaceholder: "e.g. fair sales, subscriptions only…",
      deliveryConfigTitle: "Delivery configuration",
      deliveryRadiusLabel: "Delivery radius (miles)",
      deliveryRadiusHelper:
        "Approximate range when you offer delivery. Leave blank if you do not deliver or prefer not to specify radius.",
    },
    sectionC: {
      requiredNote:
        "Complete each day (closed or hours) or explain the situation with the notes below — required for structural preview.",
      helper:
        "The weekly grid is the base on the listing. Notes do not replace hours unless you indicate so; they cover exceptions, holidays, or one-off changes shown next to the hours block.",
      specialHoursLabel: "Special hours note",
      specialHoursHelper:
        "Recurring or general notice (e.g. «closed holiday Mondays», «kitchen closes at 9 pm»): does not replace the weekly grid. Shown in the hours summary when applicable and in «Full hours» below the day list.",
    },
    sectionD: {
      requiredNote:
        "At least one contact method (website, phone, email, social, menu/file, etc.) for minimum preview.",
      helper:
        "Web links become buttons on the listing. Menu URL opens the menu on the restaurant site (preview: confirmation then new tab). Menu file opens in an in-preview viewer (PDF/image). If both exist, you will see two buttons: online menu and file menu; the contact block may also repeat the file for download/viewing.",
      primaryContactHeader: "Primary contact",
      websiteLabel: "Website",
      websiteHelper: "Main brand destination; «Website» button in the action row.",
      phoneLabel: "Phone",
      phoneHelper: "Visible and usable for «Call»; auto-formatted as (408) 555-1234.",
      whatsAppLabel: "WhatsApp (number)",
      whatsAppHelper: "Generates the WhatsApp button with the number in international format.",
      emailLabel: "Email",
      socialHeader: "Social media",
      socialHelper: "Profile links; platform icons on the listing only when you complete the URL.",
      instagramLabel: "Instagram (URL)",
      facebookLabel: "Facebook (URL)",
      tiktokLabel: "TikTok (URL)",
      youtubeLabel: "YouTube (URL)",
      snapchatLabel: "Snapchat (URL)",
      xTwitterLabel: "X / Twitter (URL)",
      reviewsHeader: "Reviews / reputation",
      reviewsHelper: "Optional public review links; appear on the listing only when completed.",
      googleReviewsLabel: "Google reviews or profile",
      googleReviewsHelper:
        "Link to your Google profile or public reviews. Appears as a reviews access when completed.",
      yelpLabel: "Yelp",
      actionsHeader: "Restaurant actions",
      actionsHelper:
        "Reservation, ordering, and menu links. Menu file opens in the in-preview viewer.",
      reservationLabel: "Reservations (URL)",
      reservationHelper: "Direct reservation link. «Reserve» button when present.",
      orderLabel: "Orders (URL)",
      orderHelper: "Where customers order online. «Order» button when present.",
      menuUrlLabel: "Menu (URL)",
      menuUrlHelper: "Public page where the online menu lives.",
      menuFileLabel: "Menu (file — local preview)",
      menuFileHelperPrefix: "PDF or image of the menu saved in the session draft. Current status:",
      menuFileReady: "✅ File accepted and ready for preview",
      menuFileEmpty: "⭕ No file",
      menuFileUploadHelper: "PDF or image. Saved in the session draft.",
    },
    sectionE: {
      intro:
        "This address shows customers where your restaurant is and generates the map / directions button on the listing.",
      addressLine1Label: "Address / street number and name",
      addressLine1Helper: "Street and building number.",
      addressLine2Label: "Address line 2",
      addressLine2Helper: "Suite, floor, building, or directions; optional.",
      cityLabel: "City",
      cityHelper: "California city suggestions when they match; you can type any city.",
      cityPlaceholder: "e.g. San Jose, Portland, Austin…",
      stateLabel: "State / Region",
      stateHelper: "State, province, or region where the restaurant operates.",
      statePlaceholder: "e.g. California, Jalisco, Madrid…",
      zipLabel: "ZIP / Postal code",
      zipHelper: "5-digit postal code; included in the address and map search.",
      countryLabel: "Country",
      countryHelper: "Country where the restaurant operates. Used for search and customer clarity.",
      countryPlaceholder: "e.g. United States, Mexico, Spain…",
    },
    sectionF: {
      title: "F · Featured dishes (max. 4)",
      titleSuffix: "(max. 4)",
      intro:
        "Its own module on the open listing (not gallery G): sell the menu with photo + title + note. In preview the first two stand out; the rest expand with «See more dishes». Price displays as clean USD; link is optional per dish.",
      dishTitleLabel: "Title",
      dishTitleHelper: "Dish name in the «Featured dishes» block.",
      dishNoteLabel: "Short note",
      dishNoteHelper: "Subtitle under the title (ingredients, style).",
      dishPriceLabel: "Price / label",
      dishPriceHelper: "Number or text; if an amount, the listing formats as USD (e.g. 12 → $12.00).",
      dishMenuLinkLabel: "Menu link",
      dishMenuLinkHelper: "Optional: anchor to an online menu section when applicable.",
      dishImageLabel: "Image",
      dishImageHelper: "Dish photo; without a photo the block still shows the title with a visual marker.",
      dishImageUploadHelper: "Dish photo.",
    },
    sectionG: {
      disabledTitle: "Coupons & offers",
      dashboardAddonBody:
        "Add up to 4 featured offers/coupons to your listing to attract more customers. Activate the module for $99/mo, then you can save your offers.",
      upsellQuestion: "Do you want to add featured coupons to your profile?",
      upsellPrice: "$99/month",
      upsellPriceNote:
        "Special price for restaurants. Previously $199/month as a standalone product.",
      upsellBody:
        "Add up to 4 featured coupons within your profile. You can promote combos, seasonal discounts, lunch specials, catering, or events. Customers will be able to share the coupon by link, message, email, or compatible apps.",
      addCouponsForPrice: "Add coupons for $99/month",
      couponsEnabled: "Coupons enabled — +$99/month",
      enabledHelper:
        "Add up to 4 offers so customers have a clear reason to visit, order, or share your restaurant.",
      couponTitleLabel: "Coupon title",
      couponTitleHelper: 'e.g. "2-for-1 tacos", "10% off", "Family combo"',
      couponDescriptionLabel: "Description",
      couponDescriptionHelper: "Describe the offer, conditions, or restrictions.",
      couponCodeLabel: "Coupon code",
      couponCodeHelper: "Code customers must mention or enter (if applicable).",
      couponCodePlaceholder: "e.g. LEONIX10",
      couponExpirationLabel: "Expiration date",
      couponExpirationHelper: "Expiration deadline (if applicable).",
      couponRedemptionLabel: "Redemption note",
      couponRedemptionHelper: "e.g. Mention this coupon when ordering.",
      couponImageLabel: "Coupon image",
      couponImageHelper: "Upload a coupon image or paste a URL.",
      flyerLabel: "Coupon or promotion flyer",
      flyerHelper: "Upload or paste an image with more promotions. Shown below the main coupons.",
      moreOffersUrlLabel: "Link for more offers",
      moreOffersUrlHelper: "External URL where customers can see more coupons or promotions.",
      moreOffersUrlPlaceholder: "https://example.com/more-coupons",
      moreOffersButtonLabel: "Button text",
      moreOffersButtonHelper: 'Custom button text (default: "See more coupons").',
      moreOffersButtonPlaceholder: "e.g. See menu with specials",
      drawerTitle: "What's included with Featured Coupons",
      drawerItem1: "Up to 4 main coupons within the restaurant profile",
      drawerItem2: "Fields for title, description, code, expiration, and redemption note",
      drawerItem3: "Option to add coupon flyer/image or promotion image",
      drawerItem4: "Option to add external URL for coupon, menu, landing page, or promotion",
      drawerItem5: "Customer can share coupon by link, SMS/email/app share when supported",
      drawerItem6: 'Coupons appear below "House Specialties" on the public profile',
      drawerItem7: 'Coupons carry Leonix branding / "Published on Leonix" where appropriate',
      drawerItem8: "Final review before publication",
    },
    sectionH: {
      intro:
        "Hero = top visual anchor of the listing. Interior / Food / Exterior = labeled groups in detail (do not replace dishes F). Use Optional video for up to 4 external links (YouTube, TikTok, etc.).",
      heroLabel: "Main photo (hero)",
      heroFallbackNote:
        "If you skip hero, the first image in gallery order (section G) acts as cover in preview, results, and publication.",
      heroUploadHelper: "Click or drag an image here. Thumbnail as soon as it is saved in the session draft.",
      logoLabel: "Business logo",
      logoHelper:
        "Optional logo shown as a small round badge over the hero image. Square format recommended. Shown in the top-left corner of the hero image.",
      logoUploadHelper: "Click or drag a square image here. Logo will show as a round badge.",
      logoAlt: "Business logo",
    },
    sectionI: {
      intro: "Maximum 6 tags on the listing; you cannot select more than six here.",
    },
    sectionJ: {
      intro:
        "Optional. Not required to publish. Options appear in preview and on the public listing only when you check at least one.",
    },
    sectionK: {
      intro:
        "Scope of catering and event food service. Here you define lead time, where to request a quote, and service radius.",
      eventSizesLabel: "Event sizes",
      eventSizesHelper: "What group sizes you can serve.",
      bookingLeadTimeLabel: "Booking lead time",
      bookingLeadTimeHelper: "How far in advance they should contact you (e.g. «min. 2 weeks»).",
      inquiryUrlLabel: "Inquiry URL",
      inquiryUrlHelper: "Form or page where customers request a quote.",
      cateringNoteLabel: "Note",
      cateringNoteHelper:
        "Add anything important for events: minimum guests, setup, extra distance fees, or special conditions.",
      serviceRadiusLabel: "Service radius (miles)",
      serviceRadiusHelper:
        "Approximate distance from your base where you offer catering or on-site service.",
    },
    sectionFinal: {
      title: "Final · Confirmation before preview",
      titleSuffix: "before preview",
      introNew:
        "Check these boxes before reviewing your ad. Payment is completed after the preview.",
      introDashboard:
        "Save your restaurant changes here. The base plan will not be charged again. Use section G for offers if your module is active.",
      confirmBusinessInfo:
        "I confirm that the restaurant information is truthful and up to date.",
      confirmPhotosRepresent:
        "I confirm that the photos, dishes, hours, offers, and contact details represent my business correctly.",
      confirmCommunityRules:
        "I confirm that my ad complies with Leonix rules and that I am responsible for the published information.",
      confirmCouponTerms:
        "I confirm that the coupons and promotions are valid, with correct expiration dates and clear terms.",
      previewGateTitle: "To enable Preview, complete the following:",
      previewGateMinFields: "Complete minimum required fields",
      previewGateConfirmInfo: "Confirm restaurant information is correct",
      previewGateConfirmPhotos: "Confirm photos and data represent your business",
      previewGateConfirmRules: "Confirm you comply with Leonix rules",
      previewGateConfirmPromos: "Confirm promotions are valid",
      preview: "Preview",
      continueToPreview: "Continue to preview",
      deleteRequest: "Delete request",
    },
  },
} as const;

export function restauranteApplicationFormCopy(lang: RestauranteAppUiLang) {
  return COPY[lang];
}
