import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Only target: /magazine/.../magazine.pdf
  const isMagazinePdf =
    pathname.startsWith("/magazine/") && pathname.endsWith("/magazine.pdf");

  if (!isMagazinePdf) return NextResponse.next();

  // If already versioned, allow through
  if (searchParams.has("v")) return NextResponse.next();

  // Version changes on every Vercel deploy
  const version =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    Date.now().toString();

  const url = req.nextUrl.clone();
  url.searchParams.set("v", version);

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/magazine/:path*/magazine.pdf"],
};
