import { LEONIX_GLOBAL_LLC, LEONIX_MEDIA_SITE_NAME } from "@/app/lib/leonixBrand";
import type { DigitalContactProfile } from "./digitalContactTypes";
import { dbGetPublishedExecutiveProfile, dbListPublishedExecutiveSlugs } from "./digitalContactExecutivesDb";

/**
 * Leonix Digital Contact Platform — profile registry (EXEC-HUB-02 Real Database Foundation).
 *
 * `/contact/[slug]` now reads with this priority:
 *   1. `public.executives` (Supabase) — the real, admin-managed record, published only.
 *   2. This hardcoded map — legacy fallback so `/contact/chuy` and `/contact/isaias` keep
 *      working while they have not yet been recreated as real Executive Hub records.
 *
 * Onboarding a brand-new executive going forward should happen in the Executive Hub admin
 * UI (writes to Supabase), not by editing this file. This map only exists for migration
 * continuity and will shrink over time as executives are recreated in the real table.
 *
 * Build 03 availability fields (workingHours, temporaryPresence, absence,
 * backupRepresentativeSlug, publicAvailabilityPolicy, capabilities) are OPTIONAL.
 * Do NOT invent executive schedules, vacation, backup relationships, or live presence
 * without owner-approved truth. Unknown/absent config is a valid fail-safe state —
 * consumers use resolveExecutivePublicAvailability and fall back to contact CTAs.
 */
const DIGITAL_CONTACT_PROFILES: Record<string, DigitalContactProfile> = {
  chuy: {
    slug: "chuy",
    fullName: 'Jesus "Chuy" Cáceres',
    preferredName: "Chuy",
    title: "Founder & Steward · Fundador y Administrador",
    company: LEONIX_MEDIA_SITE_NAME,
    legalEntity: LEONIX_GLOBAL_LLC,
    phoneDisplay: "(669) 366-4300",
    phoneDigits: "16693664300",
    /** Explicit business WhatsApp (same approved digits as phone). */
    whatsappDigits: "16693664300",
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
    /** Build 05 — owner-approved V1 Human Connection operational settings. */
    workingHours: {
      timezone: "America/Los_Angeles",
      days: [
        { day: "mon", closed: false, open: "09:00", close: "17:00" },
        { day: "tue", closed: false, open: "09:00", close: "17:00" },
        { day: "wed", closed: false, open: "09:00", close: "17:00" },
        { day: "thu", closed: false, open: "09:00", close: "17:00" },
        { day: "fri", closed: false, open: "09:00", close: "17:00" },
        { day: "sat", closed: true },
        { day: "sun", closed: true },
      ],
    },
    publicAvailabilityPolicy: {
      showWorkingHours: true,
      showAvailability: true,
    },
    capabilities: {
      allowVideo: true,
      allowScheduling: true,
    },
    /**
     * Build 09C/10 — owner-approved destinations (ECP only).
     * Google Meet = video room (not a guaranteed ringing call).
     * Do not invent Messenger / Instagram / Teams / FaceTime without owner approval.
     */
    connectionDestinations: {
      googleMeetUrl: "https://meet.google.com/hdd-xkzj-npj",
    },
    // No backupRepresentativeSlug — owner did not approve one.
    // No temporaryPresence — staff must activate via /admin/digital-contact/presence.
    // No absence — do not invent.
  },
  isaias: {
    slug: "isaias",
    fullName: "Isaias Cáceres",
    preferredName: "Isaias",
    title: "Business Development Executive",
    company: LEONIX_MEDIA_SITE_NAME,
    legalEntity: LEONIX_GLOBAL_LLC,
    phoneDisplay: "(408) 704-0204",
    phoneDigits: "14087040204",
    email: "isaias@leonixmedia.com",
    website: "https://leonixmedia.com",
    address: {
      line1: "871 Coleman Ave",
      line2: "Suite 201",
      city: "San Jose",
      state: "CA",
      postalCode: "95110",
      country: "US",
    },
    // No approved headshot yet — falls back to the Leonix crest, same as every other
    // profile without a photo. Swap in a real path here once one is provided.
    photoPath: null,
    trustChips: ["Leonix Global LLC", "San Jose, CA", "Que Ruja El León"],
    // No confidently-identified public social profile for this specific person at Leonix
    // Media was found — left empty rather than guessing (per onboarding policy).
    socials: [],
    theme: "warfitness",
    active: true,
  },
};

function legacyDigitalContactProfile(slug: string): DigitalContactProfile | null {
  const key = String(slug ?? "").trim().toLowerCase();
  const profile = DIGITAL_CONTACT_PROFILES[key];
  if (!profile || !profile.active) return null;
  return profile;
}

/**
 * Read priority: 1) real Executive Hub record (published), 2) legacy registry fallback.
 * Guarantees /contact/chuy and /contact/isaias keep working during migration while any
 * newly-created (or newly-published) executive record immediately takes over its slug.
 */
export async function getDigitalContactProfile(slug: string): Promise<DigitalContactProfile | null> {
  const key = String(slug ?? "").trim().toLowerCase();
  const fromDb = await dbGetPublishedExecutiveProfile(key);
  if (fromDb) return fromDb;
  return legacyDigitalContactProfile(key);
}

export async function listDigitalContactSlugs(): Promise<string[]> {
  const dbSlugs = await dbListPublishedExecutiveSlugs();
  const legacySlugs = Object.values(DIGITAL_CONTACT_PROFILES)
    .filter((p) => p.active)
    .map((p) => p.slug);
  return Array.from(new Set([...dbSlugs, ...legacySlugs]));
}

/** Active public profiles — consumers (e.g. Virtual Front Desk) must read from here, never duplicate. */
export function listActiveDigitalContactProfiles(): DigitalContactProfile[] {
  return Object.values(DIGITAL_CONTACT_PROFILES).filter((p) => p.active);
}
