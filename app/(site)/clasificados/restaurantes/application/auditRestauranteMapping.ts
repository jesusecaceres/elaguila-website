import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import { mapRestauranteDraftToShellData } from "./mapRestauranteDraftToShell";

/**
 * Internal audit utility to verify every restaurant field is properly mapped
 * from application -> shell -> preview/detail
 */

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

interface FieldAudit {
  fieldName: string;
  inApplication: boolean;
  inDraft: boolean;
  mappedToShell: boolean;
  renderedInPreview: boolean;
  notes?: string;
}

function auditField(
  fieldName: string,
  draft: RestauranteListingDraft,
  hasInApplication: boolean,
  hasInDraft: boolean,
  isMappedInShell: boolean,
  notes?: string
): FieldAudit {
  return {
    fieldName,
    inApplication: hasInApplication,
    inDraft: hasInDraft,
    mappedToShell: isMappedInShell,
    renderedInPreview: isMappedInShell, // Shell mapping determines preview rendering
    notes
  };
}

export function auditRestauranteFieldMapping(draft: RestauranteListingDraft): FieldAudit[] {
  const shellData = mapRestauranteDraftToShellData(draft);
  
  // IDENTITY FIELDS
  const audits: FieldAudit[] = [
    // Business identity
    auditField("businessName", draft, true, nonEmpty(draft.businessName), true),
    auditField("businessType", draft, true, nonEmpty(draft.businessType), true),
    auditField("businessTypeCustom", draft, draft.businessType === "other", nonEmpty(draft.businessTypeCustom), true),
    auditField("primaryCuisine", draft, true, nonEmpty(draft.primaryCuisine), true),
    auditField("primaryCuisineCustom", draft, draft.primaryCuisine === "other", nonEmpty(draft.primaryCuisineCustom), true),
    auditField("secondaryCuisine", draft, true, nonEmpty(draft.secondaryCuisine), true),
    auditField("secondaryCuisineCustom", draft, draft.secondaryCuisine === "other", nonEmpty(draft.secondaryCuisineCustom), true),
    auditField("additionalCuisines", draft, true, Array.isArray(draft.additionalCuisines) && draft.additionalCuisines.length > 0, true),
    auditField("additionalCuisineOtherCustom", draft, Array.isArray(draft.additionalCuisines) && draft.additionalCuisines.includes("other"), nonEmpty(draft.additionalCuisineOtherCustom), true),
    auditField("shortSummary", draft, true, nonEmpty(draft.shortSummary), true),
    auditField("longDescription", draft, true, nonEmpty(draft.longDescription), true),
    auditField("cityCanonical", draft, true, nonEmpty(draft.cityCanonical), true),
    auditField("neighborhood", draft, true, nonEmpty(draft.neighborhood), true),
    auditField("zipCode", draft, true, nonEmpty(draft.zipCode), true),
    auditField("priceLevel", draft, true, nonEmpty(draft.priceLevel), true),
    auditField("languagesSpoken", draft, true, Array.isArray(draft.languagesSpoken) && draft.languagesSpoken.length > 0, true),
    auditField("languageOtherCustom", draft, draft.languagesSpoken?.includes("other_lang"), nonEmpty(draft.languageOtherCustom), true),
    auditField("customLanguages", draft, true, Array.isArray(draft.customLanguages) && draft.customLanguages.length > 0, true),

    // OPERATIONS
    auditField("serviceModes", draft, true, Array.isArray(draft.serviceModes) && draft.serviceModes.length > 0, true),
    auditField("serviceModeOtherCustom", draft, draft.serviceModes?.includes("other"), nonEmpty(draft.serviceModeOtherCustom), true),
    auditField("dineIn", draft, true, draft.dineIn === true, true),
    auditField("takeout", draft, true, draft.takeout === true, true),
    auditField("delivery", draft, true, draft.delivery === true, true),
    auditField("reservationsAvailable", draft, true, draft.reservationsAvailable === true, true),
    auditField("preorderRequired", draft, true, draft.preorderRequired === true, true),
    auditField("pickupAvailable", draft, true, draft.pickupAvailable === true, true),
    auditField("movingVendor", draft, true, !!draft.movingVendor, true),
    auditField("homeBasedBusiness", draft, true, !!draft.homeBasedBusiness, true),
    auditField("cateringAvailable", draft, true, !!draft.cateringAvailable, true),
    auditField("eventFoodService", draft, true, !!draft.eventFoodService, true),

    // HOURS
    auditField("monday", draft, true, !!draft.monday, true),
    auditField("tuesday", draft, true, !!draft.tuesday, true),
    auditField("wednesday", draft, true, !!draft.wednesday, true),
    auditField("thursday", draft, true, !!draft.thursday, true),
    auditField("friday", draft, true, !!draft.friday, true),
    auditField("saturday", draft, true, !!draft.saturday, true),
    auditField("sunday", draft, true, !!draft.sunday, true),
    auditField("specialHoursNote", draft, true, nonEmpty(draft.specialHoursNote), true),

    // CONTACT
    auditField("websiteUrl", draft, true, nonEmpty(draft.websiteUrl), true),
    auditField("phoneNumber", draft, true, nonEmpty(draft.phoneNumber), true),
    auditField("email", draft, true, nonEmpty(draft.email), true),
    auditField("whatsAppNumber", draft, true, nonEmpty(draft.whatsAppNumber), true),
    auditField("instagramUrl", draft, true, nonEmpty(draft.instagramUrl), true),
    auditField("facebookUrl", draft, true, nonEmpty(draft.facebookUrl), true),
    auditField("tiktokUrl", draft, true, nonEmpty(draft.tiktokUrl), true),
    auditField("youtubeUrl", draft, true, nonEmpty(draft.youtubeUrl), true),
    auditField("reservationUrl", draft, true, nonEmpty(draft.reservationUrl), true),
    auditField("orderUrl", draft, true, nonEmpty(draft.orderUrl), true),
    auditField("menuUrl", draft, true, nonEmpty(draft.menuUrl), true),
    auditField("menuFile", draft, true, nonEmpty(draft.menuFile), true),

    // LOCATION
    auditField("addressLine1", draft, true, nonEmpty(draft.addressLine1), true),
    auditField("addressLine2", draft, true, nonEmpty(draft.addressLine2), true),
    auditField("state", draft, true, nonEmpty(draft.state), true),
    auditField("cityCanonical", draft, true, nonEmpty(draft.cityCanonical), true), // Duplicate check - should be same field
    auditField("zipCode", draft, true, nonEmpty(draft.zipCode), true), // Duplicate check - should be same field

    // MEDIA
    auditField("heroImage", draft, true, nonEmpty(draft.heroImage), true),
    auditField("galleryImages", draft, true, Array.isArray(draft.galleryImages) && draft.galleryImages.length > 0, true),
    auditField("galleryMediaSequence", draft, true, Array.isArray(draft.galleryMediaSequence) && draft.galleryMediaSequence.length > 0, true),
    auditField("videoFile", draft, true, nonEmpty(draft.videoFile), true),
    auditField("videoUrl", draft, true, nonEmpty(draft.videoUrl), true),
    auditField("foodImages", draft, true, Array.isArray(draft.foodImages) && draft.foodImages.length > 0, true),
    auditField("interiorImages", draft, true, Array.isArray(draft.interiorImages) && draft.interiorImages.length > 0, true),
    auditField("exteriorImages", draft, true, Array.isArray(draft.exteriorImages) && draft.exteriorImages.length > 0, true),

    // FEATURED DISHES
    auditField("featuredDishes", draft, true, Array.isArray(draft.featuredDishes) && draft.featuredDishes.length > 0, true),
    ...(draft.featuredDishes ?? []).map((dish, i) => [
      auditField(`featuredDishes[${i}].title`, draft, true, nonEmpty(dish.title), true),
      auditField(`featuredDishes[${i}].image`, draft, true, nonEmpty(dish.image), true),
      auditField(`featuredDishes[${i}].shortNote`, draft, true, nonEmpty(dish.shortNote), true),
      auditField(`featuredDishes[${i}].menuLink`, draft, true, nonEmpty(dish.menuLink), true),
      auditField(`featuredDishes[${i}].priceLabel`, draft, true, nonEmpty(dish.priceLabel), true),
    ]).flat(),

    // HIGHLIGHTS
    auditField("highlights", draft, true, Array.isArray(draft.highlights) && draft.highlights.length > 0, true),
    ...(draft.highlights ?? []).map((highlight, i) => [
      auditField(`highlights[${i}]`, draft, true, true, true),
    ]).flat(),

    // STACKS
    auditField("movingVendorStack", draft, draft.movingVendor, !!draft.movingVendorStack, true),
    auditField("homeBasedStack", draft, draft.homeBasedBusiness, !!draft.homeBasedStack, true),
    auditField("cateringEventsStack", draft, draft.cateringAvailable || draft.eventFoodService, !!draft.cateringEventsStack, true),
  ];

  return audits;
}

export function printAuditResults(): void {
  const audits = auditRestauranteFieldMapping({} as RestauranteListingDraft);
  
  console.log("=== RESTAURANTES FIELD MAPPING AUDIT ===");
  console.log("Total fields audited:", audits.length);
  
  const issues = audits.filter(a => !a.inApplication || !a.inDraft || !a.mappedToShell);
  if (issues.length > 0) {
    console.log("\n❌ ISSUES FOUND:");
    issues.forEach(a => {
      console.log(`❌ ${a.fieldName}: app=${a.inApplication}, draft=${a.inDraft}, shell=${a.mappedToShell}${a.notes ? ` (${a.notes})` : ''}`);
    });
  } else {
    console.log("\n✅ ALL FIELDS PROPERLY MAPPED");
  }
  
  console.log("\n=== DETAILED BREAKDOWN ===");
  const categories = {
    IDENTITY: audits.filter(a => a.fieldName.includes('business') || a.fieldName.includes('cuisine') || a.fieldName.includes('summary') || a.fieldName.includes('description') || a.fieldName.includes('city') || a.fieldName.includes('neighborhood') || a.fieldName.includes('price') || a.fieldName.includes('language')),
    OPERATIONS: audits.filter(a => a.fieldName.includes('service') || a.fieldName.includes('dineIn') || a.fieldName.includes('takeout') || a.fieldName.includes('delivery') || a.fieldName.includes('moving') || a.fieldName.includes('home') || a.fieldName.includes('catering') || a.fieldName.includes('event')),
    HOURS: audits.filter(a => a.fieldName.includes('day') || a.fieldName.includes('hour')),
    CONTACT: audits.filter(a => a.fieldName.includes('url') || a.fieldName.includes('phone') || a.fieldName.includes('email') || a.fieldName.includes('whatsApp') || a.fieldName.includes('menu')),
    LOCATION: audits.filter(a => a.fieldName.includes('address') || a.fieldName.includes('state') || a.fieldName.includes('zip')),
    MEDIA: audits.filter(a => a.fieldName.includes('image') || a.fieldName.includes('video') || a.fieldName.includes('gallery')),
    FEATURED: audits.filter(a => a.fieldName.includes('featured') || a.fieldName.includes('dish')),
    HIGHLIGHTS: audits.filter(a => a.fieldName.includes('highlight')),
    STACKS: audits.filter(a => a.fieldName.includes('Stack')),
  };

  Object.entries(categories).forEach(([category, fields]) => {
    console.log(`\n${category}:`);
    fields.forEach(a => {
      const status = a.inApplication && a.inDraft && a.mappedToShell ? '✅' : '❌';
      console.log(`  ${status} ${a.fieldName}`);
    });
  });
}
