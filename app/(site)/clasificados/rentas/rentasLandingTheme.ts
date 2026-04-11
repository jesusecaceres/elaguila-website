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
  "relative isolate min-h-[min(52vh,620px)] w-full min-w-0 overflow-hidden",
  "rounded-[1.65rem] border border-white/55 sm:rounded-[2rem]",
  "shadow-[0_28px_90px_-36px_rgba(47,74,101,0.42)] ring-1 ring-white/35",
  "max-lg:min-h-[min(48vh,520px)] max-sm:min-h-[440px]",
].join(" ");

/** Immersive hero band — legacy absolute strip (results shell only). */
export const rentasLandingHeroBandClass = [
  "pointer-events-none absolute inset-x-0 top-0 z-0 w-full overflow-hidden",
  "min-h-[200px] sm:min-h-[min(36vh,400px)] lg:min-h-[min(50vh,560px)]",
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

/** Primary CTA — burnt orange (sparingly). */
export const rentasCtaPrimaryClass =
  "min-h-[44px] rounded-full bg-[#C45C26] px-6 py-2.5 text-center text-sm font-semibold text-[#FFFBF7] shadow-[0_12px_32px_-12px_rgba(196,92,38,0.55)] transition hover:bg-[#A84E20] hover:shadow-[0_14px_36px_-12px_rgba(196,92,38,0.48)] active:scale-[0.98] sm:px-7";

/** Secondary CTA — soft panel + slate support tone. */
export const rentasCtaSecondaryClass =
  "min-h-[44px] rounded-full border-2 border-[#5B7C99]/38 bg-[#EEF3F7] px-5 py-2.5 text-center text-sm font-semibold text-[#2C3E4D] shadow-sm transition hover:border-[#5B7C99]/55 hover:bg-white hover:shadow-md active:scale-[0.98] sm:px-6";

/** Muted support link (slate blue). */
export const rentasLinkSupportClass =
  "font-semibold text-[#4A6680] underline decoration-[#5B7C99]/40 underline-offset-4 hover:text-[#3D5569]";

/** Section header secondary action — obvious tap/click target. */
export const rentasSectionHeaderActionClass =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#5B7C99]/32 bg-white/90 px-4 py-2 text-sm font-semibold text-[#2C3E4D] shadow-sm transition hover:border-[#C45C26]/35 hover:bg-[#FFFCF7] hover:text-[#1E1810] sm:min-h-0 sm:py-1.5";

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

/** Search primary button — strong burnt orange, obvious action. */
export const rentasSearchSubmitClass = [
  "inline-flex w-full min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-full",
  "bg-[#C45C26] px-7 py-3 text-sm font-bold tracking-wide text-[#FFFBF7]",
  "shadow-[0_12px_32px_-12px_rgba(196,92,38,0.65)] transition",
  "hover:bg-[#A84E20] hover:shadow-[0_14px_36px_-12px_rgba(196,92,38,0.55)]",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C45C26]/50",
  "xl:w-auto xl:min-w-[10.5rem] xl:py-3",
].join(" ");

/** Quick explore — primary browse paths (property + branch). */
export const rentasChipPrimaryBrowseClass = [
  "inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#5B7C99]/28",
  "bg-gradient-to-b from-[#FBFDFF] to-[#EEF4F8]",
  "px-4 py-2.5 text-sm font-semibold text-[#2C3E4D]",
  "shadow-[0_4px_14px_-6px_rgba(44,36,28,0.18)] transition",
  "hover:-translate-y-0.5 hover:border-[#C45C26]/35 hover:shadow-[0_8px_22px_-8px_rgba(44,36,28,0.2)] hover:text-[#1E1810]",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C45C26]/40",
  "active:scale-[0.99]",
  "sm:px-5",
].join(" ");

/** Quick explore — filters / refinements (still prominent, secondary tier). */
export const rentasChipSecondaryBrowseClass = [
  "inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#D4CBC0]/95",
  "bg-gradient-to-b from-[#FFFCF7] to-[#F4EDE6]",
  "px-3.5 py-2.5 text-sm font-semibold text-[#4A4338]",
  "shadow-[0_2px_10px_-5px_rgba(44,36,28,0.14)] transition",
  "hover:-translate-y-0.5 hover:border-[#5B7C99]/35 hover:shadow-md hover:text-[#1E1810]",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C45C26]/35",
  "active:scale-[0.99]",
  "sm:px-4",
].join(" ");

/** @deprecated Use rentasChipPrimaryBrowseClass or rentasChipSecondaryBrowseClass */
export const rentasChipInactiveClass = rentasChipPrimaryBrowseClass;

export const rentasChipHoverClass = "";

/** Panel wrapping quick filter chips for discoverability. */
export const rentasQuickExplorePanelClass = [
  "rounded-[1.35rem] border border-[#E0D4C8]/65",
  "bg-gradient-to-br from-white/80 via-[#FFFCF7]/92 to-[#F0E8DC]/55",
  "p-4 shadow-[0_16px_44px_-28px_rgba(44,36,28,0.16)] sm:p-6",
  "ring-1 ring-white/70",
].join(" ");

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
