/**
 * Agente individual + residencial — estado del formulario (solo esta variante).
 * No compartir con otros tipos de anunciante ni con Privado.
 */

export type AgenteResidencialPublication = "residencial_venta" | "residencial_renta";

/** Estado operativo del anuncio (visible en pastilla del preview). */
export type AgenteResidencialListingStatus =
  | "disponible"
  | "bajo_contrato"
  | "vendido"
  | "rentado"
  | "proximamente";

export type AgenteIndividualResidencialFormState = {
  /** Paso 1 */
  tipoPublicacion: AgenteResidencialPublication;
  tipoPropiedad: string;
  /** Sólo si el tipo de propiedad lo requiere (ej. modelo en condominio). */
  subtipoPropiedad: string;

  /** Paso 2 — Información básica */
  titulo: string;
  precio: string;
  ciudad: string;
  /** Zona general (antes “colonia” en otros flujos). */
  areaCiudad: string;
  direccion: string;
  estadoAnuncio: AgenteResidencialListingStatus;
  enlaceListado: string;

  /** Paso 3 — Media */
  media: {
    photoUrls: string[];
    primaryImageIndex: number;
    videoUrl: string;
    /** Data URL desde archivo subido (preview local). */
    videoDataUrl: string;
    tourUrl: string;
    tourDataUrl: string;
    brochureUrl: string;
    brochureDataUrl: string;
  };

  /** Paso 4 */
  detalles: {
    recamaras: string;
    banos: string;
    mediosBanos: string;
    tamanoInterior: string;
    tamanoLote: string;
    estacionamientos: string;
    anioConstruccion: string;
    condicion: string;
  };

  /** Paso 5 — checklist */
  destacados: Record<string, boolean>;

  /** Paso 6 */
  descripcionPrincipal: string;
  notasAdicionales: string;

  /** Paso 7 */
  agente: {
    nombre: string;
    titulo: string;
    telefono: string;
    email: string;
    fotoUrl: string;
    licencia: string;
    sitioWeb: string;
    redes: string[];
    bio: string;
    areaServicio: string;
    idiomas: string;
    marcaOficina: string;
  };

  /** Paso 8 — CTAs visibles en preview sólo si hay destino o están activos */
  cta: {
    permitirLlamar: boolean;
    permitirWhatsapp: boolean;
    permitirEnviarMensaje: boolean;
    permitirProgramarVisita: boolean;
    mostrarVerSitioWeb: boolean;
    mostrarVerRedes: boolean;
    mostrarVerListadoCompleto: boolean;
    mostrarVerTour: boolean;
    mostrarVerFolleto: boolean;
  };

  /** Paso 9 — opcional */
  extras: {
    openHouseActivo: boolean;
    openHouseFecha: string;
    openHouseInicio: string;
    openHouseFin: string;
    openHouseNotas: string;
    asesorFinancieroActivo: boolean;
    asesorNombre: string;
    asesorTelefono: string;
    asesorEmail: string;
    puntosCercanos: string;
    transporte: string;
  };
};

export const AGENTE_RES_DESTACADOS_DEFS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "piscina", label: "Piscina" },
  { key: "patio", label: "Patio" },
  { key: "terraza", label: "Terraza" },
  { key: "balcon", label: "Balcón" },
  { key: "chimenea", label: "Chimenea" },
  { key: "oficina", label: "Oficina" },
  { key: "sotano", label: "Sótano" },
  { key: "garaje", label: "Garaje" },
  { key: "porton_electrico", label: "Portón eléctrico" },
  { key: "adu", label: "ADU" },
  { key: "remodelada", label: "Remodelada" },
  { key: "nueva_construccion", label: "Nueva construcción" },
  { key: "vista", label: "Vista" },
  { key: "comunidad_cerrada", label: "Comunidad cerrada" },
  { key: "paneles_solares", label: "Paneles solares" },
];

const REDES_SLOTS = 5;

function emptyRedes(): string[] {
  return Array.from({ length: REDES_SLOTS }, () => "");
}

function emptyDestacados(): Record<string, boolean> {
  const o: Record<string, boolean> = {};
  for (const d of AGENTE_RES_DESTACADOS_DEFS) o[d.key] = false;
  return o;
}

export function createEmptyAgenteIndividualResidencialState(): AgenteIndividualResidencialFormState {
  return {
    tipoPublicacion: "residencial_venta",
    tipoPropiedad: "",
    subtipoPropiedad: "",
    titulo: "",
    precio: "",
    ciudad: "",
    areaCiudad: "",
    direccion: "",
    estadoAnuncio: "disponible",
    enlaceListado: "",
    media: {
      photoUrls: [],
      primaryImageIndex: 0,
      videoUrl: "",
      videoDataUrl: "",
      tourUrl: "",
      tourDataUrl: "",
      brochureUrl: "",
      brochureDataUrl: "",
    },
    detalles: {
      recamaras: "",
      banos: "",
      mediosBanos: "",
      tamanoInterior: "",
      tamanoLote: "",
      estacionamientos: "",
      anioConstruccion: "",
      condicion: "",
    },
    destacados: emptyDestacados(),
    descripcionPrincipal: "",
    notasAdicionales: "",
    agente: {
      nombre: "",
      titulo: "",
      telefono: "",
      email: "",
      fotoUrl: "",
      licencia: "",
      sitioWeb: "",
      redes: emptyRedes(),
      bio: "",
      areaServicio: "",
      idiomas: "",
      marcaOficina: "",
    },
    cta: {
      permitirLlamar: true,
      permitirWhatsapp: true,
      permitirEnviarMensaje: true,
      permitirProgramarVisita: true,
      mostrarVerSitioWeb: true,
      mostrarVerRedes: true,
      mostrarVerListadoCompleto: true,
      mostrarVerTour: true,
      mostrarVerFolleto: true,
    },
    extras: {
      openHouseActivo: false,
      openHouseFecha: "",
      openHouseInicio: "",
      openHouseFin: "",
      openHouseNotas: "",
      asesorFinancieroActivo: false,
      asesorNombre: "",
      asesorTelefono: "",
      asesorEmail: "",
      puntosCercanos: "",
      transporte: "",
    },
  };
}

function coerceRedes(raw: unknown, fallback: string[]): string[] {
  const out = fallback.slice();
  if (!Array.isArray(raw)) return out;
  for (let i = 0; i < REDES_SLOTS && i < raw.length; i++) {
    const x = raw[i];
    out[i] = x == null ? "" : typeof x === "string" ? x : String(x);
  }
  return out;
}

export function mergePartialAgenteIndividualResidencial(
  partial: Partial<AgenteIndividualResidencialFormState> | null | undefined
): AgenteIndividualResidencialFormState {
  const base = createEmptyAgenteIndividualResidencialState();
  if (!partial || typeof partial !== "object") return base;
  return {
    ...base,
    ...partial,
    media: { ...base.media, ...partial.media },
    detalles: { ...base.detalles, ...partial.detalles },
    destacados: { ...base.destacados, ...partial.destacados },
    agente: partial.agente
      ? {
          ...base.agente,
          ...partial.agente,
          redes: coerceRedes(partial.agente.redes, base.agente.redes),
        }
      : base.agente,
    cta: { ...base.cta, ...partial.cta },
    extras: { ...base.extras, ...partial.extras },
  };
}
