import type { ContactoPayload } from "./payloadTypes";
import { LEONIX_GLOBAL_EMAIL, LEONIX_GLOBAL_MAILTO } from "@/app/data/leonixGlobalContact";
import {
  LEONIX_MAP_URL,
  LEONIX_OFFICE_ADDRESS,
  LEONIX_PHONE_DISPLAY,
} from "@/app/(site)/tienda/data/leonixContact";

export type ContactoResolvedCopy = {
  h1: string;
  subhead: string | null;
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
  mapUrl: string | null;
  langSwitch: string;
};

const BASE_EN: Omit<ContactoResolvedCopy, "langSwitch"> = {
  h1: "Contact us",
  subhead: null,
  intro:
    "Reach out about ads, your business, promotional products, the magazine, or any general Leonix Media question.",
  business: "Leonix Media — contact details",
  emailLabel: "Email",
  hoursLabel: "Hours",
  hours: "Monday–Friday, 9:00 AM – 5:00 PM Pacific",
  email: LEONIX_GLOBAL_EMAIL,
  mailto: LEONIX_GLOBAL_MAILTO,
  phoneLine: LEONIX_PHONE_DISPLAY,
  addressLine: LEONIX_OFFICE_ADDRESS,
  noticeTop: null,
  tiendaTitle: "Looking for promotional products or printing?",
  tiendaBody:
    "For business cards, flyers, banners, promotional products, or print files, use our promotional products contact.",
  tiendaCta: "Quote promotional products",
  mapUrl: LEONIX_MAP_URL,
};

const BASE_ES: Omit<ContactoResolvedCopy, "langSwitch"> = {
  h1: "Contáctanos",
  subhead: null,
  intro:
    "Escríbenos sobre anuncios, tu negocio, productos promocionales, la revista o cualquier pregunta general de Leonix Media.",
  business: "Leonix Media — datos de contacto",
  emailLabel: "Correo",
  hoursLabel: "Horario",
  hours: "Lunes a viernes, 9:00 – 17:00 (Pacífico)",
  email: LEONIX_GLOBAL_EMAIL,
  mailto: LEONIX_GLOBAL_MAILTO,
  phoneLine: LEONIX_PHONE_DISPLAY,
  addressLine: LEONIX_OFFICE_ADDRESS,
  noticeTop: null,
  tiendaTitle: "¿Buscas productos promocionales o impresión?",
  tiendaBody:
    "Para cotizaciones de tarjetas, volantes, banners, artículos promocionales o archivos de impresión, usa nuestro contacto de productos promocionales.",
  tiendaCta: "Cotizar productos promocionales",
  mapUrl: LEONIX_MAP_URL,
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
  const h1 = s(lang === "en" ? patch.headline?.en : patch.headline?.es, base.h1);
  const subRaw = lang === "en" ? patch.subheadline?.en : patch.subheadline?.es;
  const subhead = subRaw !== undefined && subRaw.trim() !== "" ? subRaw.trim() : null;

  const tiendaTitle = s(lang === "en" ? patch.tiendaCard?.title?.en : patch.tiendaCard?.title?.es, base.tiendaTitle);
  const tiendaBody = s(lang === "en" ? patch.tiendaCard?.body?.en : patch.tiendaCard?.body?.es, base.tiendaBody);
  const tiendaCta = s(lang === "en" ? patch.tiendaCard?.cta?.en : patch.tiendaCard?.cta?.es, base.tiendaCta);

  return {
    h1,
    subhead,
    intro: s(lang === "en" ? patch.intro?.en : patch.intro?.es, base.intro),
    business: base.business,
    emailLabel: base.emailLabel,
    hoursLabel: base.hoursLabel,
    hours: s(lang === "en" ? patch.hours?.en : patch.hours?.es, base.hours),
    email,
    mailto,
    phoneLine: patch.phone?.trim() ? patch.phone.trim() : base.phoneLine,
    addressLine: s(lang === "en" ? patch.address?.en : patch.address?.es, base.addressLine ?? "") || base.addressLine,
    noticeTop: s(lang === "en" ? patch.noticeBanner?.en : patch.noticeBanner?.es, "") || null,
    tiendaTitle,
    tiendaBody,
    tiendaCta,
    mapUrl: patch.mapUrl?.trim() || base.mapUrl,
    langSwitch: lang === "en" ? "Español" : "English",
  };
}
