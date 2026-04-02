/**
 * BR agente-individual residencial — Mux integration belongs on publish only (same contract as Autos
 * `app/clasificados/autos/negocios/lib/muxVideoLifecycle.ts`).
 *
 * Draft / preview: no Mux upload; local `videoDataUrl` and URLs are for in-browser preview only.
 * On publish (future): upload file → muxAssetId / playbackId; on unpublish/delete: delete asset.
 *
 * Intentionally no runtime implementation until the publish pipeline exists.
 */
export type BrAgenteResMuxLifecyclePhase = "not_implemented";
