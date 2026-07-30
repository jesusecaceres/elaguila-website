import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeDraftIntentKey } from "../normalization";
import { validateOnboardingStep } from "../validation";
import {
  deleteExpiredDraftsForCurrentUser,
  deleteOwnDraftById,
  getDraftById,
  listDraftsForCurrentUser,
  upsertOwnDraft,
} from "../repositories/draftsRepo";
import type { BusinessOnboardingDraft, BusinessOnboardingDraftPayload } from "../types";

export type SaveDraftStepResult = { ok: true; draft: BusinessOnboardingDraft } | { ok: false; reasonCode: "invalid_intent_key" | "invalid_step" | "save_failed" };

/** `userClient` must be the RLS-scoped client for the caller — see supabaseUserClient.ts. */
export async function listOwnDrafts(userClient: SupabaseClient): Promise<BusinessOnboardingDraft[]> {
  await deleteExpiredDraftsForCurrentUser(userClient);
  return listDraftsForCurrentUser(userClient);
}

export async function getOwnDraftById(userClient: SupabaseClient, draftId: string): Promise<BusinessOnboardingDraft | null> {
  // RLS already scopes this to the caller's own rows; getDraftById never receives another
  // user's id from anywhere in this module.
  return getDraftById(userClient, draftId);
}

export async function saveDraftStep(
  userClient: SupabaseClient,
  params: { userId: string; intentKey: string; currentStep: number; draftPayload: BusinessOnboardingDraftPayload },
): Promise<SaveDraftStepResult> {
  const intentKey = normalizeDraftIntentKey(params.intentKey);
  if (!intentKey) return { ok: false, reasonCode: "invalid_intent_key" };
  if (!validateOnboardingStep(params.currentStep)) return { ok: false, reasonCode: "invalid_step" };

  const draft = await upsertOwnDraft(userClient, {
    userId: params.userId,
    intentKey,
    currentStep: params.currentStep,
    draftPayload: params.draftPayload,
  });
  if (!draft) return { ok: false, reasonCode: "save_failed" };
  return { ok: true, draft };
}

export async function deleteOwnDraft(userClient: SupabaseClient, draftId: string): Promise<boolean> {
  return deleteOwnDraftById(userClient, draftId);
}
