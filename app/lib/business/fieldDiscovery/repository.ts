/**
 * Program 4, Gate 4A/4B — Field Discovery repository. Server-only, always via getAdminSupabase()
 * (service-role) — same pattern as app/lib/business/livingBook/repository.ts. Every write
 * function requires a real FieldDiscoveryActor (== LivingBookActor shape) built exclusively from
 * a verified StrictSalesActor (staff) or a verified owner session — never a bare string actor.
 *
 * Foundation decision (documented per Bible instruction): `public.businesses.onboarding_status`
 * has a hard CHECK ('not_started' | 'in_progress' | 'complete') with no 'prospect' value, and
 * `creation_source` already includes 'staff_assisted' — the exact truthful existing state for a
 * staff-canvassed, not-yet-owner-claimed business is onboardingStatus='not_started' +
 * creationSource='staff_assisted' + zero active business_memberships rows. No migration change
 * to businesses was required. businesses.INSERT has no client policy by design (confirmed in
 * businessesRepo.ts) and the existing finalize_business_identity RPC is owner-scoped, callable by
 * `authenticated`, and requires a full contact/service-area payload — unsuitable for a partial
 * canvassing visit. This package therefore adds one new, narrow, service-role-only SECURITY
 * DEFINER RPC (create_staff_canvassed_business) that creates ONLY the bare businesses row, never
 * a business_memberships row (no owner claim), and never an auth.users row.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { resolveDuplicateWarning, type DuplicateCheckInput } from "../duplicates";
import { normalizeBusinessName, normalizeEmail, normalizePhone, normalizeSourceUrl } from "./logic";
import type { FieldDiscoveryActor } from "./types";
import type {
  BusinessConsentRecord,
  BusinessSourceFile,
  BusinessSourceLink,
  CanvassDuplicateWarning,
  ConsentMethod,
  ConsentState,
  ConsentType,
  SourceCollectionMethod,
  SourceFileKind,
  SourceFileUploadStatus,
  SourceLinkStatus,
  SourceType,
} from "./types";

function actorType(actor: FieldDiscoveryActor): "staff" | "owner" {
  return actor.type;
}
function actorRosterId(actor: FieldDiscoveryActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}
function actorRole(actor: FieldDiscoveryActor): string {
  return actor.type === "staff" ? actor.role : "business_owner";
}

// ---------------------------------------------------------------------------
// Duplicate detection — reuses app/lib/business/duplicates.ts exactly, no parallel logic.
// ---------------------------------------------------------------------------

export async function searchCanvassDuplicateCandidates(input: {
  actorAuthUserId: string;
  businessName: string;
  phone: string | null;
  email: string | null;
  website: string | null;
}): Promise<CanvassDuplicateWarning> {
  const admin = getAdminSupabase();
  const duplicateInput: DuplicateCheckInput = {
    currentUserId: input.actorAuthUserId,
    normalizedName: normalizeBusinessName(input.businessName),
    normalizedPhone: normalizePhone(input.phone),
    normalizedEmail: normalizeEmail(input.email),
    normalizedDomain: input.website ? normalizeSourceUrl(input.website) : null,
    normalizedServiceAreaText: null,
    listingCandidate: null,
  };
  // resolveDuplicateWarning's second parameter (userClient) is only used for a membership-scoped
  // read this call site never needs — the admin client is passed twice; the function itself
  // ignores userClient entirely for the new-business duplicate-scan path (see duplicates.ts).
  const result = await resolveDuplicateWarning(admin, admin, duplicateInput);
  return { level: result.level, candidates: result.candidates.map((c) => ({ businessId: c.businessId, displayNameMasked: c.displayNameMasked })) };
}

// ---------------------------------------------------------------------------
// Canvassed business creation — the sole INSERT path into businesses for Program 4.
// ---------------------------------------------------------------------------

export type CreateCanvassedBusinessInput = {
  displayName: string;
  primaryLanguage: "es" | "en";
};

export async function createCanvassedBusiness(
  input: CreateCanvassedBusinessInput,
  actor: Extract<FieldDiscoveryActor, { type: "staff" }>,
): Promise<{ ok: true; businessId: string } | { ok: false; error: string }> {
  const trimmedName = input.displayName.trim();
  if (!trimmedName) return { ok: false, error: "empty_business_name" };
  const admin = getAdminSupabase();
  const { data, error } = await admin.rpc("create_staff_canvassed_business", {
    p_display_name: trimmedName,
    p_normalized_name: normalizeBusinessName(trimmedName),
    p_primary_language: input.primaryLanguage,
    p_actor_auth_user_id: actor.authUserId,
  });
  if (error || !data) return { ok: false, error: error?.message ?? "rpc_failed" };
  return { ok: true, businessId: String(data) };
}

// ---------------------------------------------------------------------------
// Source links
// ---------------------------------------------------------------------------

const SOURCE_LINK_COLUMNS =
  "id, business_id, source_type, url, normalized_url, collection_method, consent_record_id, status, last_researched_at, created_actor_type, created_by_roster_id, created_by_auth_user_id, created_by_email, created_by_role, created_at, updated_at";

function mapSourceLinkRow(row: Record<string, unknown>): BusinessSourceLink {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    sourceType: row.source_type as SourceType,
    url: String(row.url),
    normalizedUrl: String(row.normalized_url),
    collectionMethod: row.collection_method as SourceCollectionMethod,
    consentRecordId: (row.consent_record_id as string | null) ?? null,
    status: row.status as SourceLinkStatus,
    lastResearchedAt: (row.last_researched_at as string | null) ?? null,
    createdActorType: row.created_actor_type as "staff" | "owner",
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByAuthUserId: String(row.created_by_auth_user_id),
    createdByEmail: String(row.created_by_email),
    createdByRole: String(row.created_by_role),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listSourceLinksForBusiness(businessId: string): Promise<BusinessSourceLink[]> {
  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from("business_source_links")
    .select(SOURCE_LINK_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapSourceLinkRow);
}

export type CreateSourceLinkInput = {
  businessId: string;
  sourceType: SourceType;
  url: string;
  collectionMethod: SourceCollectionMethod;
  consentRecordId: string | null;
};

export async function createSourceLink(
  input: CreateSourceLinkInput,
  actor: FieldDiscoveryActor,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const normalized = normalizeSourceUrl(input.url);
  if (!normalized) return { ok: false, error: "invalid_url" };
  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from("business_source_links")
    .insert({
      business_id: input.businessId,
      source_type: input.sourceType,
      url: input.url.trim(),
      normalized_url: normalized,
      collection_method: input.collectionMethod,
      consent_record_id: input.consentRecordId,
      status: "pending",
      created_actor_type: actorType(actor),
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actorRole(actor),
    })
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  return { ok: true, id: String((data as { id: string }).id) };
}

export async function updateSourceLinkStatus(
  sourceLinkId: string,
  status: SourceLinkStatus,
  markResearchedNow: boolean,
): Promise<boolean> {
  const admin = getAdminSupabase();
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (markResearchedNow) patch.last_researched_at = new Date().toISOString();
  const { error } = await admin.from("business_source_links").update(patch).eq("id", sourceLinkId);
  return !error;
}

// ---------------------------------------------------------------------------
// Source files
// ---------------------------------------------------------------------------

const SOURCE_FILE_COLUMNS =
  "id, business_id, related_discovery_session_id, file_kind, storage_path, public_url, mime_type, original_filename, size_bytes, consent_record_id, created_evidence_id, upload_status, created_actor_type, created_by_roster_id, created_by_auth_user_id, created_by_email, created_by_role, created_at";

function mapSourceFileRow(row: Record<string, unknown>): BusinessSourceFile {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    relatedDiscoverySessionId: (row.related_discovery_session_id as string | null) ?? null,
    fileKind: row.file_kind as SourceFileKind,
    storagePath: String(row.storage_path),
    publicUrl: String(row.public_url),
    mimeType: String(row.mime_type),
    originalFilename: String(row.original_filename),
    sizeBytes: Number(row.size_bytes),
    consentRecordId: (row.consent_record_id as string | null) ?? null,
    createdEvidenceId: (row.created_evidence_id as string | null) ?? null,
    uploadStatus: row.upload_status as SourceFileUploadStatus,
    createdActorType: row.created_actor_type as "staff" | "owner",
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByAuthUserId: String(row.created_by_auth_user_id),
    createdByEmail: String(row.created_by_email),
    createdByRole: String(row.created_by_role),
    createdAt: String(row.created_at),
  };
}

export async function listSourceFilesForBusiness(businessId: string): Promise<BusinessSourceFile[]> {
  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from("business_source_files")
    .select(SOURCE_FILE_COLUMNS)
    .eq("business_id", businessId)
    .neq("upload_status", "deleted")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapSourceFileRow);
}

export type CreateSourceFileInput = {
  businessId: string;
  relatedDiscoverySessionId: string | null;
  fileKind: SourceFileKind;
  storagePath: string;
  publicUrl: string;
  mimeType: string;
  originalFilename: string;
  sizeBytes: number;
  consentRecordId: string | null;
};

export async function createSourceFile(
  input: CreateSourceFileInput,
  actor: FieldDiscoveryActor,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (input.sizeBytes <= 0) return { ok: false, error: "empty_file" };
  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from("business_source_files")
    .insert({
      business_id: input.businessId,
      related_discovery_session_id: input.relatedDiscoverySessionId,
      file_kind: input.fileKind,
      storage_path: input.storagePath,
      public_url: input.publicUrl,
      mime_type: input.mimeType,
      original_filename: input.originalFilename,
      size_bytes: input.sizeBytes,
      consent_record_id: input.consentRecordId,
      upload_status: "uploaded",
      created_actor_type: actorType(actor),
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actorRole(actor),
    })
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  return { ok: true, id: String((data as { id: string }).id) };
}

// ---------------------------------------------------------------------------
// Consent (append-only)
// ---------------------------------------------------------------------------

const CONSENT_COLUMNS =
  "id, business_id, consent_type, consent_state, method, scope_details, related_discovery_session_id, recorded_actor_type, recorded_by_roster_id, recorded_by_auth_user_id, recorded_by_email, recorded_by_role, created_at";

function mapConsentRow(row: Record<string, unknown>): BusinessConsentRecord {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    consentType: row.consent_type as ConsentType,
    consentState: row.consent_state as ConsentState,
    method: row.method as ConsentMethod,
    scopeDetails: (row.scope_details as Record<string, unknown>) ?? {},
    relatedDiscoverySessionId: (row.related_discovery_session_id as string | null) ?? null,
    recordedActorType: row.recorded_actor_type as "staff" | "owner",
    recordedByRosterId: (row.recorded_by_roster_id as string | null) ?? null,
    recordedByAuthUserId: String(row.recorded_by_auth_user_id),
    recordedByEmail: String(row.recorded_by_email),
    recordedByRole: String(row.recorded_by_role),
    createdAt: String(row.created_at),
  };
}

export async function listConsentForBusiness(businessId: string): Promise<BusinessConsentRecord[]> {
  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from("business_consent_records")
    .select(CONSENT_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapConsentRow);
}

export type RecordConsentInput = {
  businessId: string;
  consentType: ConsentType;
  consentState: ConsentState;
  method: ConsentMethod;
  scopeDetails?: Record<string, unknown>;
  relatedDiscoverySessionId: string | null;
};

/** Append-only — never overwrites a prior consent record; a withdrawal is a new row. */
export async function recordConsent(
  input: RecordConsentInput,
  actor: FieldDiscoveryActor,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from("business_consent_records")
    .insert({
      business_id: input.businessId,
      consent_type: input.consentType,
      consent_state: input.consentState,
      method: input.method,
      scope_details: input.scopeDetails ?? {},
      related_discovery_session_id: input.relatedDiscoverySessionId,
      recorded_actor_type: actorType(actor),
      recorded_by_roster_id: actorRosterId(actor),
      recorded_by_auth_user_id: actor.authUserId,
      recorded_by_email: actor.email,
      recorded_by_role: actorRole(actor),
    })
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  return { ok: true, id: String((data as { id: string }).id) };
}

/** Most-recent-wins read of a consent type's current state (append-only history, latest row governs). */
export async function getLatestConsentState(businessId: string, consentType: ConsentType): Promise<ConsentState | null> {
  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from("business_consent_records")
    .select("consent_state")
    .eq("business_id", businessId)
    .eq("consent_type", consentType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { consent_state: string }).consent_state as ConsentState;
}
