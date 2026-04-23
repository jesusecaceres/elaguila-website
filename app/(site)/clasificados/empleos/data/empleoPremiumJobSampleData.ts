/**
 * Phase 3: Premium Job detail shell — template-ready for future Publicar/Empleos mapping.
 */

import type { JobModalitySlug } from "./empleosJobTypes";

export type PremiumGalleryImage = {
  src: string;
  alt: string;
};

export type PremiumMoreJobCard = {
  id: string;
  imageSrc: string;
  imageAlt: string;
  title: string;
  companyName: string;
  summary: string;
};

export type EmpleoPremiumJobSample = {
  title: string;
  companyName: string;
  logoSrc?: string;
  logoAlt?: string;
  city: string;
  state: string;
  filterRegionFootnote?: string;
  salaryPrimary: string;
  salarySecondary?: string;
  jobType: string;
  workModality?: JobModalitySlug;
  scheduleLabel?: string;
  /** Display line e.g. "Houston, TX" */
  locationLabel: string;
  featured: boolean;
  premium: boolean;
  phone?: string;
  whatsapp?: string;
  email?: string;
  websiteUrl?: string;
  primaryCta?: "apply" | "phone" | "whatsapp" | "email" | "website";
  /** Overrides default “Postularse ahora” when set (application-driven). */
  applyCtaLabel?: string;
  gallery: PremiumGalleryImage[];
  introduction: string;
  responsibilities: string[];
  requirements: string[];
  offers: string[];
  companyOverview?: string;
  employerAddress?: string;
  relatedJobs: PremiumMoreJobCard[];
};

export const EMPLEO_PREMIUM_JOB_SAMPLE: EmpleoPremiumJobSample = {
  title: "Sales Manager",
  companyName: "TechCorp Solutions",
  logoSrc: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=128&q=80",
  logoAlt: "Logotipo TechCorp Solutions",
  city: "Houston",
  state: "TX",
  salaryPrimary: "$70,000/año",
  salarySecondary: "$1,500+ por semana",
  jobType: "Tiempo completo",
  workModality: "hibrido",
  scheduleLabel: "Lunes a viernes · horario corrido",
  locationLabel: "Houston, TX",
  featured: true,
  premium: true,
  phone: "12815551234",
  whatsapp: "12815551234",
  email: "careers@techcorp.example.com",
  websiteUrl: "https://www.techcorp.example.com",
  primaryCta: "apply",
  gallery: [
    {
      src: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80",
      alt: "Equipo de negocios en reunión",
    },
    {
      src: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
      alt: "Oficinas modernas con vista urbana",
    },
    {
      src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
      alt: "Edificio corporativo al atardecer",
    },
    {
      src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
      alt: "Colaboración en equipo",
    },
  ],
  introduction:
    "TechCorp Solutions busca un Sales Manager con mentalidad estratégica para liderar el crecimiento en la región sur. Trabajarás con cuentas B2B de mediano y gran tamaño en un entorno colaborativo y orientado a resultados.",
  responsibilities: [
    "Desarrollar y ejecutar **estrategias de ventas** efectivas alineadas a metas trimestrales.",
    "Liderar y motivar al **equipo de ventas** mediante coaching y seguimiento de KPIs.",
    "Construir relaciones duraderas con clientes clave y partners estratégicos.",
    "Colaborar con marketing y operaciones para mejorar conversión y retención.",
    "Reportar resultados con claridad al director comercial y proponer ajustes tácticos.",
  ],
  requirements: [
    "Experiencia previa como gerente de ventas o roles equivalentes (5+ años).",
    "Habilidades sólidas de liderazgo, comunicación y presentación ejecutiva.",
    "Experiencia comprobada en **ventas B2B** y ciclos de venta complejos.",
    "Disponibilidad para viajar ocasionalmente dentro de la región.",
    "Inglés profesional (escrito y hablado) preferente.",
  ],
  offers: [
    "Sueldo base competitivo y esquema de bonos por desempeño.",
    "Beneficios de salud, dental y visión para empleados de tiempo completo.",
    "Plan de retiro 401(k) con contribución patronal.",
    "Oportunidades de desarrollo profesional y capacitación continua.",
  ],
  companyOverview:
    "TechCorp Solutions es una empresa de software y servicios tecnológicos enfocada en transformación digital para empresas medianas. Cultura basada en integridad, innovación y crecimiento compartido.",
  employerAddress: "1200 Innovation Blvd, Suite 400, Houston, TX 77002",
  relatedJobs: [
    {
      id: "p-rel-1",
      imageSrc: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=600&q=80",
      imageAlt: "Profesional en laptop",
      title: "Account Executive",
      companyName: "NexaDigital",
      summary: "Ventas SaaS B2B · Territorio sur",
    },
    {
      id: "p-rel-2",
      imageSrc: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=600&q=80",
      imageAlt: "Reunión de ventas",
      title: "Business Development Lead",
      companyName: "Summit Analytics",
      summary: "Pipeline enterprise · Híbrido",
    },
    {
      id: "p-rel-3",
      imageSrc: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=600&q=80",
      imageAlt: "Handshake",
      title: "Regional Sales Director",
      companyName: "BluePeak Tech",
      summary: "Liderazgo de equipo · Viaje 25%",
    },
  ],
};

export function hasPremiumGallery(images: PremiumGalleryImage[] | undefined): images is PremiumGalleryImage[] {
  return Boolean(images && images.length > 0);
}
