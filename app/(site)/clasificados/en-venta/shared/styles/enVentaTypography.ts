/**
 * Varios (En Venta) scoped typography — preview + public detail only.
 * Colors align with `enVentaBrand.ts` (Leonix Media / Coming Soon palette).
 */
export const EN_VENTA_TYPO = {
  listingTitle:
    "font-serif text-[1.625rem] font-semibold leading-[1.2] tracking-tight text-[#1F241C] sm:text-[1.875rem]",
  listingPrice:
    "font-serif text-[1.65rem] font-semibold leading-none tracking-tight text-[#7A1E2C] sm:text-[1.85rem]",
  listingStatus: "text-xs font-medium text-[#8A6B1F]",
  listingMeta: "text-sm font-normal leading-snug text-[#3D3428]/90",
  negotiableChip:
    "rounded-md border border-[#C9A84A]/55 bg-[#FBF7EF] px-2.5 py-0.5 text-xs font-medium text-[#8A6B1F]",
  primaryCta:
    "inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:w-auto sm:min-w-[12rem]",
  sectionTitle: "text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A6B1F]",
  factLabel: "text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8A6B1F]",
  factValue: "text-sm font-medium leading-snug text-[#3D3428]",
  body: "whitespace-pre-wrap text-sm font-normal leading-relaxed text-[#3D3428]/95 [overflow-wrap:anywhere]",
  deliveryTitle: "text-sm font-medium text-[#3D3428]",
  deliveryNote: "text-sm font-normal leading-relaxed text-[#3D3428]/85 [overflow-wrap:anywhere]",
  deliveryPlaceholder: "text-xs font-normal text-[#556B3E]/90",
  panelSellerName: "truncate text-[15px] font-semibold tracking-tight text-[#1F241C]",
  panelSellerSub: "mt-1 text-xs font-medium leading-snug text-[#3D3428]/80",
  panelKindChip:
    "shrink-0 rounded-md border border-[#C9A84A]/45 bg-[#FBF7EF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8A6B1F]",
  panelLocationValue: "text-sm font-medium leading-snug text-[#3D3428]",
  panelChip: "text-[11px] font-medium leading-snug text-[#3D3428]",
  contactBtn:
    "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
  engagementWrap: "flex flex-wrap items-center gap-2",
  trustLine: "text-[11px] leading-relaxed text-[#556B3E]",
} as const;

export { enVentaEngagementListingKey } from "./enVentaBrand";
