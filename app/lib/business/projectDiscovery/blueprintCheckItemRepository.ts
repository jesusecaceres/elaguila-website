/**
 * Client Discovery & Project Blueprint Engine, Gate 7 — persistence for
 * business_project_blueprint_check_items (QA / Launch / Handoff, discriminated by kind). Server-
 * only, always via getAdminSupabase(). Mirrors Gate 1's repository.ts business-scoping convention
 * exactly.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import type { CheckItemKind, CheckItemSnapshot, CheckItemStatus } from "./blueprintChecklistEngine";
import type { ProjectDiscoveryActor } from "./types";

export interface BlueprintCheckItem {
  id: string;
  businessId: string;
  blueprintId: string;
  projectIntentId: string;
  kind: CheckItemKind;
  itemKey: string;
  category: string | null;
  labelEs: string;
  labelEn: string;
  releaseBlocking: boolean;
  status: CheckItemStatus;
  note: string | null;
  evidenceSourceFileId: string | null;
  evidenceUrl: string | null;
  linkedCommitmentId: string | null;
  checkedActorType: "staff" | "owner" | null;
  checkedByRosterId: string | null;
  checkedByAuthUserId: string | null;
  checkedByEmail: string | null;
  checkedByRole: string | null;
  checkedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const CHECK_ITEM_COLUMNS = `id, business_id, blueprint_id, project_intent_id, kind, item_key, category, label_es, label_en, release_blocking, status, note, evidence_source_file_id, evidence_url, linked_commitment_id, checked_actor_type, checked_by_roster_id, checked_by_auth_user_id, checked_by_email, checked_by_role, checked_at, created_at, updated_at`;

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

function mapCheckItemRow(row: Record<string, unknown>): BlueprintCheckItem {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    blueprintId: String(row.blueprint_id),
    projectIntentId: String(row.project_intent_id),
    kind: row.kind as CheckItemKind,
    itemKey: String(row.item_key),
    category: (row.category as string | null) ?? null,
    labelEs: String(row.label_es),
    labelEn: String(row.label_en),
    releaseBlocking: Boolean(row.release_blocking),
    status: row.status as CheckItemStatus,
    note: (row.note as string | null) ?? null,
    evidenceSourceFileId: (row.evidence_source_file_id as string | null) ?? null,
    evidenceUrl: (row.evidence_url as string | null) ?? null,
    linkedCommitmentId: (row.linked_commitment_id as string | null) ?? null,
    checkedActorType: (row.checked_actor_type as "staff" | "owner" | null) ?? null,
    checkedByRosterId: (row.checked_by_roster_id as string | null) ?? null,
    checkedByAuthUserId: (row.checked_by_auth_user_id as string | null) ?? null,
    checkedByEmail: (row.checked_by_email as string | null) ?? null,
    checkedByRole: (row.checked_by_role as string | null) ?? null,
    checkedAt: (row.checked_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listCheckItemsForBlueprint(businessId: string, blueprintId: string, kind?: CheckItemKind): Promise<BlueprintCheckItem[]> {
  const supabase = getAdminSupabase();
  let query = supabase
    .from("business_project_blueprint_check_items")
    .select(CHECK_ITEM_COLUMNS)
    .eq("business_id", businessId)
    .eq("blueprint_id", blueprintId);
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(mapCheckItemRow);
}

/**
 * Idempotent upsert-by-(blueprint_id, kind, item_key) — regenerating the same blueprint version's
 * checklist (e.g. after a code fix to the generator) never duplicates rows, matching the DB's own
 * unique constraint. Existing status/note/evidence on an already-snapshotted item is preserved
 * (never silently reset) unless the caller explicitly re-snapshots with a status.
 */
export async function ensureCheckItemsSnapshot(
  businessId: string,
  blueprintId: string,
  projectIntentId: string,
  snapshots: readonly CheckItemSnapshot[],
): Promise<{ ok: boolean }> {
  if (snapshots.length === 0) return { ok: true };
  const supabase = getAdminSupabase();
  const existing = await listCheckItemsForBlueprint(businessId, blueprintId);
  const existingKeys = new Set(existing.map((i) => `${i.kind}:${i.itemKey}`));
  const toInsert = snapshots
    .filter((s) => !existingKeys.has(`${s.kind}:${s.itemKey}`))
    .map((s) => ({
      business_id: businessId,
      blueprint_id: blueprintId,
      project_intent_id: projectIntentId,
      kind: s.kind,
      item_key: s.itemKey,
      category: s.category,
      label_es: s.labelEs,
      label_en: s.labelEn,
      release_blocking: s.releaseBlocking,
      status: s.kind === "qa" ? "not_checked" : "pending",
    }));
  if (toInsert.length === 0) return { ok: true };
  const { error } = await supabase.from("business_project_blueprint_check_items").insert(toInsert);
  return { ok: !error };
}

export type UpdateCheckItemResult = { ok: true; item: BlueprintCheckItem } | { ok: false; reason: "not_found" | "update_failed" };

export async function updateCheckItemStatus(
  businessId: string,
  itemId: string,
  input: { status: CheckItemStatus; note?: string | null; evidenceSourceFileId?: string | null; evidenceUrl?: string | null },
  actor: Extract<ProjectDiscoveryActor, { type: "staff" | "owner" }>,
): Promise<UpdateCheckItemResult> {
  const supabase = getAdminSupabase();
  const isUntouched = input.status === "not_checked" || input.status === "pending";
  const { data, error } = await supabase
    .from("business_project_blueprint_check_items")
    .update({
      status: input.status,
      note: input.note ?? null,
      evidence_source_file_id: input.evidenceSourceFileId ?? null,
      evidence_url: input.evidenceUrl ?? null,
      checked_actor_type: isUntouched ? null : actor.type,
      checked_by_roster_id: isUntouched ? null : actorRosterId(actor),
      checked_by_auth_user_id: isUntouched ? null : actorAuthUserId(actor),
      checked_by_email: isUntouched ? null : actorEmail(actor),
      checked_by_role: isUntouched ? null : actorRole(actor),
      checked_at: isUntouched ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("business_id", businessId)
    .select(CHECK_ITEM_COLUMNS)
    .single();
  if (error) return { ok: false, reason: "update_failed" };
  if (!data) return { ok: false, reason: "not_found" };
  return { ok: true, item: mapCheckItemRow(data) };
}

export type LinkCheckItemCommitmentResult = { ok: true; item: BlueprintCheckItem } | { ok: false; reason: "not_found" | "update_failed" };

export async function linkCheckItemCommitment(businessId: string, itemId: string, commitmentId: string): Promise<LinkCheckItemCommitmentResult> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_blueprint_check_items")
    .update({ linked_commitment_id: commitmentId, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("business_id", businessId)
    .select(CHECK_ITEM_COLUMNS)
    .single();
  if (error) return { ok: false, reason: "update_failed" };
  if (!data) return { ok: false, reason: "not_found" };
  return { ok: true, item: mapCheckItemRow(data) };
}
