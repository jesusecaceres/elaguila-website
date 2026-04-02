/**
 * Listado de ejemplo cuando no hay borrador en sesión — mismo patrón que `mockAutoDealerListing` (Autos).
 * La vista previa siempre recibe un `AgenteIndividualResidencialFormState` completo.
 */
import {
  createEmptyAgenteIndividualResidencialFormState,
  type AgenteIndividualResidencialFormState,
} from "../schema/agenteIndividualResidencialFormState";

const P1 =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80";
const P2 =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";
const P3 =
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80";
const LOGO =
  "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=400&q=80";

const empty = createEmptyAgenteIndividualResidencialFormState();

export const mockAgenteIndividualResidencialListing: AgenteIndividualResidencialFormState = {
  ...empty,
  titulo: "Casa en East Side — ejemplo de plantilla Leonix",
  precio: "434000",
  ciudad: "San Jose",
  areaCiudad: "East Side",
  direccion: "87 N King Rd",
  estadoAnuncio: "disponible",
  tipoPropiedadCodigo: "casa",
  tipoPropiedadOtro: "",
  subtipoPropiedad: "Unifamiliar",
  listadoUrl: "https://example.com/listado-propiedad",
  listadoArchivoDataUrl: "",
  listadoArchivoNombre: "",
  fotosDataUrls: [P1, P2, P3, P1, P2],
  fotoPortadaIndex: 0,
  videoUrl: "https://example.com/recorrido-video",
  videoDataUrl: "",
  tourUrl: "https://example.com/matterport-tour",
  tourDataUrl: "",
  brochureUrl: "",
  brochureDataUrl: "",
  recamaras: "3",
  banos: "2.5",
  mediosBanos: "1",
  tamanoInteriorSqft: "1950",
  tamanoLoteSqft: "6200",
  estacionamientos: "2",
  anoConstruccion: "1998",
  condicionPropiedad: "excelente",
  destacados: {
    ...empty.destacados,
    piscina: true,
    patio: true,
    terraza: true,
    garaje: true,
    comunidad_cerrada: true,
    paneles_solares: true,
  },
  descripcionPrincipal:
    "Propiedad luminosa con buen flujo, cocina renovada y escuelas reconocidas cerca. Listo para programar visita.",
  notasAdicionales: "Se revisan ofertas; mostrador de cuarzo recién instalado.",
  agenteFotoDataUrl: LOGO,
  agenteNombre: "Nombre del agente",
  agenteTitulo: "Agente inmobiliario",
  agenteLicencia: "DRE #987654",
  telefonoPrincipal: "4085550100",
  correoPrincipal: "agente@ejemplo.com",
  marcaNombre: "Oficina ejemplo Leonix",
  marcaLogoDataUrl: LOGO,
  marcaLicencia: "DRE oficina #01234567",
  marcaSitioWeb: "https://example.com/oficina",
  mostrarMarcaEnTarjeta: true,
  socialInstagram: "https://instagram.com/ejemplo",
  socialFacebook: "https://facebook.com/ejemplo",
  socialYoutube: "https://youtube.com/@ejemplo",
  socialTiktok: "https://tiktok.com/@ejemplo",
  socialX: "https://x.com/ejemplo",
  socialOtro: "https://example.com/red",
  agenteAreaServicio: "Condado de Santa Clara",
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
  ctaNumeroLlamadas: "",
  ctaNumeroWhatsapp: "",
  ctaCorreoSolicitarInfo: "",
  ctaEnlaceProgramarVisita: "https://example.com/agendar",
  ctaEnlaceSitioWeb: "",
  ctaUrlListadoCompleto: "https://example.com/listado-completo",
  ctaUrlMls: "https://example.com/mls",
  ctaUrlTour: "",
  ctaUrlFolleto: "https://example.com/folleto.pdf",
  extraOpenHouse: true,
  openHouseFecha: "Sábado 12 de abril",
  openHouseInicio: "13:00",
  openHouseFin: "16:00",
  openHouseNotas: "Refreshments en cocina.",
  extraAsesorFinanciero: true,
  asesorNombre: "Asesor financiero de ejemplo",
  asesorTelefono: "4085550200",
  asesorEmail: "asesor@ejemplo.com",
};
