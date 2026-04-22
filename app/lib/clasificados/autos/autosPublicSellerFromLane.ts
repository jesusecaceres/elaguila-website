import type { AutosPublicSellerType } from "@/app/clasificados/autos/data/autosPublicSampleTypes";
import type { AutosClassifiedsLane } from "./autosClassifiedsTypes";

/** Maps persisted DB lane → public browse `sellerType` filter and card labels. */
export function autosPublicSellerTypeFromLane(lane: AutosClassifiedsLane): AutosPublicSellerType {
  return lane === "negocios" ? "dealer" : "private";
}
