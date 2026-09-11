/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — persistence for
 * business_project_discovery_intent_dependencies. Server-only, always via getAdminSupabase().
 * Mirrors Gate 1's repository.ts business-scoping convention exactly.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import type { ProjectDiscoveryActor } from "./types";
import type { DependencyType, ProjectIntentDependency } from "./projectDependencyEngine";

const DEPENDENCY_COLUMNS =
  "id, business_id, discovery_id, dependent_intent_id, depends_on_intent_id, dependency_type, reason_es, reason_en, " +
  "created_actor_type, created_by_roster_id, created_by_auth_user_id, created_by_email, created_by_role, created_at";

function actorRosterId(actor: ProjectDiscoveryActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}

function mapDependencyRow(row: Record<string, unknown>): ProjectIntentDependency {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    discoveryId: String(row.discovery_id),
    dependentIntentId: String(row.dependent_intent_id),
    dependsOnIntentId: String(row.depends_on_intent_id),
    dependencyType: row.dependency_type as DependencyType,
    reasonEs: String(row.reason_es),
    reasonEn: String(row.reason_en),
    createdActorType: row.created_actor_type as "staff" | "owner",
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByAuthUserId: String(row.created_by_auth_user_id),
    createdByEmail: String(row.created_by_email),
    createdByRole: String(row.created_by_role),
    createdAt: String(row.created_at),
  };
}

export async function listIntentDependenciesForDiscovery(businessId: string, discoveryId: string): Promise<ProjectIntentDependency[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_discovery_intent_dependencies")
    .select(DEPENDENCY_COLUMNS)
    .eq("business_id", businessId)
    .eq("discovery_id", discoveryId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(mapDependencyRow);
}

export type CreateIntentDependencyResult = { ok: true; dependency: ProjectIntentDependency } | { ok: false; reason: "already_exists" | "insert_failed" };

/**
 * Creates a dependency (explicit or a system suggestion the staff explicitly accepted). Idempotent
 * against the same (dependent, depends_on) pair via the DB's own unique constraint — re-accepting
 * an already-recorded suggestion is reported as "already_exists", never a duplicate row.
 */
export async function createIntentDependency(
  input: { businessId: string; discoveryId: string; dependentIntentId: string; dependsOnIntentId: string; dependencyType: DependencyType; reasonEs: string; reasonEn: string },
  actor: Extract<ProjectDiscoveryActor, { type: "staff" | "owner" }>,
): Promise<CreateIntentDependencyResult> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_project_discovery_intent_dependencies")
    .insert({
      business_id: input.businessId,
      discovery_id: input.discoveryId,
      dependent_intent_id: input.dependentIntentId,
      depends_on_intent_id: input.dependsOnIntentId,
      dependency_type: input.dependencyType,
      reason_es: input.reasonEs,
      reason_en: input.reasonEn,
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actor.role,
    })
    .select(DEPENDENCY_COLUMNS)
    .single();
  if (error) return { ok: false, reason: error.code === "23505" ? "already_exists" : "insert_failed" };
  if (!data) return { ok: false, reason: "insert_failed" };
  return { ok: true, dependency: mapDependencyRow(data) };
}

export type RemoveIntentDependencyResult = { ok: true } | { ok: false; reason: "not_found" | "delete_failed" };

/** Staff may remove an incorrect/no-longer-relevant dependency — the discovery's own event log records who did this via the caller's own audit trail (not duplicated here, matching this small table's own minimal footprint). */
export async function removeIntentDependency(businessId: string, dependencyId: string): Promise<RemoveIntentDependencyResult> {
  const supabase = getAdminSupabase();
  const { error, count } = await supabase
    .from("business_project_discovery_intent_dependencies")
    .delete({ count: "exact" })
    .eq("id", dependencyId)
    .eq("business_id", businessId);
  if (error) return { ok: false, reason: "delete_failed" };
  if (!count) return { ok: false, reason: "not_found" };
  return { ok: true };
}
