/**
 * VM fija para `AgenteIndividualResidencialPreviewView` — un solo mapper.
 */

export type AgenteResHeroVm = {
  title: string;
  /** Venta vs renta residencial. */
  operationLine: string;
  locationLine: string;
  priceDisplay: string;
  statusPill: string;
  quickFacts: Array<{ label: string; value: string }>;
};

export type AgenteResSidebarVm = {
  photoUrl: string | null;
  name: string;
  title: string;
  marcaOficina: string;
  bioLine: string;
  phoneDisplay: string;
  email: string;
  websiteHref: string | null;
  websiteLabel: string;
  socialLinks: Array<{ label: string; href: string }>;
  licenciaLine: string;
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

export type AgenteResCtaVm = {
  showLlamar: boolean;
  llamarHref: string | null;
  showWhatsapp: boolean;
  whatsappHref: string | null;
  showEmail: boolean;
  emailHref: string | null;
  showProgramarVisita: boolean;
  visitaHref: string | null;
  showVerSitioWeb: boolean;
  verSitioHref: string | null;
  showVerRedes: boolean;
  primeraRedHref: string | null;
  showVerListado: boolean;
  verListadoHref: string | null;
  showVerTour: boolean;
  verTourHref: string | null;
  showVerFolleto: boolean;
  verFolletoHref: string | null;
};

export type AgenteResExtrasVm = {
  openHouseSummary: string | null;
  asesorBlock: null | {
    name: string;
    phone: string;
    email: string;
  };
  puntosCercanos: string;
  transporte: string;
  mapQuery: string;
};

export type AgenteIndividualResidencialPreviewVm = {
  hero: AgenteResHeroVm;
  sidebar: AgenteResSidebarVm;
  media: AgenteResMediaVm;
  propertyRows: AgenteResPropertyRowVm[];
  destacadosLabels: string[];
  descripcionPrincipal: string;
  notasAdicionales: string;
  cta: AgenteResCtaVm;
  extras: AgenteResExtrasVm;
  hasDescription: boolean;
  hasNotas: boolean;
};
