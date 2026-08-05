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

export type { ExecutiveThemeId };

export type DigitalContactAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
};

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
