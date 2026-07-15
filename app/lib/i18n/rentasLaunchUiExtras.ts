/**
 * Rentas PRIVATE launch-UI extras — merged under `LAUNCH_UI_DICTIONARIES[*].rentas`.
 * Do not export a separate LAUNCH_UI_DICTIONARIES root from this module.
 */

export type RentasLaunchUiExtras = {
  page: {
    postTitle: string;
    editTitle: string;
    brandKicker: string;
    introNew: string;
    introEdit: string;
    previewExplanation: string;
    draftDeviceOnly: string;
    draftCleared: string;
    publishedProtected: string;
    listingEdit: string;
    loadError: string;
    loadLoading: string;
    loadBlockedHint: string;
    publishedProtectedHint: string;
    sqftPreviewPrefix: string;
  };
  actions: {
    backToRentals: string;
    validatePreview: string;
    viewWithoutValidation: string;
    deleteDraft: string;
    confirmPreviewBlocked: string;
    cancelEdit: string;
    saveChanges: string;
    saving: string;
    tryAgain: string;
    signInRequired: string;
    couldNotSave: string;
    changesSaved: string;
    openPreviewTitle: string;
    deleteConfirmMessage: string;
  };
  publisher: {
    whoPosting: string;
    whoHint: string;
    ownerPrivate: string;
    agent: string;
    propertyManager: string;
    business: string;
  };
  category: {
    title: string;
    hint: string;
    residential: string;
    commercial: string;
    landLot: string;
  };
  media: {
    sectionTitle: string;
    intro: string;
    listingPhotos: string;
    uploadAdd: string;
    selectedCountTemplate: string;
    selectedWord: string;
    photoCardHint: string;
    videosByLink: string;
    videosHint: string;
    videoN: string;
    primaryVideoHint: string;
    recommendedPlatforms: string;
    invalidUrl: string;
    linksReady: string;
  };
  contact: {
    sectionTitle: string;
    intro: string;
    contactPhoto: string;
    uploadPhoto: string;
    removePhoto: string;
    fullName: string;
    phone: string;
    whatsapp: string;
    textNumber: string;
    textNumberHint: string;
    textNumberPlaceholder: string;
    email: string;
    messageOptional: string;
    messageHint: string;
  };
  channels: {
    section: string;
    websiteMoreInfo: string;
    ig: string;
    igHint: string;
    fb: string;
    fbHint: string;
    yt: string;
    ytHint: string;
    tt: string;
    ttHint: string;
    allowCalls: string;
    allowSms: string;
    showWhatsApp: string;
    preferredMethod: string;
    prefPhone: string;
    prefEmail: string;
    prefWhatsApp: string;
    prefSms: string;
    prefWeb: string;
    prefNone: string;
  };
  showings: {
    sectionTitle: string;
    optionalHint: string;
    byAppointment: string;
    byAppointmentHint: string;
    byAppointmentCheckbox: string;
    availability: string;
    availabilityHint: string;
    availabilityPlaceholder: string;
    instructions: string;
    instructionsHint: string;
    instructionsPlaceholder: string;
    virtualTour: string;
    virtualTourHint: string;
    invalidHttps: string;
  };
  residential: {
    sectionTitle: string;
    type: string;
    subtype: string;
    bedrooms: string;
    fullBaths: string;
    halfBaths: string;
    interior: string;
    lot: string;
    parking: string;
    yearBuilt: string;
    condition: string;
  };
  highlights: {
    highlightsHeading: string;
    piscina: string;
    cocinaRemodelada: string;
    electrodomesticosLujo: string;
    patio: string;
    balcon: string;
    vista: string;
    comunidadCerrada: string;
    techosAltos: string;
    cuartoPrincipalGrande: string;
    walkInCloset: string;
    oficinaEnCasa: string;
    panelesSolares: string;
    smartHome: string;
    chimenea: string;
    lavanderia: string;
    estacionamientoTechado: string;
    accesoControlado: string;
    elevador: string;
    terraza: string;
    gimnasio: string;
    amenidadesDesarrollo: string;
  };
  confirmations: {
    title: string;
    desc: string;
    accurate: string;
    photos: string;
    rules: string;
    rulesLink: string;
  };
  review: {
    finalReview: string;
    finalReviewHint: string;
    priceSummary: string;
    rentalListing: string;
    days30: string;
    total: string;
    paidActivationHint: string;
    preview: string;
    viewPreviewDraft: string;
    draftFooter: string;
  };
  photoStrip: {
    dragReorder: string;
    photoN: string;
    coverSuffix: string;
    coverActive: string;
    useAsCover: string;
    order: string;
    remove: string;
  };
  plazo: {
    "mes-a-mes": string;
    "6-meses": string;
    "12-meses": string;
    "1-ano": string;
    "2-anos": string;
    otro: string;
  };
  residentialTypes: {
    casa: string;
    condominio: string;
    townhome: string;
    apartamento: string;
    multifamiliar: string;
  };
  residentialSubtypes: {
    noAdditionalDetail: string;
    un_piso: string;
    dos_pisos: string;
    duplex: string;
    unidad: string;
    penthouse: string;
    planta_baja: string;
    adosado: string;
    esquina: string;
    elevador: string;
    vista: string;
    varias_unidades: string;
  };
  condition: {
    excelente: string;
    buena: string;
    regular: string;
    necesita_reparacion: string;
    emptyDash: string;
  };
  listingStatus: {
    disponible: string;
    pendiente: string;
    bajo_contrato: string;
    rentado: string;
  };
  commercialSection: {
    sectionTitle: string;
    type: string;
    subtype: string;
    use: string;
    interior: string;
    offices: string;
    baths: string;
    levels: string;
    zoning: string;
    parking: string;
    condition: string;
    loadingAccess: string;
    highlightsHeading: string;
  };
  landSection: {
    sectionTitle: string;
    type: string;
    subtype: string;
    lot: string;
    useZoning: string;
    access: string;
    utilities: string;
    topography: string;
    readyToBuild: string;
    fenced: string;
    highlightsHeading: string;
  };
  commercialTypes: {
    oficina: string;
    local: string;
    bodega: string;
    nave_industrial: string;
    uso_mixto: string;
    edificio_comercial: string;
  };
  commercialSubtypes: {
    noAdditionalDetail: string;
    planta_abierta: string;
    suite: string;
    piso_completo: string;
    frente_calle: string;
    interior_plaza: string;
    con_rampa: string;
    climatizada: string;
    muelle: string;
    altura_libre: string;
    pb_comercio: string;
    niveles_mixtos: string;
    torre: string;
    strip: string;
  };
  commercialHighlights: {
    recepcion: string;
    elevador: string;
    acceso_carga: string;
    alto_trafico: string;
    senalizacion: string;
    seguridad: string;
    listo_operar: string;
    oficinas_privadas: string;
    sala_juntas: string;
    area_almacen: string;
  };
  landTypes: {
    lote_residencial: string;
    lote_comercial: string;
    rancho: string;
    agricola: string;
    desarrollo: string;
  };
  landSubtypes: {
    noAdditionalDetail: string;
    esquina: string;
    cul_de_sac: string;
    frente_vial: string;
    con_casa: string;
    pastizal: string;
    riegos: string;
    secano: string;
    urbanizable: string;
    master_plan: string;
  };
  landHighlights: {
    pozo: string;
    arboles: string;
    arboles_frutales: string;
    vista: string;
    acceso_pavimentado: string;
    cercado: string;
    destacado_agricola: string;
    destacado_comercial: string;
    listo_construir: string;
    cerca_servicios: string;
  };
  tipoFlow: {
    yes: string;
    no: string;
    inListingPrefix: string;
    bathroomType: string;
    bathroomPrivate: string;
    bathroomShared: string;
    bathroomNotIncluded: string;
    kitchen: string;
    kitchenPrivate: string;
    kitchenShared: string;
    kitchenNotIncluded: string;
    privateEntrance: string;
    laundryAvailable: string;
    maxOccupants: string;
    maxOccupantsHint: string;
    sharedSpacePreferences: string;
    sharedSpacePreferencesHint: string;
    sharedSpacePreferencesPlaceholder: string;
    approximateSize: string;
    approximateSizeHint: string;
    access24h: string;
    electricityAvailable: string;
    securityControlled: string;
    permittedUse: string;
    heightDimensions: string;
    heightDimensionsHint: string;
    sizeSqft: string;
    sizeSqftHint: string;
    restroomAvailable: string;
    hoursAccess: string;
    minimumContract: string;
    minimumContractPlaceholder: string;
    availableUtilities: string;
    access: string;
    zoning: string;
    zoningHint: string;
  };
};

const es: RentasLaunchUiExtras = {
  page: {
    postTitle: "Publicar renta",
    editTitle: "Editar anuncio de renta",
    brandKicker: "Leonix · Rentas",
    introNew: "La vista previa solo muestra lo que llenes. El borrador vive en esta sesión del navegador (misma pestaña).",
    introEdit: "Estás editando un espacio aislado. Tu anuncio publicado solo cambia al usar Guardar cambios.",
    previewExplanation:
      "Validar y ver vista previa exige las confirmaciones del final y los requisitos mínimos; si pasan, abre tu anuncio de prueba. Ver vista previa (sin validar) guarda el borrador y abre al instante (útil mientras terminas campos opcionales).",
    draftDeviceOnly: "Borrador guardado solo en este dispositivo.",
    draftCleared: "Borrador eliminado. Puedes empezar de nuevo.",
    publishedProtected: "Anuncio publicado protegido",
    listingEdit: "Edición de anuncio",
    loadError: "No pudimos cargar el anuncio publicado",
    loadLoading: "Cargando tu anuncio publicado...",
    loadBlockedHint:
      "La edición permanece bloqueada hasta cargar el anuncio original. No se ha guardado ningún cambio en tu anuncio publicado.",
    publishedProtectedHint:
      "Cancelar descarta solo este espacio de edición. Guardar cambios actualiza el mismo anuncio sin Stripe, duplicados ni cambios al vencimiento.",
    sqftPreviewPrefix: "Vista previa:",
  },
  actions: {
    backToRentals: "Volver a Rentas",
    validatePreview: "Validar y ver vista previa",
    viewWithoutValidation: "Ver vista previa (sin validar)",
    deleteDraft: "Eliminar borrador",
    confirmPreviewBlocked:
      "Marca las tres confirmaciones al final del formulario para usar Vista previa con validación.",
    cancelEdit: "Cancelar edición",
    saveChanges: "Guardar cambios",
    saving: "Guardando...",
    tryAgain: "Intentar de nuevo",
    signInRequired: "Inicia sesión para guardar.",
    couldNotSave: "No se pudieron guardar los cambios.",
    changesSaved: "Cambios guardados. Se conservaron la identidad y vencimiento del anuncio.",
    openPreviewTitle:
      "Abre la vista previa enseguida con el borrador guardado en esta pestaña. No exige las confirmaciones del final ni todos los campos mínimos.",
    deleteConfirmMessage: "¿Eliminar el borrador de esta solicitud y empezar de nuevo?",
  },
  publisher: {
    whoPosting: "¿Quién publica esta renta?",
    whoHint: "Usaremos esto solo para mostrar mejor quién ofrece la renta. El formulario y el precio son los mismos.",
    ownerPrivate: "Dueño / particular",
    agent: "Agente",
    propertyManager: "Administrador de propiedad",
    business: "Negocio",
  },
  category: {
    title: "Categoría",
    hint: "Elige una; los demás campos se adaptan en el formulario y en la vista previa.",
    residential: "Residencial",
    commercial: "Comercial",
    landLot: "Terreno / lote",
  },
  media: {
    sectionTitle: "Fotos y video",
    intro:
      "Hasta 8 fotos (se comprimen en el navegador). Para una vista previa completa hace falta al menos una foto. Los videos se agregan como enlaces externos (hasta 4); no se suben archivos de video en esta versión de lanzamiento. Nada se sube a servidores en este paso; el borrador vive en esta sesión hasta que exista publicación.",
    listingPhotos: "Fotos del anuncio",
    uploadAdd: "Subir o añadir fotos",
    selectedCountTemplate: "{count}/{max} {selectedWord}",
    selectedWord: "seleccionadas",
    photoCardHint:
      "Cada foto es una tarjeta con vista previa. Usa el control ⋮⋮ Orden para arrastrar y reordenar. La portada puede ser distinta del primer casillero.",
    videosByLink: "Videos por enlace (opcional)",
    videosHint:
      "Puedes agregar hasta 4 enlaces externos. No subas archivos de video aquí; Leonix guardará los enlaces y mostrará el primero en la galería cuando el navegador pueda reproducirlo.",
    videoN: "Video {n}",
    primaryVideoHint: "El primer enlace es el principal para la vista previa y la salida publicada.",
    recommendedPlatforms: "Recomendado: YouTube, TikTok, Instagram, Facebook, Vimeo o un MP4 público.",
    invalidUrl: "Usa una URL completa que empiece con http:// o https://.",
    linksReady:
      "Enlaces listos: se guardarán en el borrador y en la publicación. Los navegadores pueden mostrar algunos como enlace en lugar de reproductor.",
  },
  contact: {
    sectionTitle: "Información de contacto",
    intro:
      "Tu nombre y cómo quieres que te contacten. Para vista previa: nombre y al menos un medio de contacto (teléfono, WhatsApp, mensajes de texto o correo).",
    contactPhoto: "Foto de contacto (opcional)",
    uploadPhoto: "Subir foto",
    removePhoto: "Quitar foto",
    fullName: "Nombre completo",
    phone: "Teléfono",
    whatsapp: "WhatsApp",
    textNumber: "Número para mensajes de texto",
    textNumberHint: "Puede ser el mismo número de teléfono o uno diferente.",
    textNumberPlaceholder: "Puede ser el mismo número de teléfono o uno diferente.",
    email: "Correo electrónico",
    messageOptional: "Mensaje para interesados (opcional)",
    messageHint: "Texto breve que verán antes de escribirte o llamarte.",
  },
  channels: {
    section: "Más formas de contacto",
    websiteMoreInfo: "Sitio web / Más información",
    ig: "Instagram",
    igHint: "@usuario o https://instagram.com/usuario",
    fb: "Facebook",
    fbHint: "https://facebook.com/tu-pagina",
    yt: "YouTube",
    ytHint: "https://youtube.com/@tu-canal",
    tt: "TikTok",
    ttHint: "@usuario o https://tiktok.com/@usuario",
    allowCalls: "Permitir llamadas",
    allowSms: "Permitir mensajes de texto (SMS)",
    showWhatsApp: "Mostrar WhatsApp",
    preferredMethod: "Método de contacto preferido (opcional)",
    prefPhone: "Teléfono",
    prefEmail: "Correo",
    prefWhatsApp: "WhatsApp",
    prefSms: "SMS",
    prefWeb: "Sitio web",
    prefNone: "Sin preferencia",
  },
  showings: {
    sectionTitle: "Visitas y recorridos",
    optionalHint: "Opcional. Si completas algún campo, aparecerá en la vista previa y en el anuncio publicado.",
    byAppointment: "Visitas con cita",
    byAppointmentHint: "Indica si las visitas son solo con cita previa.",
    byAppointmentCheckbox: "Las visitas son con cita previa",
    availability: "Disponibilidad para visitas",
    availabilityHint: "Horarios o días en que puedes mostrar el espacio (opcional).",
    availabilityPlaceholder: "Ej. Lun–vie 10:00–18:00, sábados con cita",
    instructions: "Instrucciones para visitas",
    instructionsHint: "Cómo coordinar la visita, acceso, estacionamiento, etc. (opcional).",
    instructionsPlaceholder: "Ej. Enviar mensaje con 24 h de anticipación; tocar timbre 2.",
    virtualTour: "Tour virtual (enlace HTTPS)",
    virtualTourHint: "Solo enlaces https seguros (Matterport, YouTube, etc.). Opcional.",
    invalidHttps: "Si el enlace no es válido, no se mostrará en el anuncio.",
  },
  residential: {
    sectionTitle: "Detalle residencial",
    type: "Tipo",
    subtype: "Subtipo",
    bedrooms: "Recámaras",
    fullBaths: "Baños completos",
    halfBaths: "Medios baños",
    interior: "Interior (ft²)",
    lot: "Lote (ft²)",
    parking: "Estacionamiento",
    yearBuilt: "Año de construcción",
    condition: "Condición",
  },
  highlights: {
    highlightsHeading: "Amenidades / destacados",
    piscina: "Alberca / piscina",
    cocinaRemodelada: "Cocina remodelada",
    electrodomesticosLujo: "Electrodomésticos de lujo",
    patio: "Patio",
    balcon: "Balcón",
    vista: "Vista",
    comunidadCerrada: "Comunidad cerrada",
    techosAltos: "Techos altos",
    cuartoPrincipalGrande: "Recámara principal amplia",
    walkInCloset: "Walk-in closet",
    oficinaEnCasa: "Oficina en casa",
    panelesSolares: "Paneles solares",
    smartHome: "Smart home",
    chimenea: "Chimenea",
    lavanderia: "Lavandería",
    estacionamientoTechado: "Estacionamiento techado",
    accesoControlado: "Acceso controlado",
    elevador: "Elevador",
    terraza: "Terraza",
    gimnasio: "Gimnasio",
    amenidadesDesarrollo: "Amenidades del desarrollo",
  },
  confirmations: {
    title: "Confirmación antes de publicar",
    desc: "Estas casillas ayudan a mantener Leonix claro y confiable para todos.",
    accurate: "Confirmo que la información de la propiedad es veraz y actualizada.",
    photos: "Confirmo que las fotos muestran la propiedad real que estoy publicando.",
    rules: "Confirmo que mi anuncio respeta las reglas de la comunidad y del marketplace.",
    rulesLink: "Ver reglas de Leonix",
  },
  review: {
    finalReview: "Revisión final",
    finalReviewHint: "Cuando tu contenido esté listo, usa los botones de abajo para abrir la vista previa o iniciar la publicación.",
    priceSummary: "Resumen de precios",
    rentalListing: "Anuncio de renta",
    days30: "días",
    total: "Total",
    paidActivationHint: "La activación del anuncio pagado ocurre después del pago seguro.",
    preview: "Vista previa",
    viewPreviewDraft: "Ver vista previa (borrador)",
    draftFooter: "Borrador guardado solo en este dispositivo.",
  },
  photoStrip: {
    dragReorder: "Arrastrar para reordenar foto",
    photoN: "Foto {n}",
    coverSuffix: " · Portada",
    coverActive: "Portada activa",
    useAsCover: "Usar como portada",
    order: "Orden",
    remove: "Quitar",
  },
  plazo: {
    "mes-a-mes": "Mes a mes",
    "6-meses": "6 meses",
    "12-meses": "12 meses",
    "1-ano": "1 año",
    "2-anos": "2 años",
    otro: "Otro",
  },
  residentialTypes: {
    casa: "Casa",
    condominio: "Condominio",
    townhome: "Townhome",
    apartamento: "Apartamento",
    multifamiliar: "Multifamiliar",
  },
  residentialSubtypes: {
    noAdditionalDetail: "— Sin detalle adicional",
    un_piso: "Un solo piso",
    dos_pisos: "Dos pisos",
    duplex: "Dúplex / pareado",
    unidad: "Unidad en condominio",
    penthouse: "Penthouse",
    planta_baja: "Planta baja",
    adosado: "Adosado",
    esquina: "En esquina",
    elevador: "Con elevador",
    vista: "Con vista",
    varias_unidades: "Varias unidades en el sitio",
  },
  condition: {
    excelente: "Excelente",
    buena: "Buena",
    regular: "Regular",
    necesita_reparacion: "Necesita reparación",
    emptyDash: "—",
  },
  listingStatus: {
    disponible: "Disponible",
    pendiente: "Pendiente",
    bajo_contrato: "Bajo contrato",
    rentado: "Rentado",
  },
  commercialSection: {
    sectionTitle: "Detalle comercial",
    type: "Tipo comercial",
    subtype: "Subtipo",
    use: "Uso",
    interior: "Interior (ft²)",
    offices: "Oficinas",
    baths: "Baños",
    levels: "Niveles",
    zoning: "Zonificación",
    parking: "Estacionamiento",
    condition: "Condición",
    loadingAccess: "Acceso de carga",
    highlightsHeading: "Destacados",
  },
  landSection: {
    sectionTitle: "Detalle terreno / lote",
    type: "Tipo",
    subtype: "Subtipo",
    lot: "Lote (ft²)",
    useZoning: "Uso / zonificación",
    access: "Acceso",
    utilities: "Servicios",
    topography: "Topografía",
    readyToBuild: "Listo para construir",
    fenced: "Cercado",
    highlightsHeading: "Destacados",
  },
  commercialTypes: {
    oficina: "Oficina",
    local: "Local",
    bodega: "Bodega",
    nave_industrial: "Nave industrial",
    uso_mixto: "Uso mixto",
    edificio_comercial: "Edificio comercial",
  },
  commercialSubtypes: {
    noAdditionalDetail: "— Sin detalle adicional",
    planta_abierta: "Planta abierta",
    suite: "Suite",
    piso_completo: "Piso completo",
    frente_calle: "Frente a calle",
    interior_plaza: "Interior de plaza",
    con_rampa: "Con rampa / andén",
    climatizada: "Climatizada",
    muelle: "Muelle de carga",
    altura_libre: "Altura libre elevada",
    pb_comercio: "Planta baja comercio",
    niveles_mixtos: "Niveles mixtos",
    torre: "Torre",
    strip: "Strip center",
  },
  commercialHighlights: {
    recepcion: "Recepción",
    elevador: "Elevador",
    acceso_carga: "Acceso de carga",
    alto_trafico: "Alto tráfico",
    senalizacion: "Señalización",
    seguridad: "Seguridad",
    listo_operar: "Listo para operar",
    oficinas_privadas: "Oficinas privadas",
    sala_juntas: "Sala de juntas",
    area_almacen: "Área de almacén",
  },
  landTypes: {
    lote_residencial: "Lote residencial",
    lote_comercial: "Lote comercial",
    rancho: "Rancho",
    agricola: "Terreno agrícola",
    desarrollo: "Terreno para desarrollo",
  },
  landSubtypes: {
    noAdditionalDetail: "— Sin detalle adicional",
    esquina: "En esquina",
    cul_de_sac: "Calle sin salida",
    frente_vial: "Frente a vialidad",
    con_casa: "Con vivienda",
    pastizal: "Pastizal",
    riegos: "Con riego",
    secano: "Secano",
    urbanizable: "Urbanizable",
    master_plan: "En master plan",
  },
  landHighlights: {
    pozo: "Pozo",
    arboles: "Árboles",
    arboles_frutales: "Árboles frutales",
    vista: "Vista",
    acceso_pavimentado: "Acceso pavimentado",
    cercado: "Cercado",
    destacado_agricola: "Agrícola",
    destacado_comercial: "Uso comercial viable",
    listo_construir: "Listo para construir",
    cerca_servicios: "Cerca de servicios",
  },
  tipoFlow: {
    yes: "Sí",
    no: "No",
    inListingPrefix: "En el anuncio: ",
    bathroomType: "Tipo de baño",
    bathroomPrivate: "Privado",
    bathroomShared: "Compartido",
    bathroomNotIncluded: "No incluido",
    kitchen: "Cocina",
    kitchenPrivate: "Privada",
    kitchenShared: "Compartida",
    kitchenNotIncluded: "No incluida",
    privateEntrance: "Entrada privada",
    laundryAvailable: "Lavandería disponible",
    maxOccupants: "Máximo de ocupantes",
    maxOccupantsHint: "Solo números.",
    sharedSpacePreferences: "Preferencias del espacio compartido",
    sharedSpacePreferencesHint:
      "Opcional. Agrega detalles importantes para convivencia, reglas del hogar o preferencias razonables para el espacio.",
    sharedSpacePreferencesPlaceholder:
      "Ej. ambiente tranquilo, no fumar, horario de descanso, preferencia para una persona, etc.",
    approximateSize: "Tamaño aproximado",
    approximateSizeHint: "Texto libre o medidas (ej. 12 × 24 ft).",
    access24h: "Acceso 24/7",
    electricityAvailable: "Electricidad disponible",
    securityControlled: "Seguridad / acceso controlado",
    permittedUse: "Uso permitido",
    heightDimensions: "Altura / dimensiones",
    heightDimensionsHint: "Si aplica (puerta, techo, van accessible…).",
    sizeSqft: "Tamaño (ft²)",
    sizeSqftHint: "Solo números (pies cuadrados aproximados).",
    restroomAvailable: "Baño disponible",
    hoursAccess: "Horario / acceso",
    minimumContract: "Contrato mínimo",
    minimumContractPlaceholder: "Ej. 1 año, 6 meses renovable…",
    availableUtilities: "Servicios disponibles",
    access: "Acceso",
    zoning: "Zonificación",
    zoningHint: "Si aplica.",
  },
};

const en: RentasLaunchUiExtras = {
  page: {
    postTitle: "Post a rental",
    editTitle: "Edit rental listing",
    brandKicker: "Leonix · Rentals",
    introNew: "The preview only shows what you fill in. The draft lives in this browser session (same tab).",
    introEdit: "You are editing an isolated workspace. Your published listing changes only after Save changes.",
    previewExplanation:
      "Validate and preview requires the final confirmations and minimum requirements; if they pass, opens your test listing. View preview (without validation) saves the draft and opens instantly (useful while you finish optional fields).",
    draftDeviceOnly: "Draft saved only on this device.",
    draftCleared: "Draft cleared. You can start over.",
    publishedProtected: "Published listing protected",
    listingEdit: "Listing edit",
    loadError: "We could not load the published listing",
    loadLoading: "Loading your published listing...",
    loadBlockedHint:
      "Editing stays blocked until the original listing snapshot is loaded. No changes have been saved to your published listing.",
    publishedProtectedHint:
      "Cancel discards only this edit workspace. Save changes updates the same listing without Stripe, duplicate rows, or expiration changes.",
    sqftPreviewPrefix: "Preview:",
  },
  actions: {
    backToRentals: "Back to Rentals",
    validatePreview: "Validate and preview",
    viewWithoutValidation: "View preview (without validation)",
    deleteDraft: "Delete draft",
    confirmPreviewBlocked: "Check all three confirmations at the bottom to use validated preview.",
    cancelEdit: "Cancel edit",
    saveChanges: "Save changes",
    saving: "Saving...",
    tryAgain: "Try again",
    signInRequired: "Sign in required.",
    couldNotSave: "Could not save changes.",
    changesSaved: "Changes saved. Your listing identity and expiration were preserved.",
    openPreviewTitle:
      "Opens preview immediately with the draft saved in this tab. Does not require final confirmations or all minimum fields.",
    deleteConfirmMessage: "Delete this application draft and start over?",
  },
  publisher: {
    whoPosting: "Who is posting this rental?",
    whoHint: "We use this only to describe who is offering the rental. The form and price stay the same.",
    ownerPrivate: "Owner / private person",
    agent: "Agent",
    propertyManager: "Property manager",
    business: "Business",
  },
  category: {
    title: "Category",
    hint: "Choose one; the other fields adapt in the form and preview.",
    residential: "Residential",
    commercial: "Commercial",
    landLot: "Land / lot",
  },
  media: {
    sectionTitle: "Photos and video",
    intro:
      "Up to 8 photos (compressed in the browser). A complete preview needs at least one photo. Videos are added as external links (up to 4); video files are not uploaded in this launch version. Nothing is uploaded to servers in this step; the draft lives in this session until publishing exists.",
    listingPhotos: "Listing photos",
    uploadAdd: "Upload or add photos",
    selectedCountTemplate: "{count}/{max} {selectedWord}",
    selectedWord: "selected",
    photoCardHint:
      "Each photo is a card with a preview. Use the ⋮⋮ Order control to drag and reorder. The cover can be different from the first slot.",
    videosByLink: "Videos by link (optional)",
    videosHint:
      "You can add up to 4 external links. Do not upload video files here; Leonix will save the links and show the first one in the gallery when the browser can play it.",
    videoN: "Video {n}",
    primaryVideoHint: "The first link is the primary one for preview and the published listing.",
    recommendedPlatforms: "Recommended: YouTube, TikTok, Instagram, Facebook, Vimeo, or a public MP4.",
    invalidUrl: "Use a full URL that starts with http:// or https://.",
    linksReady:
      "Links ready: they will be saved in the draft and on publish. Browsers may show some as a link instead of a player.",
  },
  contact: {
    sectionTitle: "Contact information",
    intro:
      "Your name and how you want to be contacted. For preview: name and at least one contact method (phone, WhatsApp, text messages, or email).",
    contactPhoto: "Contact photo (optional)",
    uploadPhoto: "Upload photo",
    removePhoto: "Remove photo",
    fullName: "Full name",
    phone: "Phone",
    whatsapp: "WhatsApp",
    textNumber: "Text message number",
    textNumberHint: "Can be the same phone number or a different one.",
    textNumberPlaceholder: "Can be the same phone number or a different one.",
    email: "Email",
    messageOptional: "Message for interested parties (optional)",
    messageHint: "Brief text they will see before messaging or calling you.",
  },
  channels: {
    section: "More contact options",
    websiteMoreInfo: "Website / more information",
    ig: "Instagram",
    igHint: "@handle or https://instagram.com/handle",
    fb: "Facebook",
    fbHint: "https://facebook.com/your-page",
    yt: "YouTube",
    ytHint: "https://youtube.com/@your-channel",
    tt: "TikTok",
    ttHint: "@handle or https://tiktok.com/@handle",
    allowCalls: "Allow calls",
    allowSms: "Allow SMS / text messages",
    showWhatsApp: "Show WhatsApp",
    preferredMethod: "Preferred contact method (optional)",
    prefPhone: "Phone",
    prefEmail: "Email",
    prefWhatsApp: "WhatsApp",
    prefSms: "SMS",
    prefWeb: "Website",
    prefNone: "No preference",
  },
  showings: {
    sectionTitle: "Showings and tours",
    optionalHint: "Optional. If you fill any field, it will appear in preview and the published listing.",
    byAppointment: "Showings by appointment",
    byAppointmentHint: "Indicate if visits are by appointment only.",
    byAppointmentCheckbox: "Visits are by appointment only",
    availability: "Showing availability",
    availabilityHint: "Hours or days you can show the space (optional).",
    availabilityPlaceholder: "E.g. Mon–Fri 10:00–18:00, Saturdays by appointment",
    instructions: "Showing instructions",
    instructionsHint: "How to coordinate the visit, access, parking, etc. (optional).",
    instructionsPlaceholder: "E.g. Send message with 24h notice; ring bell 2.",
    virtualTour: "Virtual tour (HTTPS link)",
    virtualTourHint: "Only secure https links (Matterport, YouTube, etc.). Optional.",
    invalidHttps: "If the link is not valid, it will not be shown in the listing.",
  },
  residential: {
    sectionTitle: "Residential details",
    type: "Type",
    subtype: "Subtype",
    bedrooms: "Bedrooms",
    fullBaths: "Full bathrooms",
    halfBaths: "Half bathrooms",
    interior: "Interior (ft²)",
    lot: "Lot (ft²)",
    parking: "Parking",
    yearBuilt: "Year built",
    condition: "Condition",
  },
  highlights: {
    highlightsHeading: "Amenities / highlights",
    piscina: "Pool",
    cocinaRemodelada: "Remodeled kitchen",
    electrodomesticosLujo: "Luxury appliances",
    patio: "Patio",
    balcon: "Balcony",
    vista: "View",
    comunidadCerrada: "Gated community",
    techosAltos: "High ceilings",
    cuartoPrincipalGrande: "Large primary bedroom",
    walkInCloset: "Walk-in closet",
    oficinaEnCasa: "Home office",
    panelesSolares: "Solar panels",
    smartHome: "Smart home",
    chimenea: "Fireplace",
    lavanderia: "Laundry",
    estacionamientoTechado: "Covered parking",
    accesoControlado: "Controlled access",
    elevador: "Elevator",
    terraza: "Terrace",
    gimnasio: "Gym",
    amenidadesDesarrollo: "Development amenities",
  },
  confirmations: {
    title: "Confirmation before posting",
    desc: "These checks help keep Leonix clear and trustworthy for everyone.",
    accurate: "I confirm the property information is accurate and up to date.",
    photos: "I confirm the photos show the actual property I’m listing.",
    rules: "I confirm this listing follows community and marketplace rules.",
    rulesLink: "View Leonix rules",
  },
  review: {
    finalReview: "Final review",
    finalReviewHint: "When your content is ready, use the buttons below to open the preview or start publishing.",
    priceSummary: "Price summary",
    rentalListing: "Rental listing",
    days30: "days",
    total: "Total",
    paidActivationHint: "Paid listing activation happens after secure payment.",
    preview: "Preview",
    viewPreviewDraft: "View preview (draft)",
    draftFooter: "Draft saved only on this device.",
  },
  photoStrip: {
    dragReorder: "Drag to reorder photo",
    photoN: "Photo {n}",
    coverSuffix: " · Cover",
    coverActive: "Cover active",
    useAsCover: "Use as cover",
    order: "Order",
    remove: "Remove",
  },
  plazo: {
    "mes-a-mes": "Month to month",
    "6-meses": "6 months",
    "12-meses": "12 months",
    "1-ano": "1 year",
    "2-anos": "2 years",
    otro: "Other",
  },
  residentialTypes: {
    casa: "House",
    condominio: "Condominium",
    townhome: "Townhome",
    apartamento: "Apartment",
    multifamiliar: "Multifamily",
  },
  residentialSubtypes: {
    noAdditionalDetail: "— No additional detail",
    un_piso: "Single story",
    dos_pisos: "Two stories",
    duplex: "Duplex / two units",
    unidad: "Condo unit",
    penthouse: "Penthouse",
    planta_baja: "Ground floor",
    adosado: "Attached",
    esquina: "Corner lot",
    elevador: "With elevator",
    vista: "With view",
    varias_unidades: "Multiple units on site",
  },
  condition: {
    excelente: "Excellent",
    buena: "Good",
    regular: "Fair",
    necesita_reparacion: "Needs repair",
    emptyDash: "—",
  },
  listingStatus: {
    disponible: "Available",
    pendiente: "Pending",
    bajo_contrato: "Under contract",
    rentado: "Rented",
  },
  commercialSection: {
    sectionTitle: "Commercial details",
    type: "Commercial type",
    subtype: "Subtype",
    use: "Use",
    interior: "Interior (ft²)",
    offices: "Offices",
    baths: "Bathrooms",
    levels: "Levels",
    zoning: "Zoning",
    parking: "Parking",
    condition: "Condition",
    loadingAccess: "Loading access",
    highlightsHeading: "Highlights",
  },
  landSection: {
    sectionTitle: "Land / lot details",
    type: "Type",
    subtype: "Subtype",
    lot: "Lot (ft²)",
    useZoning: "Use / zoning",
    access: "Access",
    utilities: "Utilities",
    topography: "Topography",
    readyToBuild: "Ready to build",
    fenced: "Fenced",
    highlightsHeading: "Highlights",
  },
  commercialTypes: {
    oficina: "Office",
    local: "Retail space",
    bodega: "Warehouse",
    nave_industrial: "Industrial building",
    uso_mixto: "Mixed use",
    edificio_comercial: "Commercial building",
  },
  commercialSubtypes: {
    noAdditionalDetail: "— No additional detail",
    planta_abierta: "Open plan",
    suite: "Suite",
    piso_completo: "Full floor",
    frente_calle: "Street frontage",
    interior_plaza: "In plaza",
    con_rampa: "With ramp / dock",
    climatizada: "Climate-controlled",
    muelle: "Loading dock",
    altura_libre: "High clearance",
    pb_comercio: "Ground-floor retail",
    niveles_mixtos: "Mixed levels",
    torre: "Tower",
    strip: "Strip center",
  },
  commercialHighlights: {
    recepcion: "Reception",
    elevador: "Elevator",
    acceso_carga: "Loading access",
    alto_trafico: "High foot traffic",
    senalizacion: "Signage",
    seguridad: "Security",
    listo_operar: "Move-in ready",
    oficinas_privadas: "Private offices",
    sala_juntas: "Conference room",
    area_almacen: "Storage area",
  },
  landTypes: {
    lote_residencial: "Residential lot",
    lote_comercial: "Commercial lot",
    rancho: "Ranch",
    agricola: "Agricultural land",
    desarrollo: "Development land",
  },
  landSubtypes: {
    noAdditionalDetail: "— No additional detail",
    esquina: "Corner lot",
    cul_de_sac: "Cul-de-sac",
    frente_vial: "Road frontage",
    con_casa: "With dwelling",
    pastizal: "Pasture",
    riegos: "Irrigated",
    secano: "Dryland",
    urbanizable: "Urbanizable",
    master_plan: "In master plan",
  },
  landHighlights: {
    pozo: "Well",
    arboles: "Trees",
    arboles_frutales: "Fruit trees",
    vista: "View",
    acceso_pavimentado: "Paved access",
    cercado: "Fenced",
    destacado_agricola: "Agricultural",
    destacado_comercial: "Commercial potential",
    listo_construir: "Ready to build",
    cerca_servicios: "Near utilities / services",
  },
  tipoFlow: {
    yes: "Yes",
    no: "No",
    inListingPrefix: "In listing: ",
    bathroomType: "Bathroom type",
    bathroomPrivate: "Private",
    bathroomShared: "Shared",
    bathroomNotIncluded: "Not included",
    kitchen: "Kitchen",
    kitchenPrivate: "Private",
    kitchenShared: "Shared",
    kitchenNotIncluded: "Not included",
    privateEntrance: "Private entrance",
    laundryAvailable: "Laundry available",
    maxOccupants: "Maximum occupants",
    maxOccupantsHint: "Numbers only.",
    sharedSpacePreferences: "Shared space preferences",
    sharedSpacePreferencesHint:
      "Optional. Add important details for co-living, house rules or reasonable space preferences.",
    sharedSpacePreferencesPlaceholder:
      "E.g. quiet environment, no smoking, quiet hours, preference for one person, etc.",
    approximateSize: "Approximate size",
    approximateSizeHint: "Free text or measurements (e.g. 12 × 24 ft).",
    access24h: "24/7 access",
    electricityAvailable: "Electricity available",
    securityControlled: "Security / controlled access",
    permittedUse: "Permitted use",
    heightDimensions: "Height / dimensions",
    heightDimensionsHint: "If applicable (door, ceiling, van accessible…).",
    sizeSqft: "Size (ft²)",
    sizeSqftHint: "Numbers only (approximate square feet).",
    restroomAvailable: "Restroom available",
    hoursAccess: "Hours / access",
    minimumContract: "Minimum contract",
    minimumContractPlaceholder: "E.g. 1 year, 6 renewable months…",
    availableUtilities: "Available utilities",
    access: "Access",
    zoning: "Zoning",
    zoningHint: "If applicable.",
  },
};

const pt: RentasLaunchUiExtras = {
  page: {
    postTitle: "Publicar aluguel",
    editTitle: "Editar anúncio de aluguel",
    brandKicker: "Leonix · Aluguéis",
    introNew: "A prévia mostra apenas o que você preencher. O rascunho fica nesta sessão do navegador (mesma aba).",
    introEdit: "Você está editando um espaço isolado. Seu anúncio publicado só muda ao usar Salvar alterações.",
    previewExplanation:
      "Validar e ver prévia exige as confirmações finais e os requisitos mínimos; se passarem, abre seu anúncio de teste. Ver prévia (sem validar) salva o rascunho e abre na hora (útil enquanto você termina campos opcionais).",
    draftDeviceOnly: "Rascunho salvo só neste dispositivo.",
    draftCleared: "Rascunho apagado. Você pode começar de novo.",
    publishedProtected: "Anúncio publicado protegido",
    listingEdit: "Edição de anúncio",
    loadError: "Não foi possível carregar o anúncio publicado",
    loadLoading: "Carregando seu anúncio publicado...",
    loadBlockedHint:
      "A edição permanece bloqueada até carregar o anúncio original. Nenhuma alteração foi salva no seu anúncio publicado.",
    publishedProtectedHint:
      "Cancelar descarta apenas este espaço de edição. Salvar alterações atualiza o mesmo anúncio sem Stripe, duplicados nem mudanças no vencimento.",
    sqftPreviewPrefix: "Prévia:",
  },
  actions: {
    backToRentals: "Voltar para Aluguéis",
    validatePreview: "Validar e ver prévia",
    viewWithoutValidation: "Ver prévia (sem validar)",
    deleteDraft: "Excluir rascunho",
    confirmPreviewBlocked:
      "Marque as três confirmações no final do formulário para usar a prévia com validação.",
    cancelEdit: "Cancelar edição",
    saveChanges: "Salvar alterações",
    saving: "Salvando...",
    tryAgain: "Tentar de novo",
    signInRequired: "É preciso entrar para salvar.",
    couldNotSave: "Não foi possível salvar as alterações.",
    changesSaved: "Alterações salvas. A identidade e o vencimento do anúncio foram preservados.",
    openPreviewTitle:
      "Abre a prévia na hora com o rascunho salvo nesta aba. Não exige as confirmações finais nem todos os campos mínimos.",
    deleteConfirmMessage: "Excluir o rascunho desta solicitação e começar de novo?",
  },
  publisher: {
    whoPosting: "Quem está publicando este aluguel?",
    whoHint: "Usamos isso só para mostrar quem oferece o aluguel. O formulário e o preço continuam iguais.",
    ownerPrivate: "Proprietário / particular",
    agent: "Corretor",
    propertyManager: "Administrador de propriedade",
    business: "Negócio",
  },
  category: {
    title: "Categoria",
    hint: "Escolha uma; os demais campos se adaptam no formulário e na prévia.",
    residential: "Residencial",
    commercial: "Comercial",
    landLot: "Terreno / lote",
  },
  media: {
    sectionTitle: "Fotos e vídeo",
    intro:
      "Até 8 fotos (comprimidas no navegador). Para uma prévia completa é preciso pelo menos uma foto. Os vídeos entram como links externos (até 4); arquivos de vídeo não são enviados nesta versão de lançamento. Nada sobe para servidores neste passo; o rascunho fica nesta sessão até existir publicação.",
    listingPhotos: "Fotos do anúncio",
    uploadAdd: "Enviar ou adicionar fotos",
    selectedCountTemplate: "{count}/{max} {selectedWord}",
    selectedWord: "selecionadas",
    photoCardHint:
      "Cada foto é um cartão com prévia. Use o controle ⋮⋮ Ordem para arrastar e reordenar. A capa pode ser diferente do primeiro slot.",
    videosByLink: "Vídeos por link (opcional)",
    videosHint:
      "Você pode adicionar até 4 links externos. Não envie arquivos de vídeo aqui; a Leonix guardará os links e mostrará o primeiro na galeria quando o navegador puder reproduzi-lo.",
    videoN: "Vídeo {n}",
    primaryVideoHint: "O primeiro link é o principal para a prévia e a saída publicada.",
    recommendedPlatforms: "Recomendado: YouTube, TikTok, Instagram, Facebook, Vimeo ou um MP4 público.",
    invalidUrl: "Use uma URL completa que comece com http:// ou https://.",
    linksReady:
      "Links prontos: serão salvos no rascunho e na publicação. Os navegadores podem mostrar alguns como link em vez de player.",
  },
  contact: {
    sectionTitle: "Informações de contato",
    intro:
      "Seu nome e como você quer ser contatado. Para a prévia: nome e pelo menos um meio de contato (telefone, WhatsApp, SMS ou e-mail).",
    contactPhoto: "Foto de contato (opcional)",
    uploadPhoto: "Enviar foto",
    removePhoto: "Remover foto",
    fullName: "Nome completo",
    phone: "Telefone",
    whatsapp: "WhatsApp",
    textNumber: "Número para mensagens de texto",
    textNumberHint: "Pode ser o mesmo número de telefone ou outro diferente.",
    textNumberPlaceholder: "Pode ser o mesmo número de telefone ou outro diferente.",
    email: "E-mail",
    messageOptional: "Mensagem para interessados (opcional)",
    messageHint: "Texto curto que eles verão antes de escrever ou ligar para você.",
  },
  channels: {
    section: "Mais formas de contato",
    websiteMoreInfo: "Site / mais informações",
    ig: "Instagram",
    igHint: "@usuario ou https://instagram.com/usuario",
    fb: "Facebook",
    fbHint: "https://facebook.com/sua-pagina",
    yt: "YouTube",
    ytHint: "https://youtube.com/@seu-canal",
    tt: "TikTok",
    ttHint: "@usuario ou https://tiktok.com/@usuario",
    allowCalls: "Permitir chamadas",
    allowSms: "Permitir SMS / mensagens de texto",
    showWhatsApp: "Mostrar WhatsApp",
    preferredMethod: "Método de contato preferido (opcional)",
    prefPhone: "Telefone",
    prefEmail: "E-mail",
    prefWhatsApp: "WhatsApp",
    prefSms: "SMS",
    prefWeb: "Site",
    prefNone: "Sem preferência",
  },
  showings: {
    sectionTitle: "Visitas e tours",
    optionalHint: "Opcional. Se você preencher algum campo, ele aparecerá na prévia e no anúncio publicado.",
    byAppointment: "Visitas com hora marcada",
    byAppointmentHint: "Indique se as visitas são somente com hora marcada.",
    byAppointmentCheckbox: "As visitas são somente com hora marcada",
    availability: "Disponibilidade para visitas",
    availabilityHint: "Horários ou dias em que você pode mostrar o espaço (opcional).",
    availabilityPlaceholder: "Ex. Seg–sex 10:00–18:00, sábados com hora marcada",
    instructions: "Instruções para visitas",
    instructionsHint: "Como combinar a visita, acesso, estacionamento etc. (opcional).",
    instructionsPlaceholder: "Ex. Enviar mensagem com 24 h de antecedência; tocar o interfone 2.",
    virtualTour: "Tour virtual (link HTTPS)",
    virtualTourHint: "Somente links https seguros (Matterport, YouTube etc.). Opcional.",
    invalidHttps: "Se o link não for válido, não será mostrado no anúncio.",
  },
  residential: {
    sectionTitle: "Detalhe residencial",
    type: "Tipo",
    subtype: "Subtipo",
    bedrooms: "Quartos",
    fullBaths: "Banheiros completos",
    halfBaths: "Lavabos",
    interior: "Interior (ft²)",
    lot: "Lote (ft²)",
    parking: "Estacionamento",
    yearBuilt: "Ano de construção",
    condition: "Condição",
  },
  highlights: {
    highlightsHeading: "Amenidades / destaques",
    piscina: "Piscina",
    cocinaRemodelada: "Cozinha reformada",
    electrodomesticosLujo: "Eletrodomésticos de luxo",
    patio: "Quintal / pátio",
    balcon: "Varanda",
    vista: "Vista",
    comunidadCerrada: "Condomínio fechado",
    techosAltos: "Teto alto",
    cuartoPrincipalGrande: "Suíte ampla",
    walkInCloset: "Closet",
    oficinaEnCasa: "Escritório em casa",
    panelesSolares: "Painéis solares",
    smartHome: "Casa inteligente",
    chimenea: "Lareira",
    lavanderia: "Lavanderia",
    estacionamientoTechado: "Estacionamento coberto",
    accesoControlado: "Acesso controlado",
    elevador: "Elevador",
    terraza: "Terraço",
    gimnasio: "Academia",
    amenidadesDesarrollo: "Amenidades do condomínio",
  },
  confirmations: {
    title: "Confirmação antes de publicar",
    desc: "Estas caixas ajudam a manter a Leonix clara e confiável para todos.",
    accurate: "Confirmo que as informações do imóvel são verdadeiras e atualizadas.",
    photos: "Confirmo que as fotos mostram o imóvel real que estou anunciando.",
    rules: "Confirmo que meu anúncio respeita as regras da comunidade e do marketplace.",
    rulesLink: "Ver regras da Leonix",
  },
  review: {
    finalReview: "Revisão final",
    finalReviewHint: "Quando seu conteúdo estiver pronto, use os botões abaixo para abrir a prévia ou iniciar a publicação.",
    priceSummary: "Resumo de preços",
    rentalListing: "Anúncio de aluguel",
    days30: "dias",
    total: "Total",
    paidActivationHint: "A ativação do anúncio pago ocorre após o pagamento seguro.",
    preview: "Prévia",
    viewPreviewDraft: "Ver prévia (rascunho)",
    draftFooter: "Rascunho salvo só neste dispositivo.",
  },
  photoStrip: {
    dragReorder: "Arrastar para reordenar a foto",
    photoN: "Foto {n}",
    coverSuffix: " · Capa",
    coverActive: "Capa ativa",
    useAsCover: "Usar como capa",
    order: "Ordem",
    remove: "Remover",
  },
  plazo: {
    "mes-a-mes": "Mês a mês",
    "6-meses": "6 meses",
    "12-meses": "12 meses",
    "1-ano": "1 ano",
    "2-anos": "2 anos",
    otro: "Outro",
  },
  residentialTypes: {
    casa: "Casa",
    condominio: "Condomínio",
    townhome: "Townhome",
    apartamento: "Apartamento",
    multifamiliar: "Multifamiliar",
  },
  residentialSubtypes: {
    noAdditionalDetail: "— Sem detalhe adicional",
    un_piso: "Um andar",
    dos_pisos: "Dois andares",
    duplex: "Duplex / geminado",
    unidad: "Unidade em condomínio",
    penthouse: "Cobertura",
    planta_baja: "Térreo",
    adosado: "Geminado",
    esquina: "De esquina",
    elevador: "Com elevador",
    vista: "Com vista",
    varias_unidades: "Várias unidades no local",
  },
  condition: {
    excelente: "Excelente",
    buena: "Boa",
    regular: "Regular",
    necesita_reparacion: "Precisa de reparo",
    emptyDash: "—",
  },
  listingStatus: {
    disponible: "Disponível",
    pendiente: "Pendente",
    bajo_contrato: "Sob contrato",
    rentado: "Alugado",
  },
  commercialSection: {
    sectionTitle: "Detalhe comercial",
    type: "Tipo comercial",
    subtype: "Subtipo",
    use: "Uso",
    interior: "Interior (ft²)",
    offices: "Escritórios",
    baths: "Banheiros",
    levels: "Níveis",
    zoning: "Zoneamento",
    parking: "Estacionamento",
    condition: "Condição",
    loadingAccess: "Acesso de carga",
    highlightsHeading: "Destaques",
  },
  landSection: {
    sectionTitle: "Detalhe terreno / lote",
    type: "Tipo",
    subtype: "Subtipo",
    lot: "Lote (ft²)",
    useZoning: "Uso / zoneamento",
    access: "Acesso",
    utilities: "Serviços",
    topography: "Topografia",
    readyToBuild: "Pronto para construir",
    fenced: "Cercado",
    highlightsHeading: "Destaques",
  },
  commercialTypes: {
    oficina: "Escritório",
    local: "Loja",
    bodega: "Galpão",
    nave_industrial: "Galpão industrial",
    uso_mixto: "Uso misto",
    edificio_comercial: "Edifício comercial",
  },
  commercialSubtypes: {
    noAdditionalDetail: "— Sem detalhe adicional",
    planta_abierta: "Planta aberta",
    suite: "Suíte",
    piso_completo: "Andar completo",
    frente_calle: "Frente para a rua",
    interior_plaza: "Interior de shopping",
    con_rampa: "Com rampa / doca",
    climatizada: "Climatizada",
    muelle: "Doca de carga",
    altura_libre: "Pé-direito alto",
    pb_comercio: "Térreo comércio",
    niveles_mixtos: "Níveis mistos",
    torre: "Torre",
    strip: "Strip center",
  },
  commercialHighlights: {
    recepcion: "Recepção",
    elevador: "Elevador",
    acceso_carga: "Acesso de carga",
    alto_trafico: "Alto fluxo",
    senalizacion: "Sinalização",
    seguridad: "Segurança",
    listo_operar: "Pronto para operar",
    oficinas_privadas: "Escritórios privados",
    sala_juntas: "Sala de reunião",
    area_almacen: "Área de armazenamento",
  },
  landTypes: {
    lote_residencial: "Lote residencial",
    lote_comercial: "Lote comercial",
    rancho: "Rancho",
    agricola: "Terreno agrícola",
    desarrollo: "Terreno para desenvolvimento",
  },
  landSubtypes: {
    noAdditionalDetail: "— Sem detalhe adicional",
    esquina: "De esquina",
    cul_de_sac: "Rua sem saída",
    frente_vial: "Frente para via",
    con_casa: "Com moradia",
    pastizal: "Pastagem",
    riegos: "Com irrigação",
    secano: "Sequeiro",
    urbanizable: "Urbanizável",
    master_plan: "Em master plan",
  },
  landHighlights: {
    pozo: "Poço",
    arboles: "Árvores",
    arboles_frutales: "Árvores frutíferas",
    vista: "Vista",
    acceso_pavimentado: "Acesso pavimentado",
    cercado: "Cercado",
    destacado_agricola: "Agrícola",
    destacado_comercial: "Uso comercial viável",
    listo_construir: "Pronto para construir",
    cerca_servicios: "Perto de serviços",
  },
  tipoFlow: {
    yes: "Sim",
    no: "Não",
    inListingPrefix: "No anúncio: ",
    bathroomType: "Tipo de banheiro",
    bathroomPrivate: "Privado",
    bathroomShared: "Compartilhado",
    bathroomNotIncluded: "Não incluído",
    kitchen: "Cozinha",
    kitchenPrivate: "Privada",
    kitchenShared: "Compartilhada",
    kitchenNotIncluded: "Não incluída",
    privateEntrance: "Entrada privada",
    laundryAvailable: "Lavanderia disponível",
    maxOccupants: "Máximo de ocupantes",
    maxOccupantsHint: "Somente números.",
    sharedSpacePreferences: "Preferências do espaço compartilhado",
    sharedSpacePreferencesHint:
      "Opcional. Adicione detalhes importantes para convivência, regras da casa ou preferências razoáveis do espaço.",
    sharedSpacePreferencesPlaceholder:
      "Ex. ambiente tranquilo, não fumar, horário de descanso, preferência para uma pessoa, etc.",
    approximateSize: "Tamanho aproximado",
    approximateSizeHint: "Texto livre ou medidas (ex. 12 × 24 ft).",
    access24h: "Acesso 24/7",
    electricityAvailable: "Eletricidade disponível",
    securityControlled: "Segurança / acesso controlado",
    permittedUse: "Uso permitido",
    heightDimensions: "Altura / dimensões",
    heightDimensionsHint: "Se aplicável (porta, teto, van accessible…).",
    sizeSqft: "Tamanho (ft²)",
    sizeSqftHint: "Somente números (pés quadrados aproximados).",
    restroomAvailable: "Banheiro disponível",
    hoursAccess: "Horário / acesso",
    minimumContract: "Contrato mínimo",
    minimumContractPlaceholder: "Ex. 1 ano, 6 meses renováveis…",
    availableUtilities: "Serviços disponíveis",
    access: "Acesso",
    zoning: "Zoneamento",
    zoningHint: "Se aplicável.",
  },
};

const tl: RentasLaunchUiExtras = {
  page: {
    postTitle: "Mag-post ng renta",
    editTitle: "I-edit ang listing ng renta",
    brandKicker: "Leonix · Rentas",
    introNew: "Ang preview ay nagpapakita lang ng nilagay mo. Nakatira ang draft sa session na ito ng browser (parehong tab).",
    introEdit: "Nag-e-edit ka sa hiwalay na workspace. Nagbabago lang ang published listing pagkatapos ng Save changes.",
    previewExplanation:
      "Kailangan ng Validate and preview ang final confirmations at minimum requirements; kung pumasa, bubuksan ang test listing. Ang View preview (without validation) ay magse-save ng draft at agad bubukas (kapaki-pakinabang habang tinatapos ang optional fields).",
    draftDeviceOnly: "Naka-save ang draft sa device na ito lang.",
    draftCleared: "Na-clear ang draft. Puwede kang magsimula ulit.",
    publishedProtected: "Protektado ang published listing",
    listingEdit: "Pag-edit ng listing",
    loadError: "Hindi namin ma-load ang published listing",
    loadLoading: "Nilo-load ang published listing mo...",
    loadBlockedHint:
      "Naka-block ang pag-edit hanggang ma-load ang original listing snapshot. Walang nabago sa published listing mo.",
    publishedProtectedHint:
      "Ang Cancel ay nagtatapon lang sa edit workspace na ito. Ina-update ng Save changes ang parehong listing nang walang Stripe, duplicate rows, o pagbabago sa expiration.",
    sqftPreviewPrefix: "Preview:",
  },
  actions: {
    backToRentals: "Bumalik sa Rentas",
    validatePreview: "I-validate at i-preview",
    viewWithoutValidation: "Tingnan ang preview (walang validation)",
    deleteDraft: "I-delete ang draft",
    confirmPreviewBlocked:
      "I-check ang tatlong confirmation sa ibaba para magamit ang validated preview.",
    cancelEdit: "Kanselahin ang edit",
    saveChanges: "I-save ang changes",
    saving: "Sine-save...",
    tryAgain: "Subukan ulit",
    signInRequired: "Kailangan mag-sign in para mag-save.",
    couldNotSave: "Hindi ma-save ang changes.",
    changesSaved: "Na-save ang changes. Napreserba ang identity at expiration ng listing.",
    openPreviewTitle:
      "Agad bubukas ang preview gamit ang draft na naka-save sa tab na ito. Hindi kailangan ang final confirmations o lahat ng minimum fields.",
    deleteConfirmMessage: "I-delete ang application draft na ito at magsimula ulit?",
  },
  publisher: {
    whoPosting: "Sino ang nagpo-post ng rentang ito?",
    whoHint: "Ginagamit lang ito para ipakita kung sino ang nag-aalok ng renta. Pareho pa rin ang form at presyo.",
    ownerPrivate: "May-ari / private person",
    agent: "Agent",
    propertyManager: "Property manager",
    business: "Negosyo",
  },
  category: {
    title: "Kategorya",
    hint: "Pumili ng isa; aangkop ang ibang fields sa form at preview.",
    residential: "Residential",
    commercial: "Commercial",
    landLot: "Lupa / lote",
  },
  media: {
    sectionTitle: "Mga larawan at video",
    intro:
      "Hanggang 8 larawan (naka-compress sa browser). Kailangan ng hindi bababa sa isang larawan para sa kumpletong preview. Idinadagdag ang video bilang external links (hanggang 4); hindi ina-upload ang video files sa launch version na ito. Walang ina-upload sa servers sa hakbang na ito; nasa session na ito ang draft hanggang magkaroon ng publish.",
    listingPhotos: "Mga larawan ng listing",
    uploadAdd: "Mag-upload o magdagdag ng larawan",
    selectedCountTemplate: "{count}/{max} {selectedWord}",
    selectedWord: "napili",
    photoCardHint:
      "Bawat larawan ay card na may preview. Gamitin ang ⋮⋮ Order control para i-drag at i-reorder. Puwedeng iba ang cover sa unang slot.",
    videosByLink: "Mga video sa link (optional)",
    videosHint:
      "Puwede kang magdagdag ng hanggang 4 na external links. Huwag mag-upload ng video files dito; ise-save ng Leonix ang links at ipapakita ang una sa gallery kapag kaya ng browser.",
    videoN: "Video {n}",
    primaryVideoHint: "Ang unang link ang primary para sa preview at published listing.",
    recommendedPlatforms: "Recommended: YouTube, TikTok, Instagram, Facebook, Vimeo, o public MP4.",
    invalidUrl: "Gumamit ng buong URL na nagsisimula sa http:// o https://.",
    linksReady:
      "Handa na ang links: ise-save sa draft at sa publish. Maaaring ipakita ng browser ang iba bilang link sa halip na player.",
  },
  contact: {
    sectionTitle: "Impormasyon sa pakikipag-ugnayan",
    intro:
      "Pangalan mo at paano mo gustong kontakin. Para sa preview: pangalan at hindi bababa sa isang paraan (phone, WhatsApp, text, o email).",
    contactPhoto: "Larawan ng contact (optional)",
    uploadPhoto: "Mag-upload ng larawan",
    removePhoto: "Alisin ang larawan",
    fullName: "Buong pangalan",
    phone: "Telepono",
    whatsapp: "WhatsApp",
    textNumber: "Numero para sa text message",
    textNumberHint: "Puwedeng parehong numero ng telepono o iba.",
    textNumberPlaceholder: "Puwedeng parehong numero ng telepono o iba.",
    email: "Email",
    messageOptional: "Mensahe para sa interested parties (optional)",
    messageHint: "Maikling text na makikita nila bago mag-message o tumawag sa iyo.",
  },
  channels: {
    section: "Higit pang contact options",
    websiteMoreInfo: "Website / higit pang impormasyon",
    ig: "Instagram",
    igHint: "@handle o https://instagram.com/handle",
    fb: "Facebook",
    fbHint: "https://facebook.com/your-page",
    yt: "YouTube",
    ytHint: "https://youtube.com/@your-channel",
    tt: "TikTok",
    ttHint: "@handle o https://tiktok.com/@handle",
    allowCalls: "Payagan ang calls",
    allowSms: "Payagan ang SMS / text messages",
    showWhatsApp: "Ipakita ang WhatsApp",
    preferredMethod: "Preferred contact method (optional)",
    prefPhone: "Telepono",
    prefEmail: "Email",
    prefWhatsApp: "WhatsApp",
    prefSms: "SMS",
    prefWeb: "Website",
    prefNone: "Walang preference",
  },
  showings: {
    sectionTitle: "Mga showing at tour",
    optionalHint: "Optional. Kapag may nilagay ka, lalabas ito sa preview at published listing.",
    byAppointment: "Showing by appointment",
    byAppointmentHint: "Ipahiwatig kung appointment only ang mga bisita.",
    byAppointmentCheckbox: "Appointment only ang mga bisita",
    availability: "Availability para sa showing",
    availabilityHint: "Oras o araw na puwede mong ipakita ang space (optional).",
    availabilityPlaceholder: "Hal. Lun–Biy 10:00–18:00, Sabado by appointment",
    instructions: "Mga instruction para sa showing",
    instructionsHint: "Paano i-coordinate ang bisita, access, parking, atbp. (optional).",
    instructionsPlaceholder: "Hal. Magpadala ng mensahe 24h bago; pindutin ang doorbell 2.",
    virtualTour: "Virtual tour (HTTPS link)",
    virtualTourHint: "Secure https links lang (Matterport, YouTube, atbp.). Optional.",
    invalidHttps: "Kung hindi valid ang link, hindi ito ipapakita sa listing.",
  },
  residential: {
    sectionTitle: "Mga detalye ng residential",
    type: "Uri",
    subtype: "Subtype",
    bedrooms: "Mga silid-tulugan",
    fullBaths: "Buong banyo",
    halfBaths: "Half bath",
    interior: "Interior (ft²)",
    lot: "Lote (ft²)",
    parking: "Parking",
    yearBuilt: "Taon ng pagkakagawa",
    condition: "Kondisyon",
  },
  highlights: {
    highlightsHeading: "Mga amenity / highlights",
    piscina: "Pool",
    cocinaRemodelada: "Renobadong kusina",
    electrodomesticosLujo: "Luxury appliances",
    patio: "Patio",
    balcon: "Balkonahe",
    vista: "View",
    comunidadCerrada: "Gated community",
    techosAltos: "Mataas na kisame",
    cuartoPrincipalGrande: "Malaking primary bedroom",
    walkInCloset: "Walk-in closet",
    oficinaEnCasa: "Home office",
    panelesSolares: "Solar panels",
    smartHome: "Smart home",
    chimenea: "Fireplace",
    lavanderia: "Laundry",
    estacionamientoTechado: "Covered parking",
    accesoControlado: "Controlled access",
    elevador: "Elevator",
    terraza: "Terrace",
    gimnasio: "Gym",
    amenidadesDesarrollo: "Mga amenity ng development",
  },
  confirmations: {
    title: "Kumpirmasyon bago mag-post",
    desc: "Tinutulungan ng mga check na ito na manatiling malinaw at mapagkakatiwalaan ang Leonix para sa lahat.",
    accurate: "Kinukumpirma kong totoo at updated ang impormasyon ng property.",
    photos: "Kinukumpirma kong ipinapakita ng mga larawan ang tunay na property na inililista ko.",
    rules: "Kinukumpirma kong sumusunod ang listing na ito sa community at marketplace rules.",
    rulesLink: "Tingnan ang Leonix rules",
  },
  review: {
    finalReview: "Final review",
    finalReviewHint: "Kapag handa na ang content mo, gamitin ang mga button sa ibaba para buksan ang preview o simulan ang publishing.",
    priceSummary: "Buod ng presyo",
    rentalListing: "Listing ng renta",
    days30: "araw",
    total: "Kabuuan",
    paidActivationHint: "Pagkatapos ng secure payment nangyayari ang activation ng bayad na listing.",
    preview: "I-preview",
    viewPreviewDraft: "Tingnan ang preview (draft)",
    draftFooter: "Naka-save ang draft sa device na ito lang.",
  },
  photoStrip: {
    dragReorder: "I-drag para i-reorder ang larawan",
    photoN: "Larawan {n}",
    coverSuffix: " · Cover",
    coverActive: "Aktibong cover",
    useAsCover: "Gamitin bilang cover",
    order: "Order",
    remove: "Alisin",
  },
  plazo: {
    "mes-a-mes": "Buwan-buwan",
    "6-meses": "6 buwan",
    "12-meses": "12 buwan",
    "1-ano": "1 taon",
    "2-anos": "2 taon",
    otro: "Iba pa",
  },
  residentialTypes: {
    casa: "Bahay",
    condominio: "Condominium",
    townhome: "Townhome",
    apartamento: "Apartment",
    multifamiliar: "Multifamily",
  },
  residentialSubtypes: {
    noAdditionalDetail: "— Walang karagdagang detalye",
    un_piso: "Isang palapag",
    dos_pisos: "Dalawang palapag",
    duplex: "Duplex / dalawang unit",
    unidad: "Condo unit",
    penthouse: "Penthouse",
    planta_baja: "Ground floor",
    adosado: "Attached",
    esquina: "Corner lot",
    elevador: "May elevator",
    vista: "May view",
    varias_unidades: "Maraming unit sa site",
  },
  condition: {
    excelente: "Napakahusay",
    buena: "Maganda",
    regular: "Katamtaman",
    necesita_reparacion: "Kailangan ng repair",
    emptyDash: "—",
  },
  listingStatus: {
    disponible: "Available",
    pendiente: "Pending",
    bajo_contrato: "Under contract",
    rentado: "Nirerentahan",
  },
  commercialSection: {
    sectionTitle: "Mga detalye ng commercial",
    type: "Uri ng commercial",
    subtype: "Subtype",
    use: "Gamit",
    interior: "Interior (ft²)",
    offices: "Mga opisina",
    baths: "Mga banyo",
    levels: "Mga antas",
    zoning: "Zoning",
    parking: "Parking",
    condition: "Kondisyon",
    loadingAccess: "Loading access",
    highlightsHeading: "Highlights",
  },
  landSection: {
    sectionTitle: "Mga detalye ng lupa / lote",
    type: "Uri",
    subtype: "Subtype",
    lot: "Lote (ft²)",
    useZoning: "Gamit / zoning",
    access: "Access",
    utilities: "Mga serbisyo",
    topography: "Topography",
    readyToBuild: "Handa nang itayo",
    fenced: "May bakod",
    highlightsHeading: "Highlights",
  },
  commercialTypes: {
    oficina: "Opisina",
    local: "Tindahan / retail space",
    bodega: "Warehouse",
    nave_industrial: "Industrial building",
    uso_mixto: "Mixed use",
    edificio_comercial: "Commercial building",
  },
  commercialSubtypes: {
    noAdditionalDetail: "— Walang karagdagang detalye",
    planta_abierta: "Open plan",
    suite: "Suite",
    piso_completo: "Buong palapag",
    frente_calle: "Street frontage",
    interior_plaza: "Inside plaza",
    con_rampa: "May ramp / dock",
    climatizada: "Climate-controlled",
    muelle: "Loading dock",
    altura_libre: "High clearance",
    pb_comercio: "Ground-floor retail",
    niveles_mixtos: "Mixed levels",
    torre: "Tower",
    strip: "Strip center",
  },
  commercialHighlights: {
    recepcion: "Reception",
    elevador: "Elevator",
    acceso_carga: "Loading access",
    alto_trafico: "Mataas na foot traffic",
    senalizacion: "Signage",
    seguridad: "Security",
    listo_operar: "Move-in ready",
    oficinas_privadas: "Private offices",
    sala_juntas: "Conference room",
    area_almacen: "Storage area",
  },
  landTypes: {
    lote_residencial: "Residential lot",
    lote_comercial: "Commercial lot",
    rancho: "Ranch",
    agricola: "Agricultural land",
    desarrollo: "Development land",
  },
  landSubtypes: {
    noAdditionalDetail: "— Walang karagdagang detalye",
    esquina: "Corner lot",
    cul_de_sac: "Cul-de-sac",
    frente_vial: "Road frontage",
    con_casa: "May tirahan",
    pastizal: "Pasture",
    riegos: "Irrigated",
    secano: "Dryland",
    urbanizable: "Urbanizable",
    master_plan: "In master plan",
  },
  landHighlights: {
    pozo: "Balon / well",
    arboles: "Mga puno",
    arboles_frutales: "Fruit trees",
    vista: "View",
    acceso_pavimentado: "Paved access",
    cercado: "May bakod",
    destacado_agricola: "Agricultural",
    destacado_comercial: "Commercial potential",
    listo_construir: "Handa nang itayo",
    cerca_servicios: "Malapit sa utilities / serbisyo",
  },
  tipoFlow: {
    yes: "Oo",
    no: "Hindi",
    inListingPrefix: "Sa listing: ",
    bathroomType: "Uri ng banyo",
    bathroomPrivate: "Private",
    bathroomShared: "Shared",
    bathroomNotIncluded: "Hindi kasama",
    kitchen: "Kusina",
    kitchenPrivate: "Private",
    kitchenShared: "Shared",
    kitchenNotIncluded: "Hindi kasama",
    privateEntrance: "Private entrance",
    laundryAvailable: "May laundry",
    maxOccupants: "Maximum na occupants",
    maxOccupantsHint: "Numero lang.",
    sharedSpacePreferences: "Mga preference sa shared space",
    sharedSpacePreferencesHint:
      "Opsyonal. Magdagdag ng mahahalagang detalye para sa co-living, house rules, o makatwirang preference sa espasyo.",
    sharedSpacePreferencesPlaceholder:
      "Hal. tahimik na lugar, no smoking, quiet hours, preference para sa isang tao, atbp.",
    approximateSize: "Tinatayang sukat",
    approximateSizeHint: "Free text o sukat (hal. 12 × 24 ft).",
    access24h: "24/7 access",
    electricityAvailable: "May kuryente",
    securityControlled: "Security / controlled access",
    permittedUse: "Pinapayagang gamit",
    heightDimensions: "Taas / dimensyon",
    heightDimensionsHint: "Kung applicable (door, ceiling, van accessible…).",
    sizeSqft: "Sukat (ft²)",
    sizeSqftHint: "Numero lang (tinatayang square feet).",
    restroomAvailable: "May restroom",
    hoursAccess: "Oras / access",
    minimumContract: "Minimum na kontrata",
    minimumContractPlaceholder: "Hal. 1 taon, 6 renewable months…",
    availableUtilities: "Available utilities",
    access: "Access",
    zoning: "Zoning",
    zoningHint: "Kung applicable.",
  },
};

export const rentasExtrasByLocale: Record<"es" | "en" | "pt" | "tl", RentasLaunchUiExtras> = {
  es,
  en,
  pt,
  tl,
};

type StringLeaves<T> = {
  [K in keyof T]: T[K] extends string ? "string" : StringLeaves<T[K]>;
};

function stringLeavesSchema<T extends object>(sample: T): StringLeaves<T> {
  const out = {} as StringLeaves<T>;
  for (const key of Object.keys(sample) as (keyof T)[]) {
    const val = sample[key];
    if (typeof val === "string") {
      (out as Record<string, unknown>)[key as string] = "string";
    } else if (val && typeof val === "object") {
      (out as Record<string, unknown>)[key as string] = stringLeavesSchema(val as object);
    }
  }
  return out;
}

/** Parallel `"string"` leaf schema for merging into `LEONIX_I18N_SCHEMA.rentas`. */
export const RENTAS_EXTRAS_SCHEMA = stringLeavesSchema(es);
