/**
 * Globalization Package B (Gate B1) — per-lane media classification and limits registry.
 *
 * SHARED MEDIA CONTRACT + CATEGORY MEDIA CONFIG + SMALL CATEGORY ADAPTER.
 *
 * Every value below is REPOSITORY TRUTH with a citation — never an invented or harmonized
 * limit. Where a category's constant lives under app/(site)/** (importing it here would
 * invert the app/lib → app/(site) dependency direction), the value is a documented literal
 * citing its exact source, following the precedent set by categoryRouteRegistry.ts; the
 * Package B gate self-test imports the real constants from the category modules and asserts
 * these literals equal them, so drift is caught mechanically.
 *
 * "no-cap" is a truthful classification (Empleos/Comunidad/Clases galleries and Autos photos
 * have NO enforced count limit today — the Autos lane constants 3/12/12 exist but are dead,
 * imported by nothing); introducing caps would be a product decision, not a Package B repair.
 */

import type { CanonicalCategoryKey } from "@/app/lib/listingIdentity/types";

export type LaneMediaImagesRule =
  | { kind: "counted"; min: number; max: number }
  | { kind: "single"; required: boolean }
  | { kind: "uncapped"; min: number }
  | { kind: "text-only" };

export type LaneMediaRecord = {
  pipeline: CanonicalCategoryKey;
  /** Distinguishes intra-pipeline lanes and parent/child roles. */
  lane:
    | "default"
    | "free"
    | "pro"
    | "parent"
    | "child"
    | "quick"
    | "premium"
    | "feria"
    | "negocios"
    | "privado";
  images: LaneMediaImagesRule;
  logoSupported: boolean;
  /** How the hero/primary image is represented in this lane's model. */
  hero: "index" | "isMain-flag" | "dedicated-field" | "hero-first-storage" | "none";
  /** Max external video URLs (0 = unsupported). Local video uploads are never allowed. */
  maxExternalVideos: number;
  /** Which validator guards video input for this lane (named for auditability). */
  videoValidator:
    | "en-venta-embeddable"
    | "restaurante-embeddable"
    | "autos-https-strict"
    | "shared-https-strict" // Package B addition (Servicios + Viajes boundary)
    | "regex-only"
    | "none";
  mediaOwner: "self" | "parent-owned" | "child-owned";
  editSurface: "category-editor" | "generic-editor" | "parent-application" | "none" | "external-workstream";
  notes: readonly string[];
};

export const LANE_MEDIA_REGISTRY: readonly LaneMediaRecord[] = [
  {
    pipeline: "en_venta",
    lane: "pro",
    // EN_VENTA_PREVIEW_MAX_PHOTOS = { free: 3, pro: 12 } — buildEnVentaPreviewModel.ts:152;
    // publish tolerates zero photos (enVentaPublishFromDraft.ts:542).
    images: { kind: "counted", min: 0, max: 12 },
    logoSupported: false,
    hero: "index",
    // EN_VENTA_MAX_EXTERNAL_VIDEO_URLS = 4 (enVentaVideoUrls.ts:4).
    maxExternalVideos: 4,
    videoValidator: "en-venta-embeddable",
    mediaOwner: "self",
    editSurface: "generic-editor",
    notes: [
      "Draft editor supports remove/reorder/hero; publish orders cover-first.",
      "isEmbeddableExternalVideoUrl accepts blob: for LOCAL PREVIEW playback only — the input " +
        "gate isValidEnVentaExternalVideoUrl requires ^https?:// so blob: can never be " +
        "persisted (D16 assessed: contained, not a live defect).",
    ],
  },
  {
    pipeline: "rentas_privado",
    lane: "privado",
    // MAX_PHOTOS = 8 (rentasPrivadoFormState.ts:163); min 1 enforced at
    // leonixPublishRealEstateFromDraftState.ts:278-287.
    images: { kind: "counted", min: 1, max: 8 },
    logoSupported: false,
    hero: "hero-first-storage",
    maxExternalVideos: 1,
    videoValidator: "regex-only",
    mediaOwner: "self",
    editSurface: "category-editor",
    notes: [
      "Publish rotates the gallery hero-first (orderedRentasGallerySourcesForPublish:492-501), " +
        "so edit hydration with primaryImageIndex 0 correctly points at the stored hero — " +
        "T6 holds by persisted order, not by a stored index.",
      "listing-edit route's empty-set fallback to existing images (route.ts:122) is the " +
        "media-loss safety net (T7); clearing ALL photos is impossible AND invalid (min 1).",
    ],
  },
  {
    pipeline: "rentas_negocio",
    lane: "negocios",
    images: { kind: "counted", min: 1, max: 8 },
    logoSupported: false,
    hero: "hero-first-storage",
    maxExternalVideos: 1,
    videoValidator: "regex-only",
    mediaOwner: "self",
    editSurface: "category-editor",
    notes: ["Mirrors rentas_privado media semantics."],
  },
  {
    pipeline: "empleos",
    lane: "quick",
    // No count cap exists anywhere for Empleos images (confirmed) — truthful classification.
    images: { kind: "uncapped", min: 0 },
    logoSupported: true,
    hero: "isMain-flag",
    // .slice(0,4) at buildEmpleosPublishEnvelope.ts:46.
    maxExternalVideos: 4,
    videoValidator: "regex-only",
    mediaOwner: "self",
    editSurface: "category-editor",
    notes: ["premium and feria lanes share this media model (one draft/gallery editor)."],
  },
  {
    pipeline: "bienes_raices_privado",
    lane: "privado",
    // MAX_PHOTOS = 8 (bienesRaicesPrivadoFormState.ts:261); min 1 at publish.
    images: { kind: "counted", min: 1, max: 8 },
    logoSupported: false,
    hero: "hero-first-storage",
    maxExternalVideos: 1,
    videoValidator: "none",
    mediaOwner: "self",
    editSurface: "generic-editor",
    notes: ["Seller photo is a separate single-image field, editable in the generic editor."],
  },
  {
    pipeline: "bienes_raices_negocio",
    lane: "parent",
    // steps01-03.tsx:540 caps at 40 (GaleriaMultimediaNegocioSection.tsx:20 says 50 for the
    // non-agente shell — divergence documented, not harmonized here); min 1 at
    // leonixPublishRealEstateFromDraftState.ts:412-420.
    images: { kind: "counted", min: 1, max: 40 },
    logoSupported: true,
    hero: "hero-first-storage",
    // AGENTE_RES_MAX_VIDEO_URLS = 8 (agenteIndividualResidencialFormState.ts:62).
    // Global Business Hub OS — pilot-lane video cap raised 4 -> 8.
    maxExternalVideos: 8,
    videoValidator: "none",
    mediaOwner: "self",
    editSurface: "category-editor",
    notes: ["Brokerage/team/office logos are identity fields, not gallery items."],
  },
  {
    pipeline: "bienes_raices_negocio",
    lane: "child",
    // MAX_CHILD_PHOTOS = 40 (brNegocioAdditionalInventoryDraft.ts:13).
    images: { kind: "counted", min: 0, max: 40 },
    logoSupported: false,
    hero: "index",
    // Global Business Hub OS — pilot-lane video cap raised 4 -> 8, matching the parent lane.
    maxExternalVideos: 8,
    videoValidator: "none",
    mediaOwner: "child-owned",
    editSurface: "parent-application",
    notes: [
      "Child media persists on the child's OWN listings row; the child editor session " +
        "(brNegocioChildInventoryEditorSession) isolates it from parent and siblings.",
    ],
  },
  {
    pipeline: "servicios",
    lane: "default",
    // GALLERY_MAX = 24 (ClasificadosServiciosApplication.tsx:140).
    images: { kind: "counted", min: 0, max: 24 },
    logoSupported: true,
    hero: "dedicated-field",
    // SERVICIOS_MAX_VIDEO_URLS = 8 (clasificadosServiciosApplicationTypes.ts:64).
    // Global Business Hub OS — pilot-lane video cap raised 4 -> 8.
    maxExternalVideos: 8,
    // Package B Gate B3 — validator ADDED (was: any URL accepted).
    videoValidator: "shared-https-strict",
    mediaOwner: "self",
    editSurface: "category-editor",
    notes: ["Featured/cover selection via featuredGalleryIds + coverUrl; primary video flag."],
  },
  {
    pipeline: "autos_privado",
    lane: "privado",
    // No enforced count cap (AUTOS_FREE/PRO constants are dead code — confirmed unimported).
    images: { kind: "uncapped", min: 0 },
    logoSupported: false,
    hero: "index",
    // AUTOS_MAX_EXTERNAL_VIDEO_URLS = 8 (autosExternalVideoUrlValidation.ts:1).
    // Global Business Hub OS — pilot-lane video cap raised 4 -> 8.
    maxExternalVideos: 8,
    videoValidator: "autos-https-strict",
    mediaOwner: "self",
    editSurface: "category-editor",
    notes: ["mediaImages sortOrder + isPrimary convention; heroImages derived."],
  },
  {
    pipeline: "autos_negocios",
    lane: "parent",
    images: { kind: "uncapped", min: 0 },
    logoSupported: true,
    hero: "index",
    // Global Business Hub OS — pilot-lane video cap raised 4 -> 8.
    maxExternalVideos: 8,
    videoValidator: "autos-https-strict",
    mediaOwner: "self",
    editSurface: "category-editor",
    notes: ["Dealer logo + finance image are IDB-ref'd single slots."],
  },
  {
    pipeline: "autos_negocios",
    lane: "child",
    images: { kind: "uncapped", min: 0 },
    logoSupported: false,
    hero: "index",
    // Global Business Hub OS — pilot-lane video cap raised 4 -> 8, matching the parent lane.
    maxExternalVideos: 8,
    videoValidator: "autos-https-strict",
    mediaOwner: "child-owned",
    editSurface: "parent-application",
    notes: [
      "Child media lives inside the child row's own listing_payload; VIN/NHTSA decode fields " +
        "are payload metadata that edits must preserve.",
    ],
  },
  {
    pipeline: "restaurantes",
    lane: "default",
    // MAX_GALLERY = 24 (RestaurantePublishMediaStrip.tsx:29); buckets 12 each; minimum =
    // hasRestauranteMinimumPublishImage (hero OR gallery OR bucket) — modeled as min 1.
    images: { kind: "counted", min: 1, max: 24 },
    logoSupported: true,
    hero: "dedicated-field",
    // RESTAURANTE_MAX_EXTERNAL_VIDEO_URLS = 8 (restauranteVideoUrls.ts:4).
    // Global Business Hub OS — pilot-lane video cap raised 4 -> 8.
    maxExternalVideos: 8,
    videoValidator: "restaurante-embeddable",
    mediaOwner: "self",
    editSurface: "category-editor",
    notes: ["Buckets (food/interior/exterior) each cap at 12 (RestaurantePublishMediaBuckets.tsx:14)."],
  },
  {
    pipeline: "comida_local",
    lane: "default",
    // Main photo required (comidaLocalValidation.ts:99-111); gallery cap tier-driven —
    // COMIDA_LOCAL_GALLERY_MAX (default tier) = 2 additional gallery images
    // (maxComidaLocalGalleryImagesForTier); the main photo is the dedicated hero field and is
    // not part of this gallery count.
    images: { kind: "counted", min: 1, max: 2 },
    logoSupported: true,
    hero: "dedicated-field",
    maxExternalVideos: 0,
    videoValidator: "none",
    mediaOwner: "self",
    editSurface: "category-editor",
    notes: [
      "The only lane whose media items are uploaded-metadata records (role/storagePath/etc.) — " +
        "closest existing shape to the shared contract.",
      "Gallery max is tier-driven; 12 documents the default tier " +
        "(COMIDA_LOCAL_DEFAULT_GALLERY_MAX), asserted against the real constant in the gate test.",
    ],
  },
  {
    pipeline: "comunidad",
    lane: "quick",
    images: { kind: "uncapped", min: 0 },
    logoSupported: true, // organizerLogoUrl
    hero: "isMain-flag",
    maxExternalVideos: 0,
    videoValidator: "none",
    mediaOwner: "self",
    editSurface: "generic-editor",
    notes: ["Shared community media model (Empleos gallery editor + organizer logo)."],
  },
  {
    pipeline: "clases",
    lane: "quick",
    images: { kind: "uncapped", min: 0 },
    logoSupported: true,
    hero: "isMain-flag",
    maxExternalVideos: 0,
    videoValidator: "none",
    mediaOwner: "self",
    editSurface: "generic-editor",
    notes: ["Shared community media model."],
  },
  {
    pipeline: "busco",
    lane: "quick",
    images: { kind: "single", required: false },
    logoSupported: false,
    hero: "none",
    maxExternalVideos: 0,
    videoValidator: "none",
    mediaOwner: "self",
    editSurface: "generic-editor",
    notes: ["Single optional image; persisted as images:[url]."],
  },
  {
    pipeline: "mascotas_y_perdidos",
    lane: "quick",
    images: { kind: "single", required: true },
    logoSupported: false,
    hero: "none",
    maxExternalVideos: 0,
    videoValidator: "none",
    mediaOwner: "self",
    editSurface: "generic-editor",
    notes: ["Single required image (publishMascotasPerdidosQuickToListings.ts:85-86)."],
  },
  {
    pipeline: "viajes",
    lane: "negocios",
    // "Up to 8" gallery (viajesNegociosDraftTypes.ts:39-40) + hero + partner logo + 1 video.
    images: { kind: "counted", min: 0, max: 8 },
    logoSupported: true,
    hero: "dedicated-field",
    maxExternalVideos: 1,
    // Package B Gate B3 — boundary contract validator (shared strict); Viajes-owned UI is NOT
    // edited by this program — the workstream consumes this config + validator at merge.
    videoValidator: "shared-https-strict",
    mediaOwner: "self",
    editSurface: "external-workstream",
    notes: ["EXTERNAL WORKSTREAM boundary: config + validator are the integration contract."],
  },
  {
    pipeline: "viajes",
    lane: "privado",
    images: { kind: "single", required: false },
    logoSupported: false,
    hero: "dedicated-field",
    maxExternalVideos: 0,
    videoValidator: "none",
    mediaOwner: "self",
    editSurface: "external-workstream",
    notes: ["Hero-only media model; no gallery/logo/video fields exist."],
  },
  {
    pipeline: "ofertas_locales",
    lane: "default",
    images: { kind: "text-only" },
    logoSupported: false,
    hero: "none",
    maxExternalVideos: 0,
    videoValidator: "none",
    mediaOwner: "self",
    editSurface: "external-workstream",
    notes: [
      "LOCKED: Ofertas flyer scanning/clipping media is owned entirely by the Ofertas " +
        "workstream — classified here only so no lane is silently unmodeled.",
    ],
  },
];

export function getLaneMediaRecords(pipeline: CanonicalCategoryKey): readonly LaneMediaRecord[] {
  return LANE_MEDIA_REGISTRY.filter((record) => record.pipeline === pipeline);
}
