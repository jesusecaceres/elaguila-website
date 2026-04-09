import type { ViajesOfferDetailModel } from "@/app/(site)/clasificados/viajes/data/viajesOfferDetailSampleData";

import type { PublicarViajesPrivadoCopy } from "../data/publicarViajesPrivadoCopy";
import type { ViajesPrivadoDraft } from "./viajesPrivadoDraftTypes";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2000&q=80";

function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

function buildCta(d: ViajesPrivadoDraft, c: PublicarViajesPrivadoCopy): { label: string; href: string } {
  if (d.ctaType === "whatsapp") {
    const w = d.whatsapp.trim();
    if (w.startsWith("http")) return { label: c.contact.ctaType.options.whatsapp, href: w };
    const num = digitsOnly(w);
    if (num.length >= 8) return { label: c.contact.ctaType.options.whatsapp, href: `https://wa.me/${num}` };
    return { label: c.contact.ctaType.options.whatsapp, href: "https://wa.me/" };
  }
  if (d.ctaType === "phone") {
    const p = d.phone.trim();
    const num = digitsOnly(p);
    if (num.length >= 8) return { label: c.contact.ctaType.options.phone, href: `tel:${num}` };
    return { label: c.contact.ctaType.options.phone, href: "tel:" };
  }
  const em = d.email.trim();
  if (em.includes("@")) return { label: c.contact.ctaType.options.email, href: `mailto:${encodeURIComponent(em)}` };
  return { label: c.contact.ctaType.options.email, href: "mailto:" };
}

export function mapViajesPrivadoDraftToOffer(
  d: ViajesPrivadoDraft,
  c: PublicarViajesPrivadoCopy,
  lang: "es" | "en",
  opts?: { sparse?: boolean }
): ViajesOfferDetailModel {
  const sparse = opts?.sparse === true;
  const cta = buildCta(d, c);
  const remote = d.imagenUrl.trim();
  const local = d.localImageDataUrl?.trim();
  const heroSrc = local || remote || FALLBACK_HERO;
  const heroNative = Boolean(local || (remote && !remote.includes("images.unsplash.com")));

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
    },
    dateRange: d.fechas.trim() || undefined,
    notes: d.politicaReserva.trim() || undefined,
    description: d.descripcion.trim() || (sparse ? "" : lang === "en" ? "Add a short description in the form." : "Añade una descripción breve en el formulario."),
    trustNote: c.laneSummary,
  };
}
