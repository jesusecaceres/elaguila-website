/**
 * Implementación del contrato descrito en `brNegocioInputToPreviewMap.ts`.
 * Único lugar donde el estado del formulario se convierte en `BienesRaicesNegocioPreviewVm`.
 */
import type { BienesRaicesNegocioFormState, BienesRaicesAdvertiserType, DeepDetailGroupKey } from "../schema/bienesRaicesNegocioFormState";
import { BR_DEEP_FIELD_LABELS, BR_DEEP_HEADINGS } from "../schema/brDeepDetailMeta";
import { BR_HIGHLIGHT_PRESET_DEFS } from "../schema/brHighlightMeta";
import type {
  BienesRaicesNegocioPreviewVm,
  BienesRaicesPreviewDeepBlockVm,
  BienesRaicesPreviewFact,
} from "./bienesRaicesNegocioPreviewVm";

const LISTING_STATUS_LABEL: Record<string, string> = {
  en_venta: "En venta",
  en_renta: "En renta",
  disponible_pronto: "Disponible pronto",
  preconstruccion: "Preconstrucción",
  bajo_contrato: "Bajo contrato",
};

const HIGHLIGHT_LABELS_ES: Record<string, string> = Object.fromEntries(BR_HIGHLIGHT_PRESET_DEFS.map((d) => [d.key, d.label]));

function trim(s: string): string {
  return (s ?? "").trim();
}

function bulletsFromGroup(
  group: DeepDetailGroupKey,
  data: Record<string, string>,
  labels: Record<string, string>
): string[] {
  const out: string[] = [];
  for (const [key, label] of Object.entries(labels)) {
    const v = trim(data[key] ?? "");
    if (!v) continue;
    if (group === "observacionesAgente" && key === "observacionesPrivadas") continue;
    out.push(`${label}: ${v}`);
  }
  return out;
}

function formatPrice(raw: string): string {
  const t = trim(raw);
  if (!t) return "—";
  const n = Number(String(t).replace(/[^0-9.]/g, ""));
  if (Number.isFinite(n)) {
    try {
      return new Intl.NumberFormat("es-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
    } catch {
      return t;
    }
  }
  return t;
}

function bathLine(complete: string, half: string): string {
  const c = trim(complete);
  const h = trim(half);
  const parts: string[] = [];
  if (c) parts.push(c);
  if (h) parts.push(`${h} medios`);
  return parts.length ? parts.join(" + ") : "—";
}

function buildAddress(s: BienesRaicesNegocioFormState): string {
  const parts = [trim(s.direccion), trim(s.colonia), trim(s.ciudad), trim(s.estado), trim(s.codigoPostal)].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function buildPropertyDetails(s: BienesRaicesNegocioFormState): BienesRaicesPreviewFact[] {
  const rows: BienesRaicesPreviewFact[] = [
    { label: "Tipo", value: trim(s.tipoPropiedad) || "—" },
    { label: "Subtipo", value: trim(s.propertySubtype) || "—" },
    { label: "Operación", value: trim(s.tipoOperacion) || "—" },
    { label: "Recámaras", value: trim(s.recamaras) || "—" },
    { label: "Baños", value: bathLine(s.banosCompletos, s.mediosBanos) },
    { label: "Pies cuadrados", value: trim(s.piesCuadrados) || "—" },
    { label: "Lote", value: trim(s.tamanoLote) || "—" },
    { label: "Estacionamientos", value: trim(s.estacionamientos) || "—" },
    { label: "Condición", value: trim(s.condicion) || "—" },
    { label: "HOA", value: trim(s.hoaSiNo) || "—" },
  ];
  if (trim(s.cuotaHoa)) rows.push({ label: "Cuota HOA", value: trim(s.cuotaHoa) });
  if (s.publicationType === "proyecto_nuevo") {
    rows.push(
      { label: "Comunidad / desarrollo", value: trim(s.proyectoComunidad) || "—" },
      { label: "Modelo", value: trim(s.proyectoModelo) || "—" },
      { label: "Etapa", value: trim(s.proyectoEtapa) || "—" }
    );
  }
  if (s.publicationType === "multifamiliar_inversion") {
    rows.push(
      { label: "Unidades", value: trim(s.invNumUnidades) || "—" },
      { label: "Ocupación", value: trim(s.invOcupacion) || "—" },
      { label: "Renta actual", value: trim(s.invRentaActual) || "—" }
    );
  }
  return rows;
}

function buildHighlights(s: BienesRaicesNegocioFormState): BienesRaicesPreviewFact[] {
  const rows: BienesRaicesPreviewFact[] = [];
  for (const [k, on] of Object.entries(s.highlightPresets)) {
    if (!on) continue;
    const label = HIGHLIGHT_LABELS_ES[k];
    if (label) rows.push({ label: "Destacado", value: label });
  }
  for (const line of s.customHighlightsText.split("\n")) {
    const t = trim(line);
    if (t) rows.push({ label: "Personalizado", value: t });
  }
  return rows.length ? rows : [{ label: "Destacados", value: "Agrega características en el formulario." }];
}

function buildDeepBlocks(s: BienesRaicesNegocioFormState): BienesRaicesPreviewDeepBlockVm[] {
  const keys = Object.keys(BR_DEEP_HEADINGS) as DeepDetailGroupKey[];
  return keys.map((key) => {
    const bullets = bulletsFromGroup(key, s.deepDetails[key], BR_DEEP_FIELD_LABELS[key]);
    return {
      id: key,
      heading: BR_DEEP_HEADINGS[key],
      bullets,
      hasContent: bullets.length > 0,
    };
  });
}

function primaryPhone(s: BienesRaicesNegocioFormState, adv: BienesRaicesAdvertiserType): string {
  switch (adv) {
    case "agente_individual":
      return trim(s.identityAgente.telDirecto) || trim(s.identityAgente.telOficina);
    case "equipo_agentes":
      return trim(s.identityEquipo.telGeneral);
    case "oficina_brokerage":
      return trim(s.identityOficina.telPrincipal);
    case "constructor_desarrollador":
      return trim(s.identityConstructor.tel);
    default:
      return "";
  }
}

function buildIdentity(s: BienesRaicesNegocioFormState): BienesRaicesNegocioPreviewVm["identity"] {
  const adv = s.advertiserType;
  const trust = s.trust;

  if (adv === "equipo_agentes") {
    const ie = s.identityEquipo;
    const social = ie.redes.map(trim).filter(Boolean).slice(0, 5);
    const photoUrl = trim(ie.imagenUrl) || null;
    return {
      photoUrl,
      name: trim(ie.nombreEquipo) || "Equipo",
      role: "Equipo de agentes",
      brokerageName: trust.mostrarBrokerage ? trim(ie.brokerage) || "—" : "—",
      brokerageLogoUrl: trim(ie.logoUrl) || null,
      verifiedLine: "Equipo profesional Leonix",
      licenseLine: "",
      socialChips: trust.mostrarRedes ? social : [],
      profileCtaLabel: "Ver perfil profesional →",
      hasPhoto: Boolean(photoUrl),
      hasSocialLinks: social.length > 0,
    };
  }

  if (adv === "oficina_brokerage") {
    const io = s.identityOficina;
    const social = io.redes.map(trim).filter(Boolean);
    const photoUrl = trim(io.logoUrl) || null;
    return {
      photoUrl,
      name: trim(io.nombreOficina) || "Oficina",
      role: "Brokerage",
      brokerageName: trust.mostrarBrokerage ? trim(io.nombreOficina) : "—",
      brokerageLogoUrl: trim(io.logoUrl) || null,
      verifiedLine: "Oficina verificada",
      licenseLine: trim(io.contactoPrincipal),
      socialChips: trust.mostrarRedes && social.length ? social : [],
      profileCtaLabel: "Ver perfil profesional →",
      hasPhoto: Boolean(photoUrl),
      hasSocialLinks: social.length > 0,
    };
  }

  if (adv === "constructor_desarrollador") {
    const ic = s.identityConstructor;
    const social = ic.redes.map(trim).filter(Boolean);
    const photoUrl = trim(ic.logoUrl) || null;
    return {
      photoUrl,
      name: trim(ic.nombreDesarrollador) || "Desarrollador",
      role: trim(ic.proyectoNombre) || "Proyecto nuevo",
      brokerageName: trust.mostrarBrokerage ? trim(ic.proyectoNombre) : trim(ic.nombreDesarrollador),
      brokerageLogoUrl: trim(ic.logoUrl) || null,
      verifiedLine: "Desarrollador",
      licenseLine: trim(ic.estadoDesarrollo),
      socialChips: trust.mostrarRedes && social.length ? social : [],
      profileCtaLabel: "Ver centro de ventas →",
      hasPhoto: Boolean(photoUrl),
      hasSocialLinks: social.length > 0,
    };
  }

  const ia = s.identityAgente;
  const social = ia.redes.map(trim).filter(Boolean);
  const lic = trim(ia.licencia);
  const photoUrl = trim(ia.fotoUrl) || null;
  return {
    photoUrl,
    name: trim(ia.nombre) || "Agente",
    role: trim(ia.rol) || "Agente de listado",
    brokerageName: trust.mostrarBrokerage ? trim(ia.brokerage) || "—" : "—",
    brokerageLogoUrl: trim(ia.logoBrokerageUrl) || null,
    verifiedLine: "Agente verificado",
    licenseLine: trust.mostrarLicencia && lic ? `Lic. ${lic}` : "",
    socialChips: trust.mostrarRedes ? social : [],
    profileCtaLabel: "Ver perfil profesional →",
    hasPhoto: Boolean(photoUrl),
    hasSocialLinks: social.length > 0,
  };
}

function buildSecondAgentVm(s: BienesRaicesNegocioFormState): BienesRaicesNegocioPreviewVm["contact"]["secondAgent"] {
  const adv = s.advertiserType;
  if (adv === "equipo_agentes") {
    const n = trim(s.identityEquipo.segundoAgenteNombre);
    if (!n) return null;
    return {
      name: n,
      role: trim(s.identityEquipo.segundoAgenteRol) || "Agente",
      phone: primaryPhone(s, adv) || "—",
      photoUrl: null,
    };
  }
  if (adv === "agente_individual" && s.identityAgente.segundoAgenteActivo) {
    const sg = s.segundoAgente;
    if (!trim(sg.nombre)) return null;
    return {
      name: trim(sg.nombre),
      role: trim(sg.rol) || "Segundo agente",
      phone: trim(sg.telefono) || "—",
      photoUrl: trim(sg.fotoUrl) || null,
    };
  }
  return null;
}

function buildLenderVm(s: BienesRaicesNegocioFormState): BienesRaicesNegocioPreviewVm["contact"]["lender"] {
  const adv = s.advertiserType;
  const a = s.asesorFinanciero;
  if (!trim(a.nombre)) return null;
  if (!s.asesorFinancieroActivo) return null;
  return {
    name: trim(a.nombre),
    role: trim(a.rol) || "Asesor de préstamos",
    subtitle: [trim(a.compania), trim(a.telefono), trim(a.textoApoyo)].filter(Boolean).join(" · ") || "Financiamiento",
    photoUrl: trim(a.fotoUrl) || null,
  };
}

function mediaMetaLine(s: BienesRaicesNegocioFormState): string {
  const nPhotos = s.media.photoUrls.filter((u) => trim(u)).length;
  const nVid = s.media.videoUrls.filter((u) => trim(u)).length;
  const tour = trim(s.media.virtualTourUrl) ? 1 : 0;
  const nFp = s.media.floorPlanUrls.filter((u) => trim(u)).length;
  const parts: string[] = [];
  parts.push(`${nPhotos} fotos`);
  parts.push(`${Math.min(nVid, 2)} videos`);
  if (tour) parts.push("Tour virtual");
  if (nFp) parts.push("Planos");
  return parts.join(" · ");
}

/** Maps application state → preview view-model (single entry point for preview rendering). */
export function mapBienesRaicesNegocioStateToPreviewVm(s: BienesRaicesNegocioFormState): BienesRaicesNegocioPreviewVm {
  const photos = s.media.photoUrls.map(trim).filter(Boolean);
  const cover = Math.min(Math.max(0, s.media.coverIndex), Math.max(0, photos.length - 1));
  const heroUrl = photos.length ? photos[cover]! : null;
  const v1 = trim(s.media.videoUrls[0] ?? "");
  const v2 = trim(s.media.videoUrls[1] ?? "");
  const videoThumbUrls: [string | null, string | null] = [v1 || null, v2 || null];

  const descLong = trim(s.descripcionLarga);
  const descShort = trim(s.descripcionCorta);
  const desc = descLong || descShort || "";
  const hasDescription = Boolean(descLong || descShort);

  const highlightRows = buildHighlights(s);
  const hasHighlights =
    highlightRows.length > 0 &&
    !(highlightRows.length === 1 && highlightRows[0]?.label === "Destacados" && /Agrega características/i.test(highlightRows[0]?.value ?? ""));

  const floorPlans = s.media.floorPlanUrls.map(trim).filter(Boolean).slice(0, 3);
  const virtualTourUrl = trim(s.media.virtualTourUrl) || null;

  return {
    heroTitle: trim(s.titulo) || "Título del anuncio",
    addressLine: buildAddress(s),
    priceDisplay: formatPrice(s.precio),
    listingStatusLabel: LISTING_STATUS_LABEL[s.listingStatus] ?? "En venta",
    quickFacts: {
      beds: trim(s.recamaras) || "—",
      baths: bathLine(s.banosCompletos, s.mediosBanos),
      sqft: trim(s.piesCuadrados) || "—",
      garage: trim(s.estacionamientos) || "—",
      year: trim(s.anioConstruccion) || "—",
    },
    identity: buildIdentity(s),
    media: {
      heroUrl,
      videoThumbUrls,
      virtualTourUrl,
      floorPlanUrls: floorPlans,
      sitePlanUrl: s.advertiserType === "constructor_desarrollador" ? trim(s.media.sitePlanUrl) || null : null,
      metaLine: mediaMetaLine(s),
      hasPhotos: photos.length > 0,
      hasVideo1: Boolean(videoThumbUrls[0]),
      hasVideo2: Boolean(videoThumbUrls[1]),
      hasVirtualTour: Boolean(virtualTourUrl),
      hasFloorPlans: floorPlans.length > 0,
    },
    propertyDetailsRows: buildPropertyDetails(s),
    highlightsRows: hasHighlights ? highlightRows : [],
    description: desc,
    hasDescription,
    hasHighlights,
    contact: {
      showSolicitarInfo: s.cta.permitirSolicitarInfo,
      showProgramarVisita: s.cta.permitirProgramarVisita,
      showLlamar: s.cta.permitirLlamar,
      showWhatsapp: s.cta.permitirWhatsapp,
      secondAgent: buildSecondAgentVm(s),
      lender: buildLenderVm(s),
    },
    deepBlocks: buildDeepBlocks(s),
    footerNote: "Vista previa generada por Leonix · Podrás editar toda la información antes de publicar.",
  };
}
