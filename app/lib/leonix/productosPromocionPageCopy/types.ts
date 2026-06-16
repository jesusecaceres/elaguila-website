import type { CategoryId } from "@/app/(site)/productos-promocion/catalogData";

export type ProductosPromocionCategoryCopy = {
  label: string;
  description: string;
};

export type ProductosPromocionPageCopy = {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  helperCopy: string;
  requestQuote: string;
  call: string;
  openMap: string;
  categoryTabsAria: string;
  additionalHeading: string;
  additionalHelper: string;
  customQuoteCallout: string;
  customQuoteBtn: string;
  bottomHeading: string;
  bottomBody: string;
  mailtoSubject: string;
  categories: Record<CategoryId, ProductosPromocionCategoryCopy>;
};
