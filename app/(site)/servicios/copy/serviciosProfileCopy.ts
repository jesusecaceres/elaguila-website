import type { ServiciosLang } from "../types/serviciosBusinessProfile";

export function getServiciosCredentialsCardCopy(lang: ServiciosLang) {
  if (lang === "en") {
    return {
      title: "Credentials",
      subtitle:
        "Information provided by the business to help you evaluate trust and experience.",
      licenseProvided: "License provided",
      insuranceProvided: "Insurance provided",
      licenseType: "License type",
      licenseNumber: "License #",
      issuingAuthority: "Issuing authority or state",
      expires: "Expires",
      certifications: "Certifications",
      viewDocument: "View document",
    };
  }
  return {
    title: "Credenciales",
    subtitle:
      "Información proporcionada por el negocio para ayudarte a evaluar confianza y experiencia.",
    licenseProvided: "Licencia proporcionada",
    insuranceProvided: "Seguro proporcionado",
    licenseType: "Tipo de licencia",
    licenseNumber: "Núm. licencia",
    issuingAuthority: "Autoridad o estado emisor",
    expires: "Vence",
    certifications: "Certificaciones",
    viewDocument: "Ver documento",
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
