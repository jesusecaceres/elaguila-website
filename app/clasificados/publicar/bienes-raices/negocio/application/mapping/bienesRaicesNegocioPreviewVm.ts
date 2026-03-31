/**
 * View-model consumed only by `BienesRaicesNegocioPreviewView`.
 * Built exclusively via `mapBienesRaicesNegocioStateToPreviewVm` — no ad-hoc shaping in UI.
 */

export type BienesRaicesPreviewFact = { label: string; value: string };

export type BienesRaicesPreviewIdentityVm = {
  photoUrl: string | null;
  name: string;
  role: string;
  brokerageName: string;
  brokerageLogoUrl: string | null;
  verifiedLine: string;
  licenseLine: string;
  socialChips: string[];
  profileCtaLabel: string;
};

export type BienesRaicesPreviewMediaVm = {
  heroUrl: string | null;
  videoThumbUrls: [string | null, string | null];
  virtualTourUrl: string | null;
  floorPlanUrls: string[];
  sitePlanUrl: string | null;
  metaLine: string;
};

export type BienesRaicesPreviewContactVm = {
  showSolicitarInfo: boolean;
  showProgramarVisita: boolean;
  showLlamar: boolean;
  showWhatsapp: boolean;
  secondAgent: null | {
    name: string;
    role: string;
    phone: string;
    photoUrl: string | null;
  };
  lender: null | {
    name: string;
    role: string;
    subtitle: string;
    photoUrl: string | null;
  };
};

export type BienesRaicesPreviewDeepBlockVm = {
  id: string;
  heading: string;
  bullets: string[];
};

export type BienesRaicesNegocioPreviewVm = {
  heroTitle: string;
  addressLine: string;
  priceDisplay: string;
  listingStatusLabel: string;
  quickFacts: {
    beds: string;
    baths: string;
    sqft: string;
    garage: string;
    year: string;
  };
  identity: BienesRaicesPreviewIdentityVm;
  media: BienesRaicesPreviewMediaVm;
  propertyDetailsRows: BienesRaicesPreviewFact[];
  highlightsRows: BienesRaicesPreviewFact[];
  description: string;
  contact: BienesRaicesPreviewContactVm;
  deepBlocks: BienesRaicesPreviewDeepBlockVm[];
  footerNote: string;
};
