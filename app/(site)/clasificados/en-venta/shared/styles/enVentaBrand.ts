import type { CSSProperties } from "react";

/**
 * Leonix Media brand palette for Varios (En Venta) preview + detail.
 * Mapped from Coming Soon v2 — local only; not a global theme.
 */
export const LEONIX_VARIOS = {
  pageBg: "#F8F4EA",
  cream: "#FFFDF7",
  creamWarm: "#FBF7EF",
  borderSand: "#D6C7AD",
  burgundy: "#7A1E2C",
  burgundyHover: "#5e1721",
  gold: "#C9A84A",
  goldBronze: "#8A6B1F",
  charcoal: "#3D3428",
  charcoalDeep: "#1F241C",
  greenTrust: "#2A4536",
  greenMuted: "#556B3E",
} as const;

/** Coming Soon → Varios mapping (documented in P4-B audit). */
export const EN_VENTA_BRAND_MAP = {
  burgundy: "Primary CTA (Hacer oferta / Contactar), Llamar, saved heart state",
  gold: "Chips, borders, share/outline actions, premium highlights",
  cream: "Page background + card surfaces",
  charcoal: "Title, price, body text hierarchy",
  green: "Trust/safety accent only (buyer safety line, moderated note)",
} as const;

export const EN_VENTA_SURFACE = {
  pageShell: "min-h-screen text-[#3D3428]",
  pageBgStyle: {
    backgroundColor: LEONIX_VARIOS.pageBg,
    backgroundImage: `
      radial-gradient(ellipse 120% 70% at 50% -15%, rgba(201, 168, 74, 0.14), transparent 58%),
      radial-gradient(ellipse 48% 38% at 100% 20%, rgba(255, 253, 247, 0.65), transparent 50%),
      radial-gradient(ellipse 42% 32% at 0% 85%, rgba(122, 30, 44, 0.04), transparent 52%)
    `,
  } satisfies CSSProperties,
  listingCanvas:
    "rounded-xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-4 shadow-[0_20px_48px_-20px_rgba(31,36,28,0.2)] ring-1 ring-[#C9A84A]/12 sm:p-6 lg:p-7",
  contentCard:
    "rounded-xl border border-[#D6C7AD]/80 bg-[#FFFDF7] p-4 shadow-[0_10px_28px_-16px_rgba(31,36,28,0.18)] sm:p-5",
  contentCardInner: "rounded-lg border border-[#D6C7AD]/55 bg-[#FBF7EF]/90 px-3 py-2.5",
  heroCard:
    "rounded-xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-5 shadow-[0_12px_32px_-16px_rgba(31,36,28,0.16)] ring-1 ring-[#C9A84A]/10",
  contactCard:
    "rounded-xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-4 shadow-[0_14px_40px_-18px_rgba(31,36,28,0.2)] ring-1 ring-[#C9A84A]/10 sm:p-5",
  galleryFrame:
    "overflow-hidden rounded-xl border border-[#D6C7AD]/85 bg-[#FFFDF7] shadow-[0_16px_44px_-18px_rgba(31,36,28,0.2)] ring-1 ring-[#C9A84A]/10",
  chipGold:
    "rounded-md border border-[#C9A84A]/55 bg-[#FBF7EF] px-2.5 py-0.5 text-xs font-medium text-[#8A6B1F]",
  chipGreenTrust:
    "rounded-md border border-[#2A4536]/30 bg-[#2A4536]/[0.08] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#2A4536]",
  primaryCta:
    "border border-[#7A1E2C]/15 bg-[#7A1E2C] text-[#FFFCF7] shadow-[0_8px_20px_-6px_rgba(122,30,44,0.45)] hover:bg-[#5e1721] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1E2C]",
  primaryCtaDisabled: "cursor-not-allowed border border-[#D6C7AD]/70 bg-[#E8E0D4] text-[#7A7164] shadow-none",
  secondaryBtn:
    "border border-[#C9A84A]/55 bg-[#FFFDF7] text-[#3D3428] hover:border-[#C9A84A] hover:bg-[#FBF7EF]",
  reportBtn:
    "border border-[#D6C7AD]/80 bg-white/95 text-[#5C5346] hover:border-[#C9A84A]/40 hover:bg-[#FBF7EF]",
  shellBar: "border-[#D6C7AD]/85 bg-[#FFFDF7]/95",
  sellerAvatar:
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#7A1E2C]/12 via-[#C9A84A]/20 to-[#C9A84A]/35 text-[12px] font-semibold text-[#7A1E2C] ring-1 ring-[#C9A84A]/35",
  resultsCard:
    "rounded-xl border border-[#D6C7AD]/85 bg-[#FFFDF7] shadow-[0_10px_28px_-16px_rgba(31,36,28,0.18)] ring-1 ring-[#C9A84A]/10",
  resultsCardPro:
    "rounded-xl border-2 border-[#C9A84A]/55 bg-gradient-to-b from-[#FFFDF7] via-[#FFFDF7] to-[#FBF7EF] shadow-[0_14px_40px_-16px_rgba(201,168,74,0.28)] ring-1 ring-[#C9A84A]/15",
  resultsCardHover:
    "transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-14px_rgba(31,36,28,0.22)] hover:border-[#C9A84A]/45",
  resultsChipCondition:
    "inline-flex items-center gap-1 rounded-full border border-[#C9A84A]/45 bg-[#FBF7EF] px-2 py-0.5 text-[11px] font-semibold text-[#8A6B1F]",
  resultsChipFulfillment:
    "inline-flex max-w-full items-center gap-1 rounded-full border border-[#2A4536]/25 bg-[#2A4536]/[0.06] px-2 py-0.5 text-[11px] font-semibold text-[#2A4536]",
} as const;

export function enVentaEngagementListingKey(listingId: string, leonixAdId?: string | null): string {
  const ad = (leonixAdId ?? "").trim();
  if (ad) return ad;
  return listingId.trim();
}
