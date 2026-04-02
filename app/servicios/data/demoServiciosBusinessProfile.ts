import type { ServiciosBusinessProfile, ServiciosLang } from "../types/serviciosBusinessProfile";

/** Canonical demo profile aligned with the Servicios reference design (home services). */
export const demoExpertHomeSolutions: ServiciosBusinessProfile = {
  slug: "expert-home-solutions",
  businessName: "Expert Home Solutions",
  categoryLine: "Plomería, Electricidad y Remodelación",
  logoUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=200&h=200&fit=crop",
  logoAlt: "Logotipo de Expert Home Solutions",
  coverImageUrl:
    "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1600&h=700&fit=crop",
  coverImageAlt: "Profesional trabajando en el exterior de una casa",
  rating: 4.9,
  reviewCount: 87,
  isFeatured: true,
  featuredLabel: "Destacado",
  heroBadges: [
    { kind: "verified", label: "Verificado" },
    { kind: "licensed", label: "Licenciado" },
    { kind: "spanish", label: "Se Habla Español" },
  ],
  locationSummary: "Houston, TX y alrededores",
  quickFacts: [
    { kind: "years_experience", label: "19 años de experiencia" },
    { kind: "response_time", label: "Responde en 1 hora" },
    { kind: "free_estimate", label: "Estimado gratis" },
    { kind: "custom", label: "Servicio de emergencia" },
  ],
  aboutText:
    "Somos un equipo familiar de plomeros y electricistas con casi dos décadas sirviendo a hogares en Houston y comunidades vecinas. Nos enfocamos en diagnósticos honestos, precios transparentes y trabajo que dura. Ya sea una fuga urgente, un panel eléctrico que necesita atención o una renovación completa, tratamos su hogar con el mismo cuidado que el nuestro.",
  aboutSpecialtiesLine:
    "Especialidades: plomería residencial, actualizaciones eléctricas con código, remodelación de cocinas y baños.",
  services: [
    {
      id: "1",
      title: "Reparación de plomería",
      secondaryLine: "Desde $80",
      imageUrl: "https://images.unsplash.com/photo-1585704032915-cbd0c7ff3e61?w=600&h=400&fit=crop",
      imageAlt: "Reparación de plomería",
    },
    {
      id: "2",
      title: "Servicios eléctricos",
      secondaryLine: "Desde $95",
      imageUrl: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=600&h=400&fit=crop",
      imageAlt: "Electricista en trabajo",
    },
    {
      id: "3",
      title: "Instalación de luminarias",
      secondaryLine: "Cotización gratis",
      imageUrl: "https://images.unsplash.com/photo-1563453392212-869cfe3ad210?w=600&h=400&fit=crop",
      imageAlt: "Instalación de luminarias",
    },
    {
      id: "4",
      title: "Remodelación de baños",
      secondaryLine: "Paquetes desde $2,500",
      imageUrl: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=400&fit=crop",
      imageAlt: "Baño remodelado",
    },
  ],
  gallery: [
    {
      id: "g1",
      url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop",
      alt: "Sala renovada",
    },
    {
      id: "g2",
      url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=500&fit=crop",
      alt: "Cocina moderna",
    },
    {
      id: "g3",
      url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=500&fit=crop",
      alt: "Detalle eléctrico",
    },
    {
      id: "g4",
      url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=500&fit=crop",
      alt: "Exterior de hogar",
    },
  ],
  trustItems: [
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
  serviceAreas: [
    { id: "a1", label: "Houston, TX", kind: "city" },
    { id: "a2", label: "Katy", kind: "city" },
    { id: "a3", label: "Sugar Land", kind: "city" },
    { id: "a4", label: "Pearland", kind: "city" },
    { id: "a5", label: "The Woodlands", kind: "region" },
  ],
  serviceAreaMapImageUrl:
    "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=400&fit=crop",
  promo: {
    id: "p1",
    headline: "$50 de descuento en tu primer servicio",
    footnote: "Aplican términos y condiciones.",
  },
  phone: "(332) 123-4567",
  websiteUrl: "https://example.com",
  websiteLabel: "Sitio web",
  messageEnabled: true,
  hours: {
    openNowLabel: "Abierto ahora",
    todayHoursLine: "8:00 AM - 6:00 PM",
  },
  primaryCtaLabel: "Solicitar cotización",
};

const demoExpertHomeSolutionsEn: ServiciosBusinessProfile = {
  ...demoExpertHomeSolutions,
  categoryLine: "Plumbing, Electrical & Remodeling",
  coverImageAlt: "Professional working on a home exterior",
  heroBadges: [
    { kind: "verified", label: "Verified" },
    { kind: "licensed", label: "Licensed" },
    { kind: "spanish", label: "Spanish spoken" },
  ],
  locationSummary: "Houston, TX and surrounding areas",
  quickFacts: [
    { kind: "years_experience", label: "19 years of experience" },
    { kind: "response_time", label: "Responds within 1 hour" },
    { kind: "free_estimate", label: "Free estimate" },
    { kind: "custom", label: "Emergency service" },
  ],
  aboutText:
    "We are a family team of plumbers and electricians with nearly two decades serving homes in Houston and nearby communities. We focus on honest diagnostics, transparent pricing, and work that lasts. Whether it is an urgent leak, an electrical panel that needs attention, or a full remodel, we treat your home with the same care as our own.",
  aboutSpecialtiesLine:
    "Specialties: residential plumbing, code-compliant electrical upgrades, kitchen and bath remodeling.",
  services: [
    {
      id: "1",
      title: "Plumbing repair",
      secondaryLine: "From $80",
      imageUrl: demoExpertHomeSolutions.services![0].imageUrl,
      imageAlt: "Plumbing repair",
    },
    {
      id: "2",
      title: "Electrical services",
      secondaryLine: "From $95",
      imageUrl: demoExpertHomeSolutions.services![1].imageUrl,
      imageAlt: "Electrician at work",
    },
    {
      id: "3",
      title: "Lighting installation",
      secondaryLine: "Free quote",
      imageUrl: demoExpertHomeSolutions.services![2].imageUrl,
      imageAlt: "Lighting installation",
    },
    {
      id: "4",
      title: "Bath remodeling",
      secondaryLine: "Packages from $2,500",
      imageUrl: demoExpertHomeSolutions.services![3].imageUrl,
      imageAlt: "Remodeled bathroom",
    },
  ],
  gallery: demoExpertHomeSolutions.gallery!.map((g, i) => ({
    ...g,
    alt: ["Renovated living room", "Modern kitchen", "Electrical detail", "Home exterior"][i] ?? g.alt,
  })),
  trustItems: [
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
  websiteLabel: "Website",
  hours: {
    openNowLabel: "Open now",
    todayHoursLine: "8:00 AM - 6:00 PM",
  },
  primaryCtaLabel: "Request quote",
  featuredLabel: "Featured",
};

/** Sparse profile for testing empty sections (swap slug in resolver to preview). */
export const demoMinimalProfile: ServiciosBusinessProfile = {
  slug: "minimal-demo",
  businessName: "Servicios Demo Mínimo",
  categoryLine: "Servicios generales",
  coverImageUrl:
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&h=700&fit=crop",
  coverImageAlt: "Banner",
  aboutText:
    "Este perfil muestra el diseño cuando solo hay información esencial. Las secciones vacías no aparecen.",
  services: [
    {
      id: "s1",
      title: "Consulta general",
      secondaryLine: "Cotización gratis",
      imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop",
      imageAlt: "Servicio",
    },
  ],
  serviceAreas: [{ id: "a1", label: "Austin, TX y alrededores", kind: "region" }],
  phone: "(555) 000-0000",
  primaryCtaLabel: "Solicitar cotización",
};

export function getServiciosProfileBySlug(slug: string, lang: ServiciosLang = "es"): ServiciosBusinessProfile {
  if (slug === "minimal-demo") return demoMinimalProfile;
  if (lang === "en") return demoExpertHomeSolutionsEn;
  return demoExpertHomeSolutions;
}
