import { LEONIX_GLOBAL_LLC, LEONIX_MEDIA_SITE_NAME } from "@/app/lib/leonixBrand";
import type { DigitalContactProfile } from "./digitalContactTypes";

/**
 * Leonix Digital Contact Platform — profile registry.
 *
 * This is the ONLY place employee contact data lives. `/contact/[slug]` reads from here;
 * onboarding a new employee means adding an entry, never duplicating page code. When this
 * moves to Admin, this map becomes the seed/fallback data source for the same shape.
 */
const DIGITAL_CONTACT_PROFILES: Record<string, DigitalContactProfile> = {
  chuy: {
    slug: "chuy",
    fullName: 'Jesus "Chuy" Cáceres',
    preferredName: "Chuy",
    title: "Founder & CEO",
    company: LEONIX_MEDIA_SITE_NAME,
    legalEntity: LEONIX_GLOBAL_LLC,
    phoneDisplay: "(669) 366-4300",
    phoneDigits: "16693664300",
    email: "chuy@leonixmedia.com",
    website: "https://www.leonixmedia.com",
    address: {
      line1: "871 Coleman Ave",
      line2: "Suite 201",
      city: "San Jose",
      state: "CA",
      postalCode: "95110",
      country: "US",
    },
    photoPath: null,
    trustChips: ["Leonix Global LLC", "San Jose, CA", "Que Ruja El León"],
    socials: [],
    active: true,
  },
};

export function getDigitalContactProfile(slug: string): DigitalContactProfile | null {
  const key = String(slug ?? "").trim().toLowerCase();
  const profile = DIGITAL_CONTACT_PROFILES[key];
  if (!profile || !profile.active) return null;
  return profile;
}

export function listDigitalContactSlugs(): string[] {
  return Object.values(DIGITAL_CONTACT_PROFILES)
    .filter((p) => p.active)
    .map((p) => p.slug);
}
