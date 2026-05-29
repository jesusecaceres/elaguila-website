/**
 * Leonix premium brand tokens — aligned with Coming Soon V2.
 * Safe to import from header/home surfaces; CSS vars remain backward-compatible.
 */
export const LEONIX_PREMIUM = {
  page: "#F5F0E6",
  section: "#FAF6EE",
  card: "#FFFDF7",
  cardAlt: "#FBF7EF",
  burgundy: "#7A1E2C",
  burgundyHover: "#5e1721",
  gold: "#C9A84A",
  goldMuted: "#8A6B1F",
  border: "#D6C7AD",
  text: "#1F241C",
  textSecondary: "#3D3428",
  greenDeep: "#2A4536",
  greenMuted: "#556B3E",
  ivory: "#F8F4EA",
} as const;

export const LEONIX_MAGAZINE_LAUNCH_COVER = "/magazine/leonix-media-launch-es.png";

/** Primary CTA — burgundy pill (Coming Soon V2 pattern, slightly less rounded for live site) */
export const leonixPrimaryCtaClass =
  "inline-flex min-h-[2.75rem] items-center justify-center rounded-md bg-[#7A1E2C] px-6 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A84A]";

/** Secondary CTA — gold border */
export const leonixSecondaryCtaClass =
  "inline-flex min-h-[2.75rem] items-center justify-center rounded-md border-2 border-[#C9A84A] bg-[#FFFDF7] px-6 py-2.5 text-sm font-semibold text-[#1F241C] shadow-sm transition hover:border-[#b89742] hover:bg-[#FBF7EF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1E2C]";

export const leonixSectionEyebrowClass =
  "text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E] sm:text-xs";

export const leonixSectionTitleClass =
  "font-serif text-2xl font-bold leading-snug tracking-tight text-[#2A4536] sm:text-[1.75rem] lg:text-3xl";

export const leonixBodyClass = "text-base leading-relaxed text-[#3D3428] sm:text-[1.0625rem]";
