/** Leonix Rentas landing — premium warm marketplace (Phase 1.5 presentation). */

/** Page base: warm ivory + subtle grain (no photo noise). */
export const rentasLandingPaperBgClass = [
  "bg-[#F6F0E8]",
  "[background-image:radial-gradient(rgba(91,124,153,0.06)_1px,transparent_1px),radial-gradient(rgba(196,92,38,0.04)_1px,transparent_1px)]",
  "[background-size:24px_24px,32px_32px]",
  "[background-position:0_0,12px_12px]",
].join(" ");

/** Atmospheric wash in the hero band (city / home mood — faded, non-competing). */
export const rentasLandingHeroAtmosphereClass = [
  "relative overflow-hidden rounded-b-[2rem] border-b border-[#C4B8A8]/35",
  "bg-gradient-to-b from-[#E8EEF4]/90 via-[#F6F0E8]/95 to-transparent",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
].join(" ");

/** Optional scenic wash — very low contrast so listings stay heroes. */
export const rentasLandingHeroScenicLayerClass = [
  "pointer-events-none absolute inset-0 -z-0",
  "bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=60&auto=format&fit=crop')] bg-cover bg-[center_30%]",
  "opacity-[0.11] mix-blend-multiply",
].join(" ");

/** Primary CTA — burnt orange (sparingly). */
export const rentasCtaPrimaryClass =
  "rounded-full bg-[#C45C26] px-5 py-2.5 text-center text-sm font-semibold text-[#FFFBF7] shadow-[0_8px_24px_-8px_rgba(196,92,38,0.55)] transition hover:bg-[#A84E20] hover:shadow-[0_10px_28px_-8px_rgba(196,92,38,0.5)]";

/** Secondary CTA — soft panel + slate support tone. */
export const rentasCtaSecondaryClass =
  "rounded-full border border-[#5B7C99]/35 bg-[#F0F4F8] px-5 py-2.5 text-center text-sm font-semibold text-[#2C3E4D] shadow-sm transition hover:border-[#5B7C99]/50 hover:bg-white";

/** Muted support link (slate blue). */
export const rentasLinkSupportClass =
  "font-semibold text-[#4A6680] underline decoration-[#5B7C99]/40 underline-offset-4 hover:text-[#3D5569]";

/** Accent gold for price emphasis (not dominant). */
export const rentasAccentGoldClass = "text-[#B8893C]";

/** Card shell — soft off-white, premium lift. */
export const rentasCardSurfaceClass =
  "rounded-2xl border border-[#E4D9C8]/90 bg-[#FFFCF7] shadow-[0_12px_40px_-18px_rgba(44,36,28,0.18)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-20px_rgba(44,36,28,0.22)]";

/** Search module — elevated ivory pill. */
export const rentasSearchShellClass =
  "rounded-[1.35rem] border border-white/80 bg-[#FFFCF7]/95 p-3 shadow-[0_16px_48px_-24px_rgba(44,36,28,0.28),0_1px_0_rgba(255,255,255,0.9)_inset] ring-1 ring-[#C4B8A8]/25 backdrop-blur-sm sm:p-4";

/** Chip inactive. */
export const rentasChipInactiveClass =
  "inline-flex items-center gap-2 rounded-full border border-[#C9D4E0]/80 bg-[#FAFBFD] px-3.5 py-2 text-sm font-semibold text-[#4A5568] shadow-sm transition hover:border-[#5B7C99]/35 hover:bg-white sm:px-4";

/** Chip hover / emphasis. */
export const rentasChipHoverClass = "hover:ring-1 hover:ring-[#C45C26]/20";
