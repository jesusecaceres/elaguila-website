/**
 * BR-INV-E-FAST — shared post-publish routing vs bridge (no fake IDs/URLs).
 */

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { leonixLiveAnuncioPath } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import type { BrNegocioPublishInventoryContext } from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import { clearBrInventoryAddContextFromSession } from "@/app/clasificados/lib/leonixBrPropertyInventoryAddFlow";
import type { AgenteIndividualResidencialFormState } from "../agente-individual/schema/agenteIndividualResidencialFormState";
import type { BienesRaicesNegocioFormState } from "./schema/bienesRaicesNegocioFormState";
import { mergeAdditionalInventoryProperties, type BrNegocioAdditionalInventoryPropertyDraft } from "./brNegocioAdditionalInventoryDraft";
import {
  advanceQueue,
  createQueueAfterMainPublish,
  getQueue,
  getRemainingQueueCount,
  prepareNextQueuedChildNavigation,
  type BrNegocioInventoryPublishQueue,
} from "./brNegocioInventoryPublishQueue";

export type BrNegocioInventoryBridgeView = {
  mode: "main" | "child" | "complete";
  mainListingHref: string;
  childListingHref?: string;
  remainingCount: number;
};

export function isQueueDrivenChildPublish(
  inventoryCtx: BrNegocioPublishInventoryContext | null,
): boolean {
  if (!inventoryCtx || inventoryCtx.mode !== "add") return false;
  const queue = getQueue();
  return Boolean(queue && queue.context.parentListingId === inventoryCtx.parentListingId);
}

export function buildMainPublishBridgeAfterQueue(
  listingId: string,
  lang: "es" | "en",
  additionalCount: number,
): BrNegocioInventoryBridgeView {
  const mainHref = appendLangToPath(leonixLiveAnuncioPath(listingId), lang);
  return {
    mode: "main",
    mainListingHref: mainHref,
    remainingCount: additionalCount,
  };
}

export function handleMainPublishWithOptionalQueue(input: {
  listingId: string;
  lang: "es" | "en";
  formKind: "agente" | "negocio";
  additionalItems: BrNegocioAdditionalInventoryPropertyDraft[];
  inheritedAgenteSnapshot?: AgenteIndividualResidencialFormState;
  inheritedNegocioSnapshot?: BienesRaicesNegocioFormState;
}): BrNegocioInventoryBridgeView | null {
  const items = mergeAdditionalInventoryProperties(input.additionalItems);
  if (!items.length) return null;
  const parentPath = leonixLiveAnuncioPath(input.listingId);
  createQueueAfterMainPublish({
    parentListingId: input.listingId,
    parentPublicPath: parentPath,
    brInventoryGroupId: input.listingId,
    lang: input.lang,
    items,
    formKind: input.formKind,
    inheritedAgenteSnapshot: input.inheritedAgenteSnapshot,
    inheritedNegocioSnapshot: input.inheritedNegocioSnapshot,
  });
  return buildMainPublishBridgeAfterQueue(input.listingId, input.lang, items.length);
}

export function handleQueuedChildPublishSuccess(
  childListingId: string,
  lang: "es" | "en",
): BrNegocioInventoryBridgeView | null {
  const queueBefore = getQueue();
  if (!queueBefore) return null;
  advanceQueue();
  clearBrInventoryAddContextFromSession();
  const remaining = getRemainingQueueCount();
  const mainHref = appendLangToPath(queueBefore.context.parentPublicPath, lang);
  const childHref = appendLangToPath(leonixLiveAnuncioPath(childListingId), lang);
  return {
    mode: remaining > 0 ? "child" : "complete",
    mainListingHref: mainHref,
    childListingHref: childHref,
    remainingCount: remaining,
  };
}

export function navigateToNextQueuedChild(queue?: BrNegocioInventoryPublishQueue | null): string | null {
  const q = queue ?? getQueue();
  if (!q || !getRemainingQueueCount()) return null;
  return prepareNextQueuedChildNavigation(q);
}
