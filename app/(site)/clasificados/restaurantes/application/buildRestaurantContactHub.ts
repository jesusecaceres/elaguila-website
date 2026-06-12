import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import type { RestauranteDaySchedule } from "./restauranteListingApplicationModel";
import { buildRestauranteInquiryMailto } from "@/app/lib/contactEmailMailto";
import { normalizeActionableUrl } from "../lib/urlNormalization";
import { computeShellHoursPreview } from "./restauranteHoursPreview";
import {
  buildCateringInquiryPrefill,
  isValidExternalHttpUrl,
  nonEmpty,
  normalizeRestaurantUrl,
  resolveRestaurantMapsHref,
  shouldShowRestaurantStreetAddress,
  smsHref,
  telHref,
  waHref,
} from "./restauranteContactHref";

export type RestaurantHubButton = {
  id: string;
  label: string;
  href: string;
  /** Maps to CtaActionSheet intent routing in `RestaurantContactHub`. */
  action:
    | "call"
    | "sms"
    | "whatsapp"
    | "email"
    | "website"
    | "order"
    | "booking"
    | "menu"
    | "directions"
    | "social"
    | "review";
  fullWidth?: boolean;
  /** Email subject/body when action is email */
  emailSubject?: string;
  emailBody?: string;
};

export type RestaurantHubSocialLink = {
  id: string;
  label: string;
  url: string;
};

export type RestaurantContactHubHours = {
  openNowLabel?: string;
  todayHoursLine?: string;
  weeklyRows: { dayLabel: string; line: string; isToday?: boolean }[];
  specialNote?: string;
};

export type RestaurantContactHubData = {
  hasAny: boolean;
  businessName: string;
  contactUs: RestaurantHubButton[];
  orderReserve: RestaurantHubButton[];
  social: RestaurantHubSocialLink[];
  reviews: RestaurantHubButton[];
  findUs: RestaurantHubButton[];
  catering: RestaurantHubButton[];
  location?: {
    addressLine1?: string;
    addressLine2?: string;
    supportingText?: string;
    mapsHref?: string;
    mapsLabel: string;
  };
  hours?: RestaurantContactHubHours;
};

const HOURS_DAY_ORDER: {
  key: keyof Pick<
    RestauranteListingDraft,
    "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"
  >;
  label: string;
}[] = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

const TODAY_KEY = (() => {
  const keys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  return keys[new Date().getDay()];
})();

function pushUniqueButton(list: RestaurantHubButton[], btn: RestaurantHubButton | null | undefined) {
  if (!btn?.href?.trim()) return;
  if (list.some((b) => b.id === btn.id)) return;
  list.push(btn);
}

function dayHasConfiguredHours(s: RestauranteDaySchedule | undefined): boolean {
  if (!s) return false;
  return !s.closed && Boolean(s.openTime?.trim() && s.closeTime?.trim());
}

function buildHubHours(d: RestauranteListingDraft, lang: "es" | "en"): RestaurantContactHubHours | undefined {
  const weeklyHours = {
    monday: d.monday,
    tuesday: d.tuesday,
    wednesday: d.wednesday,
    thursday: d.thursday,
    friday: d.friday,
    saturday: d.saturday,
    sunday: d.sunday,
  };

  const specialNote = d.specialHoursNote?.trim() || undefined;
  const hasConfigured =
    Boolean(specialNote) ||
    Boolean(d.temporaryHoursActive && d.temporaryHoursNote?.trim()) ||
    HOURS_DAY_ORDER.some(({ key }) => dayHasConfiguredHours(d[key] as RestauranteDaySchedule | undefined));

  if (!hasConfigured) return undefined;

  const weeklyRows: RestaurantContactHubHours["weeklyRows"] = [];
  for (const { key, label } of HOURS_DAY_ORDER) {
    const s = d[key] as RestauranteDaySchedule | undefined;
    if (!s) continue;
    const line = s.closed
      ? lang === "en"
        ? "Closed"
        : "Cerrado"
      : s.openTime?.trim() && s.closeTime?.trim()
        ? `${s.openTime} – ${s.closeTime}`
        : lang === "en"
          ? "Hours TBD"
          : "Horario por confirmar";
    weeklyRows.push({ dayLabel: label, line, isToday: key === TODAY_KEY });
  }

  const preview = computeShellHoursPreview({
    ...weeklyHours,
    temporaryHoursActive: d.temporaryHoursActive,
    temporaryHoursNote: d.temporaryHoursNote,
    specialHoursNote: d.specialHoursNote,
  });
  let openNowLabel: string | undefined;
  let todayHoursLine: string | undefined;
  if (preview.status === "open") {
    openNowLabel = lang === "en" ? "Open now" : "Abierto ahora";
    todayHoursLine = preview.statusLine;
  } else if (preview.status === "closed") {
    openNowLabel = lang === "en" ? "Closed" : "Cerrado";
    todayHoursLine = preview.statusLine;
  } else if (preview.statusLine?.trim()) {
    openNowLabel = lang === "en" ? "Today" : "Hoy";
    todayHoursLine = preview.statusLine;
  }

  return { openNowLabel, todayHoursLine, weeklyRows, specialNote };
}

export function buildRestaurantContactHub(d: RestauranteListingDraft, lang: "es" | "en" = "es"): RestaurantContactHubData | undefined {
  const businessName = nonEmpty(d.businessName) ? d.businessName!.trim() : "";

  const contactUs: RestaurantHubButton[] = [];
  if (nonEmpty(d.phoneNumber)) {
    const phone = d.phoneNumber!.trim();
    pushUniqueButton(contactUs, {
      id: "call",
      label: lang === "en" ? "Call" : "Llamar",
      href: telHref(phone),
      action: "call",
      fullWidth: true,
    });
    const sms = smsHref(phone);
    if (sms) {
      pushUniqueButton(contactUs, {
        id: "sms",
        label: lang === "en" ? "Message" : "Mensaje",
        href: sms,
        action: "sms",
      });
    }
  }
  if (nonEmpty(d.whatsAppNumber)) {
    const href = waHref(d.whatsAppNumber!, businessName);
    if (href) {
      pushUniqueButton(contactUs, {
        id: "whatsapp",
        label: "WhatsApp",
        href,
        action: "whatsapp",
      });
    }
  }
  if (nonEmpty(d.email)) {
    const email = d.email!.trim();
    const mail = buildRestauranteInquiryMailto(email, lang);
    pushUniqueButton(contactUs, {
      id: "email",
      label: lang === "en" ? "Email" : "Correo",
      href: mail.mailtoHref,
      action: "email",
      emailSubject: lang === "en" ? "Inquiry from Leonix Media" : "Consulta desde Leonix Media",
      emailBody: mail.messagePlain,
    });
  }

  const orderReserve: RestaurantHubButton[] = [];
  const menuUrl = nonEmpty(d.menuUrl) ? normalizeRestaurantUrl(d.menuUrl!) : "";
  const menuFile = nonEmpty(d.menuFile) ? d.menuFile!.trim() : "";
  if (menuUrl && isValidExternalHttpUrl(menuUrl)) {
    pushUniqueButton(orderReserve, {
      id: "menu-url",
      label: lang === "en" ? "Menu" : "Menú",
      href: menuUrl,
      action: "menu",
    });
  } else if (menuFile) {
    pushUniqueButton(orderReserve, {
      id: "menu-file",
      label: lang === "en" ? "Menu" : "Menú",
      href: menuFile,
      action: "menu",
    });
  }
  if (nonEmpty(d.reservationUrl)) {
    const url = normalizeRestaurantUrl(d.reservationUrl!);
    if (isValidExternalHttpUrl(url)) {
      pushUniqueButton(orderReserve, {
        id: "reserve",
        label: lang === "en" ? "Reserve" : "Reservar",
        href: url,
        action: "booking",
      });
    }
  }
  if (nonEmpty(d.orderUrl)) {
    const url = normalizeRestaurantUrl(d.orderUrl!);
    if (isValidExternalHttpUrl(url)) {
      pushUniqueButton(orderReserve, {
        id: "order",
        label: lang === "en" ? "Order now" : "Pedir ahora",
        href: url,
        action: "order",
        fullWidth: Boolean(d.homeBasedBusiness),
      });
    }
  }
  if (nonEmpty(d.websiteUrl)) {
    const url = normalizeRestaurantUrl(d.websiteUrl!);
    if (isValidExternalHttpUrl(url)) {
      pushUniqueButton(orderReserve, {
        id: "website",
        label: lang === "en" ? "Website" : "Sitio web",
        href: url,
        action: "website",
      });
    }
  }

  const social: RestaurantHubSocialLink[] = [];
  const addSocial = (id: string, label: string, raw?: string) => {
    if (!nonEmpty(raw)) return;
    const url = normalizeActionableUrl(raw!) ?? normalizeRestaurantUrl(raw!);
    if (!isValidExternalHttpUrl(url)) return;
    social.push({ id, label, url });
  };
  addSocial("instagram", "Instagram", d.instagramUrl);
  addSocial("facebook", "Facebook", d.facebookUrl);
  addSocial("tiktok", "TikTok", d.tiktokUrl);
  addSocial("youtube", "YouTube", d.youtubeUrl);
  addSocial("snapchat", "Snapchat", d.snapchatUrl);
  addSocial("x", "X", d.xTwitterUrl);

  const reviews: RestaurantHubButton[] = [];
  if (nonEmpty(d.googleReviewUrl)) {
    const url = normalizeActionableUrl(d.googleReviewUrl!) ?? normalizeRestaurantUrl(d.googleReviewUrl!);
    if (isValidExternalHttpUrl(url)) {
      pushUniqueButton(reviews, {
        id: "google-reviews",
        label: lang === "en" ? "Reviews on Google" : "Opiniones en Google",
        href: url,
        action: "review",
      });
    }
  }
  if (nonEmpty(d.yelpReviewUrl)) {
    const url = normalizeActionableUrl(d.yelpReviewUrl!) ?? normalizeRestaurantUrl(d.yelpReviewUrl!);
    if (isValidExternalHttpUrl(url)) {
      pushUniqueButton(reviews, {
        id: "yelp",
        label: lang === "en" ? "Reviews on Yelp" : "Opiniones en Yelp",
        href: url,
        action: "review",
      });
    }
  }

  const findUs: RestaurantHubButton[] = [];
  if (d.movingVendor) {
    const locUrl = d.movingVendorStack?.currentLocationUrl?.trim();
    if (locUrl) {
      const url = normalizeActionableUrl(locUrl) ?? normalizeRestaurantUrl(locUrl);
      if (isValidExternalHttpUrl(url)) {
        pushUniqueButton(findUs, {
          id: "current-location",
          label: lang === "en" ? "See where we are today" : "Ver dónde está hoy",
          href: url,
          action: "website",
        });
      }
    }
  }

  const catering: RestaurantHubButton[] = [];
  if (d.cateringAvailable || d.eventFoodService) {
    const cateringMsg = buildCateringInquiryPrefill(businessName);
    if (nonEmpty(d.phoneNumber)) {
      pushUniqueButton(catering, {
        id: "catering-call",
        label: lang === "en" ? "Request a quote" : "Pedir cotización",
        href: telHref(d.phoneNumber!),
        action: "call",
      });
    }
    if (nonEmpty(d.whatsAppNumber)) {
      const href = waHref(d.whatsAppNumber!, businessName, cateringMsg);
      if (href) {
        pushUniqueButton(catering, {
          id: "catering-wa",
          label: lang === "en" ? "Catering on WhatsApp" : "Cotizar catering",
          href,
          action: "whatsapp",
        });
      }
    }
    if (nonEmpty(d.email)) {
      const email = d.email!.trim();
      const subject = lang === "en" ? "Catering / event inquiry — Leonix" : "Cotización catering / evento — Leonix";
      pushUniqueButton(catering, {
        id: "catering-email",
        label: lang === "en" ? "Contact for event" : "Contactar para evento",
        href: `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(cateringMsg)}`,
        action: "email",
        emailSubject: subject,
        emailBody: cateringMsg,
      });
    }
    const inquiry = d.cateringEventsStack?.cateringInquiryUrl?.trim();
    if (inquiry) {
      const url = normalizeActionableUrl(inquiry) ?? normalizeRestaurantUrl(inquiry);
      if (isValidExternalHttpUrl(url)) {
        pushUniqueButton(catering, {
          id: "catering-form",
          label: lang === "en" ? "Catering inquiry form" : "Formulario de cotización",
          href: url,
          action: "website",
        });
      }
    }
  }

  const showStreet = shouldShowRestaurantStreetAddress(d);
  const cityLine = [d.cityCanonical, d.state, d.zipCode].filter(nonEmpty).join(", ");
  const mapsHref = resolveRestaurantMapsHref(d, showStreet);
  const home = d.homeBasedStack;
  const pickupNote = d.homeBasedBusiness && nonEmpty(home?.pickupInstructions) ? home!.pickupInstructions!.trim() : undefined;
  const serviceArea =
    !showStreet && nonEmpty(d.serviceAreaText)
      ? d.serviceAreaText!.trim()
      : !showStreet && nonEmpty(d.cityCanonical) && cityLine
        ? cityLine
        : undefined;

  let location: RestaurantContactHubData["location"];
  if (showStreet || mapsHref || pickupNote || serviceArea) {
    location = {
      addressLine1: showStreet ? d.addressLine1!.trim() : undefined,
      addressLine2: showStreet
        ? nonEmpty(d.addressLine2)
          ? d.addressLine2!.trim()
          : cityLine || undefined
        : serviceArea,
      supportingText: pickupNote,
      mapsHref,
      mapsLabel: lang === "en" ? "Get directions" : "Cómo llegar",
    };
  }

  const hasLocation =
    Boolean(location?.addressLine1 || location?.mapsHref || location?.supportingText) ||
    Boolean(location?.addressLine2 && (showStreet || nonEmpty(d.cityCanonical) || nonEmpty(d.serviceAreaText)));

  const hours = buildHubHours(d, lang);
  const hasHours = Boolean(hours?.weeklyRows.length || hours?.specialNote || hours?.todayHoursLine);

  const hasAny =
    contactUs.length > 0 ||
    orderReserve.length > 0 ||
    social.length > 0 ||
    reviews.length > 0 ||
    findUs.length > 0 ||
    catering.length > 0 ||
    hasLocation ||
    hasHours;

  if (!hasAny) return undefined;

  return {
    hasAny,
    businessName,
    contactUs,
    orderReserve,
    social,
    reviews,
    findUs,
    catering,
    location,
    hours: hasHours ? hours : undefined,
  };
}
