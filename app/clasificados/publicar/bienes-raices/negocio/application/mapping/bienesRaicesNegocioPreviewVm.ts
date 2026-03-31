/**
 * View-model consumed only by `BienesRaicesNegocioPreviewView`.
 * Built exclusively via `mapBienesRaicesNegocioStateToPreviewVm` (contrato en `brNegocioInputToPreviewMap.ts`).
 */

import type { BienesRaicesPublicationType } from "../schema/bienesRaicesNegocioFormState";

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
  /** Sitio web o primer enlace útil para el CTA de perfil. */
  profileHref: string | null;
  contactPhone: string;
  contactEmail: string;
  /** Presence flags to keep preview truthful (no fake assets). */
  hasPhoto: boolean;
  hasSocialLinks: boolean;
};

export type BienesRaicesPreviewQuickFactVm = {
  label: string;
  value: string;
  icon: "bed" | "bath" | "ruler" | "car" | "calendar" | "home" | "pin" | "sparkle";
};

export type BienesRaicesPreviewMediaVm = {
  heroUrl: string | null;
  /** Fotos de galería después de excluir la portada (máx. 2) para la parrilla lateral. */
  secondaryPhotoUrls: string[];
  videoThumbUrls: [string | null, string | null];
  /** HLS / mp4 / direct URLs for inline preview */
  videoPlaybackUrls: [string | null, string | null];
  youtubeIds: [string | null, string | null];
  virtualTourUrl: string | null;
  floorPlanUrls: string[];
  sitePlanUrl: string | null;
  metaLine: string;
  /** Presence flags to keep preview truthful (no fake assets). */
  hasPhotos: boolean;
  hasVideo1: boolean;
  hasVideo2: boolean;
  hasVirtualTour: boolean;
  hasFloorPlans: boolean;
  hasSitePlan: boolean;
  /** Total de fotos cargadas (incluye portada) para badges de galería. */
  photoCount: number;
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
  hasContent: boolean;
};

/** Grouped deep-detail blocks for scannable lower-page output (Phase 5). */
export type BienesRaicesPreviewDetailClusterVm = {
  id: string;
  title: string;
  blocks: BienesRaicesPreviewDeepBlockVm[];
};

export type BienesRaicesPreviewLocationVm = {
  line1: string;
  colonia: string;
  cityStateZip: string;
  fullAddress: string;
  mapsUrl: string | null;
  hasMeaningfulAddress: boolean;
};

export type BienesRaicesNegocioPreviewVm = {
  publicationType: BienesRaicesPublicationType | "";
  /** Logo Leonix en cabecera: `NEXT_PUBLIC_LEONIX_BRAND_LOGO_URL` o `/logo.png` en `public/`. */
  platformLogoUrl: string;
  heroTitle: string;
  addressLine: string;
  priceDisplay: string;
  listingStatusLabel: string;
  operationSummary: string;
  quickFacts: BienesRaicesPreviewQuickFactVm[];
  contactRailTitle: string;
  identity: BienesRaicesPreviewIdentityVm;
  media: BienesRaicesPreviewMediaVm;
  propertyDetailsRows: BienesRaicesPreviewFact[];
  highlightsRows: BienesRaicesPreviewFact[];
  description: string;
  hasDescription: boolean;
  hasHighlights: boolean;
  contact: BienesRaicesPreviewContactVm;
  /** @deprecated Prefer `detailClusters` for render; retained for any legacy consumers */
  deepBlocks: BienesRaicesPreviewDeepBlockVm[];
  detailClusters: BienesRaicesPreviewDetailClusterVm[];
  location: BienesRaicesPreviewLocationVm;
  schools: { rows: BienesRaicesPreviewFact[]; showModule: boolean };
  community: { rows: BienesRaicesPreviewFact[]; showModule: boolean };
  hoaDevelopment: { rows: BienesRaicesPreviewFact[]; showModule: boolean; sitePlanCallout: boolean };
  footerNote: string;
};
