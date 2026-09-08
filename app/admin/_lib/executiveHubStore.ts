/**
 * Executive Hub — real persistence (EXEC-HUB-02 Real Database Foundation).
 *
 * Replaces the temporary in-memory `Map` from Foundation V1. Every record now lives in the
 * `public.executives` Supabase table (see `supabase/migrations/20260810120000_executive_hub_executives.sql`),
 * read/written exclusively through `app/lib/digitalContact/digitalContactExecutivesDb.ts` — the ONE
 * source of truth shared with the public `/contact/[slug]` read path (`digitalContactRegistry.ts`).
 *
 * No in-memory store. No second storage system. No temporary adapters.
 */
import "server-only";

import type { DigitalContactAddress, DigitalContactProfile, DigitalContactSocialLink } from "@/app/lib/digitalContact/digitalContactTypes";
import type { ExecutiveThemeId } from "@/app/lib/digitalContact/digitalContactExecutiveTheme";
import {
  dbListExecutiveHubRecords,
  dbGetExecutiveHubRecord,
  dbCreateExecutiveHubRecord,
  dbUpdateExecutiveHubRecord,
  dbSetExecutiveHubStatus,
  slugifyExecutive,
  type ExecutiveDbResult,
} from "@/app/lib/digitalContact/digitalContactExecutivesDb";
import { emptyCommunityWeeklySchedule } from "@/app/(site)/publicar/community/shared/lib/communityWeeklySchedule";
import type { DayHoursRow } from "@/app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import type { ExecutiveHubRecord, ExecutiveHubStatus } from "./executiveHubTypes";

/** Same shape as `ExecutiveDbResult` — aliased for admin-layer readability, not redefined. */
export type SaveExecutiveHubResult = ExecutiveDbResult;

/** True when Supabase is not configured or the query failed — surfaced by the list page as a warning. */
export async function listExecutiveHubRecords(): Promise<{ records: ExecutiveHubRecord[]; unavailable: boolean }> {
  const { rows, unavailable } = await dbListExecutiveHubRecords();
  return { records: rows, unavailable };
}

export async function getExecutiveHubRecord(slug: string): Promise<ExecutiveHubRecord | null> {
  return dbGetExecutiveHubRecord(slug);
}

export async function createExecutiveHubRecord(input: {
  slug: string;
  fullName: string;
  preferredName?: string;
  title: string;
  company: string;
  legalEntity: string;
  phoneDisplay: string;
  phoneDigits: string;
  whatsappDigits?: string;
  email: string;
  website: string;
  address: DigitalContactAddress;
  photoPath?: string | null;
  logoPath?: string | null;
  coverPath?: string | null;
  bio?: string;
  languages?: string[];
  businessHubLink?: string;
  connectionHubLink?: string;
  trustChips?: string[];
  socials?: DigitalContactSocialLink[];
  theme?: ExecutiveThemeId;
  workingHours?: DayHoursRow[];
  notes?: string;
  metaDescription?: string;
  status?: ExecutiveHubStatus;
}): Promise<SaveExecutiveHubResult> {
  const slug = slugifyExecutive(input.slug || input.fullName);
  const record: Omit<ExecutiveHubRecord, "createdAt" | "updatedAt"> = {
    slug,
    fullName: input.fullName.trim(),
    preferredName: input.preferredName?.trim() || undefined,
    title: input.title.trim(),
    company: input.company.trim(),
    legalEntity: input.legalEntity.trim(),
    phoneDisplay: input.phoneDisplay,
    phoneDigits: input.phoneDigits,
    whatsappDigits: input.whatsappDigits ?? "",
    email: input.email.trim(),
    website: input.website.trim(),
    address: { ...input.address },
    photoPath: input.photoPath ?? null,
    logoPath: input.logoPath ?? null,
    coverPath: input.coverPath ?? null,
    bio: input.bio ?? "",
    languages: input.languages ?? [],
    businessHubLink: input.businessHubLink ?? "",
    connectionHubLink: input.connectionHubLink ?? "",
    trustChips: input.trustChips ?? [],
    socials: input.socials ?? [],
    theme: input.theme ?? "leonix",
    workingHours: input.workingHours ?? emptyCommunityWeeklySchedule(),
    notes: input.notes ?? "",
    metaDescription: input.metaDescription ?? "",
    status: input.status ?? "draft",
  };
  return dbCreateExecutiveHubRecord(record);
}

export async function updateExecutiveHubRecord(
  slug: string,
  patch: Partial<Omit<ExecutiveHubRecord, "slug" | "createdAt" | "updatedAt">>
): Promise<SaveExecutiveHubResult> {
  return dbUpdateExecutiveHubRecord(slug, patch);
}

export async function setExecutiveHubStatus(slug: string, status: ExecutiveHubStatus): Promise<SaveExecutiveHubResult> {
  return dbSetExecutiveHubStatus(slug, status);
}

/** Soft delete — archiving hides a record from the public read path while keeping it recoverable. */
export async function deleteExecutiveHubRecord(slug: string): Promise<SaveExecutiveHubResult> {
  return dbSetExecutiveHubStatus(slug, "archived");
}

/** Converts an admin record into the exact public profile shape, for Preview — `active` is derived from `status`. */
export function executiveHubRecordToProfile(record: ExecutiveHubRecord): DigitalContactProfile {
  return {
    slug: record.slug,
    fullName: record.fullName,
    preferredName: record.preferredName,
    title: record.title,
    company: record.company,
    legalEntity: record.legalEntity,
    phoneDisplay: record.phoneDisplay,
    phoneDigits: record.phoneDigits,
    whatsappDigits: record.whatsappDigits || undefined,
    email: record.email,
    website: record.website,
    address: record.address,
    photoPath: record.photoPath,
    trustChips: record.trustChips,
    socials: record.socials,
    theme: record.theme,
    metaDescription: record.metaDescription || undefined,
    active: record.status === "published",
  };
}
