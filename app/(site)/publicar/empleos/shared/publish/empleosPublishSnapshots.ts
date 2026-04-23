import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { ExperienceSlug, JobModalitySlug } from "@/app/clasificados/empleos/data/empleosJobTypes";

import type { EmpleosLane, EmpleosListingLifecycleStatus } from "./empleosListingLifecycle";
import type { EmpleosPaymentHandoffPlaceholder } from "./empleosPaymentHandoff";

export type EmpleosQuickScheduleRowSnapshot = { day: string; shift: string };

/** Serializable image ref for admin + future storage (no blob URLs). */
export type EmpleosPublishImageRef = {
  url: string;
  alt: string;
  isMain: boolean;
};

export type EmpleosQuickPublishSnapshot = {
  title: string;
  businessName: string;
  city: string;
  state: string;
  /** Role family slug aligned with results filter taxonomy. */
  categorySlug: string;
  /** Custom label when `categorySlug === "otro"`. */
  categoryCustom?: string;
  experienceLevel: ExperienceSlug;
  workModality?: JobModalitySlug;
  jobType: string;
  schedule: string;
  /** Structured schedule rows (optional on legacy snapshots). */
  scheduleRows?: EmpleosQuickScheduleRowSnapshot[];
  pay: string;
  description: string;
  benefits: string[];
  /** Optional screener prompts (max 5 enforced at publish). */
  screenerQuestions: string[];
  images: EmpleosPublishImageRef[];
  logoUrl: string | null;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  primaryCta: "phone" | "whatsapp" | "email";
  addressLine1: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  /** External video URL only; draft file handles omitted. */
  videoUrl: string | null;
};

export type EmpleosPremiumPublishSnapshot = {
  title: string;
  companyName: string;
  city: string;
  state: string;
  categorySlug: string;
  categoryCustom?: string;
  experienceLevel: ExperienceSlug;
  workModality: JobModalitySlug;
  scheduleLabel: string;
  salaryPrimary: string;
  salarySecondary: string;
  jobType: string;
  featured: boolean;
  premium: boolean;
  screenerQuestions: string[];
  gallery: EmpleosPublishImageRef[];
  logoUrl: string | null;
  applyLabel: string;
  websiteUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  primaryCta: "apply" | "phone" | "whatsapp" | "email" | "website";
  introduction: string;
  responsibilities: string[];
  requirements: string[];
  offers: string[];
  companyOverview: string;
  employerAddress: string;
  videoUrl: string | null;
};

export type EmpleosFeriaPublishSnapshot = {
  title: string;
  flyerImageUrl: string | null;
  flyerAlt: string;
  dateLine: string;
  timeLine: string;
  venue: string;
  city: string;
  state: string;
  organizer: string;
  organizerUrl: string;
  modality: string;
  freeEntry: boolean;
  bilingual: boolean;
  industryFocus: string;
  detailsBullets: string[];
  secondaryDetails: string[];
  ctaIntro: string;
  contactLink: string;
  contactPhone: string;
  contactEmail: string;
  ctaLabel: string;
};

export type EmpleosPublishLanePayload =
  | { lane: "quick"; data: EmpleosQuickPublishSnapshot }
  | { lane: "premium"; data: EmpleosPremiumPublishSnapshot }
  | { lane: "feria"; data: EmpleosFeriaPublishSnapshot };

/**
 * Publish-ready envelope: distinct from session draft (may include derived fields, stripped blobs).
 * Future persisted row maps from this + server ids/timestamps.
 */
export type EmpleosPublishEnvelope = {
  schemaVersion: 1;
  category: "empleos";
  lane: EmpleosLane;
  language: Lang;
  listingStatus: EmpleosListingLifecycleStatus;
  /** Set when a row exists in DB */
  listingId: string | null;
  ownerId: string | null;
  createdAt: string | null;
  updatedAt: string;
  publishedAt: string | null;
  payload: EmpleosPublishLanePayload;
  /** Admin moderation / ops (future) */
  moderationNote: string | null;
  mediaReferences: {
    primaryImageUrl: string | null;
    imageUrls: string[];
    /** True when blob/local assets still need final URLs at publish time. */
    hasDraftOnlyVideo: boolean;
  };
  payment: EmpleosPaymentHandoffPlaceholder;
};
