import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type {
  ClasesCostType,
  ClasesMode,
  ClasesPriceFrequency,
  ComunidadCostType,
  CommunityPrimaryCta,
  CommunityScheduleRow,
} from "../types/communityQuickDraft";

export type CommunityPublishImageRef = {
  url: string;
  alt: string;
  isMain: boolean;
  /** Present for non-image attachments when known (e.g. application/pdf). */
  mimeType?: string;
};

export type ClasesQuickPublishSnapshot = {
  kind: "clases";
  title: string;
  organizer: string;
  category: string;
  categoryCustom?: string;
  classCostType: ClasesCostType;
  /** Required when classCostType === "pagada" — empty otherwise. */
  priceAmount: string;
  priceFrequency: ClasesPriceFrequency | "";
  priceNote: string;
  mode: ClasesMode;
  scheduleRows: CommunityScheduleRow[];
  description: string;
  images: CommunityPublishImageRef[];
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  primaryCta: CommunityPrimaryCta;
  venue: string;
  addressLine1: string;
  /** Public city — never replaced with NorCal. */
  publicCity: string;
  state: string;
  zip: string;
  /** Internal discovery region (always NorCal). */
  discoveryRegion: "NorCal";
};

export type ComunidadQuickPublishSnapshot = {
  kind: "comunidad";
  title: string;
  organizer: string;
  category: string;
  categoryCustom?: string;
  eventCost: ComunidadCostType;
  admissionNote: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  images: CommunityPublishImageRef[];
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  primaryCta: CommunityPrimaryCta;
  venue: string;
  addressLine1: string;
  publicCity: string;
  state: string;
  zip: string;
  discoveryRegion: "NorCal";
};

export type CommunityPublishLanePayload =
  | { lane: "quick"; data: ClasesQuickPublishSnapshot }
  | { lane: "quick"; data: ComunidadQuickPublishSnapshot };

export type CommunityListingStatus = "ready_for_publish" | "draft" | "published";

export type CommunityPublishEnvelope = {
  schemaVersion: 1;
  category: "clases" | "comunidad";
  lane: "quick";
  language: Lang;
  listingStatus: CommunityListingStatus;
  listingId: string | null;
  ownerId: string | null;
  createdAt: string | null;
  updatedAt: string;
  publishedAt: string | null;
  payload:
    | { lane: "quick"; data: ClasesQuickPublishSnapshot }
    | { lane: "quick"; data: ComunidadQuickPublishSnapshot };
  mediaReferences: {
    primaryImageUrl: string | null;
    imageUrls: string[];
    /** True when blob/local assets still need final URLs at publish time. */
    hasDraftOnlyMedia: boolean;
  };
  /**
   * Marks whether advertiser payment is needed for this listing.
   * - Comunidad: always `none` (free posting).
   * - Clases free: `none`.
   * - Clases paid: `paid_class_pending` until a paid-publishing flow exists.
   */
  payment: {
    requiresAdvertiserPayment: boolean;
    status: "none" | "paid_class_pending";
  };
};
