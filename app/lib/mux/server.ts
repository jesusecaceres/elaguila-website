import "server-only";

import Mux from "@mux/mux-node";

function readMuxEnv() {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) {
    throw new Error("Missing MUX_TOKEN_ID or MUX_TOKEN_SECRET");
  }
  return { tokenId, tokenSecret };
}

export function createMuxClient() {
  const { tokenId, tokenSecret } = readMuxEnv();
  return new Mux({ tokenId, tokenSecret });
}

export async function createMuxDirectUpload(params: { corsOrigin?: string } = {}) {
  const mux = createMuxClient();
  const upload = await mux.video.uploads.create({
    cors_origin: params.corsOrigin ?? "*",
    new_asset_settings: { playback_policy: ["public"] },
  });
  return upload;
}

export async function getMuxUploadAndAsset(uploadId: string) {
  const mux = createMuxClient();
  const upload = await mux.video.uploads.retrieve(uploadId);
  const assetId = upload.asset_id ?? null;
  if (!assetId) {
    return { upload, asset: null };
  }
  const asset = await mux.video.assets.retrieve(assetId);
  return { upload, asset };
}
