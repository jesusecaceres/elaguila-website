"use server";

/**
 * Recursos Data OS — admin server actions (Build 02, Gate 6/7/8/9).
 * Mirrors the existing `executiveHubActions.ts` pattern: cookie + roster-permission gate, plain
 * `FormData` parsing, redirect-based feedback. Writes persist to `public.community_resources`
 * via `communityResourcesDb.ts` — the exact table Build 03's public read path will consume.
 */
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { getAdminOperatorEmailFromCookies } from "@/app/lib/supabase/adminSession";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import {
  dbCreateCommunityResource,
  dbGetCommunityResourceById,
  dbSetCommunityResourceActive,
  dbSetCommunityResourceVerificationStatus,
  dbUpdateCommunityResource,
  type CommunityResourceInput,
} from "@/app/lib/recursos/server/communityResourcesDb";
import { addDaysIso, DEFAULT_VERIFICATION_REVIEW_DAYS } from "@/app/lib/recursos/verificationStatus";
import { validateResourceForVerification } from "@/app/lib/recursos/urgentResourceValidation";
import type {
  AudienceTag,
  CostModel,
  OrganizationType,
  PartnerStatus,
  PrimaryCategorySlug,
  SecondaryTag,
  UrgencyLevel,
  VerificationStatus,
} from "@/app/lib/recursos/types";
import { PRIMARY_CATEGORIES } from "@/app/lib/recursos/categories";
import { URGENCY_LEVELS } from "@/app/lib/recursos/urgency";

async function assertRecursosAdmin(): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");
}

async function currentActorEmail(): Promise<string | null> {
  const c = await cookies();
  return getAdminOperatorEmailFromCookies(c);
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

function optStr(f: FormData, k: string): string | null {
  const v = str(f, k);
  return v ? v : null;
}

function numOrNull(f: FormData, k: string): number | null {
  const v = str(f, k);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function checked(f: FormData, k: string): boolean {
  return f.get(k) === "on" || f.get(k) === "true";
}

function csvList(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

const CATEGORY_SET = new Set<string>(PRIMARY_CATEGORIES.map((c) => c.slug));
const URGENCY_SET = new Set<string>(URGENCY_LEVELS.map((u) => u.level));
const ORG_TYPE_SET = new Set<OrganizationType>([
  "nonprofit",
  "government",
  "faith-based",
  "school-district",
  "healthcare",
  "community-clinic",
  "hotline",
  "other",
]);
const COST_MODEL_SET = new Set<CostModel>(["free", "low_cost", "eligibility_based", "unknown"]);
const PARTNER_STATUS_SET = new Set<PartnerStatus>(["none", "listed", "partner", "founding-partner"]);
const VERIFICATION_STATUS_SET = new Set<VerificationStatus>(["verified", "needs_review", "stale", "inactive"]);

function readCommonFields(formData: FormData): Omit<CommunityResourceInput, "slug"> {
  const primaryCategory = str(formData, "primaryCategory");
  const urgencyLevel = str(formData, "urgencyLevel");
  const organizationType = str(formData, "organizationType");
  const costModel = str(formData, "costModel");
  const partnerStatus = str(formData, "partnerStatus");
  const verificationStatus = str(formData, "verificationStatus");

  return {
    organizationName: str(formData, "organizationName"),
    programName: optStr(formData, "programName"),
    organizationType: (ORG_TYPE_SET.has(organizationType as OrganizationType) ? organizationType : "other") as OrganizationType,
    shortDescriptionEs: str(formData, "shortDescriptionEs"),
    shortDescriptionEn: str(formData, "shortDescriptionEn"),
    detailsEs: optStr(formData, "detailsEs"),
    detailsEn: optStr(formData, "detailsEn"),
    primaryCategory: (CATEGORY_SET.has(primaryCategory) ? primaryCategory : "community-support") as PrimaryCategorySlug,
    secondaryCategories: csvList(str(formData, "secondaryCategories")) as SecondaryTag[],
    urgencyLevel: (URGENCY_SET.has(urgencyLevel) ? urgencyLevel : "i-need-help") as UrgencyLevel,
    ageMin: numOrNull(formData, "ageMin"),
    ageMax: numOrNull(formData, "ageMax"),
    audienceTags: csvList(str(formData, "audienceTags")) as AudienceTag[],
    serviceTags: csvList(str(formData, "serviceTags")),
    languages: csvList(str(formData, "languages")),
    costModel: (COST_MODEL_SET.has(costModel as CostModel) ? costModel : "unknown") as CostModel,
    eligibilityEs: optStr(formData, "eligibilityEs"),
    eligibilityEn: optStr(formData, "eligibilityEn"),
    serviceArea: optStr(formData, "serviceArea"),
    contact: {
      phone: optStr(formData, "phone"),
      crisisPhone: optStr(formData, "crisisPhone"),
      sms: optStr(formData, "sms"),
      whatsapp: optStr(formData, "whatsapp"),
      email: optStr(formData, "email"),
      websiteUrl: optStr(formData, "websiteUrl"),
      applicationUrl: optStr(formData, "applicationUrl"),
      address:
        str(formData, "addressLine1") || str(formData, "addressCity") || checked(formData, "addressWithheldForSafety")
          ? {
              line1: optStr(formData, "addressLine1"),
              line2: optStr(formData, "addressLine2"),
              city: optStr(formData, "addressCity"),
              state: optStr(formData, "addressState"),
              zip: optStr(formData, "addressZip"),
              addressWithheldForSafety: checked(formData, "addressWithheldForSafety"),
            }
          : null,
      mapsSearchHref: optStr(formData, "mapsSearchHref"),
      hoursNoteEs: optStr(formData, "hoursNoteEs"),
      hoursNoteEn: optStr(formData, "hoursNoteEn"),
      weeklyHours: [],
      is24Hours: checked(formData, "is24Hours"),
    },
    verification: {
      officialSourceUrl: optStr(formData, "officialSourceUrl"),
      lastVerifiedAt: optStr(formData, "lastVerifiedAt"),
      nextVerificationAt: optStr(formData, "nextVerificationAt"),
      verificationStatus: (VERIFICATION_STATUS_SET.has(verificationStatus as VerificationStatus)
        ? verificationStatus
        : "needs_review") as VerificationStatus,
      active: checked(formData, "active"),
    },
    internal: {
      partnerStatus: (PARTNER_STATUS_SET.has(partnerStatus as PartnerStatus) ? partnerStatus : "none") as PartnerStatus,
      featured: checked(formData, "featured"),
      printEligible: checked(formData, "printEligible"),
      internalNotes: optStr(formData, "internalNotes"),
    },
  };
}

export async function createRecursoAction(formData: FormData): Promise<void> {
  await assertRecursosAdmin();
  const slug = str(formData, "slug");
  const common = readCommonFields(formData);

  if (!common.organizationName || !slug) {
    redirect("/admin/recursos/nuevo?error=missing_fields");
  }

  const actor = await currentActorEmail();
  const result = await dbCreateCommunityResource({ slug, ...common }, actor);
  if (!result.ok) {
    redirect(`/admin/recursos/nuevo?error=${encodeURIComponent(result.error)}`);
  }

  auditAdminWrite("recurso_created", "community_resource", result.id, {
    slug: result.slug,
    primaryCategory: common.primaryCategory,
    urgencyLevel: common.urgencyLevel,
    actorEmail: actor,
  });
  revalidatePath("/admin/recursos");
  redirect(`/admin/recursos/${result.id}?saved=1`);
}

export async function updateRecursoAction(formData: FormData): Promise<void> {
  await assertRecursosAdmin();
  const id = str(formData, "id");
  if (!id) redirect("/admin/recursos?error=missing_id");

  const slug = str(formData, "slug");
  const common = readCommonFields(formData);
  const actor = await currentActorEmail();
  const result = await dbUpdateCommunityResource(id, { slug, ...common }, actor);
  if (!result.ok) {
    redirect(`/admin/recursos/${id}?error=${encodeURIComponent(result.error)}`);
  }

  auditAdminWrite("recurso_updated", "community_resource", id, {
    slug: result.slug,
    primaryCategory: common.primaryCategory,
    urgencyLevel: common.urgencyLevel,
    actorEmail: actor,
  });
  revalidatePath("/admin/recursos");
  revalidatePath(`/admin/recursos/${id}`);
  redirect(`/admin/recursos/${id}?saved=1`);
}

export async function setResourceActiveAction(formData: FormData): Promise<void> {
  await assertRecursosAdmin();
  const id = str(formData, "id");
  const active = str(formData, "active") === "true";
  if (!id) redirect("/admin/recursos?error=missing_id");

  const actor = await currentActorEmail();
  const result = await dbSetCommunityResourceActive(id, active, actor);
  if (!result.ok) {
    redirect(`/admin/recursos?error=${encodeURIComponent(result.error)}`);
  }

  auditAdminWrite(active ? "recurso_activated" : "recurso_deactivated", "community_resource", id, { actorEmail: actor });
  revalidatePath("/admin/recursos");
  revalidatePath(`/admin/recursos/${id}`);
  redirect("/admin/recursos?status_saved=1");
}

/**
 * Verification workflow — Gate 5/8. Marking a record `verified` requires it to pass
 * `validateResourceForVerification()` (official source + actionable contact, stricter for
 * `help-now`); any other status transition (`needs_review`/`stale`/`inactive`) is unconditional.
 */
export async function setVerificationStatusAction(formData: FormData): Promise<void> {
  await assertRecursosAdmin();
  const id = str(formData, "id");
  const nextStatus = str(formData, "verificationStatus") as VerificationStatus;
  if (!id || !VERIFICATION_STATUS_SET.has(nextStatus)) redirect("/admin/recursos?error=invalid_verification_request");

  const record = await dbGetCommunityResourceById(id);
  if (!record) redirect("/admin/recursos?error=resource_not_found");

  if (nextStatus === "verified") {
    const check = validateResourceForVerification(record!);
    if (!check.ok) {
      redirect(`/admin/recursos/${id}?error=${encodeURIComponent(check.errors.join(" "))}`);
    }
  }

  const now = new Date().toISOString();
  const extra =
    nextStatus === "verified"
      ? { lastVerifiedAt: now, nextVerificationAt: addDaysIso(now, DEFAULT_VERIFICATION_REVIEW_DAYS) }
      : {};

  const actor = await currentActorEmail();
  const result = await dbSetCommunityResourceVerificationStatus(id, nextStatus, extra, actor);
  if (!result.ok) {
    redirect(`/admin/recursos/${id}?error=${encodeURIComponent(result.error)}`);
  }

  auditAdminWrite("recurso_verification_status_changed", "community_resource", id, {
    verificationStatus: nextStatus,
    actorEmail: actor,
  });
  revalidatePath("/admin/recursos");
  revalidatePath(`/admin/recursos/${id}`);
  redirect(`/admin/recursos/${id}?saved=1`);
}
