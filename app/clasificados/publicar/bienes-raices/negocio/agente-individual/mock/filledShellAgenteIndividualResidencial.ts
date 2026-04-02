/**
 * TEMPORAL — plantilla BR completa para verificación de slots en la ruta real de vista previa.
 * No usar como datos de producción; el cliente de vista previa debe volver a leer borrador cuando se termine la verificación.
 */
import {
  AGENTE_RES_DESTACADOS_DEFS,
  createEmptyAgenteIndividualResidencialFormState,
  type AgenteIndividualResidencialFormState,
} from "../schema/agenteIndividualResidencialFormState";

const P1 =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80";
const P2 =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";
const P3 =
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80";
const P4 =
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdfe?auto=format&fit=crop&w=1200&q=80";
const LOGO =
  "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=400&q=80";

const empty = createEmptyAgenteIndividualResidencialFormState();

const todosLosDestacados = { ...empty.destacados };
for (const d of AGENTE_RES_DESTACADOS_DEFS) {
  todosLosDestacados[d.id] = true;
}

export const FILLED_SHELL_AGENTE_INDIVIDUAL_RESIDENCIAL: AgenteIndividualResidencialFormState = {
  ...empty,
  titulo: "[Plantilla] Casa residencial — verificación de slots Leonix",
  precio: "434000",
  ciudad: "San Jose",
  areaCiudad: "East Side",
  direccion: "87 N King Rd",
  estadoAnuncio: "disponible",
  tipoPropiedadCodigo: "casa",
  tipoPropiedadOtro: "",
  subtipoPropiedad: "Unifamiliar",
  listadoUrl: "https://example.com/listado-informacion-basica",
  listadoArchivoDataUrl: "",
  listadoArchivoNombre: "listado.pdf",
  fotosDataUrls: [P1, P2, P3, P4, P1, P2],
  fotoPortadaIndex: 0,
  videoUrl: "https://example.com/video-recorrido",
  videoDataUrl: "",
  tourUrl: "https://example.com/tour-virtual",
  tourDataUrl: "",
  brochureUrl: "https://example.com/plano-folleto.pdf",
  brochureDataUrl: "",
  recamaras: "3",
  banos: "2.5",
  mediosBanos: "1",
  tamanoInteriorSqft: "1950",
  tamanoLoteSqft: "6200",
  estacionamientos: "2",
  anoConstruccion: "1998",
  condicionPropiedad: "excelente",
  destacados: todosLosDestacados,
  descripcionPrincipal:
    "[Plantilla] Descripción principal de ejemplo: propiedad luminosa, cocina renovada, buen flujo y escuelas reconocidas en la zona.",
  notasAdicionales:
    "[Plantilla] Notas adicionales: se revisan ofertas; mostrador de cuarzo nuevo; ideal para visita con cita.",
  agenteFotoDataUrl: LOGO,
  agenteNombre: "[Plantilla] Nombre del agente",
  agenteTitulo: "[Plantilla] Agente inmobiliario",
  agenteLicencia: "DRE #987654",
  telefonoPrincipal: "4085550100",
  correoPrincipal: "agente.plantilla@ejemplo.com",
  marcaNombre: "[Plantilla] Oficina o marca",
  marcaLogoDataUrl: LOGO,
  marcaLicencia: "DRE oficina #01234567",
  marcaSitioWeb: "https://example.com/marca",
  mostrarMarcaEnTarjeta: true,
  socialInstagram: "https://instagram.com/ejemplo",
  socialFacebook: "https://facebook.com/ejemplo",
  socialYoutube: "https://youtube.com/@ejemplo",
  socialTiktok: "https://tiktok.com/@ejemplo",
  socialX: "https://x.com/ejemplo",
  socialOtro: "https://example.com/red-social",
  agenteAreaServicio: "Condado de Santa Clara y alrededores",
  agenteIdiomas: "Español · Inglés",
  permitirSolicitarInformacion: true,
  permitirProgramarVisita: true,
  permitirLlamar: true,
  permitirWhatsApp: true,
  permitirVerSitioWeb: true,
  permitirVerRedes: true,
  permitirVerListadoCompleto: true,
  permitirVerMls: true,
  permitirVerTour: true,
  permitirVerFolleto: true,
  ctaNumeroLlamadas: "4085550100",
  ctaNumeroWhatsapp: "4085550100",
  ctaCorreoSolicitarInfo: "consultas.plantilla@ejemplo.com",
  ctaEnlaceProgramarVisita: "https://example.com/programar-visita",
  ctaEnlaceSitioWeb: "https://example.com/sitio-web-cta",
  ctaUrlListadoCompleto: "https://example.com/listado-completo",
  ctaUrlMls: "https://example.com/mls",
  ctaUrlTour: "https://example.com/tour-cta",
  ctaUrlFolleto: "https://example.com/folleto-cta.pdf",
  extraOpenHouse: true,
  openHouseFecha: "Sábado 12 de abril",
  openHouseInicio: "13:00",
  openHouseFin: "16:00",
  openHouseNotas: "Refreshments en cocina; estacionamiento en calle.",
  extraAsesorFinanciero: true,
  asesorNombre: "[Plantilla] Asesor de financiamiento",
  asesorTelefono: "4085550200",
  asesorEmail: "asesor.plantilla@ejemplo.com",
};
