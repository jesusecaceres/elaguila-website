import "server-only";

import type { EmpleosPublishEnvelope } from "@/app/publicar/empleos/shared/publish/empleosPublishSnapshots";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

import { getEmpleoJobBySlug } from "../data/empleosSampleCatalog";
import type { EmpleosJobRecord } from "../data/empleosJobTypes";
import { empleosEnvelopeToCanonical } from "./staged/empleosEnvelopeToJobRecord";
import type { EmpleosCanonicalListing } from "./staged/empleosCanonicalListing";
import { buildEmpleosLiveSlugBase } from "./empleosLiveSlug";

export type EmpleosListingLifecycleDb =
  | "draft"
  | "pending_review"
  | "published"
  | "paused"
  | "archived"
  | "rejected";

export type EmpleosPublicListingRow = {
  id: string;
  slug: string;
  lane: string;
  owner_user_id: string | null;
  lifecycle_status: EmpleosListingLifecycleDb;
  moderation_reason: string | null;
  review_notes: string | null;
  lang: string;
  title: string;
  company_name: string;
  city: string;
  state: string;
  postal_code: string | null;
  modality: string;
  job_type: string;
  experience: string;
  company_type: string;
  category_slug: string;
  salary_min: number;
  salary_max: number;
  salary_label: string;
  quick_apply: boolean;
  verified_employer: boolean;
  premium_employer: boolean;
  listing_tier: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  listing_snapshot: EmpleosListingSnapshotJson;
};

export type EmpleosListingSnapshotJson = {
  version: 1;
  jobRecord: EmpleosJobRecord;
  envelope?: EmpleosPublishEnvelope;
  canonical?: EmpleosCanonicalListing;
};

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

export async function allocateUniqueEmpleosSlugServer(title: string): Promise<string> {
  if (!isSupabaseAdminConfigured()) {
    return `${buildEmpleosLiveSlugBase(title)}-${Date.now().toString(36)}`;
  }
  const supabase = getAdminSupabase();
  const base = buildEmpleosLiveSlugBase(title);
  for (let i = 0; i < 60; i++) {
    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const candidate = `${base}-${suffix}`.replace(/-+/g, "-").slice(0, 120);
    if (getEmpleoJobBySlug(candidate)) continue;
    const { data } = await supabase.from("empleos_public_listings").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${crypto.randomUUID()}`.slice(0, 120);
}

function mapCanonicalToRow(
  canonical: EmpleosCanonicalListing,
  slug: string,
  lifecycle: EmpleosListingLifecycleDb,
  snapshot: EmpleosListingSnapshotJson,
): Omit<EmpleosPublicListingRow, "created_at" | "updated_at"> {
  const jr = canonical.jobRecord;
  const publishedAt = lifecycle === "published" ? canonical.publishedAt ?? new Date().toISOString() : null;
  return {
    id: canonical.listingId,
    slug,
    lane: canonical.lane,
    owner_user_id: canonical.ownerId,
    lifecycle_status: lifecycle,
    moderation_reason: null,
    review_notes: null,
    lang: canonical.language,
    title: canonical.title,
    company_name: canonical.company,
    city: canonical.city,
    state: canonical.state,
    postal_code: canonical.postalCode ?? null,
    modality: jr.modality,
    job_type: jr.jobType,
    experience: jr.experience,
    company_type: jr.companyType,
    category_slug: jr.category,
    salary_min: canonical.salaryMin,
    salary_max: canonical.salaryMax,
    salary_label: canonical.salaryLabel,
    quick_apply: jr.quickApply,
    verified_employer: jr.verifiedEmployer,
    premium_employer: jr.premiumEmployer,
    listing_tier: jr.listingTier,
    published_at: publishedAt,
    listing_snapshot: snapshot,
  };
}

function publishLifecycleForInsert(): EmpleosListingLifecycleDb {
  return process.env.EMPLEOS_REQUIRE_LISTING_REVIEW === "1" ? "pending_review" : "published";
}

function envelopeTitle(e: EmpleosPublishEnvelope): string {
  return e.payload.data.title.trim();
}

export async function upsertEmpleosListingFromEnvelope(input: {
  envelope: EmpleosPublishEnvelope;
  ownerUserId: string;
  mode: "draft" | "publish";
}): Promise<{ ok: true; id: string; slug: string; lifecycle_status: EmpleosListingLifecycleDb } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "supabase_not_configured" };
  }
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const listingId =
    input.envelope.listingId && isUuid(input.envelope.listingId) ? input.envelope.listingId : crypto.randomUUID();

  const { data: existing } = await supabase.from("empleos_public_listings").select("*").eq("id", listingId).maybeSingle();
  if (existing && (existing as { owner_user_id: string | null }).owner_user_id !== input.ownerUserId) {
    return { ok: false, error: "forbidden" };
  }

  const slug =
    (existing as EmpleosPublicListingRow | null)?.slug ?? (await allocateUniqueEmpleosSlugServer(envelopeTitle(input.envelope)));

  const lifecycle: EmpleosListingLifecycleDb =
    input.mode === "draft" ? "draft" : input.mode === "publish" ? publishLifecycleForInsert() : "draft";

  const stamped: EmpleosPublishEnvelope = {
    ...input.envelope,
    listingId,
    ownerId: input.ownerUserId,
    createdAt: (existing as { created_at?: string } | null)?.created_at ?? input.envelope.createdAt ?? now,
    updatedAt: now,
    publishedAt: lifecycle === "published" ? now : null,
    listingStatus: lifecycle === "draft" ? "draft" : "published",
  };

  const canonicalStatus: EmpleosCanonicalListing["status"] =
    lifecycle === "draft" ? "draft" : lifecycle === "pending_review" ? "pending_review" : "published";

  const canonicalPublishedAt = lifecycle === "published" ? now : null;

  const canonical = empleosEnvelopeToCanonical(stamped, {
    listingId,
    ownerId: input.ownerUserId,
    slug,
    status: canonicalStatus,
    publishedAt: canonicalPublishedAt,
  });

  const snapshot: EmpleosListingSnapshotJson = {
    version: 1,
    jobRecord: canonical.jobRecord,
    envelope: input.envelope,
    canonical,
  };

  const row = mapCanonicalToRow(
    {
      ...canonical,
      jobRecord: canonical.jobRecord,
      publishedAt: canonicalPublishedAt,
    },
    slug,
    lifecycle,
    snapshot,
  );

  if (existing) {
    const { error } = await supabase
      .from("empleos_public_listings")
      .update({
        ...row,
        updated_at: now,
      })
      .eq("id", listingId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("empleos_public_listings").insert({
      ...row,
      created_at: now,
      updated_at: now,
    });
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true, id: listingId, slug, lifecycle_status: lifecycle };
}

export async function fetchEmpleosPublishedJobRecords(): Promise<EmpleosJobRecord[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("empleos_public_listings")
    .select("*")
    .eq("lifecycle_status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });
  if (error || !data) return [];
  return (data as EmpleosPublicListingRow[]).map((r) => rowToJobRecord(r));
}

export async function fetchEmpleosListingRowBySlug(slug: string): Promise<EmpleosPublicListingRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("empleos_public_listings").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  return data as EmpleosPublicListingRow;
}

/** Public job detail — only published rows (no draft/pending leakage by slug). */
export async function fetchEmpleosPublishedListingRowBySlug(slug: string): Promise<EmpleosPublicListingRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("empleos_public_listings")
    .select("*")
    .eq("slug", slug)
    .eq("lifecycle_status", "published")
    .maybeSingle();
  if (error || !data) return null;
  return data as EmpleosPublicListingRow;
}

export function rowToJobRecord(row: EmpleosPublicListingRow): EmpleosJobRecord {
  const snap = row.listing_snapshot as EmpleosListingSnapshotJson | null;
  if (snap?.jobRecord) return snap.jobRecord;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    company: row.company_name,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code ?? undefined,
    category: row.category_slug,
    modality: row.modality as EmpleosJobRecord["modality"],
    jobType: row.job_type as EmpleosJobRecord["jobType"],
    salaryMin: Number(row.salary_min),
    salaryMax: Number(row.salary_max),
    salaryLabel: row.salary_label,
    experience: row.experience as EmpleosJobRecord["experience"],
    companyType: row.company_type as EmpleosJobRecord["companyType"],
    quickApply: row.quick_apply,
    publishedAt: row.published_at ?? row.created_at,
    listingTier: row.listing_tier as EmpleosJobRecord["listingTier"],
    verifiedEmployer: row.verified_employer,
    premiumEmployer: row.premium_employer,
    companyInitials: row.company_name.slice(0, 2).toUpperCase(),
    imageSrc:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
    imageAlt: row.title,
    summary: row.title,
    description: row.title,
    requirements: [],
    benefits: [],
    benefitChips: [],
    showOnLandingFeatured: false,
    showOnLandingRecent: false,
  };
}

export async function fetchEmpleosListingsForOwner(ownerUserId: string): Promise<EmpleosPublicListingRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("empleos_public_listings")
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data as EmpleosPublicListingRow[];
}

export async function fetchAllEmpleosListingsForAdmin(): Promise<EmpleosPublicListingRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("empleos_public_listings").select("*").order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data as EmpleosPublicListingRow[];
}

export async function updateEmpleosListingLifecycleAdmin(input: {
  id: string;
  lifecycle_status: EmpleosListingLifecycleDb;
  moderation_reason?: string | null;
  review_notes?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "supabase_not_configured" };
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    lifecycle_status: input.lifecycle_status,
    updated_at: now,
    moderation_reason: input.moderation_reason ?? null,
    review_notes: input.review_notes ?? null,
  };
  if (input.lifecycle_status === "published") {
    patch.published_at = now;
  }
  const { error } = await supabase.from("empleos_public_listings").update(patch).eq("id", input.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateEmpleosListingLifecycleOwner(input: {
  id: string;
  ownerUserId: string;
  lifecycle_status: EmpleosListingLifecycleDb;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "supabase_not_configured" };
  const supabase = getAdminSupabase();
  const { data: row, error: rErr } = await supabase
    .from("empleos_public_listings")
    .select("owner_user_id")
    .eq("id", input.id)
    .maybeSingle();
  if (rErr || !row || (row as { owner_user_id: string }).owner_user_id !== input.ownerUserId) {
    return { ok: false, error: "forbidden" };
  }
  return updateEmpleosListingLifecycleAdmin({
    id: input.id,
    lifecycle_status: input.lifecycle_status,
  });
}

export async function insertEmpleosJobApplication(input: {
  listingId: string;
  applicantUserId: string | null;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string | null;
  message: string;
  answersJson?: Record<string, unknown>;
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "supabase_not_configured" };
  const supabase = getAdminSupabase();
  const { data: listing, error: lErr } = await supabase
    .from("empleos_public_listings")
    .select("id, lifecycle_status")
    .eq("id", input.listingId)
    .maybeSingle();
  if (lErr || !listing) return { ok: false, error: "listing_not_found" };
  if ((listing as { lifecycle_status: string }).lifecycle_status !== "published") {
    return { ok: false, error: "listing_not_accepting_applications" };
  }
  const { data, error } = await supabase
    .from("empleos_job_applications")
    .insert({
      listing_id: input.listingId,
      applicant_user_id: input.applicantUserId,
      applicant_name: input.applicantName,
      applicant_email: input.applicantEmail,
      applicant_phone: input.applicantPhone ?? null,
      message: input.message,
      answers_json: input.answersJson ?? {},
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: (data as { id: string }).id };
}

export async function fetchEmpleosApplicationsForListing(input: {
  listingId: string;
  ownerUserId: string;
}): Promise<
  Array<{
    id: string;
    applicant_name: string;
    applicant_email: string;
    applicant_phone: string | null;
    message: string;
    answers_json: unknown;
    status: string;
    created_at: string;
  }>
> {
  if (!isSupabaseAdminConfigured()) return [];
  const supabase = getAdminSupabase();
  const { data: listing, error: lErr } = await supabase
    .from("empleos_public_listings")
    .select("owner_user_id")
    .eq("id", input.listingId)
    .maybeSingle();
  if (lErr || !listing || (listing as { owner_user_id: string }).owner_user_id !== input.ownerUserId) return [];

  const { data, error } = await supabase
    .from("empleos_job_applications")
    .select("id, applicant_name, applicant_email, applicant_phone, message, answers_json, status, created_at")
    .eq("listing_id", input.listingId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as typeof data;
}
