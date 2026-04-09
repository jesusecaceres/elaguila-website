import type { Lang } from "@/app/clasificados/config/clasificadosHub";

/** Localized validation labels for required-for-preview gates (UI language, not listing content). */
export const EMPLEOS_GATE_QUICK = {
  es: {
    title: "Título del puesto",
    businessName: "Nombre del negocio",
    city: "Ciudad",
    state: "Estado",
    jobType: "Tipo de empleo",
    schedule: "Horario",
    pay: "Pago",
    description: "Descripción corta",
    image: "Imagen principal (sube o pega URL)",
    cta: "Al menos un método de contacto (teléfono, WhatsApp o email)",
  },
  en: {
    title: "Job title",
    businessName: "Business name",
    city: "City",
    state: "State",
    jobType: "Job type",
    schedule: "Schedule",
    pay: "Pay",
    description: "Short description",
    image: "Main image (upload or URL)",
    cta: "At least one contact method (phone, WhatsApp, or email)",
  },
} as const;

export const EMPLEOS_GATE_PREMIUM = {
  es: {
    title: "Título del puesto",
    company: "Empresa",
    city: "Ciudad",
    state: "Estado",
    salaryPrimary: "Salario principal",
    jobType: "Tipo de empleo",
    introduction: "Descripción del puesto",
    heroImage: "Al menos una imagen principal / hero",
    applyChannel: "Al menos un canal: WhatsApp, email o sitio web",
    responsibility: "Al menos una responsabilidad",
    requirement: "Al menos un requisito",
    offer: "Al menos un ítem en Ofrecemos",
  },
  en: {
    title: "Job title",
    company: "Company",
    city: "City",
    state: "State",
    salaryPrimary: "Primary compensation",
    jobType: "Job type",
    introduction: "Job description",
    heroImage: "At least one hero image",
    applyChannel: "At least one channel: WhatsApp, email, or website",
    responsibility: "At least one responsibility",
    requirement: "At least one requirement",
    offer: "At least one item under What we offer",
  },
} as const;

export const EMPLEOS_GATE_FERIA = {
  es: {
    title: "Título",
    flyer: "Imagen del flyer o URL",
    date: "Fecha",
    venue: "Sede",
    city: "Ciudad",
    state: "Estado",
    organizer: "Organizador",
    contact: "Al menos un método de contacto",
  },
  en: {
    title: "Title",
    flyer: "Flyer image or URL",
    date: "Date",
    venue: "Venue",
    city: "City",
    state: "State",
    organizer: "Organizer",
    contact: "At least one contact method",
  },
} as const;

export type EmpleosGateLang = Lang;
