/**
 * Servicios listing lifecycle — stored in `servicios_public_listings.listing_status`.
 * Application draft states stay browser-local until publish; DB rows default to `published`.
 */
export const SERVICIOS_LISTING_STATUSES = [
  "draft",
  "preview_ready",
  "publish_ready",
  "published",
  "paused_unpublished",
  /** Awaiting Leonix review before public discovery */
  "pending_review",
  "rejected",
  "suspended",
] as const;

export type ServiciosListingLifecycleStatus = (typeof SERVICIOS_LISTING_STATUSES)[number];

export const SERVICIOS_LISTING_STATUS_PUBLISHED: ServiciosListingLifecycleStatus = "published";

export const SERVICIOS_LISTING_STATUS_PENDING_REVIEW: ServiciosListingLifecycleStatus = "pending_review";

export function isServiciosListingLifecycleStatus(v: string | null | undefined): v is ServiciosListingLifecycleStatus {
  return typeof v === "string" && (SERVICIOS_LISTING_STATUSES as readonly string[]).includes(v);
}
