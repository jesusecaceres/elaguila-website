import { LEONIX_GLOBAL_LLC, LEONIX_MEDIA_SITE_NAME } from "@/app/lib/leonixBrand";
import type { DigitalContactProfile } from "./digitalContactTypes";

/**
 * Leonix Digital Contact Platform — profile registry.
 *
 * This module MUST stay free of any `server-only` import (directly or transitively).
 * Human Connection / Virtual Front Desk (presence, doorbell, video session, schedule
 * request, availability UI, `/visitanos`) import this registry from client components
 * and plain synchronous server code that predates the Executive Hub database layer.
 *
 * The Executive Hub DB-first lookup (`public.executives` in Supabase) lives in
 * `digitalContactExecutiveHubProfile.ts` instead — a separate `server-only` module used
 * only by Executive Contact / Executive Hub server code (the public contact page and its
 * API routes). Do not re-import that module (or `digitalContactExecutivesDb.ts`) here.
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
 * Synchronous, DB-free lookup — the ORIGINAL contract this registry has always exposed.
 * Human Connection / Virtual Front Desk (presence, doorbell, video session, schedule
 * request, availability UI) all call this synchronously and predate the Executive Hub
 * database layer. Keep this function synchronous and legacy-map-only so none of those
 * existing call sites (outside Executive Contact / Executive Hub scope) ever break.
 */
export function getDigitalContactProfile(slug: string): DigitalContactProfile | null {
  const key = String(slug ?? "").trim().toLowerCase();
  return legacyDigitalContactProfile(key);
}

export function listDigitalContactSlugs(): string[] {
  return Object.values(DIGITAL_CONTACT_PROFILES)
    .filter((p) => p.active)
    .map((p) => p.slug);
}

/** Active public profiles — consumers (e.g. Virtual Front Desk) must read from here, never duplicate. */
export function listActiveDigitalContactProfiles(): DigitalContactProfile[] {
  return Object.values(DIGITAL_CONTACT_PROFILES).filter((p) => p.active);
}
