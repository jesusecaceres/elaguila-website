/**
 * Client Discovery & Project Blueprint Engine, Gate 1 — repository. Server-only, always via
 * getAdminSupabase(). Mirrors the exact business-scoping convention used throughout Growth Engine/
 * Living Book/Meeting Studio: every read/write filters on BOTH id and business_id, never id alone.
 *
 * No blueprint generation, no UI, no recording/transcription lives here — Gate 1 is the data-model
 * foundation only (see this gate's final report for the full reuse audit).
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { isValidProjectDiscoveryIntentTransition, isValidProjectDiscoveryStatusTransition } from "./constants";
import { assetReferenceCrossesBusinessBoundary, isBlockingDiscoveryItem } from "./logic";
import { isKnownProjectType } from "./projectTypeRegistry";
import type {
  AttachProjectDiscoverySourceInput,
  CaptureProjectDiscoveryItemInput,
  CreateProjectDiscoveryInput,
  CreateProjectDiscoveryIntentInput,
  DiscoveryCompletenessClass,
  ProjectDiscovery,
  ProjectDiscoveryActor,
  ProjectDiscoveryConsent,
  ProjectDiscoveryEntityType,
  ProjectDiscoveryEvent,
  ProjectDiscoveryIntent,
  ProjectDiscoveryIntentStatus,
  ProjectDiscoveryItem,
  ProjectDiscoverySource,
  ProjectDiscoveryStatus,
  RecordProjectDiscoveryConsentInput,
} from "./types";

function actorRosterId(actor: ProjectDiscoveryActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}
function actorAuthUserId(actor: ProjectDiscoveryActor): string | null {
  return actor.type === "system" ? null : actor.authUserId;
}
function actorEmail(actor: ProjectDiscoveryActor): string | null {
  return actor.type === "system" ? null : actor.email;
}
function actorRole(actor: ProjectDiscoveryActor): string {
  return actor.type === "owner" ? (actor.role ?? "owner") : actor.role;
}

// =================================================================================================
// Events — internal helper, called by every mutation below. Never throws: a failed event write
// must never roll back the underlying mutation it is describing (matches appendGrowthEvent).
// =================================================================================================
async function appendDiscoveryEvent(entry: {
  businessId: string;
  discoveryId: string;
  entityType: ProjectDiscoveryEntityType;
  entityId: string;
  eventType: string;
  previousState?: string | null;
  newState?: string | null;
  source?: string | null;
  note?: string | null;
  actor: ProjectDiscoveryActor;
}): Promise<void> {
  try {
    const supabase = getAdminSupabase();
    await supabase.from("business_project_discovery_events").insert({
      business_id: entry.businessId,
      discovery_id: entry.discoveryId,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      event_type: entry.eventType,
      previous_state: entry.previousState ?? null,
      new_state: entry.newState ?? null,
      source: entry.source ?? null,
      note: entry.note ?? null,
      event_actor_type: entry.actor.type,
      event_by_roster_id: actorRosterId(entry.actor),
      event_by_auth_user_id: actorAuthUserId(entry.actor),
      event_by_role: actorRole(entry.actor),
    });
  } catch {
    // Best-effort audit trail — never block the real mutation on a logging failure.
  }
}

export async function listDiscoveryEventsForDiscovery(discoveryId: string, businessId: string, limit = 100): Promise<ProjectDiscoveryEvent[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_discovery_events")
    .select("id, business_id, discovery_id, entity_type, entity_id, event_type, previous_state, new_state, source, note, created_at")
    .eq("discovery_id", discoveryId)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row) => ({
    id: String(row.id),
    businessId: String(row.business_id),
    discoveryId: String(row.discovery_id),
    entityType: row.entity_type as ProjectDiscoveryEntityType,
    entityId: String(row.entity_id),
    eventType: String(row.event_type),
    previousState: (row.previous_state as string | null) ?? null,
    newState: (row.new_state as string | null) ?? null,
    source: (row.source as string | null) ?? null,
    note: (row.note as string | null) ?? null,
    createdAt: String(row.created_at),
  }));
}

// =================================================================================================
// Discovery (parent)
// =================================================================================================
const DISCOVERY_COLUMNS =
  "id, business_id, status, title, primary_project_type, language, source_growth_assessment_id, source_growth_solution_id, source_opportunity_id, source_meeting_id, assigned_staff_roster_id, created_actor_type, created_by_roster_id, created_by_auth_user_id, created_by_email, created_by_role, created_at, updated_at, completed_at";

function mapDiscoveryRow(row: Record<string, unknown>): ProjectDiscovery {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    status: row.status as ProjectDiscoveryStatus,
    title: String(row.title),
    primaryProjectType: row.primary_project_type as ProjectDiscovery["primaryProjectType"],
    language: row.language as "es" | "en",
    sourceGrowthAssessmentId: (row.source_growth_assessment_id as string | null) ?? null,
    sourceGrowthSolutionId: (row.source_growth_solution_id as string | null) ?? null,
    sourceOpportunityId: (row.source_opportunity_id as string | null) ?? null,
    sourceMeetingId: (row.source_meeting_id as string | null) ?? null,
    assignedStaffRosterId: (row.assigned_staff_roster_id as string | null) ?? null,
    createdActorType: row.created_actor_type as "staff" | "owner",
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByAuthUserId: String(row.created_by_auth_user_id),
    createdByEmail: String(row.created_by_email),
    createdByRole: String(row.created_by_role),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    completedAt: (row.completed_at as string | null) ?? null,
  };
}

export type CreateProjectDiscoveryResult = { ok: true; discovery: ProjectDiscovery } | { ok: false; reason: "invalid_project_type" | "insert_failed" };

export async function createProjectDiscovery(
  input: CreateProjectDiscoveryInput,
  actor: Extract<ProjectDiscoveryActor, { type: "staff" | "owner" }>,
): Promise<CreateProjectDiscoveryResult> {
  if (!isKnownProjectType(input.primaryProjectType)) return { ok: false, reason: "invalid_project_type" };

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_discoveries")
    .insert({
      business_id: input.businessId,
      title: input.title,
      primary_project_type: input.primaryProjectType,
      language: input.language ?? "es",
      source_growth_assessment_id: input.sourceGrowthAssessmentId ?? null,
      source_growth_solution_id: input.sourceGrowthSolutionId ?? null,
      source_opportunity_id: input.sourceOpportunityId ?? null,
      source_meeting_id: input.sourceMeetingId ?? null,
      assigned_staff_roster_id: input.assignedStaffRosterId ?? null,
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actorRole(actor),
    })
    .select(DISCOVERY_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "insert_failed" };

  const created = mapDiscoveryRow(data);
  await appendDiscoveryEvent({
    businessId: input.businessId,
    discoveryId: created.id,
    entityType: "discovery",
    entityId: created.id,
    eventType: "created",
    newState: created.status,
    source: "staff_authored",
    actor,
  });
  return { ok: true, discovery: created };
}

export async function getProjectDiscoveryById(businessId: string, discoveryId: string): Promise<ProjectDiscovery | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_discoveries")
    .select(DISCOVERY_COLUMNS)
    .eq("id", discoveryId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  return mapDiscoveryRow(data);
}

export async function listProjectDiscoveriesForBusiness(businessId: string): Promise<ProjectDiscovery[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_discoveries")
    .select(DISCOVERY_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapDiscoveryRow);
}

export type UpdateDiscoveryStatusResult =
  | { ok: true; discovery: ProjectDiscovery }
  | { ok: false; reason: "not_found" | "invalid_transition" | "update_failed" };

export async function updateProjectDiscoveryStatus(
  businessId: string,
  discoveryId: string,
  newStatus: ProjectDiscoveryStatus,
  actor: ProjectDiscoveryActor,
): Promise<UpdateDiscoveryStatusResult> {
  const existing = await getProjectDiscoveryById(businessId, discoveryId);
  if (!existing) return { ok: false, reason: "not_found" };
  if (!isValidProjectDiscoveryStatusTransition(existing.status, newStatus)) {
    return { ok: false, reason: "invalid_transition" };
  }

  const supabase = getAdminSupabase();
  const completedAt = newStatus === "ready_for_blueprint" || newStatus === "blueprint_created" ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from("business_project_discoveries")
    .update({ status: newStatus, updated_at: new Date().toISOString(), completed_at: completedAt })
    .eq("id", discoveryId)
    .eq("business_id", businessId)
    .select(DISCOVERY_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "update_failed" };

  const updated = mapDiscoveryRow(data);
  await appendDiscoveryEvent({
    businessId,
    discoveryId,
    entityType: "discovery",
    entityId: discoveryId,
    eventType: "status_changed",
    previousState: existing.status,
    newState: newStatus,
    source: "staff_update",
    actor,
  });
  return { ok: true, discovery: updated };
}

// =================================================================================================
// Project intents (multi-project foundation)
// =================================================================================================
const INTENT_COLUMNS = "id, business_id, discovery_id, project_type, project_subtype, other_label, title, status, created_at, updated_at";

function mapIntentRow(row: Record<string, unknown>): ProjectDiscoveryIntent {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    discoveryId: String(row.discovery_id),
    projectType: row.project_type as ProjectDiscoveryIntent["projectType"],
    projectSubtype: (row.project_subtype as string | null) ?? null,
    otherLabel: (row.other_label as string | null) ?? null,
    title: String(row.title),
    status: row.status as ProjectDiscoveryIntentStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export type CreateIntentResult = { ok: true; intent: ProjectDiscoveryIntent } | { ok: false; reason: "invalid_project_type" | "other_label_required" | "insert_failed" };

export async function createProjectDiscoveryIntent(input: CreateProjectDiscoveryIntentInput, actor: ProjectDiscoveryActor): Promise<CreateIntentResult> {
  if (!isKnownProjectType(input.projectType)) return { ok: false, reason: "invalid_project_type" };
  if (input.projectType === "other" && !input.otherLabel?.trim()) return { ok: false, reason: "other_label_required" };

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_discovery_intents")
    .insert({
      business_id: input.businessId,
      discovery_id: input.discoveryId,
      project_type: input.projectType,
      project_subtype: input.projectSubtype ?? null,
      other_label: input.otherLabel ?? null,
      title: input.title,
    })
    .select(INTENT_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "insert_failed" };

  const created = mapIntentRow(data);
  await appendDiscoveryEvent({
    businessId: input.businessId,
    discoveryId: input.discoveryId,
    entityType: "intent",
    entityId: created.id,
    eventType: "created",
    newState: created.status,
    source: "staff_authored",
    actor,
  });
  return { ok: true, intent: created };
}

export async function listProjectDiscoveryIntents(discoveryId: string, businessId: string): Promise<ProjectDiscoveryIntent[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_discovery_intents")
    .select(INTENT_COLUMNS)
    .eq("discovery_id", discoveryId)
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(mapIntentRow);
}

export type UpdateIntentStatusResult =
  | { ok: true; intent: ProjectDiscoveryIntent }
  | { ok: false; reason: "not_found" | "invalid_transition" | "update_failed" };

export async function updateProjectDiscoveryIntentStatus(
  businessId: string,
  intentId: string,
  newStatus: ProjectDiscoveryIntentStatus,
  actor: ProjectDiscoveryActor,
): Promise<UpdateIntentStatusResult> {
  const supabase = getAdminSupabase();
  const { data: existingRow } = await supabase
    .from("business_project_discovery_intents")
    .select(INTENT_COLUMNS)
    .eq("id", intentId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (!existingRow) return { ok: false, reason: "not_found" };
  const existing = mapIntentRow(existingRow);
  if (!isValidProjectDiscoveryIntentTransition(existing.status, newStatus)) {
    return { ok: false, reason: "invalid_transition" };
  }

  const { data, error } = await supabase
    .from("business_project_discovery_intents")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", intentId)
    .eq("business_id", businessId)
    .select(INTENT_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "update_failed" };

  const updated = mapIntentRow(data);
  await appendDiscoveryEvent({
    businessId,
    discoveryId: existing.discoveryId,
    entityType: "intent",
    entityId: intentId,
    eventType: "status_changed",
    previousState: existing.status,
    newState: newStatus,
    source: "staff_update",
    actor,
  });
  return { ok: true, intent: updated };
}

// =================================================================================================
// Structured discovery items — extensible answers, never a hardcoded column per question.
// =================================================================================================
const ITEM_COLUMNS =
  "id, business_id, discovery_id, project_intent_id, section, field_key, value, display_value, value_type, truth_class, completeness_class, confirmation_state, client_confirmed_at, captured_actor_type, captured_by_roster_id, captured_by_auth_user_id, captured_by_email, captured_by_role, notes, created_at, updated_at";

function mapItemRow(row: Record<string, unknown>): ProjectDiscoveryItem {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    discoveryId: String(row.discovery_id),
    projectIntentId: (row.project_intent_id as string | null) ?? null,
    section: String(row.section),
    fieldKey: String(row.field_key),
    value: row.value,
    displayValue: (row.display_value as string | null) ?? null,
    valueType: row.value_type as ProjectDiscoveryItem["valueType"],
    truthClass: row.truth_class as ProjectDiscoveryItem["truthClass"],
    completenessClass: row.completeness_class as DiscoveryCompletenessClass,
    confirmationState: row.confirmation_state as ProjectDiscoveryItem["confirmationState"],
    clientConfirmedAt: (row.client_confirmed_at as string | null) ?? null,
    capturedActorType: row.captured_actor_type as "staff" | "owner" | "system",
    capturedByRosterId: (row.captured_by_roster_id as string | null) ?? null,
    capturedByAuthUserId: (row.captured_by_auth_user_id as string | null) ?? null,
    capturedByEmail: (row.captured_by_email as string | null) ?? null,
    capturedByRole: String(row.captured_by_role),
    notes: (row.notes as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export type CaptureItemResult = { ok: true; item: ProjectDiscoveryItem } | { ok: false; reason: "insert_failed" };

/**
 * Upsert-by-(discovery, intent-or-shared, field_key) — matches the DB's own
 * business_project_discovery_items_unique_field constraint. Re-capturing the same field replaces
 * its value/classification rather than creating a silent duplicate row; the truth/completeness
 * classification is ALWAYS supplied explicitly by the caller (never defaulted to "client_confirmed"
 * or "not_applicable"), matching the truth_contract's "never silently collapsed" rule.
 */
export async function captureProjectDiscoveryItem(input: CaptureProjectDiscoveryItemInput, actor: ProjectDiscoveryActor): Promise<CaptureItemResult> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_discovery_items")
    .upsert(
      {
        business_id: input.businessId,
        discovery_id: input.discoveryId,
        project_intent_id: input.projectIntentId ?? null,
        section: input.section,
        field_key: input.fieldKey,
        value: input.value ?? {},
        display_value: input.displayValue ?? null,
        value_type: input.valueType ?? "text",
        truth_class: input.truthClass,
        completeness_class: input.completenessClass,
        captured_actor_type: actor.type,
        captured_by_roster_id: actorRosterId(actor),
        captured_by_auth_user_id: actorAuthUserId(actor),
        captured_by_email: actorEmail(actor),
        captured_by_role: actorRole(actor),
        notes: input.notes ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "discovery_id,project_intent_id,field_key" },
    )
    .select(ITEM_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "insert_failed" };

  const item = mapItemRow(data);
  await appendDiscoveryEvent({
    businessId: input.businessId,
    discoveryId: input.discoveryId,
    entityType: "item",
    entityId: item.id,
    eventType: "captured",
    newState: item.truthClass,
    source: actor.type,
    note: input.fieldKey,
    actor,
  });
  return { ok: true, item };
}

export async function listProjectDiscoveryItems(discoveryId: string, businessId: string): Promise<ProjectDiscoveryItem[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_discovery_items")
    .select(ITEM_COLUMNS)
    .eq("discovery_id", discoveryId)
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(mapItemRow);
}

/**
 * Confirming an item ONLY records that the client confirmed IT — it never writes to
 * business_facts. Promotion into canonical Business Book truth remains a separate, existing,
 * human-gated action (upsertFact/confirmFact) performed by staff after review — matching the
 * mission's own required future flow: DISCOVERY ITEM -> HUMAN REVIEW -> CONFIRM/VERIFY ->
 * CANONICAL BUSINESS BOOK PROMOTION.
 */
export type ConfirmItemResult = { ok: true; item: ProjectDiscoveryItem } | { ok: false; reason: "not_found" | "update_failed" };

export async function setProjectDiscoveryItemConfirmation(
  businessId: string,
  itemId: string,
  confirmationState: "confirmed" | "rejected" | "unconfirmed",
  actor: ProjectDiscoveryActor,
): Promise<ConfirmItemResult> {
  const supabase = getAdminSupabase();
  const { data: existingRow } = await supabase.from("business_project_discovery_items").select(ITEM_COLUMNS).eq("id", itemId).eq("business_id", businessId).maybeSingle();
  if (!existingRow) return { ok: false, reason: "not_found" };
  const existing = mapItemRow(existingRow);

  const { data, error } = await supabase
    .from("business_project_discovery_items")
    .update({
      confirmation_state: confirmationState,
      client_confirmed_at: confirmationState === "confirmed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("business_id", businessId)
    .select(ITEM_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "update_failed" };

  const updated = mapItemRow(data);
  await appendDiscoveryEvent({
    businessId,
    discoveryId: existing.discoveryId,
    entityType: "item",
    entityId: itemId,
    eventType: "confirmation_changed",
    previousState: existing.confirmationState,
    newState: confirmationState,
    source: "staff_review",
    actor,
  });
  return { ok: true, item: updated };
}

/** Items whose completeness class blocks build or launch and are not yet client-confirmed. */
export async function listBlockingProjectDiscoveryItems(discoveryId: string, businessId: string): Promise<ProjectDiscoveryItem[]> {
  const items = await listProjectDiscoveryItems(discoveryId, businessId);
  return items.filter(isBlockingDiscoveryItem);
}

// =================================================================================================
// Source / evidence + asset references
// =================================================================================================
const SOURCE_COLUMNS =
  "id, business_id, discovery_id, item_id, source_type, source_record_id, business_source_file_id, external_url, label, notes, created_actor_type, created_by_roster_id, created_by_auth_user_id, created_by_email, created_by_role, created_at";

function mapSourceRow(row: Record<string, unknown>): ProjectDiscoverySource {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    discoveryId: String(row.discovery_id),
    itemId: (row.item_id as string | null) ?? null,
    sourceType: row.source_type as ProjectDiscoverySource["sourceType"],
    sourceRecordId: (row.source_record_id as string | null) ?? null,
    businessSourceFileId: (row.business_source_file_id as string | null) ?? null,
    externalUrl: (row.external_url as string | null) ?? null,
    label: (row.label as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdActorType: row.created_actor_type as "staff" | "owner" | "system",
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByAuthUserId: (row.created_by_auth_user_id as string | null) ?? null,
    createdByEmail: (row.created_by_email as string | null) ?? null,
    createdByRole: String(row.created_by_role),
    createdAt: String(row.created_at),
  };
}

export type AttachSourceResult =
  | { ok: true; source: ProjectDiscoverySource }
  | { ok: false; reason: "asset_requires_file" | "asset_cross_business" | "insert_failed" };

/**
 * business_source_files has no UNIQUE(id, business_id) to compose a DB-level same-business FK
 * against (it belongs to the unrelated, untouched Field Discovery domain) — same-business is
 * verified here at the repository layer instead, matching the accepted fallback tier already used
 * elsewhere in this codebase (see this migration's own header comment).
 */
export async function attachProjectDiscoverySource(input: AttachProjectDiscoverySourceInput, actor: ProjectDiscoveryActor): Promise<AttachSourceResult> {
  const supabase = getAdminSupabase();

  if (input.sourceType === "asset") {
    if (!input.businessSourceFileId) return { ok: false, reason: "asset_requires_file" };
    const { data: fileRow } = await supabase.from("business_source_files").select("business_id").eq("id", input.businessSourceFileId).maybeSingle();
    if (!fileRow || assetReferenceCrossesBusinessBoundary(String((fileRow as { business_id: string }).business_id), input.businessId)) {
      return { ok: false, reason: "asset_cross_business" };
    }
  }

  const { data, error } = await supabase
    .from("business_project_discovery_sources")
    .insert({
      business_id: input.businessId,
      discovery_id: input.discoveryId,
      item_id: input.itemId ?? null,
      source_type: input.sourceType,
      source_record_id: input.sourceRecordId ?? null,
      business_source_file_id: input.businessSourceFileId ?? null,
      external_url: input.externalUrl ?? null,
      label: input.label ?? null,
      notes: input.notes ?? null,
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actorAuthUserId(actor),
      created_by_email: actorEmail(actor),
      created_by_role: actorRole(actor),
    })
    .select(SOURCE_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "insert_failed" };

  const source = mapSourceRow(data);
  await appendDiscoveryEvent({
    businessId: input.businessId,
    discoveryId: input.discoveryId,
    entityType: "source",
    entityId: source.id,
    eventType: "attached",
    source: input.sourceType,
    actor,
  });
  return { ok: true, source };
}

export async function listProjectDiscoverySources(discoveryId: string, businessId: string): Promise<ProjectDiscoverySource[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_discovery_sources")
    .select(SOURCE_COLUMNS)
    .eq("discovery_id", discoveryId)
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(mapSourceRow);
}

// =================================================================================================
// Consent — minimal reference model, append-only. No recording/transcript reference column exists.
// =================================================================================================
const CONSENT_COLUMNS =
  "id, business_id, discovery_id, consent_type, state, method, language, scope_details, recorded_actor_type, recorded_by_roster_id, recorded_by_auth_user_id, recorded_by_email, recorded_by_role, created_at";

function mapConsentRow(row: Record<string, unknown>): ProjectDiscoveryConsent {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    discoveryId: String(row.discovery_id),
    consentType: row.consent_type as ProjectDiscoveryConsent["consentType"],
    state: row.state as ProjectDiscoveryConsent["state"],
    method: row.method as ProjectDiscoveryConsent["method"],
    language: row.language as "es" | "en",
    scopeDetails: (row.scope_details as Record<string, unknown> | null) ?? null,
    recordedActorType: row.recorded_actor_type as "staff" | "owner",
    recordedByRosterId: (row.recorded_by_roster_id as string | null) ?? null,
    recordedByAuthUserId: String(row.recorded_by_auth_user_id),
    recordedByEmail: String(row.recorded_by_email),
    recordedByRole: String(row.recorded_by_role),
    createdAt: String(row.created_at),
  };
}

export type RecordConsentResult = { ok: true; consent: ProjectDiscoveryConsent } | { ok: false; reason: "insert_failed" };

export async function recordProjectDiscoveryConsent(
  input: RecordProjectDiscoveryConsentInput,
  actor: Extract<ProjectDiscoveryActor, { type: "staff" | "owner" }>,
): Promise<RecordConsentResult> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_discovery_consents")
    .insert({
      business_id: input.businessId,
      discovery_id: input.discoveryId,
      consent_type: input.consentType,
      state: input.state,
      method: input.method,
      language: input.language,
      scope_details: input.scopeDetails ?? null,
      recorded_actor_type: actor.type,
      recorded_by_roster_id: actorRosterId(actor),
      recorded_by_auth_user_id: actor.authUserId,
      recorded_by_email: actor.email,
      recorded_by_role: actorRole(actor),
    })
    .select(CONSENT_COLUMNS)
    .single();
  if (error || !data) return { ok: false, reason: "insert_failed" };

  const consent = mapConsentRow(data);
  await appendDiscoveryEvent({
    businessId: input.businessId,
    discoveryId: input.discoveryId,
    entityType: "consent",
    entityId: consent.id,
    eventType: "recorded",
    newState: consent.state,
    source: input.consentType,
    actor,
  });
  return { ok: true, consent };
}

export async function listProjectDiscoveryConsents(discoveryId: string, businessId: string): Promise<ProjectDiscoveryConsent[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_discovery_consents")
    .select(CONSENT_COLUMNS)
    .eq("discovery_id", discoveryId)
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(mapConsentRow);
}

export async function getLatestProjectDiscoveryConsentState(
  discoveryId: string,
  businessId: string,
  consentType: ProjectDiscoveryConsent["consentType"],
): Promise<ProjectDiscoveryConsent["state"] | null> {
  const consents = await listProjectDiscoveryConsents(discoveryId, businessId);
  const matching = consents.filter((c) => c.consentType === consentType);
  return matching.length > 0 ? matching[matching.length - 1].state : null;
}
