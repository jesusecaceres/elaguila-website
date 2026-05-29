/**
 * Varios (En Venta) scoped typography — preview + public detail only.
 * Do not use for global layout or other categories.
 */
export const EN_VENTA_TYPO = {
  listingTitle:
    "font-serif text-[1.625rem] font-semibold leading-[1.2] tracking-tight text-[#1E1810] sm:text-[1.85rem]",
  listingPrice:
    "text-[1.65rem] font-semibold leading-none tracking-tight text-[#1E1810] sm:text-[1.85rem]",
  listingStatus: "text-xs font-medium text-[#7A7164]",
  listingMeta: "text-sm font-normal leading-snug text-[#5C5346]",
  negotiableChip:
    "rounded-md border border-[#C9B46A]/50 bg-[#FBF7EF] px-2 py-0.5 text-xs font-medium text-[#5C4E2E]",
  primaryCta:
    "inline-flex min-h-[44px] w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition sm:w-auto sm:min-w-[12rem]",
  sectionTitle: "text-[11px] font-semibold uppercase tracking-wide text-[#7A7164]",
  factLabel: "text-[10px] font-semibold uppercase tracking-wide text-[#7A7164]",
  factValue: "text-sm font-medium leading-snug text-[#1E1810]",
  body: "whitespace-pre-wrap text-sm font-normal leading-relaxed text-[#2C2416]/90 [overflow-wrap:anywhere]",
  deliveryTitle: "text-sm font-medium text-[#1E1810]",
  deliveryNote: "text-sm font-normal leading-relaxed text-[#5C5346]/95 [overflow-wrap:anywhere]",
  deliveryPlaceholder: "text-xs font-normal text-[#7A7164]/90",
  panelSellerName: "truncate text-[15px] font-semibold tracking-tight text-[#1E1810]",
  panelSellerSub: "mt-1 text-xs font-medium leading-snug text-[#5C5346]/90",
  panelKindChip:
    "shrink-0 rounded-md border border-[#E8DFD0]/90 bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#5C5346]",
  panelLocationValue: "text-sm font-medium leading-snug text-[#1E1810]",
  panelChip: "text-[11px] font-medium leading-snug text-[#3D3428]",
  contactBtn:
    "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A84A]/60",
  engagementWrap: "flex flex-wrap items-center gap-2",
} as const;

/** Leonix analytics / saved_listings key for published Varios ads. */
export function enVentaEngagementListingKey(listingId: string, leonixAdId?: string | null): string {
  const ad = (leonixAdId ?? "").trim();
  if (ad) return ad;
  return listingId.trim();
}
