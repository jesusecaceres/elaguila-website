/**
 * Mux integration notes (Autos Phase 4).
 *
 * Draft/preview: local video uses `videoFileDataUrl` / blob only on the device — never persisted as inline bytes.
 *
 * Publish: browser upload via `/api/mux/direct-upload` + status poll — see `uploadAutosDraftVideoFileToMux`,
 * `prepareAutosListingOptionalMuxUpload`, and `AutosPublishConfirmCore`.
 *
 * Unpublish / asset delete: not wired here yet (same gap as some other categories unless admin/service deletes assets).
 */

export {};
