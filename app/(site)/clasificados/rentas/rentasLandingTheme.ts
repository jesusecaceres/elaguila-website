/** Leonix Rentas landing — premium warm marketplace (category-owned presentation). */

/** Page base: warm ivory + subtle grain (no photo noise). */
export const rentasLandingPaperBgClass = [
  "bg-[#F4EDE3]",
  "[background-image:radial-gradient(rgba(91,124,153,0.055)_1px,transparent_1px),radial-gradient(rgba(196,92,38,0.035)_1px,transparent_1px)]",
  "[background-size:24px_24px,32px_32px]",
  "[background-position:0_0,12px_12px]",
].join(" ");

/** Hero scenic — bright rental interior / lifestyle (used in `RentasLandingHero` + results shell). */
export const rentasLandingHeroScenicImage =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1920&q=75";

/** Optimized src for `next/image` in the landing hero (stronger presence). */
export const rentasLandingHeroImageSrc =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=2400&q=82";

/** Scenic hero card — En Venta–style containment, Rentas-owned atmosphere. */
export const rentasLandingHeroSectionClass = [
  "relative isolate min-h-[min(32vh,320px)] w-full min-w-0 overflow-hidden",
  "rounded-xl border border-[#D6C7AD]/45 sm:rounded-2xl",
  "shadow-[0_16px_48px_-24px_rgba(47,74,101,0.28)] ring-1 ring-white/35",
  "max-lg:min-h-[min(30vh,280px)] max-sm:min-h-[240px]",
].join(" ");

/** Immersive hero band — legacy absolute strip (results shell only). */
export const rentasLandingHeroBandClass = [
  "pointer-events-none absolute inset-x-0 top-0 z-0 w-full overflow-hidden",
  "min-h-[140px] sm:min-h-[min(24vh,220px)] lg:min-h-[min(28vh,260px)]",
  "rounded-b-[2rem] sm:rounded-b-[2.25rem] border-b border-[#C4B8A8]/28",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
].join(" ");

export const rentasLandingHeroPhotoLayerClass = [
  "absolute inset-0 bg-cover bg-[center_40%]",
  "opacity-[0.22] mix-blend-multiply",
].join(" ");

/** Warm mist + depth — rental / neighborhood comfort without noise. */
export const rentasLandingHeroGradientClass = [
  "absolute inset-0",
  "bg-gradient-to-b from-[#CED9E8]/88 via-[#EDE6D9]/94 to-[#F4EDE3]",
].join(" ");

export const rentasLandingHeroVignetteClass = [
  "absolute inset-0",
  "bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,rgba(255,252,247,0.55)_0%,transparent_55%),linear-gradient(to_top,rgba(244,237,227,1)_0%,rgba(244,237,227,0.4)_42%,rgba(216,228,240,0.25)_100%)]",
].join(" ");

/** Main content column — premium marketplace width. */
export const rentasLandingContainerClass =
  "mx-auto w-full max-w-[min(100%,1460px)] px-4 sm:px-6 lg:px-10 xl:px-12";

/** Frosted panel for title + CTAs — sits on scenic hero (readable stack). */
export const rentasLandingHeroPanelClass = [
  "rounded-[1.35rem] border border-white/90 sm:rounded-[1.5rem]",
  "bg-gradient-to-br from-white/96 via-[#FFFCF7]/92 to-[#F8F0E6]/85",
  "shadow-[0_24px_64px_-34px_rgba(30,24,16,0.28),inset_0_1px_0_rgba(255,255,255,0.92)]",
  "backdrop-blur-md backdrop-saturate-125",
  "p-4 sm:p-7 md:p-8 lg:p-9",
].join(" ");

/** Listing detail — conversion / trust cluster (matches landing language). */
export const rentasDetailConversionPanelClass = [
  "rounded-[1.5rem] border border-white/80",
  "bg-gradient-to-br from-white/94 via-[#FFFCF7]/90 to-[#F3EBE0]/78",
  "shadow-[0_20px_56px_-32px_rgba(30,24,16,0.28),inset_0_1px_0_rgba(255,255,255,0.88)]",
  "backdrop-blur-md backdrop-saturate-125",
  "p-5 sm:p-6",
].join(" ");

/** Editorial discovery row — softer than plain stack. */
export const rentasDiscoveryBandClass = [
  "rounded-[1.35rem] border border-[#E6D9CA]/55",
  "bg-gradient-to-b from-[#FFFCF7]/75 to-[#FAF6EF]/45",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
  "px-4 py-8 sm:px-7 sm:py-10 lg:px-9",
].join(" ");

/** Primary CTA — Leonix burgundy rectangle. */
export const rentasCtaPrimaryClass =
  "inline-flex min-h-[2.625rem] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45 sm:px-5";

/** Secondary CTA — cream panel + gold border. */
export const rentasCtaSecondaryClass =
  "inline-flex min-h-[2.625rem] items-center justify-center rounded-lg border border-[#C9A84A]/55 bg-[#FFFDF7] px-4 text-sm font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/35 sm:px-5";

/** Muted support link (slate blue). */
export const rentasLinkSupportClass =
  "font-semibold text-[#4A6680] underline decoration-[#5B7C99]/40 underline-offset-4 hover:text-[#3D5569]";

/** Section header secondary action — compact Leonix chip-link. */
export const rentasSectionHeaderActionClass =
  "inline-flex h-[30px] items-center rounded-md border border-[#C9A84A]/45 bg-[#FBF7EF] px-2.5 text-xs font-semibold text-[#3D3428] transition hover:border-[#C9A84A]/70 hover:bg-[#FFFDF7]";

/** Accent gold for price emphasis (not dominant). */
export const rentasAccentGoldClass = "text-[#B8893C]";

/** Card shell — soft off-white, premium lift. */
export const rentasCardSurfaceClass =
  "rounded-2xl border border-[#E2D5C4]/95 bg-[#FFFCF7] shadow-[0_16px_48px_-22px_rgba(44,36,28,0.18)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_56px_-24px_rgba(44,36,28,0.22)]";

/** City / ZIP intent — visually primary, maps to `city` or `zip` on results. */
export const rentasSearchLocationPanelClass = [
  "rounded-[1.2rem] border border-[#5B7C99]/22",
  "bg-gradient-to-br from-[#F3F6FA]/98 via-[#FFFCF7]/96 to-[#FAF6EF]/92",
  "p-3.5 sm:p-4",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_10px_28px_-22px_rgba(44,36,28,0.2)]",
  "ring-1 ring-[#C45C26]/12",
].join(" ");

/** Search module — elevated ivory pill (primary on-page action). */
export const rentasSearchShellClass = [
  "rounded-[1.45rem] border border-white/95",
  "bg-gradient-to-b from-[#FFFCF7] to-[#FAF6EF]/98",
  "p-3 shadow-[0_22px_60px_-26px_rgba(44,36,28,0.34),0_1px_0_rgba(255,255,255,0.95)_inset]",
  "ring-2 ring-[#C45C26]/14 ring-offset-0 ring-offset-transparent",
  "backdrop-blur-sm sm:p-5 xl:ring-offset-2 xl:ring-offset-[#F4EDE3]/90",
].join(" ");

/** Search primary button — Leonix burgundy rectangle. */
export const rentasSearchSubmitClass = [
  "inline-flex w-full min-h-[2.625rem] shrink-0 items-center justify-center gap-2 rounded-lg",
  "bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45",
  "xl:w-auto xl:min-w-[8rem]",
].join(" ");

/** Quick explore — compact Leonix chip (single row). */
export const rentasChipPrimaryBrowseClass =
  "inline-flex h-[30px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-md border border-[#C9A84A]/45 bg-[#FBF7EF] px-2.5 text-[11px] font-semibold leading-none text-[#3D3428] transition hover:border-[#C9A84A]/70 hover:bg-[#FFFDF7] sm:text-xs";

/** @deprecated alias — same compact chip styling */
export const rentasChipSecondaryBrowseClass = rentasChipPrimaryBrowseClass;

/** @deprecated Use rentasChipPrimaryBrowseClass or rentasChipSecondaryBrowseClass */
export const rentasChipInactiveClass = rentasChipPrimaryBrowseClass;

export const rentasChipHoverClass = "";

/** Panel wrapping quick filter chips — minimal inline row. */
export const rentasQuickExplorePanelClass = "mt-3 min-w-0";

/** Section heading — editorial rail. */
export const rentasSectionHeadingClass =
  "border-l-[4px] border-[#C45C26]/55 pl-4 font-serif text-2xl font-semibold tracking-tight text-[#1E1810] sm:text-[1.85rem]";

export const rentasSectionHeadingMutedClass =
  "border-l-[4px] border-[#5B7C99]/45 pl-4 font-serif text-2xl font-semibold tracking-tight text-[#1E1810] sm:text-[1.85rem]";

/** Results page — unified filter / search stack (matches landing warmth). */
export const rentasResultsFilterCardClass = [
  "rounded-[1.45rem] border border-[#E4D9C8]/88",
  "bg-gradient-to-b from-[#FFFCF7]/98 to-[#F4EDE3]/55",
  "p-4 shadow-[0_24px_64px_-34px_rgba(44,36,28,0.22)] sm:p-6",
  "ring-1 ring-white/75",
].join(" ");

/** Results page — category-owned toolbar chrome (sort / view). */
export const rentasResultsToolbarPanelClass = [
  "rounded-[1.25rem] border border-[#D4C4A8]/55",
  "bg-gradient-to-b from-[#FFFCF7]/98 to-[#FAF6EF]/90",
  "px-4 py-4 shadow-[0_12px_36px_-22px_rgba(44,36,28,0.18)] sm:px-5 sm:py-4",
  "ring-1 ring-white/70",
].join(" ");

/** Featured / promoted result card lift (business visibility without hiding private). */
export const rentasResultCardPromotedClass =
  "ring-2 ring-[#D4A84B]/50 shadow-[0_22px_52px_-26px_rgba(180,130,40,0.28)]";

/** Trust / reassurance band. */
export const rentasTrustBandClass = [
  "mt-16 rounded-[1.35rem] border border-[#C9D4E0]/45",
  "bg-gradient-to-br from-[#E8EEF4]/55 via-[#FFFCF7]/95 to-[#F5EDE3]/90",
  "px-4 py-10 shadow-[0_16px_48px_-28px_rgba(44,36,28,0.18)] sm:px-10",
  "ring-1 ring-white/60",
].join(" ");
