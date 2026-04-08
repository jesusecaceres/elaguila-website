import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import type { BienesRaicesPreviewMediaVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import type { BienesRaicesPrivadoPreviewVm } from "@/app/clasificados/bienes-raices/preview/privado/model/bienesRaicesPrivadoPreviewVm";
import { RENTAS_PLAZO_LABELS } from "@/app/clasificados/rentas/shared/utils/rentasPublishConstants";

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
  byOwnerLabel: "Arrendador (plantilla)",
  phoneDisplay: "Teléfono (plantilla)",
  emailDisplay: "correo@ejemplo.com",
  whatsappDisplay: "WhatsApp (plantilla)",
  noteLine: "Mensaje breve opcional para quien ve el anuncio (plantilla).",
};

const CONTACT_TEMPLATE = {
  showSolicitarInfo: true,
  showLlamar: true,
  showWhatsapp: true,
  solicitarInfoHref: "mailto:correo@ejemplo.com?subject=Pregunta%20sobre%20tu%20renta%20(Leonix)",
  llamarHref: "tel:+15551234567",
  whatsappHref: "https://wa.me/15551234567",
  instructionsLine: "Plantilla: texto opcional del particular antes de los botones de contacto.",
};

const PLAZO_EJEMPLO = RENTAS_PLAZO_LABELS["12-meses"].es;

export function buildRentasPrivadoTemplateVm(categoria: BrNegocioCategoriaPropiedad): BienesRaicesPrivadoPreviewVm {
  const metaLine = "Plantilla de salida — los medios se enlazarán al publicar.";
  const base: BienesRaicesPrivadoPreviewVm = {
    categoria,
    platformLogoUrl: resolvePlatformLogoUrl(),
    heroTitle:
      categoria === "residencial"
        ? "[Plantilla] Casa o condominio en renta — título del anuncio"
        : categoria === "comercial"
          ? "[Plantilla] Espacio comercial en renta — título del anuncio"
          : "[Plantilla] Terreno o lote en renta — título del anuncio",
    addressLine: "Dirección o referencia · ciudad (plantilla)",
    priceDisplay: "$— / mes",
    listingStatusLabel: "Disponible",
    operationSummary:
      categoria === "residencial"
        ? "Renta residencial · plantilla Rentas Privado"
        : categoria === "comercial"
          ? "Renta comercial · plantilla Rentas Privado"
          : "Renta terreno / lote · plantilla Rentas Privado",
    quickFacts: [],
    seller: { ...SELLER_PLACEHOLDER },
    media: emptyMedia(metaLine),
    propertyDetailsRows: [],
    highlightsRows: [],
    hasHighlights: true,
    description:
      "Descripción del inmueble en renta (plantilla). Incluye reglas de la propiedad, horarios de visita y lo que el arrendador ofrece. Sin datos reales en esta fase.",
    hasDescription: true,
    contactRailTitle: "Contacto",
    contact: { ...CONTACT_TEMPLATE },
    location: {
      mapsUrl: null,
      line1: "Dirección aproximada o cruce de referencia",
      cityStateZip: "Ciudad, CA · plantilla",
      hasMeaningfulAddress: true,
    },
    footerNote: `Plantilla de salida Rentas Privado · categoría: ${categoria}. Misma estructura que el listado publicado; sin persistencia ni datos reales en esta fase.`,
  };

  if (categoria === "residencial") {
    base.quickFacts = [
      { label: "Renta mensual", value: "$— / mes", icon: "calendar" },
      { label: "Depósito", value: "—", icon: "pin" },
      { label: "Plazo del contrato", value: PLAZO_EJEMPLO, icon: "calendar" },
      { label: "Disponibilidad", value: "—", icon: "calendar" },
      { label: "Amueblado", value: "—", icon: "home" },
      { label: "Mascotas", value: "—", icon: "sparkle" },
    ];
    base.propertyDetailsRows = [
      { label: "Tipo", value: "Residencial en renta (plantilla)" },
      { label: "Recámaras", value: "—" },
      { label: "Baños completos", value: "—" },
      { label: "Renta mensual", value: "$— / mes" },
      { label: "Depósito", value: "—" },
      { label: "Plazo del contrato", value: PLAZO_EJEMPLO },
      { label: "Disponibilidad", value: "—" },
      { label: "Amueblado / sin amueblar", value: "—" },
      { label: "Mascotas permitidas", value: "—" },
      { label: "Servicios incluidos", value: "—" },
      { label: "Requisitos", value: "—" },
      { label: "Tamaño interior", value: "— ft²" },
      { label: "Estacionamiento", value: "—" },
    ];
    base.highlightsRows = [
      { label: "Ej. ubicación", value: "Destaque de renta residencial (plantilla)" },
      { label: "Ej. amenidades", value: "Destaque de renta residencial (plantilla)" },
    ];
  } else if (categoria === "comercial") {
    base.quickFacts = [
      { label: "Renta mensual", value: "$— / mes", icon: "calendar" },
      { label: "Depósito", value: "—", icon: "pin" },
      { label: "Plazo del contrato", value: PLAZO_EJEMPLO, icon: "calendar" },
      { label: "Disponibilidad", value: "—", icon: "calendar" },
      { label: "Amueblado", value: "—", icon: "home" },
      { label: "Servicios incluidos", value: "—", icon: "sparkle" },
    ];
    base.propertyDetailsRows = [
      { label: "Tipo comercial", value: "—" },
      { label: "Uso", value: "—" },
      { label: "Renta mensual", value: "$— / mes" },
      { label: "Depósito", value: "—" },
      { label: "Plazo del contrato", value: PLAZO_EJEMPLO },
      { label: "Disponibilidad", value: "—" },
      { label: "Amueblado / acondicionado", value: "—" },
      { label: "Mascotas / uso", value: "—" },
      { label: "Servicios incluidos", value: "—" },
      { label: "Requisitos", value: "—" },
      { label: "Tamaño interior", value: "— ft²" },
      { label: "Estacionamiento", value: "—" },
    ];
    base.highlightsRows = [
      { label: "Ej. frente", value: "Destaque de renta comercial (plantilla)" },
      { label: "Ej. acceso", value: "Destaque de renta comercial (plantilla)" },
    ];
  } else {
    base.quickFacts = [
      { label: "Renta mensual", value: "$— / mes", icon: "calendar" },
      { label: "Depósito", value: "—", icon: "pin" },
      { label: "Plazo del contrato", value: PLAZO_EJEMPLO, icon: "calendar" },
      { label: "Disponibilidad", value: "—", icon: "calendar" },
      { label: "Servicios incluidos", value: "—", icon: "sparkle" },
      { label: "Uso / zona", value: "—", icon: "pin" },
    ];
    base.propertyDetailsRows = [
      { label: "Tamaño del lote", value: "— ft²" },
      { label: "Uso / zonificación", value: "—" },
      { label: "Renta mensual", value: "$— / mes" },
      { label: "Depósito", value: "—" },
      { label: "Plazo del contrato", value: PLAZO_EJEMPLO },
      { label: "Disponibilidad", value: "—" },
      { label: "Servicios incluidos / en sitio", value: "—" },
      { label: "Acceso", value: "—" },
      { label: "Requisitos", value: "—" },
    ];
    base.highlightsRows = [
      { label: "Ej. ubicación", value: "Destaque de terreno en renta (plantilla)" },
      { label: "Ej. servicios", value: "Destaque de terreno en renta (plantilla)" },
    ];
  }

  return base;
}
