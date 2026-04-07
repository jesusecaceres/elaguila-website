/**
 * Future Mux integration (publish pipeline — not used in draft/preview).
 *
 * Draft/preview: never uploads to Mux; local video uses `videoFileDataUrl` for in-browser preview only.
 *
 * On publish (future):
 * 1. If `videoSourceType === "file"`, upload the file to Mux, then set `muxAssetId` + `muxPlaybackId`.
 * 2. If `videoSourceType === "url"` and the URL is already a Mux asset, map IDs accordingly.
 * 3. Persist playback ID for the live listing page.
 *
 * On listing delete / unpublish (future):
 * - Call Mux API to delete `muxAssetId` when the listing is removed.
 *
 * This module is intentionally empty of runtime code until the publish service exists.
 */

export type MuxPublishPlaceholder = {
  readonly phase: "not_implemented";
};
