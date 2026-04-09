/**
 * Phase 2: Quick Job detail shell — template-ready shape for a future application mapping.
 */

export type QuickJobRelatedCard = {
  id: string;
  imageSrc: string;
  imageAlt: string;
  title: string;
  businessName: string;
  location: string;
  pay: string;
  jobType: string;
};

export type QuickJobLocationBlock = {
  businessLine: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
};

export function hasQuickJobLocation(loc?: QuickJobLocationBlock | null): loc is QuickJobLocationBlock {
  if (!loc) return false;
  const parts = [loc.businessLine, loc.addressLine1, loc.city, loc.state, loc.zip].map((s) => (s ?? "").trim());
  return parts.some(Boolean);
}

export type QuickJobDetailSample = {
  title: string;
  businessName: string;
  logoSrc?: string;
  logoAlt?: string;
  city: string;
  state: string;
  mainImageSrc: string;
  mainImageAlt: string;
  pay: string;
  jobType: string;
  schedule: string;
  description: string;
  benefits: string[];
  phone: string;
  whatsapp: string;
  email: string;
  /** Omit when the ad has no address; location UI hides. */
  location?: QuickJobLocationBlock;
  relatedJobs: QuickJobRelatedCard[];
};

/** Full sample: all sections visible. Replace with API data later. */
export const EMPLEO_QUICK_JOB_SAMPLE: QuickJobDetailSample = {
  title: "Se Busca Cocinero",
  businessName: "Restaurante Los Compadres",
  logoSrc:
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=128&q=80",
  logoAlt: "Logo representativo del restaurante",
  city: "Phoenix",
  state: "AZ",
  mainImageSrc:
    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80",
  mainImageAlt: "Chef cocinando con sartén en llamas",
  pay: "$20/hora",
  jobType: "Tiempo completo",
  schedule: "Lunes a Viernes",
  description:
    "Buscamos cocineros con experiencia en cocina mexicana y parrilla. Ambiente familiar, equipo compacto y horarios estables. Ideal para quien valora la consistencia y el buen ritmo de servicio.",
  benefits: ["Pago semanal en efectivo", "Comida incluida durante el turno"],
  phone: "555-123-4567",
  whatsapp: "15551234567",
  email: "empleos@loscompadres.example.com",
  location: {
    businessLine: "Restaurante: Los Compadres",
    addressLine1: "1234 Avenida Central",
    city: "Phoenix",
    state: "AZ",
    zip: "85004",
  },
  relatedJobs: [
    {
      id: "rel-1",
      imageSrc:
        "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=600&q=80",
      imageAlt: "Lavadero de cocina",
      title: "Lavaplatos",
      businessName: "Cantina El Jalapeño",
      location: "Phoenix, AZ",
      pay: "$16/hora",
      jobType: "Tiempo completo",
    },
    {
      id: "rel-2",
      imageSrc:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
      imageAlt: "Interior de restaurante",
      title: "Ayudante de Cocina",
      businessName: "Taquería El Sabor",
      location: "Tempe, AZ",
      pay: "$17/hora",
      jobType: "Tiempo completo",
    },
    {
      id: "rel-3",
      imageSrc:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80",
      imageAlt: "Caja registradora",
      title: "Cajero / Cajera",
      businessName: "Mercado La Esquina",
      location: "Mesa, AZ",
      pay: "$15/hora",
      jobType: "Medio tiempo",
    },
  ],
};
