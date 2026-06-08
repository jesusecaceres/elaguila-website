/**
 * BR-INV-E-FAST — session queue for sequential child inventory publish (no Supabase).
 */

import type { AgenteIndividualResidencialFormState } from "../agente-individual/schema/agenteIndividualResidencialFormState";
import type { BienesRaicesNegocioFormState } from "./schema/bienesRaicesNegocioFormState";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "./brNegocioAdditionalInventoryDraft";
import { mergeAdditionalInventoryProperties } from "./brNegocioAdditionalInventoryDraft";
import {
  buildBrInventoryAddPublishHref,
  type BrInventoryAddContext,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryAddFlow";

export const BR_NEGOCIO_INVENTORY_PUBLISH_QUEUE_KEY = "lx-br-negocio-inventory-publish-queue-v1" as const;
export const BR_NEGOCIO_INVENTORY_QUEUE_PREFILL_KEY = "lx-br-negocio-inventory-queue-prefill-v1" as const;

export type BrNegocioInventoryPublishQueueContext = {
  parentListingId: string;
  parentPublicPath: string;
  brInventoryGroupId: string;
  lang: "es" | "en";
};

export type BrNegocioInventoryPublishQueue = {
  version: 1;
  context: BrNegocioInventoryPublishQueueContext;
  items: BrNegocioAdditionalInventoryPropertyDraft[];
  currentIndex: number;
  formKind: "agente" | "negocio";
  inheritedAgenteSnapshot?: AgenteIndividualResidencialFormState;
  inheritedNegocioSnapshot?: BienesRaicesNegocioFormState;
  createdAt: string;
};

function readRaw(): BrNegocioInventoryPublishQueue | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BR_NEGOCIO_INVENTORY_PUBLISH_QUEUE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as BrNegocioInventoryPublishQueue;
    if (j?.version !== 1 || !j.context?.parentListingId?.trim()) return null;
    return {
      ...j,
      context: {
        ...j.context,
        parentListingId: j.context.parentListingId.trim(),
        parentPublicPath: j.context.parentPublicPath.trim(),
        brInventoryGroupId: j.context.brInventoryGroupId.trim() || j.context.parentListingId.trim(),
        lang: j.context.lang === "en" ? "en" : "es",
      },
      items: mergeAdditionalInventoryProperties(j.items),
      currentIndex: Math.max(0, Number(j.currentIndex) || 0),
      formKind: j.formKind === "negocio" ? "negocio" : "agente",
    };
  } catch {
    return null;
  }
}

function writeRaw(queue: BrNegocioInventoryPublishQueue | null): void {
  if (typeof window === "undefined") return;
  if (!queue) {
    sessionStorage.removeItem(BR_NEGOCIO_INVENTORY_PUBLISH_QUEUE_KEY);
    return;
  }
  sessionStorage.setItem(BR_NEGOCIO_INVENTORY_PUBLISH_QUEUE_KEY, JSON.stringify(queue));
}

export function createQueueAfterMainPublish(input: {
  parentListingId: string;
  parentPublicPath: string;
  brInventoryGroupId: string;
  lang: "es" | "en";
  items: BrNegocioAdditionalInventoryPropertyDraft[];
  formKind: "agente" | "negocio";
  inheritedAgenteSnapshot?: AgenteIndividualResidencialFormState;
  inheritedNegocioSnapshot?: BienesRaicesNegocioFormState;
}): BrNegocioInventoryPublishQueue {
  const queue: BrNegocioInventoryPublishQueue = {
    version: 1,
    context: {
      parentListingId: input.parentListingId.trim(),
      parentPublicPath: input.parentPublicPath.trim(),
      brInventoryGroupId: input.brInventoryGroupId.trim() || input.parentListingId.trim(),
      lang: input.lang,
    },
    items: mergeAdditionalInventoryProperties(input.items),
    currentIndex: 0,
    formKind: input.formKind,
    inheritedAgenteSnapshot:
      input.formKind === "agente" && input.inheritedAgenteSnapshot
        ? { ...input.inheritedAgenteSnapshot, additionalInventoryProperties: [] }
        : undefined,
    inheritedNegocioSnapshot:
      input.formKind === "negocio" && input.inheritedNegocioSnapshot
        ? { ...input.inheritedNegocioSnapshot, additionalInventoryProperties: [] }
        : undefined,
    createdAt: new Date().toISOString(),
  };
  writeRaw(queue);
  return queue;
}

export function getQueue(): BrNegocioInventoryPublishQueue | null {
  return readRaw();
}

export function getCurrentQueueItem(): BrNegocioAdditionalInventoryPropertyDraft | null {
  const q = readRaw();
  if (!q) return null;
  return q.items[q.currentIndex] ?? null;
}

export function getRemainingQueueCount(): number {
  const q = readRaw();
  if (!q) return 0;
  return Math.max(0, q.items.length - q.currentIndex);
}

export function hasRemainingQueueItems(): boolean {
  return getRemainingQueueCount() > 0;
}

export function advanceQueue(): BrNegocioInventoryPublishQueue | null {
  const q = readRaw();
  if (!q) return null;
  const next = { ...q, currentIndex: q.currentIndex + 1 };
  if (next.currentIndex >= next.items.length) {
    writeRaw(null);
    clearQueuePrefillForAddMode();
    return null;
  }
  writeRaw(next);
  clearQueuePrefillForAddMode();
  return next;
}

export function clearQueue(): void {
  writeRaw(null);
  clearQueuePrefillForAddMode();
}

export function writeQueuePrefillForAddMode(item: BrNegocioAdditionalInventoryPropertyDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(BR_NEGOCIO_INVENTORY_QUEUE_PREFILL_KEY, JSON.stringify(item));
}

export function readQueuePrefillForAddMode(): BrNegocioAdditionalInventoryPropertyDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BR_NEGOCIO_INVENTORY_QUEUE_PREFILL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return mergeAdditionalInventoryProperties([parsed])[0] ?? null;
  } catch {
    return null;
  }
}

export function clearQueuePrefillForAddMode(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(BR_NEGOCIO_INVENTORY_QUEUE_PREFILL_KEY);
}

export function buildQueueChildAddModeHref(queue: BrNegocioInventoryPublishQueue): string {
  const ctx: BrInventoryAddContext = {
    parentListingId: queue.context.parentListingId,
    returnToListingId: queue.context.parentListingId,
    brInventoryGroupId: queue.context.brInventoryGroupId,
  };
  return buildBrInventoryAddPublishHref(ctx, queue.context.lang);
}

export function prepareNextQueuedChildNavigation(queue: BrNegocioInventoryPublishQueue): string {
  const item = getCurrentQueueItem();
  if (item) writeQueuePrefillForAddMode(item);
  return buildQueueChildAddModeHref(queue);
}
