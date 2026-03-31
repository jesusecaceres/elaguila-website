import "server-only";

import Mux from "@mux/mux-node";

export class MuxConfigError extends Error {
  code = "MUX_ENV_MISSING" as const;
}

/**
 * Mux does not support wildcard CORS for browser PUT uploads — the signed URL must be
 * minted for the real page origin. Resolves Origin → Referer → env → dev localhost.
 */
export type MuxCorsResolveResult =
  | { ok: true; corsOrigin: string }
  | { ok: false; message: string };

export function resolveMuxBrowserCorsOrigin(req: Request): MuxCorsResolveResult {
  const origin = req.headers.get("origin")?.trim();
  if (origin && origin !== "null" && !origin.startsWith("file:")) {
    return { ok: true, corsOrigin: origin };
  }
  const referer = req.headers.get("referer")?.trim();
  if (referer) {
    try {
      const u = new URL(referer);
      if (u.protocol === "http:" || u.protocol === "https:") {
        return { ok: true, corsOrigin: u.origin };
      }
    } catch {
      /* ignore */
    }
  }
  for (const raw of [
    process.env.MUX_CORS_ORIGIN?.trim(),
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.trim()}` : "",
  ]) {
    if (!raw) continue;
    try {
      const href = raw.startsWith("http") ? raw : `https://${raw}`;
      return { ok: true, corsOrigin: new URL(href).origin };
    } catch {
      /* ignore */
    }
  }
  if (process.env.NODE_ENV !== "production") {
    return { ok: true, corsOrigin: "http://localhost:3000" };
  }
  return {
    ok: false,
    message:
      "Mux requires a concrete browser origin for CORS (not *). Set MUX_CORS_ORIGIN to your public site origin (e.g. https://leonixmedia.com), or ensure the client sends Origin/Referer.",
  };
}

export function hasMuxEnv() {
  return {
    hasTokenId: Boolean(process.env.MUX_TOKEN_ID),
    hasTokenSecret: Boolean(process.env.MUX_TOKEN_SECRET),
  };
}

function readMuxEnv() {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) {
    throw new MuxConfigError("Missing MUX_TOKEN_ID or MUX_TOKEN_SECRET");
  }
  return { tokenId, tokenSecret };
}

export function createMuxClient() {
  const { tokenId, tokenSecret } = readMuxEnv();
  return new Mux({ tokenId, tokenSecret });
}

export async function createMuxDirectUpload(params: { corsOrigin: string }) {
  const mux = createMuxClient();
  const upload = await mux.video.uploads.create({
    cors_origin: params.corsOrigin,
    new_asset_settings: { playback_policies: ["public"] },
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
