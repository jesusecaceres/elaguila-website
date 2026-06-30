import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { DayHoursRow } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";

import type {
  ClasesCostType,
  ClasesClassLinks,
  ClasesMode,
  ClasesPriceFrequency,
  ComunidadCostType,
  CommunityPrimaryCta,
  CommunityPublishConfirmations,
  CommunitySocialLinks,
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
  weeklySchedule: DayHoursRow[];
  description: string;
  images: CommunityPublishImageRef[];
  phone: string;
  whatsapp: string;
  smsPhone: string;
  email: string;
  website: string;
  socialLinks: CommunitySocialLinks;
  primaryCta: CommunityPrimaryCta;
  venue: string;
  addressLine1: string;
  addressLine2: string;
  /** Public city — never replaced with NorCal. */
  publicCity: string;
  state: string;
  country: string;
  zip: string;
  /** Internal discovery region (always NorCal). */
  discoveryRegion: "NorCal";
  publishConfirmations: CommunityPublishConfirmations;
  audience: string;
  registrationRequired: string;
  bringNote: string;
  skillLevel: string;
  /** Optional class-specific useful links. */
  classLinks: ClasesClassLinks;
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
  eventEndDate: string;
  /** Optional single session window (HH:MM) when weekly rows are unused. */
  eventSessionStart: string;
  eventSessionEnd: string;
  weeklySchedule: DayHoursRow[];
  description: string;
  images: CommunityPublishImageRef[];
  phone: string;
  whatsapp: string;
  smsPhone: string;
  email: string;
  website: string;
  socialLinks: CommunitySocialLinks;
  primaryCta: CommunityPrimaryCta;
  venue: string;
  addressLine1: string;
  publicCity: string;
  state: string;
  zip: string;
  discoveryRegion: "NorCal";
  publishConfirmations: CommunityPublishConfirmations;
  audience: string;
  registrationRequired: string;
  bringNote: string;
  accessibilityKeys: string[];
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
