export type PromoPresetGuideEntry = {
  id: string;
  title: string;
  purpose: string;
  bestUse: string;
  requiredFields: string[];
  optionalFields: string[];
  appliesTo: string;
  excludes: string;
  readiness: "active" | "draft" | "coming_later";
  readinessNote: string;
};

export const PROMO_PRESET_GUIDE: PromoPresetGuideEntry[] = [
  {
    id: "custom",
    title: "Custom discount code",
    purpose: "Manual discount or tracking code with your own field choices.",
    bestUse: "One-off sales offers or category-specific discounts you configure field by field.",
    requiredFields: ["Promo purpose", "Discount type/value when purpose is Discount"],
    optionalFields: ["Category", "Package scope", "Customer/business/email", "Sales rep", "Notes"],
    appliesTo: "Eligible website checkout products when discount + scope match.",
    excludes: "Free posts, print packages, combos, manual contracts, placement/ranking.",
    readiness: "active",
    readinessNote: "Ready for admin create. Verify category checkout wiring before promising to customers.",
  },
  {
    id: "restaurante_launch_25",
    title: "Restaurante launch 25% (Retired)",
    purpose: "Restaurant launch discount for base monthly checkout.",
    bestUse: "Retired — the Launch 25 campaign has ended. Kept for historical reference only.",
    requiredFields: ["Discount 25%", "Category Restaurantes", "Package scope"],
    optionalFields: ["Customer/business/email for tracking", "Sales rep", "Notes"],
    appliesTo: "Restaurantes base monthly checkout.",
    excludes: "Placement, ranking, print/combo, free posts.",
    readiness: "coming_later",
    readinessNote: "Retired. The Launch 25 campaign has ended; do not create new codes from this preset.",
  },
  {
    id: "restaurante_qa_25",
    title: "Restaurante QA 25% (Retired)",
    purpose: "QA verification discount for Restaurantes launch testing.",
    bestUse: "Retired — the Launch 25 campaign has ended. Kept for historical reference only.",
    requiredFields: ["Discount 25%", "Category Restaurantes", "Package scope"],
    optionalFields: ["Notes", "Sales rep"],
    appliesTo: "Restaurantes base monthly checkout.",
    excludes: "Placement, ranking, print/combo.",
    readiness: "coming_later",
    readinessNote: "Retired. The Launch 25 campaign has ended; do not create new codes from this preset.",
  },
  {
    id: "servicios_launch_25",
    title: "Servicios launch 25%",
    purpose: "Future Servicios launch promotion.",
    bestUse: "Do not use for live customer promises until Servicios checkout eligibility is confirmed.",
    requiredFields: ["—"],
    optionalFields: ["—"],
    appliesTo: "Future Servicios checkout (not wired by this gate).",
    excludes: "All live checkout until separately verified.",
    readiness: "coming_later",
    readinessNote: "Coming later. Verify checkout wiring before any live use.",
  },
  {
    id: "bienes_raices_launch_25",
    title: "Bienes Raíces negocio launch 25%",
    purpose: "Future Bienes Raíces negocio launch promotion.",
    bestUse: "Planning only until negocio checkout promo path is verified end to end.",
    requiredFields: ["—"],
    optionalFields: ["—"],
    appliesTo: "Future Bienes Raíces negocio checkout.",
    excludes: "All live checkout until separately verified.",
    readiness: "coming_later",
    readinessNote: "Coming later. Do not promise to customers yet.",
  },
  {
    id: "general_launch_25",
    title: "General launch discount (25%, any package) (Retired)",
    purpose: "Broad 25% launch discount without package lock.",
    bestUse: "Retired — the Launch 25 campaign has ended. Kept for historical reference only.",
    requiredFields: ["Discount 25%"],
    optionalFields: ["Category", "Customer tracking fields", "Notes"],
    appliesTo: "Eligible website checkout when category/package rules match at checkout.",
    excludes: "Free posts, print/combo, placement guarantees.",
    readiness: "coming_later",
    readinessNote: "Retired. The Launch 25 campaign has ended; do not create new codes from this preset.",
  },
  {
    id: "newsletter_launch_25",
    title: "Newsletter launch 25% (Retired)",
    purpose: "Subscriber acquisition / Launch 25 follow-up code.",
    bestUse: "Retired — public newsletter signup no longer mints Launch 25 codes. Kept for historical reference only.",
    requiredFields: ["Customer email", "Promo purpose Newsletter"],
    optionalFields: ["Name", "Business", "Phone", "Notes"],
    appliesTo: "Eligible website checkout products (Launch 25 family).",
    excludes: "Free posts, dealer, print packages, combos, manual contracts.",
    readiness: "coming_later",
    readinessNote: "Retired. The Launch 25 campaign has ended; do not create new codes from this preset.",
  },
];

export function getPromoPresetGuide(presetId: string): PromoPresetGuideEntry {
  return PROMO_PRESET_GUIDE.find((p) => p.id === presetId) ?? PROMO_PRESET_GUIDE[0];
}
