/**
 * BR-INV-E-FAST + BR-INV-FIX-01C — Agente residencial draft → Negocio publish shape (real child rows).
 */

import type { AgenteIndividualResidencialFormState } from "../../agente-individual/schema/agenteIndividualResidencialFormState";
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
  const videoUrls = durableUrlList(s.videoUrls?.length ? s.videoUrls : [s.videoUrl], 4);
  const videoUrl = videoUrls[0] ?? "";
  const brochureUrl = durableHttpUrl(s.brochureUrl);
  const slot0 = base.media.listingVideoSlots[0];
  const slot1 = base.media.listingVideoSlots[1];

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
    },
    contactChannels: contactChannelsFromAgente(s),
    businessExtraUrls: durableUrlList(s.businessExtraUrls, 2),
    trust: {
      ...base.trust,
      mostrarLicencia: Boolean(trim(s.agenteLicencia) || trim(s.marcaLicencia)),
      mostrarBrokerage: Boolean(trim(s.marcaNombre)),
      mostrarSitioWeb: Boolean(trim(s.agenteSitioWeb) || trim(s.marcaSitioWeb)),
      mostrarRedes: agenteRedes(s).length > 0,
      confirmarInformacion: s.confirmListingAccurate,
      confirmarFotos: s.confirmPhotosRepresentItem,
      confirmarReglas: s.confirmCommunityRules,
    },
    additionalInventoryProperties: [],
  });
}
