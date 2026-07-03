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

  const nextRaw = safeInternalNextPath(req.nextUrl.searchParams.get("next"));
  const lang = req.nextUrl.searchParams.get("lang");
  const nextUrl = new URL(nextRaw, req.url);
  if (lang && !nextUrl.searchParams.has("lang")) {
    nextUrl.searchParams.set("lang", lang);
  }
  const res = NextResponse.redirect(nextUrl);
  res.cookies.set(
    LEONIX_PREVIEW_ACCESS_COOKIE,
    LEONIX_PREVIEW_ACCESS_COOKIE_VALUE,
    previewBypassCookieOptions()
  );
  return res;
}
