import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { normalizeWebsiteForOpen } from "@/app/(site)/publicar/community/shared/lib/communityWebsiteAndSocial";
import type { ComunidadQuickDraft } from "@/app/(site)/publicar/community/shared/types/communityQuickDraft";
import type {
  CommunityContactCanvasLinkItem,
  CommunityContactCanvasModel,
} from "@/app/(site)/publicar/community/shared/preview/CommunityContactCanvas";

/** Comunidad-owned copy for the shared contact/resources/location canvas. */
const UI_COMUNIDAD = {
  es: {
    contactTitle: "Contacto del organizador",
    socialTitle: "Síguenos",
    locationTitle: "Lugar del evento",
    moreTitle: "Más información",
    call: "Llamar",
    text: "Enviar texto",
    email: "Escribir correo",
    website: "Sitio web del evento",
    register: "Registrarse",
    tickets: "Boletos",
    donate: "Donar",
    eventProgram: "Programa del evento",
    eventGuide: "Guía del evento",
    vendors: "Vendedores",
    foodVendors: "Comida / puestos",
    sponsors: "Patrocinadores",
    map: "Ver en el mapa",
  },
  en: {
    contactTitle: "Organizer contact",
    socialTitle: "Follow us",
    locationTitle: "Event location",
    moreTitle: "More information",
    call: "Call",
    text: "Text message",
    email: "Email",
    website: "Event website",
    register: "Register",
    tickets: "Tickets",
    donate: "Donate",
    eventProgram: "Event program",
    eventGuide: "Event guide",
    vendors: "Vendors",
    foodVendors: "Food / vendors",
    sponsors: "Sponsors",
    map: "View on map",
  },
} as const;

const SMS_BODY = {
  es: "Vi tu evento en Leonix Media y quisiera más información.",
  en: "I saw your event on Leonix Media and would like more information.",
} as const;

const MAIL_SUBJECT = {
  es: "Información sobre tu evento en Leonix Media",
  en: "About your event on Leonix Media",
} as const;

/** Build the ordered list of event-specific useful link CTAs (Comunidad only). */
function buildComunidadLinkItems(
  el: ComunidadQuickDraft["eventLinks"],
  tc: typeof UI_COMUNIDAD[Lang],
): CommunityContactCanvasLinkItem[] {
  const linkItems: CommunityContactCanvasLinkItem[] = [];
  const push = (key: string, raw: string, label: string) => {
    const href = normalizeWebsiteForOpen(raw);
    if (href) linkItems.push({ key, href, label });
  };
  push("reg", el.registrationUrl, tc.register);
  push("tix", el.ticketsUrl, tc.tickets);
  push("don", el.donationUrl, tc.donate);
  push("prg", el.eventProgramUrl, tc.eventProgram);
  push("gui", el.eventGuideUrl, tc.eventGuide);
  push("vnd", el.vendorListUrl, tc.vendors);
  push("fvd", el.foodVendorsUrl, tc.foodVendors);
  push("spo", el.sponsorsUrl, tc.sponsors);
  if (el.customLink1Label.trim() && normalizeWebsiteForOpen(el.customLink1Url)) {
    push("c1", el.customLink1Url, el.customLink1Label.trim());
  }
  if (el.customLink2Label.trim() && normalizeWebsiteForOpen(el.customLink2Url)) {
    push("c2", el.customLink2Url, el.customLink2Label.trim());
  }
  return linkItems;
}

export function buildComunidadContactCanvasModel(
  draft: ComunidadQuickDraft,
  lang: Lang,
): CommunityContactCanvasModel {
  const tc = UI_COMUNIDAD[lang];
  return {
    labels: {
      contactTitle: tc.contactTitle,
      socialTitle: tc.socialTitle,
      locationTitle: tc.locationTitle,
      moreTitle: tc.moreTitle,
      call: tc.call,
      text: tc.text,
      email: tc.email,
      website: tc.website,
      map: tc.map,
    },
    linkItems: buildComunidadLinkItems(draft.eventLinks, tc),
    smsBody: SMS_BODY[lang],
    mailSubject: MAIL_SUBJECT[lang],
  };
}
