/**
 * Bienes Raíces — Negocio application state.
 * Single source of truth for the publish flow; mapped to preview VM (see application/mapping).
 */

export type BienesRaicesAdvertiserType =
  | ""
  | "agente_individual"
  | "equipo_agentes"
  | "oficina_brokerage"
  | "constructor_desarrollador";

export type BienesRaicesPublicationType =
  | ""
  | "residencial_venta"
  | "residencial_renta"
  | "comercial"
  | "terreno"
  | "proyecto_nuevo"
  | "multifamiliar_inversion";

export type BienesRaicesListingStatus =
  | "en_venta"
  | "en_renta"
  | "disponible_pronto"
  | "preconstruccion"
  | "bajo_contrato";

export type DeepDetailGroupKey =
  | "tipoYEstilo"
  | "construccion"
  | "interior"
  | "exterior"
  | "estacionamiento"
  | "loteTerreno"
  | "utilidades"
  | "comunidadHoa"
  | "financiera"
  | "escuelasUbicacion"
  | "identificadores"
  | "observacionesAgente";

export type DeepDetailsState = Record<DeepDetailGroupKey, Record<string, string>>;

export type BienesRaicesNegocioFormState = {
  advertiserType: BienesRaicesAdvertiserType;
  publicationType: BienesRaicesPublicationType;

  titulo: string;
  precio: string;
  tipoOperacion: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  colonia: string;
  descripcionCorta: string;
  listingStatus: BienesRaicesListingStatus;

  tipoPropiedad: string;
  recamaras: string;
  banosCompletos: string;
  mediosBanos: string;
  piesCuadrados: string;
  tamanoLote: string;
  estacionamientos: string;
  anioConstruccion: string;
  niveles: string;
  condicion: string;
  amueblado: string;
  hoaSiNo: string;
  cuotaHoa: string;

  propertySubtype: string;
  proyectoComunidad: string;
  proyectoModelo: string;
  proyectoEtapa: string;
  proyectoEntregaEstimada: string;
  proyectoUnidadesDisponibles: string;
  proyectoAmenidades: string;
  invNumUnidades: string;
  invRentaActual: string;
  invOcupacion: string;
  invCapRate: string;
  invIngresoEstimado: string;

  media: {
    photoUrls: string[];
    coverIndex: number;
    videoUrls: string[];
    virtualTourUrl: string;
    floorPlanUrls: string[];
    sitePlanUrl: string;
    photoCaptions: string[];
  };

  highlightPresets: Record<string, boolean>;
  /** Multiline text; each non-empty line becomes a custom highlight in preview. */
  customHighlightsText: string;

  descripcionLarga: string;

  /** Muestra el bloque opcional de asesor de préstamos (paso 11). */
  asesorFinancieroActivo: boolean;

  deepDetails: DeepDetailsState;

  identityAgente: {
    nombre: string;
    fotoUrl: string;
    rol: string;
    brokerage: string;
    logoBrokerageUrl: string;
    licencia: string;
    telDirecto: string;
    telOficina: string;
    email: string;
    sitioWeb: string;
    redes: string[];
    idiomas: string;
    areasServicio: string;
    bio: string;
    segundoAgenteActivo: boolean;
  };

  identityEquipo: {
    nombreEquipo: string;
    imagenUrl: string;
    brokerage: string;
    logoUrl: string;
    telGeneral: string;
    email: string;
    sitioWeb: string;
    redes: string[];
    areasServicio: string;
    bio: string;
    agentePrincipalNombre: string;
    agentePrincipalRol: string;
    segundoAgenteNombre: string;
    segundoAgenteRol: string;
  };

  identityOficina: {
    nombreOficina: string;
    logoUrl: string;
    telPrincipal: string;
    email: string;
    sitioWeb: string;
    redes: string[];
    direccionOficina: string;
    horario: string;
    contactoPrincipal: string;
    contactoSecundario: string;
    bio: string;
    areasServicio: string;
  };

  identityConstructor: {
    nombreDesarrollador: string;
    logoUrl: string;
    proyectoNombre: string;
    modelo: string;
    direccionVentas: string;
    tel: string;
    email: string;
    sitioWeb: string;
    redes: string[];
    horarioVentas: string;
    estadoDesarrollo: string;
    entregaEstimada: string;
    descripcionProyecto: string;
    contactoPrincipal: string;
    contactoSecundario: string;
  };

  segundoAgente: {
    nombre: string;
    fotoUrl: string;
    rol: string;
    telefono: string;
    email: string;
    bio: string;
  };

  asesorFinanciero: {
    nombre: string;
    fotoUrl: string;
    rol: string;
    compania: string;
    telefono: string;
    email: string;
    sitioWeb: string;
    nmls: string;
    textoApoyo: string;
  };

  cta: {
    permitirSolicitarInfo: boolean;
    permitirProgramarVisita: boolean;
    permitirLlamar: boolean;
    permitirWhatsapp: boolean;
    mensajePrellenado: string;
    instruccionesContacto: string;
    horarioPreferido: string;
    openHouseActivo: boolean;
    openHouseFecha: string;
    openHouseInicio: string;
    openHouseFin: string;
    openHouseNotas: string;
  };

  trust: {
    mostrarLicencia: boolean;
    mostrarBrokerage: boolean;
    mostrarSitioWeb: boolean;
    mostrarRedes: boolean;
    confirmarInformacion: boolean;
    confirmarFotos: boolean;
    confirmarReglas: boolean;
    confirmarAutorizacion: boolean;
  };
};

const REDES_SLOTS = 5;

function emptyRedes(): string[] {
  return Array.from({ length: REDES_SLOTS }, () => "");
}

function emptyDeepDetails(): DeepDetailsState {
  return {
    tipoYEstilo: {
      tipoPropiedad: "",
      subtipo: "",
      estilo: "",
      estado: "",
      uso: "",
    },
    construccion: {
      anioConstruccion: "",
      materialExterior: "",
      tipoTecho: "",
      fundacion: "",
      ventanas: "",
      aislamiento: "",
      acabados: "",
    },
    interior: {
      pisos: "",
      calefaccion: "",
      aireAcondicionado: "",
      chimenea: "",
      electrodomesticos: "",
      distribucion: "",
      cuartosAdicionales: "",
      oficina: "",
      sotano: "",
      closets: "",
      techos: "",
    },
    exterior: {
      patio: "",
      porch: "",
      terraza: "",
      balcon: "",
      jardin: "",
      piscina: "",
      cocinaExterior: "",
      cercado: "",
      vista: "",
      iluminacion: "",
    },
    estacionamiento: {
      garaje: "",
      espacios: "",
      cubierto: "",
      accesoEv: "",
      porton: "",
      cochera: "",
      driveway: "",
    },
    loteTerreno: {
      tamano: "",
      dimensiones: "",
      topografia: "",
      esquina: "",
      usoSuelo: "",
      zonificacion: "",
    },
    utilidades: {
      agua: "",
      alcantarillado: "",
      electricidad: "",
      gas: "",
      internet: "",
      panelesSolares: "",
      eficiencia: "",
      calentadorAgua: "",
    },
    comunidadHoa: {
      hoa: "",
      cuota: "",
      frecuencia: "",
      amenidades: "",
      seguridad: "",
      gated: "",
    },
    financiera: {
      impuestosAnuales: "",
      precioPorPie: "",
      ingresoActual: "",
      gastosOperativos: "",
      capRate: "",
      sellerConcessions: "",
    },
    escuelasUbicacion: {
      distrito: "",
      primaria: "",
      secundaria: "",
      preparatoria: "",
      puntosCercanos: "",
      transporte: "",
      vecindario: "",
      zona: "",
    },
    identificadores: {
      mls: "",
      parcela: "",
      codigoInterno: "",
      referenciaAnunciante: "",
    },
    observacionesAgente: {
      observacionesPublicas: "",
      observacionesPrivadas: "",
      restricciones: "",
      instruccionesShowing: "",
    },
  };
}

const HIGHLIGHT_KEYS = [
  "piscina",
  "cocinaRemodelada",
  "electrodomesticosLujo",
  "patio",
  "balcon",
  "vista",
  "comunidadCerrada",
  "techosAltos",
  "cuartoPrincipalGrande",
  "walkInCloset",
  "oficinaEnCasa",
  "panelesSolares",
  "smartHome",
  "chimenea",
  "lavanderia",
  "estacionamientoTechado",
  "accesoControlado",
  "elevador",
  "terraza",
  "gimnasio",
  "amenidadesDesarrollo",
] as const;

function emptyHighlights(): Record<string, boolean> {
  const o: Record<string, boolean> = {};
  for (const k of HIGHLIGHT_KEYS) o[k] = false;
  return o;
}

export function createEmptyBienesRaicesNegocioFormState(): BienesRaicesNegocioFormState {
  return {
    advertiserType: "",
    publicationType: "",
    titulo: "",
    precio: "",
    tipoOperacion: "",
    direccion: "",
    ciudad: "",
    estado: "",
    codigoPostal: "",
    colonia: "",
    descripcionCorta: "",
    listingStatus: "en_venta",
    tipoPropiedad: "",
    recamaras: "",
    banosCompletos: "",
    mediosBanos: "",
    piesCuadrados: "",
    tamanoLote: "",
    estacionamientos: "",
    anioConstruccion: "",
    niveles: "",
    condicion: "",
    amueblado: "",
    hoaSiNo: "",
    cuotaHoa: "",
    propertySubtype: "",
    proyectoComunidad: "",
    proyectoModelo: "",
    proyectoEtapa: "",
    proyectoEntregaEstimada: "",
    proyectoUnidadesDisponibles: "",
    proyectoAmenidades: "",
    invNumUnidades: "",
    invRentaActual: "",
    invOcupacion: "",
    invCapRate: "",
    invIngresoEstimado: "",
    media: {
      photoUrls: [],
      coverIndex: 0,
      videoUrls: [],
      virtualTourUrl: "",
      floorPlanUrls: [],
      sitePlanUrl: "",
      photoCaptions: [],
    },
    highlightPresets: emptyHighlights(),
    customHighlightsText: "",
    descripcionLarga: "",
    asesorFinancieroActivo: false,
    deepDetails: emptyDeepDetails(),
    identityAgente: {
      nombre: "",
      fotoUrl: "",
      rol: "Agente de listado",
      brokerage: "",
      logoBrokerageUrl: "",
      licencia: "",
      telDirecto: "",
      telOficina: "",
      email: "",
      sitioWeb: "",
      redes: emptyRedes(),
      idiomas: "",
      areasServicio: "",
      bio: "",
      segundoAgenteActivo: false,
    },
    identityEquipo: {
      nombreEquipo: "",
      imagenUrl: "",
      brokerage: "",
      logoUrl: "",
      telGeneral: "",
      email: "",
      sitioWeb: "",
      redes: emptyRedes(),
      areasServicio: "",
      bio: "",
      agentePrincipalNombre: "",
      agentePrincipalRol: "",
      segundoAgenteNombre: "",
      segundoAgenteRol: "",
    },
    identityOficina: {
      nombreOficina: "",
      logoUrl: "",
      telPrincipal: "",
      email: "",
      sitioWeb: "",
      redes: emptyRedes(),
      direccionOficina: "",
      horario: "",
      contactoPrincipal: "",
      contactoSecundario: "",
      bio: "",
      areasServicio: "",
    },
    identityConstructor: {
      nombreDesarrollador: "",
      logoUrl: "",
      proyectoNombre: "",
      modelo: "",
      direccionVentas: "",
      tel: "",
      email: "",
      sitioWeb: "",
      redes: emptyRedes(),
      horarioVentas: "",
      estadoDesarrollo: "",
      entregaEstimada: "",
      descripcionProyecto: "",
      contactoPrincipal: "",
      contactoSecundario: "",
    },
    segundoAgente: {
      nombre: "",
      fotoUrl: "",
      rol: "",
      telefono: "",
      email: "",
      bio: "",
    },
    asesorFinanciero: {
      nombre: "",
      fotoUrl: "",
      rol: "",
      compania: "",
      telefono: "",
      email: "",
      sitioWeb: "",
      nmls: "",
      textoApoyo: "",
    },
    cta: {
      permitirSolicitarInfo: true,
      permitirProgramarVisita: true,
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
    trust: {
      mostrarLicencia: true,
      mostrarBrokerage: true,
      mostrarSitioWeb: true,
      mostrarRedes: true,
      confirmarInformacion: false,
      confirmarFotos: false,
      confirmarReglas: false,
      confirmarAutorizacion: false,
    },
  };
}

type LegacyPartial = Partial<BienesRaicesNegocioFormState> & {
  customHighlights?: string[];
  identityAgente?: Partial<BienesRaicesNegocioFormState["identityAgente"]> & { asesorFinancieroActivo?: boolean };
};

export function mergePartialBienesRaicesNegocioState(partial: LegacyPartial): BienesRaicesNegocioFormState {
  const base = createEmptyBienesRaicesNegocioFormState();
  const legacyHighlightsText =
    Array.isArray(partial.customHighlights) && partial.customHighlights.length
      ? partial.customHighlights.join("\n")
      : undefined;
  const legacyAsesor =
    partial.identityAgente && typeof partial.identityAgente.asesorFinancieroActivo === "boolean"
      ? partial.identityAgente.asesorFinancieroActivo
      : undefined;
  return {
    ...base,
    ...partial,
    media: { ...base.media, ...partial.media },
    highlightPresets: { ...base.highlightPresets, ...partial.highlightPresets },
    customHighlightsText:
      typeof partial.customHighlightsText === "string"
        ? partial.customHighlightsText
        : legacyHighlightsText ?? base.customHighlightsText,
    asesorFinancieroActivo:
      typeof partial.asesorFinancieroActivo === "boolean"
        ? partial.asesorFinancieroActivo
        : typeof legacyAsesor === "boolean"
          ? legacyAsesor
          : base.asesorFinancieroActivo,
    deepDetails: partial.deepDetails
      ? (Object.keys(base.deepDetails) as DeepDetailGroupKey[]).reduce((acc, key) => {
          acc[key] = { ...base.deepDetails[key], ...partial.deepDetails![key] };
          return acc;
        }, { ...base.deepDetails })
      : base.deepDetails,
    identityAgente: partial.identityAgente
      ? (() => {
          const { asesorFinancieroActivo: _dropAsesor, ...ia } = partial.identityAgente as typeof partial.identityAgente & {
            asesorFinancieroActivo?: boolean;
          };
          return { ...base.identityAgente, ...ia };
        })()
      : base.identityAgente,
    identityEquipo: { ...base.identityEquipo, ...partial.identityEquipo },
    identityOficina: { ...base.identityOficina, ...partial.identityOficina },
    identityConstructor: { ...base.identityConstructor, ...partial.identityConstructor },
    segundoAgente: { ...base.segundoAgente, ...partial.segundoAgente },
    asesorFinanciero: { ...base.asesorFinanciero, ...partial.asesorFinanciero },
    cta: { ...base.cta, ...partial.cta },
    trust: { ...base.trust, ...partial.trust },
  };
}
