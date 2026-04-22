import {
  COMERCIAL_TIPO_OPCIONES,
  TERRENO_SUBTIPO_POR_TIPO,
  TERRENO_TIPO_OPCIONES,
  labelComercialSubtipo,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteComercialTerrenoMeta";
import { labelForSubtipo, TIPO_PROPIEDAD_OPCIONES } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteResidencialTipoMeta";
import { BR_HIGHLIGHT_PRESET_DEFS } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/brHighlightMeta";
import {
  createEmptyBienesRaicesMuxVideoSlot,
  mergePartialBienesRaicesNegocioState,
  type BienesRaicesListingStatus,
  type BienesRaicesNegocioFormState,
  type BienesRaicesPublicationType,
} from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState";
import type { RentasNegocioFormState } from "../../schema/rentasNegocioFormState";

function trim(s: string): string {
  return String(s ?? "").trim();
}

function labelTerrenoSubtipo(codigo: (typeof TERRENO_TIPO_OPCIONES)[number]["value"], subvalor: string): string {
  const v = trim(subvalor);
  if (!v) return "";
  const list = TERRENO_SUBTIPO_POR_TIPO[codigo];
  return list.find((x) => x.value === v)?.label ?? "";
}

function publicationForCategory(cat: RentasNegocioFormState["categoriaPropiedad"]): BienesRaicesPublicationType {
  if (cat === "residencial") return "residencial_renta";
  if (cat === "comercial") return "comercial";
  return "terreno";
}

function buildTipoPropiedadLine(s: RentasNegocioFormState): string {
  const cat = s.categoriaPropiedad;
  if (cat === "residencial") {
    const tipoLabel = TIPO_PROPIEDAD_OPCIONES.find((o) => o.value === s.residencial.tipoCodigo)?.label ?? "";
    const subLbl = labelForSubtipo(s.residencial.tipoCodigo, s.residencial.subtipo);
    return [tipoLabel, subLbl].filter(Boolean).join(" · ");
  }
  if (cat === "comercial") {
    const tipoLabel = COMERCIAL_TIPO_OPCIONES.find((o) => o.value === s.comercial.tipoCodigo)?.label ?? "";
    const subLbl = labelComercialSubtipo(s.comercial.tipoCodigo, s.comercial.subtipo);
    return [tipoLabel, subLbl].filter(Boolean).join(" · ");
  }
  const tipoLabel = TERRENO_TIPO_OPCIONES.find((o) => o.value === s.terreno.tipoCodigo)?.label ?? "";
  const subLbl = labelTerrenoSubtipo(s.terreno.tipoCodigo, s.terreno.subtipo);
  return [tipoLabel, subLbl].filter(Boolean).join(" · ");
}

function listingStatusFromRentas(estado: RentasNegocioFormState["estadoAnuncio"]): BienesRaicesListingStatus {
  if (estado === "pendiente") return "disponible_pronto";
  if (estado === "bajo_contrato" || estado === "rentado") return "bajo_contrato";
  return "en_renta";
}

function buildRedesArray(raw: string): string[] {
  const lines = trim(raw)
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  const out = [...lines, "", "", "", "", ""].slice(0, 5);
  return out;
}

function emptyNegocioHighlightPresets(): Record<string, boolean> {
  const o: Record<string, boolean> = {};
  for (const d of BR_HIGHLIGHT_PRESET_DEFS) o[d.key] = false;
  return o;
}

/**
 * Maps Rentas Negocio publish state → BR Negocio form shape so the approved Negocio preview shell can render
 * without touching BR Negocio application routes.
 */
export function rentasNegocioToBienesRaicesNegocioState(s: RentasNegocioFormState): BienesRaicesNegocioFormState {
  const pub = publicationForCategory(s.categoriaPropiedad);
  const local = trim(s.media.videoLocalDataUrl);
  const vu = trim(s.media.videoUrl);
  const slot0 = createEmptyBienesRaicesMuxVideoSlot(0);
  if (local) slot0.fallbackUrl = local;
  else if (vu) slot0.fallbackUrl = vu;

  const basePartial: Parameters<typeof mergePartialBienesRaicesNegocioState>[0] = {
    advertiserType: "agente_individual",
    publicationType: pub,
    titulo: s.titulo,
    precio: s.rentaMensual,
    direccion: s.ubicacionLinea,
    ciudad: s.ciudad,
    estado: "CA",
    codigoPostal: "",
    colonia: "",
    descripcionLarga: s.descripcion,
    descripcionCorta: "",
    listingStatus: listingStatusFromRentas(s.estadoAnuncio),
    tipoPropiedad: buildTipoPropiedadLine(s),
    media: {
      photoUrls: [...s.media.photoDataUrls],
      primaryImageIndex: s.media.primaryImageIndex,
      listingVideoSlots: [slot0, createEmptyBienesRaicesMuxVideoSlot(1)],
      virtualTourUrl: "",
      floorPlanUrls: [],
      sitePlanUrl: "",
      photoCaptions: [],
    },
    identityAgente: {
      nombre: s.negocioNombre,
      fotoUrl: s.negocioLogoDataUrl,
      rol: "Contacto comercial",
      brokerage: s.negocioMarca,
      logoBrokerageUrl: "",
      licencia: s.negocioLicencia,
      telDirecto: s.negocioTelDirecto,
      telOficina: s.negocioTelOficina,
      email: s.negocioEmail,
      sitioWeb: s.negocioSitioWeb,
      redes: buildRedesArray(s.negocioRedes),
      idiomas: "",
      areasServicio: "",
      bio: s.negocioBio,
      segundoAgenteActivo: false,
    },
    cta: {
      permitirSolicitarInfo: true,
      permitirProgramarVisita: false,
      permitirLlamar: true,
      permitirWhatsapp: true,
      mensajePrellenado: "",
      instruccionesContacto: "",
      horarioPreferido: "",
      openHouseActivo: false,
      openHouseFecha: "",
      openHouseInicio: "",
      openHouseFin: "",
      openHouseNotas: "",
    },
    petsAllowed: s.mascotas === "permitidas" ? "yes" : s.mascotas === "no_permitidas" ? "no" : "",
    ...(s.categoriaPropiedad === "residencial"
      ? {
          highlightPresets: (() => {
            const hp = emptyNegocioHighlightPresets();
            for (const k of s.residencial.highlightKeys) {
              if (k in hp) hp[k] = true;
            }
            return hp;
          })(),
        }
      : {}),
  };

  if (s.categoriaPropiedad === "residencial") {
    basePartial.recamaras = s.residencial.recamaras;
    basePartial.banosCompletos = s.residencial.banos;
    basePartial.mediosBanos = s.residencial.mediosBanos;
    basePartial.piesCuadrados = s.residencial.interiorSqft;
    basePartial.tamanoLote = s.residencial.loteSqft ? `${trim(s.residencial.loteSqft)} ft²` : "";
    basePartial.estacionamientos = s.residencial.estacionamiento;
    basePartial.anioConstruccion = s.residencial.ano;
    basePartial.condicion = s.residencial.condicion;
  } else if (s.categoriaPropiedad === "comercial") {
    basePartial.piesCuadrados = s.comercial.interiorSqft;
    basePartial.estacionamientos = s.comercial.estacionamiento;
    basePartial.niveles = s.comercial.niveles;
    basePartial.condicion = s.comercial.condicion;
    basePartial.banosCompletos = s.comercial.banos;
    basePartial.descripcionLarga = [trim(s.comercial.uso), trim(s.descripcion)].filter(Boolean).join("\n\n");
  } else {
    basePartial.tamanoLote = s.terreno.loteSqft ? `${trim(s.terreno.loteSqft)} ft²` : "";
    const terrenoBits = [s.terreno.usoZonificacion, s.terreno.acceso, s.terreno.servicios, s.terreno.topografia]
      .map(trim)
      .filter(Boolean);
    basePartial.descripcionLarga = [...terrenoBits, trim(s.descripcion)].filter(Boolean).join("\n\n");
  }

  return mergePartialBienesRaicesNegocioState(basePartial);
}
