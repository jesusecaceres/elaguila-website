/**
 * NON-AUTHORITATIVE / DEPRECATED (legacy free-vs-pro naming; imported by nothing).
 *
 * Autos Privado is a flat-priced product (autos_privado_30d) with NO free/pro or Quick/Full split.
 * These values are NOT enforced anywhere and MUST NOT be read as the Autos Privado media rule. The
 * real rule (application -> preview -> publish) is: photos uncapped, external https video URLs up to
 * AUTOS_MAX_EXTERNAL_VIDEO_URLS, no local video / data: / blob: transport. Source of truth:
 * app/lib/media/listingMediaConfigs.ts (LANE_MEDIA_REGISTRY autos_privado) + autosListingPayloadPersistence.ts.
 * Pinned by scripts/verify-launch-media-rules-autos-privado-rentas-01.ts.
 */

export const AUTOS_PRO_PRIVATE_MAX_PHOTOS = 12;
export const AUTOS_PRO_PRIVATE_VIDEO_ALLOWED = true;
export const AUTOS_PRO_PRIVATE_BOOST_ELIGIBLE = true;
