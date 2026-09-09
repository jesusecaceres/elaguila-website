/**
 * Visual-only image map for the Autos + Dealers de Autos landing discovery
 * cards. Both markets share this one page component (AutosLandingPage.tsx,
 * `market` prop) and several ids overlap (suv, truck, low-mileage), so one
 * unified map keeps a single photo per concept instead of duplicating it.
 * Kept out of the copy/i18n layer on purpose — paths are language-independent.
 */
export const AUTOS_CHILD_CATEGORY_IMAGE: Record<
  | "sedan"
  | "suv"
  | "truck"
  | "low-mileage"
  | "under-10k"
  | "hybrid-electric"
  | "private"
  | "newest"
  | "dealers"
  | "used"
  | "new"
  | "financing"
  | "bay-area",
  string
> = {
  sedan: "/child-categories/autos/sedan.jpg",
  suv: "/child-categories/autos/suv.jpg",
  truck: "/child-categories/autos/truck.jpg",
  "low-mileage": "/child-categories/autos/low-mileage.jpg",
  "under-10k": "/child-categories/autos/under-10k.jpg",
  "hybrid-electric": "/child-categories/autos/hybrid-electric.jpg",
  private: "/child-categories/autos/private.jpg",
  newest: "/child-categories/autos/newest.jpg",
  dealers: "/child-categories/autos/dealers.jpg",
  used: "/child-categories/autos/used.jpg",
  new: "/child-categories/autos/new.jpg",
  financing: "/child-categories/autos/financing.jpg",
  "bay-area": "/child-categories/autos/bay-area.jpg",
} as const;
