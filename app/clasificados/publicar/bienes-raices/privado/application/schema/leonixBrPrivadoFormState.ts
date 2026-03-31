/**
 * Leonix BR Privado — más ligero que negocio.
 * `inmueble` = propiedad; `anunciante` + `presencia` = persona / contacto opcional.
 */

export type LeonixBrPrivadoFormState = {
  inmueble: {
    titulo: string;
    operacion: string;
    tipoPropiedad: string;
    subtipo: string;
    precio: string;
    moneda: string;
    mostrarPrecio: boolean;
    estatus: string;
    direccionCompleta: string;
    ciudad: string;
    estado: string;
    codigoPostal: string;
    coloniaZona: string;
    ocultarDireccionExacta: boolean;
    recamaras: string;
    banosCompletos: string;
    piesConstruccion: string;
    piesTerreno: string;
    estacionamientos: string;
    resumenInterior: string;
    resumenExterior: string;
    resumenServicios: string;
    imagenes: string[];
    videoUrl: string;
    tourVirtualUrl: string;
    planoUrl: string;
    descripcion: string;
  };
  anunciante: {
    nombre: string;
    fotoUrl: string;
    telefono: string;
    whatsapp: string;
    email: string;
    metodoPreferido: "telefono" | "whatsapp" | "correo" | "ambos";
    horarios: string;
    idiomas: string;
    relacion: "dueño" | "familiar" | "administrador" | "";
    mensajeCorto: string;
  };
  presencia: {
    website: string;
    facebook: string;
    instagram: string;
  };
};

export function createEmptyLeonixBrPrivadoFormState(): LeonixBrPrivadoFormState {
  return {
    inmueble: {
      titulo: "",
      operacion: "",
      tipoPropiedad: "",
      subtipo: "",
      precio: "",
      moneda: "MXN",
      mostrarPrecio: true,
      estatus: "",
      direccionCompleta: "",
      ciudad: "",
      estado: "",
      codigoPostal: "",
      coloniaZona: "",
      ocultarDireccionExacta: false,
      recamaras: "",
      banosCompletos: "",
      piesConstruccion: "",
      piesTerreno: "",
      estacionamientos: "",
      resumenInterior: "",
      resumenExterior: "",
      resumenServicios: "",
      imagenes: [],
      videoUrl: "",
      tourVirtualUrl: "",
      planoUrl: "",
      descripcion: "",
    },
    anunciante: {
      nombre: "",
      fotoUrl: "",
      telefono: "",
      whatsapp: "",
      email: "",
      metodoPreferido: "ambos",
      horarios: "",
      idiomas: "",
      relacion: "",
      mensajeCorto: "",
    },
    presencia: {
      website: "",
      facebook: "",
      instagram: "",
    },
  };
}
