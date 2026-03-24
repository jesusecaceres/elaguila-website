/**
 * Leonix BR Negocio — application state.
 * Split: `inmueble` = HOME/PROPERTY, rest = business / agent / rail / contact.
 */

export type LeonixBrNegocioInmueble = {
  tipoPublicacion: string;
  operacion: string;
  titulo: string;
  tipoPropiedad: string;
  subtipo: string;
  precio: string;
  moneda: string;
  mostrarPrecio: boolean;
  estatusInmueble: string;
  direccionCompleta: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  coloniaZona: string;
  referenciaUbicacion: string;
  ocultarDireccionExacta: boolean;
  puntoMapaAprox: string;
  areaAproximada: string;
  recamaras: string;
  banosCompletos: string;
  mediosBanos: string;
  piesConstruccion: string;
  piesTerreno: string;
  niveles: string;
  estacionamientos: string;
  anioConstruccion: string;
  estadoConservacion: string;
  estiloDiseno: string;
  condicionGeneral: string;
  cocina: string;
  comedor: string;
  sala: string;
  cuartoLavado: string;
  closets: string;
  aireAcondicionado: string;
  calefaccion: string;
  chimenea: string;
  electrodomesticos: string;
  pisos: string;
  interiorFeatures: string;
  kitchenFeatures: string;
  diningDetails: string;
  roomDetails: string;
  patio: string;
  jardin: string;
  terraza: string;
  balcon: string;
  alberca: string;
  roofGarden: string;
  fachada: string;
  materialesConstruccion: string;
  techo: string;
  loteDescripcion: string;
  exteriorFeatures: string;
  parkingDetails: string;
  lotDetails: string;
  utilidadesServicios: string;
  energiaSolar: string;
  hoaComunidad: string;
  cuotaHoa: string;
  seguridad: string;
  accesoControlado: string;
  detallesFinancieros: string;
  detallesListing: string;
  taxParcel: string;
  escuelasCercanas: string;
  imagenes: string[];
  videoUrl: string;
  tourVirtualUrl: string;
  planoUrl: string;
  videoThumbUrl: string;
  resumenCorto: string;
  descripcionCompleta: string;
  highlights: string;
  chipsDestacados: string;
  puntosFuertes: string;
  fraseMarketing: string;
  amenidadesClave: string;
  notasVecindario: string;
};

export type LeonixBrNegocioBusiness = {
  nombreComercial: string;
  nombreLegal: string;
  logoUrl: string;
  brokerageName: string;
  website: string;
  telOficina: string;
  emailOficina: string;
  direccionOficina: string;
  licenciaBrokerage: string;
  aniosExperiencia: string;
  descripcionNegocio: string;
  horariosAtencion: string;
  idiomas: string;
  coberturaArea: string;
};

export type LeonixBrNegocioAgente = {
  fotoUrl: string;
  nombreCompleto: string;
  cargo: string;
  telDirecto: string;
  whatsapp: string;
  email: string;
  licenciaIndividual: string;
  idiomas: string;
  horarios: string;
  perfilUrl: string;
  frasePresentacion: string;
  disponibilidad: string;
};

export type LeonixBrNegocioEquipo = {
  coAgente: string;
  brokerResponsable: string;
  contactoOficina: string;
  contactoSecundario: string;
  contactoFinanciamiento: string;
  masMiembros: string;
};

export type LeonixBrNegocioRedes = {
  facebook: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
  whatsappLink: string;
  urlAgendarCita: string;
  urlPerfilProfesional: string;
  websitePrincipal: string;
  enlacesCustom: string;
};

export type LeonixBrNegocioContacto = {
  ctaPrincipal: string;
  ctaSecundario: string;
  mostrarTelefono: boolean;
  permitirMensajes: boolean;
  permitirVisita: string;
  tiempoRespuesta: string;
  disponibilidadGeneral: string;
};

export type LeonixBrNegocioFormState = {
  inmueble: LeonixBrNegocioInmueble;
  negocio: LeonixBrNegocioBusiness;
  agente: LeonixBrNegocioAgente;
  equipo: LeonixBrNegocioEquipo;
  redes: LeonixBrNegocioRedes;
  contacto: LeonixBrNegocioContacto;
};

function emptyInmueble(): LeonixBrNegocioInmueble {
  return {
    tipoPublicacion: "negocio",
    operacion: "",
    titulo: "",
    tipoPropiedad: "",
    subtipo: "",
    precio: "",
    moneda: "MXN",
    mostrarPrecio: true,
    estatusInmueble: "",
    direccionCompleta: "",
    ciudad: "",
    estado: "",
    codigoPostal: "",
    coloniaZona: "",
    referenciaUbicacion: "",
    ocultarDireccionExacta: false,
    puntoMapaAprox: "",
    areaAproximada: "",
    recamaras: "",
    banosCompletos: "",
    mediosBanos: "",
    piesConstruccion: "",
    piesTerreno: "",
    niveles: "",
    estacionamientos: "",
    anioConstruccion: "",
    estadoConservacion: "",
    estiloDiseno: "",
    condicionGeneral: "",
    cocina: "",
    comedor: "",
    sala: "",
    cuartoLavado: "",
    closets: "",
    aireAcondicionado: "",
    calefaccion: "",
    chimenea: "",
    electrodomesticos: "",
    pisos: "",
    interiorFeatures: "",
    kitchenFeatures: "",
    diningDetails: "",
    roomDetails: "",
    patio: "",
    jardin: "",
    terraza: "",
    balcon: "",
    alberca: "",
    roofGarden: "",
    fachada: "",
    materialesConstruccion: "",
    techo: "",
    loteDescripcion: "",
    exteriorFeatures: "",
    parkingDetails: "",
    lotDetails: "",
    utilidadesServicios: "",
    energiaSolar: "",
    hoaComunidad: "",
    cuotaHoa: "",
    seguridad: "",
    accesoControlado: "",
    detallesFinancieros: "",
    detallesListing: "",
    taxParcel: "",
    escuelasCercanas: "",
    imagenes: [],
    videoUrl: "",
    tourVirtualUrl: "",
    planoUrl: "",
    videoThumbUrl: "",
    resumenCorto: "",
    descripcionCompleta: "",
    highlights: "",
    chipsDestacados: "",
    puntosFuertes: "",
    fraseMarketing: "",
    amenidadesClave: "",
    notasVecindario: "",
  };
}

function emptyNegocio(): LeonixBrNegocioBusiness {
  return {
    nombreComercial: "",
    nombreLegal: "",
    logoUrl: "",
    brokerageName: "",
    website: "",
    telOficina: "",
    emailOficina: "",
    direccionOficina: "",
    licenciaBrokerage: "",
    aniosExperiencia: "",
    descripcionNegocio: "",
    horariosAtencion: "",
    idiomas: "",
    coberturaArea: "",
  };
}

function emptyAgente(): LeonixBrNegocioAgente {
  return {
    fotoUrl: "",
    nombreCompleto: "",
    cargo: "",
    telDirecto: "",
    whatsapp: "",
    email: "",
    licenciaIndividual: "",
    idiomas: "",
    horarios: "",
    perfilUrl: "",
    frasePresentacion: "",
    disponibilidad: "",
  };
}

function emptyEquipo(): LeonixBrNegocioEquipo {
  return {
    coAgente: "",
    brokerResponsable: "",
    contactoOficina: "",
    contactoSecundario: "",
    contactoFinanciamiento: "",
    masMiembros: "",
  };
}

function emptyRedes(): LeonixBrNegocioRedes {
  return {
    facebook: "",
    instagram: "",
    linkedin: "",
    youtube: "",
    tiktok: "",
    whatsappLink: "",
    urlAgendarCita: "",
    urlPerfilProfesional: "",
    websitePrincipal: "",
    enlacesCustom: "",
  };
}

function emptyContacto(): LeonixBrNegocioContacto {
  return {
    ctaPrincipal: "",
    ctaSecundario: "",
    mostrarTelefono: true,
    permitirMensajes: true,
    permitirVisita: "",
    tiempoRespuesta: "",
    disponibilidadGeneral: "",
  };
}

export function createEmptyLeonixBrNegocioFormState(): LeonixBrNegocioFormState {
  return {
    inmueble: emptyInmueble(),
    negocio: emptyNegocio(),
    agente: emptyAgente(),
    equipo: emptyEquipo(),
    redes: emptyRedes(),
    contacto: emptyContacto(),
  };
}
