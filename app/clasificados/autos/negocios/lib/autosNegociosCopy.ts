import type { DealerHoursEntry } from "../types/autoDealerListing";
import type { AutosNegociosLang } from "./autosNegociosLang";
import { SELECT_OTHER_VALUE } from "./autoDealerSelectResolve";

/** Canonical "Other" token for selects — must match stored values and resolveOtroField. */
export const AUTOS_NEGOCIOS_OTHER = SELECT_OTHER_VALUE;

export type AutosNegociosCopy = {
  meta: { applicationTitle: string; previewTitle: string };
  app: {
    kicker: string;
    pageTitle: string;
    intro: string;
    badgeLocal: string;
    badgeAutosave: string;
    noteTitle: string;
    noteBody: string;
    sections: {
      main: string;
      mainSub: string;
      specs: string;
      badges: string;
      media: string;
      dealer: string;
      description: string;
    };
    labels: Record<string, string>;
    placeholders: Record<string, string>;
    hints: Record<string, string>;
    actions: { preview: string; reset: string };
    dealer: {
      socialHeading: string;
      applyHoursTemplate: string;
      addHoursRow: string;
      day: string;
      open: string;
      close: string;
      closed: string;
      remove: string;
      newDayPlaceholder: string;
      socialLabels: { instagram: string; facebook: string; youtube: string; tiktok: string; website: string };
    };
    titleBlock: { title: string; customize: string; hint: string };
    equipmentHeading: string;
  };
  media: {
    sectionTitle: string;
    sectionIntro: string;
    photosHeading: string;
    dropzone: string;
    addPhotos: string;
    pickerHint: string;
    /** Explains multi-select in picker; some mobile OSes only return one file per action. */
    pickerMultiNote: string;
    singleUrl: string;
    batchUrls: string;
    addUrls: string;
    useLink: string;
    emptyPhotos: string;
    emptyPhotosHint: string;
    principal: string;
    before: string;
    after: string;
    remove: string;
    sourceFile: string;
    sourceUrl: string;
    secondary: string;
    videoHeading: string;
    videoDraftNote: string;
    videoLinkTab: string;
    videoFileTab: string;
    removeVideo: string;
    videoUrlLabel: string;
    useVideoUrl: string;
    videoUrlSaved: string;
    chooseVideo: string;
    videoReady: string;
    videoReplace: string;
    videoFileHint: string;
    videoChooseMode: string;
    logoHeading: string;
    logoUrlHint: string;
    logoUrlLabel: string;
    useLogoUrl: string;
    logoUrlSaved: string;
    uploadLogo: string;
    uploadLogoHint: string;
    logoPreviewTitle: string;
    logoPreviewFile: string;
    logoPreviewUrl: string;
    removeLogo: string;
  };
  preview: {
    chrome: {
      breadcrumbClassifieds: string;
      breadcrumbAutos: string;
      breadcrumbDealers: string;
      backToEdit: string;
    };
    empty: {
      kicker: string;
      title: string;
      body: string;
      cta: string;
      footnote: string;
    };
    title: {
      mileage: string;
      location: string;
      vin: string;
      stock: string;
      priceLabel: string;
    };
    analytics: {
      kicker: string;
      views: string;
      saves: string;
      shares: string;
      contacts: string;
      footnote: string;
    };
    sidebar: {
      priceAdvertised: string;
      whatsappCta: string;
      call: string;
      scheduleAppointment: string;
      viewWebsite: string;
    };
    specs: { title: string; subtitle: string; rows: Record<string, string> };
    highlights: { title: string; subtitle: string };
    description: { title: string; byline: (dealer: string) => string };
    related: { title: string; subtitle: string; details: string };
    gallery: {
      vehicleFallback: string;
      morePhotos: (n: number) => string;
      viewAlt: (i: number) => string;
      videoBadge: string;
      videoAria: string;
    };
    dealer: {
      logoAltFallback: string;
      hoursHeading: string;
    };
  };
  taxonomy: {
    condition: { value: string; label: string }[];
    selectEmpty: string;
    transmission: string[];
    drivetrain: string[];
    fuel: string[];
    bodyStyle: string[];
    exterior: string[];
    interior: string[];
    titleStatus: string[];
    badges: { key: string; label: string }[];
    features: string[];
  };
  weekdayTemplate: DealerHoursEntry[];
};

const OTHER = AUTOS_NEGOCIOS_OTHER;

const ES: AutosNegociosCopy = {
  meta: { applicationTitle: "Autos · Negocio — Publicar", previewTitle: "Vista previa — Auto · Negocio" },
  app: {
    kicker: "Publicar · Clasificados",
    pageTitle: "Autos · Negocio",
    intro:
      "Completa el anuncio de tu inventario. La vista previa muestra la misma página que verá el comprador en Leonix.",
    badgeLocal: "Borrador local",
    badgeAutosave: "Guardado automático",
    noteTitle: "Vista previa fiel al publicado",
    noteBody:
      "Los campos que completes aparecerán en la vista previa. Los campos vacíos no se muestran al comprador: el anuncio se adapta y solo se muestra lo que añades.",
    sections: {
      main: "Información principal del vehículo",
      mainSub: "Datos básicos del anuncio.",
      specs: "Especificaciones",
      badges: "Insignias y destacados",
      media: "Fotos y medios",
      dealer: "Información del negocio",
      description: "Descripción",
    },
    labels: {
      year: "Año",
      make: "Marca",
      model: "Modelo",
      trim: "Versión / trim",
      condition: "Condición",
      price: "Precio (USD)",
      monthly: "Pago mensual estimado (opcional)",
      mileage: "Millaje",
      city: "Ciudad",
      state: "Estado",
      zip: "Código postal (ZIP)",
      vin: "VIN",
      stock: "Número de stock",
      engine: "Motor",
      transmission: "Transmisión",
      drivetrain: "Tracción",
      fuel: "Combustible",
      bodyStyle: "Estilo de carrocería",
      exteriorColor: "Color exterior",
      interiorColor: "Color interior",
      titleStatus: "Estado del título",
      mpgCity: "MPG ciudad",
      mpgHighway: "MPG carretera",
      doors: "Puertas",
      seats: "Asientos",
      dealerName: "Nombre del concesionario",
      phoneOffice: "Teléfono de oficina",
      phoneMobile: "Teléfono personal / móvil (opcional)",
      whatsapp: "WhatsApp",
      website: "Sitio web",
      bookingUrl: "URL para agendar cita",
      address: "Dirección",
    },
    placeholders: {
      monthly: "Ej. Desde $450/mes",
      whatsapp: "+1 408 555 0100",
      https: "https://…",
      description: "Describe el vehículo con el tono de tu concesionario.",
      city: "Escribe y elige una ciudad",
      zip: "Ej. 95112",
    },
    hints: {
      transmission: "Especifica la transmisión.",
      drivetrain: "Escribe la tracción o elige otra opción.",
      fuel: "Describe el combustible.",
      bodyStyle: "Describe el estilo de carrocería.",
      exterior: "Escribe el color exterior.",
      interior: "Escribe el color interior.",
      titleStatus: "Describe el estado del título.",
      transPh: "Ej. Manual de 6 velocidades",
      drivePh: "Describe la tracción",
      fuelPh: "Describe el combustible",
      bodyPh: "Describe el estilo",
      extPh: "Escribe el color exterior",
      intPh: "Escribe el color interior",
      titlePh: "Describe el estado del título",
      cityNorCal: "Lista NorCal: elige una ciudad canónica para filtros y calidad de datos.",
      monthlyOptional: "Opcional. Solo si quieres mostrar un pago mensual estimado.",
      whatsapp: "Incluye código de país (p. ej. +1). La vista previa abrirá WhatsApp con el número normalizado.",
      bookingUrl:
        "Enlace a tu herramienta de citas, Calendly o página para agendar prueba de manejo. Si está vacío, no se muestra el botón de cita en la vista previa.",
      phoneMobile: "Opcional. No aparece como segundo botón de llamada en la vista previa; queda guardado para uso interno o futuro.",
      zip: "5 dígitos (EE. UU.). Opcional; mejora búsqueda y geofencing.",
    },
    actions: { preview: "Ver vista previa", reset: "Reiniciar borrador" },
    dealer: {
      socialHeading: "Redes sociales",
      applyHoursTemplate: "Aplicar plantilla de horario (Lun–Dom)",
      addHoursRow: "Añadir fila de horario",
      day: "Día",
      open: "Apertura",
      close: "Cierre",
      closed: "Cerrado",
      remove: "Quitar",
      newDayPlaceholder: "Día",
      socialLabels: {
        instagram: "Instagram",
        facebook: "Facebook",
        youtube: "YouTube",
        tiktok: "TikTok",
        website: "Sitio / globo",
      },
    },
    titleBlock: {
      title: "Título del anuncio",
      customize: "Personalizar título",
      hint: "Por defecto: año, marca, modelo y trim. Activa la casilla para editar a mano.",
    },
    equipmentHeading: "Equipamiento",
  },
  media: {
    sectionTitle: "Fotos y medios",
    sectionIntro: "Puedes pegar URLs o subir archivos. Selecciona la imagen principal para el anuncio.",
    photosHeading: "Fotos del vehículo",
    dropzone: "Arrastra imágenes aquí o usa el botón",
    addPhotos: "Añadir fotos",
    pickerHint: "Se abrirá el selector de archivos del sistema.",
    pickerMultiNote:
      "En escritorio puedes elegir varias fotos a la vez. En algunos teléfonos el selector solo permite una por vez: vuelve a pulsar «Añadir fotos» para más.",
    singleUrl: "Enlace de una imagen",
    batchUrls: "Varias URLs (una por línea)",
    addUrls: "Agregar URLs",
    useLink: "Usar este enlace",
    emptyPhotos: "Aún no hay fotos en el borrador",
    emptyPhotosHint: "Usa «Añadir fotos» o suelta archivos en el área de arriba.",
    principal: "Principal",
    before: "Antes",
    after: "Después",
    remove: "Quitar",
    sourceFile: "Archivo local",
    sourceUrl: "URL",
    secondary: "Secundaria",
    videoHeading: "Video / recorrido",
    videoDraftNote:
      "En borrador, el video se muestra localmente en tu dispositivo. Solo se enviará a Mux al publicar. Si hay archivo local, tiene prioridad sobre el enlace.",
    videoLinkTab: "Enlace",
    videoFileTab: "Archivo local",
    removeVideo: "Quitar video",
    videoUrlLabel: "URL del video",
    useVideoUrl: "Usar este enlace",
    videoUrlSaved: "Video por enlace — guardado en el borrador",
    chooseVideo: "Elegir archivo de video",
    videoReady: "Video guardado en el borrador (local)",
    videoReplace: "Reemplazar",
    videoFileHint: "Selecciona un archivo; se guarda solo en este dispositivo.",
    videoChooseMode: "Elige enlace o archivo para el video.",
    logoHeading: "Logo del concesionario",
    logoUrlHint: "URL o archivo. Confirma la URL con el botón.",
    logoUrlLabel: "URL del logo",
    useLogoUrl: "Usar esta URL",
    logoUrlSaved: "Logo confirmado en el borrador (URL)",
    uploadLogo: "Subir logo desde archivo",
    uploadLogoHint: "Abre el selector de archivos al instante.",
    logoPreviewTitle: "Logo confirmado en el borrador",
    logoPreviewFile: "Archivo local (solo en este dispositivo)",
    logoPreviewUrl: "Desde URL",
    removeLogo: "Quitar logo",
  },
  preview: {
    chrome: {
      breadcrumbClassifieds: "Clasificados",
      breadcrumbAutos: "Autos",
      breadcrumbDealers: "Negocios",
      backToEdit: "Volver a editar",
    },
    empty: {
      kicker: "Vista previa del anuncio",
      title: "Completa la información en Publicar para ver cómo aparecerá tu anuncio.",
      body: "Los campos vacíos no se mostrarán al comprador: galería, especificaciones y datos del negocio aparecerán aquí conforme los vayas añadiendo.",
      cta: "Ir a Publicar",
      footnote: "Borrador · solo en este dispositivo",
    },
    title: {
      mileage: "Millaje",
      location: "Ubicación",
      vin: "VIN",
      stock: "N.º de stock",
      priceLabel: "Precio",
    },
    analytics: {
      kicker: "Rendimiento",
      views: "Vistas",
      saves: "Guardados",
      shares: "Compartidos",
      contacts: "Contactos",
      footnote:
        "Cifras de ejemplo en borrador. Tras publicar, verás métricas reales en tu panel y aquí cuando estén conectadas.",
    },
    sidebar: {
      priceAdvertised: "Precio anunciado",
      whatsappCta: "WhatsApp",
      call: "Llamar",
      scheduleAppointment: "Agendar cita",
      viewWebsite: "Ver sitio web",
    },
    specs: {
      title: "Especificaciones",
      subtitle: "Datos verificados por el concesionario",
      rows: {
        year: "Año",
        make: "Marca",
        model: "Modelo",
        trim: "Versión / trim",
        body: "Estilo de carrocería",
        drive: "Tracción",
        trans: "Transmisión",
        eng: "Motor",
        fuel: "Combustible",
        mpg: "Rendimiento (ciudad / carretera)",
        ex: "Color exterior",
        in: "Color interior",
        doors: "Puertas",
        seats: "Asientos",
        cond: "Condición",
        title: "Estado del título",
        vin: "VIN",
        stock: "N.º de stock",
        mi: "Millaje",
      },
    },
    highlights: {
      title: "Destacados",
      subtitle: "Equipamiento seleccionado por el vendedor",
    },
    description: {
      title: "Descripción del concesionario",
      byline: (dealer) => `Resumen proporcionado por ${dealer}`,
    },
    related: {
      title: "Más autos de este negocio",
      subtitle: "Solo inventario del mismo concesionario",
      details: "Ver detalles",
    },
    gallery: {
      vehicleFallback: "Vehículo",
      morePhotos: (n) => `${n} fotos adicionales`,
      viewAlt: (i) => ` — vista ${i + 2}`,
      videoBadge: "Recorrido en video",
      videoAria: "Abrir video del vehículo",
    },
    dealer: {
      logoAltFallback: "Concesionario",
      hoursHeading: "Horario",
    },
  },
  taxonomy: {
    condition: [
      { value: "", label: "Seleccionar…" },
      { value: "new", label: "Nuevo" },
      { value: "used", label: "Usado" },
      { value: "certified", label: "Certificado" },
    ],
    selectEmpty: "Seleccionar…",
    transmission: ["", "Automática", "Automática de doble embrague", "Manual", "CVT", OTHER],
    drivetrain: ["", "FWD", "RWD", "AWD", "4WD", OTHER],
    fuel: ["", "Gasolina", "Gasolina premium", "Diésel", "Híbrido", "Híbrido enchufable", "Eléctrico", OTHER],
    bodyStyle: ["", "Sedán", "SUV", "Pickup", "Coupe", "Hatchback", "Minivan", "Convertible", "Wagon", OTHER],
    exterior: ["", "Negro", "Blanco", "Gris", "Plateado", "Azul", "Rojo", OTHER],
    interior: ["", "Negro", "Beige", "Gris", "Marrón", OTHER],
    titleStatus: ["", "Título limpio", "Salvamento", "Título reconstruido", OTHER],
    badges: [
      { key: "certified", label: "Certificado" },
      { key: "new", label: "Nuevo" },
      { key: "used", label: "Usado" },
      { key: "clean_title", label: "Título limpio" },
      { key: "one_owner", label: "Un dueño" },
      { key: "low_miles", label: "Bajo millaje" },
      { key: "dealer_maintained", label: "Mantenido por el dealer" },
    ],
    features: [
      "Cámara de reversa",
      "Monitor de punto ciego",
      "Apple CarPlay",
      "Android Auto",
      "Control crucero adaptativo",
      "Techo panorámico",
      "Asientos calefactables",
      "Navegación",
      "Remote start",
      "AWD / 4WD",
      "Tercera fila",
    ],
  },
  weekdayTemplate: [
    { rowId: "weekday-0", day: "Lunes", open: "09:00", close: "18:00", closed: false },
    { rowId: "weekday-1", day: "Martes", open: "09:00", close: "18:00", closed: false },
    { rowId: "weekday-2", day: "Miércoles", open: "09:00", close: "18:00", closed: false },
    { rowId: "weekday-3", day: "Jueves", open: "09:00", close: "18:00", closed: false },
    { rowId: "weekday-4", day: "Viernes", open: "09:00", close: "18:00", closed: false },
    { rowId: "weekday-5", day: "Sábado", open: "10:00", close: "16:00", closed: false },
    { rowId: "weekday-6", day: "Domingo", open: "", close: "", closed: true },
  ],
};

const EN: AutosNegociosCopy = {
  meta: {
    applicationTitle: "Autos · Dealership — Publish",
    previewTitle: "Preview — Auto · Dealership",
  },
  app: {
    kicker: "Publish · Classifieds",
    pageTitle: "Autos · Dealership",
    intro: "Complete your inventory listing. Preview shows the same page buyers will see on Leonix.",
    badgeLocal: "Local draft",
    badgeAutosave: "Auto-saved",
    noteTitle: "Preview matches the published page",
    noteBody:
      "Fields you fill appear in preview. Empty fields stay hidden for buyers—the listing adapts and only shows what you add.",
    sections: {
      main: "Main vehicle information",
      mainSub: "Basic listing details.",
      specs: "Specifications",
      badges: "Badges & highlights",
      media: "Photos & media",
      dealer: "Dealership information",
      description: "Description",
    },
    labels: {
      year: "Year",
      make: "Make",
      model: "Model",
      trim: "Trim",
      condition: "Condition",
      price: "Price (USD)",
      monthly: "Estimated monthly payment",
      mileage: "Mileage",
      city: "City",
      state: "State",
      zip: "ZIP code",
      vin: "VIN",
      stock: "Stock number",
      engine: "Engine",
      transmission: "Transmission",
      drivetrain: "Drivetrain",
      fuel: "Fuel",
      bodyStyle: "Body style",
      exteriorColor: "Exterior color",
      interiorColor: "Interior color",
      titleStatus: "Title status",
      mpgCity: "MPG city",
      mpgHighway: "MPG highway",
      doors: "Doors",
      seats: "Seats",
      dealerName: "Dealership name",
      phoneOffice: "Office phone",
      phoneMobile: "Personal / mobile phone (optional)",
      whatsapp: "WhatsApp",
      website: "Website",
      bookingUrl: "Booking appointment URL",
      address: "Address",
    },
    placeholders: {
      monthly: "e.g. From $450/mo",
      whatsapp: "+1 408 555 0100",
      https: "https://…",
      description: "Describe the vehicle in your dealership’s voice.",
      city: "Type and pick a city",
      zip: "e.g. 95112",
    },
    hints: {
      transmission: "Specify the transmission.",
      drivetrain: "Describe drivetrain or choose another option.",
      fuel: "Describe the fuel type.",
      bodyStyle: "Describe the body style.",
      exterior: "Enter exterior color.",
      interior: "Enter interior color.",
      titleStatus: "Describe title status.",
      transPh: "e.g. 6-speed manual",
      drivePh: "Describe drivetrain",
      fuelPh: "Describe fuel type",
      bodyPh: "Describe body style",
      extPh: "Exterior color",
      intPh: "Interior color",
      titlePh: "Describe title status",
      cityNorCal: "NorCal list: pick a canonical city for filters and data quality.",
      monthlyOptional: "Optional. Only if you want to show an estimated monthly payment.",
      whatsapp: "Include country code (e.g. +1). Preview opens WhatsApp with a normalized wa.me link.",
      bookingUrl:
        "Link to your scheduling tool, Calendly, or test-drive booking page. If empty, the appointment button is hidden in preview.",
      phoneMobile: "Optional. Not shown as a second call button on preview; stored for internal or future use.",
      zip: "5-digit US ZIP. Optional; improves search and future geofencing.",
    },
    actions: { preview: "View preview", reset: "Reset draft" },
    dealer: {
      socialHeading: "Social links",
      applyHoursTemplate: "Apply Mon–Sun schedule template",
      addHoursRow: "Add hours row",
      day: "Day",
      open: "Opens",
      close: "Closes",
      closed: "Closed",
      remove: "Remove",
      newDayPlaceholder: "Day",
      socialLabels: {
        instagram: "Instagram",
        facebook: "Facebook",
        youtube: "YouTube",
        tiktok: "TikTok",
        website: "Website / link",
      },
    },
    titleBlock: {
      title: "Listing title",
      customize: "Customize title",
      hint: "Default: year, make, model, and trim. Check the box to edit manually.",
    },
    equipmentHeading: "Equipment",
  },
  media: {
    sectionTitle: "Photos & media",
    sectionIntro: "Paste URLs or upload files. Choose the primary image for the listing.",
    photosHeading: "Vehicle photos",
    dropzone: "Drag images here or use the button",
    addPhotos: "Add photos",
    pickerHint: "Your system file picker will open.",
    pickerMultiNote:
      "On desktop you can pick several photos at once. Some phones only allow one file per pick—tap “Add photos” again to add more.",
    singleUrl: "Image URL",
    batchUrls: "Multiple URLs (one per line)",
    addUrls: "Add URLs",
    useLink: "Use this link",
    emptyPhotos: "No photos in the draft yet",
    emptyPhotosHint: "Use “Add photos” or drop files in the area above.",
    principal: "Primary",
    before: "Before",
    after: "After",
    remove: "Remove",
    sourceFile: "Local file",
    sourceUrl: "URL",
    secondary: "Secondary",
    videoHeading: "Video / walkaround",
    videoDraftNote:
      "In draft, video plays locally on your device. It will only be sent to Mux when you publish. A local file takes priority over a link.",
    videoLinkTab: "Link",
    videoFileTab: "Local file",
    removeVideo: "Remove video",
    videoUrlLabel: "Video URL",
    useVideoUrl: "Use this link",
    videoUrlSaved: "Video via link — saved in draft",
    chooseVideo: "Choose video file",
    videoReady: "Video saved in draft (local)",
    videoReplace: "Replace",
    videoFileHint: "Pick a file; it stays on this device only.",
    videoChooseMode: "Choose a link or a file for video.",
    logoHeading: "Dealership logo",
    logoUrlHint: "URL or file. Confirm the URL with the button.",
    logoUrlLabel: "Logo URL",
    useLogoUrl: "Use this URL",
    logoUrlSaved: "Logo confirmed in draft (URL)",
    uploadLogo: "Upload logo from file",
    uploadLogoHint: "Opens the file picker immediately.",
    logoPreviewTitle: "Logo confirmed in draft",
    logoPreviewFile: "Local file (this device only)",
    logoPreviewUrl: "From URL",
    removeLogo: "Remove logo",
  },
  preview: {
    chrome: {
      breadcrumbClassifieds: "Classifieds",
      breadcrumbAutos: "Autos",
      breadcrumbDealers: "Dealers",
      backToEdit: "Back to edit",
    },
    empty: {
      kicker: "Listing preview",
      title: "Complete the Publish form to see how your listing will look.",
      body: "Empty fields stay hidden for buyers—gallery, specs, and dealership details will appear here as you add them.",
      cta: "Go to Publish",
      footnote: "Draft · this device only",
    },
    title: {
      mileage: "Mileage",
      location: "Location",
      vin: "VIN",
      stock: "Stock #",
      priceLabel: "Price",
    },
    analytics: {
      kicker: "Performance",
      views: "Views",
      saves: "Saves",
      shares: "Shares",
      contacts: "Contacts",
      footnote: "Sample figures while drafting. After publish, real metrics will appear in your dashboard and here when wired.",
    },
    sidebar: {
      priceAdvertised: "Advertised price",
      whatsappCta: "WhatsApp",
      call: "Call",
      scheduleAppointment: "Schedule appointment",
      viewWebsite: "View website",
    },
    specs: {
      title: "Specifications",
      subtitle: "Information provided by the dealership",
      rows: {
        year: "Year",
        make: "Make",
        model: "Model",
        trim: "Trim",
        body: "Body style",
        drive: "Drivetrain",
        trans: "Transmission",
        eng: "Engine",
        fuel: "Fuel",
        mpg: "Fuel economy (city / highway)",
        ex: "Exterior color",
        in: "Interior color",
        doors: "Doors",
        seats: "Seats",
        cond: "Condition",
        title: "Title status",
        vin: "VIN",
        stock: "Stock #",
        mi: "Mileage",
      },
    },
    highlights: {
      title: "Highlights",
      subtitle: "Equipment selected by the seller",
    },
    description: {
      title: "Dealership description",
      byline: (dealer) => `Summary provided by ${dealer}`,
    },
    related: {
      title: "More vehicles from this dealer",
      subtitle: "Same dealership inventory only",
      details: "View details",
    },
    gallery: {
      vehicleFallback: "Vehicle",
      morePhotos: (n) => `${n} more photos`,
      viewAlt: (i) => ` — view ${i + 2}`,
      videoBadge: "Video walkaround",
      videoAria: "Open vehicle video",
    },
    dealer: {
      logoAltFallback: "Dealership",
      hoursHeading: "Hours",
    },
  },
  taxonomy: {
    condition: [
      { value: "", label: "Select…" },
      { value: "new", label: "New" },
      { value: "used", label: "Used" },
      { value: "certified", label: "Certified" },
    ],
    selectEmpty: "Select…",
    transmission: ["", "Automatic", "Dual-clutch automatic", "Manual", "CVT", OTHER],
    drivetrain: ["", "FWD", "RWD", "AWD", "4WD", OTHER],
    fuel: ["", "Gasoline", "Premium gasoline", "Diesel", "Hybrid", "Plug-in hybrid", "Electric", OTHER],
    bodyStyle: ["", "Sedan", "SUV", "Pickup", "Coupe", "Hatchback", "Minivan", "Convertible", "Wagon", OTHER],
    exterior: ["", "Black", "White", "Gray", "Silver", "Blue", "Red", OTHER],
    interior: ["", "Black", "Beige", "Gray", "Brown", OTHER],
    titleStatus: ["", "Clean title", "Salvage", "Rebuilt title", OTHER],
    badges: [
      { key: "certified", label: "Certified" },
      { key: "new", label: "New" },
      { key: "used", label: "Used" },
      { key: "clean_title", label: "Clean title" },
      { key: "one_owner", label: "One owner" },
      { key: "low_miles", label: "Low miles" },
      { key: "dealer_maintained", label: "Dealer maintained" },
    ],
    features: [
      "Backup camera",
      "Blind spot monitor",
      "Apple CarPlay",
      "Android Auto",
      "Adaptive cruise control",
      "Panoramic roof",
      "Heated seats",
      "Navigation",
      "Remote start",
      "AWD / 4WD",
      "Third row",
    ],
  },
  weekdayTemplate: [
    { rowId: "weekday-0", day: "Monday", open: "09:00", close: "18:00", closed: false },
    { rowId: "weekday-1", day: "Tuesday", open: "09:00", close: "18:00", closed: false },
    { rowId: "weekday-2", day: "Wednesday", open: "09:00", close: "18:00", closed: false },
    { rowId: "weekday-3", day: "Thursday", open: "09:00", close: "18:00", closed: false },
    { rowId: "weekday-4", day: "Friday", open: "09:00", close: "18:00", closed: false },
    { rowId: "weekday-5", day: "Saturday", open: "10:00", close: "16:00", closed: false },
    { rowId: "weekday-6", day: "Sunday", open: "", close: "", closed: true },
  ],
};

export function getAutosNegociosCopy(lang: AutosNegociosLang): AutosNegociosCopy {
  return lang === "en" ? EN : ES;
}
