/**
 * BR-INV-E-FAST + BR-INV-FIX-01C — Agente residencial draft → Negocio publish shape (real child rows).
 */

import type { AgenteIndividualResidencialFormState, AgenteResidencialDestacadoId } from "../../agente-individual/schema/agenteIndividualResidencialFormState";
import { AGENTE_RES_DESTACADOS_DEFS } from "../../agente-individual/schema/agenteIndividualResidencialFormState";
import { COMERCIAL_DESTACADOS_DEFS, TERRENO_DESTACADOS_DEFS } from "../../agente-individual/schema/agenteComercialTerrenoMeta";
import { formatTipoPropiedadLine } from "../../agente-individual/lib/agenteResidencialPreviewFormat";
import { normalizeBrListingCountry, resolveBrListingCity } from "@/app/lib/clasificados/bienes-raices/brLocationHelpers";
import type {
  BienesRaicesNegocioFormState,
  BienesRaicesListingStatus,
  BienesRaicesPublicationType,
} from "../schema/bienesRaicesNegocioFormState";
import {
  createEmptyBienesRaicesNegocioFormState,
  mergePartialBienesRaicesNegocioState,
} from "../schema/bienesRaicesNegocioFormState";
import type { LeonixContactChannelsFormSlice } from "@/app/clasificados/lib/leonixContactChannelsV1";

function trim(v: unknown): string {
  return v == null ? "" : typeof v === "string" ? v.trim() : String(v).trim();
}

function durableHttpUrl(raw: string): string {
  const u = trim(raw);
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return "";
}

import { durableBusinessExtraLinks } from "../bienesAdditionalBusinessLinks";
import { buildOpenHouseSlotSummaries, normalizeOpenHouseSlots } from "../../agente-individual/lib/agenteResidencialPreviewFormat";

function durableUrlList(raw: readonly string[] | undefined, max: number): string[] {
  const out: string[] = [];
  for (const item of raw ?? []) {
    const url = durableHttpUrl(item);
    if (!url || out.includes(url)) continue;
    out.push(url);
    if (out.length >= max) break;
  }
  return out;
}

function publicationTypeFromAgente(s: AgenteIndividualResidencialFormState): BienesRaicesPublicationType {
  if (s.categoriaPropiedad === "comercial") return "comercial";
  if (s.categoriaPropiedad === "terreno_lote") return "terreno";
  return "residencial_venta";
}

function listingStatusFromAgente(s: AgenteIndividualResidencialFormState): BienesRaicesListingStatus {
  switch (s.estadoAnuncio) {
    case "pendiente":
      return "disponible_pronto";
    case "bajo_contrato":
      return "bajo_contrato";
    case "vendido":
      return "en_venta";
    default:
      return "en_venta";
  }
}

function agenteRedes(s: AgenteIndividualResidencialFormState): string[] {
  return [
    s.socialInstagram,
    s.socialFacebook,
    s.socialYoutube,
    s.socialTiktok,
    s.socialX,
    s.socialLinkedin,
    s.socialSnapchat,
    s.socialOtro,
  ]
    .map((u) => trim(u))
    .filter(Boolean)
    .slice(0, 5);
}

/**
 * BR-INV-WAVE1-GATE1 / Final Completion item 11 — residential preset highlights originally used a
 * different id vocabulary (`AgenteResidencialDestacadoId`, 15 ids) than the Negocio publish
 * shape's `highlightPresets` (`BR_HIGHLIGHT_PRESET_DEFS`). Item 11 reconciled the two into one
 * canonical registry by additively growing `BR_HIGHLIGHT_PRESET_DEFS` with the 6 ids that had no
 * equivalent (sotano/garaje/portonElectrico/adu/remodelada/nuevaConstruccion) — no existing key
 * was renamed, so this is a pure additive alias map: every one of the 15 Negocio ids now has a
 * stable canonical preset key, and `extraLines`/`customHighlightsText` stays as a safety net for
 * any future id this map doesn't yet cover, not the primary path.
 */
const AGENTE_RES_TO_HIGHLIGHT_PRESET: Partial<Record<AgenteResidencialDestacadoId, string>> = {
  piscina: "piscina",
  patio: "patio",
  terraza: "terraza",
  balcon: "balcon",
  chimenea: "chimenea",
  vista: "vista",
  comunidad_cerrada: "comunidadCerrada",
  paneles_solares: "panelesSolares",
  oficina: "oficinaEnCasa",
  sotano: "sotano",
  garaje: "garaje",
  porton_electrico: "portonElectrico",
  adu: "adu",
  remodelada: "remodelada",
  nueva_construccion: "nuevaConstruccion",
};

function residencialHighlights(s: AgenteIndividualResidencialFormState): {
  presets: Record<string, boolean>;
  extraLines: string[];
} {
  const presets: Record<string, boolean> = {};
  const extraLines: string[] = [];
  for (const def of AGENTE_RES_DESTACADOS_DEFS) {
    if (!s.destacados?.[def.id]) continue;
    const presetKey = AGENTE_RES_TO_HIGHLIGHT_PRESET[def.id];
    if (presetKey) presets[presetKey] = true;
    else extraLines.push(def.label);
  }
  return { presets, extraLines };
}

/** Commercial/land destacado vocabularies have zero overlap with `highlightPresets` — always free text. */
function comercialHighlightLines(s: AgenteIndividualResidencialFormState): string[] {
  return COMERCIAL_DESTACADOS_DEFS.filter((d) => s.destacadosComercial?.[d.id]).map((d) => d.label);
}

function terrenoHighlightLines(s: AgenteIndividualResidencialFormState): string[] {
  return TERRENO_DESTACADOS_DEFS.filter((d) => s.destacadosTerreno?.[d.id]).map((d) => d.label);
}

/**
 * BR-INV-WAVE1-GATE1 — comercial/terreno detail fields captured by the agente-individual form had
 * no destination in the Negocio publish shape at all and were silently dropped. `deepDetails`
 * already exists for exactly this purpose (Step 8 "Detalles completos") and is already rendered
 * by the preview mapper (`buildTechnicalDeepBlocks`/`buildPropertyDetails`/`buildQuickFacts`) — no
 * new schema fields are introduced. Fields with no matching structured slot (comercialZonificacion,
 * comercialAccesoCarga, terrenoAcceso, terrenoListoConstruir, terrenoCercado) go into
 * `observacionesAgente.observacionesPublicas`, the existing free-text overflow field for exactly
 * this situation, rather than being invented a new home. `deepDetailGroupsForPublication()` gates
 * which groups actually render per publicationType — `exterior`/`estacionamiento` are NOT shown
 * for `terreno`, and `loteTerreno` is NOT shown for `comercial`, so those groups are deliberately
 * not used as a landing spot for terreno/comercial fields respectively.
 */
function buildNegocioDeepDetails(
  s: AgenteIndividualResidencialFormState,
  emptyDeep: BienesRaicesNegocioFormState["deepDetails"],
): BienesRaicesNegocioFormState["deepDetails"] {
  const cat = s.categoriaPropiedad;
  const notes: string[] = [];
  const out: BienesRaicesNegocioFormState["deepDetails"] = {
    ...emptyDeep,
    tipoYEstilo: { ...emptyDeep.tipoYEstilo },
    interior: { ...emptyDeep.interior },
    loteTerreno: { ...emptyDeep.loteTerreno },
    utilidades: { ...emptyDeep.utilidades },
    observacionesAgente: { ...emptyDeep.observacionesAgente },
  };

  if (cat === "comercial") {
    out.tipoYEstilo = { ...out.tipoYEstilo, uso: trim(s.comercialUso) };
    out.interior = { ...out.interior, oficina: trim(s.comercialOficinas) };
    if (trim(s.comercialZonificacion)) notes.push(`Zonificación: ${trim(s.comercialZonificacion)}`);
    if (s.comercialAccesoCarga) notes.push("Acceso de carga: Sí");
  }

  if (cat === "terreno_lote") {
    const usoZon = trim(s.terrenoUsoZonificacion);
    out.loteTerreno = {
      ...out.loteTerreno,
      usoSuelo: usoZon,
      zonificacion: usoZon,
      topografia: trim(s.terrenoTopografia),
    };
    if (trim(s.terrenoServicios)) out.utilidades = { ...out.utilidades, agua: trim(s.terrenoServicios) };
    if (trim(s.terrenoAcceso)) notes.push(`Acceso: ${trim(s.terrenoAcceso)}`);
    if (s.terrenoListoConstruir) notes.push("Listo para construir: Sí");
    if (s.terrenoCercado) notes.push("Cercado: Sí");
  }

  if (notes.length) out.observacionesAgente = { ...out.observacionesAgente, observacionesPublicas: notes.join("\n") };
  return out;
}

function contactChannelsFromAgente(s: AgenteIndividualResidencialFormState): LeonixContactChannelsFormSlice {
  const permit = (on: boolean): "" | "si" | "no" => (on ? "si" : "no");
  return {
    masInformacionUrl: durableHttpUrl(s.ctaUrlListadoCompleto) || durableHttpUrl(s.listadoUrl),
    instagram: durableHttpUrl(s.socialInstagram),
    facebook: durableHttpUrl(s.socialFacebook),
    youtube: durableHttpUrl(s.socialYoutube),
    tiktok: durableHttpUrl(s.socialTiktok),
    permitirLlamadas: permit(s.permitirLlamar),
    permitirSms: "si",
    whatsappActivo: permit(s.permitirWhatsApp),
    contactoPreferido: "",
  };
}

export function mapAgenteResidencialFormStateToNegocioForPublish(
  s: AgenteIndividualResidencialFormState,
): BienesRaicesNegocioFormState {
  const base = createEmptyBienesRaicesNegocioFormState();
  const photos = (Array.isArray(s.fotosDataUrls) ? s.fotosDataUrls : []).map((u) => trim(String(u))).filter(Boolean);
  const primaryIdx = Math.min(Math.max(0, s.fotoPortadaIndex), Math.max(0, photos.length - 1));
  const tourUrl = durableHttpUrl(s.tourUrl);
  // BR-INV-WAVE1-GATE1: was capped at 4, silently truncating the schema's own 8-URL allowance
  // (`AGENTE_RES_MAX_VIDEO_URLS`). Raised to 8 here; see matching raises in
  // `normalizeBienesRaicesNegocioMedia` (bienesRaicesNegocioFormState.ts) and the preview mapper's
  // `cleanHttpUrls` call — all three must move together or the merge/preview layers re-truncate.
  const videoUrls = durableUrlList(s.videoUrls?.length ? s.videoUrls : [s.videoUrl], 8);
  const videoUrl = videoUrls[0] ?? "";
  const brochureUrl = durableHttpUrl(s.brochureUrl);
  const slot0 = base.media.listingVideoSlots[0];
  const slot1 = base.media.listingVideoSlots[1];
  const openHouseSlots = normalizeOpenHouseSlots(s);
  const openHouseSummaries = buildOpenHouseSlotSummaries(s, "es");
  const openHousePrimary = openHouseSlots[0];
  const openHouseNotes = openHouseSummaries.length
    ? openHouseSummaries.join("\n\n—\n\n")
    : trim(openHousePrimary?.notas) || trim(s.openHouseNotas);
  const cat = s.categoriaPropiedad;
  const residencial: { presets: Record<string, boolean>; extraLines: string[] } =
    cat === "comercial" || cat === "terreno_lote" ? { presets: {}, extraLines: [] } : residencialHighlights(s);
  const comercialExtra = cat === "comercial" ? comercialHighlightLines(s) : [];
  const terrenoExtra = cat === "terreno_lote" ? terrenoHighlightLines(s) : [];
  const customHighlightsText = [...residencial.extraLines, ...comercialExtra, ...terrenoExtra].join("\n");

  return mergePartialBienesRaicesNegocioState({
    advertiserType: "agente_individual",
    publicationType: publicationTypeFromAgente(s),
    listingStatus: listingStatusFromAgente(s),
    titulo: s.titulo,
    precio: s.precio,
    ciudad: resolveBrListingCity(s.ciudad),
    estado: s.direccionEstado,
    codigoPostal: s.direccionCodigoPostal,
    colonia: trim(s.areaCiudad),
    pais: normalizeBrListingCountry(s.direccionPais),
    direccion: trim(s.direccionLinea1) || trim(s.direccion),
    direccionLinea2: s.direccionLinea2,
    mostrarDireccionExacta: s.mostrarDireccionExacta,
    descripcionLarga: s.descripcionPrincipal,
    descripcionCorta: s.notasAdicionales,
    tipoPropiedad: formatTipoPropiedadLine(s, "es"),
    propertySubtype: trim(s.subtipoPropiedad),
    recamaras: s.recamaras,
    banosCompletos: s.banos,
    mediosBanos: s.mediosBanos,
    piesCuadrados: s.tamanoInteriorSqft,
    tamanoLote: s.tamanoLoteSqft,
    // BR-INV-WAVE1-GATE1: previously not forwarded at all — silently dropped at publish.
    estacionamientos: s.estacionamientos,
    anioConstruccion: s.anoConstruccion,
    condicion: s.condicionPropiedad,
    // Levels/stories — residential uses its own `nivelesPropiedad` field (separate from
    // subtype); comercial has its own `comercialNiveles`. Only one category is active per
    // listing, so forward whichever applies.
    niveles: trim(s.nivelesPropiedad) || s.comercialNiveles,
    highlightPresets: residencial.presets,
    customHighlightsText,
    deepDetails: buildNegocioDeepDetails(s, base.deepDetails),
    // BR-INV-FINAL-WAVE-D (item 4): HOA is residential-only — forwarding it for comercial/terreno
    // would be semantically wrong (BR Privado never asks it there either). The target `gate12d`
    // slice already has a working preview card (buildBrGate12dHoaPreviewCard, shared with BR
    // Privado); only the source side of BR Negocio was missing until now.
    gate12d:
      cat !== "comercial" && cat !== "terreno_lote"
        ? {
            ...base.gate12d,
            hasHoa: s.hasHoa,
            hoaFee: s.hoaFee,
            hoaFrequency: s.hoaFrequency,
            hoaIncludes: s.hoaIncludes,
            communityRules: s.communityRules,
            petRules: s.petRules,
            rentalRestrictions: s.rentalRestrictions,
            shortTermRentalAllowed: s.shortTermRentalAllowed,
            parkingRules: s.parkingRules,
          }
        : base.gate12d,
    petsAllowed: "no",
    media: {
      ...base.media,
      photoUrls: photos,
      primaryImageIndex: primaryIdx,
      virtualTourUrl: tourUrl,
      floorPlanUrls: brochureUrl ? [brochureUrl] : [],
      externalVideoUrls: videoUrls,
      listingVideoSlots: videoUrls.length
        ? [
            videoUrl ? { ...slot0, fallbackUrl: videoUrl, status: "idle" as const } : slot0,
            videoUrls[1] ? { ...slot1, fallbackUrl: videoUrls[1], status: "idle" as const } : slot1,
          ]
        : base.media.listingVideoSlots,
    },
    identityAgente: {
      ...base.identityAgente,
      nombre: s.agenteNombre,
      fotoUrl: s.agenteFotoDataUrl,
      rol: trim(s.agenteTitulo) || "Agente de listado",
      brokerage: s.marcaNombre,
      logoBrokerageUrl: s.marcaLogoDataUrl,
      licencia: trim(s.agenteLicencia) || trim(s.marcaLicencia),
      telDirecto: trim(s.agenteTelefonoPersonal) || trim(s.telefonoPrincipal),
      telOficina: s.agenteTelefonoOficina,
      email: s.correoPrincipal,
      sitioWeb: trim(s.agenteSitioWeb) || trim(s.marcaSitioWeb),
      redes: agenteRedes(s),
      idiomas: trim(s.agenteIdiomas),
      areasServicio: trim(s.agenteAreaServicio),
      bio: "",
      segundoAgenteActivo: s.mostrarSegundoAgente,
    },
    segundoAgente: s.mostrarSegundoAgente
      ? {
          ...base.segundoAgente,
          nombre: s.agente2Nombre,
          fotoUrl: s.agente2FotoDataUrl,
          rol: s.agente2Titulo,
          telefono: trim(s.agente2TelefonoPersonal) || trim(s.agente2Telefono),
          email: s.agente2Correo,
          bio: "",
        }
      : base.segundoAgente,
    asesorFinancieroActivo: s.mostrarBrokerAsesor,
    asesorFinanciero: s.mostrarBrokerAsesor
      ? {
          ...base.asesorFinanciero,
          nombre: s.brokerNombre,
          fotoUrl: s.brokerFotoDataUrl,
          rol: s.brokerTitulo,
          compania: s.marcaNombre,
          telefono: trim(s.brokerTelefonoPersonal) || trim(s.brokerTelefono),
          email: s.brokerEmail,
          sitioWeb: trim(s.brokerSitioWeb),
          nmls: trim(s.brokerLicencia),
        }
      : base.asesorFinanciero,
    cta: {
      ...base.cta,
      permitirSolicitarInfo: s.permitirSolicitarInformacion,
      permitirProgramarVisita: s.permitirProgramarVisita,
      permitirLlamar: s.permitirLlamar,
      permitirWhatsapp: s.permitirWhatsApp,
      openHouseActivo: openHouseSlots.length > 0,
      openHouseFecha: trim(openHousePrimary?.fecha) || trim(s.openHouseFecha),
      openHouseFechaFin: trim(openHousePrimary?.fechaFin),
      openHouseInicio: trim(openHousePrimary?.inicio) || trim(s.openHouseInicio),
      openHouseFin: trim(openHousePrimary?.fin) || trim(s.openHouseFin),
      openHouseDiasAdicionales: trim(openHousePrimary?.diasHorariosAdicionales),
      openHouseNotas: openHouseNotes,
      openHouseEvents: openHouseSlots.map((slot) => ({
        startDate: trim(slot.fecha),
        endDate: trim(slot.fechaFin),
        startTime: trim(slot.inicio),
        endTime: trim(slot.fin),
        additionalDaysHours: trim(slot.diasHorariosAdicionales),
        notes: trim(slot.notas),
      })),
    },
    contactChannels: contactChannelsFromAgente(s),
    businessExtraUrls: durableBusinessExtraLinks(s.businessExtraUrls, 2),
    googleBusinessUrl: durableHttpUrl(s.googleBusinessUrl),
    googleReviewsUrl: durableHttpUrl(s.googleReviewsUrl),
    yelpReviewsUrl: durableHttpUrl(s.yelpReviewsUrl),
    trust: {
      ...base.trust,
      mostrarLicencia: Boolean(trim(s.agenteLicencia) || trim(s.marcaLicencia)),
      // BR-INV-WAVE1-GATE1: previously inferred from marcaNombre alone, ignoring the agent's
      // explicit toggle — an agent who typed a brand name then explicitly hid it still saw it
      // published. Now honors `mostrarMarcaEnTarjeta` as the actual gate.
      mostrarBrokerage: Boolean(trim(s.marcaNombre)) && s.mostrarMarcaEnTarjeta,
      mostrarSitioWeb: Boolean(trim(s.agenteSitioWeb) || trim(s.marcaSitioWeb)),
      mostrarRedes: agenteRedes(s).length > 0,
      confirmarInformacion: s.confirmListingAccurate,
      confirmarFotos: s.confirmPhotosRepresentItem,
      confirmarReglas: s.confirmCommunityRules,
    },
    additionalInventoryProperties: [],
  });
}
