/**
 * LEO-14.1 commitment repository — server-only, service-role, owner-isolated.
 * Candidates cannot be silently promoted; use confirmLeoCommitmentCandidate.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import type {
  LeoCommitment,
  LeoCommitmentCreatedBy,
  LeoCommitmentCreationMethod,
  LeoCommitmentKind,
  LeoCommitmentPriority,
  LeoCommitmentStatus,
  LeoConversationEntityRef,
  LeoMemoryConfidence,
} from "@/app/leo/_lib/leoTypes";

export const LEO_COMMITMENT_LIST_MAX = 100;
export const LEO_COMMITMENT_TITLE_MAX = 500;
export const LEO_COMMITMENT_TEXT_MAX = 2000;

type Row = {
  id: string;
  owner_auth_user_id: string;
  title: string;
  normalized_text: string;
  kind: string;
  status: string;
  due_at: string | null;
  timezone: string | null;
  counterparty: string | null;
  source_type: string;
  source_ref: unknown;
  provenance: unknown;
  evidence_at: string | null;
  created_by: string;
  creation_method: string;
  priority: string;
  category: string | null;
  acknowledged_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  superseded_by: string | null;
  confidence: string | null;
  notes: string | null;
  related_refs: unknown;
  created_at: string;
  updated_at: string;
};

const COLS =
  "id, owner_auth_user_id, title, normalized_text, kind, status, due_at, timezone, counterparty, source_type, source_ref, provenance, evidence_at, created_by, creation_method, priority, category, acknowledged_at, completed_at, cancelled_at, superseded_by, confidence, notes, related_refs, created_at, updated_at";

function nonEmpty(v: string | null | undefined): string | null {
  const s = v?.trim();
  return s ? s : null;
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asEntityRefs(value: unknown): LeoConversationEntityRef[] {
  if (!Array.isArray(value)) return [];
  const out: LeoConversationEntityRef[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const system = nonEmpty(o.system != null ? String(o.system) : null);
    const kind = nonEmpty(o.kind != null ? String(o.kind) : null);
    const id = nonEmpty(o.id != null ? String(o.id) : null);
    if (!system || !kind || !id) continue;
    out.push({ system, kind, id, label: o.label != null ? String(o.label).slice(0, 200) : undefined });
  }
  return out.slice(0, 50);
}

function mapRow(row: Row): LeoCommitment {
  return {
    id: row.id,
    ownerAuthUserId: row.owner_auth_user_id,
    title: row.title,
    normalizedText: row.normalized_text,
    kind: row.kind as LeoCommitmentKind,
    status: row.status as LeoCommitmentStatus,
    dueAt: row.due_at,
    timezone: row.timezone,
    counterparty: row.counterparty,
    sourceType: row.source_type,
    sourceRef: asObject(row.source_ref),
    provenance: asObject(row.provenance),
    evidenceAt: row.evidence_at,
    createdBy: row.created_by as LeoCommitmentCreatedBy,
    creationMethod: row.creation_method as LeoCommitmentCreationMethod,
    priority: row.priority as LeoCommitmentPriority,
    category: row.category,
    acknowledgedAt: row.acknowledged_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    supersededBy: row.superseded_by,
    confidence: (row.confidence as LeoMemoryConfidence | null) ?? null,
    notes: row.notes,
    relatedRefs: asEntityRefs(row.related_refs),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type LeoCreateCommitmentInput = {
  ownerAuthUserId: string;
  title: string;
  normalizedText: string;
  kind: LeoCommitmentKind;
  dueAt?: string | null;
  timezone?: string | null;
  counterparty?: string | null;
  sourceType: string;
  sourceRef?: Record<string, unknown>;
  provenance?: Record<string, unknown>;
  evidenceAt?: string | null;
  createdBy: LeoCommitmentCreatedBy;
  creationMethod: LeoCommitmentCreationMethod;
  priority?: LeoCommitmentPriority;
  category?: string | null;
  confidence?: LeoMemoryConfidence | null;
  notes?: string | null;
  relatedRefs?: LeoConversationEntityRef[];
};

function validateCreate(input: LeoCreateCommitmentInput): string | null {
  if (!nonEmpty(input.ownerAuthUserId)) return "owner_auth_user_id_required";
  if (!nonEmpty(input.title) || input.title.trim().length > LEO_COMMITMENT_TITLE_MAX) {
    return "title_invalid";
  }
  if (!nonEmpty(input.normalizedText) || input.normalizedText.trim().length > LEO_COMMITMENT_TEXT_MAX) {
    return "normalized_text_invalid";
  }
  if (!nonEmpty(input.sourceType)) return "source_type_required";
  if (input.kind === "EXTRACTED_CANDIDATE" && input.creationMethod !== "EXTRACTED") {
    return "candidate_requires_extracted_method";
  }
  if (input.kind === "EXPLICIT_OWNER" && input.creationMethod === "EXTRACTED") {
    return "explicit_owner_cannot_use_extracted_method";
  }
  return null;
}

export async function createLeoCommitmentRecord(
  input: LeoCreateCommitmentInput,
): Promise<{ ok: true; commitment: LeoCommitment } | { ok: false; error: string }> {
  const invalid = validateCreate(input);
  if (invalid) return { ok: false, error: invalid };

  const now = new Date().toISOString();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_commitments")
    .insert({
      owner_auth_user_id: input.ownerAuthUserId.trim(),
      title: input.title.trim(),
      normalized_text: input.normalizedText.trim(),
      kind: input.kind,
      status: "OPEN",
      due_at: nonEmpty(input.dueAt ?? null),
      timezone: nonEmpty(input.timezone ?? null),
      counterparty: nonEmpty(input.counterparty ?? null),
      source_type: input.sourceType.trim(),
      source_ref: input.sourceRef ?? {},
      provenance: input.provenance ?? {},
      evidence_at: nonEmpty(input.evidenceAt ?? null),
      created_by: input.createdBy,
      creation_method: input.creationMethod,
      priority: input.priority ?? "NORMAL",
      category: nonEmpty(input.category ?? null),
      confidence: input.confidence ?? null,
      notes: nonEmpty(input.notes ?? null)?.slice(0, 2000) ?? null,
      related_refs: input.relatedRefs ?? [],
      created_at: now,
      updated_at: now,
    })
    .select(COLS)
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  return { ok: true, commitment: mapRow(data as Row) };
}

export async function getLeoCommitmentForOwner(
  id: string,
  ownerAuthUserId: string,
): Promise<LeoCommitment | null> {
  const owner = nonEmpty(ownerAuthUserId);
  if (!owner || !nonEmpty(id)) return null;
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_commitments")
    .select(COLS)
    .eq("id", id)
    .eq("owner_auth_user_id", owner)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as Row);
}

export async function listLeoCommitmentsForOwner(
  ownerAuthUserId: string,
  options?: { status?: LeoCommitmentStatus; kind?: LeoCommitmentKind; limit?: number },
): Promise<LeoCommitment[]> {
  const owner = nonEmpty(ownerAuthUserId);
  if (!owner) return [];
  const capped = Math.min(
    Math.max(1, Math.floor(options?.limit ?? LEO_COMMITMENT_LIST_MAX)),
    LEO_COMMITMENT_LIST_MAX,
  );
  const supabase = getAdminSupabase();
  let q = supabase
    .from("leo_commitments")
    .select(COLS)
    .eq("owner_auth_user_id", owner)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(capped);
  if (options?.status) q = q.eq("status", options.status);
  if (options?.kind) q = q.eq("kind", options.kind);
  const { data, error } = await q;
  if (error || !data) return [];
  return (data as Row[]).map(mapRow);
}

/**
 * Promote EXTRACTED_CANDIDATE → EXPLICIT_OWNER via OWNER_CONFIRM only.
 * Never silent.
 */
export async function confirmLeoCommitmentCandidate(
  id: string,
  ownerAuthUserId: string,
): Promise<{ ok: true; commitment: LeoCommitment } | { ok: false; error: string }> {
  const existing = await getLeoCommitmentForOwner(id, ownerAuthUserId);
  if (!existing) return { ok: false, error: "not_found" };
  if (existing.kind !== "EXTRACTED_CANDIDATE") return { ok: false, error: "not_a_candidate" };
  if (existing.status !== "OPEN") return { ok: false, error: "not_open" };

  const now = new Date().toISOString();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_commitments")
    .update({
      kind: "EXPLICIT_OWNER",
      creation_method: "OWNER_CONFIRM",
      updated_at: now,
    })
    .eq("id", id)
    .eq("owner_auth_user_id", ownerAuthUserId.trim())
    .eq("kind", "EXTRACTED_CANDIDATE")
    .eq("status", "OPEN")
    .select(COLS)
    .maybeSingle();

  if (error || !data) return { ok: false, error: error?.message ?? "confirm_failed" };
  return { ok: true, commitment: mapRow(data as Row) };
}

export async function completeLeoCommitment(
  id: string,
  ownerAuthUserId: string,
): Promise<{ ok: true; commitment: LeoCommitment } | { ok: false; error: string }> {
  const existing = await getLeoCommitmentForOwner(id, ownerAuthUserId);
  if (!existing) return { ok: false, error: "not_found" };
  if (existing.status !== "OPEN") return { ok: false, error: "not_open" };

  const now = new Date().toISOString();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_commitments")
    .update({ status: "COMPLETED", completed_at: now, updated_at: now })
    .eq("id", id)
    .eq("owner_auth_user_id", ownerAuthUserId.trim())
    .eq("status", "OPEN")
    .select(COLS)
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "complete_failed" };
  return { ok: true, commitment: mapRow(data as Row) };
}

export async function cancelLeoCommitment(
  id: string,
  ownerAuthUserId: string,
): Promise<{ ok: true; commitment: LeoCommitment } | { ok: false; error: string }> {
  const existing = await getLeoCommitmentForOwner(id, ownerAuthUserId);
  if (!existing) return { ok: false, error: "not_found" };
  if (existing.status !== "OPEN") return { ok: false, error: "not_open" };

  const now = new Date().toISOString();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_commitments")
    .update({ status: "CANCELLED", cancelled_at: now, updated_at: now })
    .eq("id", id)
    .eq("owner_auth_user_id", ownerAuthUserId.trim())
    .eq("status", "OPEN")
    .select(COLS)
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "cancel_failed" };
  return { ok: true, commitment: mapRow(data as Row) };
}

export async function supersedeLeoCommitment(
  previousId: string,
  replacement: LeoCreateCommitmentInput,
): Promise<
  | { ok: true; previous: LeoCommitment; replacement: LeoCommitment }
  | { ok: false; error: string }
> {
  const owner = nonEmpty(replacement.ownerAuthUserId);
  if (!owner) return { ok: false, error: "owner_auth_user_id_required" };
  const previous = await getLeoCommitmentForOwner(previousId, owner);
  if (!previous) return { ok: false, error: "previous_not_found" };
  if (previous.status !== "OPEN") return { ok: false, error: "previous_not_open" };

  const created = await createLeoCommitmentRecord(replacement);
  if (!created.ok) return created;

  const now = new Date().toISOString();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_commitments")
    .update({
      status: "SUPERSEDED",
      superseded_by: created.commitment.id,
      updated_at: now,
    })
    .eq("id", previousId)
    .eq("owner_auth_user_id", owner)
    .eq("status", "OPEN")
    .select(COLS)
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "supersede_mark_failed",
    };
  }
  return { ok: true, previous: mapRow(data as Row), replacement: created.commitment };
}
