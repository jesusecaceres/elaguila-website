import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { DRAFT_DEFAULT_TTL_MS } from "../constants";
import type { BusinessOnboardingDraft, BusinessOnboardingDraftPayload } from "../types";

type DraftRow = {
  id: string;
  user_id: string;
  intent_key: string;
  business_id: string | null;
  current_step: number;
  draft_payload: unknown;
  created_at: string;
  updated_at: string;
  expires_at: string;
};

const DRAFT_COLUMNS = "id, user_id, intent_key, business_id, current_step, draft_payload, created_at, updated_at, expires_at";

function isDraftPayload(value: unknown): value is BusinessOnboardingDraftPayload {
  if (typeof value !== "object" || value === null) return false;
  const version = (value as { schemaVersion?: unknown }).schemaVersion;
  return version === 1 || version === 2;
}

function mapDraftRow(row: DraftRow): BusinessOnboardingDraft {
  const payload: BusinessOnboardingDraftPayload = isDraftPayload(row.draft_payload) ? row.draft_payload : { schemaVersion: 1 };
  return {
    id: row.id,
    userId: row.user_id,
    intentKey: row.intent_key,
    businessId: row.business_id,
    currentStep: row.current_step,
    draftPayload: payload,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
  };
}

/**
 * `client` MUST be the user-scoped (RLS-enforced) client — business_onboarding_drafts is the
 * one table in this schema with direct client mutation policies, all scoped to
 * `user_id = auth.uid()`. Never pass the admin client here for a call reachable from user
 * input; that would bypass the very isolation this table's RLS exists to guarantee.
 */
export async function listDraftsForCurrentUser(client: SupabaseClient): Promise<BusinessOnboardingDraft[]> {
  const { data, error } = await client.from("business_onboarding_drafts").select(DRAFT_COLUMNS).order("updated_at", { ascending: false });
  if (error || !data) return [];
  return (data as DraftRow[]).map(mapDraftRow);
}

export async function getDraftByIntentKey(client: SupabaseClient, intentKey: string): Promise<BusinessOnboardingDraft | null> {
  const { data, error } = await client.from("business_onboarding_drafts").select(DRAFT_COLUMNS).eq("intent_key", intentKey).maybeSingle();
  if (error || !data) return null;
  return mapDraftRow(data as DraftRow);
}

export async function getDraftById(client: SupabaseClient, draftId: string): Promise<BusinessOnboardingDraft | null> {
  const { data, error } = await client.from("business_onboarding_drafts").select(DRAFT_COLUMNS).eq("id", draftId).maybeSingle();
  if (error || !data) return null;
  return mapDraftRow(data as DraftRow);
}

/**
 * Upserts by (user_id, intent_key) — the RLS INSERT/UPDATE policies both require
 * `user_id = auth.uid()`; the caller's `userId` here is only used to satisfy that column,
 * never trusted as an authorization decision by itself (RLS enforces the real check).
 */
export async function upsertOwnDraft(
  client: SupabaseClient,
  params: {
    userId: string;
    intentKey: string;
    currentStep: number;
    draftPayload: BusinessOnboardingDraftPayload;
    expiresAt?: string;
  },
): Promise<BusinessOnboardingDraft | null> {
  const expiresAt = params.expiresAt ?? new Date(Date.now() + DRAFT_DEFAULT_TTL_MS).toISOString();
  const { data, error } = await client
    .from("business_onboarding_drafts")
    .upsert(
      {
        user_id: params.userId,
        intent_key: params.intentKey,
        current_step: params.currentStep,
        draft_payload: params.draftPayload,
        expires_at: expiresAt,
      },
      { onConflict: "user_id,intent_key" },
    )
    .select(DRAFT_COLUMNS)
    .maybeSingle();
  if (error || !data) return null;
  return mapDraftRow(data as DraftRow);
}

export async function deleteOwnDraftById(client: SupabaseClient, draftId: string): Promise<boolean> {
  const { error } = await client.from("business_onboarding_drafts").delete().eq("id", draftId);
  return !error;
}

/** Best-effort sweep of the caller's own expired drafts; safe to call opportunistically. */
export async function deleteExpiredDraftsForCurrentUser(client: SupabaseClient): Promise<number> {
  const { data, error } = await client.from("business_onboarding_drafts").delete().lt("expires_at", new Date().toISOString()).select("id");
  if (error || !data) return 0;
  return data.length;
}
