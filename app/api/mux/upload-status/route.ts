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

    const directStatus = upload.status ?? "unknown";
    if (directStatus === "errored" || directStatus === "cancelled" || directStatus === "timed_out") {
      return NextResponse.json(
        { ok: false, error: `Mux upload ${directStatus}`, muxStatus: directStatus, uploadStatus: directStatus },
        { status: 422 }
      );
    }

    const assetStatus = asset?.status;
    if (assetStatus === "errored") {
      return NextResponse.json(
        { ok: false, error: "Mux asset errored", muxStatus: "errored", uploadStatus: directStatus },
        { status: 422 }
      );
    }

    const playbackId = asset?.playback_ids?.[0]?.id ?? "";
    const thumb = playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : "";
    const playbackUrl = playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : "";

    return NextResponse.json({
      ok: true,
      uploadId,
      uploadStatus: directStatus,
      assetId: asset?.id ?? upload.asset_id ?? "",
      playbackId,
      muxStatus: assetStatus ?? "preparing",
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
