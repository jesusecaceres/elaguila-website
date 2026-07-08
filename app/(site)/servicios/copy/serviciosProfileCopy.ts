import type { ServiciosLang } from "../types/serviciosBusinessProfile";

export function getServiciosCredentialsCardCopy(lang: ServiciosLang) {
  if (lang === "en") {
    return {
      title: "License, insurance & certifications",
      subtitle: "Information provided by the advertiser.",
      licenseProvided: "License provided",
      insuranceProvided: "Insurance provided",
      licenseType: "License type",
      licenseNumber: "License #",
      issuingAuthority: "Issuing authority or state",
      expires: "Expires",
      certifications: "Certifications",
      viewDocument: "View document",
      viewLicenseDocument: "View license document",
      viewInsuranceDocument: "View insurance document",
      viewCertificate: "View certificate",
    };
  }
  return {
    title: "Licencia, seguro y certificaciones",
    subtitle: "Información proporcionada por el anunciante.",
    licenseProvided: "Licencia proporcionada",
    insuranceProvided: "Seguro proporcionado",
    licenseType: "Tipo de licencia",
    licenseNumber: "Núm. licencia",
    issuingAuthority: "Autoridad o estado emisor",
    expires: "Vence",
    certifications: "Certificaciones",
    viewDocument: "Ver documento",
    viewLicenseDocument: "Ver documento de licencia",
    viewInsuranceDocument: "Ver documento de seguro",
    viewCertificate: "Ver certificado",
  };
}

export function getServiciosSmartTrustSummaryCopy(lang: ServiciosLang) {
  if (lang === "en") {
    return {
      title: "Quick summary",
      subtitle: "Why consider this business",
    };
  }
  return {
    title: "Resumen rápido",
    subtitle: "Por qué considerar este negocio",
  };
}

export function getServiciosPromocionesSectionCopy(lang: ServiciosLang) {
  if (lang === "en") {
    return {
      sectionTitle: "Special offers",
    };
  }
  return {
    sectionTitle: "Ofertas especiales",
  };
}

export function getServiciosProfileLabels(lang: ServiciosLang) {
  if (lang === "en") {
    return {
      reviewsSuffix: (n: number) => `(${n} reviews)`,
      openNow: "Open now",
      closed: "Closed",
      requestQuote: "Request quote",
      whatsapp: "WhatsApp",
      callOffice: "Call office",
      call: "Call",
      email: "Email",
      message: "Message",
      viewDetails: "View details",
      attachPhoto: "Attach photo",
      send: "Send",
      about: "About us",
      services: "Our services",
      servicesSectionSubtitle: "Choose the service you need and contact the business directly.",
      highlightsTitle: "Business highlights",
      highlightsSubtitle: "Details that help customers understand how this business works.",
      highlightsSeeAll: "See all highlights",
      highlightsShowLess: "Show less",
      gallery: "Project gallery",
      galleryAndVideos: "Gallery & Videos",
      exploreGalleryAndVideos: "Explore photos & videos",
      featuredCouponsTitle: "Featured coupons & offers",
      featuredCouponsSubtitle: "Save or share these offers before contacting the business.",
      trust: "Why choose us",
      reviews: "Customer reviews",
      serviceAreas: "Service areas",
      offerTitle: "Special offer",
      visitWebsite: "Visit website",
      featured: "Featured",
      reviewsSummary: (rating: number, count: number) => `${rating} (${count} reviews)`,
      galleryMore: "More photos",
      promoViewImage: "View image",
      promoViewPdf: "View PDF",
      promoCouponBadge: "Special offer",
      promoModalClose: "Close",
      promoImageLightboxAria: "Promotion image",
      videoTour: "Video",
      weeklyHours: "Weekly hours",
      physicalLocation: "Location",
      openInMaps: "Open in Maps",
      showMoreServices: "See all services",
      showLessServices: "Show less",
      paymentsTitle: "Payments",
    };
  }
  return {
    reviewsSuffix: (n: number) => `(${n} reseñas)`,
    openNow: "Abierto ahora",
    closed: "Cerrado",
    requestQuote: "Solicitar cotización",
    whatsapp: "WhatsApp",
    callOffice: "Llamar oficina",
    call: "Llamar",
    email: "Correo",
    message: "Mensaje",
    viewDetails: "Ver detalles",
    attachPhoto: "Adjuntar foto",
    send: "Enviar",
    about: "Sobre nosotros",
    services: "Nuestros servicios",
    servicesSectionSubtitle: "Elige el servicio que necesitas y solicita información directamente.",
    highlightsTitle: "Highlights del negocio",
    highlightsSubtitle: "Detalles que ayudan a conocer mejor cómo trabaja este negocio.",
    highlightsSeeAll: "Ver todos los destacados",
    highlightsShowLess: "Ver menos",
    gallery: "Galería de trabajos",
    galleryAndVideos: "Galería y Videos",
    exploreGalleryAndVideos: "Explorar fotos y videos",
    featuredCouponsTitle: "Cupones y ofertas destacadas",
    featuredCouponsSubtitle: "Guarda o comparte estas ofertas antes de contactar al negocio.",
    trust: "¿Por qué elegirnos?",
    reviews: "Reseñas de clientes",
    serviceAreas: "Zonas de servicio",
    offerTitle: "Oferta especial",
    visitWebsite: "Visitar sitio web",
    featured: "Destacado",
    reviewsSummary: (rating: number, count: number) => `${rating} (${count} reseñas)`,
    galleryMore: "Más fotos",
    promoViewImage: "Ver imagen",
    promoViewPdf: "Ver PDF",
    promoCouponBadge: "Oferta especial",
    promoModalClose: "Cerrar",
    promoImageLightboxAria: "Imagen de la promoción",
    videoTour: "Video",
    weeklyHours: "Horario de la semana",
    physicalLocation: "Ubicación",
    openInMaps: "Abrir en mapa",
    showMoreServices: "Ver todos los servicios",
    showLessServices: "Ver menos",
    paymentsTitle: "Pagos",
  };
}
