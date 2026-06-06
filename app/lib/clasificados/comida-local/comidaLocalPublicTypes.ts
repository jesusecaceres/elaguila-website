import type {
  ComidaLocalFoodType,
  ComidaLocalImageDraft,
  ComidaLocalLanguageOption,
  ComidaLocalPaymentMethod,
  ComidaLocalPriceLevel,
  ComidaLocalServiceOption,
} from "./comidaLocalTypes";
import type { ComidaLocalPreviewChip, ComidaLocalPreviewVm } from "./comidaLocalPreviewTypes";

/** Raw row from `comida_local_public_listings` (read-only public fetch). */
export type ComidaLocalPublicListingRow = {
  id: string;
  slug: string;
  leonix_ad_id: string | null;
  status: string;
  package_tier: string;
  payment_status: string;
  published_at: string;
  business_name: string;
  food_type: string;
  food_type_custom: string | null;
  city_canonical: string | null;
  city_display: string;
  zone_note: string | null;
  que_vendes: string;
  phone: string | null;
  whatsapp: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  location_note: string | null;
  location_url: string | null;
  availability_note: string | null;
  service_options: ComidaLocalServiceOption[] | unknown;
  payment_methods: ComidaLocalPaymentMethod[] | unknown;
  payment_other_note: string | null;
  price_level: string | null;
  languages: ComidaLocalLanguageOption[] | unknown;
  main_photo: ComidaLocalImageDraft | null | unknown;
  logo_image: ComidaLocalImageDraft | null | unknown;
  gallery_images: ComidaLocalImageDraft[] | unknown;
  listing_json: Record<string, unknown> | null;
};

export type ComidaLocalResultsSearchParams = {
  q?: string;
  city?: string;
  foodType?: string;
  service?: string;
  priceLevel?: string;
};

export type ComidaLocalResultsFilters = {
  q: string;
  city: string;
  foodType: string;
  service: string;
  priceLevel: string;
};

export type ComidaLocalPublicListingCardVm = {
  id: string;
  slug: string;
  leonixAdId: string | null;
  businessName: string;
  foodTypeLabel: string;
  locationLine: string;
  excerpt: string;
  mainImageSrc: string | null;
  mainImageAlt: string;
  chips: ComidaLocalPreviewChip[];
  detailHref: string;
  telHref: string | null;
  whatsappHref: string | null;
};

/** Detail uses shared preview shell VM + public identifiers only. */
export type ComidaLocalPublicListingDetailVm = ComidaLocalPreviewVm & {
  id: string;
  slug: string;
  leonixAdId: string | null;
};

export type ComidaLocalFilterOptions = {
  cities: string[];
  foodTypes: string[];
  services: ComidaLocalServiceOption[];
  priceLevels: ComidaLocalPriceLevel[];
};

export type ComidaLocalPublicListingsQueryResult = {
  rows: ComidaLocalPublicListingRow[];
  source: "published" | "inventory_unavailable" | "inventory_query_failed";
  bannerNote?: string;
};
