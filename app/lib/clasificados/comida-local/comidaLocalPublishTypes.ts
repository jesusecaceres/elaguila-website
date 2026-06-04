import type { ComidaLocalDraft } from "./comidaLocalTypes";

export const COMIDA_LOCAL_PUBLISH_CATEGORY = "comida-local" as const;

export const COMIDA_LOCAL_PAYMENT_STATUS_L5B = "not_required_for_l5b" as const;

export type ComidaLocalPackageTierDb = "basic" | "plus";

export type ComidaLocalListingStatusDb =
  | "draft"
  | "published"
  | "paused"
  | "suspended"
  | "pending_payment";

export type ComidaLocalPublishRequestBody = {
  draft: unknown;
  draftListingId?: string;
  packageTier?: string;
  lang?: "es" | "en";
  /** Ignored — owner resolved server-side from Bearer token. */
  owner_user_id?: never;
};

export type ComidaLocalPublishSuccessResponse = {
  ok: true;
  persisted: true;
  id: string;
  slug: string;
  leonix_ad_id: string;
  status: ComidaLocalListingStatusDb;
  package_tier: ComidaLocalPackageTierDb;
  payment_status: string;
  category: typeof COMIDA_LOCAL_PUBLISH_CATEGORY;
  publicPath: string;
  draft_listing_id: string;
  owner_user_id: string | null;
};

export type ComidaLocalNormalizedPublishDraft = {
  draft: ComidaLocalDraft;
  draftListingId: string;
  packageTier: ComidaLocalPackageTierDb;
  lang: "es" | "en";
};
