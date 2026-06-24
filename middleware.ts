import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ADMIN_UI_LANG_COOKIE } from "@/app/admin/_lib/adminI18nCookie";
import { hasPreviewBypassCookie } from "@/app/lib/launchLock/previewBypass";
import {
  isAllowedPublicLaunchPath,
  isBypassPath,
  isPublicLaunchLockEnabled,
  resolveComingSoonLockLang,
} from "@/app/lib/launchLock/publicLaunchLock";

const ADMIN_COOKIE = "leonix_admin";

function withAdminPathHeader(res: NextResponse, pathname: string): NextResponse {
  res.headers.set("x-admin-pathname", pathname);
  return res;
}

function handleAdminRequest(req: NextRequest): NextResponse {
  const { pathname, searchParams } = req.nextUrl;
  const lang = searchParams.get("lang");

  if (lang === "es" || lang === "en") {
    const res = NextResponse.next();
    res.cookies.set(ADMIN_UI_LANG_COOKIE, lang, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    return withAdminPathHeader(res, pathname);
  }

  return withAdminPathHeader(NextResponse.next(), pathname);
}

function redirectToComingSoon(req: NextRequest): NextResponse {
  const lang = resolveComingSoonLockLang(req.nextUrl.searchParams);
  const url = req.nextUrl.clone();
  url.pathname = "/coming-soon-v2";
  url.search = "";
  url.searchParams.set("lang", lang);
  return NextResponse.redirect(url);
}

function handleMagazinePdfCacheBust(req: NextRequest): NextResponse | null {
  const { pathname, searchParams } = req.nextUrl;
  const isMagazinePdf = pathname.startsWith("/magazine/") && pathname.endsWith("/magazine.pdf");
  if (!isMagazinePdf) return null;
  if (searchParams.has("v")) return NextResponse.next();

  const version =
    process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || Date.now().toString();
  const url = req.nextUrl.clone();
  url.searchParams.set("v", version);
  return NextResponse.redirect(url);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    return handleAdminRequest(req);
  }

  if (isBypassPath(pathname)) {
    return NextResponse.next();
  }

  const pdfRedirect = handleMagazinePdfCacheBust(req);
  if (pdfRedirect) return pdfRedirect;

  if (!isPublicLaunchLockEnabled()) {
    return NextResponse.next();
  }

  if (req.cookies.get(ADMIN_COOKIE)?.value === "1") {
    return NextResponse.next();
  }

  if (hasPreviewBypassCookie(req.cookies)) {
    return NextResponse.next();
  }

  if (isAllowedPublicLaunchPath(pathname)) {
    return NextResponse.next();
  }

  return redirectToComingSoon(req);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
