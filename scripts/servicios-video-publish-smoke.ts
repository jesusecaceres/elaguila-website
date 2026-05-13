/**
 * Servicios video publish + public gallery pipeline smoke.
 * Run: npx tsx scripts/servicios-video-publish-smoke.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { filterGalleryVideos } from "../app/(site)/servicios/lib/serviciosProfileSanitize";

async function main() {
  const muxPlayback = "AbCdEfGhIj01234";
  const normalized = filterGalleryVideos([
    { id: "v1", url: "", muxPlaybackId: muxPlayback, isPrimary: true },
  ]);
  assert.equal(normalized.length, 1);
  assert.ok(normalized[0]!.url.includes("stream.mux.com"));
  assert.ok(/\.m3u8(\?|$)/i.test(normalized[0]!.url));

  const yt = filterGalleryVideos([
    { id: "v2", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", isPrimary: true },
  ]);
  assert.equal(yt.length, 1);

  const empty = filterGalleryVideos([{ id: "v3", url: "", isPrimary: true }]);
  assert.equal(empty.length, 0);

  const prepare = readFileSync(
    join(__dirname, "../app/(site)/clasificados/publicar/servicios/lib/serviciosDraftPublishPrepare.ts"),
    "utf8",
  );
  assert.ok(prepare.includes("uploadServiciosGalleryVideoFileToMux"), "prepare: mux client upload path");

  const pub = readFileSync(join(__dirname, "../app/api/clasificados/servicios/publish/route.ts"), "utf8");
  assert.ok(pub.includes("videoPublishDiagnostics"), "publish: accepts diagnostics");
  assert.ok(pub.includes("serviciosVideoPublishNotes"), "publish: persists ops notes");

  const tile = readFileSync(join(__dirname, "../app/(site)/servicios/components/ServiciosGalleryVideoTile.tsx"), "utf8");
  assert.ok(tile.includes("hls.js"), "gallery tile: HLS playback path");

  const mapDraft = readFileSync(
    join(__dirname, "../app/(site)/servicios/lib/mapServiciosApplicationDraftToBusinessProfile.ts"),
    "utf8",
  );
  assert.ok(mapDraft.includes("muxPlaybackId"), "draft→wire: mux fields mapped");

  const tabs = readFileSync(join(__dirname, "../app/(site)/servicios/components/ServiciosGalleryWithTabs.tsx"), "utf8");
  assert.ok(tabs.includes("ServiciosGalleryVideoTile"), "profile gallery: mux-aware tile");

  console.log("servicios-video-publish-smoke: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
