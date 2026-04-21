import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { EmpleosLane } from "@/app/publicar/empleos/shared/publish/empleosListingLifecycle";
import type { EmpleosJobRecord } from "../../data/empleosJobTypes";

/**
 * Staged public lifecycle (demo) — distinct from DB `listings.status` strings.
 */
export type EmpleosStagedPublicStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "paused"
  | "archived"
  | "rejected";

export type EmpleosStagedAnalytics = {
  views: number;
  clicks: number;
  contacts: number;
  saves: number;
};

/**
 * Single canonical Empleos listing for staged demo: publish → browse → detail → dashboard → admin.
 */
export type EmpleosCanonicalListing = {
  listingId: string;
  ownerId: string;
  category: "empleos";
  lane: EmpleosLane;
  slug: string;
  language: Lang;
  status: EmpleosStagedPublicStatus;
  title: string;
  company: string;
  city: string;
  state: string;
  postalCode?: string;
  salaryLabel: string;
  salaryMin: number;
  salaryMax: number;
  summary: string;
  description: string;
  requirements: string[];
  benefits: string[];
  benefitChips: string[];
  jobRecord: EmpleosJobRecord;
  analytics: EmpleosStagedAnalytics;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  /** Snapshot for admin / audit (no blob URLs). */
  envelopeSchemaVersion: 1;
};

/** Pathnames only — append `lang` with `appendLangToPath` at the edge. */
export function empleosStagedListingUrls(listingId: string, slug: string) {
  return {
    listaUrl: `/clasificados/empleos/resultados`,
    anuncioUrl: `/clasificados/empleos/${slug}`,
    dashboardUrl: `/dashboard/empleos/${listingId}`,
    adminUrl: `/admin/workspace/clasificados/empleos`,
    publishHubUrl: `/clasificados/publicar/empleos`,
  };
}
