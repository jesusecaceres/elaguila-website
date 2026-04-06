import type { ContactoPayload } from "./payloadTypes";
import { LEONIX_GLOBAL_EMAIL, LEONIX_GLOBAL_MAILTO, LEONIX_MEDIA_BRAND } from "@/app/data/leonixGlobalContact";

export type ContactoResolvedCopy = {
  h1: string;
  intro: string;
  business: string;
  emailLabel: string;
  hoursLabel: string;
  hours: string;
  email: string;
  mailto: string;
  phoneLine: string | null;
  addressLine: string | null;
  noticeTop: string | null;
  tiendaTitle: string;
  tiendaBody: string;
  tiendaCta: string;
  langSwitch: string;
};

const BASE_EN: Omit<ContactoResolvedCopy, "langSwitch"> = {
  h1: "Contact",
  intro: `Reach ${LEONIX_MEDIA_BRAND} for general questions, partnerships, and editorial or media-related requests.`,
  business: "Contact details",
  emailLabel: "Email",
  hoursLabel: "Hours",
  hours: "Monday–Friday, 9:00 AM – 5:00 PM Pacific",
  email: LEONIX_GLOBAL_EMAIL,
  mailto: LEONIX_GLOBAL_MAILTO,
  phoneLine: null,
  addressLine: null,
  noticeTop: null,
  tiendaTitle: "Print store (Tienda)",
  tiendaBody:
    "For business printing, orders, file uploads, and Tienda quotes, use the dedicated Tienda contact page so we route you correctly.",
  tiendaCta: "Tienda help & contact",
};

const BASE_ES: Omit<ContactoResolvedCopy, "langSwitch"> = {
  h1: "Contacto",
  intro: `Comunícate con ${LEONIX_MEDIA_BRAND} para consultas generales, alianzas y temas editoriales o de medios.`,
  business: "Datos de contacto",
  emailLabel: "Correo",
  hoursLabel: "Horario",
  hours: "Lunes a viernes, 9:00 – 17:00 (Pacífico)",
  email: LEONIX_GLOBAL_EMAIL,
  mailto: LEONIX_GLOBAL_MAILTO,
  phoneLine: null,
  addressLine: null,
  noticeTop: null,
  tiendaTitle: "Tienda de impresión",
  tiendaBody:
    "Para impresión comercial, pedidos, subida de archivos y cotizaciones de Tienda, usa la página de contacto dedicada para enrutarte bien.",
  tiendaCta: "Ayuda y contacto Tienda",
};

function s(v: string | undefined, fb: string): string {
  return v !== undefined && v.trim() !== "" ? v.trim() : fb;
}

export function mergeContactoCopy(lang: "es" | "en", patch: ContactoPayload | null | undefined): ContactoResolvedCopy {
  const base = lang === "en" ? BASE_EN : BASE_ES;
  if (!patch) {
    return {
      ...base,
      langSwitch: lang === "en" ? "Español" : "English",
    };
  }
  const email = s(patch.email, base.email);
  const mailto = email.includes("@") ? `mailto:${email}` : base.mailto;
  return {
    h1: base.h1,
    intro: s(lang === "en" ? patch.intro?.en : patch.intro?.es, base.intro),
    business: base.business,
    emailLabel: base.emailLabel,
    hoursLabel: base.hoursLabel,
    hours: s(lang === "en" ? patch.hours?.en : patch.hours?.es, base.hours),
    email,
    mailto,
    phoneLine: patch.phone?.trim() ? patch.phone.trim() : null,
    addressLine: s(lang === "en" ? patch.address?.en : patch.address?.es, "") || null,
    noticeTop: s(lang === "en" ? patch.noticeBanner?.en : patch.noticeBanner?.es, "") || null,
    tiendaTitle: base.tiendaTitle,
    tiendaBody: base.tiendaBody,
    tiendaCta: base.tiendaCta,
    langSwitch: lang === "en" ? "Español" : "English",
  };
}
