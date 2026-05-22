import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import { buildRestauranteInquiryMailto } from "@/app/lib/contactEmailMailto";
import { normalizeActionableUrl } from "../lib/urlNormalization";
import {
  buildCateringInquiryPrefill,
  isValidExternalHttpUrl,
  mapsSearchHref,
  nonEmpty,
  normalizeRestaurantUrl,
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

export type RestaurantContactHubData = {
  hasAny: boolean;
  businessName: string;
  contactUs: RestaurantHubButton[];
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
};

function shouldShowStreetAddress(d: RestauranteListingDraft): boolean {
  if (!nonEmpty(d.addressLine1)) return false;
  if (d.homeBasedBusiness && d.showExactAddress === false) return false;
  if (d.locationPrivacyMode === "city_only" || d.locationPrivacyMode === "hidden_address_text_only") return false;
  return true;
}

function resolveMapsHref(d: RestauranteListingDraft, allowAddress: boolean): string | undefined {
  if (nonEmpty(d.verUbicacionUrl)) {
    const normalized = normalizeActionableUrl(d.verUbicacionUrl!.trim()) ?? normalizeRestaurantUrl(d.verUbicacionUrl!);
    if (isValidExternalHttpUrl(normalized)) return normalized;
  }
  if (allowAddress) {
    const cityLine = [d.cityCanonical, d.state, d.zipCode].filter(nonEmpty).join(", ");
    const mapsQ = [d.addressLine1, cityLine].filter(nonEmpty).join(", ");
    if (nonEmpty(mapsQ)) return mapsSearchHref(mapsQ);
  }
  if (nonEmpty(d.serviceAreaText) && !allowAddress) {
    const area = normalizeActionableUrl(d.serviceAreaText!.trim());
    if (area) return area;
  }
  return undefined;
}

function pushUniqueButton(list: RestaurantHubButton[], btn: RestaurantHubButton | null | undefined) {
  if (!btn?.href?.trim()) return;
  if (list.some((b) => b.id === btn.id)) return;
  list.push(btn);
}

export function buildRestaurantContactHub(d: RestauranteListingDraft, lang: "es" | "en" = "es"): RestaurantContactHubData | undefined {
  const businessName = nonEmpty(d.businessName) ? d.businessName!.trim() : "";
  const contactShareExtras = {
    email: d.email?.trim() || undefined,
    websiteUrl: nonEmpty(d.websiteUrl) ? normalizeRestaurantUrl(d.websiteUrl!) : undefined,
  };

  const contactUs: RestaurantHubButton[] = [];
  if (nonEmpty(d.phoneNumber)) {
    const phone = d.phoneNumber!.trim();
    pushUniqueButton(contactUs, {
      id: "call",
      label: lang === "en" ? "Call" : "Llamar",
      href: telHref(phone),
      action: "call",
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

  const reviews: RestaurantHubButton[] = [];
  if (nonEmpty(d.googleReviewUrl)) {
    const url = normalizeActionableUrl(d.googleReviewUrl!) ?? normalizeRestaurantUrl(d.googleReviewUrl!);
    if (isValidExternalHttpUrl(url)) {
      pushUniqueButton(reviews, {
        id: "google-reviews",
        label: lang === "en" ? "Google reviews" : "Reseñas en Google",
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
        label: "Yelp",
        href: url,
        action: "review",
      });
    }
  }

  const findUs: RestaurantHubButton[] = [];
  if (nonEmpty(d.websiteUrl)) {
    const url = normalizeRestaurantUrl(d.websiteUrl!);
    if (isValidExternalHttpUrl(url)) {
      pushUniqueButton(findUs, {
        id: "website",
        label: lang === "en" ? "Website" : "Sitio web",
        href: url,
        action: "website",
      });
    }
  }
  const menuUrl = nonEmpty(d.menuUrl) ? normalizeRestaurantUrl(d.menuUrl!) : "";
  const menuFile = nonEmpty(d.menuFile) ? d.menuFile!.trim() : "";
  if (menuUrl && isValidExternalHttpUrl(menuUrl)) {
    pushUniqueButton(findUs, {
      id: "menu-url",
      label: lang === "en" ? "Menu / catalog" : "Catálogo / menú",
      href: menuUrl,
      action: "menu",
    });
  } else if (menuFile) {
    pushUniqueButton(findUs, {
      id: "menu-file",
      label: lang === "en" ? "Menu / catalog" : "Catálogo / menú",
      href: menuFile,
      action: "menu",
    });
  }
  if (nonEmpty(d.orderUrl)) {
    const url = normalizeRestaurantUrl(d.orderUrl!);
    if (isValidExternalHttpUrl(url)) {
      pushUniqueButton(findUs, {
        id: "order",
        label: d.homeBasedBusiness ? (lang === "en" ? "Order now" : "Pedir ahora") : lang === "en" ? "Order online" : "Ordenar en línea",
        href: url,
        action: "order",
        fullWidth: Boolean(d.homeBasedBusiness),
      });
    }
  }
  if (nonEmpty(d.reservationUrl)) {
    const url = normalizeRestaurantUrl(d.reservationUrl!);
    if (isValidExternalHttpUrl(url)) {
      pushUniqueButton(findUs, {
        id: "reserve",
        label: lang === "en" ? "Reserve" : "Reservar",
        href: url,
        action: "booking",
      });
    }
  }
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
          fullWidth: true,
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
        fullWidth: true,
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

  const showStreet = shouldShowStreetAddress(d);
  const cityLine = [d.cityCanonical, d.state, d.zipCode].filter(nonEmpty).join(", ");
  const mapsHref = resolveMapsHref(d, showStreet);
  const home = d.homeBasedStack;
  const pickupNote = d.homeBasedBusiness && nonEmpty(home?.pickupInstructions) ? home!.pickupInstructions!.trim() : undefined;
  const serviceArea =
    !showStreet && nonEmpty(d.serviceAreaText) ? d.serviceAreaText!.trim() : !showStreet && cityLine ? cityLine : undefined;

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
      mapsLabel: lang === "en" ? "View on map" : "Ver en el mapa",
    };
  }

  const hasAny =
    contactUs.length > 0 ||
    social.length > 0 ||
    reviews.length > 0 ||
    findUs.length > 0 ||
    catering.length > 0 ||
    Boolean(location?.addressLine1 || location?.addressLine2 || location?.mapsHref || location?.supportingText);

  if (!hasAny) return undefined;

  return {
    hasAny,
    businessName,
    contactUs,
    social,
    reviews,
    findUs,
    catering,
    location,
  };
}
