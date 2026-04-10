/** Leonix Rentas landing — premium warm marketplace (category-owned presentation). */

/** Page base: warm ivory + subtle grain (no photo noise). */
export const rentasLandingPaperBgClass = [
  "bg-[#F4EDE3]",
  "[background-image:radial-gradient(rgba(91,124,153,0.055)_1px,transparent_1px),radial-gradient(rgba(196,92,38,0.035)_1px,transparent_1px)]",
  "[background-size:24px_24px,32px_32px]",
  "[background-position:0_0,12px_12px]",
].join(" ");

/** Hero scenic — apartment / neighborhood mood (faded, non-competing). */
export const rentasLandingHeroScenicImage =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1920&q=65&auto=format&fit=crop";

/** Immersive hero band behind intro + search cluster. */
export const rentasLandingHeroBandClass = [
  "pointer-events-none absolute inset-x-0 top-0 z-0 w-full overflow-hidden",
  "min-h-[220px] sm:min-h-[min(38vh,420px)] lg:min-h-[min(46vh,520px)]",
  "rounded-b-[2rem] border-b border-[#C4B8A8]/30",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
].join(" ");

export const rentasLandingHeroPhotoLayerClass = [
  "absolute inset-0 bg-cover bg-[center_42%]",
  "opacity-[0.13] mix-blend-multiply",
].join(" ");

/** Warm mist + soft blue support — keeps copy readable. */
export const rentasLandingHeroGradientClass = [
  "absolute inset-0",
  "bg-gradient-to-b from-[#D8E4F0]/82 via-[#F0E8DC]/92 to-[#F4EDE3]",
].join(" ");

export const rentasLandingHeroVignetteClass = [
  "absolute inset-0 bg-gradient-to-t from-[#F4EDE3] via-transparent to-[#E8EEF4]/35",
].join(" ");

/** Frosted panel for title + CTAs inside hero. */
export const rentasLandingHeroPanelClass = [
  "rounded-[1.5rem] border border-white/75",
  "bg-gradient-to-br from-white/92 via-[#FFFCF7]/88 to-[#F5EDE3]/75",
  "shadow-[0_24px_64px_-32px_rgba(30,24,16,0.28),inset_0_1px_0_rgba(255,255,255,0.85)]",
  "backdrop-blur-md backdrop-saturate-125",
  "p-5 sm:p-8",
].join(" ");

/** Primary CTA — burnt orange (sparingly). */
export const rentasCtaPrimaryClass =
  "rounded-full bg-[#C45C26] px-5 py-2.5 text-center text-sm font-semibold text-[#FFFBF7] shadow-[0_10px_28px_-10px_rgba(196,92,38,0.55)] transition hover:bg-[#A84E20] hover:shadow-[0_12px_32px_-10px_rgba(196,92,38,0.45)] active:scale-[0.98]";

/** Secondary CTA — soft panel + slate support tone. */
export const rentasCtaSecondaryClass =
  "rounded-full border border-[#5B7C99]/32 bg-[#EEF3F7] px-5 py-2.5 text-center text-sm font-semibold text-[#2C3E4D] shadow-sm transition hover:border-[#5B7C99]/48 hover:bg-white";

/** Muted support link (slate blue). */
export const rentasLinkSupportClass =
  "font-semibold text-[#4A6680] underline decoration-[#5B7C99]/40 underline-offset-4 hover:text-[#3D5569]";

/** Accent gold for price emphasis (not dominant). */
export const rentasAccentGoldClass = "text-[#B8893C]";

/** Card shell — soft off-white, premium lift. */
export const rentasCardSurfaceClass =
  "rounded-2xl border border-[#E2D5C4]/95 bg-[#FFFCF7] shadow-[0_14px_44px_-20px_rgba(44,36,28,0.2)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_52px_-22px_rgba(44,36,28,0.24)]";

/** Search module — elevated ivory pill (visual anchor). */
export const rentasSearchShellClass = [
  "rounded-[1.4rem] border border-white/90",
  "bg-gradient-to-b from-[#FFFCF7] to-[#FAF6EF]/98",
  "p-3 shadow-[0_20px_56px_-28px_rgba(44,36,28,0.32),0_1px_0_rgba(255,255,255,0.95)_inset]",
  "ring-1 ring-[#C4B8A8]/28 backdrop-blur-sm sm:p-5",
].join(" ");

/** Search primary button — strong burnt orange, obvious action. */
export const rentasSearchSubmitClass = [
  "inline-flex w-full items-center justify-center gap-2 rounded-full",
  "bg-[#C45C26] px-7 py-3 text-sm font-bold tracking-wide text-[#FFFBF7]",
  "shadow-[0_12px_32px_-12px_rgba(196,92,38,0.65)] transition",
  "hover:bg-[#A84E20] hover:shadow-[0_14px_36px_-12px_rgba(196,92,38,0.55)]",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C45C26]/50",
  "lg:w-auto lg:min-w-[10rem] lg:shrink-0 lg:py-3",
].join(" ");

/** Quick explore chip — inactive. */
export const rentasChipInactiveClass = [
  "inline-flex items-center gap-2 rounded-full border border-[#C5D0DC]/85",
  "bg-gradient-to-b from-[#FBFCFE] to-[#F4F7FA]",
  "px-3.5 py-2 text-sm font-semibold text-[#4A5568]",
  "shadow-[0_2px_8px_-4px_rgba(44,36,28,0.12)] transition",
  "hover:-translate-y-0.5 hover:border-[#5B7C99]/38 hover:shadow-md hover:text-[#2C3E4D]",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C45C26]/35",
  "sm:px-4",
].join(" ");

export const rentasChipHoverClass = "";

/** Section heading — editorial rail. */
export const rentasSectionHeadingClass =
  "border-l-[4px] border-[#C45C26]/55 pl-4 font-serif text-2xl font-semibold tracking-tight text-[#1E1810] sm:text-[1.85rem]";

export const rentasSectionHeadingMutedClass =
  "border-l-[4px] border-[#5B7C99]/45 pl-4 font-serif text-2xl font-semibold tracking-tight text-[#1E1810] sm:text-[1.85rem]";

/** Trust / reassurance band. */
export const rentasTrustBandClass = [
  "mt-16 rounded-[1.35rem] border border-[#C9D4E0]/45",
  "bg-gradient-to-br from-[#E8EEF4]/55 via-[#FFFCF7]/95 to-[#F5EDE3]/90",
  "px-4 py-10 shadow-[0_16px_48px_-28px_rgba(44,36,28,0.18)] sm:px-10",
  "ring-1 ring-white/60",
].join(" ");
