/**
 * Leonix Media — official brand social accounts (presentation/config only).
 *
 * These four channels belong to Leonix Media itself, not to any one executive, so they
 * are fixed here rather than duplicated into every Executive Hub record. A specific
 * executive profile can still override any of these by setting its own `socials` entry
 * for the same platform id (see `DigitalContactSocialCards`) — this config is only the
 * default/fallback, never a hard override.
 */
export const LEONIX_OFFICIAL_SOCIAL_LINKS: Record<"facebook" | "instagram" | "tiktok" | "youtube", string> = {
  facebook: "https://www.facebook.com/leonixmedia",
  instagram: "https://www.instagram.com/leonix_media",
  tiktok: "https://www.tiktok.com/@leonixmedia",
  youtube: "https://www.youtube.com/@LEONIX_media",
};
