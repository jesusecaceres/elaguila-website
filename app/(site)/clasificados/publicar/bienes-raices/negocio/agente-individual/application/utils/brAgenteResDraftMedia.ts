import type { AgenteIndividualResidencialFormState } from "../../schema/agenteIndividualResidencialFormState";
import { mergePartialAgenteIndividualResidencial } from "../../schema/agenteIndividualResidencialFormState";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "../../../application/brNegocioAdditionalInventoryDraft";
import { normalizeChildInventoryDraft } from "../../../application/brNegocioAdditionalInventoryDraft";
import type { AgenteChildPropertyFormSlice } from "../../../application/brNegocioChildInventoryFormMapping";
import { idbBrAgenteGetDataUrl, idbBrAgentePutDataUrl, idbBrAgenteClearNamespace } from "./brAgenteResDraftMediaIdb";

export const BR_AGENTE_IDB_PREFIX = "__LX_BR_AGENTE_IDB__";
export const BR_AGENTE_DRAFT_MEDIA_NAMESPACE = "br-agente-res-v1";

function isHeavyDataUrl(s: string): boolean {
  return typeof s === "string" && s.startsWith("data:") && s.length > 80;
}

function ref(segment: string, id?: string): string {
  return id ? `${BR_AGENTE_IDB_PREFIX}|${segment}|${id}` : `${BR_AGENTE_IDB_PREFIX}|${segment}`;
}

function parseRef(url: string): { segment: string; id?: string } | null {
  if (!url.startsWith(BR_AGENTE_IDB_PREFIX)) return null;
  const rest = url.slice(BR_AGENTE_IDB_PREFIX.length);
  const parts = rest.split("|").filter(Boolean);
  if (!parts.length) return null;
  if (parts.length === 1) return { segment: parts[0]! };
  return { segment: parts[0]!, id: parts.slice(1).join("|") };
}

async function offloadScalar(
  ns: string,
  segment: string,
  id: string | undefined,
  value: string,
): Promise<string> {
  if (!isHeavyDataUrl(value)) return value;
  await idbBrAgentePutDataUrl(ns, segment, id, value);
  return ref(segment, id);
}

async function inlineScalar(ns: string, segment: string, id: string | undefined, value: string): Promise<string> {
  const parsed = parseRef(value);
  if (!parsed || parsed.segment !== segment || (id !== undefined && parsed.id !== id)) return value;
  const blob = await idbBrAgenteGetDataUrl(ns, segment, id);
  return blob ?? "";
}

async function offloadPhotoArray(ns: string, segment: string, photos: string[]): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < photos.length; i++) {
    const u = String(photos[i] ?? "").trim();
    if (!u) continue;
    if (isHeavyDataUrl(u)) {
      await idbBrAgentePutDataUrl(ns, segment, String(i), u);
      out.push(ref(segment, String(i)));
    } else {
      out.push(u);
    }
  }
  return out;
}

/** True when expected + actual ref segments both address the same child draft photo store. */
function childPhotoSegmentsCompatible(expected: string, actual: string): boolean {
  if (expected === actual) return true;
  const strip = (seg: string) =>
    seg
      .replace(/^CHILD_EDITOR_/, "")
      .replace(/^CHILD_/, "")
      .replace(/_FORM_PHOTO$/, "")
      .replace(/_PHOTO$/, "");
  const a = strip(expected);
  const b = strip(actual);
  if (!a || !b || a !== b) return false;
  const expectedIsChild = expected.startsWith("CHILD_") || expected.startsWith("CHILD_EDITOR_");
  const actualIsChild = actual.startsWith("CHILD_") || actual.startsWith("CHILD_EDITOR_");
  return expectedIsChild && actualIsChild;
}

async function inlinePhotoArray(ns: string, segment: string, photos: string[]): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < photos.length; i++) {
    const u = String(photos[i] ?? "").trim();
    if (!u) continue;
    const parsed = parseRef(u);
    if (parsed) {
      // Resolve by the segment encoded in the durable token (never pass raw refs as img src).
      // Allow CHILD_* ↔ CHILD_EDITOR_* synonyms for the same draft id; keep MAIN_PHOTO isolated.
      if (parsed.segment === segment || childPhotoSegmentsCompatible(segment, parsed.segment)) {
        const blob = await idbBrAgenteGetDataUrl(ns, parsed.segment, parsed.id);
        if (blob) out.push(blob);
      }
      continue;
    }
    out.push(u);
  }
  return out;
}

/** Resolve one durable IDB media token into a displayable data URL (or null). */
export async function resolveBrAgenteIdbMediaRefToDataUrl(url: string): Promise<string | null> {
  const u = String(url ?? "").trim();
  const parsed = parseRef(u);
  if (!parsed) return null;
  return idbBrAgenteGetDataUrl(BR_AGENTE_DRAFT_MEDIA_NAMESPACE, parsed.segment, parsed.id);
}

async function offloadChildDraft(
  ns: string,
  child: BrNegocioAdditionalInventoryPropertyDraft,
): Promise<BrNegocioAdditionalInventoryPropertyDraft> {
  const normalized = normalizeChildInventoryDraft(child);
  const photoUrls = await offloadPhotoArray(ns, `CHILD_${normalized.id}_PHOTO`, normalized.photoUrls);
  const coverIdx = Math.min(Math.max(0, normalized.primaryPhotoIndex), Math.max(0, photoUrls.length - 1));
  let propertyForm = normalized.propertyForm;
  if (propertyForm && typeof propertyForm === "object") {
    const fotos = await offloadPhotoArray(ns, `CHILD_${normalized.id}_FORM_PHOTO`, propertyForm.fotosDataUrls ?? []);
    propertyForm = { ...propertyForm, fotosDataUrls: fotos };
    propertyForm.listadoArchivoDataUrl = await offloadScalar(
      ns,
      `CHILD_${normalized.id}_LISTADO`,
      undefined,
      propertyForm.listadoArchivoDataUrl ?? "",
    );
    propertyForm.videoDataUrl = await offloadScalar(ns, `CHILD_${normalized.id}_VIDEO`, undefined, propertyForm.videoDataUrl ?? "");
    propertyForm.tourDataUrl = await offloadScalar(ns, `CHILD_${normalized.id}_TOUR`, undefined, propertyForm.tourDataUrl ?? "");
    propertyForm.brochureDataUrl = await offloadScalar(
      ns,
      `CHILD_${normalized.id}_BROCHURE`,
      undefined,
      propertyForm.brochureDataUrl ?? "",
    );
  }
  return normalizeChildInventoryDraft({
    ...normalized,
    photoUrls,
    primaryPhotoIndex: coverIdx,
    mainPhotoUrl: photoUrls[coverIdx] ?? photoUrls[0] ?? "",
    propertyForm,
  });
}

async function inlineChildDraft(
  ns: string,
  child: BrNegocioAdditionalInventoryPropertyDraft,
): Promise<BrNegocioAdditionalInventoryPropertyDraft> {
  const normalized = normalizeChildInventoryDraft(child);
  const photoUrls = await inlinePhotoArray(ns, `CHILD_${normalized.id}_PHOTO`, normalized.photoUrls);
  const coverIdx = Math.min(Math.max(0, normalized.primaryPhotoIndex), Math.max(0, photoUrls.length - 1));
  let propertyForm = normalized.propertyForm;
  if (propertyForm && typeof propertyForm === "object") {
    const fotos = await inlinePhotoArray(ns, `CHILD_${normalized.id}_FORM_PHOTO`, propertyForm.fotosDataUrls ?? []);
    propertyForm = {
      ...propertyForm,
      fotosDataUrls: fotos,
      listadoArchivoDataUrl: await inlineScalar(
        ns,
        `CHILD_${normalized.id}_LISTADO`,
        undefined,
        propertyForm.listadoArchivoDataUrl ?? "",
      ),
      videoDataUrl: await inlineScalar(ns, `CHILD_${normalized.id}_VIDEO`, undefined, propertyForm.videoDataUrl ?? ""),
      tourDataUrl: await inlineScalar(ns, `CHILD_${normalized.id}_TOUR`, undefined, propertyForm.tourDataUrl ?? ""),
      brochureDataUrl: await inlineScalar(
        ns,
        `CHILD_${normalized.id}_BROCHURE`,
        undefined,
        propertyForm.brochureDataUrl ?? "",
      ),
    };
  }
  return normalizeChildInventoryDraft({
    ...normalized,
    photoUrls,
    primaryPhotoIndex: coverIdx,
    mainPhotoUrl: photoUrls[coverIdx] ?? photoUrls[0] ?? "",
    propertyForm,
  });
}

export async function offloadBrAgenteResHeavyMediaToIdb(
  namespace: string,
  state: AgenteIndividualResidencialFormState,
): Promise<AgenteIndividualResidencialFormState> {
  const fotosDataUrls = await offloadPhotoArray(namespace, "MAIN_PHOTO", state.fotosDataUrls ?? []);
  const children: BrNegocioAdditionalInventoryPropertyDraft[] = [];
  for (const child of state.additionalInventoryProperties ?? []) {
    children.push(await offloadChildDraft(namespace, child));
  }
  return mergePartialAgenteIndividualResidencial({
    ...state,
    fotosDataUrls,
    agenteFotoDataUrl: await offloadScalar(namespace, "AGENT_PHOTO", undefined, state.agenteFotoDataUrl ?? ""),
    agente2FotoDataUrl: await offloadScalar(namespace, "AGENT2_PHOTO", undefined, state.agente2FotoDataUrl ?? ""),
    marcaLogoDataUrl: await offloadScalar(namespace, "LOGO", undefined, state.marcaLogoDataUrl ?? ""),
    videoDataUrl: await offloadScalar(namespace, "VIDEO", undefined, state.videoDataUrl ?? ""),
    tourDataUrl: await offloadScalar(namespace, "TOUR", undefined, state.tourDataUrl ?? ""),
    brochureDataUrl: await offloadScalar(namespace, "BROCHURE", undefined, state.brochureDataUrl ?? ""),
    listadoArchivoDataUrl: await offloadScalar(namespace, "LISTADO", undefined, state.listadoArchivoDataUrl ?? ""),
    additionalInventoryProperties: children,
  });
}

export async function inlineBrAgenteResHeavyMediaFromIdb(
  namespace: string,
  state: AgenteIndividualResidencialFormState,
): Promise<AgenteIndividualResidencialFormState> {
  const fotosDataUrls = await inlinePhotoArray(namespace, "MAIN_PHOTO", state.fotosDataUrls ?? []);
  const children: BrNegocioAdditionalInventoryPropertyDraft[] = [];
  for (const child of state.additionalInventoryProperties ?? []) {
    children.push(await inlineChildDraft(namespace, child));
  }
  return mergePartialAgenteIndividualResidencial({
    ...state,
    fotosDataUrls,
    agenteFotoDataUrl: await inlineScalar(namespace, "AGENT_PHOTO", undefined, state.agenteFotoDataUrl ?? ""),
    agente2FotoDataUrl: await inlineScalar(namespace, "AGENT2_PHOTO", undefined, state.agente2FotoDataUrl ?? ""),
    marcaLogoDataUrl: await inlineScalar(namespace, "LOGO", undefined, state.marcaLogoDataUrl ?? ""),
    videoDataUrl: await inlineScalar(namespace, "VIDEO", undefined, state.videoDataUrl ?? ""),
    tourDataUrl: await inlineScalar(namespace, "TOUR", undefined, state.tourDataUrl ?? ""),
    brochureDataUrl: await inlineScalar(namespace, "BROCHURE", undefined, state.brochureDataUrl ?? ""),
    listadoArchivoDataUrl: await inlineScalar(namespace, "LISTADO", undefined, state.listadoArchivoDataUrl ?? ""),
    additionalInventoryProperties: children,
  });
}

export function brAgenteDraftJsonMayContainIdbRefs(state: AgenteIndividualResidencialFormState): boolean {
  const check = (s: string) => typeof s === "string" && s.startsWith(BR_AGENTE_IDB_PREFIX);
  if (check(state.agenteFotoDataUrl) || check(state.agente2FotoDataUrl) || check(state.marcaLogoDataUrl)) return true;
  if (check(state.videoDataUrl) || check(state.tourDataUrl) || check(state.brochureDataUrl) || check(state.listadoArchivoDataUrl))
    return true;
  for (const u of state.fotosDataUrls ?? []) {
    if (check(u)) return true;
  }
  for (const child of state.additionalInventoryProperties ?? []) {
    for (const u of child.photoUrls ?? []) {
      if (check(u)) return true;
    }
    const pf = child.propertyForm;
    if (pf && typeof pf === "object") {
      for (const u of pf.fotosDataUrls ?? []) {
        if (check(u)) return true;
      }
    }
  }
  return false;
}

export async function clearBrAgenteResDraftMediaNamespace(namespace: string): Promise<void> {
  await idbBrAgenteClearNamespace(namespace);
}

function childEditorPhotoSegment(editingId: string): string {
  return `CHILD_EDITOR_${editingId}_FORM_PHOTO`;
}

function childEditorScalarSegment(editingId: string, kind: "LISTADO" | "VIDEO" | "TOUR" | "BROCHURE"): string {
  return `CHILD_EDITOR_${editingId}_${kind}`;
}

/** Isolated child editor offload — avoids MAIN_PHOTO collisions with parent draft. */
export async function offloadChildEditorPropertySliceToIdb(
  namespace: string,
  editingId: string,
  slice: AgenteChildPropertyFormSlice,
): Promise<AgenteChildPropertyFormSlice> {
  const seg = childEditorPhotoSegment(editingId);
  const fotosDataUrls = await offloadPhotoArray(namespace, seg, slice.fotosDataUrls ?? []);
  const coverIdx = Math.min(Math.max(0, slice.fotoPortadaIndex), Math.max(0, fotosDataUrls.length - 1));
  return {
    ...slice,
    fotosDataUrls,
    fotoPortadaIndex: coverIdx,
    listadoArchivoDataUrl: await offloadScalar(
      namespace,
      childEditorScalarSegment(editingId, "LISTADO"),
      undefined,
      slice.listadoArchivoDataUrl ?? "",
    ),
    videoDataUrl: await offloadScalar(
      namespace,
      childEditorScalarSegment(editingId, "VIDEO"),
      undefined,
      slice.videoDataUrl ?? "",
    ),
    tourDataUrl: await offloadScalar(
      namespace,
      childEditorScalarSegment(editingId, "TOUR"),
      undefined,
      slice.tourDataUrl ?? "",
    ),
    brochureDataUrl: await offloadScalar(
      namespace,
      childEditorScalarSegment(editingId, "BROCHURE"),
      undefined,
      slice.brochureDataUrl ?? "",
    ),
  };
}

export async function inlineChildEditorPropertySliceFromIdb(
  namespace: string,
  editingId: string,
  slice: AgenteChildPropertyFormSlice,
): Promise<AgenteChildPropertyFormSlice> {
  const seg = childEditorPhotoSegment(editingId);
  const fotosDataUrls = await inlinePhotoArray(namespace, seg, slice.fotosDataUrls ?? []);
  const coverIdx = Math.min(Math.max(0, slice.fotoPortadaIndex), Math.max(0, fotosDataUrls.length - 1));
  return {
    ...slice,
    fotosDataUrls,
    fotoPortadaIndex: coverIdx,
    listadoArchivoDataUrl: await inlineScalar(
      namespace,
      childEditorScalarSegment(editingId, "LISTADO"),
      undefined,
      slice.listadoArchivoDataUrl ?? "",
    ),
    videoDataUrl: await inlineScalar(
      namespace,
      childEditorScalarSegment(editingId, "VIDEO"),
      undefined,
      slice.videoDataUrl ?? "",
    ),
    tourDataUrl: await inlineScalar(
      namespace,
      childEditorScalarSegment(editingId, "TOUR"),
      undefined,
      slice.tourDataUrl ?? "",
    ),
    brochureDataUrl: await inlineScalar(
      namespace,
      childEditorScalarSegment(editingId, "BROCHURE"),
      undefined,
      slice.brochureDataUrl ?? "",
    ),
  };
}
