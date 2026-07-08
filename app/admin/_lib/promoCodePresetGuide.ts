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
    title: "Restaurante launch 25%",
    purpose: "Restaurant launch discount for base monthly checkout.",
    bestUse: "Live Restaurantes launch promos tied to `restaurantes_base_monthly`.",
    requiredFields: ["Discount 25%", "Category Restaurantes", "Package scope"],
    optionalFields: ["Customer/business/email for tracking", "Sales rep", "Notes"],
    appliesTo: "Restaurantes base monthly checkout.",
    excludes: "Placement, ranking, print/combo, free posts.",
    readiness: "active",
    readinessNote: "Restaurantes checkout is wired. Does not grant placement by itself.",
  },
  {
    id: "restaurante_qa_25",
    title: "Restaurante QA 25%",
    purpose: "QA verification discount for Restaurantes launch testing.",
    bestUse: "Internal QA before customer-facing launch comms.",
    requiredFields: ["Discount 25%", "Category Restaurantes", "Package scope"],
    optionalFields: ["Notes", "Sales rep"],
    appliesTo: "Restaurantes base monthly checkout.",
    excludes: "Placement, ranking, print/combo.",
    readiness: "active",
    readinessNote: "For QA only — label notes clearly in admin.",
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
    title: "General launch discount (25%, any package)",
    purpose: "Broad 25% launch discount without package lock.",
    bestUse: "Cross-category launch promos when package scope should stay open.",
    requiredFields: ["Discount 25%"],
    optionalFields: ["Category", "Customer tracking fields", "Notes"],
    appliesTo: "Eligible website checkout when category/package rules match at checkout.",
    excludes: "Free posts, print/combo, placement guarantees.",
    readiness: "active",
    readinessNote: "Ready to create. Checkout still enforces real eligibility.",
  },
  {
    id: "newsletter_launch_25",
    title: "Newsletter launch 25%",
    purpose: "Subscriber acquisition / Launch 25 follow-up code.",
    bestUse: "Manual admin create for subscriber follow-up when public signup did not run.",
    requiredFields: ["Customer email", "Promo purpose Newsletter"],
    optionalFields: ["Name", "Business", "Phone", "Notes"],
    appliesTo: "Eligible website checkout products (Launch 25 family).",
    excludes: "Free posts, dealer, print packages, combos, manual contracts.",
    readiness: "draft",
    readinessNote:
      "Draft by default in preset. Public newsletter signup auto-creates active codes; use this for manual admin cases.",
  },
];

export function getPromoPresetGuide(presetId: string): PromoPresetGuideEntry {
  return PROMO_PRESET_GUIDE.find((p) => p.id === presetId) ?? PROMO_PRESET_GUIDE[0];
}
