/**
 * VM fija — slots alineados a plantilla (un solo mapper).
 * Nombres tipo professionalCard.* / contactRail.* para trazabilidad.
 */

export type AgenteResHeroVm = {
  title: string;
  operationLine: string;
  locationLine: string;
  priceDisplay: string;
  statusPill: string;
  quickFacts: Array<{ label: string; value: string }>;
};

/** professionalCard — tarjeta profesional + marca */
export type ProfessionalCardVm = {
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

export type AgenteResMediaVm = {
  heroUrl: string | null;
  secondaryUrls: string[];
  coverIndex: number;
  videoEmbedUrl: string | null;
  tourHref: string | null;
  brochureHref: string | null;
  photoCount: number;
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
  media: AgenteResMediaVm;
  propertyRows: AgenteResPropertyRowVm[];
  destacadosLabels: string[];
  descripcionPrincipal: string;
  notasAdicionales: string;
  contactRail: ContactRailVm;
  extras: AgenteResExtrasVm;
  hasDescription: boolean;
  hasNotas: boolean;
};
