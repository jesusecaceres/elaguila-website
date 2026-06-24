import { NextRequest, NextResponse } from "next/server";

import { LEONIX_PREVIEW_ACCESS_COOKIE } from "@/app/lib/launchLock/previewBypass";

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set(LEONIX_PREVIEW_ACCESS_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
