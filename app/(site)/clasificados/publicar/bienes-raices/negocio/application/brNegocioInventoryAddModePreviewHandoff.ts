/**
 * BR-INV-FIX-01C — persist add-mode child prefill into preview handoff keys.
 */

import type { AgenteIndividualResidencialFormState } from "../agente-individual/schema/agenteIndividualResidencialFormState";
import {
  saveAgenteResPreviewDraft,
  saveAgenteResPreviewReturnDraft,
} from "../agente-individual/application/utils/previewDraft";
import { readQueuePrefillForAddMode } from "./brNegocioInventoryPublishQueue";

/** Queue add-mode: ensure preview/publish can read child+inherited state without visiting step 9 first. */
export function syncAgenteAddModePreviewHandoff(state: AgenteIndividualResidencialFormState): void {
  if (typeof window === "undefined") return;
  if (!readQueuePrefillForAddMode()) return;
  saveAgenteResPreviewDraft(state);
  saveAgenteResPreviewReturnDraft(state);
}
