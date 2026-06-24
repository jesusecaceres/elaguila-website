import { NextRequest, NextResponse } from "next/server";

import {
  getPreviewBypassToken,
  isValidPreviewBypassToken,
  LEONIX_PREVIEW_ACCESS_COOKIE,
  LEONIX_PREVIEW_ACCESS_COOKIE_VALUE,
  previewBypassCookieOptions,
  safeInternalNextPath,
} from "@/app/lib/launchLock/previewBypass";

export async function GET(req: NextRequest) {
  if (!getPreviewBypassToken()) {
    return NextResponse.json({ error: "Preview bypass not configured" }, { status: 401 });
  }

  const token = req.nextUrl.searchParams.get("token");
  if (!isValidPreviewBypassToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const next = safeInternalNextPath(req.nextUrl.searchParams.get("next"));
  const res = NextResponse.redirect(new URL(next, req.url));
  res.cookies.set(
    LEONIX_PREVIEW_ACCESS_COOKIE,
    LEONIX_PREVIEW_ACCESS_COOKIE_VALUE,
    previewBypassCookieOptions()
  );
  return res;
}
