import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import type { BienesRaicesPreviewMediaVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import type { BienesRaicesPrivadoPreviewVm } from "./bienesRaicesPrivadoPreviewVm";

function resolvePlatformLogoUrl(): string {
  if (typeof process === "undefined") return "/logo.png";
  const raw = String(process.env.NEXT_PUBLIC_LEONIX_BRAND_LOGO_URL ?? "").trim();
  return raw || "/logo.png";
}

function emptyMedia(metaLine: string): BienesRaicesPreviewMediaVm {
  return {
    heroUrl: null,
    secondaryPhotoUrls: [],
    videoThumbUrls: [null, null],
    videoPlaybackUrls: [null, null],
    youtubeIds: [null, null],
    virtualTourUrl: null,
    floorPlanUrls: [],
    sitePlanUrl: null,
    metaLine,
    hasPhotos: false,
    hasVideo1: false,
    hasVideo2: false,
    hasVirtualTour: false,
    hasFloorPlans: false,
    hasSitePlan: false,
    photoCount: 0,
    heroCaption: null,
    allPhotoUrls: [],
    coverPhotoIndex: 0,
    photoCaptionsFull: [],
  };
}

const SELLER_PLACEHOLDER = {
  photoUrl: null as string | null,
  hasPhoto: false,
  name: "Nombre del particular",
  byOwnerLabel: "Propietario (plantilla)",
  phoneDisplay: "Teléfono (plantilla)",
  emailDisplay: "correo@ejemplo.com",
  whatsappDisplay: "WhatsApp (plantilla)",
  noteLine: "Mensaje breve opcional para quien ve el anuncio (plantilla).",
};

const CONTACT_TEMPLATE = {
  showSolicitarInfo: true,
  showLlamar: true,
  showWhatsapp: true,
  solicitarInfoHref: "mailto:correo@ejemplo.com?subject=Pregunta%20sobre%20tu%20propiedad%20(Leonix)",
  llamarHref: "tel:+15551234567",
  whatsappHref: "https://wa.me/15551234567",
  instructionsLine: "Plantilla: texto opcional del particular antes de los botones de contacto.",
};

export function buildBienesRaicesPrivadoTemplateVm(categoria: BrNegocioCategoriaPropiedad): BienesRaicesPrivadoPreviewVm {
  const metaLine = "Plantilla de salida — los medios se enlazarán al publicar.";
  const base: BienesRaicesPrivadoPreviewVm = {
    categoria,
    platformLogoUrl: resolvePlatformLogoUrl(),
    heroTitle:
      categoria === "residencial"
        ? "[Plantilla] Casa o condominio en venta — título del anuncio"
        : categoria === "comercial"
          ? "[Plantilla] Espacio comercial en venta — título del anuncio"
          : "[Plantilla] Terreno o lote en venta — título del anuncio",
    addressLine: "Dirección o referencia · ciudad (plantilla)",
    priceDisplay: "$000,000",
    listingStatusLabel: "Disponible",
    operationSummary:
      categoria === "residencial"
        ? "Venta residencial · plantilla BR Privado"
        : categoria === "comercial"
          ? "Venta comercial · plantilla BR Privado"
          : "Venta terreno / lote · plantilla BR Privado",
    quickFacts: [],
    seller: { ...SELLER_PLACEHOLDER },
    media: emptyMedia(metaLine),
    propertyDetailsRows: [],
    highlightsRows: [],
    hasHighlights: true,
    description:
      "Descripción principal del anuncio (plantilla). Este texto ocupará el mismo espacio que en anuncios publicados. Sin datos reales en esta fase.",
    hasDescription: true,
    contactRailTitle: "Contacto",
    contact: { ...CONTACT_TEMPLATE },
    location: {
      mapsUrl: null,
      line1: "Dirección aproximada o cruce de referencia",
      cityStateZip: "Ciudad, CA · plantilla",
      hasMeaningfulAddress: true,
    },
    footerNote: `Plantilla de salida BR Privado · categoría: ${categoria}. Misma estructura que el listado publicado; sin persistencia ni datos reales en esta fase.`,
  };

  if (categoria === "residencial") {
    base.quickFacts = [
      { label: "Recámaras", value: "—", icon: "bed" },
      { label: "Baños", value: "—", icon: "bath" },
      { label: "Interior", value: "— ft²", icon: "ruler" },
      { label: "Lote", value: "— ft²", icon: "pin" },
      { label: "Estacionamiento", value: "—", icon: "car" },
      { label: "Año", value: "—", icon: "calendar" },
    ];
    base.propertyDetailsRows = [
      { label: "Tipo", value: "Residencial (plantilla)" },
      { label: "Subtipo", value: "—" },
      { label: "Recámaras", value: "—" },
      { label: "Baños completos", value: "—" },
      { label: "Medios baños", value: "—" },
      { label: "Tamaño interior", value: "— ft²" },
      { label: "Tamaño del lote", value: "— ft²" },
      { label: "Estacionamiento", value: "—" },
      { label: "Año de construcción", value: "—" },
      { label: "Condición", value: "—" },
    ];
    base.highlightsRows = [
      { label: "Ej. cocina", value: "Destaque residencial (plantilla)" },
      { label: "Ej. patio", value: "Destaque residencial (plantilla)" },
    ];
  } else if (categoria === "comercial") {
    base.quickFacts = [
      { label: "Tipo", value: "Comercial", icon: "home" },
      { label: "Interior", value: "— ft²", icon: "ruler" },
      { label: "Oficinas", value: "—", icon: "sparkle" },
      { label: "Baños", value: "—", icon: "bath" },
      { label: "Niveles", value: "—", icon: "calendar" },
      { label: "Estacionamiento", value: "—", icon: "car" },
    ];
    base.propertyDetailsRows = [
      { label: "Tipo comercial", value: "—" },
      { label: "Uso", value: "—" },
      { label: "Tamaño interior", value: "— ft²" },
      { label: "Oficinas", value: "—" },
      { label: "Baños", value: "—" },
      { label: "Niveles / pisos", value: "—" },
      { label: "Estacionamiento", value: "—" },
      { label: "Zonificación", value: "—" },
      { label: "Condición", value: "—" },
      { label: "Acceso de carga", value: "—" },
    ];
    base.highlightsRows = [
      { label: "Ej. vitrina", value: "Destaque comercial (plantilla)" },
      { label: "Ej. acceso", value: "Destaque comercial (plantilla)" },
    ];
  } else {
    base.quickFacts = [
      { label: "Lote", value: "— ft²", icon: "ruler" },
      { label: "Uso / zona", value: "—", icon: "pin" },
      { label: "Acceso", value: "—", icon: "car" },
      { label: "Servicios", value: "—", icon: "sparkle" },
    ];
    base.propertyDetailsRows = [
      { label: "Tamaño del lote", value: "— ft²" },
      { label: "Uso / zonificación", value: "—" },
      { label: "Acceso", value: "—" },
      { label: "Servicios disponibles", value: "—" },
      { label: "Topografía", value: "—" },
      { label: "Listo para construir", value: "—" },
      { label: "Cercado", value: "—" },
    ];
    base.highlightsRows = [
      { label: "Ej. esquina", value: "Destaque de terreno (plantilla)" },
      { label: "Ej. servicios", value: "Destaque de terreno (plantilla)" },
    ];
  }

  return base;
}
