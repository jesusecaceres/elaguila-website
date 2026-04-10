import type { ViajesOfferDetailModel } from "@/app/(site)/clasificados/viajes/data/viajesOfferDetailSampleData";
import type { ViajesHeroVisualKind } from "@/app/(site)/clasificados/viajes/lib/viajesOfferHeroFallbacks";

import type { PublicarViajesNegociosUi } from "../data/publicarViajesNegociosCopy";
import type { ViajesNegociosDraft } from "./viajesNegociosDraftTypes";
import { viajesBuildNegociosContactChannels } from "../../lib/viajesContactChannelsFromDraft";
import { viajesResolveFechasDisplay } from "../../lib/viajesResolveFechasDisplay";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2000&q=80";

function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

function withHttp(url: string) {
  const t = url.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return `https://${t}`;
}

function negociosOfferTypeToHeroKind(offerType: string): ViajesHeroVisualKind | undefined {
  if (offerType === "resort") return "resort";
  if (offerType === "crucero" || offerType === "tour") return "itinerary";
  return undefined;
}

function buildCta(
  d: ViajesNegociosDraft,
  c: PublicarViajesNegociosUi
): { label: string; href: string; secondaryLabel?: string; secondaryHref?: string } {
  const web = withHttp(d.website);
  if (d.ctaType === "whatsapp") {
    const w = d.whatsapp.trim();
    if (w.startsWith("http")) return { label: c.ctaType.options.whatsapp, href: w };
    const num = digitsOnly(w);
    if (num.length >= 8) return { label: c.ctaType.options.whatsapp, href: `https://wa.me/${num}` };
    return { label: c.ctaType.options.whatsapp, href: "https://wa.me/" };
  }
  if (d.ctaType === "telefono") {
    const p = d.phone.trim() || d.phoneOffice.trim();
    const num = digitsOnly(p);
    if (num.length >= 8) return { label: c.ctaType.options.telefono, href: `tel:${num}` };
    return { label: c.ctaType.options.telefono, href: "tel:" };
  }
  if (d.ctaType === "correo") {
    const candidate =
      d.email.trim() ||
      (d.website.trim().includes("@") ? d.website.trim() : "") ||
      (d.socials.trim().includes("@") ? d.socials.trim().split(/\s+/).find((x) => x.includes("@")) ?? "" : "");
    if (candidate.includes("@")) {
      return { label: c.ctaType.options.correo, href: `mailto:${encodeURIComponent(candidate)}` };
    }
    return { label: c.ctaType.options.correo, href: "mailto:" };
  }
  if (web) return { label: c.ctaType.options.sitio, href: web };
  return { label: c.ctaType.options.sitio, href: "https://" };
}

export function mapViajesNegociosDraftToOffer(
  d: ViajesNegociosDraft,
  c: PublicarViajesNegociosUi,
  lang: "es" | "en",
  opts?: { sparse?: boolean; heroSrcOverride?: string }
): ViajesOfferDetailModel {
  const sparse = opts?.sparse === true;
  const cta = buildCta(d, c);
  const remote = d.imagenPrincipal.trim();
  const local = d.localImageDataUrl?.trim();
  const heroSrc = opts?.heroSrcOverride || local || remote || FALLBACK_HERO;
  const heroNative = Boolean(
    opts?.heroSrcOverride?.startsWith("blob:") || local || (remote && !remote.includes("images.unsplash.com"))
  );

  const tags: string[] = [];
  if (d.offerType && c.offerType.options[d.offerType]) tags.push(c.offerType.options[d.offerType]);
  if (d.familias) tags.push(c.audience.families);
  if (d.parejas) tags.push(c.audience.couples);
  if (d.grupos) tags.push(c.audience.groups);
  if (d.presupuestoTag === "economico") tags.push(c.audience.budgetTag.economy);
  else if (d.presupuestoTag === "moderado") tags.push(c.audience.budgetTag.moderate);
  else if (d.presupuestoTag === "premium") tags.push(c.audience.budgetTag.premium);

  const includesLines = d.incluye
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
  let includes =
    includesLines.length > 0
      ? includesLines
      : d.incluyeHotel || d.incluyeTransporte || d.incluyeComida
        ? [d.incluyeHotel ? c.audience.includesHotel : "", d.incluyeTransporte ? c.audience.includesTransport : "", d.incluyeComida ? c.audience.includesFood : ""].filter(
            Boolean
          )
        : [];
  if (!includes.length && !sparse) {
    includes = [lang === "en" ? "Confirm inclusions directly with the business." : "Confirma inclusiones directamente con el negocio."];
  }

  const who: string[] = [];
  if (d.guiaEspanol) who.push(c.audience.spanishGuide);
  if (d.idiomaAtencion.trim()) who.push(`${c.audience.serviceLanguage.label}: ${d.idiomaAtencion.trim()}`);
  if (who.length === 0 && (d.familias || d.parejas || d.grupos)) {
    if (d.familias) who.push(c.audience.families);
    if (d.parejas) who.push(c.audience.couples);
    if (d.grupos) who.push(c.audience.groups);
  }
  let whoFinal = who;
  if (!whoFinal.length && !sparse) {
    whoFinal = [lang === "en" ? "Use the contact method to confirm fit and availability." : "Usa el contacto para confirmar encaje y disponibilidad."];
  }

  const display = d.businessName.trim() || (lang === "en" ? "Your business" : "Tu negocio");
  const titleFallback = lang === "en" ? "Business travel offer" : "Oferta de viajes — negocio";
  const untitled = lang === "en" ? "Untitled offer" : "Sin título";

  const metaLines: string[] = [];
  if (d.languages.trim()) metaLines.push(`${c.business.languages.label}: ${d.languages.trim()}`);
  if (d.destinationsServed.trim()) metaLines.push(`${c.business.destinationsServed.label}: ${d.destinationsServed.trim()}`);
  const descBase = d.descripcion.trim().replace(/\n{3,}/g, "\n\n");
  const descriptionParts = [descBase, ...metaLines].filter(Boolean);
  const description =
    descriptionParts.join("\n\n").trim() ||
    (sparse ? "" : lang === "en" ? "Add a short description in the form." : "Añade una descripción en el formulario.");

  const web = withHttp(d.website);
  let secondaryLabel: string | undefined;
  let secondaryHref: string | undefined;
  if (web && d.ctaType !== "sitio") {
    secondaryLabel = lang === "en" ? "Website" : "Sitio web";
    secondaryHref = web;
  }

  const notesParts: string[] = [];
  if (d.galeriaNota.trim()) notesParts.push(`${c.multimedia.gallery.label}: ${d.galeriaNota.trim()}`);
  if (d.galeriaUrls?.length) {
    const urlOnly = d.galeriaUrls.filter((u) => u.startsWith("http"));
    if (urlOnly.length) notesParts.push(`${c.multimedia.gallery.label}: ${urlOnly.slice(0, 6).join(" · ")}`);
  }
  if (d.videoUrl.trim()) notesParts.push(`${c.multimedia.video.label}: ${d.videoUrl.trim()}`);
  if (d.videoLocalLabel.trim()) {
    notesParts.push(
      lang === "en" ? `Video file (local): ${d.videoLocalLabel.trim()}` : `Archivo de video (local): ${d.videoLocalLabel.trim()}`
    );
  }
  if (d.socials.trim()) notesParts.push(`${c.business.socials.label}: ${d.socials.trim()}`);
  const notes = notesParts.length ? notesParts.join(" · ") : undefined;

  const logoTrim = (d.logoLocalDataUrl?.trim() || d.logoSocio.trim()) || "";
  const heroVisualKind = negociosOfferTypeToHeroKind(d.offerType);

  const dateRangeRaw = viajesResolveFechasDisplay(
    {
      dateMode: d.dateMode,
      fechas: d.fechas,
      fechaInicio: d.fechaInicio,
      fechaFin: d.fechaFin,
      fechasNota: d.fechasNota,
    },
    lang
  );
  const dateRange = dateRangeRaw.trim() || undefined;

  const contactChannels = viajesBuildNegociosContactChannels({
    phone: d.phone,
    phoneOffice: d.phoneOffice,
    whatsapp: d.whatsapp,
    website: d.website,
    email: d.email,
    socialFacebook: d.socialFacebook,
    socialInstagram: d.socialInstagram,
    socialTiktok: d.socialTiktok,
    socialYoutube: d.socialYoutube,
    socialTwitter: d.socialTwitter,
  });

  return {
    slug: "preview-negocios",
    heroImageSrc: heroSrc,
    heroImageAlt: d.titulo.trim() || (lang === "en" ? "Travel offer" : "Oferta de viaje"),
    heroUseNativeImg: heroNative,
    ...(heroVisualKind ? { heroVisualKind } : {}),
    title: d.titulo.trim() || (sparse ? untitled : titleFallback),
    destination: d.destino.trim() || (sparse ? "" : "—"),
    priceFrom: d.precio.trim() || (sparse ? "" : lang === "en" ? "Ask for quote" : "Consultar"),
    duration: d.duracion.trim() || (sparse ? "" : "—"),
    departureCity: d.ciudadSalida.trim() || (sparse ? "" : "—"),
    tags: tags.length ? tags.slice(0, 6) : sparse ? [] : [lang === "en" ? "Business listing" : "Negocio"],
    mainCtaLabel: cta.label,
    mainCtaHref: cta.href,
    includes,
    whoItsFor: whoFinal,
    partner: {
      name: display,
      isAffiliate: false,
      privateSeller: false,
      ...(logoTrim ? { logoSrc: logoTrim } : {}),
      ctaLabel: cta.label,
      ctaHref: cta.href,
      secondaryCtaLabel: secondaryLabel,
      secondaryCtaHref: secondaryHref,
      ...(contactChannels.length ? { contactChannels } : {}),
    },
    dateRange,
    notes,
    description,
    trustNote:
      lang === "en"
        ? "Business listing draft — Leonix has not verified this application yet."
        : "Borrador de negocio — Leonix aún no ha verificado esta solicitud.",
  };
}
