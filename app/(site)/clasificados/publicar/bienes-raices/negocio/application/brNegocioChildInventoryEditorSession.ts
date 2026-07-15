/**
 * BR-INV-FIX-01D — isolated child inventory editor session (never touches main draft keys).
 */

import type { AgenteChildPropertyFormSlice } from "./brNegocioChildInventoryFormMapping";
import { pickChildPropertySlice } from "./brNegocioChildInventoryFormMapping";
import type { AgenteIndividualResidencialFormState } from "../agente-individual/schema/agenteIndividualResidencialFormState";
import {
  BR_AGENTE_IDB_PREFIX,
  getActiveBrAgenteDraftMediaNamespace,
  inlineChildEditorPropertySliceFromIdb,
  offloadChildEditorPropertySliceToIdb,
} from "../agente-individual/application/utils/brAgenteResDraftMedia";

export const BR_NEGOCIO_CHILD_INVENTORY_EDITOR_SESSION_KEY = "br-negocio-child-inventory-editor-session";

function childInventoryEditorSessionKey(): string {
  const ns = getActiveBrAgenteDraftMediaNamespace();
  return ns && ns !== "br-agente-res-v1"
    ? `${BR_NEGOCIO_CHILD_INVENTORY_EDITOR_SESSION_KEY}:${ns}`
    : BR_NEGOCIO_CHILD_INVENTORY_EDITOR_SESSION_KEY;
}

export type BrNegocioChildInventoryEditorSession = {
  version: 1;
  editingId: string | null;
  step: number;
  propertyForm: AgenteChildPropertyFormSlice;
  savedAt: number;
};

let childEditorMemoryBridge: BrNegocioChildInventoryEditorSession | null = null;
let childSessionPersistEpoch = 0;

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

function isDurableChildMediaUrl(url: string): boolean {
  const u = String(url ?? "").trim();
  if (!u) return false;
  if (u.startsWith(BR_AGENTE_IDB_PREFIX)) return true;
  if (u.startsWith("data:")) return false;
  return true;
}

function durableChildPhotoCount(slice: AgenteChildPropertyFormSlice | null | undefined): number {
  if (!slice || !Array.isArray(slice.fotosDataUrls)) return 0;
  return slice.fotosDataUrls.filter((u) => isDurableChildMediaUrl(String(u ?? ""))).length;
}

function readPreviousChildSession(): BrNegocioChildInventoryEditorSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(childInventoryEditorSessionKey());
    if (!raw) return null;
    const j = JSON.parse(raw) as BrNegocioChildInventoryEditorSession;
    if (j?.version !== 1) return null;
    return j;
  } catch {
    return null;
  }
}

function normalizeSessionPropertyFormUrls(slice: AgenteChildPropertyFormSlice): AgenteChildPropertyFormSlice {
  const preserve = (raw: string | undefined) => {
    const u = String(raw ?? "").trim();
    if (!u || u.startsWith("data:")) return "";
    return u;
  };
  const videoUrls = Array.isArray(slice.videoUrls)
    ? slice.videoUrls.map((u) => preserve(String(u))).filter(Boolean).slice(0, 4)
    : [];
  const videoUrl = preserve(slice.videoUrl) || videoUrls[0] || "";
  const normalizedVideos = videoUrls.length ? videoUrls : videoUrl ? [videoUrl] : [];
  return {
    ...slice,
    // Keep fotosDataUrls as-is (data: + IDB refs) so offload/inline can run.
    videoUrls: normalizedVideos,
    videoUrl: normalizedVideos[0] ?? videoUrl,
    listadoUrl: preserve(slice.listadoUrl),
    tourUrl: preserve(slice.tourUrl),
    brochureUrl: preserve(slice.brochureUrl),
  };
}

/** Stable child media key: saved draft id, reserved new-child id, or session id — never a shared "new-child" bucket. */
export function resolveChildEditorMediaId(
  editingId: string | null | undefined,
  draftId: string | null | undefined,
  sessionEditingId?: string | null,
): string {
  const a = String(editingId ?? "").trim();
  if (a) return a;
  const b = String(draftId ?? "").trim();
  if (b) return b;
  const c = String(sessionEditingId ?? "").trim();
  if (c) return c;
  return "";
}

export function childSessionMatchesEditor(
  session: BrNegocioChildInventoryEditorSession | null | undefined,
  editingId: string | null | undefined,
  draftId: string | null | undefined,
): boolean {
  if (!session) return false;
  const mediaId = resolveChildEditorMediaId(editingId, draftId, session.editingId);
  if (!mediaId) return false;
  const sid = String(session.editingId ?? "").trim();
  return sid === mediaId;
}

export function persistChildInventoryEditorSession(session: BrNegocioChildInventoryEditorSession): void {
  childEditorMemoryBridge = session;
  if (typeof window === "undefined") return;
  void persistChildInventoryEditorSessionResolved(session);
}

/** Awaitable durable child media commit (save / Preview / hard-refresh handoff). */
export async function persistChildInventoryEditorSessionResolved(
  session: BrNegocioChildInventoryEditorSession,
): Promise<BrNegocioChildInventoryEditorSession> {
  const epoch = ++childSessionPersistEpoch;
  childEditorMemoryBridge = session;
  const mediaId = resolveChildEditorMediaId(session.editingId, null, session.editingId);
  if (!mediaId) {
    return session;
  }

  let propertyForm = normalizeSessionPropertyFormUrls(session.propertyForm);
  // Prefer live fotos (including data:) for offload — do not pre-strip gallery.
  propertyForm = {
    ...propertyForm,
    fotosDataUrls: Array.isArray(session.propertyForm.fotosDataUrls)
      ? session.propertyForm.fotosDataUrls
      : [],
    fotoPortadaIndex: session.propertyForm.fotoPortadaIndex,
  };

  const livePhotoCount = (session.propertyForm.fotosDataUrls ?? []).filter((u) => String(u ?? "").trim()).length;
  try {
    propertyForm = await offloadChildEditorPropertySliceToIdb(
      getActiveBrAgenteDraftMediaNamespace(),
      mediaId,
      propertyForm,
    );
  } catch {
    propertyForm = stripDataUrlsFromSlice(session.propertyForm);
  }
  if (epoch !== childSessionPersistEpoch) {
    return childEditorMemoryBridge ?? session;
  }

  const previous = readPreviousChildSession();
  const previousForm =
    previous && childSessionMatchesEditor(previous, session.editingId, session.editingId)
      ? previous.propertyForm
      : null;

  if (durableChildPhotoCount(propertyForm) === 0 && durableChildPhotoCount(previousForm) > 0) {
    propertyForm = {
      ...propertyForm,
      fotosDataUrls: previousForm!.fotosDataUrls,
      fotoPortadaIndex: previousForm!.fotoPortadaIndex,
    };
  }
  if (livePhotoCount > 0 && durableChildPhotoCount(propertyForm) === 0 && durableChildPhotoCount(previousForm) === 0) {
    // Offload failed — keep memory bridge; do not write empty gallery to sessionStorage.
    return {
      ...session,
      editingId: mediaId,
      propertyForm: session.propertyForm,
      savedAt: Date.now(),
    };
  }
  if (epoch !== childSessionPersistEpoch) {
    return childEditorMemoryBridge ?? session;
  }

  const nextSession: BrNegocioChildInventoryEditorSession = {
    ...session,
    editingId: mediaId,
    propertyForm,
    savedAt: Date.now(),
  };
  childEditorMemoryBridge = nextSession;
  try {
    sessionStorage.setItem(childInventoryEditorSessionKey(), JSON.stringify(nextSession));
  } catch {
    /* quota — in-memory bridge still available same-tab */
  }
  return nextSession;
}

export async function loadChildInventoryEditorSessionResolved(): Promise<BrNegocioChildInventoryEditorSession | null> {
  const sync = loadChildInventoryEditorSession();
  if (!sync) return null;
  try {
    const mediaId = resolveChildEditorMediaId(sync.editingId, null, sync.editingId);
    if (!mediaId) return sync;
    const propertyForm = await inlineChildEditorPropertySliceFromIdb(
      getActiveBrAgenteDraftMediaNamespace(),
      mediaId,
      sync.propertyForm,
    );
    return {
      ...sync,
      editingId: mediaId,
      propertyForm: normalizeSessionPropertyFormUrls({
        ...propertyForm,
        // Restore inlined data: / http photos for the editor UI.
        fotosDataUrls: propertyForm.fotosDataUrls,
      }),
    };
  } catch {
    return sync;
  }
}

export function loadChildInventoryEditorSession(): BrNegocioChildInventoryEditorSession | null {
  if (childEditorMemoryBridge) return childEditorMemoryBridge;
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(childInventoryEditorSessionKey());
    if (!raw) return null;
    const j = JSON.parse(raw) as BrNegocioChildInventoryEditorSession;
    if (j?.version !== 1) return null;
    return {
      ...j,
      propertyForm: normalizeSessionPropertyFormUrls({
        ...j.propertyForm,
        fotosDataUrls: j.propertyForm?.fotosDataUrls ?? [],
      }),
    };
  } catch {
    return null;
  }
}

export function clearChildInventoryEditorSession(): void {
  childEditorMemoryBridge = null;
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(childInventoryEditorSessionKey());
  } catch {
    /* ignore */
  }
}

export function childEditorSliceHasUnresolvedIdbMedia(slice: AgenteChildPropertyFormSlice): boolean {
  const check = (u: string) => typeof u === "string" && u.startsWith(BR_AGENTE_IDB_PREFIX);
  for (const u of slice.fotosDataUrls ?? []) {
    if (check(String(u))) return true;
  }
  if (check(slice.listadoArchivoDataUrl)) return true;
  if (check(slice.videoDataUrl)) return true;
  if (check(slice.tourDataUrl)) return true;
  if (check(slice.brochureDataUrl)) return true;
  return false;
}

/**
 * Inline CHILD_EDITOR_* refs for the open editor (never MAIN_PHOTO — that is the parent path).
 */
export async function resolveChildPropertySliceMediaFromIdb(
  slice: AgenteChildPropertyFormSlice,
  editingId: string,
): Promise<AgenteChildPropertyFormSlice> {
  const mediaId = resolveChildEditorMediaId(editingId, null, editingId);
  if (!mediaId) return slice;
  return inlineChildEditorPropertySliceFromIdb(getActiveBrAgenteDraftMediaNamespace(), mediaId, slice);
}

export function childEditorSessionFromState(
  editingId: string | null,
  step: number,
  state: AgenteIndividualResidencialFormState,
  draftId?: string | null,
): BrNegocioChildInventoryEditorSession {
  const mediaId = resolveChildEditorMediaId(editingId, draftId, null);
  const slice = pickChildPropertySlice(state);
  return {
    version: 1,
    editingId: mediaId || null,
    step,
    // Keep raw fotos (data: + refs) for immediate IDB offload — do not strip gallery here.
    propertyForm: {
      ...normalizeSessionPropertyFormUrls(slice),
      fotosDataUrls: Array.isArray(slice.fotosDataUrls) ? slice.fotosDataUrls : [],
      fotoPortadaIndex: slice.fotoPortadaIndex,
    },
    savedAt: Date.now(),
  };
}
