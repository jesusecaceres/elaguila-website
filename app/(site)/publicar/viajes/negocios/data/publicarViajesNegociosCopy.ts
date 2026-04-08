import type { Lang } from "@/app/clasificados/config/clasificadosHub";

export type PublicarViajesNegociosUi = {
  documentTitle: string;
  navBack: string;
  h1: string;
  intro: string;
  sections: {
    main: string;
    audience: string;
    media: string;
    business: string;
  };
  offerType: { label: string; options: Record<string, string> };
  ctaType: { label: string; options: Record<string, string> };
  title: { label: string; placeholder: string };
  destination: { label: string; placeholder: string };
  departureCity: { label: string; placeholder: string };
  price: { label: string; placeholder: string };
  duration: { label: string; placeholder: string };
  dates: { label: string; placeholder: string };
  shortDescription: { label: string };
  includes: { label: string; placeholder: string };
  audience: {
    families: string;
    couples: string;
    groups: string;
    spanishGuide: string;
    budgetTag: { label: string; empty: string; economy: string; moderate: string; premium: string };
    serviceLanguage: { label: string };
    includesHotel: string;
    includesTransport: string;
    includesFood: string;
  };
  multimedia: {
    heroUrl: { label: string; placeholder: string };
    gallery: { label: string; helper: string; placeholder: string };
    logo: { label: string };
    video: { label: string; placeholder: string };
  };
  business: {
    name: { label: string };
    phone: { label: string };
    whatsapp: { label: string };
    website: { label: string };
    socials: { label: string; placeholder: string };
    destinationsServed: { label: string; placeholder: string };
    languages: { label: string; placeholder: string };
  };
  previewCta: string;
  submitSoon: string;
};

function es(): PublicarViajesNegociosUi {
  return {
    documentTitle: "Solicitud negocio Viajes · Leonix",
    navBack: "Volver a publicar Viajes",
    h1: "Oferta de viajes — negocio",
    intro: "Borrador estructurado — los campos mapearán a tu ficha pública. Aún no se envía nada.",
    sections: {
      main: "1. Información principal",
      audience: "2. Audiencia y contexto",
      media: "3. Multimedia",
      business: "4. Datos del negocio",
    },
    offerType: {
      label: "Tipo de oferta",
      options: {
        "": "Selecciona…",
        paquete: "Paquete",
        tour: "Tour / excursión",
        crucero: "Crucero",
        resort: "Resort / hotel",
        escapada: "Escapada",
      },
    },
    ctaType: {
      label: "Tipo de CTA principal",
      options: {
        whatsapp: "WhatsApp",
        telefono: "Teléfono",
        correo: "Correo",
        sitio: "Sitio web",
      },
    },
    title: { label: "Título", placeholder: "Ej. Riviera Maya todo incluido 5 noches" },
    destination: { label: "Destino", placeholder: "Ciudad, región o país" },
    departureCity: { label: "Ciudad de salida", placeholder: "Ej. San José, SFO…" },
    price: { label: "Precio / precio desde", placeholder: "USD, por persona…" },
    duration: { label: "Duración", placeholder: "Ej. 5 días / 4 noches" },
    dates: { label: "Fechas o rango", placeholder: "Temporada, meses o fechas fijas" },
    shortDescription: { label: "Descripción corta" },
    includes: { label: "Qué incluye", placeholder: "Un ítem por línea o párrafo breve" },
    audience: {
      families: "Apto para familias",
      couples: "Para parejas",
      groups: "Para grupos",
      spanishGuide: "Guía en español",
      budgetTag: {
        label: "Etiqueta de presupuesto",
        empty: "—",
        economy: "Económico",
        moderate: "Moderado",
        premium: "Premium",
      },
      serviceLanguage: { label: "Idioma de atención" },
      includesHotel: "Incluye hotel",
      includesTransport: "Incluye transporte",
      includesFood: "Incluye comida",
    },
    multimedia: {
      heroUrl: { label: "Imagen principal (URL de prueba)", placeholder: "https://…" },
      gallery: {
        label: "Galería",
        helper: "Pronto: subida múltiple. Por ahora describe o pega URLs.",
        placeholder: "URLs separadas por coma o notas",
      },
      logo: { label: "Logo del negocio (URL opcional)" },
      video: { label: "Video (URL opcional)", placeholder: "YouTube o Vimeo" },
    },
    business: {
      name: { label: "Nombre del negocio" },
      phone: { label: "Teléfono" },
      whatsapp: { label: "WhatsApp" },
      website: { label: "Sitio web" },
      socials: { label: "Redes sociales", placeholder: "@usuario o enlaces" },
      destinationsServed: { label: "Destinos que atienden", placeholder: "Separados por coma" },
      languages: { label: "Idiomas", placeholder: "Ej. Español, inglés" },
    },
    previewCta: "Vista previa de la ficha",
    submitSoon: "Enviar (próximamente)",
  };
}

function en(): PublicarViajesNegociosUi {
  return {
    documentTitle: "Viajes business application · Leonix",
    navBack: "Back to Viajes publishing",
    h1: "Business travel offer",
    intro: "Structured draft — fields will map to your public listing. Nothing is submitted yet.",
    sections: {
      main: "1. Key details",
      audience: "2. Audience and context",
      media: "3. Media",
      business: "4. Business profile",
    },
    offerType: {
      label: "Offer type",
      options: {
        "": "Choose…",
        paquete: "Package",
        tour: "Tour / excursion",
        crucero: "Cruise",
        resort: "Resort / hotel",
        escapada: "Getaway",
      },
    },
    ctaType: {
      label: "Primary CTA type",
      options: {
        whatsapp: "WhatsApp",
        telefono: "Phone",
        correo: "Email",
        sitio: "Website",
      },
    },
    title: { label: "Title", placeholder: "e.g. Riviera Maya all-inclusive, 5 nights" },
    destination: { label: "Destination", placeholder: "City, region, or country" },
    departureCity: { label: "Departure city", placeholder: "e.g. San José, SFO…" },
    price: { label: "Price / from price", placeholder: "USD, per person…" },
    duration: { label: "Duration", placeholder: "e.g. 5 days / 4 nights" },
    dates: { label: "Dates or range", placeholder: "Season, months, or fixed dates" },
    shortDescription: { label: "Short description" },
    includes: { label: "What’s included", placeholder: "One item per line or a short paragraph" },
    audience: {
      families: "Good for families",
      couples: "For couples",
      groups: "For groups",
      spanishGuide: "Spanish-speaking guide",
      budgetTag: {
        label: "Budget tag",
        empty: "—",
        economy: "Economy",
        moderate: "Moderate",
        premium: "Premium",
      },
      serviceLanguage: { label: "Service language" },
      includesHotel: "Includes hotel",
      includesTransport: "Includes transport",
      includesFood: "Includes meals",
    },
    multimedia: {
      heroUrl: { label: "Hero image (test URL)", placeholder: "https://…" },
      gallery: {
        label: "Gallery",
        helper: "Multi-upload coming soon. For now, paste URLs or notes.",
        placeholder: "Comma-separated URLs or notes",
      },
      logo: { label: "Business logo (optional URL)" },
      video: { label: "Video (optional URL)", placeholder: "YouTube or Vimeo" },
    },
    business: {
      name: { label: "Business name" },
      phone: { label: "Phone" },
      whatsapp: { label: "WhatsApp" },
      website: { label: "Website" },
      socials: { label: "Social profiles", placeholder: "@handle or links" },
      destinationsServed: { label: "Destinations you serve", placeholder: "Comma-separated" },
      languages: { label: "Languages", placeholder: "e.g. Spanish, English" },
    },
    previewCta: "Preview public card",
    submitSoon: "Submit (soon)",
  };
}

export function getPublicarViajesNegociosCopy(lang: Lang): PublicarViajesNegociosUi {
  return lang === "en" ? en() : es();
}
