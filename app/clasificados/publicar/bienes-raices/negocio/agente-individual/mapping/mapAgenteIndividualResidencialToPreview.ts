/**
 * Único mapper: formulario → VM de vista previa (estructura fija por slots).
 */
import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import { AGENTE_RES_DESTACADOS_DEFS } from "../schema/agenteIndividualResidencialFormState";
import type { AgenteIndividualResidencialPreviewVm } from "./agenteIndividualResidencialPreviewVm";
import { digitsOnly } from "../application/utils/phoneMask";

function trim(s: unknown): string {
  if (s == null) return "";
  if (typeof s === "string") return s.trim();
  return String(s).trim();
}

const STATUS_LABEL: Record<AgenteIndividualResidencialFormState["estadoAnuncio"], string> = {
  disponible: "Disponible",
  bajo_contrato: "Bajo contrato",
  vendido: "Vendido",
  rentado: "Rentado",
  proximamente: "Próximamente",
};

function hrefFromUserInput(t: string): string | null {
  const s = trim(t);
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^www\./i.test(s)) return `https://${s}`;
  if (/^[a-z0-9][a-z0-9-]*\.[a-z]{2,}([/?#].*)?$/i.test(s)) return `https://${s}`;
  return null;
}

function formatPrice(raw: string): string {
  const t = trim(raw);
  if (!t) return "—";
  const n = Number(String(t).replace(/[^0-9.]/g, ""));
  if (Number.isFinite(n)) {
    try {
      return new Intl.NumberFormat("es-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
    } catch {
      return t.startsWith("$") ? t : `$${t}`;
    }
  }
  return t.startsWith("$") ? t : `$${t}`;
}

function buildMailto(to: string, subject: string, body: string): string | null {
  const e = trim(to);
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return `mailto:${e}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildTelHref(phoneDigits: string): string | null {
  const d = digitsOnly(phoneDigits);
  if (d.length < 10) return null;
  return `tel:${d}`;
}

function buildWhatsappHref(phoneDigits: string, msg: string): string | null {
  const d = digitsOnly(phoneDigits);
  if (d.length < 10) return null;
  const text = trim(msg) || "Hola, vi su anuncio en Leonix y quiero más información.";
  return `https://wa.me/1${d}?text=${encodeURIComponent(text)}`;
}

function socialChipLabel(raw: string): string {
  const s = trim(raw);
  if (!s) return "";
  const asUrl = hrefFromUserInput(s);
  if (asUrl) {
    try {
      const host = new URL(asUrl).hostname.replace(/^www\./, "");
      const base = host.split(".")[0] ?? host;
      return base.slice(0, 3).toUpperCase();
    } catch {
      return s.slice(0, 8);
    }
  }
  return s.length > 10 ? `${s.slice(0, 8)}…` : s;
}

function buildSocialLinks(raws: string[]): Array<{ label: string; href: string }> {
  const out: Array<{ label: string; href: string }> = [];
  for (const raw of raws) {
    const t = trim(raw);
    if (!t) continue;
    const href = hrefFromUserInput(t);
    if (!href) continue;
    const label = socialChipLabel(t);
    if (label) out.push({ label, href });
  }
  return out.slice(0, 6);
}

function normalizeStatus(s: AgenteIndividualResidencialFormState): string {
  const st = s.estadoAnuncio;
  return STATUS_LABEL[st] ?? STATUS_LABEL.disponible;
}

function videoPlayableUrl(state: AgenteIndividualResidencialFormState): string | null {
  const u = trim(state.media.videoUrl) || trim(state.media.videoDataUrl);
  return u || null;
}

function tourHref(state: AgenteIndividualResidencialFormState): string | null {
  const u = trim(state.media.tourUrl) || trim(state.media.tourDataUrl);
  if (!u) return null;
  return hrefFromUserInput(u) ?? (u.startsWith("data:") ? u : null);
}

function brochureHref(state: AgenteIndividualResidencialFormState): string | null {
  const u = trim(state.media.brochureUrl) || trim(state.media.brochureDataUrl);
  if (!u) return null;
  return hrefFromUserInput(u) ?? (u.startsWith("data:") ? u : null);
}

export function mapAgenteIndividualResidencialToPreview(
  s: AgenteIndividualResidencialFormState
): AgenteIndividualResidencialPreviewVm {
  const photos = (Array.isArray(s.media?.photoUrls) ? s.media.photoUrls : []).map(trim).filter(Boolean);
  const cover = Math.min(Math.max(0, Number(s.media?.primaryImageIndex) || 0), Math.max(0, photos.length - 1));
  const heroUrl = photos.length ? photos[cover]! : null;
  const secondary = photos.filter((_, i) => i !== cover).slice(0, 3);

  const pubLabel = s.tipoPublicacion === "residencial_renta" ? "Renta residencial" : "Venta residencial";
  const cityLine = [trim(s.ciudad), trim(s.areaCiudad)].filter(Boolean).join(" · ") || "—";
  const locationLine = [cityLine, trim(s.direccion)].filter(Boolean).join(" · ");

  const d = s.detalles;
  const quickFacts: Array<{ label: string; value: string }> = [
    { label: "Recámaras", value: trim(d.recamaras) || "—" },
    { label: "Baños", value: trim(d.banos) || "—" },
    { label: "Tamaño interior", value: trim(d.tamanoInterior) || "—" },
  ];

  const tipoVal = [trim(s.tipoPropiedad), trim(s.subtipoPropiedad)].filter(Boolean).join(" · ");
  const propertyRows: AgenteIndividualResidencialPreviewVm["propertyRows"] = [
    { label: "Tipo de propiedad", value: tipoVal || "—" },
    { label: "Recámaras", value: trim(d.recamaras) || "—" },
    { label: "Baños", value: trim(d.banos) || "—" },
    { label: "Medios baños", value: trim(d.mediosBanos) || "—" },
    { label: "Tamaño interior", value: trim(d.tamanoInterior) || "—" },
    { label: "Tamaño del lote", value: trim(d.tamanoLote) || "—" },
    { label: "Estacionamientos", value: trim(d.estacionamientos) || "—" },
    { label: "Año de construcción", value: trim(d.anioConstruccion) || "—" },
    { label: "Condición", value: trim(d.condicion) || "—" },
  ];

  const destacadosLabels: string[] = [];
  for (const def of AGENTE_RES_DESTACADOS_DEFS) {
    if (s.destacados?.[def.key]) destacadosLabels.push(def.label);
  }

  const ag = s.agente;
  const site = hrefFromUserInput(ag.sitioWeb);
  const redesParsed = buildSocialLinks(ag.redes ?? []);
  const title = trim(s.titulo) || "Título del anuncio";
  const email = trim(ag.email);
  const phone = trim(ag.telefono);
  const phoneDigits = digitsOnly(phone);

  const listadoHref = hrefFromUserInput(s.enlaceListado);
  const videoUrl = videoPlayableUrl(s);
  const tourH = tourHref(s);
  const brochH = brochureHref(s);

  const cta = s.cta;
  const solicitarInfoHref = buildMailto(email, `Consulta — ${title}`, `Hola,\n\nMe interesa: ${title}`);
  const visitaHref = buildMailto(
    email,
    `Visita — ${title}`,
    `Hola,\n\nMe interesa ${title} y quiero programar una visita.`
  );
  const llamarHref = cta.permitirLlamar ? buildTelHref(phoneDigits) : null;
  const waHref = cta.permitirWhatsapp ? buildWhatsappHref(phoneDigits, "") : null;

  const showVerListado = Boolean(cta.mostrarVerListadoCompleto && listadoHref);
  const showVerTour = Boolean(cta.mostrarVerTour && tourH);
  const showVerFolleto = Boolean(cta.mostrarVerFolleto && brochH);
  const showSitio = Boolean(cta.mostrarVerSitioWeb && site);
  const showRedes = Boolean(cta.mostrarVerRedes && redesParsed.length > 0);

  const openParts: string[] = [];
  if (s.extras.openHouseActivo) {
    if (trim(s.extras.openHouseFecha)) openParts.push(`Fecha: ${trim(s.extras.openHouseFecha)}`);
    const r = [trim(s.extras.openHouseInicio), trim(s.extras.openHouseFin)].filter(Boolean);
    if (r.length) openParts.push(`Horario: ${r.join(" – ")}`);
    if (trim(s.extras.openHouseNotas)) openParts.push(trim(s.extras.openHouseNotas));
  }
  const openHouseSummary = s.extras.openHouseActivo && openParts.length ? openParts.join("\n") : null;

  const asesorBlock =
    s.extras.asesorFinancieroActivo && trim(s.extras.asesorNombre)
      ? {
          name: trim(s.extras.asesorNombre),
          phone: trim(s.extras.asesorTelefono),
          email: trim(s.extras.asesorEmail),
        }
      : null;

  const mapQuery = [trim(s.direccion), trim(s.ciudad), trim(s.areaCiudad)].filter(Boolean).join(", ");

  return {
    hero: {
      title,
      operationLine: pubLabel,
      locationLine,
      priceDisplay: formatPrice(s.precio),
      statusPill: normalizeStatus(s),
      quickFacts,
    },
    sidebar: {
      photoUrl: trim(ag.fotoUrl) || null,
      name: trim(ag.nombre) || "Nombre del agente",
      title: trim(ag.titulo) || "Agente",
      marcaOficina: trim(ag.marcaOficina),
      bioLine: trim(ag.bio),
      phoneDisplay: phone || "—",
      email: email || "—",
      websiteHref: site,
      websiteLabel: "Sitio web",
      socialLinks: redesParsed,
      licenciaLine: trim(ag.licencia) ? `Licencia: ${trim(ag.licencia)}` : "",
    },
    media: {
      heroUrl,
      secondaryUrls: secondary,
      coverIndex: cover,
      videoEmbedUrl: videoUrl && (videoUrl.startsWith("http") || videoUrl.startsWith("data:")) ? videoUrl : null,
      tourHref: tourH,
      brochureHref: brochH,
      photoCount: photos.length,
    },
    propertyRows,
    destacadosLabels,
    descripcionPrincipal: trim(s.descripcionPrincipal),
    notasAdicionales: trim(s.notasAdicionales),
    hasDescription: Boolean(trim(s.descripcionPrincipal)),
    hasNotas: Boolean(trim(s.notasAdicionales)),
    cta: {
      showLlamar: Boolean(cta.permitirLlamar && llamarHref),
      llamarHref,
      showWhatsapp: Boolean(cta.permitirWhatsapp && waHref),
      whatsappHref: waHref,
      showEmail: Boolean(cta.permitirEnviarMensaje && solicitarInfoHref),
      emailHref: solicitarInfoHref,
      showProgramarVisita: Boolean(cta.permitirProgramarVisita && visitaHref),
      visitaHref,
      showVerSitioWeb: showSitio,
      verSitioHref: site,
      showVerRedes: showRedes,
      primeraRedHref: redesParsed[0]?.href ?? null,
      showVerListado: showVerListado,
      verListadoHref: listadoHref,
      showVerTour: showVerTour,
      verTourHref: tourH,
      showVerFolleto: showVerFolleto,
      verFolletoHref: brochH,
    },
    extras: {
      openHouseSummary,
      asesorBlock,
      puntosCercanos: trim(s.extras.puntosCercanos),
      transporte: trim(s.extras.transporte),
      mapQuery,
    },
  };
}
