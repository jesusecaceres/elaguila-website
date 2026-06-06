import type { AutosAdditionalInventoryVehicleDraft } from "./autosAdditionalInventoryDraft";
import {
  computeInventoryVehicleStatus,
  prepareInventoryVehicleForSave,
} from "./autosAdditionalInventoryDraft";
import {
  activateAutosClassifiedsListing,
  createAutosClassifiedsListingWithInventoryParent,
  getAutosClassifiedsListingById,
  getAutosDealerInventorySummaryForOwner,
  promoteNegociosMainInventoryListing,
} from "./autosClassifiedsListingService";
import { mapInheritedDealerPreviewListing } from "./autosInventoryInheritedPreview";
import { buildVehicleTitle } from "@/app/(site)/publicar/autos/negocios/lib/autoDealerTitle";
import { getDealerInventoryGroupId } from "./autosDealerInventoryPolicy";
import type { AutosClassifiedsLang } from "./autosClassifiedsTypes";
import { autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import { getAutosSiteOrigin } from "./autosSiteOrigin";
import { AUTOS_INVENTORY_ANALYTICS_EVENTS } from "./autosAdditionalInventoryDraft";

export type AutosBundlePublishedVehicle = {
  id: string;
  leonix_ad_id: string | null;
  title: string;
  liveUrl: string;
  inventory_role: "main" | "inventory_vehicle";
};

export type AutosNegociosBundlePublishResult = {
  ok: boolean;
  mainListingId: string;
  published: AutosBundlePublishedVehicle[];
  additionalSkipped: number;
  error?: "not_found" | "unauthorized" | "dealer_active_limit_reached" | "activate_failed" | "child_create_failed" | "child_activate_failed";
};

/** @deprecated import from autosClassifiedsListingService — re-export for existing callers */
export { promoteNegociosMainInventoryListing } from "./autosClassifiedsListingService";

function vehicleTitleFromDraft(draft: AutosAdditionalInventoryVehicleDraft): string {
  if (draft.vehicleTitle?.trim()) return draft.vehicleTitle.trim();
  return buildVehicleTitle(draft.year, draft.make, draft.model, draft.trim) || "—";
}

function publishableChildren(raw: AutosAdditionalInventoryVehicleDraft[]): AutosAdditionalInventoryVehicleDraft[] {
  return raw
    .map((c) => prepareInventoryVehicleForSave(c))
    .filter((c) => computeInventoryVehicleStatus(c) === "ready_for_preview");
}

/**
 * After main listing is active, create + activate additional inventory vehicles as real rows.
 * Negocios-only; intended for QA bypass bundle publish (A5.QA-08B).
 */
export async function publishNegociosBundleAdditionalVehicles(input: {
  ownerUserId: string;
  mainListingId: string;
  additionalVehicles: AutosAdditionalInventoryVehicleDraft[];
  lang: AutosClassifiedsLang;
}): Promise<AutosNegociosBundlePublishResult> {
  const mainId = input.mainListingId.trim();
  const main = await getAutosClassifiedsListingById(mainId);
  if (!main) return { ok: false, mainListingId: mainId, published: [], additionalSkipped: 0, error: "not_found" };
  if (main.owner_user_id !== input.ownerUserId || main.lane !== "negocios") {
    return { ok: false, mainListingId: mainId, published: [], additionalSkipped: 0, error: "unauthorized" };
  }
  if (main.status !== "active") {
    const activated = await activateAutosClassifiedsListing(mainId);
    if (!activated) {
      return { ok: false, mainListingId: mainId, published: [], additionalSkipped: 0, error: "activate_failed" };
    }
  }

  await promoteNegociosMainInventoryListing(mainId);
  const mainLive = await getAutosClassifiedsListingById(mainId);
  if (!mainLive || mainLive.status !== "active") {
    return { ok: false, mainListingId: mainId, published: [], additionalSkipped: 0, error: "activate_failed" };
  }

  const origin = getAutosSiteOrigin();
  const langQ = input.lang === "en" ? "lang=en" : "lang=es";
  const published: AutosBundlePublishedVehicle[] = [
    {
      id: mainLive.id,
      leonix_ad_id: mainLive.leonix_ad_id?.trim() ? mainLive.leonix_ad_id.trim() : null,
      title:
        buildVehicleTitle(
          mainLive.listing_payload.year,
          mainLive.listing_payload.make,
          mainLive.listing_payload.model,
          mainLive.listing_payload.trim,
        ) ||
        mainLive.listing_payload.vehicleTitle?.trim() ||
        "—",
      liveUrl: `${origin}${autosLiveVehiclePath(mainLive.id)}?${langQ}`,
      inventory_role: "main",
    },
  ];

  const children = publishableChildren(input.additionalVehicles);
  const skipped = Math.max(0, input.additionalVehicles.length - children.length);
  const groupId = getDealerInventoryGroupId(mainLive) ?? mainLive.id;

  for (const childDraft of children) {
    const dealerSummary = await getAutosDealerInventorySummaryForOwner(input.ownerUserId);
    if (!dealerSummary.canAddActiveVehicle) {
      return {
        ok: published.length > 1,
        mainListingId: mainId,
        published,
        additionalSkipped: skipped + (children.length - (published.length - 1)),
        error: "dealer_active_limit_reached",
      };
    }

    const merged = mapInheritedDealerPreviewListing(mainLive.listing_payload, childDraft);
    const childResult = await createAutosClassifiedsListingWithInventoryParent({
      ownerUserId: input.ownerUserId,
      lane: "negocios",
      lang: input.lang,
      listing: merged,
      parentListingId: mainId,
      dealerInventoryGroupId: groupId,
    });
    if (!childResult.row) {
      return {
        ok: published.length > 1,
        mainListingId: mainId,
        published,
        additionalSkipped: skipped + (children.length - (published.length - 1)),
        error: "child_create_failed",
      };
    }

    const childActivated = await activateAutosClassifiedsListing(childResult.row.id);
    if (!childActivated) {
      return {
        ok: published.length > 1,
        mainListingId: mainId,
        published,
        additionalSkipped: skipped + (children.length - (published.length - 1)),
        error: "child_activate_failed",
      };
    }

    const childLive = await getAutosClassifiedsListingById(childResult.row.id);
    if (!childLive || childLive.status !== "active") {
      return {
        ok: published.length > 1,
        mainListingId: mainId,
        published,
        additionalSkipped: skipped + (children.length - (published.length - 1)),
        error: "child_activate_failed",
      };
    }

    published.push({
      id: childLive.id,
      leonix_ad_id: childLive.leonix_ad_id?.trim() ? childLive.leonix_ad_id.trim() : null,
      title: vehicleTitleFromDraft(childDraft),
      liveUrl: `${origin}${autosLiveVehiclePath(childLive.id)}?${langQ}`,
      inventory_role: "inventory_vehicle",
    });
  }

  return {
    ok: true,
    mainListingId: mainId,
    published,
    additionalSkipped: skipped + (children.length - (published.length - 1)),
  };
}

export const AUTOS_BUNDLE_PUBLISH_RESULT_SESSION_KEY = "lx-autos-bundle-publish-result" as const;

export type AutosBundlePublishSessionResult = {
  mainListingId: string;
  published: AutosBundlePublishedVehicle[];
  totalPublished: number;
  qaBypass: boolean;
  inventoryIncluded: number;
  inventoryLimit: number;
};

export { AUTOS_INVENTORY_ANALYTICS_EVENTS };
