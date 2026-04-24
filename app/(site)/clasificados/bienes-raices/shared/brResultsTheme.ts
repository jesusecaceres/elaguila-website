/** Leonix BR — luxury marketplace tokens (warm ivory, charcoal, bronze/gold). */

export const BR_RESULTS = {
  bg: "#F4EFE6",
  bgPaper: "#FAF7F2",
  card: "#FDFBF7",
  cardElevated: "#FFFCF7",
  cardBorder: "rgba(61, 54, 48, 0.12)",
  charcoal: "#3D3630",
  charcoalDeep: "#2A2620",
  ink: "#1E1810",
  muted: "rgba(61, 54, 48, 0.62)",
  bronze: "#C5A059",
  bronzeSoft: "#B8954A",
  bronzeDeep: "#8A6F3A",
  chip: "#FFFCF7",
  accentGreen: "#4A7C59",
  accentGreenSoft: "rgba(74, 124, 89, 0.12)",
  accentOrange: "#C17A3A",
  accentOrangeSoft: "rgba(193, 122, 58, 0.14)",
  goldLine: "#E8D5A8",
} as const;

/** Subtle dot paper + warm wash (full BR vertical). */
export const brResultsPaperBgClass =
  "bg-[#F4EFE6] [background-image:radial-gradient(rgba(61,54,48,0.045)_1px,transparent_1px),linear-gradient(180deg,rgba(255,252,247,0.55)_0%,transparent_42%)] [background-size:20px_20px,100%_100%]";

/** Page shell for listing + browse (no max-width — apply inner max on sections). */
export const brLuxuryPageClass = `min-h-screen ${brResultsPaperBgClass} text-[#2A2620] antialiased`;

/** Standard inner width (listing detail hero + results). */
export const brLuxuryInnerMaxClass = "mx-auto w-full max-w-[1280px] px-4 sm:px-6";

/** Primary cream card (results / detail panels). */
export const brLuxuryCardClass =
  "rounded-[22px] border border-[#E8DFD0]/85 bg-[#FDFBF7]/[0.98] shadow-[0_20px_56px_-28px_rgba(42,36,22,0.22)] backdrop-blur-[2px]";

/** Featured / hero emphasis. */
export const brLuxuryHeroPanelClass =
  "rounded-[24px] border border-[#D4C4A8]/50 bg-gradient-to-br from-[#FFFCF7] via-[#FDFBF7] to-[#F3EBE0]/95 shadow-[0_28px_72px_-32px_rgba(42,36,22,0.28)]";

/** Soft lift for interactive cards. */
export const brLuxuryCardHoverClass =
  "transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_28px_64px_-24px_rgba(42,36,22,0.32)]";

/** Image frame inside cards. */
export const brLuxuryImageFrameClass = "overflow-hidden rounded-t-[22px] sm:rounded-t-[22px]";

/** Primary CTA — bronze gradient (Leonix luxury). */
export const brLuxuryBtnPrimaryClass =
  "inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-[#A67C32] via-[#C5A059] to-[#B8954A] px-5 py-2.5 text-center text-sm font-bold tracking-wide text-[#FFFCF7] shadow-[0_12px_32px_-8px_rgba(138,111,58,0.55)] transition hover:brightness-[1.05] hover:shadow-[0_16px_36px_-6px_rgba(138,111,58,0.45)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B46A]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4EFE6]";

/** Secondary / ghost on ivory. */
export const brLuxuryBtnSecondaryClass =
  "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#E8DFD0]/95 bg-white/90 px-5 py-2.5 text-sm font-semibold text-[#2A2620] shadow-[0_6px_20px_-10px_rgba(42,36,22,0.15)] transition hover:border-[#C9B46A]/55 hover:bg-[#FFFCF7] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B46A]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4EFE6]";

/** Section label / overline. */
export const brLuxuryOverlineClass =
  "text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A6F3A]/90";

/** Serif heading (marketing). */
export const brLuxurySerifHeadingClass = "font-serif font-semibold tracking-tight text-[#1E1810]";

/** Muted body on ivory. */
export const brLuxuryBodyMutedClass = "text-sm leading-relaxed text-[#5C5346]/90";
