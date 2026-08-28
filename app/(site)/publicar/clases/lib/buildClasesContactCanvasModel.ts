import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { normalizeWebsiteForOpen } from "@/app/(site)/publicar/community/shared/lib/communityWebsiteAndSocial";
import type { ClasesQuickDraft } from "@/app/(site)/publicar/community/shared/types/communityQuickDraft";
import type {
  CommunityContactCanvasLinkItem,
  CommunityContactCanvasModel,
} from "@/app/(site)/publicar/community/shared/preview/CommunityContactCanvas";

/** Clases-owned copy for the shared contact/resources/location canvas. */
const UI_CLASES = {
  es: {
    contactTitle: "Contacto del instructor / organizador",
    socialTitle: "Síguenos",
    locationTitle: "Lugar de la clase",
    moreTitle: "Más información de la clase",
    call: "Llamar",
    text: "Enviar texto",
    email: "Escribir correo",
    website: "Sitio web de la clase",
    register: "Registrarse",
    pay: "Pagar",
    tickets: "Boletos",
    donate: "Donar",
    materials: "Materiales",
    syllabus: "Programa / temario",
    classGuide: "Guía de la clase",
    instructorPage: "Página del instructor",
    studentPortal: "Portal del estudiante",
    vendors: "Vendedores / recursos",
    foodVendors: "Comida / puestos",
    sponsors: "Patrocinadores",
    map: "Ver en el mapa",
  },
  en: {
    contactTitle: "Instructor / organizer contact",
    socialTitle: "Follow us",
    locationTitle: "Class location",
    moreTitle: "More class information",
    call: "Call",
    text: "Text message",
    email: "Email",
    website: "Class website",
    register: "Register",
    pay: "Pay",
    tickets: "Tickets",
    donate: "Donate",
    materials: "Materials",
    syllabus: "Program / syllabus",
    classGuide: "Class guide",
    instructorPage: "Instructor page",
    studentPortal: "Student portal",
    vendors: "Vendors / resources",
    foodVendors: "Food / vendors",
    sponsors: "Sponsors",
    map: "View on map",
  },
} as const;

const SMS_BODY = {
  es: "Vi tu clase en Leonix Media y quisiera más información.",
  en: "I saw your class on Leonix Media and would like more information.",
} as const;

const MAIL_SUBJECT = {
  es: "Información sobre tu clase en Leonix Media",
  en: "About your class on Leonix Media",
} as const;

/** Build the ordered list of class-specific useful link CTAs (Clases only). */
function buildClasesLinkItems(
  cl: ClasesQuickDraft["classLinks"],
  tc: typeof UI_CLASES[Lang],
): CommunityContactCanvasLinkItem[] {
  const linkItems: CommunityContactCanvasLinkItem[] = [];
  const push = (key: string, raw: string, label: string) => {
    const href = normalizeWebsiteForOpen(raw);
    if (href) linkItems.push({ key, href, label });
  };
  push("reg", cl.registrationUrl, tc.register);
  push("pay", cl.paymentUrl, tc.pay);
  push("tix", cl.ticketsUrl, tc.tickets);
  push("don", cl.donationUrl, tc.donate);
  push("mat", cl.classMaterialsUrl, tc.materials);
  push("syl", cl.syllabusUrl, tc.syllabus);
  push("gui", cl.classGuideUrl, tc.classGuide);
  push("ins", cl.instructorPageUrl, tc.instructorPage);
  push("stu", cl.studentPortalUrl, tc.studentPortal);
  push("vnd", cl.vendorsResourcesUrl, tc.vendors);
  push("fvd", cl.foodVendorsUrl, tc.foodVendors);
  push("spo", cl.sponsorsUrl, tc.sponsors);
  if (cl.customLink1Label.trim() && normalizeWebsiteForOpen(cl.customLink1Url)) {
    push("c1", cl.customLink1Url, cl.customLink1Label.trim());
  }
  if (cl.customLink2Label.trim() && normalizeWebsiteForOpen(cl.customLink2Url)) {
    push("c2", cl.customLink2Url, cl.customLink2Label.trim());
  }
  return linkItems;
}

export function buildClasesContactCanvasModel(
  draft: ClasesQuickDraft,
  lang: Lang,
): CommunityContactCanvasModel {
  const tc = UI_CLASES[lang];
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
    linkItems: buildClasesLinkItems(draft.classLinks, tc),
    smsBody: SMS_BODY[lang],
    mailSubject: MAIL_SUBJECT[lang],
  };
}
