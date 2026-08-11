import type { DigitalContactLang } from "@/app/lib/digitalContact/digitalContactTypes";

export type VisitanosLang = DigitalContactLang;

export function resolveVisitanosLang(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined> | undefined,
): VisitanosLang {
  if (!searchParams) return "es";
  const raw =
    searchParams instanceof URLSearchParams
      ? searchParams.get("lang")
      : Array.isArray(searchParams.lang)
        ? searchParams.lang[0]
        : searchParams.lang;
  return raw === "en" ? "en" : "es";
}

/** Safe office-QR source token — only known values are kept; never reflect arbitrary query strings. */
export function resolveVisitanosSource(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined> | undefined,
): string | null {
  if (!searchParams) return null;
  const raw =
    searchParams instanceof URLSearchParams
      ? searchParams.get("source")
      : Array.isArray(searchParams.source)
        ? searchParams.source[0]
        : searchParams.source;
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (value === "office-window" || value === "office_window") return "office-window";
  return null;
}

export type VisitanosCopy = {
  langToggle: { es: string; en: string };
  kicker: string;
  headline: string;
  subhead: string;
  /** Face-to-face doorbell subhead when a video destination exists. */
  subheadFaceToFace: string;
  hoursLabel: string;
  hoursWindow: string;
  hoursWithinTitle: string;
  hoursWithinBody: string;
  hoursOutsideTitle: string;
  hoursOutsideBody: string;
  connectTitle: string;
  primaryCall: string;
  primaryWhatsapp: string;
  secondarySms: string;
  secondaryEmail: string;
  teamTitle: string;
  teamBody: string;
  teamProfileCta: string;
  fallbackTitle: string;
  fallbackBody: string;
  fallbackContactCta: string;
  officeLabel: string;
  footerTagline: string;
  footerRights: string;
  privacyNote: string;
  metaTitle: string;
  metaDescription: string;
  /** Executive routing (ECP) — separate from business office hours. */
  execBackupLead: string;
  execBackupCta: string;
};

const ES: VisitanosCopy = {
  langToggle: { es: "Español", en: "English" },
  kicker: "Recepción Virtual",
  headline: "Gracias por visitarnos.",
  subhead:
    "Si llegaste a nuestra oficina y salimos un momento, no queremos que tu visita sea en vano. Estamos aquí para ayudarte.",
  subheadFaceToFace: "Conéctate cara a cara con nuestro equipo.",
  hoursLabel: "Horario habitual",
  hoursWindow: "9:00 AM – 5:00 PM",
  hoursWithinTitle: "Estamos dentro de nuestro horario habitual.",
  hoursWithinBody: "Si salimos un momento, todavía puedes comunicarte con nosotros aquí.",
  hoursOutsideTitle: "En este momento estamos fuera de nuestro horario habitual.",
  hoursOutsideBody:
    "Puedes dejarnos un mensaje o elegir una forma de contacto y te responderemos tan pronto como sea posible.",
  connectTitle: "Hablemos",
  primaryCall: "Llamar",
  primaryWhatsapp: "WhatsApp",
  secondarySms: "Enviar mensaje",
  secondaryEmail: "Correo electrónico",
  teamTitle: "¿Buscas a alguien en particular?",
  teamBody: "Elige a la persona con quien viniste a hablar. Te llevamos a su tarjeta de contacto oficial.",
  teamProfileCta: "Ver contacto",
  fallbackTitle: "¿Aún necesitas ayuda?",
  fallbackBody: "También puedes escribirnos desde la página de contacto. Valoramos que hayas hecho el viaje.",
  fallbackContactCta: "Dejar un mensaje",
  officeLabel: "Oficina",
  footerTagline: "Que Ruja El León",
  footerRights: "Todos los derechos reservados.",
  privacyNote: "Usamos solo la información de contacto pública de Leonix.",
  metaTitle: "Visítanos — Recepción Virtual",
  metaDescription:
    "¿Llegaste a la oficina de Leonix Media? Gracias por visitarnos. Abre nuestra sala de video o conéctate por WhatsApp, llamada o mensaje.",
  execBackupLead: "También puedes comunicarte con",
  execBackupCta: "Ver contacto",
};

const EN: VisitanosCopy = {
  langToggle: { es: "Español", en: "English" },
  kicker: "Virtual Front Desk",
  headline: "Thanks for visiting us.",
  subhead:
    "If you came to our office and we stepped away for a moment, we don’t want your visit to be wasted. We’re still here to help.",
  subheadFaceToFace: "Connect face-to-face with our team.",
  hoursLabel: "Normal office hours",
  hoursWindow: "9:00 AM – 5:00 PM",
  hoursWithinTitle: "We’re within our normal office hours.",
  hoursWithinBody: "If we stepped away for a moment, you can still reach us here.",
  hoursOutsideTitle: "We’re currently outside our normal office hours.",
  hoursOutsideBody:
    "You can leave a message or choose a way to reach us, and we’ll get back to you as soon as we can.",
  connectTitle: "Let’s connect",
  primaryCall: "Call",
  primaryWhatsapp: "WhatsApp",
  secondarySms: "Text",
  secondaryEmail: "Email",
  teamTitle: "Looking for someone in particular?",
  teamBody: "Choose who you came to see. We’ll take you to their official contact card.",
  teamProfileCta: "View contact",
  fallbackTitle: "Still need help?",
  fallbackBody: "You can also reach us through our contact page. We appreciate you making the trip.",
  fallbackContactCta: "Leave a message",
  officeLabel: "Office",
  footerTagline: "Que Ruja El León",
  footerRights: "All rights reserved.",
  privacyNote: "We only share Leonix public contact information.",
  metaTitle: "Visit Us — Virtual Front Desk",
  metaDescription:
    "Arrived at Leonix Media’s office? Thanks for visiting. Open our video room or connect by WhatsApp, phone, or message.",
  execBackupLead: "You can also reach",
  execBackupCta: "View contact",
};

export function getVisitanosCopy(lang: VisitanosLang): VisitanosCopy {
  return lang === "en" ? EN : ES;
}

export function visitanosWhatsAppPrefill(lang: VisitanosLang): string {
  return lang === "en"
    ? "Hi — I’m outside the Leonix Media office and would like to connect."
    : "Hola — estoy afuera de la oficina de Leonix Media y me gustaría conectar.";
}

export function visitanosSmsPrefill(lang: VisitanosLang): string {
  return lang === "en"
    ? "Hi — I’m at the Leonix Media office and would like to connect."
    : "Hola — estoy en la oficina de Leonix Media y me gustaría conectar.";
}
