import type { ViajesOfferDetailModel } from "@/app/(site)/clasificados/viajes/data/viajesOfferDetailSampleData";

import type { PublicarViajesPrivadoCopy } from "../data/publicarViajesPrivadoCopy";
import type { ViajesPrivadoDraft } from "./viajesPrivadoDraftTypes";
import { viajesBuildPrivadoContactChannels } from "../../lib/viajesContactChannelsFromDraft";
import { viajesResolveFechasDisplay } from "../../lib/viajesResolveFechasDisplay";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2000&q=80";

function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

function waMeHref(raw: string): string | null {
  const w = raw.trim();
  if (!w) return null;
  if (w.startsWith("http")) return w;
  const num = digitsOnly(w);
  return num.length >= 8 ? `https://wa.me/${num}` : null;
}

function telHrefFrom(raw: string): string | null {
  const num = digitsOnly(raw);
  return num.length >= 8 ? `tel:${num}` : null;
}

function withHttp(url: string) {
  const t = url.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return `https://${t}`;
}

function buildCta(d: ViajesPrivadoDraft, c: PublicarViajesPrivadoCopy): { label: string; href: string } {
  const phoneLine = d.phone.trim() || d.phoneOffice.trim();
  const web = withHttp(d.website);

  const tryWhatsapp = (): { label: string; href: string } | null => {
    const h = waMeHref(d.whatsapp);
    return h ? { label: c.contact.ctaType.options.whatsapp, href: h } : null;
  };
  const tryPhone = (): { label: string; href: string } | null => {
    const h = telHrefFrom(phoneLine);
    return h ? { label: c.contact.ctaType.options.phone, href: h } : null;
  };
  const tryMail = (): { label: string; href: string } | null => {
    const em = d.email.trim();
    if (!em.includes("@")) return null;
    return { label: c.contact.ctaType.options.email, href: `mailto:${encodeURIComponent(em)}` };
  };
  const trySite = (): { label: string; href: string } | null => {
    return web ? { label: c.contact.website.label, href: web } : null;
  };

  if (d.ctaType === "whatsapp") {
    return tryWhatsapp() ?? tryPhone() ?? tryMail() ?? trySite() ?? { label: c.contact.ctaType.options.whatsapp, href: "" };
  }
  if (d.ctaType === "phone") {
    return tryPhone() ?? tryWhatsapp() ?? tryMail() ?? trySite() ?? { label: c.contact.ctaType.options.phone, href: "" };
  }
  return tryMail() ?? trySite() ?? tryPhone() ?? tryWhatsapp() ?? { label: c.contact.ctaType.options.email, href: "" };
}

export function mapViajesPrivadoDraftToOffer(
  d: ViajesPrivadoDraft,
  c: PublicarViajesPrivadoCopy,
  lang: "es" | "en",
  opts?: { sparse?: boolean; heroSrcOverride?: string }
): ViajesOfferDetailModel {
  const sparse = opts?.sparse === true;
  const cta = buildCta(d, c);
  const remote = d.imagenUrl.trim();
  const local = d.localImageDataUrl?.trim();
  const heroSrc = (opts?.heroSrcOverride?.trim() || local || remote || FALLBACK_HERO).trim() || FALLBACK_HERO;
  const heroNative = Boolean(
    (opts?.heroSrcOverride && opts.heroSrcOverride.startsWith("blob:")) || local || (remote && !remote.includes("images.unsplash.com"))
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
        ? [d.incluyeHotel ? c.includesFlags.hotel : "", d.incluyeTransporte ? c.includesFlags.transport : "", d.incluyeComida ? c.includesFlags.food : ""].filter(
            Boolean
          )
        : [];
  if (!includes.length && !sparse) {
    includes = [lang === "en" ? "Details to be confirmed with the seller." : "Detalles a confirmar con el anunciante."];
  }

  const who: string[] = [];
  if (d.numeroPersonas.trim()) who.push(`${lang === "en" ? "Group size: " : "Tamaño del grupo: "}${d.numeroPersonas.trim()}`);
  if (d.guiaEspanol) who.push(c.audience.spanishGuide);
  if (d.idiomaAtencion.trim()) who.push(`${c.audience.serviceLanguage.label}: ${d.idiomaAtencion.trim()}`);
  if (who.length === 0 && (d.familias || d.parejas || d.grupos)) {
    if (d.familias) who.push(c.audience.families);
    if (d.parejas) who.push(c.audience.couples);
    if (d.grupos) who.push(c.audience.groups);
  }
  let whoFinal = who;
  if (!whoFinal.length && !sparse) {
    whoFinal = [
      lang === "en"
        ? "Open the contact method you prefer to confirm availability and terms."
        : "Usa el contacto para confirmar disponibilidad y condiciones.",
    ];
  }

  const display = d.displayName.trim() || (lang === "en" ? "Private seller" : "Particular");

  const titleFallback = lang === "en" ? "Your travel offer" : "Tu oferta de viaje";
  const untitled = lang === "en" ? "Untitled offer" : "Sin título";

  const notesParts: string[] = [];
  if (d.politicaReserva.trim()) notesParts.push(d.politicaReserva.trim());
  if (d.galeriaUrls?.length) {
    const urlOnly = d.galeriaUrls.filter((u) => u.startsWith("http"));
    if (urlOnly.length) notesParts.push(`${c.multimedia.gallery.label}: ${urlOnly.slice(0, 6).join(" · ")}`);
  }
  const notesMerged = notesParts.length ? notesParts.join("\n\n") : undefined;

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

  const contactChannels = viajesBuildPrivadoContactChannels({
    phone: d.phone,
    phoneOffice: d.phoneOffice,
    whatsapp: d.whatsapp,
    email: d.email,
    website: d.website,
    socialFacebook: d.socialFacebook,
    socialInstagram: d.socialInstagram,
    socialTiktok: d.socialTiktok,
    socialYoutube: d.socialYoutube,
    socialTwitter: d.socialTwitter,
  });

  return {
    slug: "preview-privado",
    heroImageSrc: heroSrc,
    heroImageAlt: d.titulo.trim() || (lang === "en" ? "Travel offer" : "Oferta de viaje"),
    heroUseNativeImg: heroNative,
    title: d.titulo.trim() || (sparse ? untitled : titleFallback),
    destination: d.destino.trim() || (sparse ? "" : "—"),
    priceFrom: d.precio.trim() || (sparse ? "" : lang === "en" ? "Ask for price" : "Consultar precio"),
    duration: d.duracion.trim() || (sparse ? "" : "—"),
    departureCity: d.ciudadSalida.trim() || (sparse ? "" : "—"),
    tags: tags.length ? tags.slice(0, 6) : sparse ? [] : [lang === "en" ? "Private listing" : "Anuncio particular"],
    mainCtaLabel: cta.label,
    mainCtaHref: cta.href,
    includes,
    whoItsFor: whoFinal,
    partner: {
      name: display,
      isAffiliate: false,
      privateSeller: true,
      ctaLabel: cta.label,
      ctaHref: cta.href,
      ...(contactChannels.length ? { contactChannels } : {}),
    },
    dateRange,
    notes: notesMerged,
    description:
      d.descripcion
        .trim()
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\s+$/g, "") ||
      (sparse ? "" : lang === "en" ? "Add a short description in the form." : "Añade una descripción breve en el formulario."),
    trustNote: c.laneSummary,
  };
}
