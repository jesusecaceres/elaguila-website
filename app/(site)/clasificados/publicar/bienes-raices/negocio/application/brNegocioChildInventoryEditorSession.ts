/**
 * BR-INV-FIX-01D — isolated child inventory editor session (never touches main draft keys).
 */

import type { AgenteChildPropertyFormSlice } from "./brNegocioChildInventoryFormMapping";
import { pickChildPropertySlice } from "./brNegocioChildInventoryFormMapping";
import type { AgenteIndividualResidencialFormState } from "../agente-individual/schema/agenteIndividualResidencialFormState";
import { createEmptyAgenteIndividualResidencialFormState } from "../agente-individual/schema/agenteIndividualResidencialFormState";
import {
  BR_AGENTE_DRAFT_MEDIA_NAMESPACE,
  inlineBrAgenteResHeavyMediaFromIdb,
  offloadBrAgenteResHeavyMediaToIdb,
} from "../agente-individual/application/utils/brAgenteResDraftMedia";
import { mergeParentHubWithChildProperty } from "./brNegocioChildInventoryFormMapping";

export const BR_NEGOCIO_CHILD_INVENTORY_EDITOR_SESSION_KEY = "br-negocio-child-inventory-editor-session";

export type BrNegocioChildInventoryEditorSession = {
  version: 1;
  editingId: string | null;
  step: number;
  propertyForm: AgenteChildPropertyFormSlice;
  savedAt: number;
};

let childEditorMemoryBridge: BrNegocioChildInventoryEditorSession | null = null;

function stripDataUrlsFromSlice(slice: AgenteChildPropertyFormSlice): AgenteChildPropertyFormSlice {
  const j = JSON.parse(JSON.stringify(slice)) as AgenteChildPropertyFormSlice;
  if (Array.isArray(j.fotosDataUrls)) {
    j.fotosDataUrls = j.fotosDataUrls.filter((u) => !String(u).startsWith("data:"));
  }
  const z = (u: string) => (typeof u === "string" && u.startsWith("data:") ? "" : u);
  j.listadoArchivoDataUrl = z(j.listadoArchivoDataUrl);
  j.videoDataUrl = z(j.videoDataUrl);
  j.tourDataUrl = z(j.tourDataUrl);
  j.brochureDataUrl = z(j.brochureDataUrl);
  return j;
}

export function persistChildInventoryEditorSession(session: BrNegocioChildInventoryEditorSession): void {
  childEditorMemoryBridge = session;
  if (typeof window === "undefined") return;
  void persistChildInventoryEditorSessionResolved(session);
}

async function persistChildInventoryEditorSessionResolved(
  session: BrNegocioChildInventoryEditorSession,
): Promise<void> {
  childEditorMemoryBridge = session;
  let propertyForm = session.propertyForm;
  try {
    const hub = mergeParentHubWithChildProperty(
      createEmptyAgenteIndividualResidencialFormState(),
      propertyForm,
    );
    const offloaded = await offloadBrAgenteResHeavyMediaToIdb(BR_AGENTE_DRAFT_MEDIA_NAMESPACE, hub);
    propertyForm = pickChildPropertySlice(offloaded);
  } catch {
    propertyForm = stripDataUrlsFromSlice(session.propertyForm);
  }
  try {
    sessionStorage.setItem(
      BR_NEGOCIO_CHILD_INVENTORY_EDITOR_SESSION_KEY,
      JSON.stringify({
        ...session,
        propertyForm,
      }),
    );
  } catch {
    /* quota — in-memory bridge still available same-tab */
  }
}

export async function loadChildInventoryEditorSessionResolved(): Promise<BrNegocioChildInventoryEditorSession | null> {
  const sync = loadChildInventoryEditorSession();
  if (!sync) return null;
  try {
    const hub = mergeParentHubWithChildProperty(
      createEmptyAgenteIndividualResidencialFormState(),
      sync.propertyForm,
    );
    const inlined = await inlineBrAgenteResHeavyMediaFromIdb(BR_AGENTE_DRAFT_MEDIA_NAMESPACE, hub);
    return {
      ...sync,
      propertyForm: pickChildPropertySlice(inlined),
    };
  } catch {
    return sync;
  }
}

export function loadChildInventoryEditorSession(): BrNegocioChildInventoryEditorSession | null {
  if (childEditorMemoryBridge) return childEditorMemoryBridge;
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BR_NEGOCIO_CHILD_INVENTORY_EDITOR_SESSION_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as BrNegocioChildInventoryEditorSession;
    if (j?.version !== 1) return null;
    return j;
  } catch {
    return null;
  }
}

export function clearChildInventoryEditorSession(): void {
  childEditorMemoryBridge = null;
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(BR_NEGOCIO_CHILD_INVENTORY_EDITOR_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function childEditorSessionFromState(
  editingId: string | null,
  step: number,
  state: AgenteIndividualResidencialFormState,
): BrNegocioChildInventoryEditorSession {
  return {
    version: 1,
    editingId,
    step,
    propertyForm: pickChildPropertySlice(state),
    savedAt: Date.now(),
  };
}
