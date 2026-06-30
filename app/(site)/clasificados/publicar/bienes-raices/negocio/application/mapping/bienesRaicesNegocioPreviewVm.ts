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
  /** When false (Confianza → “Mostrar brokerage”), ocultamos marca/logo en preview. */
  showBrokerageBlock: boolean;
  verifiedLine: string;
  licenseLine: string;
  /** Short bio when captured (agent/equipo/oficina). */
  bioLine: string;
  /** Clickable redes when URL resolves; omit malformed entries. */
  socialLinks: Array<{ label: string; href: string }>;
  profileCtaLabel: string;
  /** Sitio web o primer enlace útil para el CTA de perfil. */
  profileHref: string | null;
  /** False when no public URL — preview must not fake a live profile link. */
  profileCtaEnabled: boolean;
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
  externalVideoLinks?: Array<{ label: string; href: string }>;
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
  /** Leyenda opcional alineada con la portada (photoCaptions[primaryImageIndex]). */
  heroCaption: string | null;
  /** Todas las fotos en orden de captura (misma longitud que `photoCaptionsFull` cuando aplica). */
  allPhotoUrls: string[];
  /** Índice de portada en `allPhotoUrls`. */
  coverPhotoIndex: number;
  /** Leyendas alineadas por índice con `allPhotoUrls`. */
  photoCaptionsFull: string[];
};

export type BienesRaicesPreviewContactVm = {
  showSolicitarInfo: boolean;
  showProgramarVisita: boolean;
  showLlamar: boolean;
  showWhatsapp: boolean;
  showSms: boolean;
  /** `mailto:` solo si hay correo; si no, el botón no debe fingir acción. */
  solicitarInfoHref: string | null;
  programarVisitaHref: string | null;
  llamarHref: string | null;
  whatsappHref: string | null;
  smsHref: string | null;
  /** Preferencias de contacto / instrucciones (misma ficha). */
  instructionsLine: string;
  /** Texto libre del formulario (visitas). */
  horarioPreferidoLine: string;
  /** Resumen cuando open house está activo y hay datos. */
  openHouseSummary: string | null;
  /** Gate 12C — optional website (may duplicate identity profile CTA when same URL). */
  websiteHref?: string | null;
  /** Gate 12C — structured social icons (Instagram, etc.). */
  socialIconLinks?: Array<{ kind: "instagram" | "facebook" | "youtube" | "tiktok"; href: string }>;
  usefulLinks?: Array<{ label: string; href: string }>;
  preferredContactLine?: string;
  secondAgent: null | {
    name: string;
    role: string;
    phone: string;
    photoUrl: string | null;
    /** Línea extra cuando hay correo (evita duplicar si ya va en `phone`). */
    emailLine?: string;
    bioLine?: string;
  };
  lender: null | {
    name: string;
    role: string;
    subtitle: string;
    photoUrl: string | null;
    websiteHref?: string | null;
    disclaimer?: string;
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
  /** When set (e.g. Rentas), overrides the highlights card title in preview. */
  highlightsSectionTitle?: string;
  contact: BienesRaicesPreviewContactVm;
  /** @deprecated Prefer `detailClusters` for render; retained for any legacy consumers */
  deepBlocks: BienesRaicesPreviewDeepBlockVm[];
  detailClusters: BienesRaicesPreviewDetailClusterVm[];
  location: BienesRaicesPreviewLocationVm;
  schools: { rows: BienesRaicesPreviewFact[]; showModule: boolean };
  community: { rows: BienesRaicesPreviewFact[]; showModule: boolean };
  hoaDevelopment: { rows: BienesRaicesPreviewFact[]; showModule: boolean; sitePlanCallout: boolean };
  /** When true, street `direccion` is persisted in public `Dirección` / map query. */
  mostrarDireccionExacta: boolean;
  footerNote: string;
  /** Gate 12D — HOA/community card (hidden when empty). */
  hoaCommunityCard?: { title: string; rows: BienesRaicesPreviewFact[] } | null;
  /** Gate 12E / Rentas — showings card (hidden when empty). */
  openHouseCard?: { title: string; rows: BienesRaicesPreviewFact[] } | null;
  /** Owner/admin preview chrome (not shown on public live pages). */
  ownerPreviewShell?: {
    inventoryMode: boolean;
    parentLeonixAdId: string | null;
    leonixAdIdLine: string | null;
  };
};
