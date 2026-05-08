import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ADMIN_UI_LANG_COOKIE } from "@/app/admin/_lib/adminI18nCookie";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const lang = searchParams.get("lang");
    if (lang === "es" || lang === "en") {
      const res = NextResponse.next();
      res.cookies.set(ADMIN_UI_LANG_COOKIE, lang, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
      return res;
    }
    return NextResponse.next();
  }

  const isMagazinePdf = pathname.startsWith("/magazine/") && pathname.endsWith("/magazine.pdf");
  if (!isMagazinePdf) return NextResponse.next();
  if (searchParams.has("v")) return NextResponse.next();

  const version =
    process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || Date.now().toString();
  const url = req.nextUrl.clone();
  url.searchParams.set("v", version);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/magazine/:path*/magazine.pdf", "/admin/:path*"],
};
