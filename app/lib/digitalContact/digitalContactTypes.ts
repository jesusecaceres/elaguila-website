/**
 * Leonix Digital Contact Platform — shared types.
 *
 * A profile is pure data. New employees are onboarded by adding a registry entry
 * (see `digitalContactRegistry.ts`) — never by duplicating page/component code.
 */

export type DigitalContactSocialLink = {
  id: "facebook" | "instagram" | "linkedin" | "x" | "tiktok" | "youtube";
  url: string;
};

import type { ExecutiveThemeId } from "./digitalContactExecutiveTheme";
import type { ExecutiveConnectionDestinations } from "./humanConnection/channelTypes";

export type { ExecutiveThemeId };
export type { ExecutiveConnectionDestinations };

export type DigitalContactAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
};

/** Weekday keys for executive working-hours schedules (IANA-local day). */
export type ExecutiveDayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

/**
 * One weekday row. `open`/`close` are 24h `HH:mm` in the profile timezone.
 * End is exclusive: `[open, close)` — so `close: "17:00"` means outside starting at 17:00.
 */
export type ExecutiveDayHours = {
  day: ExecutiveDayKey;
  closed: boolean;
  /** Required when `closed` is false. */
  open?: string;
  /** Required when `closed` is false. Exclusive end. */
  close?: string;
};

/** Recurring executive contact hours — NOT Leonix business office hours (those stay VFD-owned). */
export type ExecutiveWorkingHours = {
  /** IANA timezone, e.g. `America/Los_Angeles`. */
  timezone: string;
  days: ExecutiveDayHours[];
};

/** Ephemeral live presence — requires expiration. Do not seed fake production values. */
export type ExecutiveTemporaryStatus = "available" | "busy" | "away";

export type ExecutiveTemporaryPresence = {
  status: ExecutiveTemporaryStatus;
  /** ISO-8601 timestamptz */
  setAt: string;
  /** ISO-8601 timestamptz — REQUIRED; forever-available is not allowed. */
  expiresAt: string;
};

/**
 * Time-bound public-routing absence (vacation / temporary leave).
 * Routing only — never store private HR / medical reasons here.
 */
export type ExecutiveAbsence = {
  enabled: boolean;
  /** ISO-8601 timestamptz — inclusive start */
  startAt: string;
  /** ISO-8601 timestamptz — exclusive end */
  endAt: string;
  /** Public-safe bilingual routing line only. */
  publicMessage?: { es: string; en: string };
  /** Optional absence-specific backup override (ECP slug). */
  backupRepresentativeSlug?: string | null;
};

/** Controls what derived availability language may appear publicly. Defaults toward privacy. */
export type ExecutivePublicAvailabilityPolicy = {
  /** When omitted and workingHours exist, treated as true. */
  showWorkingHours?: boolean;
  /**
   * When omitted, treated as false — never claim available/busy/away without explicit opt-in
   * plus a fresh temporary presence signal.
   */
  showAvailability?: boolean;
};

/** Build 04 extension stubs — default false; no calendar/video UI in Build 03. */
export type ExecutiveCapabilityFlags = {
  allowScheduling?: boolean;
  allowVideo?: boolean;
};

/**
 * Derived public availability state from `resolveExecutivePublicAvailability`.
 * Consumers must not invent parallel state machines.
 */
export type ExecutivePublicAvailabilityState =
  | "inactive"
  | "absent"
  | "outside_hours"
  | "within_hours"
  | "available"
  | "busy"
  | "away"
  | "unknown_schedule";

export type DigitalContactProfile = {
  /** URL segment — `/contact/{slug}` */
  slug: string;
  fullName: string;
  preferredName?: string;
  /** e.g. "Founder & CEO" */
  title: string;
  company: string;
  /** Legal parent entity for schema/trust copy. */
  legalEntity: string;
  phoneDisplay: string;
  /** E.164-ish digits used for tel:/sms:/wa.me — country code included, no plus/spaces. */
  phoneDigits: string;
  /** Optional distinct WhatsApp number; falls back to phoneDigits when absent. */
  whatsappDigits?: string;
  email: string;
  website: string;
  address: DigitalContactAddress;
  /** Absolute path under /public, or null to fall back to the Leonix crest. */
  photoPath: string | null;
  /** Short trust indicator chips shown in the hero (kept minimal — 2–4 max). */
  trustChips: string[];
  socials: DigitalContactSocialLink[];
  /**
   * Executive Theme — drives every brand color across the Contact Hub (gradient, CTA
   * buttons, accents, badges, glow) via CSS custom properties. Omit to use `leonix`
   * (Chuy's current profile). New executives are onboarded by declaring a theme id
   * here, never by duplicating component styling.
   */
  theme?: ExecutiveThemeId;
  /** Optional per-profile meta description override (falls back to a generated default). */
  metaDescription?: string;
  active: boolean;

  /** Optional recurring executive contact hours (ECP-owned; not VFD business office hours). */
  workingHours?: ExecutiveWorkingHours;
  /**
   * Optional live temporary presence. Production registry should leave this absent until an
   * authorized live-status write path exists. Tests/fixtures may supply values.
   */
  temporaryPresence?: ExecutiveTemporaryPresence | null;
  /** Optional time-bound public-routing absence. */
  absence?: ExecutiveAbsence | null;
  /** Durable ECP slug of one backup representative — resolve dynamically; never copy contact fields. */
  backupRepresentativeSlug?: string | null;
  /** Public disclosure policy for hours / live availability language. */
  publicAvailabilityPolicy?: ExecutivePublicAvailabilityPolicy;
  /** Future scheduling/video capability stubs (default false). */
  capabilities?: ExecutiveCapabilityFlags;
  /**
   * Optional approved destinations for channels not already represented by phone/email/WhatsApp fields.
   * Do NOT invent FaceTime / Meet URLs. Leave absent when unapproved.
   */
  connectionDestinations?: ExecutiveConnectionDestinations | null;
};

export type DigitalContactShowcaseItem = {
  id: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  href: string;
};

export type DigitalContactHowMetOption = {
  id: string;
  labelEs: string;
  labelEn: string;
};

export type DigitalContactLang = "es" | "en";
