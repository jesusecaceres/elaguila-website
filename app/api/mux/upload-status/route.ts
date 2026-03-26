import { NextResponse } from "next/server";
import { getMuxUploadAndAsset } from "@/app/lib/mux/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const uploadId = url.searchParams.get("uploadId")?.trim();
    if (!uploadId) {
      return NextResponse.json({ ok: false, error: "Missing uploadId" }, { status: 400 });
    }

    const { upload, asset } = await getMuxUploadAndAsset(uploadId);
    const playbackId = asset?.playback_ids?.[0]?.id ?? "";
    const thumb = playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : "";
    const playbackUrl = playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : "";

    return NextResponse.json({
      ok: true,
      uploadId,
      uploadStatus: upload.status ?? "unknown",
      assetId: asset?.id ?? upload.asset_id ?? "",
      playbackId,
      muxStatus: asset?.status ?? "preparing",
      thumbnailUrl: thumb,
      playbackUrl,
      durationSeconds: typeof asset?.duration === "number" ? asset.duration : null,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Mux status failed" },
      { status: 500 }
    );
  }
}
