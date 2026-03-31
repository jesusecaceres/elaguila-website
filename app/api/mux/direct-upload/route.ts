import { APIError } from "@mux/mux-node";
import { NextResponse } from "next/server";
import { createMuxDirectUpload, MuxConfigError, resolveMuxBrowserCorsOrigin } from "@/app/lib/mux/server";

type ReqBody = { slot?: number };

function jsonFromMuxError(e: unknown): { httpStatus: number; body: Record<string, unknown> } {
  if (e instanceof MuxConfigError) {
    return {
      httpStatus: 503,
      body: {
        ok: false,
        errorType: "missing_env",
        error: e.message,
      },
    };
  }
  if (e instanceof APIError) {
    const st = typeof e.status === "number" ? e.status : 0;
    const msg = e.message || "Mux API error";
    if (st === 401 || st === 403) {
      return {
        httpStatus: 502,
        body: { ok: false, errorType: "mux_auth_failure", error: msg, muxHttpStatus: st },
      };
    }
    if (st === 429) {
      return {
        httpStatus: 429,
        body: { ok: false, errorType: "mux_rate_limited", error: msg, muxHttpStatus: st },
      };
    }
    if (st === 402 || /payment|invoice|upgrade|billing|past due/i.test(msg)) {
      return {
        httpStatus: 402,
        body: { ok: false, errorType: "mux_account_billing", error: msg, muxHttpStatus: st },
      };
    }
    if (st >= 400 && st < 500) {
      return {
        httpStatus: 502,
        body: { ok: false, errorType: "mux_bad_request", error: msg, muxHttpStatus: st },
      };
    }
    if (st >= 500) {
      return {
        httpStatus: 502,
        body: { ok: false, errorType: "mux_upstream_error", error: msg, muxHttpStatus: st },
      };
    }
    return {
      httpStatus: 502,
      body: { ok: false, errorType: "mux_bad_response", error: msg, muxHttpStatus: st },
    };
  }
  const msg = e instanceof Error ? e.message : "Mux direct upload failed";
  if (/unauthorized|forbidden|401|403/i.test(msg)) {
    return { httpStatus: 502, body: { ok: false, errorType: "mux_auth_failure", error: msg } };
  }
  return { httpStatus: 500, body: { ok: false, errorType: "mux_unknown_error", error: msg } };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as ReqBody;
    const slot = body.slot === 1 ? 1 : 0;

    const cors = resolveMuxBrowserCorsOrigin(req);
    if (!cors.ok) {
      return NextResponse.json(
        {
          ok: false,
          errorType: "mux_cors_origin_required",
          error: cors.message,
        },
        { status: 400 }
      );
    }

    const upload = await createMuxDirectUpload({ corsOrigin: cors.corsOrigin });
    return NextResponse.json({
      ok: true,
      slot,
      uploadId: upload.id,
      uploadUrl: upload.url,
      status: "requesting_upload",
    });
  } catch (e: unknown) {
    const { httpStatus, body } = jsonFromMuxError(e);
    return NextResponse.json(body, { status: httpStatus });
  }
}
