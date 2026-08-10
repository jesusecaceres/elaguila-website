"use server";

/**
 * Executive Hub — server actions (EXEC-HUB-02 Real Database Foundation).
 * Mirrors the existing `adminTeamActions.ts` pattern: cookie + roster-permission gate,
 * plain `FormData` parsing, redirect-based feedback. Writes persist to the `public.executives`
 * Supabase table via `executiveHubStore` — the same table the public read path checks first.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import {
  createExecutiveHubRecord,
  updateExecutiveHubRecord,
  setExecutiveHubStatus,
} from "@/app/admin/_lib/executiveHubStore";
import type { DigitalContactSocialLink } from "@/app/lib/digitalContact/digitalContactTypes";
import type { ExecutiveThemeId } from "@/app/lib/digitalContact/digitalContactExecutiveTheme";
import { EXECUTIVE_HUB_STATUSES, type ExecutiveHubStatus } from "@/app/admin/_lib/executiveHubTypes";
import type { DayHoursRow } from "@/app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { emptyCommunityWeeklySchedule } from "@/app/(site)/publicar/community/shared/lib/communityWeeklySchedule";
import {
  searchBusinessHub,
  getBusinessHubByReference,
  type BusinessHubSearchResult,
  type BusinessHubSummary,
} from "@/app/admin/_components/executiveHub/businessHubAdapter";

const THEME_IDS = new Set<string>(["leonix", "warfitness", "realestate", "restaurant", "partner"]);
const STATUS_SET = new Set<string>(EXECUTIVE_HUB_STATUSES);

async function assertExecutiveHubAdmin(): Promise<void> {
  await requireLeonixAdminPermission("can_manage_team");
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

function csvList(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseTheme(raw: string): ExecutiveThemeId {
  return (THEME_IDS.has(raw) ? raw : "leonix") as ExecutiveThemeId;
}

function parseStatus(raw: string): ExecutiveHubStatus {
  return (STATUS_SET.has(raw) ? raw : "draft") as ExecutiveHubStatus;
}

function parseWorkingHours(raw: string): DayHoursRow[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== 7) return emptyCommunityWeeklySchedule();
    return parsed.map((row: Partial<DayHoursRow>, i) => ({
      day: (row.day as DayHoursRow["day"]) ?? emptyCommunityWeeklySchedule()[i]!.day,
      closed: Boolean(row.closed),
      open: String(row.open ?? ""),
      close: String(row.close ?? ""),
    }));
  } catch {
    return emptyCommunityWeeklySchedule();
  }
}

function buildSocials(f: FormData): DigitalContactSocialLink[] {
  const map: { id: DigitalContactSocialLink["id"]; field: string }[] = [
    { id: "facebook", field: "socialFacebook" },
    { id: "instagram", field: "socialInstagram" },
    { id: "linkedin", field: "socialLinkedin" },
    { id: "x", field: "socialX" },
    { id: "tiktok", field: "socialTiktok" },
    { id: "youtube", field: "socialYoutube" },
  ];
  const out: DigitalContactSocialLink[] = [];
  for (const { id, field } of map) {
    const url = str(f, field);
    if (url) out.push({ id, url });
  }
  return out;
}

function readCommonFields(formData: FormData) {
  return {
    fullName: str(formData, "fullName"),
    preferredName: str(formData, "preferredName"),
    title: str(formData, "title"),
    company: str(formData, "company"),
    legalEntity: str(formData, "legalEntity"),
    phoneDisplay: str(formData, "phoneDisplay"),
    phoneDigits: str(formData, "phoneDigits"),
    whatsappDigits: str(formData, "whatsappDigits"),
    email: str(formData, "email"),
    website: str(formData, "website"),
    address: {
      line1: str(formData, "addressLine1"),
      line2: str(formData, "addressLine2") || undefined,
      city: str(formData, "city"),
      state: str(formData, "state"),
      postalCode: str(formData, "postalCode"),
      country: "US",
    },
    photoPath: str(formData, "photoPath") || null,
    logoPath: str(formData, "logoPath") || null,
    coverPath: str(formData, "coverPath") || null,
    bio: str(formData, "bio"),
    languages: csvList(str(formData, "languages")),
    businessHubLink: str(formData, "businessHubLink"),
    connectionHubLink: str(formData, "connectionHubLink"),
    trustChips: csvList(str(formData, "trustChips")),
    socials: buildSocials(formData),
    theme: parseTheme(str(formData, "theme")),
    workingHours: parseWorkingHours(str(formData, "workingHoursJson")),
    notes: str(formData, "notes"),
    metaDescription: str(formData, "metaDescription"),
    status: parseStatus(str(formData, "status")),
  };
}

export async function createExecutiveHubAction(formData: FormData): Promise<void> {
  await assertExecutiveHubAdmin();
  const slug = str(formData, "slug");
  const common = readCommonFields(formData);

  if (!common.fullName || !slug) {
    redirect("/admin/team/executive-hub/new?error=missing_fields");
  }

  const result = await createExecutiveHubRecord({ slug, ...common });
  if (!result.ok) {
    redirect(`/admin/team/executive-hub/new?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/admin/team/executive-hub");
  revalidatePath(`/contact/${result.slug}`);
  redirect(`/admin/team/executive-hub/${result.slug}/edit?saved=1`);
}

export async function updateExecutiveHubAction(formData: FormData): Promise<void> {
  await assertExecutiveHubAdmin();
  const slug = str(formData, "slug");
  if (!slug) redirect("/admin/team/executive-hub?error=missing_slug");

  const common = readCommonFields(formData);
  const result = await updateExecutiveHubRecord(slug, common);
  if (!result.ok) {
    redirect(`/admin/team/executive-hub/${slug}/edit?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/admin/team/executive-hub");
  revalidatePath(`/admin/team/executive-hub/${slug}/preview`);
  revalidatePath(`/contact/${slug}`);
  redirect(`/admin/team/executive-hub/${slug}/edit?saved=1`);
}

/**
 * Business Hub search — Gate 1/2. Admin-gated pass-through to the adapter; kept in this
 * server action file (not exposed as a public API route) so the "no fake results" contract
 * lives in one reviewable place. Always returns the adapter's honest result.
 */
export async function searchBusinessHubAction(query: string): Promise<BusinessHubSearchResult> {
  await assertExecutiveHubAdmin();
  return searchBusinessHub(query);
}

export async function getBusinessHubByReferenceAction(reference: string): Promise<BusinessHubSummary | null> {
  await assertExecutiveHubAdmin();
  if (!reference.trim()) return null;
  return getBusinessHubByReference(reference);
}

export async function setExecutiveHubStatusAction(formData: FormData): Promise<void> {
  await assertExecutiveHubAdmin();
  const slug = str(formData, "slug");
  const status = parseStatus(str(formData, "status"));
  if (!slug) redirect("/admin/team/executive-hub?error=missing_slug");

  const result = await setExecutiveHubStatus(slug, status);
  if (!result.ok) {
    redirect(`/admin/team/executive-hub?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/admin/team/executive-hub");
  revalidatePath(`/admin/team/executive-hub/${slug}/preview`);
  revalidatePath(`/contact/${slug}`);
  redirect("/admin/team/executive-hub?status_saved=1");
}
