/**
 * BR-INV-E-FAST — Agente residencial draft → Negocio publish shape (reuse existing publish path).
 */

import type { AgenteIndividualResidencialFormState } from "../../agente-individual/schema/agenteIndividualResidencialFormState";
import { formatTipoPropiedadLine } from "../../agente-individual/lib/agenteResidencialPreviewFormat";
import type { BienesRaicesNegocioFormState, BienesRaicesPublicationType } from "../schema/bienesRaicesNegocioFormState";
import {
  createEmptyBienesRaicesNegocioFormState,
  mergePartialBienesRaicesNegocioState,
} from "../schema/bienesRaicesNegocioFormState";

function trim(v: unknown): string {
  return v == null ? "" : typeof v === "string" ? v.trim() : String(v).trim();
}

function publicationTypeFromAgente(s: AgenteIndividualResidencialFormState): BienesRaicesPublicationType {
  if (s.categoriaPropiedad === "comercial") return "comercial";
  if (s.categoriaPropiedad === "terreno_lote") return "terreno";
  return "residencial_venta";
}

export function mapAgenteResidencialFormStateToNegocioForPublish(
  s: AgenteIndividualResidencialFormState,
): BienesRaicesNegocioFormState {
  const base = createEmptyBienesRaicesNegocioFormState();
  const photos = (Array.isArray(s.fotosDataUrls) ? s.fotosDataUrls : []).map((u) => trim(String(u))).filter(Boolean);

  return mergePartialBienesRaicesNegocioState({
    advertiserType: "agente_individual",
    publicationType: publicationTypeFromAgente(s),
    titulo: s.titulo,
    precio: s.precio,
    ciudad: s.ciudad,
    estado: s.direccionEstado,
    codigoPostal: s.direccionCodigoPostal,
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
      primaryImageIndex: Math.min(Math.max(0, s.fotoPortadaIndex), Math.max(0, photos.length - 1)),
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
      bio: trim(s.descripcionPrincipal),
    },
    additionalInventoryProperties: [],
  });
}
