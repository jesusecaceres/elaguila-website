import type { AutoDealerListing } from "../types/autoDealerListing";

/**
 * Draft/preview must never carry publish-time Mux IDs or accidental upload state.
 * Strips mux fields on load/save so local draft preview never "activates" Mux assets.
 */
export function stripDraftMuxFields(listing: AutoDealerListing): AutoDealerListing {
  return {
    ...listing,
    muxAssetId: undefined,
    muxPlaybackId: undefined,
  };
}
