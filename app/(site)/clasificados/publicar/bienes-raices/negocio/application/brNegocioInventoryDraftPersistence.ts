/**
 * BR-INV-FIX-01B — durable child inventory + media persistence helpers (session-safe).
 */

import type { BrNegocioAdditionalInventoryPropertyDraft } from "./brNegocioAdditionalInventoryDraft";
import {
  normalizeChildInventoryDraft,
  sanitizeBrNegocioAdditionalInventoryPropertyDraft,
} from "./brNegocioAdditionalInventoryDraft";

let childInventoryMediaBridge: BrNegocioAdditionalInventoryPropertyDraft[] | null = null;

export function setChildInventoryMediaBridge(items: BrNegocioAdditionalInventoryPropertyDraft[]): void {
  try {
    childInventoryMediaBridge = items.map((item) => normalizeChildInventoryDraft(item));
  } catch {
    childInventoryMediaBridge = null;
  }
}

export function clearChildInventoryMediaBridge(): void {
  childInventoryMediaBridge = null;
}

function clampPrimaryIndex(photoUrls: string[], index: number): number {
  if (!photoUrls.length) return 0;
  return Math.min(Math.max(0, index), photoUrls.length - 1);
}

function isDurablePhotoUrl(url: string): boolean {
  const u = url.trim();
  return u.startsWith("http://") || u.startsWith("https://") || u.startsWith("data:image/");
}

/** Drop data: blobs from child photos for sessionStorage / queue JSON. */
function stripPropertyFormForSession(
  form: Partial<import("../agente-individual/schema/agenteIndividualResidencialFormState").AgenteIndividualResidencialFormState> | null | undefined,
): typeof form {
  if (!form || typeof form !== "object") return form;
  const j = JSON.parse(JSON.stringify(form)) as Record<string, unknown>;
  if (Array.isArray(j.fotosDataUrls)) {
    j.fotosDataUrls = (j.fotosDataUrls as string[]).filter((u) => !String(u).startsWith("data:"));
  }
  const z = (u: unknown) => (typeof u === "string" && u.startsWith("data:") ? "" : u);
  j.listadoArchivoDataUrl = z(j.listadoArchivoDataUrl);
  j.videoDataUrl = z(j.videoDataUrl);
  j.tourDataUrl = z(j.tourDataUrl);
  j.brochureDataUrl = z(j.brochureDataUrl);
  return j as typeof form;
}

export function stripChildInventoryForSession(
  items: BrNegocioAdditionalInventoryPropertyDraft[],
): BrNegocioAdditionalInventoryPropertyDraft[] {
  return items.map((item) => {
    const normalized = normalizeChildInventoryDraft(item);
    const photoUrls = normalized.photoUrls.filter((u) => !u.startsWith("data:"));
    const primaryPhotoIndex = clampPrimaryIndex(photoUrls, normalized.primaryPhotoIndex);
    const cover = photoUrls[primaryPhotoIndex] ?? photoUrls[0] ?? "";
    return {
      ...normalized,
      photoUrls,
      primaryPhotoIndex,
      mainPhotoUrl: cover.startsWith("data:") ? "" : cover,
      propertyForm: stripPropertyFormForSession(normalized.propertyForm),
    };
  });
}

/** Restore data: photo blobs from in-memory bridge by local draft id. */
export function mergeChildInventoryWithMediaBridge(
  items: BrNegocioAdditionalInventoryPropertyDraft[],
): BrNegocioAdditionalInventoryPropertyDraft[] {
  if (!childInventoryMediaBridge?.length) {
    return items.map((item) => normalizeChildInventoryDraft(item));
  }
  const bridgeById = new Map(childInventoryMediaBridge.map((d) => [d.id, d]));
  return items.map((item) => {
    const sanitized = sanitizeBrNegocioAdditionalInventoryPropertyDraft(item);
    if (!sanitized) return normalizeChildInventoryDraft(item);
    const bridged = bridgeById.get(sanitized.id);
    if (!bridged) return normalizeChildInventoryDraft(sanitized);
    const sessionPhotos = normalizeChildInventoryDraft(sanitized).photoUrls.filter((u) => !u.startsWith("data:"));
    const bridgePhotos = normalizeChildInventoryDraft(bridged).photoUrls.filter((u) => u.startsWith("data:"));
    const photoUrls = [...sessionPhotos, ...bridgePhotos].filter(isDurablePhotoUrl).slice(0, 40);
    const primaryPhotoIndex = clampPrimaryIndex(photoUrls, bridged.primaryPhotoIndex);
    const cover = photoUrls[primaryPhotoIndex] ?? photoUrls[0] ?? "";
    const sessionForm = sanitized.propertyForm ?? null;
    const bridgeForm = bridged.propertyForm ?? null;
    let propertyForm = sessionForm;
    if (bridgeForm && typeof bridgeForm === "object") {
      const sessionFormPhotos = Array.isArray(sessionForm?.fotosDataUrls)
        ? sessionForm!.fotosDataUrls!.filter((u) => !String(u).startsWith("data:"))
        : [];
      const bridgeFormPhotos = Array.isArray(bridgeForm.fotosDataUrls)
        ? bridgeForm.fotosDataUrls.filter((u) => String(u).startsWith("data:"))
        : [];
      propertyForm = {
        ...(sessionForm ?? {}),
        ...bridgeForm,
        fotosDataUrls: [...sessionFormPhotos, ...bridgeFormPhotos].filter(isDurablePhotoUrl).slice(0, 40),
      };
    }
    return normalizeChildInventoryDraft({
      ...sanitized,
      photoUrls,
      primaryPhotoIndex,
      mainPhotoUrl: cover,
      videoUrl: sanitized.videoUrl || bridged.videoUrl,
      tourUrl: sanitized.tourUrl || bridged.tourUrl,
      brochureUrl: sanitized.brochureUrl || bridged.brochureUrl,
      mlsUrl: sanitized.mlsUrl || bridged.mlsUrl,
      listadoUrl: sanitized.listadoUrl || bridged.listadoUrl,
      propertyForm,
    });
  });
}

export function normalizeChildInventoryList(
  items: BrNegocioAdditionalInventoryPropertyDraft[],
): BrNegocioAdditionalInventoryPropertyDraft[] {
  return items.map((item) => normalizeChildInventoryDraft(item));
}

export { normalizeChildInventoryDraft, childInventoryCoverPhotoUrl } from "./brNegocioAdditionalInventoryDraft";
