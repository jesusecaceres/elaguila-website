/**
 * LEO-3 Living Leonix Book repository — server-only persistence seam.
 *
 * No delete helper. No AI. No automatic persistence from Admin/Reason reads.
 * Atomicity: create + supersede use sequential service-role calls (no RPC).
 * If the mark-superseded step fails after insert, the new row remains and the
 * limitation is returned — callers must not hide that.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import type {
  LeoCreateMemoryInput,
  LeoMemoryConfidence,
  LeoMemoryEpistemicType,
  LeoMemoryEvidenceReference,
  LeoMemoryRecord,
  LeoMemorySourceActorType,
  LeoMemoryStatus,
  LeoRecordContradictionInput,
  LeoSupersedeMemoryInput,
} from "@/app/leo/_lib/leoTypes";

export const LEO_MEMORY_LIST_MAX = 50;
export const LEO_MEMORY_STATEMENT_MAX = 8000;

type DbRow = {
  id: string;
  subject_type: string;
  subject_key: string;
  subject_refs: unknown;
  epistemic_type: string;
  status: string;
  statement: string;
  source_actor_type: string;
  source_actor_id: string | null;
  source_system: string;
  source_reference: unknown;
  evidence: unknown;
  confidence: string | null;
  supersedes_id: string | null;
  contradicts_ids: string[] | null;
  valid_from: string | null;
  valid_to: string | null;
  created_at: string;
  updated_at: string;
  superseded_at: string | null;
  created_by_roster_id: string | null;
  created_by_auth_user_id: string | null;
};

const SELECT_COLS =
  "id, subject_type, subject_key, subject_refs, epistemic_type, status, statement, source_actor_type, source_actor_id, source_system, source_reference, evidence, confidence, supersedes_id, contradicts_ids, valid_from, valid_to, created_at, updated_at, superseded_at, created_by_roster_id, created_by_auth_user_id";

function nonEmpty(v: string | null | undefined): string | null {
  const s = v?.trim();
  return s ? s : null;
}

function asEvidenceArray(value: unknown): LeoMemoryEvidenceReference[] {
  if (!Array.isArray(value)) return [];
  const out: LeoMemoryEvidenceReference[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const kind = nonEmpty(o.kind != null ? String(o.kind) : null);
    if (!kind) continue;
    out.push({
      kind,
      id: o.id != null ? String(o.id) : undefined,
      summary: o.summary != null ? String(o.summary).slice(0, 500) : undefined,
      system: o.system != null ? String(o.system) : undefined,
      table: o.table != null ? String(o.table) : undefined,
    });
  }
  return out;
}

function asSubjectRefs(value: unknown): LeoMemoryRecord["subject"]["refs"] {
  if (!Array.isArray(value)) return [];
  const out: NonNullable<LeoMemoryRecord["subject"]["refs"]> = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const system = nonEmpty(o.system != null ? String(o.system) : null);
    if (!system) continue;
    out.push({
      system,
      table: o.table != null ? String(o.table) : undefined,
      id: o.id != null ? String(o.id) : undefined,
    });
  }
  return out;
}

function mapRow(row: DbRow): LeoMemoryRecord {
  return {
    id: row.id,
    subject: {
      subjectType: row.subject_type,
      subjectKey: row.subject_key,
      refs: asSubjectRefs(row.subject_refs),
    },
    epistemicType: row.epistemic_type as LeoMemoryEpistemicType,
    status: row.status as LeoMemoryStatus,
    statement: row.statement,
    source: {
      actorType: row.source_actor_type as LeoMemorySourceActorType,
      actorId: row.source_actor_id,
      system: row.source_system,
      reference:
        row.source_reference && typeof row.source_reference === "object"
          ? (row.source_reference as Record<string, unknown>)
          : {},
    },
    evidence: asEvidenceArray(row.evidence),
    confidence: (row.confidence as LeoMemoryConfidence | null) ?? null,
    supersedesId: row.supersedes_id,
    contradictsIds: Array.isArray(row.contradicts_ids) ? row.contradicts_ids.map(String) : [],
    validFrom: row.valid_from,
    validTo: row.valid_to,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    supersededAt: row.superseded_at,
    createdByRosterId: row.created_by_roster_id,
    createdByAuthUserId: row.created_by_auth_user_id,
  };
}

export type LeoMemoryWriteActor = {
  rosterId?: string | null;
  authUserId?: string | null;
};

export type LeoCreateMemoryResult =
  | { ok: true; record: LeoMemoryRecord }
  | { ok: false; error: string };

export type LeoSupersedeMemoryResult =
  | {
      ok: true;
      previous: LeoMemoryRecord;
      replacement: LeoMemoryRecord;
      /** True when both insert and mark-superseded succeeded. */
      fullyApplied: boolean;
      limitationNote?: string;
    }
  | { ok: false; error: string };

function validateCreateInput(input: LeoCreateMemoryInput): string | null {
  if (!nonEmpty(input.subject?.subjectType)) return "subject.subjectType is required";
  if (!nonEmpty(input.subject?.subjectKey)) return "subject.subjectKey is required";
  if (!nonEmpty(input.statement)) return "statement is required";
  if (input.statement.trim().length > LEO_MEMORY_STATEMENT_MAX) {
    return `statement exceeds ${LEO_MEMORY_STATEMENT_MAX} characters`;
  }
  if (!input.source || !nonEmpty(input.source.system)) {
    return "source.system provenance is required";
  }
  if (!input.source.actorType) {
    return "source.actorType provenance is required";
  }
  if (!input.epistemicType) return "epistemicType is required";
  return null;
}

function toInsertPatch(
  input: LeoCreateMemoryInput,
  actor: LeoMemoryWriteActor,
  extras?: { supersedesId?: string | null },
): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    subject_type: input.subject.subjectType.trim(),
    subject_key: input.subject.subjectKey.trim(),
    subject_refs: input.subject.refs ?? [],
    epistemic_type: input.epistemicType,
    status: input.status ?? "active",
    statement: input.statement.trim(),
    source_actor_type: input.source.actorType,
    source_actor_id: nonEmpty(input.source.actorId ?? null),
    source_system: input.source.system.trim(),
    source_reference: input.source.reference ?? {},
    evidence: input.evidence ?? [],
    confidence: input.confidence ?? null,
    supersedes_id: extras?.supersedesId ?? null,
    contradicts_ids: input.contradictsIds ?? [],
    valid_from: input.validFrom ?? null,
    valid_to: input.validTo ?? null,
    created_at: now,
    updated_at: now,
    superseded_at: null,
    created_by_roster_id: nonEmpty(actor.rosterId ?? null),
    created_by_auth_user_id: nonEmpty(actor.authUserId ?? null),
  };
}

/** Create a durable memory record. Fails closed without provenance. */
export async function createLeoMemoryRecord(
  input: LeoCreateMemoryInput,
  actor: LeoMemoryWriteActor = {},
): Promise<LeoCreateMemoryResult> {
  const invalid = validateCreateInput(input);
  if (invalid) return { ok: false, error: invalid };

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_memory_records")
    .insert(toInsertPatch(input, actor))
    .select(SELECT_COLS)
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "insert_failed" };
  }
  return { ok: true, record: mapRow(data as DbRow) };
}

export async function getLeoMemoryRecordById(id: string): Promise<LeoMemoryRecord | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_memory_records")
    .select(SELECT_COLS)
    .eq("id", trimmed)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as DbRow);
}

/** Active memories for a subject — bounded. */
export async function listActiveLeoMemoryForSubject(
  subjectType: string,
  subjectKey: string,
  limit = 20,
): Promise<LeoMemoryRecord[]> {
  const type = subjectType.trim();
  const key = subjectKey.trim();
  if (!type || !key) return [];
  const capped = Math.min(Math.max(1, limit), LEO_MEMORY_LIST_MAX);
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_memory_records")
    .select(SELECT_COLS)
    .eq("subject_type", type)
    .eq("subject_key", key)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(capped);
  if (error || !data) return [];
  return (data as DbRow[]).map(mapRow);
}

/** Recent memories across subjects — bounded. */
export async function listRecentLeoMemoryRecords(limit = 20): Promise<LeoMemoryRecord[]> {
  const capped = Math.min(Math.max(1, limit), LEO_MEMORY_LIST_MAX);
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leo_memory_records")
    .select(SELECT_COLS)
    .order("created_at", { ascending: false })
    .limit(capped);
  if (error || !data) return [];
  return (data as DbRow[]).map(mapRow);
}

/**
 * Supersede: create corrected record, then mark old superseded.
 * Preserves old statement/evidence unchanged.
 * Not a single DB transaction — see fullyApplied / limitationNote.
 */
export async function supersedeLeoMemoryRecord(
  input: LeoSupersedeMemoryInput,
  actor: LeoMemoryWriteActor = {},
): Promise<LeoSupersedeMemoryResult> {
  const previousId = input.previousId.trim();
  if (!previousId) return { ok: false, error: "previousId is required" };

  const invalid = validateCreateInput(input.replacement);
  if (invalid) return { ok: false, error: invalid };

  const previous = await getLeoMemoryRecordById(previousId);
  if (!previous) return { ok: false, error: "previous_not_found" };
  if (previous.status === "superseded") {
    return { ok: false, error: "previous_already_superseded" };
  }

  const supabase = getAdminSupabase();
  const { data: inserted, error: insertErr } = await supabase
    .from("leo_memory_records")
    .insert(toInsertPatch(input.replacement, actor, { supersedesId: previousId }))
    .select(SELECT_COLS)
    .single();

  if (insertErr || !inserted) {
    return { ok: false, error: insertErr?.message ?? "replacement_insert_failed" };
  }

  const replacement = mapRow(inserted as DbRow);
  const now = new Date().toISOString();
  const { data: updated, error: updateErr } = await supabase
    .from("leo_memory_records")
    .update({
      status: "superseded",
      superseded_at: now,
      updated_at: now,
    })
    .eq("id", previousId)
    .neq("status", "superseded")
    .select(SELECT_COLS)
    .maybeSingle();

  if (updateErr || !updated) {
    return {
      ok: true,
      previous,
      replacement,
      fullyApplied: false,
      limitationNote:
        "Replacement memory was created, but marking the previous record superseded failed. Manual repair may be required — history was not deleted.",
    };
  }

  return {
    ok: true,
    previous: mapRow(updated as DbRow),
    replacement,
    fullyApplied: true,
  };
}

/**
 * Link two memories as contradictions. Preserves both statements.
 * Not a single transaction across both updates.
 */
export async function recordLeoMemoryContradiction(
  input: LeoRecordContradictionInput,
): Promise<{ ok: true; left: LeoMemoryRecord; right: LeoMemoryRecord } | { ok: false; error: string }> {
  const leftId = input.leftId.trim();
  const rightId = input.rightId.trim();
  if (!leftId || !rightId) return { ok: false, error: "both ids required" };
  if (leftId === rightId) return { ok: false, error: "cannot_contradict_self" };

  const left = await getLeoMemoryRecordById(leftId);
  const right = await getLeoMemoryRecordById(rightId);
  if (!left || !right) return { ok: false, error: "record_not_found" };

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const leftIds = [...new Set([...left.contradictsIds, rightId])];
  const rightIds = [...new Set([...right.contradictsIds, leftId])];

  const { data: leftUpdated, error: leftErr } = await supabase
    .from("leo_memory_records")
    .update({ contradicts_ids: leftIds, updated_at: now })
    .eq("id", leftId)
    .select(SELECT_COLS)
    .single();
  if (leftErr || !leftUpdated) {
    return { ok: false, error: leftErr?.message ?? "left_update_failed" };
  }

  const { data: rightUpdated, error: rightErr } = await supabase
    .from("leo_memory_records")
    .update({ contradicts_ids: rightIds, updated_at: now })
    .eq("id", rightId)
    .select(SELECT_COLS)
    .single();
  if (rightErr || !rightUpdated) {
    return { ok: false, error: rightErr?.message ?? "right_update_failed" };
  }

  return {
    ok: true,
    left: mapRow(leftUpdated as DbRow),
    right: mapRow(rightUpdated as DbRow),
  };
}

/** Pure helper for verifiers — proves create rejects missing provenance. */
export function leoCreateMemoryRequiresProvenance(input: Partial<LeoCreateMemoryInput>): boolean {
  const sourceOk = Boolean(input.source?.system?.trim() && input.source?.actorType);
  const subjectOk = Boolean(input.subject?.subjectType?.trim() && input.subject?.subjectKey?.trim());
  const statementOk = Boolean(input.statement?.trim());
  const epistemicOk = Boolean(input.epistemicType);
  return sourceOk && subjectOk && statementOk && epistemicOk;
}
