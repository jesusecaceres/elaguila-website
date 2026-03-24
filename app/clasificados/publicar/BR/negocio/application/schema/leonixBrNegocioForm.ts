/**
 * Leonix BR Negocio — application-layer form model.
 * Split: `property` = inmueble / hogar; `rail` = negocio, agente, equipo, redes, contacto.
 */

export type LeonixBRNegocioTipoPublicacion = {
  /** Cómo se publicará el inmueble en la práctica (texto libre o valor normalizado). */
  modoPublicacion: string;
  /** Notas internas (visibilidad/plan más adelante; hoy solo captura). */
  notasInternas: string;
};

export type LeonixBRNegocioPrincipal = {
  titulo: string;
  tipoOperacion: string;
  tipoPropiedad: string;
  subtipo: string;
  precio: string;
  moneda: string;
  mostrarPrecio: boolean;
  estatusInmueble: string;
  tipoPublicacionInterna: string;
};

export type LeonixBRNegocioUbicacion = {
  direccionCompleta: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  coloniaZona: string;
  referenciaUbicacion: string;
  ocultarDireccionExacta: boolean;
  puntoMapaNotas: string;
  areaAproximada: string;
};

export type LeonixBRNegocioCaracteristicas = {
  recamaras: string;
  banosCompletos: string;
  mediosBanos: string;
  construccionPies2: string;
  terrenoPies2: string;
  niveles: string;
  estacionamientos: string;
  anioConstruccion: string;
  estadoConservacion: string;
  estiloDiseno: string;
  condicionGeneral: string;
};

export type LeonixBRNegocioInterior = {
  cocina: string;
  comedor: string;
  sala: string;
  cuartoLavado: string;
  closets: string;
  aireAcondicionado: string;
  calefaccion: string;
  chimenea: string;
  electrodomesticosIncluidos: string;
  pisos: string;
  interiorFeatures: string;
  kitchenFeatures: string;
  diningDetails: string;
  roomDetails: string;
};

export type LeonixBRNegocioExterior = {
  patio: string;
  jardin: string;
  terraza: string;
  balcon: string;
  alberca: string;
  roofGarden: string;
  fachada: string;
  materialesConstruccion: string;
  techo: string;
  loteTerreno: string;
  exteriorFeatures: string;
  parkingDetails: string;
  lotDetails: string;
};

export type LeonixBRNegocioServiciosComunidad = {
  utilidadesServicios: string;
  energiaSolar: string;
  hoaComunidad: string;
  cuotaHoa: string;
  seguridad: string;
  accesoControlado: string;
  detallesFinancieros: string;
  detallesListing: string;
  taxParcelNotas: string;
  comunidadVecindario: string;
  escuelas: string;
};

export type LeonixBRNegocioMedios = {
  /** Hasta 12 — almacenamos data URLs en cliente para vista previa local. */
  imagenesDataUrls: string[];
  videoUrl: string;
  tourVirtualUrl: string;
  planoUrl: string;
  planoNombreArchivo: string;
  thumbnailVideoUrl: string;
  ordenFotosNotas: string;
};

export type LeonixBRNegocioDescripcionMarketing = {
  resumenCorto: string;
  descripcionCompleta: string;
  highlights: string;
  chipsDestacados: string;
  puntosFuertes: string;
  fraseMarketing: string;
  amenidadesClave: string;
  notasVecindario: string;
};

export type LeonixBRNegocioNegocio = {
  nombreComercial: string;
  nombreLegal: string;
  logoDataUrl: string;
  brokerageName: string;
  website: string;
  telefonoOficina: string;
  emailOficina: string;
  direccionOficina: string;
  licenciaNegocio: string;
  aniosExperiencia: string;
  descripcionNegocio: string;
  horariosAtencion: string;
  idiomas: string;
  coberturaArea: string;
};

export type LeonixBRNegocioAgentePrincipal = {
  fotoDataUrl: string;
  nombreCompleto: string;
  cargoRol: string;
  telefonoDirecto: string;
  whatsapp: string;
  correo: string;
  licenciaIndividual: string;
  idiomas: string;
  horarios: string;
  urlPerfil: string;
  frasePresentacion: string;
  disponibilidadRespuesta: string;
};

export type LeonixBRNegocioEquipoAdicional = {
  coAgente: string;
  brokerResponsable: string;
  contactoOficina: string;
  contactoSecundario: string;
  contactoPrestamos: string;
  masMiembrosEquipo: string;
  masAnunciosNegocioNotas: string;
};

export type LeonixBRNegocioRedes = {
  facebook: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
  whatsappLink: string;
  urlAgendarCita: string;
  urlPerfilProfesional: string;
  websitePrincipal: string;
  enlacesPersonalizados: string;
};

export type LeonixBRNegocioContactoCta = {
  ctaPrincipal: string;
  ctaSecundario: string;
  mostrarTelefono: boolean;
  permitirMensajes: boolean;
  permitirSolicitudVisita: boolean;
  tiempoRespuestaEstimado: string;
  disponibilidadGeneral: string;
};

export type LeonixBRNegocioPropertyBlock = {
  tipoPublicacion: LeonixBRNegocioTipoPublicacion;
  principal: LeonixBRNegocioPrincipal;
  ubicacion: LeonixBRNegocioUbicacion;
  caracteristicas: LeonixBRNegocioCaracteristicas;
  interior: LeonixBRNegocioInterior;
  exterior: LeonixBRNegocioExterior;
  serviciosComunidad: LeonixBRNegocioServiciosComunidad;
  medios: LeonixBRNegocioMedios;
  descripcionMarketing: LeonixBRNegocioDescripcionMarketing;
};

export type LeonixBRNegocioRailBlock = {
  negocio: LeonixBRNegocioNegocio;
  agentePrincipal: LeonixBRNegocioAgentePrincipal;
  equipoAdicional: LeonixBRNegocioEquipoAdicional;
  redes: LeonixBRNegocioRedes;
  contactoCta: LeonixBRNegocioContactoCta;
};

export type LeonixBRNegocioForm = {
  property: LeonixBRNegocioPropertyBlock;
  rail: LeonixBRNegocioRailBlock;
};
