import type { ServiciosApplicationDraft } from "../types/serviciosApplicationDraft";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";

const IMG = {
  logo: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=200&h=200&fit=crop",
  cover: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1600&h=700&fit=crop",
  map: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=400&fit=crop",
  s1: "https://images.unsplash.com/photo-1585704032915-cbd0c7ff3e61?w=600&h=400&fit=crop",
  s2: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=600&h=400&fit=crop",
  s3: "https://images.unsplash.com/photo-1563453392212-869cfe3ad210?w=600&h=400&fit=crop",
  s4: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=400&fit=crop",
  g1: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop",
  g2: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=500&fit=crop",
  g3: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=500&fit=crop",
  g4: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=500&fit=crop",
} as const;

/** Full reference profile (ES) — same content target as the original demo wire profile */
export const serviciosApplicationDraftExpertEs: ServiciosApplicationDraft = {
  identity: { slug: "expert-home-solutions", businessName: "Expert Home Solutions" },
  hero: {
    categoryLine: "Plomería, Electricidad y Remodelación",
    logoUrl: IMG.logo,
    logoAlt: "Logotipo de Expert Home Solutions",
    coverImageUrl: IMG.cover,
    coverImageAlt: "Profesional trabajando en el exterior de una casa",
    rating: 4.9,
    reviewCount: 87,
    locationSummary: "Houston, TX y alrededores",
    badges: [
      { kind: "verified", label: "Verificado" },
      { kind: "licensed", label: "Licenciado" },
      { kind: "spanish", label: "Se Habla Español" },
    ],
  },
  contact: {
    isFeatured: true,
    featuredLabel: "Destacado",
    phone: "(332) 123-4567",
    websiteUrl: "https://example.com",
    websiteLabel: "Sitio web",
    messageEnabled: true,
    hoursOpenNowLabel: "Abierto ahora",
    hoursTodayLine: "8:00 AM - 6:00 PM",
    primaryCtaLabel: "Solicitar cotización",
  },
  quickFacts: [
    { kind: "years_experience", label: "19 años de experiencia" },
    { kind: "response_time", label: "Responde en 1 hora" },
    { kind: "free_estimate", label: "Estimado gratis" },
    { kind: "custom", label: "Servicio de emergencia" },
  ],
  about: {
    aboutText:
      "Somos un equipo familiar de plomeros y electricistas con casi dos décadas sirviendo a hogares en Houston y comunidades vecinas. Nos enfocamos en diagnósticos honestos, precios transparentes y trabajo que dura. Ya sea una fuga urgente, un panel eléctrico que necesita atención o una renovación completa, tratamos su hogar con el mismo cuidado que el nuestro.",
    specialtiesLine:
      "Especialidades: plomería residencial, actualizaciones eléctricas con código, remodelación de cocinas y baños.",
  },
  services: [
    {
      id: "1",
      title: "Reparación de plomería",
      secondaryLine: "Desde $80",
      imageUrl: IMG.s1,
      imageAlt: "Reparación de plomería",
    },
    {
      id: "2",
      title: "Servicios eléctricos",
      secondaryLine: "Desde $95",
      imageUrl: IMG.s2,
      imageAlt: "Electricista en trabajo",
    },
    {
      id: "3",
      title: "Instalación de luminarias",
      secondaryLine: "Cotización gratis",
      imageUrl: IMG.s3,
      imageAlt: "Instalación de luminarias",
    },
    {
      id: "4",
      title: "Remodelación de baños",
      secondaryLine: "Paquetes desde $2,500",
      imageUrl: IMG.s4,
      imageAlt: "Baño remodelado",
    },
  ],
  gallery: [
    { id: "g1", url: IMG.g1, alt: "Sala renovada" },
    { id: "g2", url: IMG.g2, alt: "Cocina moderna" },
    { id: "g3", url: IMG.g3, alt: "Detalle eléctrico" },
    { id: "g4", url: IMG.g4, alt: "Exterior de hogar" },
  ],
  trust: [
    { id: "t1", label: "Licenciado y asegurado", icon: "shield" },
    { id: "t2", label: "Verificación de antecedentes", icon: "shieldCheck" },
    { id: "t3", label: "Negocio familiar", icon: "star" },
    { id: "t4", label: "Servicio el mismo día", icon: "clock" },
  ],
  reviews: [
    {
      id: "r1",
      authorName: "Ana M.",
      quote:
        "Llegaron el mismo día, explicaron el problema sin presión y dejaron todo limpio. Muy profesionales.",
      rating: 5,
    },
    {
      id: "r2",
      authorName: "Carlos R.",
      quote:
        "Actualizaron nuestro panel y luces. Trabajo impecable y cumplieron el presupuesto acordado.",
      rating: 5,
    },
  ],
  serviceAreas: {
    items: [
      { id: "a1", label: "Houston, TX", kind: "city" },
      { id: "a2", label: "Katy", kind: "city" },
      { id: "a3", label: "Sugar Land", kind: "city" },
      { id: "a4", label: "Pearland", kind: "city" },
      { id: "a5", label: "The Woodlands", kind: "region" },
    ],
    mapImageUrl: IMG.map,
  },
  promo: {
    id: "p1",
    headline: "$50 de descuento en tu primer servicio",
    footnote: "Aplican términos y condiciones.",
  },
};

export const serviciosApplicationDraftExpertEn: ServiciosApplicationDraft = {
  ...serviciosApplicationDraftExpertEs,
  hero: {
    ...serviciosApplicationDraftExpertEs.hero,
    categoryLine: "Plumbing, Electrical & Remodeling",
    coverImageAlt: "Professional working on a home exterior",
    badges: [
      { kind: "verified", label: "Verified" },
      { kind: "licensed", label: "Licensed" },
      { kind: "spanish", label: "Spanish spoken" },
    ],
    locationSummary: "Houston, TX and surrounding areas",
  },
  contact: {
    ...serviciosApplicationDraftExpertEs.contact,
    featuredLabel: "Featured",
    websiteLabel: "Website",
    hoursOpenNowLabel: "Open now",
    hoursTodayLine: "8:00 AM - 6:00 PM",
    primaryCtaLabel: "Request quote",
  },
  quickFacts: [
    { kind: "years_experience", label: "19 years of experience" },
    { kind: "response_time", label: "Responds within 1 hour" },
    { kind: "free_estimate", label: "Free estimate" },
    { kind: "custom", label: "Emergency service" },
  ],
  about: {
    aboutText:
      "We are a family team of plumbers and electricians with nearly two decades serving homes in Houston and nearby communities. We focus on honest diagnostics, transparent pricing, and work that lasts. Whether it is an urgent leak, an electrical panel that needs attention, or a full remodel, we treat your home with the same care as our own.",
    specialtiesLine:
      "Specialties: residential plumbing, code-compliant electrical upgrades, kitchen and bath remodeling.",
  },
  services: [
    {
      id: "1",
      title: "Plumbing repair",
      secondaryLine: "From $80",
      imageUrl: IMG.s1,
      imageAlt: "Plumbing repair",
    },
    {
      id: "2",
      title: "Electrical services",
      secondaryLine: "From $95",
      imageUrl: IMG.s2,
      imageAlt: "Electrician at work",
    },
    {
      id: "3",
      title: "Lighting installation",
      secondaryLine: "Free quote",
      imageUrl: IMG.s3,
      imageAlt: "Lighting installation",
    },
    {
      id: "4",
      title: "Bath remodeling",
      secondaryLine: "Packages from $2,500",
      imageUrl: IMG.s4,
      imageAlt: "Remodeled bathroom",
    },
  ],
  gallery: [
    { id: "g1", url: IMG.g1, alt: "Renovated living room" },
    { id: "g2", url: IMG.g2, alt: "Modern kitchen" },
    { id: "g3", url: IMG.g3, alt: "Electrical detail" },
    { id: "g4", url: IMG.g4, alt: "Home exterior" },
  ],
  trust: [
    { id: "t1", label: "Licensed & insured", icon: "shield" },
    { id: "t2", label: "Background checked", icon: "shieldCheck" },
    { id: "t3", label: "Family owned", icon: "star" },
    { id: "t4", label: "Same-day service", icon: "clock" },
  ],
  reviews: [
    {
      id: "r1",
      authorName: "Ana M.",
      quote:
        "They came the same day, explained the issue with no pressure, and left everything clean. Very professional.",
      rating: 5,
    },
    {
      id: "r2",
      authorName: "Carlos R.",
      quote: "They upgraded our panel and lighting. Flawless work and they stayed on budget.",
      rating: 5,
    },
  ],
  promo: {
    id: "p1",
    headline: "$50 off your first service",
    footnote: "Terms and conditions apply.",
  },
};

/** Medium completeness — premium with fewer sections */
export const serviciosApplicationDraftMediumEs: ServiciosApplicationDraft = {
  identity: { slug: "midtown-repair-demo", businessName: "Midtown Home Repair" },
  hero: {
    primaryCategory: "Reparaciones del hogar",
    subcategory: "Plomería y electricidad",
    coverImageUrl:
      "https://images.unsplash.com/photo-1581578949510-fa7315c4c350?w=1600&h=700&fit=crop",
    coverImageAlt: "Técnico en hogar",
    rating: 4.7,
    reviewCount: 24,
    locationSummary: "Centro y norte de Houston",
  },
  contact: {
    phone: "(713) 555-0100",
    websiteUrl: "https://example.com/midtown",
    websiteLabel: "Sitio web",
    messageEnabled: false,
    hoursOpenNowLabel: "Abierto ahora",
    hoursTodayLine: "9:00 AM - 5:00 PM",
    primaryCtaLabel: "Solicitar cotización",
  },
  quickFacts: [{ kind: "response_time", label: "Responde el mismo día" }],
  about: {
    aboutText:
      "Equipo pequeño enfocado en reparaciones confiables. Cotización clara antes de empezar y seguimiento después del trabajo.",
  },
  services: [
    {
      id: "m1",
      title: "Reparaciones urgentes",
      secondaryLine: "Desde $95",
      imageUrl: IMG.s1,
      imageAlt: "Reparación",
    },
    {
      id: "m2",
      title: "Instalaciones menores",
      secondaryLine: "Cotización gratis",
      imageUrl: IMG.s2,
      imageAlt: "Instalación",
    },
  ],
};

/** Sparse — identity, about, contact, two services, one area list (no map) */
export const serviciosApplicationDraftSparseEs: ServiciosApplicationDraft = {
  identity: { slug: "minimal-demo", businessName: "Servicios Demo Mínimo" },
  hero: {
    categoryLine: "Servicios generales",
    coverImageUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&h=700&fit=crop",
    coverImageAlt: "Banner",
  },
  contact: {
    phone: "(555) 000-0000",
    primaryCtaLabel: "Solicitar cotización",
  },
  about: {
    aboutText:
      "Este perfil muestra el diseño cuando solo hay información esencial. Las secciones vacías no aparecen.",
  },
  services: [
    {
      id: "s1",
      title: "Consulta general",
      secondaryLine: "Cotización gratis",
      imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop",
      imageAlt: "Servicio",
    },
    {
      id: "s2",
      title: "Segunda visita",
      secondaryLine: "Desde $50",
      imageUrl: IMG.s2,
      imageAlt: "Segunda visita",
    },
  ],
  serviceAreas: {
    items: [{ id: "a1", label: "Austin, TX y alrededores", kind: "region" }],
  },
};

export type ServiciosDraftSampleId = "expert" | "full" | "medium" | "sparse" | "minimal";

export function getServiciosApplicationDraftSample(
  id: string | null | undefined,
  lang: ServiciosLang
): ServiciosApplicationDraft {
  const key = (id || "expert").toLowerCase();
  if (key === "medium") return serviciosApplicationDraftMediumEs;
  if (key === "sparse" || key === "minimal") return serviciosApplicationDraftSparseEs;
  if (key === "full" || key === "expert") {
    return lang === "en" ? serviciosApplicationDraftExpertEn : serviciosApplicationDraftExpertEs;
  }
  return lang === "en" ? serviciosApplicationDraftExpertEn : serviciosApplicationDraftExpertEs;
}
