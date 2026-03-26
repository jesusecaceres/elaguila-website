import { NextResponse } from "next/server";
import { createMuxDirectUpload, MuxConfigError } from "@/app/lib/mux/server";

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
    if (e instanceof MuxConfigError) {
      return NextResponse.json(
        {
          ok: false,
          errorType: "missing_env",
          error: "Missing MUX_TOKEN_ID or MUX_TOKEN_SECRET",
        },
        { status: 500 }
      );
    }
    const msg = e instanceof Error ? e.message : "Mux direct upload failed";
    const status = Number((e as { status?: number; statusCode?: number } | undefined)?.status ?? (e as { statusCode?: number } | undefined)?.statusCode ?? 0);
    if (status === 401 || status === 403 || /unauthorized|forbidden|auth/i.test(msg)) {
      return NextResponse.json(
        {
          ok: false,
          errorType: "mux_auth_failure",
          error: msg,
        },
        { status: 502 }
      );
    }
    if (/upload|invalid|unprocessable|response/i.test(msg)) {
      return NextResponse.json(
        {
          ok: false,
          errorType: "mux_bad_response",
          error: msg,
        },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { ok: false, errorType: "mux_unknown_error", error: msg },
      { status: 500 }
    );
  }
}
