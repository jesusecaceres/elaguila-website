/** Leonix Promo Admin OS V2 — local brand tokens (promo workspace only). */

export const PROMO_OS_CREAM_CARD =
  "rounded-2xl border border-[#C9B46A]/55 bg-[#FFFCF7] shadow-sm";
export const PROMO_OS_CREAM_PANEL =
  "rounded-xl border border-[#E8DFD0]/80 bg-[#FBF7EF]";
export const PROMO_OS_GOLD_BORDER = "border-[#C9B46A]/70";
export const PROMO_OS_CHARCOAL = "text-[#1E1810]";
export const PROMO_OS_MUTED = "text-[#5C5346]";
export const PROMO_OS_SUBTLE = "text-[#7A7164]";

export const PROMO_OS_SERIF_TITLE = "font-serif text-base font-bold text-[#1E1810]";

export type PromoFieldBadgeKind =
  | "required"
  | "optional"
  | "tracking"
  | "coming_later"
  | "risk";

export function promoFieldBadgeClass(kind: PromoFieldBadgeKind): string {
  switch (kind) {
    case "required":
      return "rounded border border-[#C9B46A]/80 bg-[#FBF3DC] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#6B5B2E]";
    case "optional":
      return "rounded border border-[#E8DFD0] bg-[#FFFCF7] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#5C5346]";
    case "tracking":
      return "rounded border border-[#D4C4A8]/80 bg-[#F8F4EC] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#5C5346]";
    case "coming_later":
      return "rounded border border-[#D4C4A8] bg-[#F4F0E8] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#7A7164]";
    case "risk":
      return "rounded border border-[#7A1E2C]/45 bg-[#FDF2F4] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#7A1E2C]";
    default:
      return "";
  }
}

export function promoFieldBadgeLabel(kind: PromoFieldBadgeKind): string {
  switch (kind) {
    case "required":
      return "Required";
    case "optional":
      return "Optional";
    case "tracking":
      return "Tracking only";
    case "coming_later":
      return "Coming later";
    case "risk":
      return "Check first";
    default:
      return "";
  }
}

export function promoFilterChipClass(active: boolean, tone: "default" | "gold" | "burgundy" | "green" = "default"): string {
  const base =
    "rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors";
  if (!active) return `${base} border-[#E8DFD0] bg-[#FFFCF7] text-[#5C5346] hover:border-[#C9B46A]/60`;
  switch (tone) {
    case "gold":
      return `${base} border-[#C9B46A] bg-[#FBF3DC] text-[#4A3F2A]`;
    case "burgundy":
      return `${base} border-[#7A1E2C]/55 bg-[#FDF2F4] text-[#7A1E2C]`;
    case "green":
      return `${base} border-emerald-300 bg-emerald-50 text-emerald-950`;
    default:
      return `${base} border-[#C9B46A]/70 bg-[#FFFCF7] text-[#1E1810]`;
  }
}
