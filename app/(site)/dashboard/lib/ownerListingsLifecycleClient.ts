/**
 * Owner-side `public.listings` lifecycle patches (dashboard).
 * Aligned with Admin staff archive: `status = removed`, `is_published = false` (soft archive; no row delete).
 * Pause: temporary hide — `paused` + unpublished (does not clear Leonix Ad ID).
 */

export const OWNER_LISTING_SOFT_ARCHIVE_PATCH: Record<string, unknown> = {
  status: "removed",
  is_published: false,
};

export const OWNER_LISTING_PAUSE_PATCH: Record<string, unknown> = {
  status: "paused",
  is_published: false,
};

export function ownerListingResumeFromPausePatch(): Record<string, unknown> {
  return { status: "active", is_published: true };
}
