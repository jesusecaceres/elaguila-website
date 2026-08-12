/**
 * Program 7 — Proactive Advisor repository.
 * Server-only, always via getAdminSupabase(). Every write requires an AdvisorActor.
 * Signals never auto-send messages, create recommendations, or charge.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import type { DetectedSignal } from "./logic";
import type {
  BusinessAdvisorSignal, BusinessAdvisorSignalEvent, AdvisorActor,
  AdvisorSignalType, AdvisorSignalSeverity, AdvisorSignalStatus,
  AdvisorSourceType, AdvisorEventType,
} from "./types";

function actorRosterId(actor: AdvisorActor): string | null {
  return actor.type === "staff" ? actor.rosterId : null;
}
function actorRole(actor: AdvisorActor): string {
  return actor.type === "staff" ? actor.role : "business_owner";
}

const SIGNAL_COLUMNS =
  "id, business_id, signal_type, severity, status, source_type, source_reference_id, title_es, title_en, explanation_es, explanation_en, detected_at, acknowledged_at, resolved_at, expires_at, created_actor_type, created_by_roster_id, created_by_auth_user_id, created_by_email, created_by_role, created_at, updated_at";

function mapSignalRow(row: Record<string, unknown>): BusinessAdvisorSignal {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    signalType: row.signal_type as AdvisorSignalType,
    severity: row.severity as AdvisorSignalSeverity,
    status: row.status as AdvisorSignalStatus,
    sourceType: row.source_type as AdvisorSourceType,
    sourceReferenceId: (row.source_reference_id as string | null) ?? null,
    titleEs: String(row.title_es),
    titleEn: String(row.title_en),
    explanationEs: String(row.explanation_es),
    explanationEn: String(row.explanation_en),
    detectedAt: String(row.detected_at),
    acknowledgedAt: (row.acknowledged_at as string | null) ?? null,
    resolvedAt: (row.resolved_at as string | null) ?? null,
    expiresAt: (row.expires_at as string | null) ?? null,
    createdActorType: row.created_actor_type as "staff" | "owner" | "system",
    createdByRosterId: (row.created_by_roster_id as string | null) ?? null,
    createdByAuthUserId: (row.created_by_auth_user_id as string | null) ?? null,
    createdByEmail: (row.created_by_email as string | null) ?? null,
    createdByRole: String(row.created_by_role),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listActiveSignals(businessId: string): Promise<BusinessAdvisorSignal[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_advisor_signals")
    .select(SIGNAL_COLUMNS)
    .eq("business_id", businessId)
    .eq("status", "active")
    .order("detected_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapSignalRow);
}

export async function listAllSignals(businessId: string): Promise<BusinessAdvisorSignal[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_advisor_signals")
    .select(SIGNAL_COLUMNS)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapSignalRow);
}

export async function getSignalById(businessId: string, signalId: string): Promise<BusinessAdvisorSignal | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_advisor_signals")
    .select(SIGNAL_COLUMNS)
    .eq("id", signalId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  return mapSignalRow(data);
}

export type CreateSignalInput = {
  signalType: AdvisorSignalType;
  severity: AdvisorSignalSeverity;
  sourceType: AdvisorSourceType;
  sourceReferenceId?: string | null;
  titleEs: string;
  titleEn: string;
  explanationEs: string;
  explanationEn: string;
  expiresAt?: string | null;
};

export async function createSignal(
  businessId: string,
  input: CreateSignalInput,
  actor: AdvisorActor,
): Promise<BusinessAdvisorSignal | null> {
  const now = new Date().toISOString();
  const supabase = getAdminSupabase();

  const { data: signalRow, error: signalError } = await supabase
    .from("business_advisor_signals")
    .insert({
      business_id: businessId,
      signal_type: input.signalType,
      severity: input.severity,
      status: "active",
      source_type: input.sourceType,
      source_reference_id: input.sourceReferenceId ?? null,
      title_es: input.titleEs,
      title_en: input.titleEn,
      explanation_es: input.explanationEs,
      explanation_en: input.explanationEn,
      detected_at: now,
      expires_at: input.expiresAt ?? null,
      created_actor_type: actor.type,
      created_by_roster_id: actorRosterId(actor),
      created_by_auth_user_id: actor.authUserId,
      created_by_email: actor.email,
      created_by_role: actorRole(actor),
    })
    .select(SIGNAL_COLUMNS)
    .single();
  if (signalError || !signalRow) return null;

  const signal = mapSignalRow(signalRow);

  await supabase.from("business_advisor_signal_events").insert({
    business_id: businessId,
    signal_id: signal.id,
    event_type: "detected",
    event_actor_type: actor.type,
    event_by_roster_id: actorRosterId(actor),
    event_by_auth_user_id: actor.authUserId,
    event_by_email: actor.email,
    event_by_role: actorRole(actor),
    event_note: null,
  });

  return signal;
}

async function transitionSignal(
  businessId: string,
  signalId: string,
  newStatus: AdvisorSignalStatus,
  eventType: AdvisorEventType,
  actor: AdvisorActor,
  note?: string | null,
): Promise<BusinessAdvisorSignal | null> {
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const updateFields: Record<string, unknown> = {
    status: newStatus,
    updated_at: now,
  };
  if (newStatus === "acknowledged") updateFields.acknowledged_at = now;
  if (newStatus === "resolved") updateFields.resolved_at = now;

  const { data, error } = await supabase
    .from("business_advisor_signals")
    .update(updateFields)
    .eq("id", signalId)
    .eq("business_id", businessId)
    .select(SIGNAL_COLUMNS)
    .single();
  if (error || !data) return null;

  await supabase.from("business_advisor_signal_events").insert({
    business_id: businessId,
    signal_id: signalId,
    event_type: eventType,
    event_actor_type: actor.type,
    event_by_roster_id: actorRosterId(actor),
    event_by_auth_user_id: actor.authUserId,
    event_by_email: actor.email,
    event_by_role: actorRole(actor),
    event_note: note ?? null,
  });

  return mapSignalRow(data);
}

export async function acknowledgeSignal(
  businessId: string,
  signalId: string,
  actor: AdvisorActor,
  note?: string | null,
): Promise<BusinessAdvisorSignal | null> {
  return transitionSignal(businessId, signalId, "acknowledged", "acknowledged", actor, note);
}

export async function resolveSignal(
  businessId: string,
  signalId: string,
  actor: AdvisorActor,
  note?: string | null,
): Promise<BusinessAdvisorSignal | null> {
  return transitionSignal(businessId, signalId, "resolved", "resolved", actor, note);
}

export async function dismissSignal(
  businessId: string,
  signalId: string,
  actor: AdvisorActor,
  note?: string | null,
): Promise<BusinessAdvisorSignal | null> {
  return transitionSignal(businessId, signalId, "dismissed", "dismissed", actor, note);
}

export async function listEventsForSignal(businessId: string, signalId: string): Promise<BusinessAdvisorSignalEvent[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_advisor_signal_events")
    .select("*")
    .eq("business_id", businessId)
    .eq("signal_id", signalId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as BusinessAdvisorSignalEvent[];
}

export type { DetectedSignal };
