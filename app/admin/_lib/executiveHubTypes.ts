/**
 * Executive Hub — admin data model (EXEC-HUB-01 Foundation V1).
 *
 * Extends the public `DigitalContactProfile` shape (see `app/lib/digitalContact/digitalContactTypes.ts`)
 * with admin-only fields (bio, languages, working hours, publish status, notes, external links).
 * Nothing here is Leonix-specific — every field is per-record data, so this same shape can back a
 * future client's executives without any type or component changes (Gate 8).
 */
import type {
  DigitalContactAddress,
  DigitalContactSocialLink,
  ExecutiveThemeId,
} from "@/app/lib/digitalContact/digitalContactTypes";
import type { DayHoursRow } from "@/app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";

/** Draft → Published → Suspended / Archived. Mirrors proven Leonix admin publish patterns (e.g. restaurantes listing status). */
export type ExecutiveHubStatus = "draft" | "published" | "suspended" | "archived";

export const EXECUTIVE_HUB_STATUSES: ExecutiveHubStatus[] = ["draft", "published", "suspended", "archived"];

export function executiveHubStatusLabel(status: ExecutiveHubStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "published":
      return "Published";
    case "suspended":
      return "Suspended";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}

export type ExecutiveHubRecord = {
  slug: string;
  fullName: string;
  preferredName?: string;
  title: string;
  company: string;
  legalEntity: string;
  phoneDisplay: string;
  phoneDigits: string;
  whatsappDigits: string;
  email: string;
  website: string;
  address: DigitalContactAddress;
  photoPath: string | null;
  logoPath: string | null;
  coverPath: string | null;
  bio: string;
  languages: string[];
  /** Plain link to a Business Hub record — association only, no functional integration (locked system). */
  businessHubLink: string;
  /** Plain link to a Connection Hub record — association only, no functional integration (locked system). */
  connectionHubLink: string;
  trustChips: string[];
  socials: DigitalContactSocialLink[];
  theme: ExecutiveThemeId;
  workingHours: DayHoursRow[];
  notes: string;
  metaDescription: string;
  status: ExecutiveHubStatus;
  createdAt: string;
  updatedAt: string;
};

export type ExecutiveHubFormInput = {
  slug: string;
  fullName: string;
  preferredName: string;
  title: string;
  company: string;
  legalEntity: string;
  phoneDisplay: string;
  phoneDigits: string;
  whatsappDigits: string;
  email: string;
  website: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  photoPath: string;
  logoPath: string;
  coverPath: string;
  bio: string;
  languages: string;
  businessHubLink: string;
  connectionHubLink: string;
  trustChips: string;
  socialFacebook: string;
  socialInstagram: string;
  socialLinkedin: string;
  socialX: string;
  socialTiktok: string;
  socialYoutube: string;
  theme: string;
  status: string;
  workingHoursJson: string;
  notes: string;
  metaDescription: string;
};
