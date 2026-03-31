import { APIError } from "@mux/mux-node";
import { NextResponse } from "next/server";
import { getMuxUploadAndAsset, MuxConfigError } from "@/app/lib/mux/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const uploadId = url.searchParams.get("uploadId")?.trim();
    if (!uploadId) {
      return NextResponse.json(
        { ok: false, errorType: "missing_upload_id", error: "Missing uploadId" },
        { status: 400 }
      );
    }

    const { upload, asset } = await getMuxUploadAndAsset(uploadId);

    const directStatus = upload.status ?? "unknown";
    if (directStatus === "errored" || directStatus === "cancelled" || directStatus === "timed_out") {
      const muxErr = upload.error;
      return NextResponse.json(
        {
          ok: false,
          errorType: "mux_upload_terminal",
          error: muxErr?.message ? `Mux upload ${directStatus}: ${muxErr.message}` : `Mux upload ${directStatus}`,
          muxStatus: directStatus,
          uploadStatus: directStatus,
        },
        { status: 422 }
      );
    }

    const assetStatus = asset?.status;
    if (assetStatus === "errored") {
      return NextResponse.json(
        {
          ok: false,
          errorType: "mux_asset_errored",
          error: "Mux asset errored during processing",
          muxStatus: "errored",
          uploadStatus: directStatus,
        },
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
    if (e instanceof MuxConfigError) {
      return NextResponse.json(
        { ok: false, errorType: "missing_env", error: e.message },
        { status: 503 }
      );
    }
    if (e instanceof APIError) {
      const st = typeof e.status === "number" ? e.status : 0;
      return NextResponse.json(
        {
          ok: false,
          errorType: "mux_status_upstream",
          error: e.message || "Mux status request failed",
          muxHttpStatus: st,
        },
        { status: st >= 400 && st < 600 ? 502 : 500 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        errorType: "mux_status_unknown",
        error: e instanceof Error ? e.message : "Mux status failed",
      },
      { status: 500 }
    );
  }
}
