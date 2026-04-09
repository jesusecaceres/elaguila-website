/**
 * Phase 1 sample inventory for the public Empleos results shell.
 * Replace with API / DB mapping in a later phase.
 */

export type FeaturedJobSample = {
  id: string;
  imageSrc: string;
  imageAlt: string;
  destacado?: boolean;
  title: string;
  company: string;
  location: string;
  pay: string;
  schedule: string;
  summary: string;
  ctaLabel: "Ver más" | "Aplicar";
  ctaVariant: "red" | "green";
};

export type LatestJobIcon = "truck" | "headset" | "code" | "clean";

export type LatestJobSample = {
  id: string;
  icon: LatestJobIcon;
  title: string;
  company: string;
  location: string;
  pay: string;
  snippet: string;
  ctaLabel: "Ver más" | "Aplicar";
  ctaVariant: "red" | "green" | "blue";
};

export type JobFairPromoSample = {
  title: string;
  dateLine: string;
  timeLine: string;
  venue: string;
  imageSrc: string;
  imageAlt: string;
};

export const EMPLEOS_FEATURED_JOBS: FeaturedJobSample[] = [
  {
    id: "feat-1",
    imageSrc:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Cocina de restaurante profesional",
    destacado: true,
    title: "Cocinero / Cocinera",
    company: "Restaurante La Parrilla",
    location: "Los Angeles, CA",
    pay: "$20/hora",
    schedule: "Tiempo completo",
    summary: "Experiencia en parrilla y línea caliente. Ambiente familiar, horarios estables.",
    ctaLabel: "Ver más",
    ctaVariant: "red",
  },
  {
    id: "feat-2",
    imageSrc:
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Equipo de ventas en oficina",
    title: "Sales Manager",
    company: "TechCorp Solutions",
    location: "Houston, TX",
    pay: "$70,000 / año",
    schedule: "Híbrido",
    summary: "Lidera equipo B2B en crecimiento. Base + comisiones competitivas.",
    ctaLabel: "Aplicar",
    ctaVariant: "green",
  },
  {
    id: "feat-3",
    imageSrc:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Profesional de salud en clínica",
    title: "Registered Nurse (RN)",
    company: "HealthFirst Clinic",
    location: "Miami, FL",
    pay: "Desde $35/hora",
    schedule: "Turnos rotativos",
    summary: "Clínica ambulatoria con enfoque en atención primaria y seguimiento.",
    ctaLabel: "Ver más",
    ctaVariant: "red",
  },
];

export const EMPLEOS_LATEST_JOBS: LatestJobSample[] = [
  {
    id: "latest-1",
    icon: "truck",
    title: "Chofer de Entrega",
    company: "Transportes Rápidos",
    location: "Dallas, TX",
    pay: "$18/hr",
    snippet: "Rutas locales, camioneta provista, bonos por entregas puntuales.",
    ctaLabel: "Ver más",
    ctaVariant: "red",
  },
  {
    id: "latest-2",
    icon: "headset",
    title: "Customer Service Representative",
    company: "Global Call Center",
    location: "Phoenix, AZ",
    pay: "De $16/hora",
    snippet: "Soporte inbound bilingüe. Entrenamiento pagado y horarios flexibles.",
    ctaLabel: "Aplicar",
    ctaVariant: "green",
  },
  {
    id: "latest-3",
    icon: "code",
    title: "Ingeniero de Software",
    company: "InnovaTech",
    location: "San Diego, CA",
    pay: "$90,000 / año",
    snippet: "Stack moderno, equipo pequeño, énfasis en calidad y ownership.",
    ctaLabel: "Aplicar",
    ctaVariant: "blue",
  },
  {
    id: "latest-4",
    icon: "clean",
    title: "Asistente de Limpieza",
    company: "Hotel Bella Vista",
    location: "Las Vegas, NV",
    pay: "$14/hora",
    snippet: "Turnos diurnos y fines de semana. Uniforme y capacitación incluidos.",
    ctaLabel: "Ver más",
    ctaVariant: "red",
  },
];

export const EMPLEOS_JOB_FAIR_PROMO: JobFairPromoSample = {
  title: "Gran Feria de Empleo",
  dateLine: "Miércoles 15 de Julio",
  timeLine: "10 AM – 3 PM",
  venue: "Centro de Convenciones de San Antonio",
  imageSrc:
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
  imageAlt: "Interior de centro de convenciones con stands",
};
