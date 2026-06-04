import { COMIDA_LOCAL_CATEGORY_KEY } from "./comidaLocalConstants";
import {
  COMIDA_LOCAL_PAYMENT_STATUS_L5B,
  type ComidaLocalListingStatusDb,
  type ComidaLocalPackageTierDb,
} from "./comidaLocalPublishTypes";
import { sanitizeComidaLocalImageForDb } from "./comidaLocalPublishValidation";
import type { ComidaLocalDraft } from "./comidaLocalTypes";

export type ComidaLocalPublicListingInsert = {
  slug: string;
  owner_user_id: string | null;
  draft_listing_id: string;
  status: ComidaLocalListingStatusDb;
  package_tier: ComidaLocalPackageTierDb;
  payment_status: string;
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
  service_options: string[];
  payment_methods: string[];
  payment_other_note: string | null;
  price_level: string | null;
  languages: string[];
  main_photo: ReturnType<typeof sanitizeComidaLocalImageForDb>;
  logo_image: ReturnType<typeof sanitizeComidaLocalImageForDb>;
  gallery_images: NonNullable<ReturnType<typeof sanitizeComidaLocalImageForDb>>[];
  listing_json: ComidaLocalDraft & { category: typeof COMIDA_LOCAL_CATEGORY_KEY };
};

function emptyToNull(s: string): string | null {
  const t = s.trim();
  return t || null;
}

export function draftToComidaLocalPublicListingInsert(
  draft: ComidaLocalDraft,
  slug: string,
  opts: {
    ownerUserId: string | null;
    draftListingId: string;
    packageTier: ComidaLocalPackageTierDb;
    status?: ComidaLocalListingStatusDb;
    paymentStatus?: string;
  }
): ComidaLocalPublicListingInsert {
  const main = sanitizeComidaLocalImageForDb(draft.mainPhoto);
  const logo = sanitizeComidaLocalImageForDb(draft.logoImage);
  const gallery = draft.galleryImages
    .map((g) => sanitizeComidaLocalImageForDb(g))
    .filter((g): g is NonNullable<typeof g> => g !== null);

  return {
    slug,
    owner_user_id: opts.ownerUserId,
    draft_listing_id: opts.draftListingId,
    status: opts.status ?? "published",
    package_tier: opts.packageTier,
    payment_status: opts.paymentStatus ?? COMIDA_LOCAL_PAYMENT_STATUS_L5B,
    business_name: draft.businessName.trim(),
    food_type: draft.foodType || "otro",
    food_type_custom: emptyToNull(draft.foodTypeCustom),
    city_canonical: emptyToNull(draft.cityCanonical),
    city_display: draft.cityDisplay.trim(),
    zone_note: emptyToNull(draft.zoneNote),
    que_vendes: draft.queVendes.trim(),
    phone: emptyToNull(draft.phone),
    whatsapp: emptyToNull(draft.whatsapp),
    instagram_url: emptyToNull(draft.instagramUrl),
    facebook_url: emptyToNull(draft.facebookUrl),
    tiktok_url: emptyToNull(draft.tiktokUrl),
    location_note: emptyToNull(draft.locationNote),
    location_url: emptyToNull(draft.locationUrl),
    availability_note: emptyToNull(draft.availabilityNote),
    service_options: [...draft.serviceOptions],
    payment_methods: [...draft.paymentMethods],
    payment_other_note: emptyToNull(draft.paymentOtherNote),
    price_level: emptyToNull(draft.priceLevel),
    languages: [...draft.languages],
    main_photo: main,
    logo_image: logo,
    gallery_images: gallery,
    listing_json: {
      ...draft,
      category: COMIDA_LOCAL_CATEGORY_KEY,
    },
  };
}
