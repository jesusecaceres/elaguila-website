/**
 * TODAY-1 — Learning Center repository. Server-only, always via getAdminSupabase() (service-role),
 * matching the Gate BCO-5A/6A pattern exactly (these tables have zero RLS policies by design).
 * Every progress/capability read or write is scoped to an authUserId parameter that callers must
 * derive server-side from a verified bearer token -- this module never trusts a caller-supplied id
 * implicitly; every exported function requires it as an explicit argument.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import type {
  CapabilityRecord, CapabilitySource, LearningActor, LearningCategory, LearningLesson,
  LearningProgress, LearningResource, ResourceType,
} from "./types";

function actorRosterId(actor: LearningActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}
function actorRole(actor: LearningActor): string {
  return actor.type === "staff" ? actor.role : "business_owner";
}

function mapCategoryRow(row: Record<string, unknown>): LearningCategory {
  return {
    id: String(row.id),
    categoryKey: String(row.category_key),
    titleEs: String(row.title_es),
    titleEn: String(row.title_en),
    summaryEs: String(row.summary_es),
    summaryEn: String(row.summary_en),
    sortOrder: Number(row.sort_order),
    status: row.status as LearningCategory["status"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

const CATEGORY_COLUMNS = "id, category_key, title_es, title_en, summary_es, summary_en, sort_order, status, created_at, updated_at";

function mapLessonRow(row: Record<string, unknown>): LearningLesson {
  return {
    id: String(row.id),
    categoryId: String(row.category_id),
    lessonKey: String(row.lesson_key),
    titleEs: String(row.title_es),
    titleEn: String(row.title_en),
    summaryEs: String(row.summary_es),
    summaryEn: String(row.summary_en),
    bodyEs: (row.body_es as string | null) ?? null,
    bodyEn: (row.body_en as string | null) ?? null,
    level: row.level as LearningLesson["level"],
    estimatedMinutes: Number(row.estimated_minutes),
    capabilityKey: String(row.capability_key),
    relatedDimensionKeys: (row.related_dimension_keys as string[] | null) ?? [],
    status: row.status as LearningLesson["status"],
    publishedAt: (row.published_at as string | null) ?? null,
    sortOrder: Number(row.sort_order),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

const LESSON_COLUMNS =
  "id, category_id, lesson_key, title_es, title_en, summary_es, summary_en, body_es, body_en, level, estimated_minutes, capability_key, related_dimension_keys, status, published_at, sort_order, created_at, updated_at";

function mapResourceRow(row: Record<string, unknown>): LearningResource {
  return {
    id: String(row.id),
    lessonId: (row.lesson_id as string | null) ?? null,
    resourceKey: String(row.resource_key),
    resourceType: row.resource_type as ResourceType,
    titleEs: String(row.title_es),
    titleEn: String(row.title_en),
    bodyEs: String(row.body_es),
    bodyEn: String(row.body_en),
    status: row.status as LearningResource["status"],
    sortOrder: Number(row.sort_order),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

const RESOURCE_COLUMNS = "id, lesson_id, resource_key, resource_type, title_es, title_en, body_es, body_en, status, sort_order, created_at, updated_at";

function mapProgressRow(row: Record<string, unknown>): LearningProgress {
  return {
    id: String(row.id),
    authUserId: String(row.auth_user_id),
    businessId: (row.business_id as string | null) ?? null,
    lessonId: String(row.lesson_id),
    status: row.status as LearningProgress["status"],
    startedAt: String(row.started_at),
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

const PROGRESS_COLUMNS = "id, auth_user_id, business_id, lesson_id, status, started_at, completed_at, created_at, updated_at";

function mapCapabilityRow(row: Record<string, unknown>): CapabilityRecord {
  return {
    id: String(row.id),
    authUserId: String(row.auth_user_id),
    businessId: (row.business_id as string | null) ?? null,
    capabilityKey: String(row.capability_key),
    source: row.source as CapabilitySource,
    sourceLessonId: (row.source_lesson_id as string | null) ?? null,
    sourceReferenceId: (row.source_reference_id as string | null) ?? null,
    grantedAt: String(row.granted_at),
    createdActorType: row.created_actor_type as "staff" | "owner",
    createdByEmail: String(row.created_by_email),
    createdByRole: String(row.created_by_role),
    createdAt: String(row.created_at),
  };
}

const CAPABILITY_COLUMNS =
  "id, auth_user_id, business_id, capability_key, source, source_lesson_id, source_reference_id, granted_at, created_actor_type, created_by_email, created_by_role, created_at";

// ---------------------------------------------------------------------------
// Public catalog reads -- always filtered to published/active content. Never grants anon table
// privileges; this module is server-only and callers reach it exclusively from server components
// or route handlers.
// ---------------------------------------------------------------------------

export async function listActiveCategories(): Promise<LearningCategory[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_learning_categories")
    .select(CATEGORY_COLUMNS)
    .eq("status", "active")
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapCategoryRow);
}

export async function listPublishedLessons(): Promise<LearningLesson[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_learning_lessons")
    .select(LESSON_COLUMNS)
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapLessonRow);
}

/** Returns null unless the lesson is published -- a planned/draft/archived lesson is never returned by this function. */
export async function getPublishedLessonByKey(lessonKey: string): Promise<LearningLesson | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_learning_lessons")
    .select(LESSON_COLUMNS)
    .eq("lesson_key", lessonKey)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  return mapLessonRow(data as Record<string, unknown>);
}

/** Server-only, used by domains that need to resolve a lesson by id (e.g. progress) regardless of status -- never exposed directly to a public route. */
export async function getLessonById(lessonId: string): Promise<LearningLesson | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("business_learning_lessons").select(LESSON_COLUMNS).eq("id", lessonId).maybeSingle();
  if (error || !data) return null;
  return mapLessonRow(data as Record<string, unknown>);
}

export async function listPublishedResourcesByType(resourceType: ResourceType): Promise<LearningResource[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_learning_resources")
    .select(RESOURCE_COLUMNS)
    .eq("resource_type", resourceType)
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapResourceRow);
}

export async function listAllPublishedResources(): Promise<LearningResource[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_learning_resources")
    .select(RESOURCE_COLUMNS)
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapResourceRow);
}

// ---------------------------------------------------------------------------
// Signed-in progress -- always scoped to the caller-supplied authUserId, which every route in
// this package derives server-side from resolveAuthenticatedUserId(token), never from the
// request body.
// ---------------------------------------------------------------------------

export async function listProgressForUser(authUserId: string): Promise<LearningProgress[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("business_learning_progress").select(PROGRESS_COLUMNS).eq("auth_user_id", authUserId);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapProgressRow);
}

/**
 * Starts (or re-fetches) a lesson for a user. Idempotent: a second "start" call on an already
 * started/completed lesson does not regress its status.
 */
export async function startLessonProgress(authUserId: string, businessId: string | null, lessonId: string): Promise<LearningProgress | null> {
  const supabase = getAdminSupabase();
  const { data: existing } = await supabase
    .from("business_learning_progress")
    .select(PROGRESS_COLUMNS)
    .eq("auth_user_id", authUserId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (existing) return mapProgressRow(existing as Record<string, unknown>);

  const { data, error } = await supabase
    .from("business_learning_progress")
    .insert({ auth_user_id: authUserId, business_id: businessId, lesson_id: lessonId, status: "started" })
    .select(PROGRESS_COLUMNS)
    .maybeSingle();
  if (error || !data) return null;
  return mapProgressRow(data as Record<string, unknown>);
}

/**
 * Completes a lesson for a user and grants the associated capability record atomically (best
 * effort: the capability grant is idempotent via the partial unique index on
 * (auth_user_id, source_lesson_id) WHERE source='lesson_completed', with a defensive existence
 * check plus a unique-violation catch as the backstop against a concurrent double-submit).
 */
export async function completeLessonProgress(actor: LearningActor, businessId: string | null, lesson: LearningLesson): Promise<{ ok: true; progress: LearningProgress } | { ok: false; error: string }> {
  if (lesson.status !== "published") return { ok: false, error: "lesson_not_published" };
  const authUserId = actor.authUserId;
  const supabase = getAdminSupabase();
  const nowIso = new Date().toISOString();

  const { data: progressRow, error: progressError } = await supabase
    .from("business_learning_progress")
    .upsert(
      { auth_user_id: authUserId, business_id: businessId, lesson_id: lesson.id, status: "completed", completed_at: nowIso, updated_at: nowIso },
      { onConflict: "auth_user_id,lesson_id" },
    )
    .select(PROGRESS_COLUMNS)
    .maybeSingle();
  if (progressError || !progressRow) return { ok: false, error: progressError?.message ?? "progress_upsert_failed" };

  const { data: existingGrant } = await supabase
    .from("business_capability_records")
    .select("id")
    .eq("auth_user_id", authUserId)
    .eq("source_lesson_id", lesson.id)
    .eq("source", "lesson_completed")
    .maybeSingle();

  if (!existingGrant) {
    const { error: grantError } = await supabase.from("business_capability_records").insert({
      auth_user_id: authUserId,
      business_id: businessId,
      capability_key: lesson.capabilityKey,
      source: "lesson_completed",
      source_lesson_id: lesson.id,
      granted_at: nowIso,
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actorRole(actor),
    });
    // 23505 = unique_violation: a concurrent request already granted it -- treat as success, never surface as an error.
    if (grantError && (grantError as { code?: string }).code !== "23505") {
      return { ok: false, error: grantError.message };
    }
  }

  return { ok: true, progress: mapProgressRow(progressRow as Record<string, unknown>) };
}

export async function listCapabilityRecordsForUser(authUserId: string): Promise<CapabilityRecord[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_capability_records")
    .select(CAPABILITY_COLUMNS)
    .eq("auth_user_id", authUserId)
    .order("granted_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapCapabilityRow);
}
