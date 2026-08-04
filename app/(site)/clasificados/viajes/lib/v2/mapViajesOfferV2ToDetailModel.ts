import type { ViajesContactChannel, ViajesOfferDetailModel } from "../../data/viajesOfferDetailSampleData";
import type { ViajesOfferModelV2 } from "./viajesOfferModelV2";
import { getViajesHeroAsset } from "./viajesOfferV2Validation";
import { isViajesDurableHttpsUrl } from "./viajesMediaDurableGuards";
import { viajesPhoneActionDigits } from "./viajesPhoneDisplay";
import { normalizeViajesSanJoseCaliforniaLabel } from "../viajesPublicLocation";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2000&q=80";

function withHttp(url: string) {
  const t = url.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return `https://${t.replace(/^\/+/, "")}`;
}

function buildChannels(offer: ViajesOfferModelV2): ViajesContactChannel[] {
  const out: ViajesContactChannel[] = [];
  const push = (kind: ViajesContactChannel["kind"], href: string, label: string) => {
    if (!href.trim()) return;
    if (out.some((x) => x.kind === kind && x.href === href)) return;
    out.push({ kind, href, label });
  };
  const p = viajesPhoneActionDigits(offer.contact.phoneRaw || offer.contact.phone || offer.provider.phoneRaw || offer.provider.phone);
  if (p.length >= 8) push("tel", `tel:${p}`, offer.contact.phone || offer.provider.phone || p);
  const po = viajesPhoneActionDigits(offer.contact.phoneOfficeRaw || offer.contact.phoneOffice);
  if (po.length >= 8 && po !== p) push("telOffice", `tel:${po}`, offer.contact.phoneOffice || po);
  const smsDigits = viajesPhoneActionDigits(offer.provider.smsRaw || offer.provider.sms);
  if (smsDigits.length >= 8) push("sms", `sms:${smsDigits}`, "SMS");
  const waRaw = offer.contact.whatsappRaw || offer.contact.whatsapp || offer.provider.whatsappRaw || offer.provider.whatsapp;
  if (waRaw.trim().startsWith("http")) push("whatsapp", waRaw.trim(), "WhatsApp");
  else {
    const w = viajesPhoneActionDigits(waRaw);
    if (w.length >= 8) push("whatsapp", `https://wa.me/${w}`, "WhatsApp");
  }
  const web = withHttp(offer.contact.website || offer.provider.website);
  if (web) push("website", web, "Web");
  const booking = withHttp(offer.provider.bookingUrl);
  if (booking && booking !== web) push("website", booking, offer.locale === "en" ? "Booking" : "Reservar");
  if ((offer.contact.email || offer.provider.email).includes("@")) {
    const email = (offer.contact.email || offer.provider.email).trim();
    push("email", `mailto:${encodeURIComponent(email)}`, email);
  }
  const directions = withHttp(offer.provider.directionsUrl);
  if (directions) push("directions", directions, offer.locale === "en" ? "Directions" : "Cómo llegar");
  const socials: Array<[ViajesContactChannel["kind"], string]> = [
    ["facebook", offer.provider.socialFacebook],
    ["instagram", offer.provider.socialInstagram],
    ["tiktok", offer.provider.socialTiktok],
    ["youtube", offer.provider.socialYoutube],
    ["twitter", offer.provider.socialX],
    ["linkedin", offer.provider.socialLinkedin],
    ["snapchat", offer.provider.socialSnapchat],
    ["pinterest", offer.provider.socialPinterest],
  ];
  for (const [kind, url] of socials) {
    const href = withHttp(url);
    if (href.startsWith("https://") || href.startsWith("http://")) push(kind, href, kind);
  }
  return out;
}

function buildCta(offer: ViajesOfferModelV2, lang: "es" | "en"): { label: string; href: string } {
  if (offer.lane === "affiliate") {
    const outbound = withHttp(offer.source.outboundUrl || offer.provider.bookingUrl || offer.provider.website);
    return {
      label: lang === "en" ? "View with partner" : "Ver con el socio",
      href: outbound,
    };
  }
  if (offer.lane === "editorial") {
    return {
      label: lang === "en" ? "Explore more" : "Explorar más",
      href: "/clasificados/viajes",
    };
  }
  const channels = buildChannels(offer);
  const type = offer.contact.primaryCtaType;
  const find = (kinds: ViajesContactChannel["kind"][]) => channels.find((c) => kinds.includes(c.kind));
  if (type === "whatsapp") {
    const c = find(["whatsapp"]) || find(["tel", "email", "website"]);
    return { label: "WhatsApp", href: c?.href || "" };
  }
  if (type === "phone") {
    const c = find(["tel", "telOffice"]) || find(["whatsapp", "email", "website"]);
    return { label: lang === "en" ? "Call" : "Llamar", href: c?.href || "" };
  }
  if (type === "email") {
    const c = find(["email"]) || find(["website", "whatsapp", "tel"]);
    return { label: lang === "en" ? "Email" : "Correo", href: c?.href || "" };
  }
  if (type === "booking") {
    const href = withHttp(offer.provider.bookingUrl || offer.provider.website);
    return { label: lang === "en" ? "View with provider" : "Ver con el proveedor", href };
  }
  const c = find(["website"]) || find(["whatsapp", "tel", "email"]);
  return { label: lang === "en" ? "Website" : "Sitio web", href: c?.href || withHttp(offer.contact.website) };
}

export type ViajesOfferDetailModelV2Extras = ViajesOfferDetailModel & {
  v2Modules?: ViajesOfferModelV2["modules"];
  v2Itinerary?: ViajesOfferModelV2["itinerary"];
  v2Gallery?: Array<{ src: string; alt: string; focalX: number; focalY: number }>;
  v2Offer?: ViajesOfferModelV2;
};

export function mapViajesOfferV2ToDetailModel(
  offer: ViajesOfferModelV2,
  opts?: { sparse?: boolean; lang?: "es" | "en"; heroSrcOverride?: string; trustNote?: string }
): ViajesOfferDetailModelV2Extras {
  const lang = opts?.lang ?? offer.locale ?? "es";
  const sparse = opts?.sparse === true;
  const hero = getViajesHeroAsset(offer.media.images);
  const heroSrc =
    opts?.heroSrcOverride ||
    (hero && isViajesDurableHttpsUrl(hero.url) ? hero.url : "") ||
    hero?.localPreviewObjectUrl ||
    FALLBACK_HERO;
  const cta = buildCta(offer, lang);
  const channels = buildChannels(offer);
  const includes = offer.inclusions.map((p) => p.label).filter(Boolean);
  const tags: string[] = [];
  if (offer.basics.audienceFamilies) tags.push(lang === "en" ? "Families" : "Familias");
  if (offer.basics.audienceCouples) tags.push(lang === "en" ? "Couples" : "Parejas");
  if (offer.basics.audienceGroups) tags.push(lang === "en" ? "Groups" : "Grupos");

  const who: string[] = [];
  if (offer.basics.spanishGuide) who.push(lang === "en" ? "Spanish guide" : "Guía en español");
  if (offer.basics.serviceLanguage.trim()) who.push(offer.basics.serviceLanguage.trim());

  const dateParts = [offer.schedule.startDate, offer.schedule.endDate, offer.schedule.note, offer.schedule.legacyFechas]
    .map((x) => x.trim())
    .filter(Boolean);

  const gallery = offer.media.images
    .filter((i) => isViajesDurableHttpsUrl(i.url) || Boolean(i.localPreviewObjectUrl))
    .sort((a, b) => a.galleryOrder - b.galleryOrder)
    .map((i) => ({
      src: isViajesDurableHttpsUrl(i.url) ? i.url : String(i.localPreviewObjectUrl || ""),
      alt: i.alt || offer.basics.title,
      focalX: i.focal.x,
      focalY: i.focal.y,
    }))
    .filter((g) => g.src);

  const partnerName =
    offer.lane === "private"
      ? offer.contact.displayName || (lang === "en" ? "Private seller" : "Particular")
      : offer.lane === "editorial"
        ? offer.provider.name || (lang === "en" ? "Leonix Guides" : "Guías Leonix")
        : offer.provider.name || offer.contact.displayName || (lang === "en" ? "Travel business" : "Negocio de viajes");

  const profileRoute = offer.provider.profileRoute.trim();
  const secondary =
    offer.lane === "business" && profileRoute
      ? {
          secondaryCtaLabel: lang === "en" ? "View profile" : "Ver perfil",
          secondaryCtaHref: profileRoute.startsWith("/") ? profileRoute : `/clasificados/viajes/negocio/${profileRoute}`,
        }
      : {};

  return {
    slug: offer.lifecycle.slug || "preview",
    heroImageSrc: heroSrc,
    heroImageAlt: hero?.alt || offer.basics.title || (lang === "en" ? "Travel offer" : "Oferta de viaje"),
    heroUseNativeImg: Boolean(opts?.heroSrcOverride?.startsWith("blob:") || hero?.localPreviewObjectUrl),
    title: offer.basics.title || (sparse ? (lang === "en" ? "Untitled offer" : "Sin título") : ""),
    destination: offer.basics.destinationLabel || offer.locations.destination.publicLabel || offer.locations.destination.city || "",
    priceFrom: offer.pricing.priceFrom || (sparse ? "" : lang === "en" ? "Ask provider" : "Consultar"),
    duration: offer.basics.durationLabel || "",
    departureCity: normalizeViajesSanJoseCaliforniaLabel(
      offer.basics.departureLabel ||
        offer.locations.departureMeetingPort.publicLabel ||
        offer.locations.departureMeetingPort.city ||
        ""
    ),
    tags,
    mainCtaLabel: cta.label,
    mainCtaHref: cta.href,
    includes:
      includes.length > 0
        ? includes
        : sparse
          ? []
          : [lang === "en" ? "Confirm inclusions with the provider." : "Confirma inclusiones con el proveedor."],
    whoItsFor: who,
    partner: {
      name: partnerName,
      isAffiliate: offer.lane === "affiliate",
      privateSeller: offer.lane === "private",
      editorial: offer.lane === "editorial",
      ...(isViajesDurableHttpsUrl(offer.provider.logoUrl) && offer.lane !== "private" ? { logoSrc: offer.provider.logoUrl } : {}),
      ...(offer.lane === "private" && isViajesDurableHttpsUrl(offer.provider.logoUrl) ? { logoSrc: offer.provider.logoUrl } : {}),
      ...(offer.lane === "affiliate" && offer.source.disclosure
        ? { affiliateDisclosure: offer.source.disclosure }
        : {}),
      ctaLabel: cta.label,
      ctaHref: cta.href,
      ...secondary,
      ...(channels.length ? { contactChannels: channels } : {}),
    },
    dateRange: dateParts.length ? dateParts.join(" · ") : undefined,
    notes: offer.policies.map((p) => p.label).filter(Boolean).join(" · ") || undefined,
    description: offer.story,
    trustNote: opts?.trustNote,
    v2Modules: offer.modules,
    v2Itinerary: offer.itinerary,
    v2Gallery: gallery,
    v2Offer: offer,
  };
}
