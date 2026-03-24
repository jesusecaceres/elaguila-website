/**
 * Leonix BR Privado — modelo de aplicación (más ligero que negocio).
 * `property` = inmueble; `anunciante` + `contacto` + `presencia` = lado persona.
 */

export type LeonixBRPrivadoPrincipal = {
  titulo: string;
  tipoOperacion: string;
  tipoPropiedad: string;
  subtipo: string;
  precio: string;
  moneda: string;
  mostrarPrecio: boolean;
  estatusInmueble: string;
};

export type LeonixBRPrivadoUbicacion = {
  direccionCompleta: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  coloniaZona: string;
  referenciaUbicacion: string;
  ocultarDireccionExacta: boolean;
  areaAproximada: string;
};

export type LeonixBRPrivadoCaracteristicas = {
  recamaras: string;
  banosCompletos: string;
  mediosBanos: string;
  construccionPies2: string;
  terrenoPies2: string;
  estacionamientos: string;
  anioConstruccion: string;
  estadoConservacion: string;
};

export type LeonixBRPrivadoDetalleExtra = {
  interior: string;
  exterior: string;
  servicios: string;
};

export type LeonixBRPrivadoMedios = {
  imagenesDataUrls: string[];
  videoUrl: string;
  tourVirtualUrl: string;
  planoUrl: string;
  ordenFotosNotas: string;
};

export type LeonixBRPrivadoDescripcion = {
  resumen: string;
  descripcionCompleta: string;
};

export type LeonixBRPrivadoPropertyBlock = {
  principal: LeonixBRPrivadoPrincipal;
  ubicacion: LeonixBRPrivadoUbicacion;
  caracteristicas: LeonixBRPrivadoCaracteristicas;
  detalleExtra: LeonixBRPrivadoDetalleExtra;
  medios: LeonixBRPrivadoMedios;
  descripcion: LeonixBRPrivadoDescripcion;
};

export type LeonixBRPrivadoAnunciante = {
  nombre: string;
  fotoDataUrl: string;
  telefono: string;
  whatsapp: string;
  email: string;
  metodoContactoPreferido: string;
  horariosResponder: string;
  idiomas: string;
  relacionPropiedad: string;
  mensajeCorto: string;
};

export type LeonixBRPrivadoContacto = {
  permitirLlamadas: boolean;
  permitirWhatsapp: boolean;
  permitirEmail: boolean;
  solicitarVisita: boolean;
  tiempoRespuesta: string;
};

export type LeonixBRPrivadoPresencia = {
  website: string;
  facebook: string;
  instagram: string;
};

export type LeonixBRPrivadoForm = {
  property: LeonixBRPrivadoPropertyBlock;
  anunciante: LeonixBRPrivadoAnunciante;
  contacto: LeonixBRPrivadoContacto;
  presencia: LeonixBRPrivadoPresencia;
};
