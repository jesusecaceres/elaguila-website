export const IGLESIAS_EDITORIAL_HERO = {
  src: "/iglesias/editorial/hero-community.jpg",
  altEs: "Fotografía editorial de comunidad y fe. No representa una iglesia listada en Leonix.",
  altEn: "Editorial photograph of community and faith. It does not represent a listed Leonix church.",
} as const;

export const IGLESIAS_NEUTRAL_FALLBACK = {
  src: "/iglesias/fallbacks/community-neutral.jpg",
  alt: "",
} as const;

export const IGLESIAS_EDITORIAL_COLLAGE = [
  { src: "/iglesias/editorial/need-prayer.jpg", key: "prayer" },
  { src: "/iglesias/editorial/need-families.jpg", key: "families" },
  { src: "/iglesias/editorial/need-community.jpg", key: "community" },
  { src: "/iglesias/editorial/need-spanish.jpg", key: "spanish" },
] as const;

/**
 * Visible Find-by-Need tiles only. Each assigned src is unique.
 * Needs without a semantically honest unique local asset return null
 * and must not reuse another need's photograph.
 */
export const IGLESIAS_NEED_TILE_IMAGES: Record<string, string> = {
  PRAYER: "/iglesias/editorial/need-prayer.jpg",
  FAMILIES: "/iglesias/editorial/need-families.jpg",
  CHILDREN: "/iglesias/editorial/need-children.jpg",
  YOUTH: "/iglesias/editorial/need-youth.jpg",
  FOOD_SUPPORT: "/iglesias/editorial/need-community.jpg",
  COMMUNITY_SUPPORT: "/iglesias/editorial/hero-community.jpg",
  BIBLE_STUDY: "/iglesias/editorial/need-study.jpg",
  BILINGUAL_SERVICE: "/iglesias/editorial/need-spanish.jpg",
};

export const IGLESIAS_NEED_TILES_WITHOUT_UNIQUE_PHOTO = [
  "MARRIAGE",
  "GRIEF",
  "SPANISH_SERVICE",
  "RECOVERY",
] as const;

export function iglesiasVisibleNeedImageSrc(needKey: string): string | null {
  const src = IGLESIAS_NEED_TILE_IMAGES[needKey];
  return src || null;
}

export function churchImageAlt(name: string, hasRealImage: boolean, lang: "es" | "en"): string {
  if (!hasRealImage) return "";
  return lang === "en" ? `${name}` : name;
}
