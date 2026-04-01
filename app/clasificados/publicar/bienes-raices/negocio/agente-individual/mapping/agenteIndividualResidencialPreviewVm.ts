/**
 * VM fija — slots alineados a plantilla (un solo mapper).
 * Nombres tipo professionalCard.* / contactRail.* para trazabilidad.
 */

/** Clave estable por significado de campo (iconografía y plantilla). */
export type AgenteResQuickFactSemanticKey =
  | "recamaras"
  | "banos"
  | "tamano_interior"
  | "estacionamientos"
  | "ano_construccion"
  | "tamano_lote";

export type AgenteResQuickFactVm = {
  key: AgenteResQuickFactSemanticKey;
  label: string;
  value: string;
};

export type AgenteResHeroVm = {
  title: string;
  operationLine: string;
  locationLine: string;
  priceDisplay: string;
  statusPill: string;
  /** Orden fijo de plantilla; cada ítem lleva clave semántica (no por posición decorativa). */
  quickFacts: AgenteResQuickFactVm[];
};

/** professionalCard — tarjeta profesional + marca */
export type ProfessionalCardVm = {
  /** true si hay logo, nombre de marca o sitio (bloque marca dedicado). */
  hasBrandBlock: boolean;
  brandName: string;
  brandLogoUrl: string | null;
  brandLicenseLine: string;
  brandWebsiteHref: string | null;
  agentPhotoUrl: string | null;
  agentName: string;
  agentTitle: string;
  agentLicenseLine: string;
  agentBio: string;
  phoneDisplay: string;
  emailDisplay: string;
  areaServicioLine: string;
  idiomasLine: string;
};

/** social.* — un href por icono; vacío = no render */
export type SocialSlotsVm = {
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  tiktok: string | null;
  x: string | null;
  otro: string | null;
};

/** Roles explícitos de mosaico (plantilla). */
export type AgenteResGalleryTileRole =
  | "main_photo"
  | "secondary_photo_1"
  | "secondary_photo_2"
  | "video"
  | "tour_or_plan";

export type AgenteResGalleryVm = {
  mainPhoto: {
    role: "main_photo";
    url: string | null;
  };
  secondaryPhoto1: {
    role: "secondary_photo_1";
    url: string | null;
  };
  secondaryPhoto2: {
    role: "secondary_photo_2";
    url: string | null;
  };
  video: {
    role: "video";
    dataUrl: string | null;
    externalHref: string | null;
  };
  /** Tour virtual o plano/folleto (un slot; prioridad tour → folleto en mapper). */
  tourOrPlan: {
    role: "tour_or_plan";
    href: string | null;
    variant: "tour" | "brochure" | "none";
  };
  /** CTA plantilla cuando hay más fotos de las que caben en el mosaico. */
  showAllPhotosCta: {
    visible: boolean;
    totalPhotoCount: number;
  };
};

export type AgenteResPropertyRowVm = { label: string; value: string };

/** contactRail — botones solo si toggle + destino resuelto */
export type ContactRailVm = {
  showLlamar: boolean;
  llamarHref: string | null;
  showWhatsapp: boolean;
  whatsappHref: string | null;
  showSolicitarInformacion: boolean;
  solicitarInformacionHref: string | null;
  showProgramarVisita: boolean;
  programarVisitaHref: string | null;
  showVerSitioWeb: boolean;
  verSitioWebHref: string | null;
  showVerListado: boolean;
  verListadoHref: string | null;
  listadoDownloadName: string | null;
  showVerMls: boolean;
  verMlsHref: string | null;
  showVerTour: boolean;
  verTourHref: string | null;
  showVerFolleto: boolean;
  verFolletoHref: string | null;
  /** Iconos sociales: toggle global en formulario */
  showSocialIcons: boolean;
};

export type AgenteResExtrasVm = {
  openHouseSummary: string | null;
  asesorBlock: null | {
    name: string;
    phone: string;
    email: string;
  };
  mapQuery: string;
};

export type AgenteIndividualResidencialPreviewVm = {
  hero: AgenteResHeroVm;
  professionalCard: ProfessionalCardVm;
  social: SocialSlotsVm;
  gallery: AgenteResGalleryVm;
  propertyRows: AgenteResPropertyRowVm[];
  destacadosLabels: string[];
  descripcionPrincipal: string;
  notasAdicionales: string;
  contactRail: ContactRailVm;
  extras: AgenteResExtrasVm;
  hasDescription: boolean;
  hasNotas: boolean;
};
