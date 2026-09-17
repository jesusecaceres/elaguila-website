/**
 * Assisted Publishing (Gate 07) — ONE read-only projection of canonical Business Identity for
 * prefilling EMPTY fields in a real category application.
 *
 * Trace proved no such projection existed anywhere (the only business<->listing bridge,
 * business_listing_links, runs the opposite direction — it links an already-published listing).
 * This composes the EXISTING repositories (businesses / business_contacts /
 * business_service_areas / business_digital_profiles / business_custom_links /
 * business_profiles) into a neutral, category-agnostic shape. It is deliberately not a category
 * form type: each category's own seeder (e.g. serviciosPrefillFromBusinessContext.ts) maps this
 * into that category's existing draft store, and the EXISTING DRAFT ALWAYS WINS there.
 *
 * Privacy rules baked in here, not left to callers:
 *  - only `visibility='public'` contacts / custom links are projected (a contact the owner marked
 *    private must never be seeded into an application where it becomes public);
 *  - the street line is projected only when the primary service area's own
 *    `addressVisibility` is `public_exact`; `city_only`/`private` yield city/state only.
 * Nothing here writes back into Business Identity.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { getBusinessByIdForCurrentUser } from "@/app/lib/business/repositories/businessesRepo";
import { listContactsForBusiness } from "@/app/lib/business/repositories/contactsRepo";
import { listServiceAreasForBusiness } from "@/app/lib/business/repositories/serviceAreasRepo";
import { listDigitalProfilesForBusiness } from "@/app/lib/business/repositories/digitalProfilesRepo";
import { listCustomLinksForBusiness } from "@/app/lib/business/repositories/customLinksRepo";
import { getBusinessProfile } from "@/app/lib/business/profile/repository";

export type BusinessApplicationContext = {
  businessId: string;
  businessName: string;
  publicName: string | null;
  phone: string | null;
  phoneOffice: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  address: {
    street: string | null;
    unit: string | null;
    city: string | null;
    stateProvince: string | null;
    postalCode: string | null;
    country: string | null;
    /** True only when the owner's own address-visibility choice allows the exact street publicly. */
    exactStreetPublic: boolean;
  };
  serviceAreaText: string | null;
  /** Raw language strings exactly as stored on the business (e.g. "es", "en", "Portuguese"). */
  languages: readonly string[];
  socials: {
    instagram: string | null;
    facebook: string | null;
    youtube: string | null;
    tiktok: string | null;
    linkedin: string | null;
    x: string | null;
  };
  googleBusinessUrl: string | null;
  yelpUrl: string | null;
  bookingUrl: string | null;
  logoUrl: string | null;
  heroImageUrl: string | null;
  galleryUrls: readonly string[];
  aboutText: string | null;
  headline: string | null;
  highlights: readonly string[];
};

function firstNonEmpty(values: readonly (string | null | undefined)[]): string | null {
  for (const v of values) {
    const t = (v ?? "").trim();
    if (t) return t;
  }
  return null;
}

export async function buildBusinessApplicationContext(businessId: string): Promise<BusinessApplicationContext | null> {
  const admin = getAdminSupabase();
  const [business, contacts, serviceAreas, digitalProfiles, customLinks, profile] = await Promise.all([
    getBusinessByIdForCurrentUser(admin, businessId),
    listContactsForBusiness(admin, businessId),
    listServiceAreasForBusiness(admin, businessId),
    listDigitalProfilesForBusiness(admin, businessId),
    listCustomLinksForBusiness(admin, businessId),
    getBusinessProfile(businessId),
  ]);
  if (!business) return null;

  const publicContacts = contacts.filter((c) => c.visibility === "public");
  const phones = publicContacts.filter((c) => c.contactType === "phone");
  const primaryPhone = phones.find((c) => c.isPrimary && c.channelKind !== "whatsapp") ?? phones.find((c) => c.channelKind !== "whatsapp") ?? null;
  const officePhone = phones.find((c) => c !== primaryPhone && c.channelKind !== "whatsapp") ?? null;
  const whatsapp = phones.find((c) => c.channelKind === "whatsapp") ?? null;
  const email = publicContacts.find((c) => c.contactType === "email" && c.isPrimary) ?? publicContacts.find((c) => c.contactType === "email") ?? null;
  const website = publicContacts.find((c) => c.contactType === "website" && c.isPrimary) ?? publicContacts.find((c) => c.contactType === "website") ?? null;

  const primaryArea = serviceAreas.find((a) => a.isPrimary) ?? serviceAreas[0] ?? null;
  const d = primaryArea?.structuredDetails;
  const exactStreetPublic = d?.addressVisibility === "public_exact";
  const streetLine = exactStreetPublic ? firstNonEmpty([[d?.streetNumber, d?.streetName].filter(Boolean).join(" ")]) : null;
  const serviceAreaText = serviceAreas.find((a) => a.areaKind === "service_area_text")?.rawText?.trim() || null;

  const social = (platform: string) => digitalProfiles.find((p) => p.platform === platform)?.handleOrUrl?.trim() || null;
  const publicLinks = customLinks.filter((l) => l.visibility === "public");

  return {
    businessId: business.id,
    businessName: business.displayName,
    publicName: business.publicName,
    phone: primaryPhone?.value ?? null,
    phoneOffice: officePhone?.value ?? null,
    whatsapp: whatsapp?.value ?? null,
    email: email?.value ?? null,
    website: website?.value ?? null,
    address: {
      street: streetLine,
      unit: exactStreetPublic ? d?.unit?.trim() || null : null,
      city: firstNonEmpty([d?.city, d?.baseCity, primaryArea?.cityHint]),
      stateProvince: firstNonEmpty([d?.stateProvince, d?.baseStateProvince]),
      postalCode: exactStreetPublic ? firstNonEmpty([d?.postalCode, d?.basePostalCode]) : null,
      country: primaryArea?.country ?? null,
      exactStreetPublic,
    },
    serviceAreaText,
    languages: [business.businessPrimaryLanguage, ...business.businessAdditionalLanguages].filter((l): l is string => Boolean(l && l.trim())),
    socials: {
      instagram: social("instagram"),
      facebook: social("facebook"),
      youtube: social("youtube"),
      tiktok: social("tiktok"),
      linkedin: social("linkedin"),
      x: social("x"),
    },
    googleBusinessUrl: social("google_business"),
    yelpUrl: social("yelp"),
    bookingUrl: publicLinks.find((l) => l.linkType === "booking")?.displayUrl ?? null,
    logoUrl: profile?.logoUrl ?? null,
    heroImageUrl: profile?.heroImageUrl ?? null,
    galleryUrls: profile?.galleryImages ?? [],
    aboutText: profile?.aboutDescription ?? profile?.shortDescription ?? null,
    headline: profile?.headline ?? null,
    highlights: (profile?.featuredHighlights ?? []).map((h) => h.title).filter(Boolean),
  };
}
