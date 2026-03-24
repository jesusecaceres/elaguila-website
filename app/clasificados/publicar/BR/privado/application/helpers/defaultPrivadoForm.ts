import type { LeonixBRPrivadoForm } from "../schema/leonixBrPrivadoForm";

export function createEmptyLeonixBRPrivadoForm(): LeonixBRPrivadoForm {
  return {
    property: {
      principal: {
        titulo: "",
        tipoOperacion: "",
        tipoPropiedad: "",
        subtipo: "",
        precio: "",
        moneda: "MXN",
        mostrarPrecio: true,
        estatusInmueble: "",
      },
      ubicacion: {
        direccionCompleta: "",
        ciudad: "",
        estado: "",
        codigoPostal: "",
        coloniaZona: "",
        referenciaUbicacion: "",
        ocultarDireccionExacta: false,
        areaAproximada: "",
      },
      caracteristicas: {
        recamaras: "",
        banosCompletos: "",
        mediosBanos: "",
        construccionPies2: "",
        terrenoPies2: "",
        estacionamientos: "",
        anioConstruccion: "",
        estadoConservacion: "",
      },
      detalleExtra: {
        interior: "",
        exterior: "",
        servicios: "",
      },
      medios: {
        imagenesDataUrls: [],
        videoUrl: "",
        tourVirtualUrl: "",
        planoUrl: "",
        ordenFotosNotas: "",
      },
      descripcion: {
        resumen: "",
        descripcionCompleta: "",
      },
    },
    anunciante: {
      nombre: "",
      fotoDataUrl: "",
      telefono: "",
      whatsapp: "",
      email: "",
      metodoContactoPreferido: "",
      horariosResponder: "",
      idiomas: "",
      relacionPropiedad: "",
      mensajeCorto: "",
    },
    contacto: {
      permitirLlamadas: true,
      permitirWhatsapp: true,
      permitirEmail: true,
      solicitarVisita: true,
      tiempoRespuesta: "",
    },
    presencia: {
      website: "",
      facebook: "",
      instagram: "",
    },
  };
}
