/**
 * Plantilla de desarrollo: VM completa con valores de ejemplo obvios.
 * Solo se usa con `?template=sample` en desarrollo (`AgenteIndividualResidencialPreviewClient`).
 * Producción: `mapAgenteIndividualResidencialToPreview` + datos reales; sin contenido ficticio.
 */
import type { AgenteIndividualResidencialPreviewVm } from "./agenteIndividualResidencialPreviewVm";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export function getSampleAgenteIndividualResidencialPreviewVm(): AgenteIndividualResidencialPreviewVm {
  return {
    hero: {
      title: "Título del anuncio aquí — plantilla de revisión",
      operationLine: "Venta residencial",
      locationLine: "San Jose · East Side · 87 N King Rd",
      priceDisplay: "$434,000",
      statusPill: "Disponible",
      quickFacts: [
        { key: "recamaras", label: "Recámaras", value: "3" },
        { key: "banos", label: "Baños", value: "2.5" },
        { key: "tamano_interior", label: "Interior (ft²)", value: "1,950" },
        { key: "estacionamientos", label: "Estacionamientos", value: "2" },
        { key: "ano_construccion", label: "Año", value: "1998" },
        { key: "tamano_lote", label: "Lote (ft²)", value: "6,200" },
      ],
    },
    professionalCard: {
      hasBrandBlock: true,
      brandName: "Nombre de oficina o marca",
      brandLogoUrl: TINY_PNG,
      brandLicenseLine: "Licencia de oficina: DRE #01234567",
      brandWebsiteHref: "https://example.com/oficina",
      agentPhotoUrl: TINY_PNG,
      agentName: "Nombre del agente",
      agentTitle: "Agente inmobiliario",
      agentLicenseLine: "Licencia o número profesional: #987654",
      phoneDisplay: "(408) 555-0100",
      emailDisplay: "agente@ejemplo.com",
      areaServicioLine: "Condado de Santa Clara",
      idiomasLine: "Español · Inglés",
    },
    social: {
      instagram: "https://instagram.com/ejemplo",
      facebook: "https://facebook.com/ejemplo",
      youtube: "https://youtube.com/@ejemplo",
      tiktok: "https://tiktok.com/@ejemplo",
      x: "https://x.com/ejemplo",
      otro: "https://example.com/red",
    },
    gallery: {
      mainPhoto: { role: "main_photo", url: TINY_PNG },
      secondaryPhoto1: { role: "secondary_photo_1", url: TINY_PNG },
      secondaryPhoto2: { role: "secondary_photo_2", url: TINY_PNG },
      video: {
        role: "video",
        dataUrl: null,
        externalHref: "https://example.com/video",
      },
      tourOrPlan: {
        role: "tour_or_plan",
        href: "https://example.com/tour",
        variant: "tour",
      },
      showAllPhotosCta: { visible: true, totalPhotoCount: 8 },
    },
    propertyRows: [
      { label: "Tipo de propiedad", value: "Casa · Unifamiliar" },
      { label: "Recámaras", value: "3" },
      { label: "Baños", value: "2.5" },
      { label: "Medios baños", value: "1" },
      { label: "Tamaño interior", value: "1,950" },
      { label: "Tamaño del lote", value: "6,200" },
      { label: "Estacionamientos", value: "2" },
      { label: "Año de construcción", value: "1998" },
      { label: "Condición", value: "Excelente" },
    ],
    destacadosLabels: [
      "Piscina",
      "Patio",
      "Terraza",
      "Garaje",
      "Comunidad cerrada",
      "Paneles solares",
    ],
    descripcionPrincipal:
      "Descripción principal de ejemplo: propiedad luminosa, cocina renovada, escuelas cercanas. Este párrafo ocupa el slot de descripción en la plantilla.",
    notasAdicionales: "Notas adicionales de ejemplo: se aceptan ofertas; mostrador de cuarzo nuevo.",
    hasDescription: true,
    hasNotas: true,
    contactRail: {
      showLlamar: true,
      llamarHref: "tel:4085550100",
      showWhatsapp: true,
      whatsappHref: "https://wa.me/14085550100",
      showSolicitarInformacion: true,
      solicitarInformacionHref: "mailto:agente@ejemplo.com?subject=Consulta",
      showProgramarVisita: true,
      programarVisitaHref: "https://example.com/visita",
      showVerSitioWeb: true,
      verSitioWebHref: "https://example.com/sitio",
      showVerListado: true,
      verListadoHref: "https://example.com/listado",
      listadoDownloadName: null,
      showVerMls: true,
      verMlsHref: "https://example.com/mls",
      showVerTour: true,
      verTourHref: "https://example.com/tour",
      showVerFolleto: true,
      verFolletoHref: "https://example.com/folleto.pdf",
      showSocialIcons: true,
    },
    extras: {
      openHouseSummary: "Fecha: sábado 12 de abril\nHorario: 13:00 – 16:00\nNotas: refreshments en cocina.",
      asesorBlock: {
        name: "Asesor financiero de ejemplo",
        phone: "(408) 555-0200",
        email: "asesor@ejemplo.com",
      },
      mapQuery: "87 N King Rd, San Jose, CA",
    },
  };
}
