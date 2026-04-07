/**
 * En Venta view-models: lista, anuncio, dashboard, admin.
 */

import type { EnVentaSellerKind } from "../../contracts/enVentaPublishContract";

export type EnVentaListaCardDTO = {
  id: string;
  title: string;
  priceLabel: string;
  city: string;
  postedAgo: string;
  heroImageUrl: string | null;
  conditionLabel: string | null;
  departmentKey: string | null;
  subKey: string | null;
  sellerKind: EnVentaSellerKind;
  negotiable: boolean;
  isPromoted?: boolean;
};

export type EnVentaAnuncioDTO = {
  id: string;
  title: { es: string; en: string };
  description: string;
  priceLabel: { es: string; en: string };
  city: string;
  zip?: string | null;
  postedAgo: { es: string; en: string };
  images: string[];
  conditionKey?: string | null;
  departmentKey?: string | null;
  subKey?: string | null;
  articleKey?: string | null;
  specRows: Array<{ label: string; value: string }>;
  fulfillment: { pickup: boolean; shipping: boolean; delivery: boolean };
  negotiable: boolean;
  sellerKind: EnVentaSellerKind;
  businessName?: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  ownerId?: string | null;
  /** Publishing plan from `Leonix:plan` detail pair, with legacy inference when missing. */
  planTier: "free" | "pro";
  /** Listing includes a video (stored URL in description or known hosts). */
  hasListingVideo: boolean;
  /** `listings.views` engagement counter when present. */
  views: number;
};

export type EnVentaDashboardRowDTO = {
  id: string;
  title: string | null;
  price: number | string | null;
  city: string | null;
  status: string | null;
  created_at: string | null;
  images: unknown;
  views: number;
  messages: number;
  saves: number;
};

export type EnVentaAdminRowDTO = {
  id: string;
  title: string | null;
  category: string;
  status: string | null;
  detail_pairs: unknown;
  seller_type: string | null;
  flags?: string[];
};
