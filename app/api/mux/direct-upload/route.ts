import { NextResponse } from "next/server";
import { createMuxDirectUpload } from "@/app/lib/mux/server";

type ReqBody = { slot?: number };

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as ReqBody;
    const slot = body.slot === 1 ? 1 : 0;
    const upload = await createMuxDirectUpload();
    return NextResponse.json({
      ok: true,
      slot,
      uploadId: upload.id,
      uploadUrl: upload.url,
      status: "requesting_upload",
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Mux direct upload failed" },
      { status: 500 }
    );
  }
}
